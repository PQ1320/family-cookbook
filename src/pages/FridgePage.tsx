/**
 * 冰箱库存页 — 管理食材，与菜谱材料联动
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { db } from '../db/database';
import type { FridgeItem } from '../types';

const UNITS = ['个', '克', '斤', '两', '包', '瓶', '盒', '罐', '把', '根', '片', '只'];

export default function FridgePage() {
  const { recipes } = useRecipes();
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('个');

  const loadItems = useCallback(async () => {
    const all = await db.getFridgeItems();
    setItems(all);
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await db.addFridgeItem(name.trim(), parseFloat(quantity) || 1, unit);
    setName('');
    setQuantity('1');
    setUnit('个');
    loadItems();
  };

  const handleDelete = async (id: string) => {
    await db.deleteFridgeItem(id);
    loadItems();
  };

  const handleUpdateQuantity = async (id: string, qty: number) => {
    if (qty <= 0) {
      await db.deleteFridgeItem(id);
    } else {
      await db.updateFridgeQuantity(id, qty);
    }
    loadItems();
  };

  // 计算每个食材在多少菜谱中出现
  const recipeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients) {
        const key = ing.name.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    return counts;
  }, [recipes]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-bg)' }}>
      <p style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80, background: 'var(--color-bg)', overflowX: 'hidden' }}>
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold mb-4">🧊 冰箱</h1>

        {/* 添加食材 */}
        <div className="p-4 rounded-2xl mb-5" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex gap-1.5 mb-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="食材名称"
              className="flex-1 min-w-0"
              style={{ padding: '12px 10px', fontSize: 15, borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
            />
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="数量"
              style={{ width: 56, padding: '12px 6px', fontSize: 15, borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-bg)', textAlign: 'center' }}
              min="0"
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{ width: 52, padding: '12px 2px', fontSize: 15, borderRadius: 12, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
            >
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="w-full py-4 rounded-xl text-2xl font-bold"
            style={{
              background: name.trim() ? 'var(--color-accent)' : 'var(--color-border)',
              color: '#fff',
              opacity: name.trim() ? 1 : 0.5,
            }}
          >🧊 添加食材</button>
        </div>
      </div>

      {/* 食材列表 */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          <span className="text-4xl mb-3">🧊</span>
          <p>冰箱空空如也，添加第一样食材吧</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
            共 {items.length} 种食材 · 库存数量
          </p>
          {items.map((item) => {
            const count = recipeCounts.get(item.name.toLowerCase()) || 0;
            return (
              <div key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
              >
                <span className="text-xl">🥬</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{item.quantity} {item.unit}</span>
                    {count > 0 && (
                      <span style={{ color: 'var(--color-accent)' }}>
                        · {count}道菜谱用到
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >−</button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >+</button>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
