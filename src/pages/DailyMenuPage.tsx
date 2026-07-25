/**
 * 今日菜谱页 — 从数据库读取今日菜单
 * 食材汇总 + 烹饪时间线
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { db } from '../db/database';
import { CATEGORY_ICONS } from '../types';
import { matchRecipes } from '../utils';
import type { Recipe, FridgeItem } from '../types';

export default function DailyMenuPage() {
  const { recipes, loading: recipesLoading } = useRecipes();
  const [todayMenuIds, setTodayMenuIds] = useState<Set<string>>(new Set());
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResults, setAiResults] = useState<Recipe[] | null>(null);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);

  const loadMenu = useCallback(async () => {
    const [menu, fridge] = await Promise.all([db.getTodayMenu(), db.getFridgeItems()]);
    setTodayMenuIds(new Set(menu?.recipeIds ?? []));
    setFridgeItems(fridge);
    setLoadingMenu(false);
  }, []);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  // AI 智能搜索
  const handleAISearch = () => {
    if (!aiPrompt.trim() || recipes.length === 0) return;
    const results = matchRecipes(aiPrompt.trim(), recipes);
    setAiResults(results);
  };

  const addAiRecipeToMenu = useCallback(async (recipeId: string) => {
    await db.addToTodayMenu(recipeId);
    await loadMenu();
  }, [loadMenu]);

  // 已选菜谱（来自数据库的今日菜单）
  const selectedRecipes = useMemo(() => {
    return recipes.filter((r) => todayMenuIds.has(r.id));
  }, [recipes, todayMenuIds]);

  const removeFromMenu = useCallback(async (recipeId: string) => {
    await db.removeFromTodayMenu(recipeId);
    await loadMenu();
  }, [loadMenu]);

  const clearMenu = useCallback(async () => {
    if (!confirm('确定清空今日菜单吗？')) return;
    await db.clearTodayMenu();
    await loadMenu();
  }, [loadMenu]);

  // 食材汇总
  const mergedIngredients = useMemo(() => {
    const map = new Map<string, { amount: number; unit: string }>();
    for (const recipe of selectedRecipes) {
      for (const ing of recipe.ingredients) {
        const key = `${ing.name}|${ing.unit}`;
        const existing = map.get(key);
        if (existing) {
          existing.amount += parseFloat(ing.amount) || 0;
        } else {
          map.set(key, { amount: parseFloat(ing.amount) || 1, unit: ing.unit });
        }
      }
    }
    return Array.from(map.entries()).map(([key, val]) => {
      const [name] = key.split('|');
      return { name, amount: val.amount, unit: val.unit };
    });
  }, [selectedRecipes]);

  // 冰箱对比：已有 vs 需购买（含数量对比）
  const { hasIngredients, needToBuy } = useMemo(() => {
    // 冰箱食材名 → 数量映射
    const fridgeMap = new Map<string, number>();
    for (const f of fridgeItems) {
      fridgeMap.set(f.name, (fridgeMap.get(f.name) || 0) + f.quantity);
    }

    const has: typeof mergedIngredients = [];
    const need: typeof mergedIngredients = [];

    for (const ing of mergedIngredients) {
      const fridgeQty = fridgeMap.get(ing.name) || 0;
      const needQty = ing.amount;
      if (fridgeQty >= needQty) {
        // 足够，全部算已有
        has.push({ ...ing, amount: needQty });
      } else if (fridgeQty > 0) {
        // 有一部分，已有部分 + 需购买部分
        has.push({ ...ing, amount: fridgeQty });
        need.push({ ...ing, amount: needQty - fridgeQty });
      } else {
        // 完全没有
        need.push({ ...ing, amount: needQty });
      }
    }

    return { hasIngredients: has, needToBuy: need };
  }, [mergedIngredients, fridgeItems]);

  // 烹饪时间线（按总耗时排序，耗时长的先做）
  const timeline = useMemo(() => {
    return [...selectedRecipes]
      .map((r) => {
        const totalMin = r.steps.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        return { ...r, totalMin };
      })
      .sort((a, b) => b.totalMin - a.totalMin);
  }, [selectedRecipes]);

  const totalTime = useMemo(() => {
    if (timeline.length === 0) return 0;
    return (timeline[0]?.totalMin ?? 0) + timeline.length * 5;
  }, [timeline]);

  if (recipesLoading || loadingMenu) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
      </div>
    );
  }

  // 空状态
  if (selectedRecipes.length === 0 && !aiResults) {
    return (
      <div style={{ minHeight: '100vh', padding: '20px 16px', background: 'var(--color-bg)' }}>
        <h1 className="text-2xl font-bold mb-4">📅 今日菜谱</h1>

        {/* AI 搜索框 */}
        <div style={{ marginBottom: 16 }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAISearch(); }}
              placeholder="输入提示词，例如：今天想吃清淡的素菜"
              className="flex-1"
              style={{ padding: '12px 14px', fontSize: 14, borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
            />
            <button
              onClick={handleAISearch}
              className="px-5 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >🤖 生成</button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, paddingLeft: 4 }}>
            试试："辣的肉菜"、"低热量"、"快手家常"、"冬季滋补汤"
          </p>
        </div>

        <div className="flex flex-col items-center py-12" style={{ color: 'var(--color-text-muted)' }}>
          <span className="text-5xl mb-4">🛒</span>
          <p className="text-base mb-2">今日菜单还是空的</p>
          <p className="text-sm">输入提示词让 AI 为你推荐，或在菜谱页面点 <span className="font-bold" style={{ color: 'var(--color-accent)' }}>圆形+</span> 手动添加</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 40, background: 'var(--color-bg)' }}>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h1 className="text-2xl font-bold">📅 今日菜谱</h1>
        <button onClick={clearMenu} className="text-xs px-3 py-1.5 rounded-md"
          style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          清空
        </button>
      </div>

      <div className="px-4 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* AI 搜索框 */}
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAISearch(); }}
              placeholder="输入提示词，如：辣的肉菜、低热量、快手家常"
              className="flex-1"
              style={{ padding: '12px 14px', fontSize: 14, borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
            />
            <button
              onClick={handleAISearch}
              className="px-5 py-3 rounded-xl text-sm font-medium"
              style={{ background: 'var(--color-accent)', color: '#fff' }}
            >🤖 生成</button>
          </div>
        </div>

        {/* AI 推荐结果 */}
        {aiResults && (
          <div>
            <h3 className="text-sm font-semibold mb-2">💡 AI 推荐（{aiResults.length}道）</h3>
            {aiResults.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>没找到匹配的菜谱，换个词试试</p>
            ) : (
              <div className="space-y-2">
                {aiResults.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{CATEGORY_ICONS[r.category]} {r.name}</span>
                      <span className="text-[11px] ml-2" style={{ color: 'var(--color-text-muted)' }}>
                        {r.tags.slice(0, 3).join(' · ')}
                        {r.calories > 0 && ` · ${r.calories}kcal`}
                      </span>
                    </div>
                    <button
                      onClick={() => addAiRecipeToMenu(r.id)}
                      disabled={todayMenuIds.has(r.id)}
                      className="px-3 py-1 rounded-full text-xs font-medium flex-shrink-0"
                      style={{
                        background: todayMenuIds.has(r.id) ? 'var(--color-border)' : 'var(--color-accent)',
                        color: todayMenuIds.has(r.id) ? 'var(--color-text-muted)' : '#fff',
                        opacity: todayMenuIds.has(r.id) ? 0.5 : 1,
                      }}
                    >{todayMenuIds.has(r.id) ? '已添加' : '+ 添加'}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 已选菜谱 */}
        <div>
          <h3 className="text-sm font-semibold mb-3">🍽️ 今日菜谱（{selectedRecipes.length}道）</h3>
          <div className="flex flex-wrap gap-2">
            {selectedRecipes.map((r) => (
              <span key={r.id} className="px-4 py-1.5 text-sm flex items-center gap-1.5"
                style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)', borderRadius: 6 }}>
                {CATEGORY_ICONS[r.category]} {r.name}
                <button onClick={() => removeFromMenu(r.id)}
                  className="text-xs leading-none" style={{ color: 'var(--color-accent)', opacity: 0.6 }}>✕</button>
              </span>
            ))}
          </div>
        </div>

        {/* 食材对比 */}
        {mergedIngredients.length > 0 && (
          <div>
            {/* 已有食材 */}
            {hasIngredients.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">✅ 冰箱已有（{hasIngredients.length}种）</h3>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px',
                  padding: 10, borderRadius: 12,
                  background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)',
                }}>
                  {hasIngredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34c759', flexShrink: 0 }} />
                      <span>{ing.name}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                        {ing.amount % 1 === 0 ? ing.amount : ing.amount.toFixed(1)} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 需购买食材 */}
            {needToBuy.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-accent-warm)' }}>
                  🛒 需要购买（{needToBuy.length}种）
                </h3>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px',
                  padding: 10, borderRadius: 12,
                  background: 'var(--color-accent-soft)', boxShadow: 'var(--shadow-sm)',
                }}>
                  {needToBuy.map((ing, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-sm">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent-warm)', flexShrink: 0 }} />
                      <span>{ing.name}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                        {ing.amount % 1 === 0 ? ing.amount : ing.amount.toFixed(1)} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 烹饪时间线 */}
        <div>
          <h3 className="text-sm font-semibold mb-3">
            ⏱️ 烹饪时间线（约{totalTime}分钟）
          </h3>
          <div style={{ paddingLeft: 20, position: 'relative' }}>
            <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ background: 'var(--color-border-strong)' }} />
            <div className="space-y-4">
              {timeline.map((recipe, i) => (
                <div key={recipe.id} style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: -18, top: 12,
                    width: 12, height: 12, borderRadius: '50%',
                    background: 'var(--color-accent)', border: '2px solid var(--color-bg)',
                  }} />
                  <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{i + 1}. {recipe.name}</span>
                      <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        ⏱️ {recipe.totalMin}分钟
                      </span>
                    </div>
                    {recipe.steps.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {recipe.steps.map((s) => (
                          <span key={s.order} className="text-[11px] px-2 py-0.5"
                            style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)', borderRadius: 4 }}>
                            步骤{s.order}: {s.description.slice(0, 12)}{s.description.length > 12 ? '...' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}