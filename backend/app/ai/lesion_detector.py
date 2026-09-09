"""
Classical computer-vision lesion candidate detector.

This is NOT a trained deep-learning lesion detector. It uses standard
retinal-image-processing morphology (top-hat / black-hat transforms on the
green channel) to surface dark blob candidates (microaneurysms /
haemorrhages) and bright blob candidates (exudates / cotton-wool spots).
It runs on the ACTUAL uploaded image and is fully deterministic - the same
image always yields the same candidate regions.

It is intentionally used to drive the DEMO AI engine so that severity
grading and Grad-CAM-style attention maps are grounded in real pixel
evidence from the image rather than pure random numbers.
"""
import cv2
import numpy as np
from app.ai.preprocessing import to_green_channel, retina_mask


def _blob_candidates(channel: np.ndarray, mask: np.ndarray, dark: bool, kernel_size=9, min_area=6, max_area=400):
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    if dark:
        morph = cv2.morphologyEx(channel, cv2.MORPH_BLACKHAT, kernel)
    else:
        morph = cv2.morphologyEx(channel, cv2.MORPH_TOPHAT, kernel)

    morph = cv2.normalize(morph, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    morph = cv2.bitwise_and(morph, morph, mask=mask)
    _, thresh = cv2.threshold(morph, 35, 255, cv2.THRESH_BINARY)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []
    for c in contours:
        area = cv2.contourArea(c)
        if min_area <= area <= max_area:
            (x, y), radius = cv2.minEnclosingCircle(c)
            intensity = float(morph[int(y), int(x)]) if 0 <= int(y) < morph.shape[0] and 0 <= int(x) < morph.shape[1] else 0
            candidates.append({
                "x": float(x), "y": float(y), "radius": float(max(radius, 3)),
                "area": float(area), "intensity": intensity,
            })
    # strongest first
    candidates.sort(key=lambda c: c["intensity"], reverse=True)
    return candidates, morph


def detect_lesion_candidates(img_bgr: np.ndarray) -> dict:
    h, w = img_bgr.shape[:2]
    green = to_green_channel(img_bgr)
    green = cv2.equalizeHist(green)
    mask = retina_mask(img_bgr)

    dark_candidates, dark_map = _blob_candidates(green, mask, dark=True, kernel_size=9, min_area=4, max_area=250)
    bright_candidates, bright_map = _blob_candidates(green, mask, dark=False, kernel_size=15, min_area=15, max_area=900)

    # Heuristic split of dark candidates into microaneurysm-like (small, round)
    # vs haemorrhage-like (larger, irregular) purely by size.
    microaneurysms = [c for c in dark_candidates if c["area"] <= 40][:25]
    haemorrhages = [c for c in dark_candidates if c["area"] > 40][:15]
    exudates = [c for c in bright_candidates if c["area"] <= 300][:20]
    cotton_wool = [c for c in bright_candidates if c["area"] > 300][:10]

    # Neovascularization proxy: dense clustering of bright + dark candidates
    # near the optic-disc region (approximated as brightest compact region).
    neovascularization_score = 0.0
    if len(dark_candidates) > 12 and len(bright_candidates) > 6:
        neovascularization_score = min(1.0, (len(dark_candidates) + len(bright_candidates)) / 60.0)

    return {
        "image_size": (w, h),
        "microaneurysms": microaneurysms,
        "haemorrhages": haemorrhages,
        "exudates": exudates,
        "cotton_wool_spots": cotton_wool,
        "neovascularization_score": neovascularization_score,
        "dark_attention_map": dark_map,
        "bright_attention_map": bright_map,
        "retina_mask": mask,
    }
