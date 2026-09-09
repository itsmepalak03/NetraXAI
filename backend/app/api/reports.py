import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import Screening
from app.config import RESULT_PATH
from app.reports.pdf_generator import build_report_pdf

router = APIRouter(prefix="/api/screenings", tags=["Reports"])


@router.get("/{screening_id}/report")
def get_report(screening_id: int, db: Session = Depends(get_db)):
    screening = (db.query(Screening)
                 .options(joinedload(Screening.patient), joinedload(Screening.ai_result), joinedload(Screening.doctor_review))
                 .filter(Screening.id == screening_id).first())
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    if not screening.ai_result:
        raise HTTPException(status_code=400, detail="Run AI analysis before generating a report")

    patient = screening.patient
    report_id = f"NXAI-{screening_id:06d}"
    out_path = str(RESULT_PATH / f"report_{screening_id}.pdf")

    patient_dict = {
        "patient_code": patient.patient_code, "name": patient.name, "age": patient.age,
        "gender": patient.gender, "diabetes_duration": patient.diabetes_duration,
        "hba1c": patient.hba1c, "screening_centre": patient.screening_centre,
        "previous_dr_status": patient.previous_dr_status,
    }
    screening_dict = {
        "quality_score": screening.quality_score, "quality_status": screening.quality_status,
        "quality_metrics": screening.quality_metrics,
    }
    ai_dict = {
        "severity_label": screening.ai_result.severity_label, "dr_level": screening.ai_result.dr_level,
        "confidence": screening.ai_result.confidence, "referable": screening.ai_result.referable,
        "processing_time_ms": screening.ai_result.processing_time_ms, "ai_mode": screening.ai_result.ai_mode,
        "findings": screening.ai_result.findings, "overlay_path": screening.ai_result.overlay_path,
    }
    review_dict = None
    if screening.doctor_review:
        rv = screening.doctor_review
        review_dict = {
            "decision": rv.decision, "doctor_assessment_level": rv.doctor_assessment_level,
            "final_level": rv.final_level, "referral": rv.referral, "doctor_name": rv.doctor_name,
            "reviewed_at": rv.reviewed_at.isoformat(), "notes": rv.notes,
        }

    build_report_pdf(out_path, patient_dict, screening_dict, ai_dict, review_dict, report_id)
    screening.status = "reported"
    db.commit()

    return FileResponse(out_path, media_type="application/pdf",
                         filename=f"NETRA_XAI_Report_{patient.patient_code}.pdf")
