"""
Maps lesion-candidate evidence into a DR severity grade.

This mirrors, at a simplified prototype level, the general clinical
heuristic used in the international DR severity scale (counts of
microaneurysms/haemorrhages, presence of venous beading / IRMA-like
patterns, and neovascularization), but it is a DEMO heuristic, not a
validated clinical grading algorithm.
"""
from app.config import DR_LEVELS


def grade_severity(evidence: dict, quality_score: float) -> dict:
    ma = len(evidence["microaneurysms"])
    hem = len(evidence["haemorrhages"])
    exu = len(evidence["exudates"])
    cw = len(evidence["cotton_wool_spots"])
    neo = evidence["neovascularization_score"]

    # Weighted lesion burden score (deterministic function of real counts)
    burden = (ma * 1.0) + (hem * 2.2) + (exu * 1.4) + (cw * 2.0) + (neo * 18.0)

    if neo >= 0.55:
        level = 4
    elif burden >= 22 or hem >= 6:
        level = 3
    elif burden >= 11 or (ma >= 6 and (hem >= 1 or exu >= 2)):
        level = 2
    elif burden >= 3:
        level = 1
    else:
        level = 0

    meta = DR_LEVELS[level]

    # Confidence: higher lesion-burden separation from adjacent thresholds and
    # higher image quality => higher demo confidence. Purely heuristic.
    thresholds = [0, 3, 11, 22, 34]
    lower = thresholds[level]
    upper = thresholds[level + 1] if level < 4 else lower + 20
    span = max(upper - lower, 1)
    position = min(max((burden - lower) / span, 0), 1)
    base_conf = 62 + position * 28
    quality_adj = (quality_score - 60) * 0.12
    confidence = float(min(max(base_conf + quality_adj, 55), 98.5))

    # Build a probability distribution across all 5 levels for the UI
    import numpy as np
    dist = np.zeros(5)
    dist[level] = confidence
    remaining = 100 - confidence
    others = [l for l in range(5) if l != level]
    weights = [1 / (1 + abs(o - level)) for o in others]
    wsum = sum(weights)
    for o, wgt in zip(others, weights):
        dist[o] = remaining * (wgt / wsum)
    prob_dist = {str(l): round(float(dist[l]), 1) for l in range(5)}

    return {
        "dr_level": level,
        "severity_label": meta["label"],
        "confidence": round(confidence, 1),
        "referable": bool(meta["referable"]),
        "lesion_burden_score": round(burden, 2),
        "probability_distribution": prob_dist,
    }


def build_findings(evidence: dict) -> list:
    findings = []

    def region_label(x, y, w, h):
        cx, cy = x / w, y / h
        vertical = "superior" if cy < 0.5 else "inferior"
        horizontal = "temporal" if cx > 0.5 else "nasal"
        return f"{vertical}-{horizontal} retinal region"

    w, h = evidence["image_size"]

    def add(items, name, icon):
        for it in items:
            findings.append({
                "type": name,
                "icon": icon,
                "x": round(it["x"] / w, 4),
                "y": round(it["y"] / h, 4),
                "radius": round(it["radius"], 1),
                "location": region_label(it["x"], it["y"], w, h),
                "confidence": round(min(60 + it["intensity"] / 4.0, 97), 1),
            })

    add(evidence["microaneurysms"], "Microaneurysm", "circle-dot")
    add(evidence["haemorrhages"], "Haemorrhage", "droplet")
    add(evidence["exudates"], "Exudate", "sparkle")
    add(evidence["cotton_wool_spots"], "Cotton-Wool Spot", "cloud")

    findings.sort(key=lambda f: f["confidence"], reverse=True)
    return findings


def build_evidence_chain(findings: list, level: int) -> list:
    """Rank a handful of top findings as XAI 'evidence' items with a
    contribution label used on the Explainability page."""
    evidence = []
    for f in findings[:6]:
        if f["confidence"] >= 85:
            contribution = "High"
        elif f["confidence"] >= 70:
            contribution = "Moderate"
        else:
            contribution = "Low"
        evidence.append({
            "title": f["type"],
            "location": f["location"],
            "confidence": f["confidence"],
            "contribution": contribution,
            "x": f["x"], "y": f["y"], "radius": f["radius"],
        })
    return evidence
