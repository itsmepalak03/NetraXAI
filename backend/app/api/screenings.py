import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.database import get_db
from app.models.models import Patient, Screening, AIResult, DoctorReview
from app.schemas.schemas import ScreeningCreate, DoctorReviewCreate
from app.config import settings, UPLOAD_PATH, RESULT_PATH, DR_LEVELS
from app.image_processing.processing import (
    validate_image, get_dimensions_and_size, assess_quality, enhance_image
)
from app.ai.inference import predict

router = APIRouter(prefix="/api/screenings", tags=["Screenings"])

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


def _screening_to_dict(s: Screening) -> dict:
    return {
        "id": s.id,
        "patient_id": s.patient_id,
        "patient": {
            "id": s.patient.id, "patient_code": s.patient.patient_code, "name": s.patient.name,
            "age": s.patient.age, "gender": s.patient.gender,
            "diabetes_duration": s.patient.diabetes_duration, "hba1c": s.patient.hba1c,
            "screening_centre": s.patient.screening_centre,
            "previous_dr_status": s.patient.previous_dr_status,
            "is_demo": s.patient.is_demo,
        } if s.patient else None,
        "image_path": f"/uploads/{os.path.basename(s.image_path)}" if s.image_path else None,
        "enhanced_path": f"/results/{os.path.basename(s.enhanced_path)}" if s.enhanced_path else None,
        "image_width": s.image_width,
        "image_height": s.image_height,
        "file_size_kb": s.file_size_kb,
        "quality_score": s.quality_score,
        "quality_status": s.quality_status,
        "quality_metrics": s.quality_metrics,
        "status": s.status,
        "created_at": s.created_at.isoformat(),
        "ai_result": _ai_result_to_dict(s.ai_result) if s.ai_result else None,
        "doctor_review": _review_to_dict(s.doctor_review) if s.doctor_review else None,
    }


def _ai_result_to_dict(r: AIResult) -> dict:
    return {
        "id": r.id,
        "ai_mode": r.ai_mode,
        "dr_level": r.dr_level,
        "severity_label": r.severity_label,
        "confidence": r.confidence,
        "referable": r.referable,
        "findings": r.findings,
        "probability_distribution": r.probability_distribution,
        "heatmap_path": f"/results/{os.path.basename(r.heatmap_path)}" if r.heatmap_path else None,
        "overlay_path": f"/results/{os.path.basename(r.overlay_path)}" if r.overlay_path else None,
        "evidence": r.evidence,
        "processing_time_ms": r.processing_time_ms,
        "created_at": r.created_at.isoformat(),
    }


def _review_to_dict(rv: DoctorReview) -> dict:
    return {
        "id": rv.id,
        "decision": rv.decision,
        "doctor_assessment_level": rv.doctor_assessment_level,
        "final_level": rv.final_level,
        "notes": rv.notes,
        "referral": rv.referral,
        "doctor_name": rv.doctor_name,
        "reviewed_at": rv.reviewed_at.isoformat(),
    }


def _get_screening_or_404(db: Session, screening_id: int) -> Screening:
    s = (db.query(Screening)
         .options(joinedload(Screening.patient), joinedload(Screening.ai_result), joinedload(Screening.doctor_review))
         .filter(Screening.id == screening_id).first())
    if not s:
        raise HTTPException(status_code=404, detail="Screening not found")
    return s


