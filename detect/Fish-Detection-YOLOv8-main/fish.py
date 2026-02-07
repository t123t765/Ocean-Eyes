import cv2
from ultralytics import YOLO
import numpy as np

model = YOLO("runs/detect/train/weights/best.pt")
video_input_path = "D:/demo/Fish-Detection-YOLOv8-main/fish.mp4"  # 你的输入视频
video_output_path = "D:/demo/Fish-Detection-YOLOv8-main/detected_fish_p.mp4"  # 你的输出视频
cap = cv2.VideoCapture(video_input_path)

toxic_fish_ids = [0, 1, 22, 23]    #有毒
non_toxic_fish_ids = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,24,25] # 无毒

COLOR_TOXIC = (0, 0, 255)
COLOR_NON_TOXIC = (255, 255, 255)
LINE_WIDTH = 2

if not cap.isOpened():
    print("Error: 视频文件打开失败！")
    exit()
fps = int(cap.get(cv2.CAP_PROP_FPS))
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fourcc = cv2.VideoWriter_fourcc(*"mp4v")

video_writer = cv2.VideoWriter(video_output_path, fourcc, fps, (width, height))

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print(f"完成，视频保存至：{video_output_path}")
        break

    results = model(frame,iou=0.6)
    boxes = results[0].boxes

    for box in boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
        cls_id = int(box.cls.cpu().numpy())

        if cls_id in toxic_fish_ids:
            draw_color = COLOR_TOXIC
        elif cls_id in non_toxic_fish_ids:
            draw_color = COLOR_NON_TOXIC
        else:
            draw_color = (128, 128, 128)  # 未知类别画灰色框

        cv2.rectangle(frame, (x1, y1), (x2, y2), draw_color, LINE_WIDTH)

    video_writer.write(frame)

    # 实时展示
    # cv2.imshow("Fish Detection - Video", frame)
    # if cv2.waitKey(1) & 0xFF == ord("q"):
    #     break

cap.release()
video_writer.release()
cv2.destroyAllWindows()

# import cv2
# from ultralytics import YOLO
#
# # 1. 加载模型+配置视频路径
# model = YOLO("runs/detect/train/weights/best.pt")
# video_input_path = "D:/demo/Fish-Detection-YOLOv8-main/fish.mp4"  # 输入视频
# video_output_path = "D:/demo/Fish-Detection-YOLOv8-main/detected_fish_video2.mp4"  # 输出视频
# cap = cv2.VideoCapture(video_input_path)
#
# # 2. 检查视频是否打开，获取视频基础参数
# if not cap.isOpened():
#     print("Error: 视频文件打开失败！")
#     exit()
# fps = int(cap.get(cv2.CAP_PROP_FPS))
# width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
# height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
# fourcc = cv2.VideoWriter_fourcc(*"mp4v")
#
# # 3. 创建视频写入器
# video_writer = cv2.VideoWriter(video_output_path, fourcc, fps, (width, height))
#
# # 4. 逐帧检测+写入结果
# while cap.isOpened():
#     ret, frame = cap.read()
#     if not ret:
#         print(f"视频检测完成！标注后的视频已保存至：{video_output_path}")
#         break
#
#     # 【修改1】检测：加conf阈值+iou去重框，解决一个鱼多个框问题
#     results = model(frame, iou=0.6)
#     # 【修改2】绘制：labels=False 隐藏类别/置信度，只显示检测框
#     annotated_frame = results[0].plot(labels=False)
#
#     # 写入标注后的帧
#     video_writer.write(annotated_frame)
#
#     # 实时展示检测效果（不需要可注释）
#     # cv2.imshow("Fish Detection - Video", annotated_frame)
#     # if cv2.waitKey(1) & 0xFF == ord("q"):
#     #     break
#
# # 5. 释放所有资源
# cap.release()
# video_writer.release()
# cv2.destroyAllWindows()

# import cv2
# from ultralytics import YOLO
#
# # Load the trained model
# model = YOLO("runs/detect/train/weights/best.pt")  # Update path if needed
#
# # Open the webcam (0 for built-in webcam, 1 for external)
# cap = cv2.VideoCapture(0)
#
# # Check if the webcam is opened
# if not cap.isOpened():
#     print("Error: Could not open webcam.")
#     exit()
#
# while cap.isOpened():
#     ret, frame = cap.read()
#     if not ret:
#         print("Error: Failed to capture image.")
#         break
#
#     # Run YOLOv8 object detection
#     results = model(frame)
#
#     # Draw the detection results
#     annotated_frame = results[0].plot()
#
#     # Show the output
#     cv2.imshow("Fish Detection", annotated_frame)
#
#     # Press 'Q' to exit
#     if cv2.waitKey(1) & 0xFF == ord("q"):
#         break
#
# # Release the webcam and close all OpenCV windows
# cap.release()
# cv2.destroyAllWindows()
