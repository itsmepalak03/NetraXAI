from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ---------- Patient ----------
class PatientCreate(BaseModel):
    patient_code: Optional[str] = None
    name: str
    age: int
    gender: str
    diabetes_duration: float = 0
    hba1c: Optional[float] = None
    previous_dr_status: str = "Unknown"
    previous_screening_date: Optional[str] = None
    screening_centre: str = "Rural Screening Centre - Demo"
    is_demo: bool = False


class PatientOut(BaseModel):
    id: int
    patient_code: str
    name: str
    age: int
    gender: str
    diabetes_duration: float
    hba1c: Optional[float]
    previous_dr_status: str
    previous_screening_date: Optional[str]
    screening_centre: str
    is_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Screening ----------
class ScreeningCreate(BaseModel):
    patient_id: int


class ScreeningOut(BaseModel):
    id: int
    patient_id: int
    image_path: Optional[str]
    enhanced_path: Optional[str]
    image_width: Optional[int]
    image_height: Optional[int]
    file_size_kb: Optional[float]
    quality_score: Optional[float]
    quality_status: Optional[str]
    quality_metrics: Optional[Dict[str, Any]]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AIResultOut(BaseModel):
    id: int
    screening_id: int
    ai_mode: str
    dr_level: int
    severity_label: str
    confidence: float
    referable: bool
    findings: Optional[List[Dict[str, Any]]]
    probability_distribution: Optional[Dict[str, float]]
    heatmap_path: Optional[str]
    overlay_path: Optional[str]
    evidence: Optional[List[Dict[str, Any]]]
    processing_time_ms: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class DoctorReviewCreate(BaseModel):
    decision: str  # confirmed / modified / recapture_requested / ungradeable / referred
    doctor_assessment_level: Optional[int] = None
    notes: Optional[str] = None
    referral: bool = False
    doctor_name: str = "Dr. Demo Reviewer"


class DoctorReviewOut(BaseModel):
    id: int
    screening_id: int
    decision: str
    doctor_assessment_level: Optional[int]
    final_level: Optional[int]
    notes: Optional[str]
    referral: bool
    doctor_name: str
    reviewed_at: datetime

    class Config:
        from_attributes = True


class SimulationInput(BaseModel):
    patients_per_day: float = Field(default=350)
    num_centres: int = Field(default=1)
    num_doctors: int = Field(default=5)
    bandwidth_mbps: float = Field(default=10)
    image_size_mb: float = Field(default=2.5)
    ai_processing_sec: float = Field(default=3)
    doctor_review_sec: float = Field(default=30)
    working_days: int = Field(default=299)
    target_annual_patients: float = Field(default=100000)
    ai_assisted: bool = True
