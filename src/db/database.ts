/**
 * IndexedDB 数据库实例（基于 Dexie.js）
 * 管理所有本地数据表：菜谱、烹饪记录、今日菜谱、冰箱库存、应用设置
 */

import Dexie, { type Table } from 'dexie';
import type { Recipe, CookingRecord, DailyMenu, FridgeItem, AppSettings } from '../types';
import { generateId } from '../utils';

/** 家庭菜谱数据库 */
class FoodDatabase extends Dexie {
  recipes!: Table<Recipe, string>;
  cookingRecords!: Table<CookingRecord, string>;
  dailyMenus!: Table<DailyMenu, string>;
  fridgeItems!: Table<FridgeItem, string>;
  appSettings!: Table<AppSettings, string>;

  constructor() {
    super('FoodDatabase');

    this.version(1).stores({
      // 主键为 id，索引字段用 & 前缀
      recipes: 'id, name, category, tags, createdAt',
      cookingRecords: 'id, recipeId, createdAt',
      dailyMenus: 'id, date',
      fridgeItems: 'id, name, createdAt',
      appSettings: 'id',
    });
  }

  /** 初始化默认设置（仅首次运行） */
  async initSettings(): Promise<void> {
    const existing = await this.appSettings.get('singleton');
    if (!existing) {
      await this.appSettings.put({
        id: 'singleton',
        aiEnabled: false,
        aiApiKey: 'sk-99ec830fa57a444aacaf506e835771cf',
        userName: '用户1',
        wifeName: '用户2',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      // 迁移旧设置：补充缺失字段
      if (!existing.userName) {
        await this.appSettings.update('singleton', { userName: '用户1' });
      }
      if (!existing.wifeName) {
        await this.appSettings.update('singleton', { wifeName: '用户2' });
      }
    }
  }

  /** 更新菜谱评分 */
  async updateRating(recipeId: string, field: 'myRating' | 'wifeRating', value: number): Promise<void> {
    await this.recipes.update(recipeId, { [field]: value } as Partial<Recipe>);
  }

  /** 获取菜谱的烹饪记录（倒序） */
  async getRecords(recipeId: string): Promise<CookingRecord[]> {
    return this.cookingRecords.where('recipeId').equals(recipeId).reverse().sortBy('createdAt');
  }

  /** 添加烹饪记录 */
  async addRecord(recipeId: string, text: string, image?: string): Promise<string> {
    const id = generateId();
    await this.cookingRecords.put({ id, recipeId, text, image, createdAt: Date.now() });
    return id;
  }

  /** 删除烹饪记录 */
  async deleteRecord(id: string): Promise<void> {
    await this.cookingRecords.delete(id);
  }

  /** 获取今日菜单 */
  async getTodayMenu(): Promise<DailyMenu | undefined> {
    const today = new Date().toISOString().slice(0, 10);
    const all = await this.dailyMenus.where('date').equals(today).toArray();
    return all[0];
  }

  /** 添加菜谱到今日菜单（购物车式） */
  async addToTodayMenu(recipeId: string): Promise<void> {
    const existing = await this.getTodayMenu();
    if (existing) {
      if (existing.recipeIds.includes(recipeId)) return; // 已存在
      await this.dailyMenus.update(existing.id, {
        recipeIds: [...existing.recipeIds, recipeId],
      });
    } else {
      await this.dailyMenus.put({
        id: generateId(),
        date: new Date().toISOString().slice(0, 10),
        recipeIds: [recipeId],
        generatedBy: 'manual',
        createdAt: Date.now(),
      });
    }
  }

  /** 从今日菜单移除菜谱 */
  async removeFromTodayMenu(recipeId: string): Promise<void> {
    const existing = await this.getTodayMenu();
    if (existing) {
      await this.dailyMenus.update(existing.id, {
        recipeIds: existing.recipeIds.filter((id) => id !== recipeId),
      });
    }
  }

  /** 清空今日菜单 */
  async clearTodayMenu(): Promise<void> {
    const existing = await this.getTodayMenu();
    if (existing) {
      await this.dailyMenus.delete(existing.id);
    }
  }

  /** 添加冰箱食材 */
  async addFridgeItem(name: string, quantity: number, unit: string, category?: string): Promise<void> {
    await this.fridgeItems.put({
      id: generateId(),
      name, quantity, unit, category,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  /** 删除冰箱食材 */
  async deleteFridgeItem(id: string): Promise<void> {
    await this.fridgeItems.delete(id);
  }

  /** 更新冰箱食材数量 */
  async updateFridgeQuantity(id: string, quantity: number): Promise<void> {
    await this.fridgeItems.update(id, { quantity, updatedAt: Date.now() });
  }

  /** 获取所有冰箱食材 */
  async getFridgeItems(): Promise<FridgeItem[]> {
    return this.fridgeItems.orderBy('createdAt').reverse().toArray();
  }
}

/** 数据库单例 */
export const db = new FoodDatabase();
