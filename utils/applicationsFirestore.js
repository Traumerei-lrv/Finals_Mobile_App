import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

function appDocId(jobId, applicantId) {
  return `${jobId}_${applicantId}`;
}

function toMillis(value) {
  if (!value) return Date.now();
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
}

function toDateLabel(value) {
  const date = new Date(toMillis(value));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeApplication(raw, id) {
  return {
    id,
    jobId: raw?.jobId,
    recruiterId: raw?.recruiterId,
    applicantId: raw?.applicantId,
    applicantName: raw?.applicantName ?? 'Unknown applicant',
    applicantEmail: raw?.applicantEmail ?? null,
    applicantPhone: raw?.applicantPhone ?? null,
    status: (raw?.status ?? 'applied').toUpperCase(),
    statusType: raw?.statusType ?? 'applied',
    appliedAt: raw?.appliedAt ?? raw?.createdAt ?? null,
    role: raw?.job?.role ?? raw?.role ?? 'Untitled Role',
    company: raw?.job?.company ?? raw?.company ?? 'Unknown Company',
    location: raw?.job?.location ?? raw?.location ?? 'Remote',
    salary: raw?.job?.salary ?? raw?.salary ?? 'Competitive',
    salaryPeriod: raw?.job?.salaryPeriod ?? raw?.salaryPeriod ?? '/ year',
    type: raw?.job?.type ?? raw?.type ?? 'Full-time',
    tags: Array.isArray(raw?.job?.tags) ? raw.job.tags : Array.isArray(raw?.tags) ? raw.tags : ['Full-time'],
    about: raw?.job?.about ?? raw?.about ?? '',
    createdAtMs: toMillis(raw?.createdAt ?? raw?.appliedAt),
    screening1: raw?.screening1 ?? '',
    noticePeriod: raw?.noticePeriod ?? '',
  };
}

export async function submitJobApplication({ job, applicant, formData }) {
  const jobId = job?.id;
  const applicantId = applicant?.uid;

  if (!jobId || !applicantId) {
    throw new Error('Missing job/applicant context');
  }

  const existing = await getDoc(doc(db, 'applications', appDocId(jobId, applicantId)));
  if (existing.exists()) {
    throw new Error('You already applied to this job.');
  }

  const payload = {
    jobId,
    recruiterId: job?.recruiterId ?? null,
    applicantId,
    applicantName: formData?.fullName?.trim() || applicant?.displayName || 'Career Go User',
    applicantEmail: formData?.email?.trim() || applicant?.email || null,
    applicantPhone: formData?.phoneNumber?.trim() || null,
    screening1: formData?.screening1?.trim() || '',
    noticePeriod: formData?.noticePeriod?.trim() || '',
    resumeUrl: formData?.resumeUrl || null,
    resumePath: formData?.resumePath || null,
    resumeFileName: formData?.resumeFileName || null,
    status: 'applied',
    statusType: 'applied',
    appliedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    job: {
      id: job.id,
      role: job.role,
      company: job.company,
      location: job.location,
      salary: job.salary,
      salaryPeriod: job.salaryPeriod ?? '/ year',
      type: job.type ?? 'Full-time',
      tags: Array.isArray(job.tags) ? job.tags : [job.type ?? 'Full-time'],
      about: job.about ?? '',
    },
  };

  await setDoc(doc(db, 'applications', appDocId(jobId, applicantId)), payload);
}

export async function hasApplicantAppliedToJob({ jobId, applicantId }) {
  if (!jobId || !applicantId) return false;
  const snap = await getDoc(doc(db, 'applications', appDocId(jobId, applicantId)));
  return snap.exists();
}

export function subscribeToRecruiterApplications({ recruiterId, onData, onError }) {
  if (!recruiterId) {
    onData([]);
    return () => {};
  }

  const q = query(collection(db, 'applications'), where('recruiterId', '==', recruiterId));
  return onSnapshot(
    q,
    (snapshot) => {
      const applications = snapshot.docs
        .map((applicationDoc) => normalizeApplication(applicationDoc.data(), applicationDoc.id))
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(applications);
    },
    (error) => {
      if (typeof onError === 'function') onError(error);
      else console.error('Failed to subscribe recruiter applications', error);
    },
  );
}

export function subscribeToApplicantApplications({ applicantId, onData, onError }) {
  if (!applicantId) {
    onData([]);
    return () => {};
  }

  const q = query(collection(db, 'applications'), where('applicantId', '==', applicantId));
  return onSnapshot(
    q,
    (snapshot) => {
      const applications = snapshot.docs
        .map((applicationDoc) => normalizeApplication(applicationDoc.data(), applicationDoc.id))
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onData(applications);
    },
    (error) => {
      if (typeof onError === 'function') onError(error);
      else console.error('Failed to subscribe applicant applications', error);
    },
  );
}

export function mapApplicationToRecruiterCard(application) {
  return {
    id: application.id,
    name: application.applicantName,
    role: application.role,
    status: application.status,
    statusType: application.statusType,
    date: `Applied ${toDateLabel(application.appliedAt)}`,
    avatar: null,
    placeholder: true,
  };
}

export function mapApplicationToJobSeekerCard(application) {
  return {
    id: application.id,
    sourceJobId: application.jobId,
    role: application.role,
    company: application.company,
    date: `Applied ${toDateLabel(application.appliedAt)}`,
    status: application.status === 'APPLIED' ? 'UNDER REVIEW' : application.status,
    statusType: application.statusType === 'applied' ? 'review' : application.statusType,
    step: application.statusType === 'declined' ? 'Closed' : 'Step 1 of 4',
    progress: application.statusType === 'declined' ? 1 : 0.25,
    icon: 'file-document-outline',
    location: application.location,
    salary: application.salary,
    salaryPeriod: application.salaryPeriod,
    tags: Array.isArray(application.tags) ? application.tags : [application.type ?? 'Full-time'],
    about:
      application.about ||
      `${application.company} is reviewing your application for ${application.role}. We will share updates soon.`,
    responsibilities: ['Application submitted successfully.', 'Awaiting recruiter review.'],
    qualifications: ['Profile submitted', 'Resume uploaded'],
  };
}
