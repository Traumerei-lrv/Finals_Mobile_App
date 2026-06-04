import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  clearStoredAuthUser,
  getStoredAuthUser,
  saveStoredAuthUser,
} from './utils/storage';
import LoginScreen from './screens/job_Seeker/LoginScreen';
import RecruiterHome from './screens/admin/RecruiterHome';
import PostJobScreen from './screens/admin/PostJob/PostJob';
import PostJobStep2Screen from './screens/admin/PostJob/PostJob2';
import PostJobStep3Screen from './screens/admin/PostJob/PostJob3';
import JobPostingSuccessScreen from './screens/admin/PostJob/PostJobSuccess';
import ApplicantsListScreen from './screens/admin/ApplicantsList';
import ArchivedApplicationsScreen from './screens/admin/ArchivedApplications';
import RecruiterProfileScreen from './screens/admin/RecruiterProfile';
import ApplicantReviewScreen from './screens/admin/ApplicantReview';
import InterviewScheduleScreen from './screens/admin/InterviewSchedule';
import EditRecruiterProfileScreen from './screens/admin/EditRecruiterProfile';
import AdminDashboard from './screens/admin/AdminDashboard';
import AdminJobs from './screens/admin/AdminJobs';
import AdminApplicants from './screens/admin/AdminApplicants';
import AdminUsers from './screens/admin/AdminUsers';
import AdminReports from './screens/admin/AdminReports';
import AuditLogs from './screens/admin/AuditLogs';
import HomeScreen from './screens/HomeScreen';
import SignupScreen from './screens/SignupScreen';
import ProfileScreen from './screens/Profile';
import ApplicationScreen from './screens/ApplicationScreen';
import SearchScreen from './screens/SearchScreen';
import SavedJobsScreen from './screens/SavedJobsScreen';
import JobDetailsScreen from './screens/JobDetailsScreen';
import SubmitApplicationScreen from './screens/SubmitApplication';
import ApplicationSubmittedScreen from './screens/ApplicationSubmitted';
import TrackApplicationScreen from './screens/TrackApplication';
import EditProfileScreen from './screens/EditProfileScreen';
import ResumeSettingsScreen from './screens/ResumeSettings';
import PrivacySettingsScreen from './screens/PrivacySettingsScreen';
import { AuthProvider } from './context/AuthContext';

const Stack = createNativeStackNavigator();

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
          const userData = userSnap.exists() ? userSnap.data() : null;
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
    <AuthProvider user={user} role={role}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            // Route based on role claim: 'admin' or 'recruiter' -> recruiter/admin area; otherwise Job Seeker flows
            <>
              {role === 'admin' ? (
                <>
                  <Stack.Screen name="AdminDashboard" component={AdminDashboard as React.ComponentType<any>} />
                  <Stack.Screen name="AdminJobs" component={AdminJobs as React.ComponentType<any>} />
                  <Stack.Screen name="AdminApplicants" component={AdminApplicants as React.ComponentType<any>} />
                  <Stack.Screen name="AdminUsers" component={AdminUsers as React.ComponentType<any>} />
                  <Stack.Screen name="AdminReports" component={AdminReports as React.ComponentType<any>} />
                  <Stack.Screen name="AuditLogs" component={AuditLogs as React.ComponentType<any>} />
                  <Stack.Screen name="RecruiterHome" component={RecruiterHome as React.ComponentType<any>} />
                  <Stack.Screen name="PostJob" component={PostJobScreen as React.ComponentType<any>} />
                  <Stack.Screen name="PostJobStep2" component={PostJobStep2Screen as React.ComponentType<any>} />
                  <Stack.Screen name="PostJobStep3" component={PostJobStep3Screen as React.ComponentType<any>} />
                  <Stack.Screen name="PostJobSuccess" component={JobPostingSuccessScreen as React.ComponentType<any>} />
                  <Stack.Screen name="ApplicantsList" component={ApplicantsListScreen as React.ComponentType<any>} />
                  <Stack.Screen name="ArchivedApplications" component={ArchivedApplicationsScreen as React.ComponentType<any>} />
                  <Stack.Screen name="ApplicantReview" component={ApplicantReviewScreen as React.ComponentType<any>} />
                  <Stack.Screen name="InterviewSchedule" component={InterviewScheduleScreen as React.ComponentType<any>} />
                  <Stack.Screen name="RecruiterProfile" component={RecruiterProfileScreen as React.ComponentType<any>} />
                  <Stack.Screen name="EditRecruiterProfile" component={EditRecruiterProfileScreen as React.ComponentType<any>} />
                </>
              ) : role === 'recruiter' ? (
                <>
                  <Stack.Screen name="RecruiterHome" component={RecruiterHome as React.ComponentType<any>} />
                  <Stack.Screen name="PostJob" component={PostJobScreen as React.ComponentType<any>} />
                  <Stack.Screen name="PostJobStep2" component={PostJobStep2Screen as React.ComponentType<any>} />
                  <Stack.Screen name="PostJobStep3" component={PostJobStep3Screen as React.ComponentType<any>} />
                  <Stack.Screen name="PostJobSuccess" component={JobPostingSuccessScreen as React.ComponentType<any>} />
                  <Stack.Screen name="ApplicantsList" component={ApplicantsListScreen as React.ComponentType<any>} />
                  <Stack.Screen name="ArchivedApplications" component={ArchivedApplicationsScreen as React.ComponentType<any>} />
                  <Stack.Screen name="ApplicantReview" component={ApplicantReviewScreen as React.ComponentType<any>} />
                  <Stack.Screen name="InterviewSchedule" component={InterviewScheduleScreen as React.ComponentType<any>} />
                  <Stack.Screen name="RecruiterProfile" component={RecruiterProfileScreen as React.ComponentType<any>} />
                  <Stack.Screen name="EditRecruiterProfile" component={EditRecruiterProfileScreen as React.ComponentType<any>} />
                </>
              ) : (
                <>
                  <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Search" component={SearchScreen} />
              <Stack.Screen name="Saved" component={SavedJobsScreen} />
              <Stack.Screen name="Application" component={ApplicationScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
              <Stack.Screen name="SubmitApplication" component={SubmitApplicationScreen} />
              <Stack.Screen name="ApplicationSubmitted" component={ApplicationSubmittedScreen} />
              <Stack.Screen name="TrackApplication" component={TrackApplicationScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="ResumeSettings" component={ResumeSettingsScreen} />
              <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
                </>
              )}
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignupScreen} />
            </>
          )}
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
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
