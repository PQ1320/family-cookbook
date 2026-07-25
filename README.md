# 🍳 家庭菜谱 — Family Cookbook

极简暖色风格的家庭菜谱管理 PWA 应用。记录菜谱、双人评分、烹饪记录、今日菜单生成。

## 技术栈

- **框架**: React 19 + TypeScript
- **构建**: Vite 8
- **样式**: Tailwind CSS 4
- **数据库**: IndexedDB（Dexie.js）
- **PWA**: vite-plugin-pwa + Workbox
- **路由**: React Router 7

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 开发模式
npm run build    # 构建生产版本(dist/)
npm run preview  # 预览生产版本
```

## 项目结构

```
src/
├── components/
│   ├── BottomNav.tsx       # 底部导航
│   ├── CookingRecords.tsx  # 烹饪记录（发布+时间线）
│   ├── ImageUploader.tsx   # 封面图片上传+压缩
│   ├── RecipeCard.tsx      # 菜谱卡片
│   ├── StarRating.tsx      # 交互式星级评分
│   └── TagSelector.tsx     # 折叠标签选择器
├── db/
│   └── database.ts         # Dexie 实例 + 所有表操作
├── hooks/
│   ├── useRecipes.ts       # 菜谱 CRUD + 评分 + 烹饪记录
│   └── useSettings.ts      # 全局设置
├── pages/
│   ├── RecipeListPage.tsx  # 菜谱列表（分类+榜单+搜索）
│   ├── RecipeFormPage.tsx  # 新增/编辑菜谱（含AI OCR）
│   ├── RecipeDetailPage.tsx # 菜谱详情（评分+记录）
│   ├── FridgePage.tsx      # 冰箱库存
│   ├── DailyMenuPage.tsx   # 今日菜单（食材汇总+时间线）
│   └── ProfilePage.tsx     # 设置（昵称+AI+数据管理）
├── types/
│   └── index.ts            # 数据模型+预设标签+分类
├── utils/
│   └── index.ts            # ID生成、图片压缩、时间格式化
├── App.tsx
└── main.tsx
```

## 功能

| 模块 | 功能 |
|------|------|
| 🍳 菜谱 | 创建/编辑/删除，分类筛选，标签系统，封面照片 |
| ⭐ 评分 | 双人独立 1-5 星评分 |
| 📝 烹饪记录 | 图文记录发布，朋友圈式时间线 |
| 📅 今日菜单 | 购物车式添加菜谱，食材自动合并汇总，烹饪时间线 |
| ⚙️ 设置 | 昵称自定义、AI 开关、数据管理 |

## 移动端安装

华为手机：
1. 华为浏览器打开应用地址
2. 菜单 → 「添加到桌面」
3. 之后像 App 一样打开，离线可用

## 数据存储

所有数据完全存储在手机本地 IndexedDB 中，不需要网络，换手机需重新创建。
