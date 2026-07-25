/**
 * 应用入口
 * 注册 Service Worker（PWA 离线能力）
 * 渲染 React 应用
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// 注册 Service Worker（vite-plugin-pwa 自动处理）
