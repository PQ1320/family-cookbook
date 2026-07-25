/**
 * 菜谱详情页
 * 封面图 + 菜名 + 分类标签 + 热量 + 材料清单 + 制作步骤 + 交互评分 + 烹饪记录 + 编辑/删除
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useRecipe, deleteRecipe, updateRating } from '../hooks/useRecipes';
import { useSettings } from '../hooks/useSettings';
import { CATEGORY_ICONS } from '../types';
import StarRating from '../components/StarRating';
import CookingRecords from '../components/CookingRecords';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { recipe, loading } = useRecipe(id);
  const { settings } = useSettings();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCookingRecords, setShowCookingRecords] = useState(false);

  // 本地评分状态 —— 点击即时更新
  const [myRating, setMyRating] = useState(0);
  const [wifeRating, setWifeRating] = useState(0);
  useEffect(() => {
    if (recipe) {
      setMyRating(recipe.myRating);
      setWifeRating(recipe.wifeRating);
    }
  }, [recipe?.id]);

  const userName = settings?.userName || '用户1';
  const wifeName = settings?.wifeName || '用户2';

  const handleRating = async (field: 'myRating' | 'wifeRating', value: number) => {
    if (!id) return;
    // 立即更新本地状态
    if (field === 'myRating') setMyRating(value);
    else setWifeRating(value);
    // 异步写入数据库
    await updateRating(id, field, value);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteRecipe(id);
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex flex-col items-center justify-center h-screen" style={{ background: 'var(--color-bg)' }}>
        <span className="text-5xl mb-3">😕</span>
        <p style={{ color: 'var(--color-text-secondary)' }}>菜谱不存在</p>
        <button onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 rounded-xl text-sm" style={{ background: 'var(--color-accent)', color: '#fff' }}>返回首页</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100, background: 'var(--color-bg)' }}>
      {/* 顶部按钮栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
          style={{ background: 'var(--color-surface)', color: '#333', boxShadow: 'var(--shadow-sm)' }}>←</button>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/recipe/${id}/edit`)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
            style={{ background: 'var(--color-surface)', color: '#333', boxShadow: 'var(--shadow-sm)' }}>✏️</button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
            style={{ background: 'var(--color-surface)', color: '#333', boxShadow: 'var(--shadow-sm)' }}>🗑️</button>
        </div>
      </div>

      {/* 封面图 — 留白 + 圆角 */}
      <div style={{ margin: '8px 16px', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9' }}>
        {recipe.coverImage ? (
          <img src={recipe.coverImage} alt={recipe.name} className="w-full h-full" style={{ objectFit: 'contain', objectPosition: 'center' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: 'var(--color-accent-soft)' }}>🍳</div>
        )}
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* 菜名 + 信息 */}
        <div>
          <h1 className="text-2xl font-bold mb-2">{recipe.name}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="px-8 py-1.5"
              style={{ background: 'var(--color-badge-bg)', color: 'var(--color-accent-warm)', borderRadius: 4, fontSize: 13 }}>
              {CATEGORY_ICONS[recipe.category]} {recipe.category}
            </span>
            {recipe.calories > 0 && (
              <span className="px-8 py-1.5"
                style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)', borderRadius: 4, fontSize: 13 }}>
                🔥 {recipe.calories} kcal
              </span>
            )}
            {recipe.tags.map((tag) => (
              <span key={tag} className="px-8 py-1.5"
                style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: 13 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 评分 — 交互式 */}
        <div
          className="flex justify-around py-5 px-2 rounded-xl"
          style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
        >
          <StarRating
            value={myRating}
            onChange={(v) => handleRating('myRating', v)}
            label={`${userName}的评分`}
            size={22}
          />
          <StarRating
            value={wifeRating}
            onChange={(v) => handleRating('wifeRating', v)}
            label={`${wifeName}的评分`}
            size={22}
          />
        </div>

        {/* 材料清单 */}
        <div>
          <h3 className="text-base font-semibold mb-3">🛒 材料清单</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 rounded-xl" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="flex items-baseline gap-1.5 text-sm">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--color-accent)' }} />
                <span>{ing.name}</span>
                {ing.amount && (
                  <span style={{ color: 'var(--color-text-muted)' }}>{ing.amount}{ing.unit}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 制作步骤 */}
        <div>
          <h3 className="text-base font-semibold mb-3">👨‍🍳 制作步骤</h3>
          <div className="space-y-3">
            {recipe.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}>{step.order}</div>
                  {i < recipe.steps.length - 1 && (
                    <div className="w-0.5 flex-1 my-1" style={{ background: 'var(--color-border-strong)' }} />
                  )}
                </div>
                <div className="flex-1 p-3 rounded-xl" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
                  <p className="text-sm leading-relaxed">{step.description}</p>
                  {step.durationMinutes > 0 && (
                    <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>⏱️ 约 {step.durationMinutes} 分钟</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 烹饪记录 — 折叠展开 */}
        <div>
          <button
            onClick={() => setShowCookingRecords(!showCookingRecords)}
            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: showCookingRecords ? 'var(--color-accent-soft)' : 'var(--color-surface)',
              color: showCookingRecords ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              border: `1px solid ${showCookingRecords ? 'var(--color-accent)' : 'var(--color-border)'}`,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span>📝 烹饪记录</span>
            <span className="text-xs transition-transform" style={{ transform: showCookingRecords ? 'rotate(180deg)' : '' }}>▾</span>
          </button>
          {showCookingRecords && (
            <div className="mt-2 p-4 rounded-xl" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
              {id && <CookingRecords recipeId={id} hideTitle />}
            </div>
          )}
        </div>
      </div>

      {/* 删除确认 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl" style={{ padding: '28px 24px', background: 'var(--color-surface)' }}>
            <h3 className="text-xl font-bold mb-3">确认删除</h3>
            <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              删除后无法恢复，相关的烹饪记录也将一并删除。确定删除「{recipe.name}」吗？
            </p>
            <div className="flex gap-3" style={{ marginTop: 28 }}>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl text-base font-medium"
                style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>取消</button>
              <button onClick={handleDelete}
                className="flex-1 py-3 rounded-xl text-base font-medium"
                style={{ background: 'var(--color-accent)', color: '#fff' }}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
