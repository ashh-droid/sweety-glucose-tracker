import { useCallback, useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import Brand from './Brand.jsx';
import DateNav from './DateNav.jsx';
import DayEntries from './DayEntries.jsx';
import ReportLedger from './ReportLedger.jsx';
import MonthGrid from './MonthGrid.jsx';
import History from './History.jsx';
import { api, localDate } from '../lib/api.js';

const emptyHistory = { readings: [], pagination: { page: 1, pages: 0, total: 0 } };

export default function Dashboard({ user, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(localDate());
  const [focusRequest, setFocusRequest] = useState(null);
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [report, setReport] = useState(null);
  const [recent, setRecent] = useState(emptyHistory);
  const [recentPage, setRecentPage] = useState(1);
  const [monthReadings, setMonthReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [monthError, setMonthError] = useState('');
  const [notice, setNotice] = useState('');
  const [version, setVersion] = useState(0);

  const changeDate = (date) => {
    if (!date || date > localDate()) return;
    setNotice('');
    setSelectedDate(date);
    setMonth(date.slice(0, 7));
  };

  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  const selectCell = (date, slot) => {
    changeDate(date);
    setFocusRequest({ date, slot, nonce: Date.now() + Math.random() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      api(`/reports?date=${encodeURIComponent(selectedDate)}`),
      api(`/readings?page=${recentPage}&limit=8`)
    ]).then(([summaries, history]) => {
      if (!active) return;
      setReport(summaries);
      setRecent(history);
    }).catch((err) => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [selectedDate, recentPage, version]);

  useEffect(() => {
    let active = true;
    setMonthLoading(true);
    setMonthError('');
    api(`/readings/month?month=${encodeURIComponent(month)}`)
      .then(({ readings }) => { if (active) setMonthReadings(readings); })
      .catch((err) => { if (active) setMonthError(err.message); })
      .finally(() => { if (active) setMonthLoading(false); });
    return () => { active = false; };
  }, [month, version]);

  async function saveReading(data, existing) {
    setSaving(true);
    setNotice('');
    try {
      await api(existing ? `/readings/${existing.id}` : '/readings', {
        method: existing ? 'PATCH' : 'POST', body: JSON.stringify(data)
      });
      setNotice(existing ? 'Reading updated.' : 'Reading recorded.');
      setRecentPage(1);
      refresh();
    } finally { setSaving(false); }
  }

  async function deleteReading(existing) {
    setSaving(true);
    setNotice('');
    try {
      await api(`/readings/${existing.id}`, { method: 'DELETE' });
      setNotice('Reading deleted.');
      setRecentPage(1);
      refresh();
    } finally { setSaving(false); }
  }

  return (
    <div className="logbook-shell">
      <header className="masthead no-print">
        <div className="masthead-inner">
          <div className="identity"><Brand /><span className="identity-divider"/><span className="identity-meta">Logbook <span>|</span> {user.name}</span></div>
          <div className="masthead-actions"><DateNav date={selectedDate} onChange={changeDate} />
            <button type="button" className="sign-out" onClick={onLogout}><LogOut size={16}/> <span>Sign out</span></button>
          </div>
        </div>
      </header>
      <main className="logbook-main">
        <div className="print-title print-only"><h1>Sweety | Glucose logbook</h1><p>{user.name} · {month}</p></div>
        {selectedDate !== localDate() && <div className="past-date-notice no-print" role="status">
          <span>Viewing {new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(selectedDate + 'T12:00:00'))}</span>
          <button type="button" onClick={() => changeDate(localDate())}>Back to today</button>
        </div>}
        {error && <div role="alert" className="alert error no-print">{error} <button type="button" className="inline-link" onClick={refresh}>Retry</button></div>}
        {notice && <div role="status" className="alert success no-print">{notice}</div>}
        {loading && (!report || report.selectedDate !== selectedDate) ? <p role="status" className="loading-text">Loading your logbook...</p> : report && report.selectedDate === selectedDate && <>
          <div className="no-print"><DayEntries date={selectedDate} readings={report.daily.readings} busy={saving} onSave={saveReading} onDelete={deleteReading} focusRequest={focusRequest}/></div>
          <div className="no-print"><ReportLedger report={report}/></div>
        </>}
        <MonthGrid month={month} onChange={setMonth} readings={monthReadings} loading={monthLoading}
          error={monthError} onSelectDate={(date) => { changeDate(date); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onSelectCell={selectCell}/>
        <div className="no-print"><History recent={recent} page={recentPage} onPageChange={setRecentPage}/></div>
        <footer className="logbook-footer no-print"><span>Sweety | Your personal reading log</span><span>Tracking only. Not for diagnosis or treatment.</span></footer>
      </main>
    </div>
  );
}
