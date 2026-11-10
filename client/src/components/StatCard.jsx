import { ArrowDownRight, ArrowUpRight, Activity, CalendarRange } from 'lucide-react';

const ICONS = [Activity, CalendarRange, CalendarRange];
export default function StatCard({ title, subtitle, stats, index }) {
  const Icon = ICONS[index];
  return (
    <section className={`stat-card stat-${index}`} aria-label={`${title} statistics`}>
      <div className="stat-head"><span className="stat-icon"><Icon size={19}/></span><span className="stat-index">0{index + 1}</span></div>
      <h3>{title}</h3>
      <p className="period-label">{subtitle}</p>
      {stats.count === 0 ? (
        <div className="stat-empty"><div className="no-data">No readings yet</div><span className="muted">Your summary will appear here.</span></div>
      ) : (
        <>
          <div className="stat-main"><strong>{stats.average.toFixed(1)}</strong><span>mg/dl<br/>average</span></div>
          <div className="stat-bottom">
            <span><ArrowUpRight size={16}/> High <b>{stats.highest}</b></span>
            <span><ArrowDownRight size={16}/> Low <b>{stats.lowest}</b></span>
            <span className="stat-count">{stats.count} {stats.count === 1 ? 'reading' : 'readings'}</span>
          </div>
        </>
      )}
    </section>
  );
}
