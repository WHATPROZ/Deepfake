import React from 'react';

export default function UploadCard({ selectedFile, previewUrl, onFileChange, onAnalyze }) {
  const isImage = selectedFile && selectedFile.type.startsWith('image/');
  const isVideo = selectedFile && selectedFile.type.startsWith('video/');

  return (
    <div style={{ width: 300, background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 6px 20px rgba(0,0,0,0.4)', color: '#111' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <img src="/deepnox-logo.png" alt="Deepnox" style={{ maxWidth: '70%', height: 'auto' }} />
      </div>

      <div style={{ width: '75%', height: 100, border: '1px dashed #999', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginTop: 12, marginLeft: 'auto', marginRight: 'auto', background: 'transparent' }}>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <input type="file" accept="image/*,video/*" onChange={onFileChange} />
        <button onClick={onAnalyze} disabled={!selectedFile} style={{ marginLeft: 'auto', padding: '8px 12px', background: selectedFile ? '#111' : '#ddd', color: selectedFile ? '#fff' : '#666', border: 'none', borderRadius: 6, cursor: selectedFile ? 'pointer' : 'default' }}>
          START ANALYSING
        </button>
      </div>
    </div>
  );
}
