import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { clearStaleNativeGoogleSession, signOutFromAllProviders } from '../../utils/authProviders';

WebBrowser.maybeCompleteAuthSession();

// Design Tokens (Professional Velocity)
const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainer: '#e2e7f9',
  onSurface: '#1a365d',
  outline: '#cfdaf1',
  white: '#ffffff',
  google: '#ffffff',
  apple: '#ffffff',
};

const APP_LOGO = require('../../logo/app_logo_1-removebg-preview.png');
const GOOGLE_CLIENT_IDS = {
  web: '139373810157-fr8jg5aps9mvv4fun637rdse600h53ui.apps.googleusercontent.com',
  android: '139373810157-5gjjhuadglggqbsg9rt4va98h0ggq6lo.apps.googleusercontent.com',
  ios: '139373810157-b0cdkq0avp21fg2s3f7dm78j4c0cq8sl.apps.googleusercontent.com',
};

const ReactNativeLogin = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || GOOGLE_CLIENT_IDS.web;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || GOOGLE_CLIENT_IDS.android;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || GOOGLE_CLIENT_IDS.ios;
  // Expo Go does not bundle the native Google Sign-In module, so load it only in real native builds.
  const nativeGoogleSignIn =
    Platform.OS === 'web' || isExpoGo
      ? null
      : require('@react-native-google-signin/google-signin');
  const GoogleSignin = nativeGoogleSignIn?.GoogleSignin ?? null;
  const statusCodes = nativeGoogleSignIn?.statusCodes ?? {};
  const firebaseProjectNumber = '139373810157';

  const getAuthErrorMessage = (prefix, authError) => {
    const code = authError?.code ? ` (${authError.code})` : '';
    const message = authError?.message ? `: ${authError.message}` : '';
    return `${prefix}${code}${message}`;
  };

  const validateSignedInUser = async (signedInUser) => {
    const profileSnap = await getDoc(doc(db, 'users', signedInUser.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : null;

    if (profile?.active === false) {
      await signOutFromAllProviders();
      throw new Error('This account has been deactivated. Please contact an administrator.');
    }
  };

  const getGoogleSignInErrorMessage = (signInError) => {
    if (signInError?.message === 'This account has been deactivated. Please contact an administrator.') {
      return signInError.message;
    }

    if (signInError?.code === statusCodes.SIGN_IN_CANCELLED) {
      return '';
    }

    if (signInError?.code === statusCodes.IN_PROGRESS) {
      return 'Google Sign-In is already in progress.';
    }

    if (signInError?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Google Play Services is not available or needs an update on this device.';
    }

    if (
      String(signInError?.message || '').includes('DEVELOPER_ERROR') ||
      String(signInError?.message || '').includes('code 10') ||
      String(signInError?.message || '').includes('10:')
    ) {
      return 'Google Sign-In configuration mismatch. Check the Android package name, SHA-1 fingerprint, and Android OAuth client ID.';
    }

    return getAuthErrorMessage('Google Sign-In failed', signInError);
  };

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId,
    androidClientId,
    webClientId,
    selectAccount: true,
  });
  const googleHelperText =
    Platform.OS !== 'web' && isExpoGo
      ? 'Google sign-in cannot run inside Expo Go. Open your installed Android build instead.'
      : Platform.OS === 'web' && !request
        ? 'Google sign-in is still loading. If this never becomes ready, restart Expo after updating the Google client IDs.'
        : '';

  useEffect(() => {
    if (Platform.OS === 'web' || !GoogleSignin) {
      return;
    }

    console.log('Google Sign-In configure start', {
      platform: Platform.OS,
      expoGo: isExpoGo,
      nativeModuleAvailable: !!GoogleSignin,
      hasWebClientId: !!webClientId,
    });

    GoogleSignin.configure({
      webClientId,
      iosClientId,
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });

    console.log('Google Sign-In configure success');
  }, [GoogleSignin, iosClientId, isExpoGo, webClientId]);

  const handleSignIn = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await validateSignedInUser(credential.user);
    } catch (e) {
      console.error('SignIn error', e);

      if (e?.message === 'This account has been deactivated. Please contact an administrator.') {
        setError(e.message);
      } else if (e?.code === 'auth/api-key-not-valid') {
        setError('Firebase config error: invalid API key. Update firebase.js with a valid Web API key.');
      } else if (e?.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (e?.code === 'auth/user-not-found') {
        setError('No account found for this email.');
      } else if (e?.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    console.log('Google Sign-In start', {
      platform: Platform.OS,
      expoGo: isExpoGo,
      nativeModuleAvailable: !!GoogleSignin,
    });

    if (!iosClientId && !androidClientId && !webClientId) {
      setError('Missing Google OAuth client IDs. Add EXPO_PUBLIC_GOOGLE_*_CLIENT_ID in your environment.');
      return;
    }

    const providedClientId = webClientId || androidClientId || iosClientId || '';
    const oauthProjectNumber = providedClientId.split('-')[0];
    if (oauthProjectNumber && oauthProjectNumber !== firebaseProjectNumber) {
      setError(
        `Google OAuth client IDs are from project ${oauthProjectNumber}, but Firebase uses project ${firebaseProjectNumber}. Create OAuth client IDs in the same Firebase/Google Cloud project and update EXPO_PUBLIC_GOOGLE_*_CLIENT_ID.`
      );
      return;
    }

    if (Platform.OS === 'web' && !request) {
      setError('Google sign-in is not ready yet. Please try again in a moment.');
      return;
    }

    if (Platform.OS !== 'web' && isExpoGo) {
      setError('Google sign-in cannot run inside Expo Go. Open your installed Android build instead.');
      return;
    }

    try {
      setGoogleLoading(true);
      if (Platform.OS === 'web') {
        console.log('Google Sign-In using web auth session');
        const result = await promptAsync({ showInRecents: true });
        if (result.type === 'dismiss' || result.type === 'cancel') {
          setGoogleLoading(false);
        }
        return;
      }

      if (!GoogleSignin) {
        throw new Error('Google Sign-In native module is unavailable. Open the Android development build or APK instead of Expo Go.');
      }

      console.log('Google Sign-In checking Play Services');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Google Sign-In Play Services available');

      if (!auth.currentUser) {
        await clearStaleNativeGoogleSession();
      }

      const nativeResult = await GoogleSignin.signIn();
      console.log('Google Sign-In native response', {
        type: nativeResult?.type,
        hasData: !!nativeResult?.data,
      });

      if (nativeResult.type === 'cancelled') {
        console.log('User cancelled Google Sign-In');
        setGoogleLoading(false);
        return;
      }

      const idToken = nativeResult.data?.idToken || nativeResult?.idToken;
      console.log('Google idToken exists:', !!nativeResult.data?.idToken);
      if (!idToken) {
        throw new Error('Google Sign-In did not return an ID token. Check that the web client ID is configured correctly.');
      }

      console.log('Google Sign-In creating Firebase credential');
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      console.log('Google Sign-In Firebase auth success', { uid: result.user?.uid });
      await validateSignedInUser(result.user);
      console.log('Google Sign-In final auth success');
      setGoogleLoading(false);
    } catch (promptError) {
      console.error('Google Sign-In error', promptError);
      const message = getGoogleSignInErrorMessage(promptError);
      if (message) {
        setError(message);
      }
      console.log('Google Sign-In final auth failure', {
        code: promptError?.code,
        message: promptError?.message,
      });
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const signInWithGoogleCredential = async () => {
      if (Platform.OS !== 'web') {
        return;
      }

      if (!response || response.type !== 'success') {
        if (response?.type === 'error') {
          const responseError =
            response.params?.error_description ||
            response.params?.error ||
            'Google Sign-In failed before the app could complete authentication.';
          setError(responseError);
        } else if (response?.type && response.type !== 'dismiss' && response.type !== 'cancel') {
          console.log('Google auth response type:', response.type);
        }
        setGoogleLoading(false);
        return;
      }

      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      console.log('Google web auth response received', {
        hasIdToken: !!idToken,
      });

      if (!idToken) {
        setError('Google Sign-In failed: no ID token returned.');
        setGoogleLoading(false);
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        console.log('Google web Firebase auth success', { uid: result.user?.uid });
        await validateSignedInUser(result.user);
      } catch (authError) {
        console.error('Google sign in error', authError);
        setError(getGoogleSignInErrorMessage(authError));
      } finally {
        setGoogleLoading(false);
      }
    };

    void signInWithGoogleCredential();
  }, [response]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Image source={APP_LOGO} style={styles.appLogo} resizeMode="contain" />
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Sign in to accelerate your career</Text>
          </View>

          <View style={styles.form}>
            {/* Email Field */}
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="alex@example.com"
                placeholderTextColor={COLORS.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Field */}
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
            </View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={COLORS.secondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, loading && { opacity: 0.8 }]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.signInText}>Sign In</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.divider} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  !googleLoading && googleHelperText ? { opacity: 0.72 } : null,
                ]}
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
              >
                <Image
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png' }}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialText}>{googleLoading ? 'Signing in...' : 'Google'}</Text>
              </TouchableOpacity>
            </View>

            {googleHelperText ? <Text style={styles.helperText}>{googleHelperText}</Text> : null}

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account yet </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appLogo: {
    width: 180,
    height: 110,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  form: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  forgotText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.onSurface,
    fontSize: 16,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 40,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outline,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  socialText: {
    color: COLORS.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  signUpText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 12,
    color: '#e03e3e',
    textAlign: 'center',
    fontWeight: '600',
  },
  helperText: {
    marginTop: 12,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ReactNativeLogin;
