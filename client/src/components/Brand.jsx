export default function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="Sweety">
      <span className="brand-mark" aria-hidden="true">
        <span className="cube-top"/><span className="cube-left"/><span className="cube-right"/>
      </span>
      <span className="brand-word">sweety<span className="brand-dot">.</span></span>
    </div>
  );
}
