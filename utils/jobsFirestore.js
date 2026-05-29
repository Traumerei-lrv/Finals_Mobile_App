import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const DEFAULT_RESPONSIBILITIES = [
  'Collaborate with cross-functional teams to deliver high-impact features.',
  'Own delivery quality from planning through release.',
  'Translate user and business needs into practical execution plans.',
];

const DEFAULT_QUALIFICATIONS = [
  '3+ years of relevant professional experience.',
  'Strong communication and collaboration skills.',
  'Ability to work in a fast-paced environment with shifting priorities.',
];

function toMillis(value) {
  if (!value) return Date.now();
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
}

function formatPostedLabel(postedAt) {
  const postedMs = toMillis(postedAt);
  const diffDays = Math.max(0, Math.round((Date.now() - postedMs) / 86400000));

  if (diffDays === 0) return 'Posted today';
  if (diffDays === 1) return 'Posted yesterday';
  if (diffDays < 7) return `Posted ${diffDays} days ago`;

  const diffWeeks = Math.round(diffDays / 7);
  if (diffWeeks < 5) return `Posted ${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;

  return `Posted on ${new Date(postedMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function normalizeJob(raw, id) {
  const role = raw?.role ?? raw?.title ?? 'Untitled Role';
  const company = raw?.company ?? 'Unknown Company';
  const location = raw?.location ?? 'Remote';
  const type = raw?.type ?? 'Full-time';
  const tags = Array.isArray(raw?.tags) && raw.tags.length ? raw.tags : [type];
  const salary = raw?.salary ?? 'Competitive';
  const postedAt = raw?.postedAt ?? raw?.createdAt ?? null;

  return {
    id,
    role,
    company,
    location,
    salary,
    salaryPeriod: raw?.salaryPeriod ?? '/ year',
    type,
    tags,
    icon: raw?.icon ?? 'office-building',
    color: raw?.color ?? '#1a365d',
    imageUrl:
      raw?.imageUrl ??
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop',
    logoUrl:
      raw?.logoUrl ??
      'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=300&auto=format&fit=crop',
    about:
      raw?.about ??
      `${company} is hiring a ${role} to help scale product quality and business impact across the team.`,
    responsibilities:
      Array.isArray(raw?.responsibilities) && raw.responsibilities.length
        ? raw.responsibilities
        : DEFAULT_RESPONSIBILITIES,
    qualifications:
      Array.isArray(raw?.qualifications) && raw.qualifications.length
        ? raw.qualifications
        : DEFAULT_QUALIFICATIONS,
    recruiterId: raw?.recruiterId ?? null,
    status: raw?.status ?? 'open',
    posted: raw?.posted ?? formatPostedLabel(postedAt),
    createdAtMs: toMillis(raw?.createdAt ?? raw?.postedAt),
  };
}

export function subscribeToOpenJobs(onJobs, onError) {
  return onSnapshot(
    collection(db, 'jobs'),
    (snapshot) => {
      const nextJobs = snapshot.docs
        .map((jobDoc) => normalizeJob(jobDoc.data(), jobDoc.id))
        .filter((job) => job.status !== 'closed')
        .sort((a, b) => b.createdAtMs - a.createdAtMs);

      onJobs(nextJobs);
    },
    (error) => {
      if (typeof onError === 'function') {
        onError(error);
      } else {
        console.error('Failed to subscribe to jobs', error);
      }
    },
  );
}

export function searchJobsFromList(jobs, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) return jobs;

  return jobs.filter((job) => {
    const haystack = [
      job.role,
      job.company,
      job.location,
      job.type,
      job.salary,
      ...(job.tags ?? []),
      job.about,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export async function createRecruiterJobPosting({ recruiterId, draft }) {
  if (!recruiterId) {
    throw new Error('Missing recruiterId');
  }

  const role = draft?.role?.trim() || 'Untitled Role';
  const company = draft?.company?.trim() || 'Unknown Company';
  const location = draft?.location?.trim() || 'Remote';
  const salary = draft?.salary?.trim() || 'Competitive';
  const type = draft?.type?.trim() || 'Full-time';

  const payload = {
    recruiterId,
    role,
    company,
    location,
    salary,
    salaryPeriod: '/ year',
    type,
    tags: [type],
    status: 'open',
    about:
      draft?.about?.trim() ||
      `${company} is looking for a ${role} to join the team and deliver meaningful product impact.`,
    responsibilities: DEFAULT_RESPONSIBILITIES,
    qualifications: DEFAULT_QUALIFICATIONS,
    icon: 'office-building',
    color: '#1a365d',
    createdAt: serverTimestamp(),
    postedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'jobs'), payload);
  return ref.id;
}
