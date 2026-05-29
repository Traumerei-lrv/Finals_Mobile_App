import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

function sanitizeFileName(name) {
  return String(name || 'resume.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadResumeForApplicant({ applicantId, fileAsset }) {
  if (!applicantId) {
    throw new Error('Missing applicantId');
  }
  if (!fileAsset?.uri) {
    throw new Error('Missing file uri');
  }

  const safeName = sanitizeFileName(fileAsset.name);
  const path = `resumes/${applicantId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  const response = await fetch(fileAsset.uri);
  const blob = await response.blob();
  const metadata = fileAsset.mimeType ? { contentType: fileAsset.mimeType } : undefined;

  await uploadBytes(storageRef, blob, metadata);
  const downloadUrl = await getDownloadURL(storageRef);

  return {
    resumeUrl: downloadUrl,
    resumePath: path,
    resumeFileName: safeName,
  };
}
