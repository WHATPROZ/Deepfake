const DB_NAME = 'deepnox-activity';
const DB_VERSION = 1;
const STORE_NAME = 'uploads';

function openActivityDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.84) {
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), type, quality);
  });
}

async function createVideoThumbnail(file) {
  const video = document.createElement('video');
  const url = URL.createObjectURL(file);

  try {
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
    });

    video.currentTime = Math.min(0.25, Math.max(0, (video.duration || 1) / 8));

    await new Promise((resolve, reject) => {
      video.onseeked = resolve;
      video.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 650;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
    const dw = video.videoWidth * scale;
    const dh = video.videoHeight * scale;
    const dx = (canvas.width - dw) / 2;
    const dy = (canvas.height - dh) / 2;

    ctx.fillStyle = '#05070b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, dx, dy, dw, dh);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 42, canvas.height / 2 - 56);
    ctx.lineTo(canvas.width / 2 - 42, canvas.height / 2 + 56);
    ctx.lineTo(canvas.width / 2 + 58, canvas.height / 2);
    ctx.closePath();
    ctx.fill();

    return (await canvasToBlob(canvas)) || file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function createVideoFallbackThumbnail() {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 650;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#05070b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1c2430';
  ctx.fillRect(64, 64, canvas.width - 128, canvas.height - 128);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = 6;
  ctx.strokeRect(64, 64, canvas.width - 128, canvas.height - 128);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 48, canvas.height / 2 - 66);
  ctx.lineTo(canvas.width / 2 - 48, canvas.height / 2 + 66);
  ctx.lineTo(canvas.width / 2 + 68, canvas.height / 2);
  ctx.closePath();
  ctx.fill();

  return canvasToBlob(canvas);
}

async function createPreviewBlob(file) {
  if (file.type.startsWith('image/')) return file;

  try {
    return await createVideoThumbnail(file);
  } catch {
    return (await createVideoFallbackThumbnail()) || file;
  }
}

export async function saveActivityUpload(file) {
  if (!file) return null;

  const db = await openActivityDb();
  const previewBlob = await createPreviewBlob(file);
  const kind = file.type.startsWith('video/') ? 'VIDEO' : file.type.startsWith('image/') ? 'PHOTO' : 'MEDIA';
  const record = {
    id: `${Date.now()}-${
      globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(16).slice(2)
    }`,
    name: file.name,
    type: file.type,
    kind,
    blob: file,
    previewBlob,
    createdAt: Date.now()
  };

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });

  db.close();
  return record;
}

export async function getActivityUploads() {
  const db = await openActivityDb();

  const records = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return records.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getActivityUploadById(id) {
  if (!id) return null;

  const db = await openActivityDb();

  const record = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  db.close();
  return record;
}

export function activityRecordToGalleryItem(record, index = 0) {
  const image = URL.createObjectURL(record.previewBlob || record.blob);
  const kind = record.kind === 'VIDEO' ? 'Video' : record.kind === 'PHOTO' ? 'Photo' : 'Media';
  const uploadedDate = new Date(record.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return {
    image,
    text: `${kind} ${index + 1} - ${uploadedDate}`,
    objectUrl: image
  };
}
