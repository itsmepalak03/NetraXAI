from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    diabetes_duration = Column(Float, default=0)
    hba1c = Column(Float, nullable=True)
    previous_dr_status = Column(String, default="Unknown")
    previous_screening_date = Column(String, nullable=True)
    screening_centre = Column(String, default="Rural Screening Centre - Demo")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    screenings = relationship("Screening", back_populates="patient", cascade="all, delete-orphan")


class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)

    image_path = Column(String, nullable=True)
    enhanced_path = Column(String, nullable=True)
    image_width = Column(Integer, nullable=True)
    image_height = Column(Integer, nullable=True)
    file_size_kb = Column(Float, nullable=True)

    quality_score = Column(Float, nullable=True)
    quality_status = Column(String, nullable=True)  # GRADEABLE / BORDERLINE / UNGRADEABLE
    quality_metrics = Column(JSON, nullable=True)

    status = Column(String, default="registered")
    # registered -> uploaded -> quality_checked -> analyzed -> reviewed -> reported

    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="screenings")
    ai_result = relationship("AIResult", back_populates="screening", uselist=False, cascade="all, delete-orphan")
    doctor_review = relationship("DoctorReview", back_populates="screening", uselist=False, cascade="all, delete-orphan")


class AIResult(Base):
    __tablename__ = "ai_results"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), unique=True, nullable=False)

    ai_mode = Column(String, default="demo")  # demo / real
    dr_level = Column(Integer, nullable=False)
    severity_label = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    referable = Column(Boolean, default=False)

    findings = Column(JSON, nullable=True)  # list of lesion dicts
    probability_distribution = Column(JSON, nullable=True)  # per-level probabilities
    heatmap_path = Column(String, nullable=True)
    overlay_path = Column(String, nullable=True)
    evidence = Column(JSON, nullable=True)  # ranked evidence regions for XAI

    processing_time_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    screening = relationship("Screening", back_populates="ai_result")


class DoctorReview(Base):
    __tablename__ = "doctor_reviews"

    id = Column(Integer, primary_key=True, index=True)
    screening_id = Column(Integer, ForeignKey("screenings.id"), unique=True, nullable=False)

    decision = Column(String, nullable=False)
    # confirmed / modified / recapture_requested / ungradeable / referred

    doctor_assessment_level = Column(Integer, nullable=True)
    final_level = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    referral = Column(Boolean, default=False)
    doctor_name = Column(String, default="Dr. Demo Reviewer")
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    screening = relationship("Screening", back_populates="doctor_review")
