from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import cv2
from ultralytics import YOLO
import numpy as np
import os
import time
from datetime import datetime
import uuid

# 创建 FastAPI 应用
app = FastAPI()

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载模型
import os
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(current_dir, "runs", "detect", "train", "weights", "best.pt")
model = YOLO(model_path)

# 配置路径
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "output_video"

# 创建目录
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 鱼类分类
toxic_fish_ids = [0, 1, 22, 23]    # 有毒
non_toxic_fish_ids = [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,24,25] # 无毒

COLOR_TOXIC = (0, 0, 255)
COLOR_NON_TOXIC = (255, 255, 255)
LINE_WIDTH = 2

# 视频处理函数
def process_video(input_path, output_path):
    cap = cv2.VideoCapture(input_path)
    
    if not cap.isOpened():
        raise Exception("视频文件打开失败")
    
    # 获取视频属性
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    original_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    original_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # 优化：使用更小的分辨率进行处理
    max_width = 640
    if original_width > max_width:
        scale_factor = max_width / original_width
        width = max_width
        height = int(original_height * scale_factor)
    else:
        width = original_width
        height = original_height
    
    # 使用更高效的编码格式
    fourcc = cv2.VideoWriter_fourcc(*"avc1")  # H.264编码，更高效
    
    video_writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # 统计检测结果
    class_counts = {}
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # 优化：调整帧大小以提高处理速度
        if original_width != width or original_height != height:
            frame = cv2.resize(frame, (width, height))
        
        # 进行目标检测
        results = model(frame, iou=0.6)
        boxes = results[0].boxes
        
        # 绘制检测结果
        for box in boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
            cls_id = int(box.cls.cpu().numpy())
            
            if cls_id in toxic_fish_ids:
                draw_color = COLOR_TOXIC
                is_toxic = True
            elif cls_id in non_toxic_fish_ids:
                draw_color = COLOR_NON_TOXIC
                is_toxic = False
            else:
                draw_color = (128, 128, 128)  # 未知类别画灰色框
                is_toxic = False
            
            cv2.rectangle(frame, (x1, y1), (x2, y2), draw_color, LINE_WIDTH)
            
            # 统计每个类别的数量
            if cls_id not in class_counts:
                class_counts[cls_id] = {
                    "count": 0,
                    "is_toxic": is_toxic
                }
            class_counts[cls_id]["count"] += 1
        
        video_writer.write(frame)
    
    cap.release()
    video_writer.release()
    
    # 转换为前端期望的格式
    detections = []
    for cls_id, info in class_counts.items():
        detections.append({
            "class_id": cls_id,
            "count": info["count"],
            "is_toxic": info["is_toxic"]
        })
    
    return {
        "width": width,
        "height": height,
        "fps": fps,
        "detections": detections
    }

# 图片处理函数
def process_image(input_path, output_path):
    image = cv2.imread(input_path)
    
    if image is None:
        raise Exception("图片文件打开失败")
    
    # 进行目标检测
    results = model(image, iou=0.6)
    boxes = results[0].boxes
    
    # 绘制检测结果
    detections = []
    class_counts = {}
    
    for box in boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
        cls_id = int(box.cls.cpu().numpy())
        
        if cls_id in toxic_fish_ids:
            draw_color = COLOR_TOXIC
            is_toxic = True
        elif cls_id in non_toxic_fish_ids:
            draw_color = COLOR_NON_TOXIC
            is_toxic = False
        else:
            draw_color = (128, 128, 128)  # 未知类别画灰色框
            is_toxic = False
        
        cv2.rectangle(image, (x1, y1), (x2, y2), draw_color, LINE_WIDTH)
        
        # 统计每个类别的数量
        if cls_id not in class_counts:
            class_counts[cls_id] = {
                "count": 0,
                "is_toxic": is_toxic
            }
        class_counts[cls_id]["count"] += 1
    
    # 转换为前端期望的格式
    for cls_id, info in class_counts.items():
        detections.append({
            "class_id": cls_id,
            "count": info["count"],
            "is_toxic": info["is_toxic"]
        })
    
    cv2.imwrite(output_path, image)
    
    return {
        "width": image.shape[1],
        "height": image.shape[0],
        "detections": detections
    }

# API 接口

@app.post("/DETECT_FISH_VIDEO")
async def detect_fish_video(video_file: UploadFile = File(...)):
    try:
        # 生成唯一文件名
        file_extension = os.path.splitext(video_file.filename)[1]
        unique_id = str(uuid.uuid4())
        input_filename = f"{unique_id}_input{file_extension}"
        output_filename = f"{unique_id}_output.mp4"
        
        input_path = os.path.join(UPLOAD_DIR, input_filename)
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # 保存上传的视频
        with open(input_path, "wb") as f:
            content = await video_file.read()
            f.write(content)
        
        # 处理视频
        video_info = process_video(input_path, output_path)
        
        # 生成视频播放 URL
        video_play_url = f"/output_video/{output_filename}"
        
        # 清理临时文件
        os.remove(input_path)
        
        return {
            "code": 1,
            "msg": "视频检测成功",
            "result": {
                "video_play_url": video_play_url,
                "video_local_path": output_path,
                "video_width": video_info["width"],
                "video_height": video_info["height"],
                "detections": video_info["detections"]
            }
        }
    except Exception as e:
        return {
            "code": 0,
            "msg": str(e),
            "result": {}
        }

@app.post("/DETECT_FISH_IMAGE")
async def detect_fish_image(image_file: UploadFile = File(...)):
    try:
        # 生成唯一文件名
        file_extension = os.path.splitext(image_file.filename)[1]
        unique_id = str(uuid.uuid4())
        input_filename = f"{unique_id}_input{file_extension}"
        output_filename = f"{unique_id}_output{file_extension}"
        
        input_path = os.path.join(UPLOAD_DIR, input_filename)
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # 保存上传的图片
        with open(input_path, "wb") as f:
            content = await image_file.read()
            f.write(content)
        
        # 处理图片
        image_info = process_image(input_path, output_path)
        
        # 生成图片访问 URL
        image_play_url = f"/output_video/{output_filename}"
        
        # 清理临时文件
        os.remove(input_path)
        
        return {
            "code": 1,
            "msg": "图片检测成功",
            "result": {
                "image_play_url": image_play_url,
                "image_local_path": output_path,
                "image_width": image_info["width"],
                "image_height": image_info["height"],
                "detections": image_info["detections"]
            }
        }
    except Exception as e:
        return {
            "code": 0,
            "msg": str(e),
            "result": {}
        }

# 提供静态文件访问
@app.get("/output_video/{filename}")
async def get_output_video(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(file_path)

@app.get("/")
async def root():
    return {"message": "Fish Detection API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)