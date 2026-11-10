import { HeartPulse } from 'lucide-react';
export default function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      <div className="brand-icon"><HeartPulse size={22} strokeWidth={2.4} aria-hidden="true" /></div>
      <span>sweety<span className="brand-dot">.</span></span>
    </div>
  );
}
