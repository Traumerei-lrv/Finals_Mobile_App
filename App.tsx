import 'expo-dev-client';
import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  clearStoredAuthUser,
  getStoredAuthUser,
  saveStoredAuthUser,
} from './utils/storage';
import { AuthProvider } from './context/AuthContext';
import { ensureUserProfile } from './utils/ensureUserProfile';

const Stack = createNativeStackNavigator();
const getAdminDashboard = () => require('./screens/admin/AdminDashboard').default;
const getAdminJobs = () => require('./screens/admin/AdminJobs').default;
const getAdminApplicants = () => require('./screens/admin/AdminApplicants').default;
const getAdminUsers = () => require('./screens/admin/AdminUsers').default;
const getAdminReports = () => require('./screens/admin/AdminReports').default;
const getAuditLogs = () => require('./screens/admin/AuditLogs').default;
const getAdminProfile = () => require('./screens/admin/AdminProfile').default;
const getRecruiterDashboard = () => require('./screens/admin/RecruiterDashboard').default;
const getPostJob = () => require('./screens/admin/PostJob/PostJob').default;
const getPostJobStep2 = () => require('./screens/admin/PostJob/PostJob2').default;
const getPostJobStep3 = () => require('./screens/admin/PostJob/PostJob3').default;
const getPostJobSuccess = () => require('./screens/admin/PostJob/PostJobSuccess').default;
const getApplicantsList = () => require('./screens/admin/RecruiterDashboard').default;
const getArchivedApplications = () => require('./screens/admin/ArchivedApplications').default;
const getApplicantReview = () => require('./screens/admin/ApplicantReview').default;
const getInterviewSchedule = () => require('./screens/admin/InterviewSchedule').default;
const getRecruiterProfile = () => require('./screens/admin/RecruiterDashboard').default;
const getEditRecruiterProfile = () => require('./screens/admin/EditRecruiterProfile').default;
const getJobSeekerDashboard = () => require('./screens/JobSeekerDashboard').default;
const getSavedJobsScreen = () => require('./screens/SavedJobsScreen').default;
const getJobDetailsScreen = () => require('./screens/JobDetailsScreen').default;
const getSubmitApplicationScreen = () => require('./screens/SubmitApplication').default;
const getApplicationSubmittedScreen = () => require('./screens/ApplicationSubmitted').default;
const getTrackApplicationScreen = () => require('./screens/TrackApplication').default;
const getEditProfileScreen = () => require('./screens/EditProfileScreen').default;
const getResumeSettingsScreen = () => require('./screens/ResumeSettings').default;
const getPrivacySettingsScreen = () => require('./screens/PrivacySettingsScreen').default;
const getLoginScreen = () => require('./screens/job_Seeker/LoginScreen').default;
const getSignupScreen = () => require('./screens/SignupScreen').default;

