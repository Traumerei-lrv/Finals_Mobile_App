import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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
  const interviewDetails =
    raw?.interviewDetails && typeof raw.interviewDetails === 'object'
      ? raw.interviewDetails
      : {};

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
    resumeUrl: raw?.resumeUrl ?? null,
    resumePath: raw?.resumePath ?? null,
    resumeFileName: raw?.resumeFileName ?? null,
    resumeFileSize: raw?.resumeFileSize ?? null,
    resumeMimeType: raw?.resumeMimeType ?? null,
    recruiterArchived: raw?.recruiterArchived === true,
    applicantArchived: raw?.applicantArchived === true,
    interviewDetails: {
      interviewType: interviewDetails?.interviewType ?? raw?.interviewType ?? '',
      meetingFormat: interviewDetails?.meetingFormat ?? raw?.meetingFormat ?? '',
      date: interviewDetails?.date ?? raw?.interviewDate ?? '',
      time: interviewDetails?.time ?? raw?.interviewTime ?? '',
      timezone: interviewDetails?.timezone ?? raw?.interviewTimezone ?? '',
      location: interviewDetails?.location ?? raw?.interviewLocation ?? '',
      instructions: interviewDetails?.instructions ?? raw?.interviewInstructions ?? '',
      scheduledAt: interviewDetails?.scheduledAt ?? raw?.interviewScheduledAt ?? null,
      scheduledBy: interviewDetails?.scheduledBy ?? raw?.interviewScheduledBy ?? null,
    },
  };
}

export async function submitJobApplication({ job, applicant, formData }) {
  const jobId = job?.id;
  const applicantId = applicant?.uid;

  if (!jobId || !applicantId) {
    throw new Error('Missing job/applicant context');
  }

  const jobSnap = await getDoc(doc(db, 'jobs', jobId));
  if (!jobSnap.exists()) {
    throw new Error('This job is no longer available.');
  }

  const liveJob = jobSnap.data() ?? {};
  const recruiterId = liveJob?.recruiterId ?? job?.recruiterId ?? null;

  if (!recruiterId) {
    throw new Error('Unable to determine recruiter for this job.');
  }

  if (liveJob?.status !== 'open') {
    throw new Error('This job is closed and no longer accepting applications.');
  }

  const payload = {
    jobId,
    recruiterId,
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
      id: jobId,
      role: liveJob.role ?? job?.role ?? 'Untitled Role',
      company: liveJob.company ?? job?.company ?? 'Unknown Company',
      location: liveJob.location ?? job?.location ?? 'Remote',
      salary: liveJob.salary ?? job?.salary ?? 'Competitive',
      salaryPeriod: liveJob.salaryPeriod ?? job?.salaryPeriod ?? '/ year',
      type: liveJob.type ?? job?.type ?? 'Full-time',
      tags: Array.isArray(liveJob.tags)
        ? liveJob.tags
        : Array.isArray(job?.tags)
          ? job.tags
          : [liveJob.type ?? job?.type ?? 'Full-time'],
      about: liveJob.about ?? job?.about ?? '',
    },
  };

  try {
    await setDoc(doc(db, 'applications', appDocId(jobId, applicantId)), payload);
  } catch (error) {
    const code = String(error?.code ?? '').toLowerCase();
    if (code.includes('permission-denied')) {
      throw new Error('Missing or insufficient permissions. Please refresh and try again.');
    }
    throw error;
  }
}

export async function hasApplicantAppliedToJob({ jobId, applicantId }) {
  if (!jobId || !applicantId) return false;
  const snap = await getDoc(doc(db, 'applications', appDocId(jobId, applicantId)));
  return snap.exists();
}

