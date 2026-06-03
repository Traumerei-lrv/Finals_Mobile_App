import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export async function getPlatformMetrics() {
  // Basic counters: total jobs, open jobs, total applications, pending applications, total users
  try {
    const jobsSnap = await getDocs(collection(db, 'jobs'));
    const jobs = jobsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const openJobsSnap = await getDocs(query(collection(db, 'jobs'), where('status', '==', 'open')));

    const appsSnap = await getDocs(collection(db, 'applications'));
    const apps = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const pendingApps = apps.filter((a) => a.statusType === 'applied').length;

    const usersSnap = await getDocs(collection(db, 'users'));

    return {
      totalJobs: jobs.length,
      openJobs: openJobsSnap.size,
      totalApplications: apps.length,
      pendingApplications: pendingApps,
      totalUsers: usersSnap.size,
    };
  } catch (err) {
    console.error('getPlatformMetrics error', err);
    throw err;
  }
}
