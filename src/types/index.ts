/**
 * 家庭菜谱管理应用 - 类型定义
 * 所有数据模型的 TypeScript 接口
 */

// ===== 菜谱相关 =====

/** 菜谱分类 */
export type Category = '主食' | '蔬菜' | '肉类' | '汤' | '甜品' | '水果' | '饮品';

/** 材料 */
export interface Ingredient {
  name: string;                  // 材料名
  amount: string;                // 用量
  unit: string;                  // 单位（克/个/勺/适量...）
}

/** 制作步骤 */
export interface Step {
  order: number;                 // 步骤序号
  description: string;           // 步骤描述
  durationMinutes: number;       // 预计耗时（分钟）
}

/** 菜谱 */
export interface Recipe {
  id: string;                    // UUID
  name: string;                  // 菜名
  coverImage: string;            // 封面照片 Base64
  category: Category;            // 分类
  tags: string[];                // 标签数组（含辣度、季节、烹饪方式等）
  calories: number;              // 热量（千卡），默认 0
  ingredients: Ingredient[];     // 材料列表
  steps: Step[];                 // 制作步骤
  myRating: number;              // 我的评分 1-5，默认 0（未评分）
  wifeRating: number;            // 老婆评分 1-5，默认 0（未评分）
  createdAt: number;             // 创建时间戳
  updatedAt: number;             // 更新时间戳
}

// ===== 烹饪记录 =====

/** 烹饪记录（评论） */
export interface CookingRecord {
  id: string;                    // UUID
  recipeId: string;              // 关联菜谱 ID
  image?: string;                // 照片 Base64（可选）
  text: string;                  // 文字评论
  createdAt: number;             // 创建时间戳
}

// ===== 今日菜谱 =====

/** 生成方式 */
export type GeneratedBy = 'ai' | 'manual';

/** 今日菜谱 */
export interface DailyMenu {
  id: string;                    // UUID
  date: string;                  // 日期 YYYY-MM-DD
  recipeIds: string[];           // 选中的菜谱 ID 列表
  generatedBy: GeneratedBy;      // 生成方式
  createdAt: number;             // 创建时间戳
}

// ===== 冰箱库存 =====

/** 冰箱库存食材 */
export interface FridgeItem {
  id: string;                    // UUID
  name: string;                  // 食材名称
  quantity: number;              // 数量
  unit: string;                  // 单位（个/斤/包/把...）
  category?: string;             // 可选分类
  createdAt: number;             // 添加时间戳
  updatedAt: number;             // 更新时间戳
}

// ===== 应用设置 =====

/** 应用设置 */
export interface AppSettings {
  id: string;                    // 固定为 'singleton'
  aiEnabled: boolean;            // AI 总开关，默认 false
  aiApiKey: string;              // AI API Key
  userName: string;              // 昵称，默认 "我"
  wifeName: string;              // 老婆昵称，默认 "老婆"
  createdAt: number;
  updatedAt: number;
}

// ===== 菜谱匹配度 =====

/** 菜谱与库存的匹配度信息 */
export interface RecipeMatch {
  recipeId: string;
  matchRate: number;             // 匹配率 0-1
  matchedIngredients: string[];  // 已匹配的食材名称
  missingIngredients: string[];  // 缺失的食材名称
}

// ===== 预设标签选项 =====

/** 预设标签 */
export const PRESET_TAGS: Record<string, string[]> = {
  '辣度': ['不辣', '微辣', '中辣', '重辣'],
  '季节': ['春季时令', '夏季清爽', '秋季滋补', '冬季暖身'],
  '烹饪方式': ['炒', '蒸', '煮', '炖', '烤', '凉拌', '煎', '炸'],
  '场景': ['家常', '宴客', '快手菜', '下酒菜'],
};

/** 分类列表（按显示顺序） */
export const CATEGORY_LIST: Category[] = ['主食', '蔬菜', '肉类', '汤', '甜品', '水果', '饮品'];

/** 分类图标映射（年轻可爱风格） */
export const CATEGORY_ICONS: Record<Category, string> = {
  '主食': '🍜',
  '蔬菜': '🥦',
  '肉类': '🍖',
  '汤': '🍵',
  '甜品': '🍮',
  '水果': '🍓',
  '饮品': '🧃',
};
