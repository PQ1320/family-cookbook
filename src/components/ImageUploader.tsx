/**
 * 图片上传组件
 * 支持相册选择 / 拍照，自动压缩为 Base64
 */

import { useRef } from 'react';
import { compressImage } from '../utils';

interface Props {
  image: string | null;
  onImageChange: (base64: string) => void;
}

export default function ImageUploader({ image, onImageChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      onImageChange(base64);
    } catch (err) {
      console.error('图片处理失败:', err);
      alert('图片处理失败，请重试');
    }
  };

  return (
    <div
      onClick={() => fileInputRef.current?.click()}
      className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer block"
      style={{
        background: image ? 'transparent' : 'var(--color-surface)',
        border: image ? 'none' : '2px dashed var(--color-border)',
        width: '180px',
        margin: '0 auto',
      }}
    >
      {image ? (
        <>
          <img src={image} alt="封面" className="w-full h-full" style={{ objectFit: 'contain', objectPosition: 'center' }} />
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            <span className="text-white text-sm">点击更换封面</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--color-text-muted)' }}>
          <span className="text-4xl mb-2">📷</span>
          <span className="text-sm">点击上传封面照片</span>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
