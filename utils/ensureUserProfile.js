import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

function getNormalizedRole(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const role = value.trim().toLowerCase();

  if (role === 'recruiter' || role === 'admin') {
    return role;
  }

  if (role === 'job_seeker' || role === 'job seeker' || role === 'seeker') {
    return 'job_seeker';
  }

  return null;
}

export async function ensureUserProfile(user, fallbackRole = 'job_seeker') {
  const uid = user?.uid;

  if (!uid) {
    return null;
  }

  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const existingProfile = userSnap.exists() ? userSnap.data() : null;

  if (existingProfile) {
    return existingProfile;
  }

  const role = getNormalizedRole(fallbackRole) ?? 'job_seeker';
  const fullName =
    typeof user?.displayName === 'string' && user.displayName.trim()
      ? user.displayName.trim()
      : null;
  const email =
    typeof user?.email === 'string' && user.email.trim()
      ? user.email.trim().toLowerCase()
      : null;

  const profilePayload = {
    role,
    createdAt: serverTimestamp(),
  };

  if (fullName) {
    profilePayload.fullName = fullName;
  }

  if (email) {
    profilePayload.email = email;
  }

  await setDoc(userRef, profilePayload, { merge: true });

  return {
    ...profilePayload,
    fullName,
    email,
  };
}
