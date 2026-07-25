/**
 * 星级评分组件 — 点击交互
 */

interface Props {
  value: number;            // 当前评分 1-5，0 未评分
  onChange: (v: number) => void;  // 点击回调
  label: string;            // 用户名
  size?: number;            // 星星大小，默认 28
}

export default function StarRating({ value, onChange, label, size = 22 }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 cursor-pointer select-none"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star === value ? 0 : star)}
            className="transition-all"
            style={{
              fontSize: size,
              lineHeight: 1,
              filter: star <= value
                ? 'drop-shadow(0 1px 3px rgba(255,180,50,0.6))'
                : 'grayscale(1) opacity(0.25)',
              transform: star <= value ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            ⭐
          </button>
        ))}
      </div>
      {value > 0 && (
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>点击取消</span>
      )}
    </div>
  );
}
