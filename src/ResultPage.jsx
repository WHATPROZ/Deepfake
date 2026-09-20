import { useEffect, useState } from 'react';
import Lightfall from './components/Lightfall/Lightfall';
import { getActivityUploadById, getActivityUploads } from './features/activity/activityStorage';
import './ResultPage.css';

function formatUploadedAt(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function ResultPage() {
  const [record, setRecord] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    document.title = 'Result';

    let objectUrl = '';
    let isMounted = true;

    const loadRecord = async () => {
      const currentId = window.sessionStorage.getItem('deepnox-current-analysis-id');
      const selectedRecord = currentId
        ? await getActivityUploadById(currentId)
        : (await getActivityUploads()).at(-1) || null;

      if (!isMounted) return;

      setRecord(selectedRecord);
      if (selectedRecord?.previewBlob || selectedRecord?.blob) {
        objectUrl = URL.createObjectURL(selectedRecord.previewBlob || selectedRecord.blob);
        setPreviewUrl(objectUrl);
      }
    };

    loadRecord().catch(() => {
      if (isMounted) setRecord(null);
    });

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const goBackToOptions = () => {
    window.history.pushState({}, '', '/options');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className="result-page">
      <div className="result-bg" aria-hidden="true">
        <Lightfall
          colors={['#A6C8FF', '#5227FF', '#FF9FFC']}
          backgroundColor="#0A29FF"
          speed={1}
          streakCount={8}
          streakWidth={1}
          streakLength={1}
          glow={1}
          density={1}
          twinkle={1}
          zoom={2}
          backgroundGlow={1}
          opacity={1}
          mouseInteraction={true}
          mouseStrength={1}
          mouseRadius={0.6}
        />
      </div>

      <button className="result-back-button" type="button" aria-label="Back to options" onClick={goBackToOptions}>
        <span aria-hidden="true">&larr;</span>
      </button>

      <section className="result-shell" aria-label="Deepnox AI result">
        <header className="result-header">
          <p>Deepnox AI</p>
          <h1>Media result</h1>
        </header>

        <div className="result-grid">
          <div className="result-preview">
            {previewUrl ? <img src={previewUrl} alt={record?.name || 'Uploaded media'} /> : <span>No media selected</span>}
          </div>

          <div className="result-details">
            <div>
              <span>File</span>
              <strong>{record?.name || 'Waiting for media'}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{record?.kind || 'MEDIA'}</strong>
            </div>
            <div>
              <span>Uploaded</span>
              <strong>{formatUploadedAt(record?.createdAt)}</strong>
            </div>
            <div className="result-score">
              <span>AI report</span>
              <strong>AI --</strong>
              <strong>Human --</strong>
            </div>
            <p>The backend can fill this panel with the model prediction, AI percentage, and human percentage once connected.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
