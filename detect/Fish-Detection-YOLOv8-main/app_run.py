# -*- coding: utf-8 -*-
import os
import json
import traceback
import base64
import shutil
import tempfile
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS, cross_origin
import cv2
import numpy as np
from ultralytics import YOLO
from moviepy.editor import VideoFileClip

# 初始化Flask
app = Flask(__name__)
CORS(app, resources=r'/*')  # 强化跨域，避免隐性跨域导致数据返回异常
app.config['JSON_AS_ASCII'] = False
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100M视频限制

# 配置（保留你的原有ID，框宽改4更清晰）
YOLO_MODEL_PATH = "runs/detect/train/weights/best.pt"
toxic_fish_ids = [0, 1, 22, 23]
non_toxic_fish_ids = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 24, 25]
COLOR_TOXIC = (0, 0, 255)  # cv2默认BGR，红框正确
COLOR_NON_TOXIC = (255, 255, 255)  # 白框正确
LINE_WIDTH = 4  # 加粗框，可视化更明显
IOU_THRESHOLD = 0.6
VIDEO_ENCODE = 'XVID'  # 使用 XVID 编码，兼容性更好
# 输出目录：优先使用项目同级的 oceaneyes 下 public/output，否则使用本地 temp
_BASE = os.path.dirname(os.path.abspath(__file__))
_OUTER = os.path.dirname(os.path.dirname(_BASE))
OUTPUT_DIR = os.path.join(_OUTER, "oceaneyes---ai-underwater-assistant", "public", "output")
if not os.path.exists(os.path.dirname(OUTPUT_DIR)):
    OUTPUT_DIR = os.path.join(_BASE, "output_video")
TEMP_DIR = "./temp_video"
OUTPUT_IMG_DIR = os.path.join(_BASE, "output_images")

# 创建目录
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(OUTPUT_IMG_DIR, exist_ok=True)

# 模型加载+强校验+日志
print(f"[INFO] 加载YOLO模型：{YOLO_MODEL_PATH}")
try:
    yolo_model = YOLO(YOLO_MODEL_PATH)
    print(f"[SUCCESS] 模型加载成功，类别数：{len(yolo_model.names)}")
    print(f"[INFO] 模型类别映射：{yolo_model.names}")  # 确认ID和类别对应，关键！
except Exception as e:
    print(f"[FATAL] 模型加载失败：{str(e)}")
    raise e  # 模型加载失败直接终止服务


# 工具函数（保留）
def video_file_to_base64(video_path):
    with open(video_path, 'rb') as f:
        video_bytes = f.read()
    # 校验Base64非空
    if len(video_bytes) < 1024:  # 小于1K视为无效视频
        raise ValueError(f"视频文件过小，无效：{video_path}，大小：{len(video_bytes)}字节")
    b64_str = base64.b64encode(video_bytes).decode('utf-8')
    print(f"[INFO] 视频转Base64成功，长度：{len(b64_str)}字符")
    return b64_str


def base64_to_video_file(b64_str, video_path):
    video_bytes = base64.b64decode(b64_str)
    with open(video_path, 'wb') as f:
        f.write(video_bytes)
    return video_path


def get_unique_filename(suffix=".mp4"):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
    return f"{timestamp}{suffix}"


# 单帧/单图检测，返回检测结果统计（供视频和图片共用）
def detect_fish_single_frame(frame):
    """对单帧图像进行鱼类检测，返回 {class_id: count} 的统计"""
    results = yolo_model(frame, iou=IOU_THRESHOLD)
    boxes = results[0].boxes
    cls_counts = {}
    if len(boxes) > 0:
        for box in boxes:
            cls_id = int(box.cls.cpu().numpy())
            cls_counts[cls_id] = cls_counts.get(cls_id, 0) + 1
    return cls_counts, results


