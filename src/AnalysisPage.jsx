import { useEffect } from 'react';
import LetterGlitch from './components/LetterGlitch/LetterGlitch';
import './AnalysisPage.css';

export default function AnalysisPage() {
  useEffect(() => {
    document.title = 'Analysing';

    const timer = window.setTimeout(() => {
      window.history.pushState({}, '', '/result');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, 2800);

    return () => window.clearTimeout(timer);
  }, []);

  const goBackToUpload = () => {
    window.history.pushState({}, '', '/upload');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className="analysis-page">
      <LetterGlitch glitchSpeed={50} centerVignette={true} outerVignette={false} smooth={true} />
      <button className="analysis-back-button" type="button" aria-label="Back to upload" onClick={goBackToUpload}>
        <span aria-hidden="true">&larr;</span>
      </button>
      <section className="analysis-panel" aria-live="polite">
        <p>Deepnox AI</p>
        <h1>Analysing media</h1>
      </section>
    </main>
  );
}