@router.post("", status_code=201)
def create_screening(payload: ScreeningCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    screening = Screening(patient_id=patient.id, status="registered")
    db.add(screening)
    db.commit()
    db.refresh(screening)
    return _screening_to_dict(_get_screening_or_404(db, screening.id))


@router.get("")
def list_screenings(db: Session = Depends(get_db)):
    rows = (db.query(Screening)
            .options(joinedload(Screening.patient), joinedload(Screening.ai_result), joinedload(Screening.doctor_review))
            .order_by(desc(Screening.created_at)).limit(200).all())
    return [_screening_to_dict(s) for s in rows]


@router.get("/{screening_id}")
def get_screening(screening_id: int, db: Session = Depends(get_db)):
    return _screening_to_dict(_get_screening_or_404(db, screening_id))


@router.post("/{screening_id}/upload")
async def upload_image(screening_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    screening = _get_screening_or_404(db, screening_id)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXT)}")

    fname = f"screening_{screening_id}_{uuid.uuid4().hex[:8]}{ext}"
    fpath = str(UPLOAD_PATH / fname)
    with open(fpath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    validation = validate_image(fpath)
    if not validation["valid"]:
        os.remove(fpath)
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image: {validation.get('error')}")

    width, height, size_kb = get_dimensions_and_size(fpath)
    quality = assess_quality(fpath)

    # Auto-enhance and store alongside
    enhanced_name = f"enhanced_{fname}"
    enhanced_path = str(RESULT_PATH / enhanced_name)
    enhance_image(fpath, enhanced_path)

    screening.image_path = fpath
    screening.enhanced_path = enhanced_path
    screening.image_width = width
    screening.image_height = height
    screening.file_size_kb = size_kb
    screening.quality_score = quality["overall"]
    screening.quality_status = quality["status"]
    screening.quality_metrics = quality
    screening.status = "quality_checked"

    db.commit()
    db.refresh(screening)
    return _screening_to_dict(_get_screening_or_404(db, screening_id))


@router.get("/{screening_id}/quality")
def get_quality(screening_id: int, db: Session = Depends(get_db)):
    screening = _get_screening_or_404(db, screening_id)
    if not screening.quality_metrics:
        raise HTTPException(status_code=400, detail="No image uploaded yet for this screening")
    return {
        "quality_score": screening.quality_score,
        "quality_status": screening.quality_status,
        "metrics": screening.quality_metrics,
    }


@router.post("/{screening_id}/analyze")
def analyze_screening(screening_id: int, db: Session = Depends(get_db)):
    screening = _get_screening_or_404(db, screening_id)
    if not screening.image_path:
        raise HTTPException(status_code=400, detail="Upload a fundus image before running analysis")
    if screening.quality_status == "UNGRADEABLE":
        raise HTTPException(status_code=422, detail="Image marked UNGRADEABLE - recapture recommended before analysis")

    prefix = f"screening_{screening_id}"
    try:
        result = predict(screening.image_path, screening.quality_score or 70, str(RESULT_PATH), prefix)
    except NotImplementedError:
        # Safe fallback: AI_MODE=real not fully wired -> demo engine
        from app.ai.inference import _run_demo_engine
        result = _run_demo_engine(screening.image_path, screening.quality_score or 70, str(RESULT_PATH), prefix)
        result["ai_mode"] = "demo (real-model fallback)"

    existing = db.query(AIResult).filter(AIResult.screening_id == screening_id).first()
    if existing:
        db.delete(existing)
        db.flush()

    ai_result = AIResult(
        screening_id=screening_id,
        ai_mode=result["ai_mode"],
        dr_level=result["dr_level"],
        severity_label=result["severity_label"],
        confidence=result["confidence"],
        referable=result["referable"],
        findings=result["findings"],
        probability_distribution=result["probability_distribution"],
        heatmap_path=result["heatmap_path"],
        overlay_path=result["overlay_path"],
        evidence=result["evidence"],
        processing_time_ms=result["processing_time_ms"],
    )
    db.add(ai_result)
    screening.status = "analyzed"
    db.commit()

    return _screening_to_dict(_get_screening_or_404(db, screening_id))


@router.get("/{screening_id}/lesions")
def get_lesions(screening_id: int, db: Session = Depends(get_db)):
    screening = _get_screening_or_404(db, screening_id)
    if not screening.ai_result:
        raise HTTPException(status_code=400, detail="Run AI analysis first")
    return {"findings": screening.ai_result.findings, "dr_level": screening.ai_result.dr_level}


@router.get("/{screening_id}/explainability")
def get_explainability(screening_id: int, db: Session = Depends(get_db)):
    screening = _get_screening_or_404(db, screening_id)
    if not screening.ai_result:
        raise HTTPException(status_code=400, detail="Run AI analysis first")
    r = screening.ai_result
    return {
        "ai_mode": r.ai_mode,
        "dr_level": r.dr_level,
        "severity_label": r.severity_label,
        "confidence": r.confidence,
        "original_image": f"/uploads/{os.path.basename(screening.image_path)}",
        "heatmap": f"/results/{os.path.basename(r.heatmap_path)}" if r.heatmap_path else None,
        "overlay": f"/results/{os.path.basename(r.overlay_path)}" if r.overlay_path else None,
        "evidence": r.evidence,
        "explanation_chain": [
            "Retinal Image", "AI Attention", "Suspicious Region",
            "Lesion Evidence", "DR Severity", "Recommendation",
        ],
        "disclaimer": "Prototype/demo explainability visualization built from classical "
                       "image-processing lesion candidates, not a gradient-based Grad-CAM "
                       "from a trained clinical model.",
    }


@router.post("/{screening_id}/review")
def submit_review(screening_id: int, payload: DoctorReviewCreate, db: Session = Depends(get_db)):
    screening = _get_screening_or_404(db, screening_id)
    if not screening.ai_result:
        raise HTTPException(status_code=400, detail="Run AI analysis before doctor review")

    final_level = (payload.doctor_assessment_level
                   if payload.decision == "modified" and payload.doctor_assessment_level is not None
                   else screening.ai_result.dr_level)

    existing = db.query(DoctorReview).filter(DoctorReview.screening_id == screening_id).first()
    if existing:
        db.delete(existing)
        db.flush()

    review = DoctorReview(
        screening_id=screening_id,
        decision=payload.decision,
        doctor_assessment_level=payload.doctor_assessment_level,
        final_level=final_level,
        notes=payload.notes,
        referral=payload.referral or (final_level is not None and final_level >= 2),
        doctor_name=payload.doctor_name,
    )
    db.add(review)
    screening.status = "reviewed"
    db.commit()

    return _screening_to_dict(_get_screening_or_404(db, screening_id))
