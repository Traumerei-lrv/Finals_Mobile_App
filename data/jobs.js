import rawJobs from './jobs.generated.json';

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

function buildKey(job) {
  return [job.role, job.company, job.location].join('|').toLowerCase();
}

function normalizeLocation(location) {
  if (!location) {
    return 'Remote';
  }

  if (typeof location === 'string') {
    return location;
  }

  const parts = [];

  if (location.remote) {
    parts.push('Remote');
  } else if (location.city) {
    parts.push(location.city);
  }

  if (location.region && location.region !== location.city) {
    parts.push(location.region);
  }

  if (location.country && location.country !== location.region) {
    parts.push(location.country);
  }

  return parts.length ? parts.join(', ') : 'Remote';
}

function formatPostedLabel(postedAt) {
  if (!postedAt) {
    return 'Recently posted';
  }

  const postedDate = new Date(postedAt);

  if (Number.isNaN(postedDate.getTime())) {
    return 'Recently posted';
  }

  const now = new Date();
  const diffDays = Math.max(0, Math.round((now.getTime() - postedDate.getTime()) / 86400000));

  if (diffDays === 0) {
    return 'Posted today';
  }

  if (diffDays === 1) {
    return 'Posted yesterday';
  }

  if (diffDays < 7) {
    return `Posted ${diffDays} days ago`;
  }

  const diffWeeks = Math.round(diffDays / 7);

  if (diffWeeks < 5) {
    return `Posted ${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  }

  return `Posted on ${postedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function withDefaults(job) {
  const location = normalizeLocation(job.location);
  const responsibilities = Array.isArray(job.responsibilities) && job.responsibilities.length
    ? job.responsibilities
    : DEFAULT_RESPONSIBILITIES;
  const qualifications = Array.isArray(job.qualifications) && job.qualifications.length
    ? job.qualifications
    : DEFAULT_QUALIFICATIONS;
  const tags = Array.isArray(job.tags) && job.tags.length ? job.tags : [job.type ?? 'Full-time'];

  return {
    ...job,
    id: job.id ?? buildKey({ ...job, location }),
    role: job.role,
    company: job.company,
    location,
    locationDetails: job.locationDetails ?? null,
    salary: job.salary ?? 'Competitive',
    salaryPeriod: job.salaryPeriod ?? '/ year',
    type: job.type ?? 'Full-time',
    posted: job.posted ?? formatPostedLabel(job.postedAt),
    icon: job.icon ?? 'office-building',
    color: job.color ?? '#1a365d',
    tags,
    about:
      job.about ??
      `${job.company} is hiring a ${job.role} to help scale product quality and business impact across the team.`,
    responsibilities,
    qualifications,
    searchText: [
      job.role,
      job.company,
      location,
      job.type,
      ...(tags ?? []),
      job.about,
      job.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  };
}

export const ALL_JOBS = Array.isArray(rawJobs) ? rawJobs.map(withDefaults) : [];

export const FEATURED_HOME_JOB = ALL_JOBS.find((job) => job.isFeatured) ?? ALL_JOBS[0] ?? null;

export const HOME_NEARBY_JOBS = ALL_JOBS.filter((job) => job.id !== FEATURED_HOME_JOB?.id).slice(0, 3);

export const SEARCH_RECOMMENDED_JOBS = ALL_JOBS.filter((job) => job.id !== FEATURED_HOME_JOB?.id).slice(0, 9);

const ALL_JOB_MAP = new Map(ALL_JOBS.map((job) => [buildKey(job), job]));

export function searchJobs(query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();

  if (!normalizedQuery) {
    return ALL_JOBS;
  }

  return ALL_JOBS.filter((job) => job.searchText.includes(normalizedQuery));
}

export function getJobDetails(job) {
  if (!job) {
    return null;
  }

  const normalized = withDefaults(job);
  const mapped = ALL_JOB_MAP.get(buildKey(normalized));

  if (!mapped) {
    return normalized;
  }

  return {
    ...mapped,
    ...normalized,
    tags: mapped.tags,
    about: mapped.about,
    responsibilities: mapped.responsibilities,
    qualifications: mapped.qualifications,
  };
}