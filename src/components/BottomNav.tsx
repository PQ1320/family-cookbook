/**
 * 底部导航栏 — 四等分冰块胶囊风格
 * 点击整个四等分区域即可切换，当前激活区域显示渐变发光效果
 */

import { NavLink, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/fridge', label: '冰箱', icon: '🧊' },
  { path: '/', label: '菜谱', icon: '🍳' },
  { path: '/daily', label: '今日菜谱', icon: '📋' },
  { path: '/profile', label: '设置', icon: '⚙️' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] safe-bottom"
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex h-full">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
            || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center py-2 relative"
              style={{ WebkitTapHighlightColor: 'transparent', minHeight: 52 }}
            >
              {/* 激活态渐变背景 — 冰块胶囊感：中心亮 → 边缘暗 */}
              {isActive && (
                <div
                  className="absolute inset-x-0 top-0 bottom-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(200,149,108,0.15) 0%, transparent 70%)',
                  }}
                />
              )}
              {/* 图标 */}
              <span
                className="text-lg leading-none relative z-10 transition-all duration-200"
                style={{
                  filter: isActive
                    ? 'drop-shadow(0 0 6px rgba(200,149,108,0.4)) brightness(1.2)'
                    : 'grayscale(0.3) opacity(0.5)',
                }}
              >
                {item.icon}
              </span>
              {/* 文字 */}
              <span
                className="text-[11px] font-medium mt-0.5 relative z-10"
                style={{
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
