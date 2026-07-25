/**
 * 菜谱表单页 — 新增 / 编辑菜谱
 * 封面照 / 菜名 / 分类 / 材料 / 步骤 / 标签 / 热量 / 截图识别
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader';
import TagSelector from '../components/TagSelector';
import { useRecipe, addRecipe, updateRecipe } from '../hooks/useRecipes';
import { CATEGORY_LIST, CATEGORY_ICONS } from '../types';
import type { Category, Ingredient, Step } from '../types';

export default function RecipeFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { recipe, loading } = useRecipe(id);
  const isEdit = !!id;

  // 表单状态
  const [name, setName] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>('主食');
  const [tags, setTags] = useState<string[]>([]);
  const [calories, setCalories] = useState<number>(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', unit: '' }]);
  const [steps, setSteps] = useState<Step[]>([{ order: 1, description: '', durationMinutes: 0 }]);
  const [saving, setSaving] = useState(false);

  // 截图识别状态
  const [screenshotLoading, setScreenshotLoading] = useState(false);

  // 编辑模式：加载已有数据
  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setCoverImage(recipe.coverImage);
      setCategory(recipe.category);
      setTags(recipe.tags);
      setCalories(recipe.calories ?? 0);
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', amount: '', unit: '' }]);
      setSteps(recipe.steps.length > 0 ? recipe.steps : [{ order: 1, description: '', durationMinutes: 0 }]);
    }
  }, [recipe]);

  // ===== 材料操作 =====
  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    setIngredients((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };
  const addIngredient = () => setIngredients((prev) => [...prev, { name: '', amount: '', unit: '克' }]);
  const removeIngredient = (index: number) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // ===== 步骤操作 =====
  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    setSteps((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };
  const addStep = () => setSteps((prev) => [...prev, { order: prev.length + 1, description: '', durationMinutes: 0 }]);
  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  // ===== 截图识别 =====
  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotLoading(true);
    try {
      // 压缩截图
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 使用 OpenAI Vision API 识别菜谱
      const settings = await (await import('../db/database')).db.appSettings.get('singleton');
      if (!settings?.aiEnabled || !settings?.aiApiKey) {
        alert('请先在「设置」页面开启 AI 并配置 API Key');
        setScreenshotLoading(false);
        return;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.aiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: '请识别这张图片中的菜谱内容，提取以下信息并以 JSON 格式返回（只返回 JSON，不要其他内容）：{"name":"菜名","category":"主食/蔬菜/肉类/汤/甜品/水果/饮品 之一","calories":热量数值,"ingredients":[{"name":"材料名","amount":"用量","unit":"单位"}],"steps":[{"order":1,"description":"步骤描述","durationMinutes":预计分钟数}],"tags":["标签1","标签2"]}。如果某字段无法识别则设为空或默认值。' },
              { type: 'image_url', image_url: { url: base64 } },
            ],
          }],
          max_tokens: 2000,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('AI 未返回有效内容');

      // 提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('无法解析 AI 返回的 JSON');
      const parsed = JSON.parse(jsonMatch[0]);

      // 填充表单
      if (parsed.name) setName(parsed.name);
      if (parsed.category && CATEGORY_LIST.includes(parsed.category)) setCategory(parsed.category as Category);
      if (parsed.calories) setCalories(parsed.calories);
      if (parsed.tags?.length) setTags(parsed.tags);
      if (parsed.ingredients?.length) {
        setIngredients(parsed.ingredients.map((ing: Ingredient) => ({
          name: ing.name || '', amount: ing.amount || '', unit: ing.unit || '',
        })));
      }
      if (parsed.steps?.length) {
        setSteps(parsed.steps.map((s: Step, i: number) => ({
          order: i + 1, description: s.description || '', durationMinutes: s.durationMinutes || 0,
        })));
      }
      alert('✅ 识别完成！请核对并修改后保存。');
    } catch (err: any) {
      console.error('截图识别失败:', err);
      alert('识别失败：' + (err.message || '请检查 API Key 和网络连接'));
    } finally {
      setScreenshotLoading(false);
      e.target.value = ''; // 清空 input 以便再次选择同一文件
    }
  };

  // ===== 保存 =====
  const handleSave = useCallback(async () => {
    if (!name.trim()) { alert('请输入菜名'); return; }
    if (!coverImage) { alert('请上传封面照片'); return; }
    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    if (validIngredients.length === 0) { alert('请至少填写一种材料'); return; }
    const validSteps = steps.filter((s) => s.description.trim());
    if (validSteps.length === 0) { alert('请至少填写一个制作步骤'); return; }
    const orderedSteps = validSteps.map((s, i) => ({ ...s, order: i + 1 }));

    setSaving(true);
    try {
      const baseData = {
        name: name.trim(), coverImage, category, tags, calories,
        ingredients: validIngredients, steps: orderedSteps,
        myRating: recipe?.myRating ?? 0, wifeRating: recipe?.wifeRating ?? 0,
      };
      if (isEdit && id) {
        await updateRecipe(id, baseData);
      } else {
        await addRecipe(baseData);
      }
      navigate(-1);
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally { setSaving(false); }
  }, [name, coverImage, category, tags, calories, ingredients, steps, id, isEdit, navigate, recipe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-bg)' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 120, background: 'var(--color-bg)' }}>
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
        <button onClick={() => navigate(-1)} className="text-lg font-semibold" style={{ color: 'var(--color-text-secondary)' }}>← 返回</button>
        <h2 className="text-2xl font-bold">{isEdit ? '编辑菜谱' : '新增菜谱'}</h2>
        <div className="w-10" />
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* 截图识别按钮 */}
        {!isEdit && (
          <div>
            <label
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all"
              style={{
                background: 'var(--color-accent-soft)',
                color: 'var(--color-accent)',
                border: '1.5px dashed var(--color-accent)',
                opacity: screenshotLoading ? 0.6 : 1,
              }}
            >
              {screenshotLoading ? (
                <><span className="animate-pulse">⏳</span> 识别中...</>
              ) : (
                <><span>📸</span> 截图识别菜谱</>
              )}
              <input
                type="file" accept="image/*" capture="environment"
                onChange={handleScreenshot} disabled={screenshotLoading}
                className="hidden"
              />
            </label>
            <p className="text-[11px] mt-1 px-1" style={{ color: 'var(--color-text-muted)' }}>
              拍照或上传菜谱截图，AI 自动填充表单（需在「设置」中开启 AI）
            </p>
          </div>
        )}

        {/* 封面照片 */}
        <ImageUploader image={coverImage} onImageChange={setCoverImage} />

        {/* 菜名 + 热量 同行 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>菜名 *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：红烧排骨" className="w-full" />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>热量 (kcal)</label>
            <input type="number" value={calories || ''} onChange={(e) => setCalories(parseInt(e.target.value) || 0)}
              placeholder="0" className="w-full" min="0" />
          </div>
        </div>

        {/* 分类 */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>分类 *</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORY_LIST.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-1 py-2 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-0.5"
                style={{
                  background: category === cat ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: category === cat ? '#fff' : 'var(--color-text-secondary)',
                  border: category === cat ? 'none' : '1px solid var(--color-border)',
                }}>
                <span className="text-base">{CATEGORY_ICONS[cat]}</span>{cat}
              </button>
            ))}
          </div>
        </div>

        {/* 标签（折叠式） */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>标签</label>
          <TagSelector selectedTags={tags} onTagsChange={setTags} />
        </div>

        {/* 材料列表 */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>材料清单 *</label>
            <button onClick={addIngredient}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>+</button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <input type="text" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)}
                  placeholder="材料" className="flex-[2] min-w-0" style={{ padding: '8px 10px', fontSize: '13px' }} />
                <input type="text" value={ing.amount} onChange={(e) => updateIngredient(i, 'amount', e.target.value)}
                  placeholder="量" className="flex-1 min-w-0" style={{ padding: '8px 10px', fontSize: '13px' }} />
                <select value={ing.unit} onChange={(e) => updateIngredient(i, 'unit', e.target.value)}
                  className="flex-1 min-w-0" style={{ padding: '8px 6px', fontSize: '13px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                  <option value="克">克</option>
                  <option value="千克">千克</option>
                  <option value="斤">斤</option>
                  <option value="两">两</option>
                  <option value="片">片</option>
                  <option value="只">只</option>
                  <option value="个">个</option>
                  <option value="根">根</option>
                  <option value="把">把</option>
                  <option value="勺">勺</option>
                  <option value="杯">杯</option>
                  <option value="毫升">毫升</option>
                  <option value="升">升</option>
                  <option value="适量">适量</option>
                  <option value="少许">少许</option>
                </select>
                {ingredients.length > 1 && (
                  <button onClick={() => removeIngredient(i)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                    style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 制作步骤 */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>制作步骤 *</label>
            <button onClick={addStep}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}>+</button>
          </div>
          <div className="space-y-3" style={{ marginTop: 4 }}>
            {steps.map((step, i) => (
              <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    style={{ fontSize: 11, fontWeight: 700, borderRadius: 8, background: 'var(--color-accent)', color: '#fff', padding: '3px 10px' }}>步骤 {i + 1}</span>
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <span>⏱️</span>
                    <input type="number" value={step.durationMinutes || ''}
                      onChange={(e) => updateStep(i, 'durationMinutes', parseInt(e.target.value) || 0)}
                      placeholder="0" className="w-12 text-center text-xs" min="0" style={{ padding: '3px 6px' }} />分钟
                  </div>
                  <div className="flex-1" />
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(i)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                      style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>✕</button>
                  )}
                </div>
                <textarea value={step.description} onChange={(e) => updateStep(i, 'description', e.target.value)}
                  placeholder="描述这一步..." className="w-full text-sm" style={{ minHeight: '44px', background: 'var(--color-bg)' }} rows={2} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部保存 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 py-3 safe-bottom"
        style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
        <button onClick={handleSave} disabled={saving}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: 12,
            fontSize: 20,
            fontWeight: 700,
            background: 'var(--color-accent)',
            color: '#fff',
            opacity: saving ? 0.6 : 1,
          }}>
          {saving ? '保存中...' : isEdit ? '保存修改' : '添加菜谱'}
        </button>
      </div>
    </div>
  );
}
