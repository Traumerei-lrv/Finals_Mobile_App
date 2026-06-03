import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  accentBlue: '#00a8e1',
  error: '#B91C1C',
};

const EditProfileScreen = () => {
  const [fullName, setFullName] = useState('Alex Morgan');
  const [headline, setHeadline] = useState('Senior Product Designer');
  const [location, setLocation] = useState('San Francisco, CA');
  const [about, setAbout] = useState('Passionate Product Designer with 8+ years of experience in creating human-centered digital experiences. Specialized in building scalable design systems and improving conversion rates through data-driven UI/UX decisions. Looking to lead...');
  const [workMode, setWorkMode] = useState('REMOTE');
  const [visibility, setVisibility] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveButtonTop}>
          <Text style={styles.saveButtonTopText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop' }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraButton}>
                <MaterialCommunityIcons name="camera-outline" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHelperText}>Update your photo to help recruiters recognize you</Text>
          </View>

          {/* Basic Information */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Professional Headline</Text>
              <TextInput
                style={styles.input}
                value={headline}
                onChangeText={setHeadline}
                placeholder="e.g. Senior Product Designer"
              />
              <Text style={styles.inputHelp}>Example: Senior Product Designer at Career Go</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="San Francisco, CA"
                />
              </View>
            </View>
          </View>

          {/* About Me */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Professional Summary</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={6}
                value={about}
                onChangeText={setAbout}
                maxLength={1000}
              />
              <View style={styles.textAreaFooter}>
                <Text style={styles.inputHelp}>Minimum 50 characters</Text>
                <Text style={styles.inputHelp}>{about.length} / 1000</Text>
              </View>
            </View>
          </View>

          {/* Work Mode */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
               <MaterialCommunityIcons name="briefcase-outline" size={20} color={COLORS.primary} />
               <Text style={styles.sectionTitle}>Work Mode</Text>
            </View>
            <View style={styles.workModeRow}>
              {['REMOTE', 'HYBRID', 'ON-SITE'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setWorkMode(mode)}
                  style={[
                    styles.modeButton,
                    workMode === mode && styles.modeButtonActive
                  ]}
                >
                  <Text style={[
                    styles.modeButtonText,
                    workMode === mode && styles.modeButtonTextActive
                  ]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Visibility */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeaderRow}>
               <MaterialCommunityIcons name="eye-outline" size={20} color={COLORS.primary} />
               <Text style={styles.sectionTitle}>Visibility</Text>
            </View>
            <View style={styles.visibilityCard}>
              <View style={styles.visibilityInfo}>
                <Text style={styles.visibilityLabel}>Open to opportunities</Text>
              </View>
              <Switch
                value={visibility}
                onValueChange={setVisibility}
                trackColor={{ false: COLORS.outline, true: COLORS.primary }}
                thumbColor={COLORS.white}
              />
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveProfileButton}>
              <Text style={styles.saveProfileButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation (Mock) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="home-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="magnify" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Apps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <View style={styles.activeNavIndicator}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
            <Text style={styles.navLabelActive}>Profile</Text>
          </View>
        </TouchableOpacity>
      </View>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  saveButtonTop: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonTopText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: COLORS.surfaceContainer,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarHelperText: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  inputHelp: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  textAreaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  workModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  modeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modeButtonTextActive: {
    color: COLORS.white,
  },
  visibilityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visibilityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 32,
    gap: 16,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  saveProfileButton: {
    flex: 2,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveProfileButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {
    flex: 1,
    alignItems: 'center',
  },
  activeNavIndicator: {
    backgroundColor: '#8AB4F8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  navLabelActive: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '800',
  },
});

export default EditProfileScreen;
