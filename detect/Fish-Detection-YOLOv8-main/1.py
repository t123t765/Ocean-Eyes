import cv2
from ultralytics import YOLO
model = YOLO("runs/detect/train/weights/best.pt")
print(model.names)