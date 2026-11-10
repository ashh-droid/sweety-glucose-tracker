// A small four-point sparkle from Sweety's supplied brand kit.
export default function Sparkle({ size = 14, color = 'var(--sparkle)', className = '' }) {
  return (
    <svg className={`sparkle ${className}`} width={size} height={size}
      viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 0Q9 7 16 8Q9 9 8 16Q7 9 0 8Q7 7 8 0Z" fill={color} />
    </svg>
  );
}
