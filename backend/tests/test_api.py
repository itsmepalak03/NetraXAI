"""
NETRA XAI backend test suite.
Run with: pytest -v  (from the backend/ directory)
"""
import io
import os
import sys
import numpy as np
import cv2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_netra.db")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _make_test_image_bytes():
    img = np.zeros((400, 400, 3), dtype=np.uint8)
    cv2.circle(img, (200, 200), 180, (40, 70, 150), -1)
    ok, buf = cv2.imencode(".jpg", img)
    return io.BytesIO(buf.tobytes())


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_patient():
    r = client.post("/api/patients", json={
        "name": "Test Patient", "age": 50, "gender": "Female",
        "diabetes_duration": 5, "hba1c": 7.1, "is_demo": True
    })
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Test Patient"
    assert body["patient_code"].startswith("DR-")


def test_list_patients():
    r = client.get("/api/patients")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_screening_workflow():
    p = client.post("/api/patients", json={"name": "Flow Patient", "age": 60, "gender": "Male"}).json()
    s = client.post("/api/screenings", json={"patient_id": p["id"]}).json()
    assert s["status"] == "registered"

    files = {"file": ("test.jpg", _make_test_image_bytes(), "image/jpeg")}
    up = client.post(f"/api/screenings/{s['id']}/upload", files=files).json()
    assert up["quality_status"] in ("GRADEABLE", "BORDERLINE", "UNGRADEABLE")
    assert up["image_width"] == 400

    q = client.get(f"/api/screenings/{s['id']}/quality").json()
    assert "quality_score" in q

    if up["quality_status"] != "UNGRADEABLE":
        analyzed = client.post(f"/api/screenings/{s['id']}/analyze").json()
        assert analyzed["ai_result"]["dr_level"] in range(5)

        lesions = client.get(f"/api/screenings/{s['id']}/lesions").json()
        assert "findings" in lesions

        xai = client.get(f"/api/screenings/{s['id']}/explainability").json()
        assert "evidence" in xai

        review = client.post(f"/api/screenings/{s['id']}/review", json={
            "decision": "confirmed", "notes": "test", "referral": False
        }).json()
        assert review["doctor_review"]["decision"] == "confirmed"


def test_image_validation_rejects_bad_extension():
    p = client.post("/api/patients", json={"name": "Bad File Patient", "age": 40, "gender": "Male"}).json()
    s = client.post("/api/screenings", json={"patient_id": p["id"]}).json()
    files = {"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
    r = client.post(f"/api/screenings/{s['id']}/upload", files=files)
    assert r.status_code == 400


def test_analytics_endpoint():
    r = client.get("/api/analytics")
    assert r.status_code == 200
    assert "total_screenings" in r.json()


def test_simulation_endpoint():
    payload = {
        "patients_per_day": 350, "num_centres": 1, "num_doctors": 5,
        "bandwidth_mbps": 10, "image_size_mb": 2.5, "ai_processing_sec": 3,
        "doctor_review_sec": 30, "working_days": 299,
        "target_annual_patients": 100000, "ai_assisted": True
    }
    r = client.post("/api/simulation", json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body["state"] in ("UNDER CAPACITY", "OPTIMAL", "OVERLOADED")
    assert body["daily_capacity"] > 0


def test_simulation_manual_vs_ai_assisted_differs():
    base = {
        "patients_per_day": 350, "num_centres": 1, "num_doctors": 5,
        "bandwidth_mbps": 10, "image_size_mb": 2.5, "ai_processing_sec": 3,
        "doctor_review_sec": 30, "working_days": 299,
        "target_annual_patients": 100000,
    }
    ai_on = client.post("/api/simulation", json={**base, "ai_assisted": True}).json()
    ai_off = client.post("/api/simulation", json={**base, "ai_assisted": False}).json()
    assert ai_on["daily_capacity"] >= ai_off["daily_capacity"]
