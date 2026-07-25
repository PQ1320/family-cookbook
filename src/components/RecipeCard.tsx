/**
 * 菜谱卡片组件
 */

import type { Recipe } from '../types';
import { CATEGORY_ICONS } from '../types';

interface Props {
  recipe: Recipe;
  onClick: () => void;
  onAddToMenu?: () => void;
  inMenu?: boolean;
}

export default function RecipeCard({ recipe, onClick, onAddToMenu, inMenu }: Props) {
  const avgRating = recipe.myRating > 0 || recipe.wifeRating > 0
    ? ((recipe.myRating || 0) + (recipe.wifeRating || 0)) / ((recipe.myRating > 0 ? 1 : 0) + (recipe.wifeRating > 0 ? 1 : 0))
    : 0;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all hover:shadow-md"
      style={{ borderRadius: 16, background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}
    >
      {/* 封面图 — 自适应原图比例 */}
      <div style={{ padding: 10 }}>
        <div style={{ height: 80, borderRadius: 16, overflow: 'hidden' }}>
          {recipe.coverImage ? (
            <img src={recipe.coverImage} alt={recipe.name} className="w-full h-full" style={{ borderRadius: 16, objectFit: 'cover' }} loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl"
              style={{ background: 'var(--color-accent-soft)', borderRadius: 16 }}>🍳</div>
          )}
        </div>
      </div>

      {/* 信息区 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 10px' }}>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 leading-tight line-clamp-1">{recipe.name}</h3>
          <div className="flex items-center gap-1">
            <span className="px-4 py-1"
              style={{ background: 'var(--color-badge-bg)', color: 'var(--color-accent-warm)', borderRadius: 4, fontSize: 12 }}>
              {CATEGORY_ICONS[recipe.category]} {recipe.category}
            </span>
            {recipe.calories > 0 && (
              <span className="px-4 py-1"
                style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)', borderRadius: 4, fontSize: 12 }}>
                {recipe.calories} kcal
              </span>
            )}
          </div>
          {avgRating > 0 && (
            <div className="flex items-center gap-1 text-xs" style={{ marginTop: 4, paddingBottom: 2 }}>
              {'⭐'.repeat(Math.round(avgRating))}
              <span style={{ color: 'var(--color-text-muted)' }}>{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {onAddToMenu && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToMenu(); }}
            className="w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              borderRadius: '50%',
              background: inMenu ? 'var(--color-accent)' : 'var(--color-border)',
              color: inMenu ? '#fff' : 'var(--color-text-secondary)',
              marginTop: -8,
            }}
          >{inMenu ? '✓' : '+'}</button>
        )}
      </div>
    </div>
  );
}