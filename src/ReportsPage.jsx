import { useEffect, useMemo, useState } from 'react';
import Scanner from './components/Scanner/Scanner';
import TextPressure from './components/TextPressure/TextPressure';
import { getActivityUploads } from './features/activity/activityStorage';
import './ReportsPage.css';

function formatUploadedAt(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getReportFields(record) {
  const analysis = record.analysis || record.report || null;
  const prediction = analysis?.prediction || analysis?.label || analysis?.result;
  const confidence = analysis?.confidence ?? analysis?.score;

  return {
    report: prediction ? String(prediction) : '',
    aiShare: typeof confidence === 'number' ? `${Math.round(confidence * 100)}% AI` : 'AI --',
    ogShare: typeof confidence === 'number' ? `${Math.round((1 - confidence) * 100)}% Original` : 'Original --',
    status: prediction ? 'Calculated' : 'Waiting'
  };
}

export default function ReportsPage() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'Reports';

    let isMounted = true;

    getActivityUploads()
      .then(items => {
        if (isMounted) {
          setRecords(items);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const rows = useMemo(() => [...records].sort((a, b) => a.createdAt - b.createdAt), [records]);

  const goBackToOptions = () => {
    window.history.pushState({}, '', '/options');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className="reports-page">
      <div className="reports-bg" aria-hidden="true">
        <Scanner
          className="reports-scanner-bg"
          color1="#5227FF"
          color2="#FF9FFC"
          color3="#FFFFFF"
          speed={0.38}
          sweepSpeed={0.18}
          sweepWidth={1.8}
          sweepFalloff={6}
          scale={1.4}
          frequency={2}
          ripple={0.18}
          bandDensity={10}
          lineSharpness={5.5}
          glow={0.18}
          scanDirection="vertical"
          colorSpread={0.65}
          brightness={0.85}
          contrast={1.12}
          softness={1.4}
          vignette={0.5}
          scanline={true}
          grain={true}
          grainIntensity={0.04}
          opacity={0.82}
          mouseInteraction={true}
          mouseRadius={0.5}
          mouseStrength={0.45}
        />
      </div>

      <button className="reports-back-button" type="button" aria-label="Back to options" onClick={goBackToOptions}>
        <span aria-hidden="true">&larr;</span>
      </button>

      <section className="reports-shell" aria-label="Reports">
        <header className="reports-header">
          <p>Reports</p>
          <div className="reports-pressure-title" aria-label="AI media analysis log">
            <TextPressure
              text="AI media analysis log"
              flex={true}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={true}
              textColor="#ffffff"
              strokeColor="#ff0000"
              minFontSize={36}
            />
          </div>
        </header>

        <div className="reports-table-wrap">
          {isLoading ? (
            <div className="reports-empty">Loading reports...</div>
          ) : rows.length ? (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>S. No.</th>
                  <th>Date</th>
                  <th>Media Type</th>
                  <th>File</th>
                  <th>AI Report</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((record, index) => {
                  const report = getReportFields(record);

                  return (
                    <tr key={record.id}>
                      <td className="reports-serial">{index + 1}</td>
                      <td>{formatUploadedAt(record.createdAt)}</td>
                      <td>
                        <span className="reports-pill">{record.kind || (record.type?.startsWith('video/') ? 'VIDEO' : 'PHOTO')}</span>
                      </td>
                      <td>{record.name || 'Unnamed media'}</td>
                      <td className="reports-ai-cell">
                        <div className="reports-ai-values">
                          {report.report ? <strong>{report.report}</strong> : null}
                          <span>{report.aiShare}</span>
                          <span>{report.ogShare}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`reports-status reports-status--${report.status.toLowerCase()}`}>{report.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="reports-empty">No checked uploads yet</div>
          )}
        </div>
      </section>
    </main>
  );
}
