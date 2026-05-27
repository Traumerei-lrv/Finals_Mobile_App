import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import {
  clearStoredAuthUser,
  getStoredAuthUser,
  saveStoredAuthUser,
} from './utils/storage';
import LoginScreen from './screens/LoginScreen';
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

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u: User | null) => {
      setUser(u);
      setInitializing(false);

      if (u) {
        void saveStoredAuthUser(u);
      } else {
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

      if (!storedUid || storedUid !== user.uid) {
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

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a365d" />
        <Text style={styles.loadingText}>Restoring your session</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
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
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
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
