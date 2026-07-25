/**
 * 用户设置 Hook
 * 获取和更新昵称等设置
 */

import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/database';
import type { AppSettings } from '../types';

/** 获取应用设置 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const s = await db.appSettings.get('singleton');
    setSettings(s || null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateUserNames = useCallback(async (userName: string, wifeName: string) => {
    await db.appSettings.update('singleton', {
      userName: userName.trim() || '我',
      wifeName: wifeName.trim() || '老婆',
      updatedAt: Date.now(),
    });
    setSettings((prev) => prev ? { ...prev, userName, wifeName } : null);
  }, []);

  return { settings, loading, reload: load, updateUserNames };
}