# 核心检测函数+全链路日志+强校验（返回视频路径 + 检测到的鱼类统计）
def detect_fish_from_video(input_video_path):
    print(f"[INFO] 开始处理视频：{input_video_path}")
    # 1. 打开视频+强校验
    cap = cv2.VideoCapture(input_video_path)
    if not cap.isOpened():
        raise ValueError(f"无法打开视频文件：{input_video_path}，请检查文件是否损坏/格式是否支持")

    # 获取视频属性+兼容
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = 25 if fps <= 0 or fps > 60 else fps
    print(f"[INFO] 视频属性：宽{width}×高{height}，帧率{fps}，总帧数{frame_count}")

    # 2. 初始化临时视频写入器（先生成临时文件）
    temp_video_name = get_unique_filename(".mp4")
    temp_video_path = os.path.join(TEMP_DIR, temp_video_name)
    fourcc = cv2.VideoWriter_fourcc(*VIDEO_ENCODE)
    print(f"[INFO] 尝试使用编码：{VIDEO_ENCODE}")
    out = cv2.VideoWriter(temp_video_path, fourcc, fps, (width, height))
    if not out.isOpened():
        cap.release()
        raise RuntimeError(f"视频写入器初始化失败，编码 {VIDEO_ENCODE} 不可支持，无法生成输出视频：{temp_video_path}")
    print(f"[INFO] 视频写入器初始化成功：{temp_video_path}")

    # 3. 逐帧检测+绘制，并累积鱼类统计（全视频汇总）
    detected_frame_num = 0  # 统计检测到目标的帧数
    total_frame_num = 0  # 统计总处理帧数
    total_cls_counts = {}  # 全视频检测到的鱼类 {class_id: total_count}
    while cap.isOpened():
        ret, frame = cap.read()
        total_frame_num += 1
        if not ret:
            break

        # YOLO检测
        cls_counts, results = detect_fish_single_frame(frame)
        boxes = results[0].boxes

        # 累积统计
        for cid, cnt in cls_counts.items():
            total_cls_counts[cid] = total_cls_counts.get(cid, 0) + cnt

        # 绘制检测框
        if len(boxes) > 0:
            detected_frame_num += 1
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                cls_id = int(box.cls.cpu().numpy())
                # 选择框颜色
                draw_color = COLOR_TOXIC if cls_id in toxic_fish_ids else (
                    COLOR_NON_TOXIC if cls_id in non_toxic_fish_ids else (128, 128, 128))
                cv2.rectangle(frame, (x1, y1), (x2, y2), draw_color, LINE_WIDTH)

        # 写入帧（必须执行，无论是否检测到目标）
        out.write(frame)

    # 4. 释放资源
    cap.release()
    out.release()
    print(f"[INFO] 视频处理完成，总处理帧数{total_frame_num}，检测到目标帧数{detected_frame_num}")

    # 5. 强校验临时视频
    if not os.path.exists(temp_video_path):
        raise RuntimeError(f"临时输出视频未生成：{temp_video_path}")
    temp_video_size = os.path.getsize(temp_video_path)
    if temp_video_size < 1024:  # 小于1K视为无效
        os.remove(temp_video_path)
        raise RuntimeError(f"临时输出视频无效（大小{temp_video_size}字节），可能是原视频无有效帧")

    # 6. 使用 moviepy 重新封装视频（添加浏览器需要的元数据）
    output_video_name = get_unique_filename(".mp4")
    output_video_path = os.path.join(OUTPUT_DIR, output_video_name)
    print(f"[INFO] 使用 moviepy 重新封装视频，生成浏览器兼容格式...")
    try:
        # 使用 moviepy 重新封装（自动修复元数据，使用 libx264 编码）
        clip = VideoFileClip(temp_video_path)
        clip.write_videofile(
            output_video_path,
            codec='libx264',
            audio=False,
            logger=None  # 禁用 moviepy 的详细日志
        )
        clip.close()
        # 删除临时文件
        os.remove(temp_video_path)
        print(f"[INFO] 临时文件已清理：{temp_video_path}")
    except Exception as e:
        # 如果 moviepy 失败，删除临时文件并抛出异常
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        raise RuntimeError(f"moviepy 重新封装失败：{str(e)}")

    # 7. 强校验最终输出视频
    if not os.path.exists(output_video_path):
        raise RuntimeError(f"最终输出视频未生成：{output_video_path}")
    video_size = os.path.getsize(output_video_path)
    if video_size < 1024:  # 小于1K视为无效
        os.remove(output_video_path)
        raise RuntimeError(f"最终输出视频无效（大小{video_size}字节）")
    print(f"[SUCCESS] 输出视频生成成功：{output_video_path}，大小：{round(video_size / 1024 / 1024, 2)}MB")

    # 8. 构造检测结果列表供前端科普报告使用
    detections = _build_detections_from_cls_counts(total_cls_counts)
    print(f"[INFO] 检测到的鱼类统计：{detections}")

    return output_video_path, detections, width, height


# 静态文件服务：提供检测结果视频/图片的HTTP访问
@app.route('/output_fish_video/<filename>')
@cross_origin()
def serve_output_video(filename):
    """提供输出视频的HTTP访问"""
    try:
        return send_from_directory(OUTPUT_DIR, filename, mimetype='video/mp4')
    except FileNotFoundError:
        return jsonify({"code": -1, "msg": "视频文件不存在"}), 404


@app.route('/output_fish_image/<filename>')
@cross_origin()
def serve_output_image(filename):
    """提供输出检测图片的HTTP访问"""
    try:
        return send_from_directory(OUTPUT_IMG_DIR, filename, mimetype='image/jpeg')
    except FileNotFoundError:
        return jsonify({"code": -1, "msg": "图片文件不存在"}), 404


