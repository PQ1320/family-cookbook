/**
 * 烹饪记录 — 发布表单 + 时间线列表
 */

import { useState, useEffect } from 'react';
import { db } from '../hooks/useRecipes';
import type { CookingRecord } from '../types';

interface Props {
  recipeId: string;
  hideTitle?: boolean;
}

export default function CookingRecords({ recipeId, hideTitle }: Props) {
  const [records, setRecords] = useState<CookingRecord[]>([]);
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRecords = async () => {
    const list = await db.getRecords(recipeId);
    setRecords(list);
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, [recipeId]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxW = 600;
          const scale = Math.min(1, maxW / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file);
    setImage(base64);
  };

  const handleSubmit = async () => {
    if (!text.trim() && !image) return;
    await db.addRecord(recipeId, text.trim(), image || undefined);
    setText('');
    setImage(null);
    loadRecords();
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('确定删除这条记录吗？')) return;
    await db.deleteRecord(recordId);
    loadRecords();
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-4">
      {!hideTitle && <h3 className="text-base font-semibold">📝 烹饪记录</h3>}

      {/* 发布表单 */}
      <div
        className="p-3 rounded-xl space-y-3"
        style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="说说这次做得怎么样..."
          rows={2}
          className="w-full text-sm"
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            resize: 'none',
          }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 图片选择 */}
            <label
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base cursor-pointer"
              style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              📷
              <input type="file" accept="image/*" onChange={handleImagePick}
                className="hidden" />
            </label>
            {image && (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                <img src={image} alt="" className="w-full h-full object-contain" />
                <button
                  onClick={() => setImage(null)}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                >✕</button>
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() && !image}
            className="px-5 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: (text.trim() || image) ? 'var(--color-accent)' : 'var(--color-border)',
              color: '#fff',
              opacity: (text.trim() || image) ? 1 : 0.5,
            }}
          >发布</button>
        </div>
      </div>

      {/* 时间线列表 */}
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>加载中...</p>
      ) : records.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
          还没有烹饪记录，来记录第一次吧 📸
        </p>
      ) : (
        <div className="relative" style={{ paddingLeft: 20 }}>
          {/* 时间线竖线 */}
          <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ background: 'var(--color-border-strong)' }} />
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="relative">
                {/* 时间线圆点 */}
                <div
                  className="absolute -left-[18px] top-3 w-3 h-3 rounded-full"
                  style={{ background: 'var(--color-accent)', border: '2px solid var(--color-bg)' }}
                />
                <div className="p-3 rounded-xl" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {formatTime(record.createdAt)}
                    </span>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="text-xs" style={{ color: 'var(--color-text-muted)' }}
                    >🗑️</button>
                  </div>
                  {record.image && (
                    <img src={record.image} alt=""
                      className="w-full rounded-lg mb-2 object-contain"
                      style={{ maxHeight: 200 }}
                    />
                  )}
                  {record.text && (
                    <p className="text-sm leading-relaxed">{record.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
