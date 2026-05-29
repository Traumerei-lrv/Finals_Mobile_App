import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = '@finals_mobile_app/';

export const STORAGE_KEYS = {
  authUser: `${STORAGE_PREFIX}auth_user`,
  savedJobs: `${STORAGE_PREFIX}saved_jobs`,
  appliedJobs: `${STORAGE_PREFIX}applied_jobs`,
  recentSearches: `${STORAGE_PREFIX}recent_searches`,
  savedFilters: `${STORAGE_PREFIX}saved_filters`,
  profileSettings: `${STORAGE_PREFIX}profile_settings`,
  resumeSettings: `${STORAGE_PREFIX}resume_settings`,
  privacySettings: `${STORAGE_PREFIX}privacy_settings`,
};

const DEFAULT_PROFILE_SETTINGS = {
  fullName: 'Alex Morgan',
  headline: 'Senior Product Designer',
  location: 'Mountain View, CA',
  about:
    'Passionate Product Designer with 8+ years of experience in creating user-centric digital experiences.',
  skills: ['UX DESIGN', 'REACT NATIVE', 'FIGMA', 'LEADERSHIP', 'SYSTEMS THINKING'],
};

const DEFAULT_RESUME_SETTINGS = {
  resumeName: 'Alex_Morgan_Resume.pdf',
  resumeUpdatedAt: 'Updated 2 days ago',
  resumeSize: '2.4 MB',
  autoFill: true,
  publicVisibility: true,
  anonymousBrowsing: false,
  portfolioLinks: [
    { id: 'portfolio', label: 'Portfolio', icon: 'briefcase-outline', url: 'https://portfolio.example.com' },
    { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', url: 'https://linkedin.com/in/alexmorgan' },
    { id: 'github', label: 'GitHub', icon: 'github', url: 'https://github.com/alexmorgan' },
  ],
};

const DEFAULT_PRIVACY_SETTINGS = {
  profileVisible: true,
  recruiterMessages: true,
  activityStatus: false,
  shareAnalytics: true,
};

export async function getStoredJSON(key, fallbackValue) {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

export async function setStoredJSON(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
  return value;
}

export async function removeStoredValue(key) {
  await AsyncStorage.removeItem(key);
}

export function serializeAuthUser(user) {
  if (!user) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    emailVerified: Boolean(user.emailVerified),
    providerId: user.providerData?.[0]?.providerId ?? null,
    lastLoginAt: user.metadata?.lastSignInTime ?? null,
    createdAt: user.metadata?.creationTime ?? null,
  };
}

export async function getStoredAuthUser() {
  return getStoredJSON(STORAGE_KEYS.authUser, null);
}

export async function saveStoredAuthUser(user) {
  const safeUser = serializeAuthUser(user);

  if (!safeUser) {
    await removeStoredValue(STORAGE_KEYS.authUser);
    return null;
  }

  await setStoredJSON(STORAGE_KEYS.authUser, safeUser);
  return safeUser;
}

export async function clearStoredAuthUser() {
  await removeStoredValue(STORAGE_KEYS.authUser);
}

export async function getSavedJobs() {
  return getStoredJSON(STORAGE_KEYS.savedJobs, []);
}

function buildSavedJobId(job) {
  return [job.role, job.company, job.location].join('|').toLowerCase();
}

function normalizeSavedJob(job) {
  return {
    id: job.id ?? buildSavedJobId(job),
    role: job.role,
    company: job.company,
    location: job.location,
    salary: job.salary ?? null,
    type: job.type ?? null,
    posted: job.posted ?? null,
    icon: job.icon ?? 'office-building',
    color: job.color ?? '#1a365d',
    status: job.status ?? 'Saved',
    note: job.note ?? '',
    createdAt: job.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeAppliedJob(job) {
  return {
    ...normalizeSavedJob(job),
    status: job.status ?? 'Submitted',
    appliedAt: job.appliedAt ?? new Date().toISOString(),
  };
}

export async function saveJob(job) {
  const savedJob = normalizeSavedJob(job);
  const savedJobs = await getSavedJobs();
  const existingIndex = savedJobs.findIndex((item) => item.id === savedJob.id);

  const nextSavedJobs =
    existingIndex >= 0
      ? savedJobs.map((item, index) =>
          index === existingIndex
            ? { ...item, ...savedJob, createdAt: item.createdAt }
            : item,
        )
      : [savedJob, ...savedJobs];

  await setStoredJSON(STORAGE_KEYS.savedJobs, nextSavedJobs);
  return nextSavedJobs;
}

export async function updateSavedJob(jobId, updates) {
  const savedJobs = await getSavedJobs();
  const nextSavedJobs = savedJobs.map((item) =>
    item.id === jobId
      ? {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : item,
  );

  await setStoredJSON(STORAGE_KEYS.savedJobs, nextSavedJobs);
  return nextSavedJobs;
}

export async function removeSavedJob(jobId) {
  const savedJobs = await getSavedJobs();
  const nextSavedJobs = savedJobs.filter((item) => item.id !== jobId);

  await setStoredJSON(STORAGE_KEYS.savedJobs, nextSavedJobs);
  return nextSavedJobs;
}

export async function clearSavedJobs() {
  await removeStoredValue(STORAGE_KEYS.savedJobs);
}

export async function getAppliedJobs() {
  return getStoredJSON(STORAGE_KEYS.appliedJobs, []);
}

export async function saveAppliedJob(job) {
  const appliedJob = normalizeAppliedJob(job);
  const appliedJobs = await getAppliedJobs();
  const existingIndex = appliedJobs.findIndex((item) => item.id === appliedJob.id);

  const nextAppliedJobs =
    existingIndex >= 0
      ? appliedJobs.map((item, index) =>
          index === existingIndex
            ? { ...item, ...appliedJob, appliedAt: item.appliedAt }
            : item,
        )
      : [appliedJob, ...appliedJobs];

  await setStoredJSON(STORAGE_KEYS.appliedJobs, nextAppliedJobs);
  return nextAppliedJobs;
}

export async function updateAppliedJob(jobId, updates) {
  const appliedJobs = await getAppliedJobs();
  const nextAppliedJobs = appliedJobs.map((item) =>
    item.id === jobId
      ? {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
      : item,
  );

  await setStoredJSON(STORAGE_KEYS.appliedJobs, nextAppliedJobs);
  return nextAppliedJobs;
}

export async function removeAppliedJob(jobId) {
  const appliedJobs = await getAppliedJobs();
  const nextAppliedJobs = appliedJobs.filter((item) => item.id !== jobId);

  await setStoredJSON(STORAGE_KEYS.appliedJobs, nextAppliedJobs);
  return nextAppliedJobs;
}

export async function withdrawAppliedJob(jobId) {
  return updateAppliedJob(jobId, {
    status: 'WITHDRAWN',
    withdrawnAt: new Date().toISOString(),
  });
}

export async function clearAppliedJobs() {
  await removeStoredValue(STORAGE_KEYS.appliedJobs);
}

export async function getRecentSearches() {
  return getStoredJSON(STORAGE_KEYS.recentSearches, []);
}

export async function saveRecentSearch(query) {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return getRecentSearches();
  }

  const recentSearches = await getRecentSearches();
  const nextRecentSearches = [
    normalizedQuery,
    ...recentSearches.filter(
      (item) => item.toLowerCase() !== normalizedQuery.toLowerCase(),
    ),
  ].slice(0, 5);

  await setStoredJSON(STORAGE_KEYS.recentSearches, nextRecentSearches);
  return nextRecentSearches;
}

export async function clearRecentSearches() {
  await removeStoredValue(STORAGE_KEYS.recentSearches);
}

export async function getSavedFilters() {
  return getStoredJSON(STORAGE_KEYS.savedFilters, null);
}

export async function saveSavedFilters(filters) {
  await setStoredJSON(STORAGE_KEYS.savedFilters, filters);
  return filters;
}

export async function getProfileSettings() {
  const settings = await getStoredJSON(STORAGE_KEYS.profileSettings, DEFAULT_PROFILE_SETTINGS);
  return { ...DEFAULT_PROFILE_SETTINGS, ...settings };
}

export async function saveProfileSettings(settings) {
  const nextSettings = {
    ...DEFAULT_PROFILE_SETTINGS,
    ...settings,
    skills: Array.isArray(settings?.skills) ? settings.skills : DEFAULT_PROFILE_SETTINGS.skills,
  };
  await setStoredJSON(STORAGE_KEYS.profileSettings, nextSettings);
  return nextSettings;
}

export async function getResumeSettings() {
  const settings = await getStoredJSON(STORAGE_KEYS.resumeSettings, DEFAULT_RESUME_SETTINGS);
  return {
    ...DEFAULT_RESUME_SETTINGS,
    ...settings,
    portfolioLinks: Array.isArray(settings?.portfolioLinks)
      ? settings.portfolioLinks
      : DEFAULT_RESUME_SETTINGS.portfolioLinks,
  };
}

export async function saveResumeSettings(settings) {
  const nextSettings = {
    ...DEFAULT_RESUME_SETTINGS,
    ...settings,
    portfolioLinks: Array.isArray(settings?.portfolioLinks)
      ? settings.portfolioLinks
      : DEFAULT_RESUME_SETTINGS.portfolioLinks,
  };
  await setStoredJSON(STORAGE_KEYS.resumeSettings, nextSettings);
  return nextSettings;
}

export async function getPrivacySettings() {
  const settings = await getStoredJSON(STORAGE_KEYS.privacySettings, DEFAULT_PRIVACY_SETTINGS);
  return { ...DEFAULT_PRIVACY_SETTINGS, ...settings };
}

export async function savePrivacySettings(settings) {
  const nextSettings = { ...DEFAULT_PRIVACY_SETTINGS, ...settings };
  await setStoredJSON(STORAGE_KEYS.privacySettings, nextSettings);
  return nextSettings;
}
