import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildCompanyLogoUrl, buildJobImageUrl } from '../utils/imageSources.js';

const rootDir = process.cwd();
const jsonPath = path.join(rootDir, 'mock_data', 'fake_jobs_seed_150.json');
const csvPath = path.join(rootDir, 'mock_data', 'fake_jobs_seed_150.csv');
const outPath = path.join(rootDir, 'data', 'jobs.generated.json');
const LOCAL_COUNTRY = 'Philippines';

function parseBoolean(value) {
  return ['true', '1', 'yes'].includes(String(value).trim().toLowerCase());
}

function parseNumber(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseArray(value) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return trimmed
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (inQuotes) {
      if (character === '"') {
        if (nextCharacter === '"') {
          value += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += character;
      }
      continue;
    }

    if (character === '"') {
      inQuotes = true;
      continue;
    }

    if (character === ',') {
      row.push(value);
      value = '';
      continue;
    }

    if (character === '\r') {
      if (nextCharacter === '\n') {
        index += 1;
      }

      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    if (character === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += character;
  }

  if (value.length || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function formatLocation(location) {
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

function normalizeLocation(location, fallbackLocationLabel) {
  if (!location) {
    return {
      label: fallbackLocationLabel ?? 'Remote',
      details: null,
    };
  }

  if (typeof location === 'string') {
    return {
      label: location,
      details: null,
    };
  }

  return {
    label: formatLocation(location),
    details: location,
  };
}

function isLocalJob(job) {
  const countryFromObject = job?.location && typeof job.location === 'object' ? job.location.country : null;

  if (countryFromObject) {
    return String(countryFromObject).trim().toLowerCase() === LOCAL_COUNTRY.toLowerCase();
  }

  const countryFromText = [job?.location, job?.locationLabel]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  return countryFromText.includes(LOCAL_COUNTRY.toLowerCase());
}

function normalizeJob(job) {
  const location = normalizeLocation(job.location, job.locationLabel);
  const hasRealLogo = job.logoUrl && !String(job.logoUrl).includes('dummyimage.com');

  return {
    ...job,
    location: location.label,
    locationDetails: location.details,
    salary: job.salary ?? 'Competitive',
    salaryPeriod: job.salaryPeriod ?? '/ year',
    type: job.type ?? 'Full-time',
    posted: job.posted ?? formatPostedLabel(job.postedAt),
    icon: job.icon ?? 'office-building',
    color: job.color ?? '#1a365d',
    logoUrl: hasRealLogo ? job.logoUrl : buildCompanyLogoUrl(job.company, job.companyDomain),
    imageUrl: job.imageUrl ?? buildJobImageUrl(job),
    tags: Array.isArray(job.tags) && job.tags.length ? job.tags : [job.type ?? 'Full-time'],
    about:
      job.about ??
      `${job.company} is hiring a ${job.role} to help scale product quality and business impact across the team.`,
    responsibilities: Array.isArray(job.responsibilities) && job.responsibilities.length
      ? job.responsibilities
      : [
          'Collaborate with cross-functional teams to deliver high-impact features.',
          'Own delivery quality from planning through release.',
          'Translate user and business needs into practical execution plans.',
        ],
    qualifications: Array.isArray(job.qualifications) && job.qualifications.length
      ? job.qualifications
      : [
          '3+ years of relevant professional experience.',
          'Strong communication and collaboration skills.',
          'Ability to work in a fast-paced environment with shifting priorities.',
        ],
    benefits: Array.isArray(job.benefits) ? job.benefits : [],
    searchText: [
      job.role,
      job.company,
      location.label,
      job.type,
      ...(Array.isArray(job.tags) ? job.tags : []),
      job.about,
      job.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  };
}

async function main() {
  const jsonRaw = await readFile(jsonPath, 'utf8');
  const jsonJobs = JSON.parse(jsonRaw);

  const csvRaw = await readFile(csvPath, 'utf8');
  const csvRows = parseCsv(csvRaw);
  const [headerRow, ...dataRows] = csvRows;
  const csvHeaders = headerRow ?? [];

  const csvJobs = dataRows
    .filter((row) => row.some((cell) => String(cell ?? '').trim().length > 0))
    .map((row) => {
      const record = Object.fromEntries(csvHeaders.map((header, index) => [header, row[index] ?? '']));

      return {
        id: record.id,
        slug: record.slug,
        role: record.role,
        company: record.company,
        location: {
          city: record.location_city,
          region: record.location_region,
          country: record.location_country,
          remote: parseBoolean(record.location_remote),
        },
        type: record.type,
        salary: record.salary,
        salaryMin: parseNumber(record.salaryMin),
        salaryMax: parseNumber(record.salaryMax),
        salaryCurrency: record.salaryCurrency,
        salaryPeriod: record.salaryPeriod,
        about: record.about,
        description: record.description,
        responsibilities: parseArray(record.responsibilities),
        qualifications: parseArray(record.qualifications),
        benefits: parseArray(record.benefits),
        tags: parseArray(record.tags),
        logoUrl: record.logoUrl,
        imageUrl: record.imageUrl,
        color: record.color,
        applicationUrl: record.applicationUrl,
        isFeatured: parseBoolean(record.isFeatured),
        experienceLevel: record.experienceLevel,
        deadline: record.deadline,
        locationCoordinates:
          record.lat && record.lng
            ? { lat: parseNumber(record.lat), lng: parseNumber(record.lng) }
            : undefined,
        postedAt: record.postedAt,
        postedBy: record.postedBy,
        createdAt: record.postedAt,
        updatedAt: record.postedAt,
      };
    })
    .filter(isLocalJob);

  const mergedJobs = new Map();

  for (const job of csvJobs) {
    if (job.id) {
      mergedJobs.set(job.id, normalizeJob(job));
    }
  }

  for (const job of jsonJobs) {
    if (job.id && isLocalJob(job)) {
      mergedJobs.set(job.id, normalizeJob(job));
    }
  }

  const nextJobs = Array.from(mergedJobs.values());
  nextJobs.sort((left, right) => {
    const leftDate = left.postedAt ? new Date(left.postedAt).getTime() : 0;
    const rightDate = right.postedAt ? new Date(right.postedAt).getTime() : 0;
    return rightDate - leftDate;
  });

  await writeFile(outPath, `${JSON.stringify(nextJobs, null, 2)}\n`, 'utf8');
  console.log(`Generated ${nextJobs.length} jobs at ${path.relative(rootDir, outPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});