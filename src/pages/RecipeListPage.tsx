/**
 * 菜谱列表页
 * 左侧：榜单 / 全部 / 各分类
 * 右侧：网格或榜单视图
 * 榜单按分类分组排名
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes, searchRecipes } from '../hooks/useRecipes';
import { useSettings } from '../hooks/useSettings';
import { db } from '../db/database';
import RecipeCard from '../components/RecipeCard';
import { CATEGORY_LIST, CATEGORY_ICONS } from '../types';
import type { Category, Recipe } from '../types';

type SidebarItem = '榜单' | '全部' | Category;
type LeaderboardTab = '总榜' | 'my' | 'wife';
const SIDEBAR: SidebarItem[] = ['榜单', '全部', ...CATEGORY_LIST];

export default function RecipeListPage() {
  const navigate = useNavigate();
  const { recipes, loading } = useRecipes();
  const { settings } = useSettings();
  const [activeSidebar, setActiveSidebar] = useState<SidebarItem>('全部');
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Recipe[] | null>(null);
  const [lbTab, setLbTab] = useState<LeaderboardTab>('总榜');

  // 今日菜单中已添加的菜谱ID
  const [todayMenuIds, setTodayMenuIds] = useState<Set<string>>(new Set());
  const loadTodayMenu = useCallback(async () => {
    const menu = await db.getTodayMenu();
    setTodayMenuIds(new Set(menu?.recipeIds ?? []));
  }, []);
  useEffect(() => { loadTodayMenu(); }, [loadTodayMenu]);

  const handleToggleMenu = useCallback(async (recipeId: string) => {
    if (todayMenuIds.has(recipeId)) {
      await db.removeFromTodayMenu(recipeId);
    } else {
      await db.addToTodayMenu(recipeId);
    }
    await loadTodayMenu();
  }, [loadTodayMenu, todayMenuIds]);

  const userName = settings?.userName || '用户1';
  const wifeName = settings?.wifeName || '用户2';

  // 过滤菜谱
  const filteredRecipes = useMemo(() => {
    const source = searchResults ?? recipes;
    if (activeSidebar === '榜单' || activeSidebar === '全部') return source;
    return source.filter((r) => r.category === activeSidebar);
  }, [recipes, activeSidebar, searchResults]);

  // 榜单数据：按分类分组排名
  const leaderboardByCategory = useMemo(() => {
    return CATEGORY_LIST.map((cat) => {
      const catRecipes = recipes.filter((r) => r.category === cat);
      if (catRecipes.length === 0) return null;

      // 排序
      let sorted: Recipe[];
      if (lbTab === '总榜') {
        sorted = [...catRecipes].sort((a, b) => {
          const avgA = ((a.myRating || 0) + (a.wifeRating || 0)) / 2;
          const avgB = ((b.myRating || 0) + (b.wifeRating || 0)) / 2;
          return avgB - avgA;
        });
      } else if (lbTab === 'my') {
        sorted = [...catRecipes].filter((r) => r.myRating > 0).sort((a, b) => b.myRating - a.myRating);
      } else {
        sorted = [...catRecipes].filter((r) => r.wifeRating > 0).sort((a, b) => b.wifeRating - a.wifeRating);
      }

      if (sorted.length === 0) return null;
      return { category: cat, recipes: sorted };
    }).filter(Boolean) as { category: Category; recipes: Recipe[] }[];
  }, [recipes, lbTab]);

  // 搜索
  const handleSearch = useCallback(async (kw: string) => {
    setKeyword(kw);
    if (!kw.trim()) { setSearchResults(null); return; }
    const results = await searchRecipes(kw.trim());
    setSearchResults(results);
  }, []);

  return (
    <div className="flex flex-col h-screen pb-16" style={{ background: 'var(--color-bg)' }}>
      {/* 顶部 */}
      <div className="px-3 pt-3 pb-5 sticky top-0 z-10" style={{ background: 'var(--color-bg)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>🍳 菜谱</h1>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
            {recipes.length} 道
          </span>
        </div>
        {/* 搜索 */}
        <div className="relative mb-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-text-muted)' }}>🔍</span>
          <input
            type="text" value={keyword}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索菜谱..."
            className="w-full pl-8 pr-4 text-sm"
            style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '8px 12px 8px 32px', fontSize: '13px' }}
          />
          {keyword && (
            <button onClick={() => { setKeyword(''); setSearchResults(null); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--color-text-muted)' }}>✕</button>
          )}
        </div>
      </div>

      {/* 主体：左侧栏 + 右侧内容 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧栏 */}
        <div
          className="flex-shrink-0 w-[50px] overflow-y-auto scrollbar-none flex flex-col gap-3 px-0.5"
          style={{ background: 'var(--color-bg)' }}
        >
          {/* 留白块，确保榜单在搜索栏下方足够远 */}
          <div style={{ height: 15, flexShrink: 0 }} />
          {SIDEBAR.map((item) => {
            const isActive = activeSidebar === item;
            const icon = item === '榜单' ? '🏆' : item === '全部' ? '📋' : CATEGORY_ICONS[item];
            const label = item === '榜单' ? '榜单' : item === '全部' ? '全部' : item;
            return (
              <button
                key={item}
                onClick={() => setActiveSidebar(item)}
                className="w-full py-2 rounded-xl text-[10px] font-medium transition-all flex flex-col items-center gap-0.5"
                style={{
                  background: isActive ? 'var(--color-surface)' : 'transparent',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <span className="text-sm leading-none">{icon}</span>
                <span className="leading-none">{label}</span>
              </button>
            );
          })}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 overflow-y-auto px-2 pt-2 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
            </div>
          ) : activeSidebar === '榜单' ? (
            /* ===== 榜单视图 ===== */
            <div>
              {/* 子 Tab */}
              <div className="flex gap-1 mb-3">
                {[
                  { key: '总榜' as LeaderboardTab, label: '总榜' },
                  { key: 'my' as LeaderboardTab, label: userName },
                  { key: 'wife' as LeaderboardTab, label: wifeName },
                ].map((t) => (
                  <button key={t.key}
                    onClick={() => setLbTab(t.key)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: lbTab === t.key ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: lbTab === t.key ? '#fff' : 'var(--color-text-secondary)',
                      border: lbTab === t.key ? 'none' : '1px solid var(--color-border)',
                    }}
                  >{t.label}</button>
                ))}
              </div>

              {leaderboardByCategory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="text-4xl mb-2">🏆</span>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>暂无评分数据</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>给菜谱打分后这里就会出现榜单</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboardByCategory.map(({ category, recipes: catRecipes }) => (
                    <div key={category}>
                      {/* 分类标题 */}
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="text-sm">{CATEGORY_ICONS[category]}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--color-accent)' }}>{category}</span>
                        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                      </div>

                      {/* 该分类排名 */}
                      <div className="space-y-1">
                        {catRecipes.map((recipe, idx) => {
                          const avg = ((recipe.myRating || 0) + (recipe.wifeRating || 0)) / 2;
                          const showMedal = idx < 3 && (lbTab === '总榜' || (lbTab === 'my' && recipe.myRating > 0) || (lbTab === 'wife' && recipe.wifeRating > 0));
                          const medals = ['🥇', '🥈', '🥉'];
                          return (
                            <div key={recipe.id}
                              onClick={() => navigate(`/recipe/${recipe.id}`)}
                              className="flex items-center gap-2 p-2 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
                              style={{ background: showMedal ? 'var(--color-accent-soft)' : 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
                            >
                              {/* 排名 */}
                              <span className="w-6 text-center text-xs font-bold flex-shrink-0"
                                style={{ color: showMedal ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                                {showMedal ? medals[idx] : `#${idx + 1}`}
                              </span>
                              {/* 封面小图 */}
                              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--color-border)' }}>
                                {recipe.coverImage && <img src={recipe.coverImage} alt="" className="w-full h-full" style={{ objectFit: 'contain', objectPosition: 'center' }} />}
                              </div>
                              {/* 信息 */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{recipe.name}</p>
                                <div className="flex gap-1.5 mt-0.5">
                                  {lbTab === '总榜' && (
                                    <>
                                      <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                        {userName}:{recipe.myRating > 0 ? '⭐'.repeat(recipe.myRating) : '未评'}
                                      </span>
                                      <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                        {wifeName}:{recipe.wifeRating > 0 ? '⭐'.repeat(recipe.wifeRating) : '未评'}
                                      </span>
                                    </>
                                  )}
                                  {lbTab === 'my' && (
                                    <span className="text-[10px]">{'⭐'.repeat(recipe.myRating)}</span>
                                  )}
                                  {lbTab === 'wife' && (
                                    <span className="text-[10px]">{'⭐'.repeat(recipe.wifeRating)}</span>
                                  )}
                                </div>
                              </div>
                              {/* 平均分 */}
                              {lbTab === '总榜' && avg > 0 && (
                                <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--color-accent)' }}>
                                  {avg.toFixed(1)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ===== 普通网格视图 ===== */
            filteredRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-2">🍳</span>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {keyword ? '没有找到匹配的菜谱' : '还没有菜谱'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {keyword ? '试试其他关键词' : '点击右下角 + 添加吧'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={() => navigate(`/recipe/${recipe.id}`)}
                      onAddToMenu={() => handleToggleMenu(recipe.id)}
                      inMenu={todayMenuIds.has(recipe.id)}
                    />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* 浮动添加按钮 */}
      <button
        onClick={() => navigate('/recipe/new')}
        className="fixed right-4 bottom-28 w-14 h-14 flex items-center justify-center shadow-lg z-10"
        style={{ background: 'var(--color-accent)', color: '#fff', boxShadow: '0 4px 16px rgba(200,149,108,0.4)', borderRadius: '50%', fontSize: '24px', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >+</button>
    </div>
  );
}
