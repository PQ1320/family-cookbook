/**
 * 应用根组件
 * 配置路由 + 底部导航 + 初始化数据库
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import RecipeListPage from './pages/RecipeListPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import RecipeFormPage from './pages/RecipeFormPage';
import FridgePage from './pages/FridgePage';
import DailyMenuPage from './pages/DailyMenuPage';
import ProfilePage from './pages/ProfilePage';
import { db } from './db/database';

function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // 初始化数据库（确保默认设置存在）
    db.initSettings()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('数据库初始化失败:', err);
        setDbReady(true);
      });
  }, []);

  if (!dbReady) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <p className="text-[var(--color-text-secondary)]">加载中...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <Routes>
          {/* 菜谱模块 */}
          <Route path="/" element={<RecipeListPage />} />
          <Route path="/recipe/new" element={<RecipeFormPage />} />
          <Route path="/recipe/:id" element={<RecipeDetailPage />} />
          <Route path="/recipe/:id/edit" element={<RecipeFormPage />} />

          {/* 其他模块（M3/M4 实现） */}
          <Route path="/fridge" element={<FridgePage />} />
          <Route path="/daily" element={<DailyMenuPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>

        {/* 底部导航（菜谱表单页和详情页隐藏） */}
        <Routes>
          {['/', '/fridge', '/daily', '/profile'].map((path) => (
            <Route key={path} path={path} element={<BottomNav />} />
          ))}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
