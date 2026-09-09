"""
NETRA XAI - Image Processing
Real, deterministic image analysis functions used for:
 - basic validation
 - quality assessment (focus, illumination, contrast, noise, field-of-view)
 - enhancement (CLAHE, illumination normalization, denoising, contrast boost)

These are lightweight, classical computer-vision heuristics (OpenCV/NumPy).
They are NOT a clinical-grade quality model, but they produce real,
reproducible measurements from the actual uploaded pixel data (nothing here
is randomly generated).
"""
import cv2
import numpy as np
from PIL import Image


def load_image_bgr(path: str) -> np.ndarray:
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        # Fallback via PIL for formats OpenCV may not decode directly
        pil_img = Image.open(path).convert("RGB")
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    return img


def get_dimensions_and_size(path: str):
    img = Image.open(path)
    width, height = img.size
    import os
    size_kb = os.path.getsize(path) / 1024.0
    return width, height, round(size_kb, 1)


def _fov_mask(gray: np.ndarray):
    """Estimate the circular retinal field-of-view via Otsu thresholding."""
    _, mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
    return mask


def assess_quality(path: str) -> dict:
    img = load_image_bgr(path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # --- Focus: variance of Laplacian (sharpness) ---
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    focus_score = float(np.clip((lap_var / 350.0) * 100, 0, 100))

    # --- Illumination: mean brightness closeness to ideal band (90-170) ---
    mean_brightness = float(np.mean(gray))
    if 90 <= mean_brightness <= 170:
        illumination_score = 100.0
    else:
        dist = min(abs(mean_brightness - 90), abs(mean_brightness - 170))
        illumination_score = float(np.clip(100 - dist * 0.9, 0, 100))

    # --- Field of view: proportion of frame that is non-black (retina disc) ---
    mask = _fov_mask(gray)
    fov_ratio = float(np.count_nonzero(mask) / (h * w))
    fov_score = float(np.clip(fov_ratio * 130, 0, 100))

    # --- Contrast: standard deviation of pixel intensities ---
    contrast_std = float(np.std(gray))
    contrast_score = float(np.clip((contrast_std / 60.0) * 100, 0, 100))

    # --- Noise: high-frequency energy estimate ---
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    noise_energy = float(np.mean(cv2.absdiff(gray, blur)))
    noise_score = float(np.clip(100 - noise_energy * 4.0, 0, 100))

    overall = float(np.clip(
        0.30 * focus_score + 0.20 * illumination_score + 0.20 * fov_score +
        0.20 * contrast_score + 0.10 * noise_score, 0, 100
    ))

    if overall >= 70:
        status = "GRADEABLE"
    elif overall >= 45:
        status = "BORDERLINE"
    else:
        status = "UNGRADEABLE"

    reasons = []
    if focus_score < 50:
        reasons.append("Poor focus")
    if illumination_score < 50:
        reasons.append("Low illumination" if mean_brightness < 90 else "Excessive glare")
    if fov_score < 50:
        reasons.append("Incomplete retinal field")
    if contrast_score < 40:
        reasons.append("Low contrast")
    if noise_score < 40:
        reasons.append("Excessive image noise")

    return {
        "focus": round(focus_score, 1),
        "illumination": round(illumination_score, 1),
        "field_of_view": round(fov_score, 1),
        "contrast": round(contrast_score, 1),
        "noise": round(noise_score, 1),
        "overall": round(overall, 1),
        "status": status,
        "recapture_recommended": status == "UNGRADEABLE",
        "reasons": reasons,
    }


def enhance_image(path: str, out_path: str, clahe=True, illumination_norm=True,
                   denoise=True, contrast_boost=True) -> str:
    img = load_image_bgr(path)
    result = img.copy()

    if denoise:
        result = cv2.fastNlMeansDenoisingColored(result, None, 5, 5, 7, 15)

    if illumination_norm:
        lab = cv2.cvtColor(result, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        l = cv2.GaussianBlur(l, (0, 0), 15)
        lab_l, lab_a, lab_b = cv2.split(cv2.cvtColor(result, cv2.COLOR_BGR2LAB))
        norm_l = cv2.normalize(lab_l.astype(np.float32) - l.astype(np.float32) + 128, None, 0, 255, cv2.NORM_MINMAX)
        lab = cv2.merge([norm_l.astype(np.uint8), lab_a, lab_b])
        result = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

    if clahe:
        lab = cv2.cvtColor(result, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe_op = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        l = clahe_op.apply(l)
        result = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)

    if contrast_boost:
        result = cv2.convertScaleAbs(result, alpha=1.12, beta=6)

    cv2.imwrite(out_path, result)
    return out_path


def validate_image(path: str) -> dict:
    try:
        img = Image.open(path)
        img.verify()
        return {"valid": True, "format": img.format}
    except Exception as e:
        return {"valid": False, "error": str(e)}
