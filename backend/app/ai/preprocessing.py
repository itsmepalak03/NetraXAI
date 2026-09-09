"""
Preprocessing shared by the demo lesion-detector and (future) real model
inference. Retinal images are conventionally analysed on the GREEN channel
because it carries the strongest vessel/lesion contrast; red is often
saturated and blue is noisy.
"""
import cv2
import numpy as np


def to_green_channel(img_bgr: np.ndarray) -> np.ndarray:
    return img_bgr[:, :, 1]


def retina_mask(img_bgr: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 12, 255, cv2.THRESH_BINARY)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    return mask


def resize_for_model(img_bgr: np.ndarray, size=(512, 512)) -> np.ndarray:
    return cv2.resize(img_bgr, size, interpolation=cv2.INTER_AREA)


def normalize_rgb(img_bgr: np.ndarray) -> np.ndarray:
    rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    return rgb
