import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Design Tokens (Professional Velocity)
const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainer: '#e2e7f9',
  onSurface: '#1a365d',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentYellow: '#f9b208',
  accentTeal: '#00a8e1',
};

const ReactNativeSignUp = ({navigation}) => {
  const [role, setRole] = useState('seeker'); // 'seeker' or 'recruiter'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateAccount = async () => {
    setError('');

    if (!fullName || !email || !password) {
      setError('Please complete all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!agree) {
      setError('Please accept the terms to continue.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const selectedRole = role === 'recruiter' ? 'recruiter' : 'job_seeker';

      // Ensure users/{uid} document exists so client role reads succeed immediately
      try {
        const uid = userCredential.user?.uid ?? auth.currentUser?.uid;
        if (uid) {
          await setDoc(doc(db, 'users', uid), {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            role: selectedRole,
            createdAt: serverTimestamp(),
          }, { merge: true });
          
          // If this is a recruiter, create a recruiters/{uid} profile doc too
          if (selectedRole === 'recruiter') {
            try {
              await setDoc(doc(db, 'recruiters', uid), {
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                company: '',
                verified: false,
                createdAt: serverTimestamp(),
              }, { merge: true });
            } catch (recErr) {
              console.error('Failed to write recruiters document after signup', recErr);
            }
          }
        }
      } catch (writeErr) {
        console.error('Failed to write users document after signup', writeErr);
      }

      // After sign-up, the auth state listener in App.tsx will route by role.
    } catch (e) {
      console.error('SignUp error', e);

      if (e?.code === 'auth/email-already-in-use') {
        setError('This email is already in use.');
      } else if (e?.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (e?.code === 'auth/api-key-not-valid') {
        setError('Firebase config error: invalid API key.');
      } else {
        setError('Sign up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.helpLink}>
              <Text style={styles.helpText}>Help Center</Text>
            </TouchableOpacity>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, styles.progressActive]} />
              <View style={styles.progressBar} />
              <View style={styles.progressBar} />
            </View>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the most efficient talent ecosystem.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.sectionLabel}>REGISTERING AS</Text>
            
            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleButton, role === 'seeker' && styles.roleButtonActive]} 
                onPress={() => setRole('seeker')}
              >
                <MaterialCommunityIcons 
                  name="account-search-outline" 
                  size={20} 
                  color={role === 'seeker' ? COLORS.primary : COLORS.secondary} 
                />
                <Text style={[styles.roleButtonText, role === 'seeker' && styles.roleButtonTextActive]}>Job Seeker</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.roleButton, role === 'recruiter' && styles.roleButtonActive]} 
                onPress={() => setRole('recruiter')}
              >
                <MaterialCommunityIcons 
                  name="office-building-outline" 
                  size={20} 
                  color={role === 'recruiter' ? COLORS.primary : COLORS.secondary} 
                />
                <Text style={[styles.roleButtonText, role === 'recruiter' && styles.roleButtonTextActive]}>Recruiter</Text>
              </TouchableOpacity>
            </View>

            {/* Input Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Alex Morgan"
                placeholderTextColor={COLORS.secondary}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="alex.morgan@example.com"
                placeholderTextColor={COLORS.secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Min. 8 characters"
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
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgree(!agree)}>
              <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
                {agree && <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateAccount}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.createButtonText}>Create Account</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Bottom Branding Icons (Optional Decoration) */}
          <View style={styles.brandingIcons}>
             <MaterialCommunityIcons name="rocket-launch-outline" size={24} color={COLORS.outline} />
             <MaterialCommunityIcons name="broadcast" size={24} color={COLORS.outline} />
             <MaterialCommunityIcons name="trophy-outline" size={24} color={COLORS.outline} />
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  helpLink: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  helpText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 1,
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  roleButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  roleButtonTextActive: {
    color: COLORS.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    color: COLORS.onSurface,
    fontSize: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    color: COLORS.onSurface,
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 32,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.outline,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 20,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  createButtonDisabled: {
    opacity: 0.8,
  },
  errorText: {
    marginTop: 12,
    color: '#e03e3e',
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 15,
    color: COLORS.secondary,
  },
  loginText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
  },
  brandingIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 48,
    opacity: 0.5,
  }
});

export default ReactNativeSignUp;