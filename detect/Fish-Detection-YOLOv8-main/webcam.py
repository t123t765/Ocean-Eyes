import cv2
from ultralytics import YOLO

model = YOLO("yolov8n.pt")  # Load YOLOv8 model
cap = cv2.VideoCapture(1)  # Use camera (Change to your external camera if needed)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    results = model(frame)  # Run YOLO
    for r in results:
        frame = r.plot()  # Draw detections

    cv2.imshow("YOLOv8 Detection", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
