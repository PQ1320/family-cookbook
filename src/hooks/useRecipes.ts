/**
 * 菜谱 CRUD 操作 Hooks
 * 封装所有 IndexedDB 菜谱相关操作
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/database';
import type { Recipe, Category } from '../types';
import { generateId } from '../utils';

/** 获取所有菜谱 */
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await db.recipes.orderBy('createdAt').reverse().toArray();
    setRecipes(all);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { recipes, loading, reload: load };
}

/** 按分类获取菜谱 */
export function useRecipesByCategory(category: Category | null) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let all: Recipe[];
    if (category) {
      all = await db.recipes
        .where('category')
        .equals(category)
        .reverse()
        .sortBy('createdAt');
    } else {
      all = await db.recipes.orderBy('createdAt').reverse().toArray();
    }
    setRecipes(all);
    setLoading(false);
  }, [category]);

  useEffect(() => { load(); }, [load]);

  return { recipes, loading, reload: load };
}

/** 获取单个菜谱 */
export function useRecipe(id: string | undefined) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    db.recipes.get(id).then((r) => {
      setRecipe(r ?? null);
      setLoading(false);
    });
  }, [id]);

  return { recipe, loading };
}

/** 添加菜谱 */
export async function addRecipe(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = generateId();
  const now = Date.now();
  await db.recipes.put({ ...data, id, createdAt: now, updatedAt: now });
  return id;
}

/** 更新菜谱 */
export async function updateRecipe(id: string, data: Partial<Omit<Recipe, 'id' | 'createdAt'>>): Promise<void> {
  await db.recipes.update(id, { ...data, updatedAt: Date.now() });
}

/** 删除菜谱 */
export async function deleteRecipe(id: string): Promise<void> {
  // 同时删除关联的烹饪记录
  await db.cookingRecords.where('recipeId').equals(id).delete();
  await db.recipes.delete(id);
}

/** 搜索菜谱 */
export async function searchRecipes(keyword: string): Promise<Recipe[]> {
  if (!keyword.trim()) {
    return db.recipes.orderBy('createdAt').reverse().toArray();
  }
  // IndexedDB 不支持模糊搜索，先取全部再前端过滤
  const all = await db.recipes.orderBy('createdAt').reverse().toArray();
  const kw = keyword.toLowerCase();
  return all.filter((r) => r.name.toLowerCase().includes(kw));
}

// ===== 评分 =====

/** 更新菜谱评分 */
export async function updateRating(
  recipeId: string,
  field: 'myRating' | 'wifeRating',
  value: number,
): Promise<void> {
  await db.updateRating(recipeId, field, value);
}

// ===== 烹饪记录 =====

export { db };
