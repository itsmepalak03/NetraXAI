from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
import random

from app.database import get_db
from app.models.models import Patient
from app.schemas.schemas import PatientCreate, PatientOut

router = APIRouter(prefix="/api/patients", tags=["Patients"])


def _generate_patient_code(db: Session) -> str:
    year = 2026
    for _ in range(20):
        code = f"DR-{year}-{random.randint(10000, 99999)}"
        if not db.query(Patient).filter(Patient.patient_code == code).first():
            return code
    raise RuntimeError("Could not generate a unique patient code")


@router.post("", response_model=PatientOut, status_code=201)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    code = payload.patient_code or _generate_patient_code(db)
    if db.query(Patient).filter(Patient.patient_code == code).first():
        raise HTTPException(status_code=409, detail="Patient code already exists")

    patient = Patient(
        patient_code=code,
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        diabetes_duration=payload.diabetes_duration,
        hba1c=payload.hba1c,
        previous_dr_status=payload.previous_dr_status,
        previous_screening_date=payload.previous_screening_date,
        screening_centre=payload.screening_centre,
        is_demo=payload.is_demo,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=list[PatientOut])
def list_patients(db: Session = Depends(get_db)):
    return db.query(Patient).order_by(desc(Patient.created_at)).all()


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