def _build_detections_from_cls_counts(cls_counts):
    """根据类别统计构造 detections 列表"""
    detections = []
    for cls_id, count in cls_counts.items():
        cls_name = yolo_model.names.get(cls_id, f"class_{cls_id}")
        is_toxic = cls_id in toxic_fish_ids
        detections.append({
            "class_id": cls_id,
            "class_name": cls_name,
            "count": count,
            "is_toxic": is_toxic
        })
    return detections


# 图片检测接口
@app.route('/DETECT_FISH_IMAGE', methods=['POST'])
@cross_origin()
def fish_image_detection_api():
    temp_img_path = ""
    try:
        if 'image_file' not in request.files:
            return jsonify({"code": -1, "msg": "传参错误！仅支持 form-data 传 image_file"}), 400
        img_file = request.files['image_file']
        if img_file.filename == '':
            return jsonify({"code": -1, "msg": "未选择图片文件"}), 400

        # 保存临时文件
        ext = os.path.splitext(img_file.filename)[1] or '.jpg'
        temp_img_name = get_unique_filename(ext)
        temp_img_path = os.path.join(TEMP_DIR, temp_img_name)
        img_file.save(temp_img_path)

        # 读取并检测
        frame = cv2.imread(temp_img_path)
        if frame is None:
            return jsonify({"code": -1, "msg": "无法读取图片，请检查格式（支持 JPG/PNG）"}), 400

        cls_counts, results = detect_fish_single_frame(frame)
        boxes = results[0].boxes

        # 绘制检测框并保存
        if len(boxes) > 0:
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                cls_id = int(box.cls.cpu().numpy())
                draw_color = COLOR_TOXIC if cls_id in toxic_fish_ids else (
                    COLOR_NON_TOXIC if cls_id in non_toxic_fish_ids else (128, 128, 128))
                cv2.rectangle(frame, (x1, y1), (x2, y2), draw_color, LINE_WIDTH)

        output_img_name = get_unique_filename(".jpg")
        output_img_path = os.path.join(OUTPUT_IMG_DIR, output_img_name)
        cv2.imwrite(output_img_path, frame)

        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)

        detections = _build_detections_from_cls_counts(cls_counts)
        image_play_url = f"http://localhost:5000/output_fish_image/{output_img_name}"

        return jsonify({
            "code": 1,
            "msg": "图片鱼检测成功",
            "result": {
                "image_play_url": image_play_url,
                "image_filename": output_img_name,
                "detections": detections
            }
        })
    except Exception as e:
        traceback.print_exc()
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)
        return jsonify({"code": -1, "msg": f"图片鱼检测失败：{str(e)}"}), 500


# 接口+全链路日志+异常兜底
@app.route('/DETECT_FISH_VIDEO', methods=['POST'])
@cross_origin()
def fish_video_detection_api():
    temp_video_path = ""
    try:
        # 生成临时文件
        temp_video_name = get_unique_filename(".mp4")
        temp_video_path = os.path.join(TEMP_DIR, temp_video_name)
        print(f"[INFO] 初始化临时视频文件：{temp_video_path}")

        # 处理form-data上传（你前端用的是这个方式，重点支持）
        if 'video_file' in request.files:
            video_file = request.files['video_file']
            if video_file.filename == '':
                return jsonify({"code": -1, "msg": "未选择视频文件"}), 400
            # 保存临时文件
            video_file.save(temp_video_path)
            print(f"[INFO] 接收到前端上传视频：{video_file.filename}，保存到{temp_video_path}")
        else:
            return jsonify({"code": -1, "msg": "传参错误！仅支持form-data传video_file"}), 400

        # 核心检测（返回视频路径 + 检测到的鱼类列表 + 视频宽高供前端比例适配）
        output_video_path, detections, video_width, video_height = detect_fish_from_video(temp_video_path)

        # 清理临时文件
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
            print(f"[INFO] 清理临时文件：{temp_video_path}")

        # 返回结果：视频URL + 检测到的鱼类科普数据
        video_filename = os.path.basename(output_video_path)
        video_abs_path = os.path.abspath(output_video_path)
        video_play_url = f"http://localhost:5000/output_fish_video/{video_filename}"  # 后端静态服务
        return jsonify({
            "code": 1,
            "msg": "视频鱼检测成功",
            "result": {
                "video_play_url": video_play_url,
                "video_local_path": video_abs_path,
                "video_filename": video_filename,
                "video_width": video_width,
                "video_height": video_height,
                "detections": detections
            }
        })

    except Exception as e:
        # 异常日志+清理临时文件
        traceback.print_exc()
        print(f"[ERROR] 检测失败：{str(e)}")
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        return jsonify({
            "code": -1,
            "msg": f"视频鱼检测失败：{str(e)}"
        }), 500


if __name__ == '__main__':
    print(f"[INFO] 后端服务启动成功，地址：http://0.0.0.0:5000")
    app.run(host='0.0.0.0', debug=False, port=5000)

