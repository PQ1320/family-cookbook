/**
 * 我的/设置页 — 折叠式配置
 */

import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { useSettings } from '../hooks/useSettings';

type Section = 'names' | 'data' | 'ai';

export default function ProfilePage() {
  const { updateUserNames } = useSettings();
  const [aiEnabled, setAiEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState('用户1');
  const [wifeName, setWifeName] = useState('用户2');
  const [expanded, setExpanded] = useState<Section | null>(null);

  useEffect(() => {
    db.appSettings.get('singleton').then((s) => {
      if (s) {
        setAiEnabled(s.aiEnabled);
        setApiKey(s.aiApiKey || '');
        setUserName(s.userName || '用户1');
        setWifeName(s.wifeName || '用户2');
      }
    });
  }, []);

  const handleSaveNames = async () => {
    await updateUserNames(userName, wifeName);
    alert('昵称已保存');
  };

  const handleToggleAI = async () => {
    const newVal = !aiEnabled;
    if (newVal && !apiKey.trim()) { alert('请先填写 API Key'); return; }
    setSaving(true);
    await db.appSettings.update('singleton', { aiEnabled: newVal, updatedAt: Date.now() });
    setAiEnabled(newVal);
    setSaving(false);
  };

  const handleSaveKey = async () => {
    setSaving(true);
    await db.appSettings.update('singleton', { aiApiKey: apiKey.trim(), updatedAt: Date.now() });
    setSaving(false);
    alert('API Key 已保存');
  };

  const sections: { key: Section; icon: string; title: string }[] = [
    { key: 'names', icon: '👤', title: '称呼设置' },
    { key: 'data', icon: '📦', title: '数据管理' },
    { key: 'ai', icon: '🤖', title: 'AI 辅助' },
  ];

  return (
    <div className="p-4 min-h-screen pb-20" style={{ background: 'var(--color-bg)' }}>
      <h1 className="text-2xl font-bold mb-6">⚙️ 设置</h1>

      {sections.map((section) => {
        const isOpen = expanded === section.key;
        return (
          <div key={section.key} style={{ marginBottom: 5 }}>
            {/* 标题栏 — 点击展开 */}
            <button
              onClick={() => setExpanded(isOpen ? null : section.key)}
              className="w-full flex items-center justify-between px-5 py-5 rounded-xl transition-all"
              style={{
                background: isOpen ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                color: isOpen ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                border: `1px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                boxShadow: 'var(--shadow-sm)',
                fontSize: '18px',
                fontWeight: 500,
              }}
            >
              <span className="flex items-center gap-2">
                <span>{section.icon}</span> {section.title}
              </span>
              <span className="text-xs transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : '' }}>
                ▾
              </span>
            </button>

            {/* 展开内容 */}
            {isOpen && (
              <div className="mt-2 p-4 rounded-xl" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}>
                {/* 昵称设置 */}
                {section.key === 'names' && (
                  <>
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                      自定义名称，会显示在评分和榜单中
                    </p>
                    <div className="space-y-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>用户1</span>
                        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
                          placeholder="用户1" className="flex-1 text-sm" style={{ padding: '10px 12px' }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>用户2</span>
                        <input type="text" value={wifeName} onChange={(e) => setWifeName(e.target.value)}
                          placeholder="用户2" className="flex-1 text-sm" style={{ padding: '10px 12px' }} />
                      </div>
                    </div>
                    <button onClick={handleSaveNames}
                      className="w-full py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: 'var(--color-accent)', color: '#fff' }}>保存昵称</button>
                  </>
                )}

                {/* 数据管理 */}
                {section.key === 'data' && (
                  <>
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
                      清除所有菜谱、评论和冰箱数据。此操作不可恢复。
                    </p>
                    <button
                      onClick={async () => {
                        if (confirm('确定要清除所有菜谱数据吗？此操作不可恢复！')) {
                          await db.recipes.clear();
                          await db.cookingRecords.clear();
                          await db.fridgeItems.clear();
                          alert('已清除');
                          window.location.reload();
                        }
                      }}
                      className="w-full py-2.5 rounded-xl text-sm font-medium"
                      style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
                      🗑️ 清除所有数据
                    </button>
                  </>
                )}

                {/* AI 设置 */}
                {section.key === 'ai' && (
                  <>
                    <div className="mb-3">
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-muted)' }}>
                        OpenAI API Key
                      </label>
                      <div className="flex gap-2">
                        <input type={showKey ? 'text' : 'password'} value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..."
                          className="flex-1 text-sm" style={{ padding: '10px 12px' }} />
                        <button onClick={() => setShowKey(!showKey)}
                          className="px-3 py-2 rounded-xl text-sm"
                          style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                          {showKey ? '🙈' : '👁️'}
                        </button>
                      </div>
                      <button onClick={handleSaveKey} disabled={saving}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>
                        保存 Key
                      </button>
                    </div>
                    <p className="text-sm mt-3" style={{ color: 'var(--color-text-muted)' }}>
                      API Key 仅存储在手机本地。
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>家庭菜谱 v1.0 · Made with ❤️</p>
      </div>

      {/* AI 快速开关 FAB — 与菜谱添加键一致 */}
      <button
        onClick={handleToggleAI}
        className="fixed right-4 bottom-28 w-14 h-14 flex items-center justify-center shadow-lg z-10"
        style={{
          background: aiEnabled ? 'var(--color-accent)' : 'var(--color-border-strong)',
          color: '#fff',
          borderRadius: '50%',
          fontSize: '22px',
          lineHeight: '1',
          boxShadow: aiEnabled
            ? '0 4px 16px rgba(200,149,108,0.5)'
            : '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        🤖
      </button>
    </div>
  );
}
