<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MarkPrint

Markdown 转 PDF 工具，支持 LaTeX 数学公式、自定义字体、背景配置。

## 核心功能

| 模块 | 功能 | 描述 |
|------|------|------|
| 编辑器 | 实时编辑 | Markdown 文本编辑，支持语法高亮 |
| 编辑器 | 视图模式 | 纯编辑(WRITE)、分屏(SPLIT)、纯预览(PREVIEW) |
| 编辑器 | 字体选择 | Inter、Merriweather、Roboto、Lora |
| 解析 | Markdown 转 HTML | 支持 GFM 扩展语法 |
| 解析 | LaTeX 数学公式 | 行内 `$...$` 和块级 `$$...$$` |
| 解析 | 图片对齐 | 7 种对齐方式 (left/right/center/full/float-left/float-right) |
| 导出 | 自动分页 | 基于 A4 尺寸自动计算分页 |
| 导出 | PDF 导出 | A4 格式高质量导出 |

## 技术栈

| 类别 | 技术 | 版本 | 来源 |
|------|------|------|------|
| 语言 | TypeScript | 5.8.2 | npm |
| 前端框架 | React | 19.2.0 | npm |
| 构建工具 | Vite | 6.2.0 | npm |
| 样式框架 | Tailwind CSS | - | CDN |
| Markdown 解析 | marked.js | - | CDN |
| 数学公式 | KaTeX | 0.16.9 | CDN |
| PDF 生成 | html2pdf.js | 0.10.1 | CDN |

## 项目结构

```
d:\Workspace\MD2PDF\
├── App.tsx              # 主应用组件
├── index.tsx            # React 入口
├── index.html           # HTML 模板 (含 CDN 脚本)
├── types.ts             # TypeScript 类型定义
├── components/
│   ├── Preview.tsx      # 预览组件 (分页核心)
│   └── Icons.tsx        # SVG 图标库
├── utils/
│   └── pdfUtils.ts      # PDF 导出工具
├── package.json         # 依赖配置
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 构建配置
```

## 运行指南

### 环境要求

- Node.js (推荐 v18+)

### 本地运行

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`

2. Run the app:
   `npm run dev`

3. Open http://localhost:3000 in your browser.

### 构建部署

```bash
npm run build    # 构建生产版本到 dist/
npm run preview  # 预览构建结果
```

## Frontmatter 配置

支持在 Markdown 文档开头使用 YAML 格式配置：

```yaml
---
header: CONFIDENTIAL DOCUMENT   # 页眉文字
date: true                       # 显示当前日期 (或自定义日期字符串)
bg-image: https://...            # 背景图片 URL
bg-opacity: 0.5                  # 背景透明度
bg-rotate: 0                     # 背景旋转角度
bg-fit: cover                    # 背景适配方式 (cover/contain)
bg-size: 50%                     # 背景尺寸
bg-repeat: no-repeat             # 背景重复方式
---
```

## 图片对齐语法

在图片 URL 后添加 hash 参数控制对齐：

| 语法 | 效果 |
|------|------|
| `![](image.png#left)` | 左对齐 |
| `![](image.png#right)` | 右对齐 |
| `![](image.png#center)` | 居中 |
| `![](image.png#full)` | 全宽 |
| `![](image.png#float-left)` | 左浮动 |
| `![](image.png#float-right)` | 右浮动 |

## License

MIT
