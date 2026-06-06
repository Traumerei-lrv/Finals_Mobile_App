import React, { useState } from 'react';
import { useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useAuthContext } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// Design Tokens (Professional Velocity - matching DS_2)
const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainer: '#e2e7f9',
  surfaceContainerLow: '#f0f3ff',
  onSurface: '#1a365d',
  onSurfaceVariant: '#5d7291',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#8AB4F8',
  verified: '#4285F4',
};

const EditCompanyProfileScreen = ({ navigation }) => {
  const { recruiterProfile, userProfile, user } = useAuthContext();
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [employeeRange, setEmployeeRange] = useState('');
  const [about, setAbout] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCompanyName(recruiterProfile?.company ?? '');
    setIndustry(recruiterProfile?.industry ?? '');
    setLocation(recruiterProfile?.location ?? '');
    setEmployeeRange(recruiterProfile?.employeeRange ?? '');
    setAbout(recruiterProfile?.about ?? recruiterProfile?.description ?? '');
  }, [recruiterProfile]);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid ?? user?.uid ?? null;
    if (!uid) {
      Alert.alert('Sign in required', 'Please sign in again before saving.');
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, 'recruiters', uid),
        {
          fullName: recruiterProfile?.fullName || userProfile?.fullName || user?.displayName || 'Recruiter',
          email: recruiterProfile?.email || userProfile?.email || user?.email || '',
          company: companyName.trim(),
          industry: industry.trim(),
          location: location.trim(),
          employeeRange: employeeRange.trim(),
          about: about.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save recruiter profile', error);
      Alert.alert('Save failed', 'Unable to save profile right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Edit Company Profile</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={{ width: 24 }} />
          <View style={styles.profileAvatarPlaceholder}>
             <Image 
               source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200' }} 
               style={styles.headerAvatar}
             />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Verification Badge */}
          <View style={styles.verifiedBanner}>
             <MaterialCommunityIcons name="check-decagram" size={24} color={COLORS.verified} />
             <View style={styles.verifiedContent}>
                <Text style={styles.verifiedLabel}>VERIFIED ENTERPRISE</Text>
                <Text style={styles.verifiedSub}>Velocity Corp is a trusted recruitment partner.</Text>
             </View>
             <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.secondary} />
          </View>

          {/* Logo Branding Card */}
          <View style={styles.logoCard}>
             <View style={styles.logoBox}>
                <MaterialCommunityIcons name="rocket-launch" size={48} color={COLORS.white} />
             </View>
             <Text style={styles.companyNameText}>{companyName || 'Your Company'}</Text>
             <TouchableOpacity>
                <Text style={styles.changeLogoText}>Change Company Logo</Text>
             </TouchableOpacity>
          </View>

          {/* Basic Info Form */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Industry</Text>
            <TouchableOpacity style={styles.selectInput}>
               <Text style={styles.selectText}>{industry}</Text>
               <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Headquarters Location</Text>
            <View style={styles.inputWithIcon}>
               <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.primary} style={styles.fieldIcon} />
               <TextInput
                 style={styles.textInputInField}
                 value={location}
                 onChangeText={setLocation}
               />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Employee Range</Text>
            <TouchableOpacity style={styles.selectInput}>
               <Text style={styles.selectText}>{employeeRange}</Text>
               <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>About Velocity Corp</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={6}
              value={about}
              onChangeText={setAbout}
            />
          </View>

          {/* Visual Assets Preview */}
          <View style={styles.mediaPreview}>
             <Image 
               source={{ uri: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop' }} 
               style={styles.previewImage}
             />
             <View style={styles.mapOverlay}>
                <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.primary} />
                <Text style={styles.mapText}>San Francisco, CA</Text>
             </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
             <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                <MaterialCommunityIcons name="content-save-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
             </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  verifiedBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: '#EEF4FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifiedContent: {
    flex: 1,
  },
  verifiedLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  verifiedSub: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  logoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    alignItems: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  changeLogoText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.verified,
  },
  formGroup: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 6,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 6,
    paddingHorizontal: 16,
    height: 52,
  },
  selectText: {
    fontSize: 15,
    color: COLORS.onSurface,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 6,
    paddingHorizontal: 16,
    height: 52,
  },
  fieldIcon: {
    marginRight: 12,
  },
  textInputInField: {
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  mediaPreview: {
    marginHorizontal: 16,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#001a33', // Deep navy
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EditCompanyProfileScreen;
