import { ChevronLeft, ChevronRight } from 'lucide-react';
import { prettyDate, slotLabel } from '../lib/api.js';

export default function History({ recent, page, onPageChange }) {
  const { readings, pagination } = recent;
  return (
    <section className="section history-section" aria-labelledby="history-title">
      <div className="section-head"><div><p className="section-kicker">RECENT ENTRIES</p><h2 id="history-title">Reading history</h2></div><span className="section-caption">{pagination.total} total</span></div>
      {readings.length === 0 ? <p className="history-empty">No entries yet. Your reading history will appear here.</p> : (
        <>
          <ul className="history-list">
            {readings.map((reading) => <li key={reading.id}>
              <span>{prettyDate(reading.date)} <small>· {slotLabel(reading.slot)}</small></span>
              <strong>{reading.value} <small>mg/dl</small></strong>
            </li>)}
          </ul>
          {pagination.pages > 1 && <div className="history-pager">
            <button type="button" className="icon-button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous history page"><ChevronLeft size={18}/></button>
            <span>Page {page} of {pagination.pages}</span>
            <button type="button" className="icon-button" disabled={page >= pagination.pages} onClick={() => onPageChange(page + 1)} aria-label="Next history page"><ChevronRight size={18}/></button>
          </div>}
        </>
      )}
    </section>
  );
}
