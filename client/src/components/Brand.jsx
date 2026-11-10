// Supplied sugar-cube logo, drawn from the provided Sweety brand assets.
export default function Brand({ compact = false, tone = 'light' }) {
  const size = compact ? 36 : 42;
  const top = tone === 'dark' ? 'var(--lav-100)' : 'var(--lav-200)';
  const left = tone === 'dark' ? 'var(--lav-400)' : 'var(--lav-600)';
  const right = tone === 'dark' ? 'var(--lav-600)' : 'var(--lav-800)';
  return (
    <div className={`brand brand-${tone} ${compact ? 'brand-compact' : ''}`} aria-label="Sweety">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <g strokeLinejoin="round" strokeWidth="3">
          <path d="M32 9L55 21L32 33L9 21Z" fill={top} stroke={top} />
          <path d="M9 21L32 33L32 57L9 45Z" fill={left} stroke={left} />
          <path d="M32 33L55 21L55 45L32 57Z" fill={right} stroke={right} />
        </g>
        <path d="M32 14Q33 20 39 21Q33 22 32 28Q31 22 25 21Q31 20 32 14Z" fill="var(--sparkle)" />
      </svg>
      <span className="brand-word">sweety<span className="brand-dot">.</span></span>
    </div>
  );
}
