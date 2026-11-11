import { prettyDate } from '../lib/api.js';

function periodLabel(range) {
  return range.from === range.to
    ? prettyDate(range.from)
    : `${prettyDate(range.from)} to ${prettyDate(range.to)}`;
}

function ReportItem({ title, data, comparison }) {
  const hasComparison = data?.count > 0 && comparison?.count > 0;
  const difference = hasComparison ? Number((data.average - comparison.average).toFixed(1)) : null;
  return (
    <article className="ledger-item" aria-label={`${title} summary`}>
      <h3>{title}</h3>
      <p className="ledger-dates">{periodLabel(data.range)}</p>
      {data.count ? (
        <>
          <div className="ledger-average">
            <strong>{Number(data.average).toFixed(1)}</strong><span>mg/dl average</span>
          </div>
          <dl className="ledger-details">
            <div><dt>Lowest</dt><dd>{data.lowest}</dd></div>
            <div><dt>Highest</dt><dd>{data.highest}</dd></div>
            <div><dt>Readings</dt><dd>{data.count}</dd></div>
          </dl>
          <p className="ledger-band">Within 70–180 reference band: <strong>{data.inRangeCount ?? 0} of {data.count}</strong></p>
          {hasComparison && <p className="ledger-comparison">
            {difference === 0 ? 'No change' : difference > 0 ? `↑ ${difference} mg/dl` : `↓ ${Math.abs(difference)} mg/dl`}
            <span> vs. equivalent dates last month</span>
          </p>}
        </>
      ) : <p className="ledger-empty">No readings in this period.</p>}
    </article>
  );
}

export default function ReportLedger({ report }) {
  return (
    <section className="section ledger-section" aria-labelledby="report-title">
      <div className="section-head"><h2 id="report-title">Reports</h2></div>
      <div className="ledger-grid">
        <ReportItem title="Selected day" data={report.daily} />
        <ReportItem title="Month to date" data={report.monthToDate} comparison={report.previousMonthComparable} />
        <ReportItem title="Previous month" data={report.previousMonth} />
      </div>
    </section>
  );
}
