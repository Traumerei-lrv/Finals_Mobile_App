const JOB_IMAGE_BY_THEME = {
  engineering: 'photo-1498050108023-c5249f4df085',
  design: 'photo-1499750310107-5fef28a66643',
  marketing: 'photo-1432888622747-4eb9a8efeb07',
  finance: 'photo-1554224155-6726b3ff858f',
  healthcare: 'photo-1576091160399-112ba8d25d1d',
  education: 'photo-1524178232363-1fb2b075b655',
  support: 'photo-1522075469751-3a6694fb2f61',
  business: 'photo-1521791136064-7986c2920216',
  operations: 'photo-1504384308090-c894fdcc538d',
  default: 'photo-1497366754035-f200968a6e72',
};

const JOB_THEME_KEYWORDS = [
  { theme: 'engineering', keywords: ['engineer', 'developer', 'software', 'mobile', 'backend', 'frontend', 'cloud', 'site reliability', 'react', 'api'] },
  { theme: 'design', keywords: ['designer', 'ux', 'ui', 'visual', 'product designer', 'graphic', 'brand', 'motion', 'prototype'] },
  { theme: 'marketing', keywords: ['marketing', 'seo', 'social media', 'content', 'growth', 'email'] },
  { theme: 'finance', keywords: ['finance', 'payroll', 'accounting', 'audit', 'bookkeeper', 'analyst'] },
  { theme: 'healthcare', keywords: ['healthcare', 'medical', 'nurse', 'clinic', 'radiologic', 'pharmacist'] },
  { theme: 'education', keywords: ['education', 'teacher', 'instructor', 'tutor', 'curriculum', 'learning'] },
  { theme: 'support', keywords: ['support', 'helpdesk', 'virtual assistant', 'customer success', 'customer support', 'admin', 'data entry'] },
  { theme: 'business', keywords: ['business', 'operations', 'recruitment', 'project coordinator', 'community manager'] },
];

function buildUnsplashUrl(photoId, query) {
  const querySegment = query ? `&${query}` : '';
  return `https://images.unsplash.com/${photoId}?q=80&w=1200&auto=format&fit=crop${querySegment}`;
}

export function buildDiceBearAvatarUrl(seed, variant = 'thumbs') {
  const safeSeed = encodeURIComponent(seed || 'JobFinder');
  return `https://api.dicebear.com/9.x/${variant}/svg?seed=${safeSeed}&backgroundColor=1a365d&radius=50&size=256`;
}

export function buildProfileAvatarUrl(name) {
  return buildDiceBearAvatarUrl(name || 'JobFinder User', 'initials');
}

export function buildCompanyLogoUrl(company, domain) {
  const token = process.env.EXPO_PUBLIC_LOGO_DEV_TOKEN?.trim();

  if (domain) {
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    return `https://img.logo.dev/${encodeURIComponent(domain)}${tokenQuery}`;
  }

  return buildDiceBearAvatarUrl(company || 'Company', 'initials');
}

function inferJobTheme(job = {}) {
  const haystack = [job.role, job.company, job.type, ...(Array.isArray(job.tags) ? job.tags : []), job.about, job.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const match = JOB_THEME_KEYWORDS.find((entry) => entry.keywords.some((keyword) => haystack.includes(keyword)));
  return match?.theme ?? 'default';
}

export function buildJobImageUrl(job = {}) {
  const theme = inferJobTheme(job);
  const photoId = JOB_IMAGE_BY_THEME[theme] ?? JOB_IMAGE_BY_THEME.default;
  const seed = encodeURIComponent([job.role, job.company].filter(Boolean).join(' '));

  // The seed keeps the image selection stable while the photo stays real.
  return buildUnsplashUrl(photoId, `sig=${seed}`);
}

export function buildPromoImageUrl(topic = 'career growth') {
  const normalized = String(topic).toLowerCase();

  if (normalized.includes('resume') || normalized.includes('profile')) {
    return buildUnsplashUrl('photo-1551836022-deb4988cc6c2', 'resume');
  }

  if (normalized.includes('job') || normalized.includes('career')) {
    return buildUnsplashUrl('photo-1521737604893-d14cc237f11d', 'career');
  }

  return buildUnsplashUrl(JOB_IMAGE_BY_THEME.default, 'career');
}