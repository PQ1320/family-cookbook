/**
 * 工具函数
 */

import type { Recipe } from '../types';

/** 生成简单 UUID（浏览器环境兼容，含 HTTP 备用方案） */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // HTTP 环境备用
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** 截断文字（用于列表预览） */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/** 格式化时间戳为可读时间 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 1 分钟内
  if (diff < 60_000) return '刚刚';
  // 1 小时内
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  // 24 小时内
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  // 7 天内
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)} 天前`;

  // 超过 7 天显示日期
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 格式化日期（YYYY-MM-DD） */
export function formatDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ===== AI 匹配引擎 =====

/** 关键词 → 标签/分类/烹饪方式/场景的映射表 */
const KEYWORD_MAP: Record<string, { tags?: string[]; categories?: string[]; calorieRange?: [number, number] }> = {
  // 口味
  '辣': { tags: ['微辣', '中辣', '重辣'] },
  '不辣|清淡|清谈': { tags: ['不辣'] },
  '甜': { categories: ['甜品'] },
  '咸': { tags: ['家常', '下酒菜'] },

  // 烹饪方式
  '炒': { tags: ['炒'] },
  '蒸': { tags: ['蒸'] },
  '煮': { tags: ['煮'] },
  '炖': { tags: ['炖'] },
  '烤': { tags: ['烤'] },
  '凉拌|凉菜|冷菜': { tags: ['凉拌'] },
  '煎': { tags: ['煎'] },
  '炸': { tags: ['炸'] },

  // 场景
  '家常|平时': { tags: ['家常'] },
  '宴客|请客|聚会': { tags: ['宴客'] },
  '快手|快点|简单|快': { tags: ['快手菜'] },
  '下酒|喝酒': { tags: ['下酒菜'] },

  // 季节
  '春天|春季|春': { tags: ['春季时令'] },
  '夏天|夏季|夏': { tags: ['夏季清爽'] },
  '秋天|秋季|秋': { tags: ['秋季滋补'] },
  '冬天|冬季|冬': { tags: ['冬季暖身'] },

  // 分类
  '主食|饭|面|米饭|面条': { categories: ['主食'] },
  '蔬菜|菜|素': { categories: ['蔬菜'] },
  '肉|荤': { categories: ['肉类'] },
  '汤': { categories: ['汤'] },
  '甜品|点心|甜点': { categories: ['甜品'] },
  '水果': { categories: ['水果'] },
  '饮品|饮料|喝': { categories: ['饮品'] },

  // 热量
  '低热量|减肥|低卡': { calorieRange: [0, 200] },
  '高热量|丰盛': { calorieRange: [300, 9999] },
};

/** 根据自然语言提示匹配菜谱 */
export function matchRecipes(prompt: string, recipes: Recipe[]): Recipe[] {
  const input = prompt.toLowerCase();
  const matchedTags = new Set<string>();
  const matchedCategories = new Set<string>();
  let calorieRange: [number, number] | null = null;

  // 关键词匹配
  for (const [keys, mapping] of Object.entries(KEYWORD_MAP)) {
    const hit = keys.split('|').some((k) => input.includes(k));
    if (hit) {
      mapping.tags?.forEach((t) => matchedTags.add(t));
      mapping.categories?.forEach((c) => matchedCategories.add(c));
      if (mapping.calorieRange) calorieRange = mapping.calorieRange;
    }
  }

  // 如果没有任何关键词匹配，按菜名模糊搜索
  if (matchedTags.size === 0 && matchedCategories.size === 0 && !calorieRange) {
    return recipes.filter((r) =>
      r.name.toLowerCase().includes(input) ||
      r.ingredients.some((ing) => ing.name.toLowerCase().includes(input)),
    ).slice(0, 6);
  }

  // 多条件加权匹配
  const scored = recipes.map((r) => {
    let score = 0;
    // 标签匹配
    for (const tag of r.tags) {
      if (matchedTags.has(tag)) score += 2;
    }
    // 分类匹配
    if (matchedCategories.has(r.category)) score += 3;
    // 热量匹配
    if (calorieRange) {
      const [lo, hi] = calorieRange;
      if (r.calories >= lo && r.calories <= hi) score += 2;
    }
    // 菜名包含关键词加分
    const nameInInput = [...matchedTags, ...matchedCategories].some(
      (k) => r.name.includes(k),
    );
    if (nameInInput) score += 1;

    return { recipe: r, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.recipe);
}

/** 压缩图片（限制最大宽度为 800px） */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context 创建失败'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}
