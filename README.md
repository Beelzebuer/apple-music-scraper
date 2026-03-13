# 🎵 Apple Music Scraper

一个优雅的 Apple Music 专辑信息抓取工具，采用苹果官网设计风格，支持单条和批量抓取，可导出 JSON 和 Excel 格式。

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ 功能特性

- 🎯 **单条抓取** - 输入 Apple Music 专辑链接，即时获取完整信息
- 🚀 **批量抓取** - 支持一次抓取多个专辑，实时显示进度
- 🎨 **苹果风格设计** - 简洁优雅的界面，致敬 Apple Design
- 📊 **数据导出** - 支持 JSON 和 Excel 两种格式
- 📱 **响应式布局** - 完美适配桌面和移动设备
- ⚡ **轻量快速** - 纯 Python 实现，无需浏览器驱动

## 🖼️ 界面预览

```
┌─────────────────────────────────────────┐
│  🎵 Apple Music Scraper                 │
├─────────────────────────────────────────┤
│                                         │
│     [ 单条抓取 ]  [ 批量抓取 ]          │
│                                         │
│    ┌─────────────────────────────┐      │
│    │ 粘贴 Apple Music 链接...    │  🔵  │
│    └─────────────────────────────┘      │
│                                         │
│    [ 📀 专辑封面 ]                      │
│    原神-朔望凝待之庭                    │
│    HOYO-MiX · 2026-03-11 · 73首         │
│                                         │
│    [下载 JSON]  [下载 Excel]            │
│                                         │
└─────────────────────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Python 3.8+
- pip

### 安装

```bash
# 克隆项目
git clone https://github.com/yourusername/apple-music-scraper.git
cd apple-music-scraper

# 安装依赖
pip install -r requirements.txt
```

### 运行

```bash
python app.py
```

然后浏览器访问: **http://localhost:8765**

## 📖 使用说明

### 单条抓取

1. 在 Apple Music 网页版中找到专辑页面
2. 复制浏览器地址栏的链接
3. 粘贴到输入框，点击"抓取"
4. 等待结果显示，可下载 JSON 或 Excel

### 批量抓取

1. 切换到"批量抓取"模式
2. 每行输入一个专辑链接（最多 50 个）
3. 点击"批量抓取"按钮
4. 等待进度完成，下载全部数据

### 数据格式

**JSON 格式**
```json
{
  "album_name": "原神-朔望凝待之庭",
  "artist": "HOYO-MiX",
  "release_date": "2026-03-11",
  "cover_url": "https://...",
  "track_count": 73,
  "tracks": [
    {
      "index": 1,
      "name": "誓勇之心",
      "duration": "2:23",
      "play_url": "https://...",
      "preview_url": "https://..."
    }
  ]
}
```

**Excel 格式**

批量导出时包含多个 Sheet：
- `专辑汇总` - 所有专辑的基本信息
- `专辑1名称` - 第一张专辑的详细歌曲列表
- `专辑2名称` - 第二张专辑的详细歌曲列表
- ...

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| **Flask** | Python Web 框架 |
| **Tailwind CSS** | 原子化 CSS 框架 |
| **Requests** | HTTP 请求库 |
| **OpenPyXL** | Excel 文件生成 |
| **JSON-LD** | 网页结构化数据解析 |

## 📁 项目结构

```
apple-music-scraper/
├── app.py                 # Flask 主应用
├── scraper.py             # 爬虫核心模块
├── templates/
│   └── index.html         # 前端页面
├── static/js/
│   └── app.js             # 前端交互逻辑
├── requirements.txt       # 依赖列表
├── README.md              # 项目说明
└── .gitignore             # Git 忽略文件
```

## ⚠️ 免责声明

本项目仅供学习和个人使用，请遵守 Apple Music 的服务条款。使用本项目产生的任何责任和风险由使用者自行承担。

