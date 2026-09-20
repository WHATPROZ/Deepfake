import { useEffect, useState } from 'react';
import Lanyard from './components/Lanyard/Lanyard';
import Prism from './components/Prism/Prism';
import { useUploadActivity } from './features/activity/useUploadActivity';
import './UploadPage.css';

export default function UploadPage() {
  const uploadActivity = useUploadActivity();

  useEffect(() => {
    document.title = 'Upload';
  }, []);

  const goBackToOptions = () => {
    window.history.pushState({}, '', '/options');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleDragOver = event => {
    event.preventDefault();
  };

  const handleDrop = event => {
    event.preventDefault();
    uploadActivity.selectFile(event.dataTransfer.files?.[0]);
  };

  const handleAnalyse = async () => {
    if (!uploadActivity.selectedFile) {
      uploadActivity.selectMedia();
      return;
    }

    const record = await uploadActivity.confirmUpload();
    if (!record?.id) return;

    window.sessionStorage.setItem('deepnox-current-analysis-id', record.id);
    window.history.pushState({}, '', '/analysis');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <main className="upload-page" onDragOver={handleDragOver} onDrop={handleDrop}>
      <button className="upload-back-button" type="button" aria-label="Back to options" onClick={goBackToOptions}>
        <span aria-hidden="true">←</span>
      </button>
      <input
        ref={uploadActivity.mediaInputRef}
        className="upload-file-input"
        type="file"
        onChange={uploadActivity.handleUpload}
      />
      <div className="prism-backdrop">
        <Prism animationType="rotate" suspendWhenOffscreen={false} />
      </div>
      <div className="upload-stage">
        <ResponsiveLanyard
          previewUrl={uploadActivity.selectedFile?.type.startsWith('image/') ? uploadActivity.previewUrl : null}
          selectedFileName={uploadActivity.selectedFile?.name || ''}
          selectedFileType={uploadActivity.selectedFile?.type || ''}
          uploadConfirmed={uploadActivity.uploadConfirmed}
          onSelectMedia={uploadActivity.selectMedia}
          onClearUpload={uploadActivity.clearUpload}
          onAnalyse={handleAnalyse}
        />
      </div>
    </main>
  );
}

function ResponsiveLanyard({
  previewUrl,
  selectedFileName,
  selectedFileType,
  uploadConfirmed,
  onSelectMedia,
  onClearUpload,
  onAnalyse
}) {
  const initial = () => {
    if (typeof window === 'undefined') return { position: [0, 0, 30], fov: 20, lanyardWidth: 1 };
    const w = window.innerWidth;
    if (w >= 1600) return { position: [0, 3.2, 9], fov: 26, lanyardWidth: 0.95 };
    if (w >= 1400) return { position: [0, 3.0, 10], fov: 26, lanyardWidth: 0.9 };
    if (w >= 1024) return { position: [0, 2.6, 11], fov: 24, lanyardWidth: 0.78 };
    if (w >= 768) return { position: [0, 2.2, 13], fov: 22, lanyardWidth: 0.68 };
    return { position: [0, 0, 30], fov: 20, lanyardWidth: 1 };
  };

  const [cfg, setCfg] = useState(initial);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1600) setCfg({ position: [0, 3.2, 9], fov: 26, lanyardWidth: 0.95 });
      else if (w >= 1400) setCfg({ position: [0, 3.0, 10], fov: 26, lanyardWidth: 0.9 });
      else if (w >= 1024) setCfg({ position: [0, 2.6, 11], fov: 24, lanyardWidth: 0.78 });
      else if (w >= 768) setCfg({ position: [0, 2.2, 13], fov: 22, lanyardWidth: 0.68 });
      else setCfg({ position: [0, 0, 30], fov: 20, lanyardWidth: 1 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <Lanyard
      position={cfg.position}
      fov={cfg.fov}
      lanyardWidth={cfg.lanyardWidth}
      frontImage={previewUrl}
      selectedFileName={selectedFileName}
      selectedFileType={selectedFileType}
      uploadConfirmed={uploadConfirmed}
      onSelectMedia={onSelectMedia}
      onClearUpload={onClearUpload}
      onAnalyse={onAnalyse}
    />
  );
}
