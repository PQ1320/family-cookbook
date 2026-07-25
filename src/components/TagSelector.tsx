/**
 * 标签选择器组件 — 折叠展开式
 * 所有胶囊用 inline style 确保生效
 */

import { useState } from 'react';
import { PRESET_TAGS } from '../types';

interface Props {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export default function TagSelector({ selectedTags, onTagsChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    const tag = customInput.trim();
    if (!tag) return;
    if (selectedTags.includes(tag)) { setCustomInput(''); return; }
    onTagsChange([...selectedTags, tag]);
    setCustomInput('');
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  const getCategoryCount = (category: string) => {
    const options = PRESET_TAGS[category];
    return selectedTags.filter((t) => options.includes(t)).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Object.entries(PRESET_TAGS).map(([category, options]) => {
        const isOpen = expanded === category;
        const count = getCategoryCount(category);
        return (
          <div key={category}>
            <button
              onClick={() => setExpanded(isOpen ? null : category)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                background: isOpen ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                color: isOpen ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                border: `1px solid ${isOpen ? 'var(--color-accent)' : 'var(--color-border)'}`,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 4 }}>
                {category}
                {count > 0 && (
                  <span style={{
                    fontSize: 11, padding: '1px 6px', borderRadius: 4,
                    background: 'var(--color-accent)', color: '#fff',
                  }}>{count}</span>
                )}
              </span>
              <span style={{ fontSize: 12, transform: isOpen ? 'rotate(180deg)' : '' }}>▾</span>
            </button>
            {isOpen && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8, paddingLeft: 4, paddingRight: 4 }}>
                {options.map((tag) => {
                  const isActive = selectedTags.includes(tag);
                  return (
                    <button key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        padding: '8px 22px',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 500,
                        background: isActive ? 'var(--color-accent)' : 'var(--color-surface)',
                        color: isActive ? '#fff' : 'var(--color-text-secondary)',
                        border: isActive ? 'none' : '1px solid var(--color-border)',
                        cursor: 'pointer',
                      }}
                    >{tag}</button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* 自定义标签 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="text" value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
          placeholder="输入自定义标签..."
          style={{ flex: 1, fontSize: 14, padding: '10px 12px' }}
        />
        <button onClick={addCustomTag}
          style={{
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 500, flexShrink: 0,
            background: 'var(--color-accent-soft)', color: 'var(--color-accent)',
            cursor: 'pointer', border: 'none',
          }}>+</button>
      </div>

      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {selectedTags.map((tag) => (
            <button key={tag} onClick={() => removeTag(tag)}
              style={{
                padding: '6px 18px', borderRadius: 4, fontSize: 13, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--color-accent)', color: '#fff',
                cursor: 'pointer', border: 'none',
              }}>
              {tag} <span style={{ fontSize: 10 }}>✕</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
