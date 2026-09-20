import { useEffect, useRef, useState } from 'react';
import { saveActivityUpload } from './activityStorage';

export function useUploadActivity() {
  const mediaInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadConfirmed, setUploadConfirmed] = useState(false);
  const [confirmedRecordId, setConfirmedRecordId] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectFile = file => {
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadConfirmed(false);
    setConfirmedRecordId('');
  };

  const handleUpload = event => {
    const file = event.target.files?.[0];
    selectFile(file);
    event.target.value = '';
  };

  const clearUpload = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadConfirmed(false);
    setConfirmedRecordId('');
  };

  const confirmUpload = async () => {
    if (!selectedFile) return null;
    if (uploadConfirmed && confirmedRecordId) return { id: confirmedRecordId };

    const record = await saveActivityUpload(selectedFile);
    setUploadConfirmed(true);
    setConfirmedRecordId(record?.id || '');
    return record;
  };

  return {
    mediaInputRef,
    selectedFile,
    previewUrl,
    uploadConfirmed,
    selectFile,
    handleUpload,
    clearUpload,
    confirmUpload,
    selectMedia: () => mediaInputRef.current?.click()
  };
}
