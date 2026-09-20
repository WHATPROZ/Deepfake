import { useEffect, useRef } from 'react';
import DotField from './components/DotField/DotField';
import VariableProximity from './components/VariableProximity/VariableProximity';
import './AboutDeepnoxPage.css';

const HERO_TITLE = 'Deepfake detection built for fast media verification.';

const workflowSteps = [
  {
    title: 'Upload',
    body:
      'Start by choosing an image or video directly from your device. Deepnox accepts common media formats and prepares the file for analysis without making the workflow feel heavy.'
  },
  {
    title: 'AI Analysis',
    body:
      'The media is preprocessed through a TensorFlow-powered pipeline that extracts visual signals, frame-level details, and patterns that may indicate synthetic manipulation.'
  },
  {
    title: 'Deep Learning Detection',
    body:
      'A custom-trained deep learning model studies the processed features for deepfake artifacts, compression inconsistencies, facial distortions, and other AI-generation traces.'
  },
  {
    title: 'Results',
    body:
      'Deepnox returns a clear prediction with a confidence score, helping you understand whether the uploaded media appears authentic or AI-generated.'
  }
];

const featureCards = [
  {
    title: 'Upload',
    body: 'The upload card is the entry point for verification. Pick a photo or video, preview it, confirm it, and send it into the checking workflow.'
  },
  {
    title: 'Previous Activity',
    body: 'A persistent visual history of checked uploads. It keeps older media available after refresh or reopen, so your verification trail does not disappear.'
  },
  {
    title: 'Reports',
    body: 'Reports should become the detailed result space: prediction, confidence score, risk level, media preview, and any notes tied to the selected upload.'
  },
  {
    title: 'Dashboard',
    body: 'The dashboard can summarize the whole system: total checks, photo/video split, recent activity, flagged results, and shortcuts into upload or reports.'
  }
];

export default function AboutDeepnoxPage() {
  const heroTitleRef = useRef(null);

  useEffect(() => {
    document.title = 'About Deepnox';
  }, []);

  const goBackToOptions = () => {
    window.history.pushState({}, '', '/options');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className="about-page">
      <div className="about-bg" aria-hidden="true">
        <DotField
          className="about-dot-bg"
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
        />
      </div>

      <button className="about-back-button" type="button" aria-label="Back to options" onClick={goBackToOptions}>
        <span aria-hidden="true">&larr;</span>
      </button>

      <section className="about-shell" aria-label="About Deepnox">
        <div className="about-hero">
          <p className="about-kicker">About Deepnox</p>
          <h1 ref={heroTitleRef}>
            <VariableProximity
              label={HERO_TITLE}
              className="about-variable-title"
              fromFontVariationSettings="'wght' 400"
              toFontVariationSettings="'wght' 900"
              containerRef={heroTitleRef}
              radius={100}
              falloff="linear"
            />
          </h1>
          <p className="about-intro">
            Deepnox is a full-stack AI-powered web application designed to detect deepfake images and videos using a
            custom-trained TensorFlow model. It gives users a focused way to check whether media appears authentic or
            AI-generated.
          </p>
          <p className="about-summary">
            The experience is simple: upload a photo or video, confirm it, and let Deepnox run the file through its AI
            analysis pipeline. In a few seconds, the system can return a prediction, confidence score, and a clearer
            path toward understanding the authenticity of the media.
          </p>
        </div>

        <div className="about-workflow">
          <div className="about-section-heading">
            <p>How it works</p>
            <h2>From upload to result</h2>
          </div>

          <div className="workflow-grid">
            {workflowSteps.map((step, index) => (
              <article className="workflow-step" key={step.title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="about-features">
          <div className="about-section-heading">
            <p>What each feature does</p>
            <h2>Your verification workspace</h2>
          </div>

          <div className="feature-grid">
            {featureCards.map(feature => (
              <article className="feature-card" key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
