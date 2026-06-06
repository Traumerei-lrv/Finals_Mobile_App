import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

function getNativeGoogleSignin() {
  if (Platform.OS === 'web' || Constants.executionEnvironment === 'storeClient') {
    return null;
  }

  try {
    const nativeModule = require('@react-native-google-signin/google-signin');
    return nativeModule?.GoogleSignin ?? null;
  } catch (error) {
    return null;
  }
}

export async function signOutFromAllProviders() {
  await signOut(auth);

  const GoogleSignin = getNativeGoogleSignin();
  if (!GoogleSignin) {
    return;
  }

  try {
    if (typeof GoogleSignin.hasPreviousSignIn === 'function' && !GoogleSignin.hasPreviousSignIn()) {
      return;
    }

    await GoogleSignin.signOut();
  } catch (error) {
    console.warn('Native Google session sign-out failed', error);
  }
}

export async function clearStaleNativeGoogleSession() {
  const GoogleSignin = getNativeGoogleSignin();
  if (!GoogleSignin) {
    return;
  }

  try {
    if (typeof GoogleSignin.hasPreviousSignIn === 'function' && GoogleSignin.hasPreviousSignIn()) {
      await GoogleSignin.signOut();
    }
  } catch (error) {
    console.warn('Clearing cached native Google session failed', error);
  }
}