const normalizeRole = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }

  const role = value.toLowerCase();

  if (role === 'recruiter' || role === 'admin') {
    return role;
  }

  if (role === 'job_seeker' || role === 'job seeker' || role === 'seeker') {
    return 'job_seeker';
  }

  return null;
};

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [resolvingRole, setResolvingRole] = useState(false);
  const sessionHydratedRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u: User | null) => {
      setUser(u);

      if (u) {
        setResolvingRole(true);
        setRole(null);
        sessionHydratedRef.current = false;
        try {
          // Read role from Firestore users/{uid}
          const userRef = doc(db, 'users', u.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : await ensureUserProfile(u, 'job_seeker');
          if (userData?.active === false) {
            await signOut(auth);
            setRole(null);
            return;
          }
          const remoteRole =
            normalizeRole(userData?.role) ??
            normalizeRole(userData?.userRole) ??
            normalizeRole(userData?.type);
          const claimRole = normalizeRole((await u.getIdTokenResult()).claims?.role);

          // Backward compatibility: some older accounts may only have a recruiters/{uid} doc.
          let recruiterFallbackRole: ReturnType<typeof normalizeRole> = null;
          if (!remoteRole && !claimRole) {
            const recruiterRef = doc(db, 'recruiters', u.uid);
            const recruiterSnap = await getDoc(recruiterRef);
            const recruiterData = recruiterSnap.exists() ? recruiterSnap.data() : null;
            recruiterFallbackRole =
              normalizeRole(recruiterData?.role) ??
              normalizeRole(recruiterData?.userRole) ??
              normalizeRole(recruiterData?.type) ??
              (recruiterSnap.exists() ? 'recruiter' : null);
          }

          setRole(remoteRole ?? claimRole ?? recruiterFallbackRole ?? 'job_seeker');
          await saveStoredAuthUser(u);
          sessionHydratedRef.current = true;
        } catch (err) {
          console.error('Error reading user document for role', err);
          setRole('job_seeker');
        } finally {
          setResolvingRole(false);
          setInitializing(false);
        }
      } else {
        setResolvingRole(false);
        setRole(null);
        setInitializing(false);
        void clearStoredAuthUser();
      }
    });

    return unsub;
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || initializing || !user) {
      return;
    }

    let cancelled = false;

    const enforceStoredSession = async () => {
      const storedUser = await getStoredAuthUser();

      if (cancelled) {
        return;
      }

      const storedUid = storedUser?.uid ?? null;

      // If no cached user exists yet during initial hydration, store it first.
      if (!storedUid) {
        if (sessionHydratedRef.current) {
          try {
            await signOut(auth);
          } catch (error) {
            console.error('Session missing in storage; sign out failed', error);
          }
          return;
        }
        await saveStoredAuthUser(user);
        sessionHydratedRef.current = true;
        return;
      }

      // Sign out only when we detect a true mismatch between cached and live auth users.
      if (storedUid !== user.uid) {
        try {
          await signOut(auth);
        } catch (error) {
          console.error('Session sync error', error);
        }
      }
    };

    void enforceStoredSession();
    const intervalId = setInterval(() => {
      void enforceStoredSession();
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [initializing, user]);

  if (initializing || (user && resolvingRole)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a365d" />
        <Text style={styles.loadingText}>
          {initializing ? 'Restoring your session' : 'Loading your dashboard'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider user={user} role={role}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
              // Route based on role claim: 'admin' or 'recruiter' -> recruiter/admin area; otherwise Job Seeker flows
              <>
                {role === 'admin' ? (
                  <>
                    <Stack.Screen name="AdminDashboard" getComponent={getAdminDashboard} />
                    <Stack.Screen name="AdminJobs" getComponent={getAdminJobs} />
                    <Stack.Screen name="AdminApplicants" getComponent={getAdminApplicants} />
                    <Stack.Screen name="AdminUsers" getComponent={getAdminUsers} />
                    <Stack.Screen name="AdminReports" getComponent={getAdminReports} />
                    <Stack.Screen name="AuditLogs" getComponent={getAuditLogs} />
                    <Stack.Screen name="AdminProfile" getComponent={getAdminProfile} />
                    <Stack.Screen name="RecruiterDashboard" getComponent={getRecruiterDashboard} />
                    <Stack.Screen name="RecruiterHome" getComponent={getRecruiterDashboard} />
                    <Stack.Screen name="PostJob" getComponent={getRecruiterDashboard} />
                    <Stack.Screen name="PostJobStep2" getComponent={getPostJobStep2} />
                    <Stack.Screen name="PostJobStep3" getComponent={getPostJobStep3} />
                    <Stack.Screen name="PostJobSuccess" getComponent={getPostJobSuccess} />
                    <Stack.Screen name="ApplicantsList" getComponent={getApplicantsList} />
                    <Stack.Screen name="ArchivedApplications" getComponent={getArchivedApplications} />
                    <Stack.Screen name="ApplicantReview" getComponent={getApplicantReview} />
                    <Stack.Screen name="InterviewSchedule" getComponent={getInterviewSchedule} />
                    <Stack.Screen name="RecruiterProfile" getComponent={getRecruiterProfile} />
                    <Stack.Screen name="EditRecruiterProfile" getComponent={getEditRecruiterProfile} />
                  </>
                ) : role === 'recruiter' ? (
                  <>
                    <Stack.Screen name="RecruiterDashboard" getComponent={getRecruiterDashboard} />
                    <Stack.Screen name="RecruiterHome" getComponent={getRecruiterDashboard} />
                    <Stack.Screen name="PostJob" getComponent={getRecruiterDashboard} />
                    <Stack.Screen name="PostJobStep2" getComponent={getPostJobStep2} />
                    <Stack.Screen name="PostJobStep3" getComponent={getPostJobStep3} />
                    <Stack.Screen name="PostJobSuccess" getComponent={getPostJobSuccess} />
                    <Stack.Screen name="ApplicantsList" getComponent={getApplicantsList} />
                    <Stack.Screen name="ArchivedApplications" getComponent={getArchivedApplications} />
                    <Stack.Screen name="ApplicantReview" getComponent={getApplicantReview} />
                    <Stack.Screen name="InterviewSchedule" getComponent={getInterviewSchedule} />
                    <Stack.Screen name="RecruiterProfile" getComponent={getRecruiterProfile} />
                    <Stack.Screen name="EditRecruiterProfile" getComponent={getEditRecruiterProfile} />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="JobSeekerDashboard" getComponent={getJobSeekerDashboard} />
                    <Stack.Screen name="Home" getComponent={getJobSeekerDashboard} />
                    <Stack.Screen name="Search" getComponent={getJobSeekerDashboard} />
                    <Stack.Screen name="Application" getComponent={getJobSeekerDashboard} />
                    <Stack.Screen name="Profile" getComponent={getJobSeekerDashboard} />
                    <Stack.Screen name="Saved" getComponent={getSavedJobsScreen} />
                    <Stack.Screen name="JobDetails" getComponent={getJobDetailsScreen} />
                    <Stack.Screen name="SubmitApplication" getComponent={getSubmitApplicationScreen} />
                    <Stack.Screen name="ApplicationSubmitted" getComponent={getApplicationSubmittedScreen} />
                    <Stack.Screen name="TrackApplication" getComponent={getTrackApplicationScreen} />
                    <Stack.Screen name="EditProfile" getComponent={getEditProfileScreen} />
                    <Stack.Screen name="ResumeSettings" getComponent={getResumeSettingsScreen} />
                    <Stack.Screen name="PrivacySettings" getComponent={getPrivacySettingsScreen} />
                  </>
                )}
              </>
            ) : (
              <>
                <Stack.Screen name="Login" getComponent={getLoginScreen} />
                <Stack.Screen name="SignUp" getComponent={getSignupScreen} />
              </>
            )}
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9ff',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#1a365d',
    fontWeight: '600',
  },
});
