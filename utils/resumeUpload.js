import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

function sanitizeFileName(name) {
  return String(name || 'resume.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function uriToBlob(uri, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = timeoutMs;
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error('Failed to read selected file.'));
    xhr.ontimeout = () => reject(new Error('Reading selected file timed out.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send();
  });
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('Failed to read selected file from browser.');
  }
  return response.blob();
}

async function resolveUploadSource(fileAsset) {
  // Web DocumentPicker exposes a native File object; prefer this to avoid URI fetch stalls.
  if (fileAsset?.file) {
    return fileAsset.file;
  }
  if (typeof fileAsset?.uri === 'string' && fileAsset.uri.startsWith('data:')) {
    return dataUrlToBlob(fileAsset.uri);
  }
  return uriToBlob(fileAsset.uri);
}

function uploadResumableWithProgress({ storageRef, fileData, metadata, onProgress, timeoutMs = 120000 }) {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, fileData, metadata);
    const overallTimer = setTimeout(() => {
      task.cancel();
      reject(new Error('Resume upload timed out. Please retry on a stable connection.'));
    }, timeoutMs);

    task.on(
      'state_changed',
      (snapshot) => {
        const total = snapshot.totalBytes || 0;
        const transferred = snapshot.bytesTransferred || 0;
        const progress = total > 0 ? transferred / total : 0;
        if (typeof onProgress === 'function') onProgress(progress, snapshot);
      },
      (error) => {
        clearTimeout(overallTimer);
        reject(error);
      },
      () => {
        clearTimeout(overallTimer);
        resolve(task.snapshot);
      },
    );
  });
}

export async function uploadResumeForApplicant({ applicantId, fileAsset, onProgress }) {
  if (!applicantId) {
    throw new Error('Missing applicantId');
  }
  if (!fileAsset?.uri) {
    throw new Error('Missing file uri');
  }

  const safeName = sanitizeFileName(fileAsset.name);
  const path = `resumes/${applicantId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);
  const metadata = fileAsset.mimeType ? { contentType: fileAsset.mimeType } : undefined;

  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const fileData = await resolveUploadSource(fileAsset);
      await uploadResumableWithProgress({ storageRef, fileData, metadata, onProgress });
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt >= 2) {
        break;
      }
    }
  }

  if (lastError) {
    const code = String(lastError?.code ?? '').toLowerCase();
    if (code.includes('permission-denied')) {
      throw new Error('Resume upload blocked by permissions. Please sign in again and retry.');
    }
    if (code.includes('unauthenticated') || code.includes('auth')) {
      throw new Error('Resume upload requires a valid session. Please sign in again.');
    }
    throw lastError;
  }

  const downloadUrl = await getDownloadURL(storageRef);

  return {
    resumeUrl: downloadUrl,
    resumePath: path,
    resumeFileName: safeName,
  };
}
