import { useCallback, useEffect, useState } from 'react';
import { Activity, CalendarDays, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, Heart, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';
import Brand from './Brand.jsx';
import StatCard from './StatCard.jsx';
import ReadingForm from './ReadingForm.jsx';
import { api, localDate, prettyDate, slotLabel } from '../lib/api.js';

function monthLabel(date) {
  const [y, m] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}
function rangeLabel(range) {
  return range.from === range.to ? prettyDate(range.from) : `${prettyDate(range.from)} – ${prettyDate(range.to)}`;
}
const priorDay = (date, change) => {
  const [y, m, d] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + change));
  return next.toISOString().slice(0, 10);
};

export default function Dashboard({ user, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(localDate());
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [recent, setRecent] = useState({ readings: [], pagination: { page: 1, pages: 0, total: 0 } });
  const [recentPage, setRecentPage] = useState(1);

  const refresh = useCallback(async (date, page = 1) => {
    setBusy(true);
    setError('');
    try {
      const [summaries, recentReadings] = await Promise.all([
        api(`/reports?date=${encodeURIComponent(date)}`),
        api(`/readings?page=${page}&limit=8`)
      ]);
      setReport(summaries);
      setRecent(recentReadings);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { refresh(selectedDate, recentPage); }, [selectedDate, recentPage, refresh]);

  function startEdit(reading) {
    setEditing(reading);
    setFormOpen(true);
    setFormError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveReading(data) {
    setSaving(true);
    setFormError('');
    setSuccess('');
    let succeeded = false;
    try {
      await api(editing ? `/readings/${editing.id}` : '/readings', {
        method: editing ? 'PATCH' : 'POST', body: JSON.stringify(data)
      });
      succeeded = true;
      setFormOpen(false);
      setEditing(null);
      setSuccess(editing ? 'Reading updated successfully.' : 'Reading added successfully.');
      setRecentPage(1);
      await refresh(selectedDate, 1);
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
    return succeeded;
  }

  async function deleteReading(reading) {
    if (!window.confirm(`Delete your ${slotLabel(reading.slot)} reading from ${prettyDate(reading.date)}?`)) return;
    setSuccess('');
    setError('');
    try {
      await api(`/readings/${reading.id}`, { method: 'DELETE' });
      setSuccess('Reading deleted.');
      setRecentPage(1);
      await refresh(selectedDate, 1);
    } catch (err) { setError(err.message); }
  }

  function dateChange(date) {
    if (!date || date > localDate()) return;
    setSelectedDate(date);
    setFormError('');
    setSuccess('');
    setEditing(null);
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <Brand/>
        <div className="nav-label">YOUR SPACE</div>
        <div className="nav-active"><Activity size={19}/> Overview</div>
        <div className="side-spacer"/>
        <div className="side-help"><CircleHelp size={19}/><strong>One day at a time.</strong><p>Keep your readings in one place. Small steps help you see the bigger picture.</p></div>
        <button type="button" className="sidebar-signout" onClick={onLogout}><LogOut size={18}/> Sign out</button>
      </aside>
      <main className="dashboard-main">
        <header className="topbar">
          <div className="mobile-brand"><Brand compact/></div>
          <span className="topbar-caption">MY HEALTH JOURNAL <span className="topbar-dot"/> PRIVATE & SECURE</span>
          <div className="profile-chip"><span className="avatar">{user.name.charAt(0).toUpperCase()}</span><span>{user.name.split(' ')[0]}</span></div>
        </header>
        <div className="page-content">
          <section className="greeting-row">
            <div><div className="eyebrow">YOUR DAILY OVERVIEW <span className="small-spark">✦</span></div><h1>Hello, {user.name.split(' ')[0]} <span className="wave">✳</span></h1><p className="muted">A little check-in makes a big difference.</p></div>
            <button type="button" className="button primary add-button" onClick={() => { setEditing(null); setFormOpen(!formOpen); setFormError(''); }}><Plus size={19}/>{formOpen && !editing ? 'Close form' : 'Add a reading'}</button>
          </section>
          {error && <div className="alert error" role="alert">{error} <button className="text-button" type="button" onClick={() => refresh(selectedDate, recentPage)}>Retry</button></div>}
          {success && <div className="alert success" role="status">{success}</div>}

          <section className="date-strip" aria-label="Select report date">
            <div className="date-strip-label"><CalendarDays size={19}/><span>Viewing reports for</span></div>
            <div className="date-controls">
              <button className="icon-button" type="button" aria-label="Previous day" onClick={() => dateChange(priorDay(selectedDate, -1))}><ChevronLeft size={19}/></button>
              <input aria-label="Selected report date" type="date" value={selectedDate} max={localDate()} onChange={(event) => dateChange(event.target.value)}/>
              <button className="icon-button" type="button" aria-label="Next day" disabled={selectedDate >= localDate()} onClick={() => dateChange(priorDay(selectedDate, 1))}><ChevronRight size={19}/></button>
              <button type="button" className="today-button" onClick={() => dateChange(localDate())}>Today</button>
            </div>
          </section>

          {formOpen && <section className="panel entry-panel"><div className="section-heading compact"><div><span className="eyebrow">GLUCOSE JOURNAL</span><h2>{editing ? 'Edit reading' : 'Record a reading'}</h2></div><button className="icon-button" type="button" aria-label="Close form" onClick={() => { setFormOpen(false); setEditing(null); setFormError(''); }}>×</button></div><ReadingForm selectedDate={selectedDate} editing={editing} busy={saving} error={formError} onSave={saveReading} onCancel={() => { setEditing(null); setFormOpen(false); setFormError(''); }}/></section>}

          <section aria-labelledby="reports-title" className="report-section">
            <div className="section-heading"><div><span className="eyebrow">THE BIGGER PICTURE</span><h2 id="reports-title">Your reports</h2></div><span className="muted section-note">Numbers are for tracking, not diagnosis.</span></div>
            {busy && !report ? <div className="panel loading">Loading your reports…</div> : report && <div className="stats-grid">
              <StatCard title="Daily" subtitle={rangeLabel(report.daily.range)} stats={report.daily} index={0}/>
              <StatCard title="Month to date" subtitle={rangeLabel(report.monthToDate.range)} stats={report.monthToDate} index={1}/>
              <StatCard title="Previous month" subtitle={rangeLabel(report.previousMonth.range)} stats={report.previousMonth} index={2}/>
            </div>}
          </section>

          <div className="lower-grid">
            <section className="panel daily-panel" aria-labelledby="daily-title">
              <div className="section-heading compact"><div><span className="eyebrow">YOUR FOUR MOMENTS</span><h2 id="daily-title">Daily readings</h2><p className="muted panel-subtitle">{prettyDate(selectedDate)}</p></div><span className="count-pill">{report?.daily.count ?? '–'} / 4</span></div>
              {report && report.daily.readings.length ? <ul className="reading-list">
                {report.daily.readings.map((reading) => <li key={reading.id} className="reading-row"><div className="reading-dot"><Heart size={17}/></div><div className="reading-name"><strong>{slotLabel(reading.slot)}</strong><span>{prettyDate(reading.date)}</span></div><div className="reading-number"><strong>{reading.value}</strong><span>mg/dl</span></div><button type="button" className="icon-button" aria-label={`Edit ${slotLabel(reading.slot)} reading`} title="Edit" onClick={() => startEdit(reading)}><Pencil size={17}/></button><button type="button" className="icon-button danger" aria-label={`Delete ${slotLabel(reading.slot)} reading`} title="Delete" onClick={() => deleteReading(reading)}><Trash2 size={17}/></button></li>)}
              </ul> : <div className="empty-state"><div className="empty-icon"><ClipboardList size={25}/></div><strong>No readings for this day</strong><p>Add your first reading to start tracking your day.</p><button className="button secondary" type="button" onClick={() => { setFormOpen(true); setEditing(null); }}>+ Add a reading</button></div>}
            </section>
            <section className="panel history-panel" aria-labelledby="history-title"><div className="section-heading compact"><div><span className="eyebrow">LOOKING BACK</span><h2 id="history-title">Reading history</h2><p className="muted panel-subtitle">Your most recent entries</p></div><span className="count-pill muted-pill">{recent.pagination.total} total</span></div>
              {recent.readings.length ? <><ul className="history-list">{recent.readings.map((reading) => <li key={reading.id}><div><strong>{slotLabel(reading.slot)}</strong><span>{prettyDate(reading.date)}</span></div><div><b>{reading.value}</b> <small>mg/dl</small></div></li>)}</ul><div className="pager"><button type="button" className="icon-button" disabled={recentPage <= 1} onClick={() => setRecentPage(recentPage - 1)} aria-label="Previous history page"><ChevronLeft size={18}/></button><span>Page {recent.pagination.page} of {recent.pagination.pages}</span><button type="button" className="icon-button" disabled={recentPage >= recent.pagination.pages} onClick={() => setRecentPage(recentPage + 1)} aria-label="Next history page"><ChevronRight size={18}/></button></div></> : <div className="empty-state smaller"><div className="empty-icon"><CalendarDays size={23}/></div><strong>No history yet</strong><p>Once you add a reading, it will appear here.</p></div>}
            </section>
          </div>
          <footer className="app-footer"><span>© Sweety · Made for everyday tracking</span><span>Not intended for diagnosis or treatment.</span></footer>
        </div>
      </main>
    </div>
  );
}
