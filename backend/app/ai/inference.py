"""
NETRA XAI - AI Inference Engine

Public interface used by the API layer:

    result = predict(image_path, quality_score, result_dir, prefix)

`result` always contains: severity, level, confidence, referable, findings,
plus explainability artifact paths. The engine is selected by AI_MODE:

  AI_MODE=demo  (default) -> deterministic classical-CV DEMO engine below.
                              Same image ALWAYS produces the same output.
  AI_MODE=real  -> loads a trained model from MODEL_PATH (EfficientNet-B0
                   backbone recommended - see docstring at bottom). If the
                   model file is missing, the engine safely falls back to
                   DEMO mode and clearly reports that fallback.

Architecture note (why EfficientNet-B0):
  For a single-image, resource-constrained rural-screening use case,
  EfficientNet-B0 offers the best accuracy-per-FLOP of the common backbones
  (ResNet-50, DenseNet-121, EfficientNet-B0) at ~5M parameters, runs
  comfortably on CPU-only edge hardware, and has strong transfer-learning
  results on the public APTOS/EyePACS diabetic retinopathy datasets. This
  module is written so a fine-tuned EfficientNet-B0 checkpoint can be
  dropped into MODEL_PATH without changing the API contract.
"""
import time
from app.config import settings
from app.image_processing.processing import load_image_bgr
from app.ai.lesion_detector import detect_lesion_candidates
from app.ai.postprocessing import grade_severity, build_findings, build_evidence_chain
from app.ai.explainability import generate_demo_gradcam


def _run_demo_engine(image_path: str, quality_score: float, result_dir: str, prefix: str) -> dict:
    start = time.time()
    img = load_image_bgr(image_path)

    evidence = detect_lesion_candidates(img)
    grading = grade_severity(evidence, quality_score)
    findings = build_findings(evidence)
    evidence_chain = build_evidence_chain(findings, grading["dr_level"])
    heatmap_path, overlay_path = generate_demo_gradcam(img, evidence, result_dir, prefix)

    elapsed_ms = (time.time() - start) * 1000

    return {
        "ai_mode": "demo",
        "dr_level": grading["dr_level"],
        "severity_label": grading["severity_label"],
        "confidence": grading["confidence"],
        "referable": grading["referable"],
        "probability_distribution": grading["probability_distribution"],
        "findings": findings,
        "evidence": evidence_chain,
        "heatmap_path": heatmap_path,
        "overlay_path": overlay_path,
        "processing_time_ms": round(elapsed_ms, 1),
        "lesion_burden_score": grading["lesion_burden_score"],
    }


def predict(image_path: str, quality_score: float, result_dir: str, prefix: str) -> dict:
    if settings.AI_MODE == "real" and settings.MODEL_PATH:
        import os
        if os.path.exists(settings.MODEL_PATH):
            # Real-model path intentionally not implemented in this prototype
            # (no trained checkpoint ships with the repo). Structure is ready
            # for a torch.load(...) + forward pass + GradCAM() call using the
            # classes in app/ai/explainability.py's reference implementation.
            raise NotImplementedError(
                "AI_MODE=real is configured but no real-model inference "
                "pipeline is wired up in this prototype. Falling back is "
                "handled by the caller."
            )
    return _run_demo_engine(image_path, quality_score, result_dir, prefix)
