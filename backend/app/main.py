from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings, UPLOAD_PATH, RESULT_PATH
from app.database import Base, engine
from app.models import models  # noqa: F401 (ensures models are registered)
from app.api import patients, screenings, analytics, simulation, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NETRA XAI API",
    description="Explainable AI for Diabetic Retinopathy Screening — backend service.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_PATH)), name="uploads")
app.mount("/results", StaticFiles(directory=str(RESULT_PATH)), name="results")

app.include_router(patients.router)
app.include_router(screenings.router)
app.include_router(analytics.router)
app.include_router(simulation.router)
app.include_router(reports.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "NETRA XAI API",
        "ai_mode": settings.AI_MODE,
        "version": "1.0.0",
    }


@app.get("/")
def root():
    return {"message": "NETRA XAI backend is running. See /docs for the API reference."}