export function subscribeToRecruiterApplications({ recruiterId, onData, onError, includeArchived = false }) {
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
        .filter((application) => (includeArchived ? application.recruiterArchived : !application.recruiterArchived))
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
        .filter((application) => !application.applicantArchived)
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
  const normalizedType = String(application.statusType ?? 'applied').toLowerCase();
  const normalizedStatus = String(application.status ?? 'APPLIED').toUpperCase();

  let displayStatus = normalizedStatus;
  let statusTypeForTabs = normalizedType;
  let step = 'Step 1 of 4';
  let progress = 0.25;

  if (normalizedType === 'applied') {
    displayStatus = 'APPLIED';
    statusTypeForTabs = 'applied';
    step = 'Step 1 of 4';
    progress = 0.25;
  } else if (normalizedType === 'screened' || normalizedType === 'review') {
    displayStatus = 'UNDER REVIEW';
    statusTypeForTabs = 'review';
    step = 'Step 2 of 4';
    progress = 0.5;
  } else if (normalizedType === 'interview') {
    displayStatus = 'INTERVIEW';
    statusTypeForTabs = 'interview';
    step = 'Step 3 of 4';
    progress = 0.75;
  } else if (normalizedType === 'offer') {
    displayStatus = normalizedStatus === 'APPROVED' ? 'APPROVED' : 'OFFER';
    statusTypeForTabs = 'offer';
    step = 'Step 4 of 4';
    progress = 1;
  } else if (normalizedType === 'declined') {
    displayStatus = 'DECLINED';
    statusTypeForTabs = 'declined';
    step = 'Closed';
    progress = 1;
  } else if (normalizedType === 'withdrawn') {
    displayStatus = 'WITHDRAWN';
    statusTypeForTabs = 'withdrawn';
    step = 'Closed';
    progress = 1;
  }

  return {
    id: application.id,
    sourceJobId: application.jobId,
    role: application.role,
    company: application.company,
    date: `Applied ${toDateLabel(application.appliedAt)}`,
    status: displayStatus,
    statusType: statusTypeForTabs,
    step,
    progress,
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
    interviewDetails: application.interviewDetails ?? null,
  };
}

export async function updateApplicationStatus({ applicationId, status, statusType }) {
  if (!applicationId) {
    throw new Error('Missing applicationId');
  }

  const normalizedType = String(statusType ?? status ?? 'applied').toLowerCase();
  const normalizedStatus = String(status ?? normalizedType).toUpperCase();

  await updateDoc(doc(db, 'applications', applicationId), {
    status: normalizedStatus,
    statusType: normalizedType,
    updatedAt: serverTimestamp(),
  });
}

export async function approveApplicationWithInterview({
  applicationId,
  interviewDetails,
}) {
  if (!applicationId) {
    throw new Error('Missing applicationId');
  }

  const payload = {
    status: 'APPROVED',
    statusType: 'offer',
    updatedAt: serverTimestamp(),
    interviewDetails: {
      interviewType: interviewDetails?.interviewType?.trim() ?? '',
      meetingFormat: interviewDetails?.meetingFormat?.trim() ?? '',
      date: interviewDetails?.date?.trim() ?? '',
      time: interviewDetails?.time?.trim() ?? '',
      timezone: interviewDetails?.timezone?.trim() ?? '',
      location: interviewDetails?.location?.trim() ?? '',
      instructions: interviewDetails?.instructions?.trim() ?? '',
      scheduledBy: interviewDetails?.scheduledBy ?? null,
      scheduledAt: serverTimestamp(),
    },
  };

  await updateDoc(doc(db, 'applications', applicationId), payload);
}

export async function archiveDeclinedApplicationForRecruiter({ applicationId }) {
  if (!applicationId) {
    throw new Error('Missing applicationId');
  }

  await updateDoc(doc(db, 'applications', applicationId), {
    recruiterArchived: true,
    recruiterArchivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function archiveApplicationForApplicant({ applicationId }) {
  if (!applicationId) {
    throw new Error('Missing applicationId');
  }

  await updateDoc(doc(db, 'applications', applicationId), {
    applicantArchived: true,
    applicantArchivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function withdrawApplicationForApplicant({ applicationId }) {
  if (!applicationId) {
    throw new Error('Missing applicationId');
  }

  await updateDoc(doc(db, 'applications', applicationId), {
    status: 'WITHDRAWN',
    statusType: 'withdrawn',
    withdrawnAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
