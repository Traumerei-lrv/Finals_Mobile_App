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
  signOut,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

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

const ReactNativeLogin = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const isExpoGo = Boolean(Constants.expoGoConfig);
  const firebaseProjectNumber = '139373810157';

  const getAuthErrorMessage = (prefix, authError) => {
    const code = authError?.code ? ` (${authError.code})` : '';
    const message = authError?.message ? `: ${authError.message}` : '';
    return `${prefix}${code}${message}`;
  };

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    selectAccount: true,
  });

  const handleSignIn = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      // Sign in using Firebase Auth (email/password)
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const profileSnap = await getDoc(doc(db, 'users', credential.user.uid));
      const profile = profileSnap.exists() ? profileSnap.data() : null;
      if (profile?.active === false) {
        await signOut(auth);
        setError('This account has been deactivated. Please contact an administrator.');
      }
    } catch (e) {
      console.error('SignIn error', e);

      if (e?.code === 'auth/api-key-not-valid') {
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

    if (
      !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID &&
      !process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID &&
      !process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
    ) {
      setError('Missing Google OAuth client IDs. Add EXPO_PUBLIC_GOOGLE_*_CLIENT_ID in your environment.');
      return;
    }

    if (Platform.OS !== 'web' && isExpoGo) {
      setError(
        'Google Sign-In is not supported in Expo Go for this app. Use a development build or a production build to test Google login on mobile.'
      );
      return;
    }

    const providedClientId =
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      '';
    const oauthProjectNumber = providedClientId.split('-')[0];
    if (oauthProjectNumber && oauthProjectNumber !== firebaseProjectNumber) {
      setError(
        `Google OAuth client IDs are from project ${oauthProjectNumber}, but Firebase uses project ${firebaseProjectNumber}. Create OAuth client IDs in the same Firebase/Google Cloud project and update EXPO_PUBLIC_GOOGLE_*_CLIENT_ID.`
      );
      return;
    }

    if (!request) {
      setError('Google sign-in is not ready yet. Please try again in a moment.');
      return;
    }

    try {
      setGoogleLoading(true);
      const result = await promptAsync({ showInRecents: true });
      if (result.type === 'dismiss' || result.type === 'cancel') {
        setGoogleLoading(false);
      }
    } catch (promptError) {
      console.error('Google prompt error', promptError);
      setError('Unable to start Google Sign-In. Please try again.');
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const signInWithGoogleCredential = async () => {
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

      if (!idToken) {
        setError('Google Sign-In failed: no ID token returned.');
        setGoogleLoading(false);
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } catch (authError) {
        console.error('Google sign in error', authError);
        setError(getAuthErrorMessage('Google Sign-In failed', authError));
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
            <Text style={styles.title}>Welcome to Career Go</Text>
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
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
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
                style={[styles.socialButton, Platform.OS !== 'web' && isExpoGo && styles.socialButtonDisabled]}
                onPress={handleGoogleSignIn}
                disabled={!request || googleLoading || (Platform.OS !== 'web' && isExpoGo)}
              >
                <Image
                  source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png' }}
                  style={styles.socialIcon}
                />
                <Text style={styles.socialText}>{googleLoading ? 'Signing in...' : 'Google'}</Text>
              </TouchableOpacity>
            </View>

            {Platform.OS !== 'web' && isExpoGo ? (
              <Text style={styles.helperText}>
                Google Sign-In needs a development build or production build on mobile. Expo Go cannot complete this OAuth flow.
              </Text>
            ) : null}

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account yet? </Text>
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
  socialButtonDisabled: {
    opacity: 0.55,
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
