# NETRA XAI
### Explainable AI for Diabetic Retinopathy Screening in Rural India

> "See the disease. Understand the AI. Support the doctor."

NETRA XAI is a full-stack **prototype** healthcare AI product: a React frontend and a
FastAPI backend that together simulate an explainable-AI-assisted diabetic retinopathy (DR)
screening workflow, from patient registration through AI analysis, Grad-CAM-style
explainability, doctor review, PDF reporting, analytics, and a rural screening capacity
simulator.

**This is a research/demo prototype, not a certified medical device.** See
[Medical Disclaimer](#medical-disclaimer).

---

## 1. Problem Statement

Diabetic Retinopathy is a leading cause of preventable blindness in people with diabetes.
Large-scale screening in rural India faces: limited ophthalmologist availability, large
patient volumes, long queues, variable-quality fundus photography, poor connectivity, and a
general lack of transparency in AI-assisted tools. NETRA XAI demonstrates how an
**explainable** AI layer — one that shows *why* it reached a conclusion — can support (not
replace) a human doctor across this workflow.

## 2. Features

- Patient registration (multi-step form) and patient history timeline
- Fundus image upload with drag-and-drop, quality assessment (focus, illumination, field of
  view, contrast, noise) computed with real OpenCV analysis of the uploaded pixels
- Image enhancement (CLAHE, illumination normalization, denoising, contrast boost) with a
  before/after comparison slider
- Retinal analysis workstation with togglable layers and clickable lesion markers
- Lesion detection cards (microaneurysms, haemorrhages, exudates, cotton-wool spots)
- 5-level DR severity classification (0–4) with an animated severity scale and referable-DR flag
- **Explainable AI page**: three-panel view (original / heatmap / overlay), an evidence list,
  and an explanation chain from image → attention → lesion evidence → severity → recommendation
- Doctor review workflow: confirm / modify / request recapture / mark ungradeable / refer,
  with a clinical notes field and an AI-vs-doctor-vs-final decision comparison
- PDF report generation (ReportLab) with a downloadable clinical document
- Healthcare analytics dashboard (screening volume, DR distribution, quality distribution,
  confidence distribution, review completion rate, centre performance)
- Rural Screening Capacity Simulator — a "mission control" style page with live sliders for
  patients/day, centres, doctors, bandwidth, image size, AI/doctor processing time, and working
  days, computing daily/monthly/annual capacity, queueing, utilization, bottleneck detection,
  and a Manual-vs-AI-Assisted comparison, **all calculated dynamically from the inputs**
- Distinct color themes per module (see [Design System](#design-system))

## 3. Architecture

```
Browser (React + Vite)  ──HTTP/JSON──►  FastAPI backend  ──►  SQLite (netra.db)
                                             │
                                             ├─ Image processing (OpenCV/Pillow)
                                             ├─ Demo AI engine (classical CV lesion detector)
                                             ├─ Explainability (heatmap/overlay generator)
                                             └─ PDF report generator (ReportLab)
```

The frontend and backend are fully decoupled and communicate only over the REST API described
below; Vite's dev server proxies `/api`, `/uploads`, and `/results` to the backend so no CORS
configuration is needed in local development.

## 4. Tech Stack

**Frontend:** React 18, Vite, React Router, Axios, Tailwind CSS, Framer Motion, Recharts,
Lucide React.

**Backend:** Python, FastAPI, Uvicorn, Pydantic, SQLAlchemy, SQLite.

**AI / Image Processing:** OpenCV, NumPy, Pillow, scikit-learn (available for future model
evaluation), ReportLab (PDF).

## 5. Folder Structure

```
NETRA-XAI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, routers, static file mounts
│   │   ├── config.py            # Settings, AI_MODE switch, DR level definitions
│   │   ├── database.py          # SQLAlchemy engine/session
│   │   ├── api/                 # patients, screenings, analytics, simulation, reports
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/             # analytics_service, simulation_service
│   │   ├── ai/                   # preprocessing, lesion_detector, postprocessing,
│   │   │                         # explainability, inference (demo/real switch)
│   │   ├── image_processing/     # quality assessment + enhancement (OpenCV)
│   │   └── reports/               # ReportLab PDF generator
│   ├── uploads/                   # uploaded fundus images (gitignored contents)
│   ├── results/                   # enhanced images, heatmaps, overlays, PDFs
│   ├── tests/test_api.py          # pytest suite (8 tests)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Landing, Dashboard, PatientRegistration, Screening,
│   │   │                          # XAI, DoctorReview, Report, PatientHistory, Analytics,
│   │   │                          # RuralSimulator, Settings, PatientsList
│   │   ├── components/            # Sidebar, Header, StatCard, StatusBadge, SeverityScale,
│   │   │                          # ConfidenceMeter, LoadingScreen, Toast
│   │   ├── layouts/DashboardLayout.jsx
│   │   └── services/api.js        # Axios API client
│   ├── tailwind.config.js         # per-module color tokens
│   └── package.json
├── .env.example
└── README.md
```

## 6. Installation

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup

```bash
cd backend
python -m venv venv

# Activate:
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate            # Windows PowerShell

pip install -r requirements.txt
cp ../.env.example .env          # or copy manually on Windows
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000` (interactive docs at `/docs`).

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://127.0.0.1:5173` and will proxy API calls to the backend
automatically (see `vite.config.js`).

### Database

SQLite is used with zero configuration — `netra.db` is created automatically in `backend/`
on first run via `Base.metadata.create_all()`. No migrations are required for this prototype.

## 7. AI Model Setup

### Demo Mode (default, no trained model required)

`AI_MODE=demo` in `.env`. The **Demo AI Engine** (`backend/app/ai/`) uses classical computer
vision (morphological black-hat/top-hat filtering on the green channel of the actual uploaded
image) to detect lesion candidates, then grades DR severity with a deterministic, reproducible
heuristic. **The same image always produces the same result.** This is clearly labeled
"DEMO AI ENGINE" throughout the UI and in generated PDF reports, and its confidence score is
explicitly described as uncalibrated.

### Real Model Mode

`AI_MODE=real` + `MODEL_PATH=models/dr_classifier/model.pth` in `.env`. The codebase is
structured so a trained PyTorch classifier can be substituted without changing the API
contract (see the docstring in `backend/app/ai/inference.py`). A reference (non-executed)
Grad-CAM implementation against a trained CNN is included in
`backend/app/ai/explainability.py` for when a real checkpoint is available. **No trained
checkpoint ships with this prototype** — if `AI_MODE=real` is set but no usable model is
found, the backend safely falls back to the demo engine.

**Recommended backbone:** EfficientNet-B0. For a single-image, resource-constrained rural
screening use case it offers the best accuracy-per-FLOP of the common options
(ResNet-50 / DenseNet-121 / EfficientNet-B0), runs on CPU-only edge hardware, and has strong
transfer-learning results on public DR datasets (APTOS 2019, EyePACS).

### Dataset Setup (for training a real model, not included)

If you wish to train a real classifier: download the public **APTOS 2019 Blindness
Detection** or **EyePACS Diabetic Retinopathy Detection** datasets (Kaggle), map their
0–4 labels onto the levels in `backend/app/config.py:DR_LEVELS`, fine-tune an
ImageNet-pretrained EfficientNet-B0, and export the weights to `models/dr_classifier/model.pth`.

## 8. API Documentation

Interactive Swagger docs are auto-generated at `http://127.0.0.1:8000/docs`. Summary:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Service health + current AI mode |
| POST | `/api/patients` | Register a patient |
| GET | `/api/patients` | List patients |
| GET | `/api/patients/{id}` | Get one patient |
| POST | `/api/screenings` | Create a screening for a patient |
| GET | `/api/screenings` | List recent screenings |
| GET | `/api/screenings/{id}` | Get full screening detail |
| POST | `/api/screenings/{id}/upload` | Upload fundus image (multipart) → runs quality + enhancement |
| GET | `/api/screenings/{id}/quality` | Get quality metrics |
| POST | `/api/screenings/{id}/analyze` | Run the AI engine |
| GET | `/api/screenings/{id}/lesions` | Get lesion findings |
| GET | `/api/screenings/{id}/explainability` | Get XAI panels/evidence |
| POST | `/api/screenings/{id}/review` | Submit doctor review |
| GET | `/api/screenings/{id}/report` | Generate & download PDF report |
| GET | `/api/analytics` | Aggregate analytics |
| POST | `/api/simulation` | Run rural capacity simulation |

## 9. Explainable AI (XAI)

The signature feature of NETRA XAI. Every AI prediction is accompanied by:
1. The original retinal image
2. A heatmap ("Grad-CAM (Prototype)")
3. An attention overlay
4. A ranked evidence list (lesion type, location, contribution level)
5. A visual explanation chain: **Retinal Image → AI Attention → Suspicious Region → Lesion
   Evidence → DR Severity → Recommendation**

**Important:** in Demo Mode this heatmap is built from the coordinates of classical-CV lesion
candidates (Gaussian "attention" placed at each detected blob), **not** a gradient-based
Grad-CAM from a trained neural network. This is disclosed on the XAI page itself
(`disclaimer` field returned by the API) and is not represented as clinically validated.

## 10. Rural Screening Simulator

All outputs (daily/monthly/annual capacity, queue, waiting time, doctor/AI/bandwidth
utilization, bottleneck, and UNDER CAPACITY / OPTIMAL / OVERLOADED state) are computed live
from the input sliders by `backend/app/services/simulation_service.py` — nothing is
hardcoded. The default demo scenario (350 patients/day, 5 doctors, 10 Mbps, 3s AI / 30s
doctor review, 299 working days) matches the scenario in the project specification.

## 11. Testing

```bash
cd backend
pytest -v
```

8 tests cover: health check, patient creation/listing, the full screening workflow (create →
upload → quality → analyze → lesions → explainability → review), invalid-file rejection,
analytics, and simulation (including that AI-assisted capacity ≥ manual capacity).

All 8 tests pass in this repository as delivered. The full workflow was also manually
exercised end-to-end via the running API (patient → screening → upload → analyze → review →
PDF report → analytics → simulation) during development.

## 12. Demo Walkthrough (5–10 minutes)

1. Open the landing page, click **Start Screening**
2. Fill patient details (or click "Fill Demo Patient")
3. Upload a fundus image → automatic quality assessment
4. Review the enhancement comparison slider
5. Open the Retinal Analysis workstation, toggle layers, click a lesion marker
6. Run AI analysis → view the lesion detection cards
7. View the DR Level classification screen with the animated severity scale
8. Click **"Why did the AI make this decision?"** → explore the three-panel XAI view and
   evidence list
9. Continue to Doctor Review → choose a decision, add notes, submit
10. Download the PDF report
11. Open Patient History → see the severity timeline
12. Open Analytics → explore the multi-chart dashboard
13. Open the Rural Screening Simulator → drag sliders, toggle AI-assisted vs. manual, watch
    capacity/bottleneck/state update live

## 13. Design System

A single NETRA XAI identity with **module-specific accent palettes** (see
`frontend/tailwind.config.js`): Midnight AI (landing), Clinical Command Centre (dashboard),
Clinical Precision (screening), Diagnostic Green (quality), Medical Imaging (retinal
analysis), AI Intelligence (XAI — purple/magenta), Human + AI (doctor review), Clinical
Documentation (report), Healthcare Intelligence (analytics), and Mission Control (rural
simulator).

## 14. Known Simplifications / Limitations

Built transparently as a prototype under real time constraints; the following spec items were
implemented at a **representative** rather than **exhaustive** level of fidelity:

- The XAI three panels are not synchronized pan/zoom; each is independently viewable.
- The image-enhancement comparison slider uses a CSS-based reveal rather than re-running
  CLAHE at arbitrary intermediate slider positions in real time (the two fixed endpoints —
  original and fully enhanced — are both real processed images).
- The "Real AI Mode" / EfficientNet path is architected and documented but not implemented
  with an actual trained checkpoint (none is provided, per the spec's own allowance to
  clearly label a safe demo alternative).
- Some sidebar items intentionally route to the same page (e.g. "AI Analysis",
  "Explainability", "Reports" all surface from within the per-screening workflow rather than
  as separate top-level pages) to keep navigation coherent around the patient-centric
  workflow.
- Accessibility, keyboard navigation, and responsive breakpoints were addressed at a
  reasonable baseline (semantic buttons/labels, adequate contrast, desktop-first responsive
  grid) rather than a full WCAG audit.
- No authentication/authorization layer — this is a local single-user clinical demo.

None of these affect the core, connected, running workflow described in the demo walkthrough.

## 15. Medical Disclaimer

**NETRA XAI is an early-stage research prototype built for demonstration and educational
purposes.** It has not undergone clinical validation, its AI outputs (severity grade,
confidence score, lesion findings) are produced by a classical-CV **demo** engine and are
explicitly **not** clinically calibrated, and it does not constitute a medical diagnosis. It
does not replace the judgement of a qualified, licensed healthcare professional. Any real
deployment for patient care would require regulatory clearance, clinical validation studies
(sensitivity/specificity against ground truth, calibration, bias auditing), and a trained,
peer-reviewed model — none of which are claimed here.

## 16. Future Scope

- Train and integrate a real EfficientNet-B0 (or ResNet/DenseNet) classifier on APTOS/EyePACS
- Implement true gradient-based Grad-CAM against the trained model's final conv layer
- Formal calibration and sensitivity/specificity/ROC-AUC evaluation against held-out labels
- Multi-user auth, role-based access, and audit logging
- Offline-first mobile capture app for low-connectivity rural centres
- Integration with India's national digital health stack (ABHA) for patient records
