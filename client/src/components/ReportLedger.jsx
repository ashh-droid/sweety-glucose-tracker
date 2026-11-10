import { prettyDate } from '../lib/api.js';

function periodLabel(range) {
  return range.from === range.to
    ? prettyDate(range.from)
    : `${prettyDate(range.from)} – ${prettyDate(range.to)}`;
}

function ReportItem({ title, data }) {
  return (
    <article className="ledger-item" aria-label={`${title} summary`}>
      <h3>{title}</h3>
      <p className="ledger-dates">{periodLabel(data.range)}</p>
      {data.count ? (
        <>
          <div className="ledger-average"><strong>{Number(data.average).toFixed(1)}</strong><span>mg/dl avg.</span></div>
          <dl className="ledger-details">
            <div><dt>Low</dt><dd>{data.lowest}</dd></div>
            <div><dt>High</dt><dd>{data.highest}</dd></div>
            <div><dt>Entries</dt><dd>{data.count}</dd></div>
          </dl>
        </>
      ) : (
        <p className="ledger-empty">No readings in this period.</p>
      )}
    </article>
  );
}

export default function ReportLedger({ report }) {
  return (
    <section className="section ledger-section" aria-labelledby="report-title">
      <div className="section-head">
        <div><p className="section-kicker">YOUR SUMMARY</p><h2 id="report-title">Report ledger</h2></div>
        <span className="section-caption">Average, low, high &amp; count</span>
      </div>
      <div className="ledger-grid">
        <ReportItem title="Selected day" data={report.daily} />
        <ReportItem title="Month to date" data={report.monthToDate} />
        <ReportItem title="Previous month" data={report.previousMonth} />
      </div>
    </section>
  );
}
