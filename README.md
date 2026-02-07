# OceanEyes - 智能水下生物识别系统

## 项目概述

OceanEyes 是一个基于 YOLOv8 算法的智能水下生物识别系统，旨在提供准确、高效的鱼类和海洋生物识别与监测解决方案。该系统可应用于海洋生物学研究、鱼类种群监测、水下生态环境评估等多个领域。

## 项目结构

```
Ocean Eyes/
├── detect/                    # 检测模块
│   ├── Fish-Detection-YOLOv8-main/  # YOLOv8 鱼类检测实现
│   │   ├── backend/           # 后端服务
│   │   │   ├── app.py         # FastAPI 应用主文件
│   │   │   ├── requirements.txt  # 后端依赖
│   │   │   └── __pycache__/   # Python 编译缓存
│   │   ├── output_video/      # 检测结果视频
│   │   ├── runs/              # 模型训练和验证结果
│   │   │   ├── detect/        # 检测相关结果
│   │   │   │   ├── train/     # 训练结果
│   │   │   │   └── val/       # 验证结果
│   │   ├── test/              # 测试数据
│   │   │   ├── images/        # 测试图像
│   │   │   └── labels/        # 测试标签
│   │   └── ...                # 其他文件
│   └── oceaneyes---ai-underwater-assistant/  # 前端应用
│       ├── android/           # Android 应用
│       ├── components/        # React 组件
│       ├── dist/              # 构建输出
│       ├── marine_clean_images/  # 海洋生物图像
│       ├── .env.local         # 环境变量配置
│       ├── App.tsx            # 前端应用主文件
│       ├── index.html         # HTML 入口文件
│       ├── package.json       # 前端依赖
│       └── ...                # 其他文件
├── README.md                  # 项目说明文档
└── requirements.txt           # 项目依赖
```

## 功能特点

- **先进的检测模型**：使用 YOLOv8 算法，实现高精度的鱼类和海洋生物检测
- **实时处理能力**：支持视频流的实时处理和分析
- **完整的工作流程**：包含数据准备、模型训练、评估和部署的完整流程
- **Web API 接口**：提供 FastAPI 后端服务，方便集成到其他系统
- **可视化结果**：生成带有人工智能标注的检测结果视频
- **多平台支持**：包含 Web 前端和 Android 应用
- **用户友好界面**：直观的操作界面，支持摄像头录制和本地文件上传
- **多语言支持**：支持中文和英文界面切换

## 技术栈

### 后端

- **Python**：主要开发语言
- **YOLOv8**：目标检测算法
- **FastAPI**：后端 Web 框架
- **OpenCV**：图像处理库
- **NumPy**：科学计算库

### 前端

- **React**：前端框架
- **TypeScript**：类型安全的 JavaScript 超集
- **Tailwind CSS**：实用优先的 CSS 框架
- **Vite**：现代前端构建工具
- **Lucide React**：图标库
- **Capacitor**：跨平台移动应用开发框架

## 安装说明

### 1. 克隆项目

```bash
git clone <repository-url>
cd Ocean Eyes
```

### 2. 后端安装

#### 2.1 安装后端依赖

```bash
pip install -r requirements.txt
```

#### 2.2 下载预训练模型

项目已包含训练好的模型，位于 `detect/Fish-Detection-YOLOv8-main/runs/detect/train/weights/best.pt`。

### 3. 前端安装

#### 3.1 安装 Node.js

前端使用 React 开发，需要先安装 Node.js（推荐版本 16.0+）。

#### 3.2 安装前端依赖

```bash
cd ../../oceaneyes---ai-underwater-assistant
npm install
```

#### 3.3 配置环境变量

在 `.env.local` 文件中设置 Gemini API 密钥：

```
GEMINI_API_KEY=your_api_key_here
```

## 使用方法

### 1. 运行后端服务

```bash
cd detect/Fish-Detection-YOLOv8-main/backend
start python app.py
```

服务将在 `http://localhost:8000` 启动。

### 2. 运行前端应用

```bash
cd ../../oceaneyes---ai-underwater-assistant
npm run dev
```

前端应用将在 `http://localhost:3000` 启动。

### 3. 测试鱼类检测

可以使用 `app_run.py` 脚本测试鱼类检测功能：

```bash
cd detect/Fish-Detection-YOLOv8-main
python app_run.py
```

### 4. API 接口

服务启动后，可以通过以下 API 接口进行鱼类检测：

- **POST /detect**：上传图像或视频进行鱼类检测
- **GET /health**：检查服务健康状态

### 5. 前端功能

前端应用提供以下功能：

- **上传图像/视频**：支持上传本地图像或视频进行检测
- **摄像头录制**：支持使用摄像头录制视频进行实时检测
- **实时检测**：支持摄像头实时检测模式
- **结果展示**：生成带有人工智能标注的检测结果视频
- **多语言支持**：支持中文和英文界面切换
- **海洋生物百科**：提供海洋生物的详细信息

## 模型训练

如果需要重新训练模型，可以使用以下命令：

```bash
cd detect/Fish-Detection-YOLOv8-main
yolo detect train data=data.yaml model=yolov8n.pt epochs=100 batch=16
```

## 测试结果

模型在测试数据集上表现良好，检测精度高，能够识别多种鱼类和海洋生物。测试结果保存在 `detect/Fish-Detection-YOLOv8-main/runs/detect/val/` 目录下。

## 应用场景

- **海洋生物学研究**：自动识别和计数鱼类，减少人工工作量
- **渔业资源监测**：实时监测鱼类种群数量和分布
- **水下生态环境评估**：评估水下生态系统的健康状况
- **水族馆管理**：自动化监控水族馆内鱼类状态
- **环保监测**：监测水域生态系统健康状况

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请联系项目维护者。
