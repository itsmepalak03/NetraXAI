"""
Explainable AI module.

REAL MODE: if a trained PyTorch CNN is available (AI_MODE=real,
MODEL_PATH set), this module is where a true Grad-CAM hook against the
final convolutional layer would be implemented (see the commented
reference pipeline at the bottom of this file).

DEMO MODE (default, no trained model required): this module builds an
"attention" heatmap from the ACTUAL classical-CV lesion-candidate map
(app/ai/lesion_detector.py) by compositing Gaussian responses at each
detected candidate location, weighted by its detection intensity. This is
a clearly-labelled PROTOTYPE/DEMO explainability visualization, not a
Grad-CAM gradient map from a trained classifier.
"""
import cv2
import numpy as np
import os


def _gaussian_attention(shape, points, sigma_scale=1.0):
    h, w = shape
    heat = np.zeros((h, w), dtype=np.float32)
    for p in points:
        x, y, r, intensity = p["x"], p["y"], p["radius"], p.get("intensity", 60)
        sigma = max(r * 1.8 * sigma_scale, 6)
        y_grid, x_grid = np.ogrid[:h, :w]
        g = np.exp(-(((x_grid - x) ** 2 + (y_grid - y) ** 2) / (2 * sigma ** 2)))
        heat += g * (intensity / 100.0)
    if heat.max() > 0:
        heat = heat / heat.max()
    return heat


def generate_demo_gradcam(img_bgr: np.ndarray, evidence: dict, out_dir: str, prefix: str):
    """Returns (heatmap_path, overlay_path) - both written to disk as JPEGs."""
    h, w = img_bgr.shape[:2]

    all_points = []
    for key, weight in [("microaneurysms", 70), ("haemorrhages", 90),
                         ("exudates", 55), ("cotton_wool_spots", 65)]:
        for it in evidence[key]:
            all_points.append({"x": it["x"], "y": it["y"], "radius": it["radius"],
                                "intensity": weight + (it["intensity"] / 6)})

    if not all_points:
        # No detected candidates (e.g. Level 0 / normal retina): produce a
        # low, diffuse central-field attention map rather than an empty one.
        all_points = [{"x": w / 2, "y": h / 2, "radius": min(w, h) / 3, "intensity": 25}]

    heat = _gaussian_attention((h, w), all_points)
    heat_u8 = np.uint8(255 * heat)
    heat_color = cv2.applyColorMap(heat_u8, cv2.COLORMAP_JET)

    overlay = cv2.addWeighted(img_bgr, 0.55, heat_color, 0.45, 0)

    os.makedirs(out_dir, exist_ok=True)
    heat_path = os.path.join(out_dir, f"{prefix}_heatmap.jpg")
    overlay_path = os.path.join(out_dir, f"{prefix}_overlay.jpg")
    cv2.imwrite(heat_path, heat_color)
    cv2.imwrite(overlay_path, overlay)
    return heat_path, overlay_path


# ---------------------------------------------------------------------------
# REFERENCE (not executed in demo mode): true Grad-CAM against a trained
# torchvision CNN, kept here so a real model can be dropped in later.
# ---------------------------------------------------------------------------
"""
import torch
import torch.nn.functional as F

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.gradients = None
        self.activations = None
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def __call__(self, input_tensor, target_class):
        output = self.model(input_tensor)
        self.model.zero_grad()
        output[0, target_class].backward()
        weights = self.gradients.mean(dim=(2, 3), keepdim=True)
        cam = F.relu((weights * self.activations).sum(dim=1)).squeeze()
        cam = cam / (cam.max() + 1e-8)
        return cam.cpu().numpy()
"""
