import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../../components/RecruiterBottomNav';

const { width } = Dimensions.get('window');

// Design Tokens (Professional Velocity - matching DS_2)
const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainer: '#e2e7f9',
  surfaceContainerLow: '#f0f3ff',
  surfaceContainerHigh: '#d4dbf4',
  onSurface: '#1a365d',
  onSurfaceVariant: '#5d7291',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#00a8e1',
  accentYellow: '#f9b208',
  secondaryContainer: '#e2e7f9',
  onSecondaryContainer: '#1a365d',
};

const PostJobScreen = ({ navigation }) => {
  const [workMode, setWorkMode] = useState('Hybrid');
  const [formData, setFormData] = useState({
    jobTitle: '',
    companyName: 'Velocity Corp',
    industry: 'Information Technology',
    location: 'New York, NY (or Global)',
    minSalary: '120000',
    maxSalary: '160000',
    description: '',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.profileAvatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.headerLogo}>Recruiter Hub</Text>
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="notifications-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Progress Header */}
          <View style={styles.progressHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.screenTitle}>Post a New Job</Text>
              <Text style={styles.stepText}>Step 1 of 3</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '33.33%' }]} />
            </View>
          </View>

          {/* Basic Info Section */}
          <Text style={styles.sectionLabel}>BASIC INFO</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Senior Software Engineer"
                placeholderTextColor={COLORS.secondary}
                value={formData.jobTitle}
                onChangeText={(text) => setFormData({ ...formData, jobTitle: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={formData.companyName}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Industry</Text>
              <TouchableOpacity style={styles.selectInput}>
                <Text style={styles.selectInputText}>{formData.industry}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Job Details Section */}
          <Text style={styles.sectionLabel}>JOB DETAILS</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Work Mode</Text>
            <View style={styles.modeGrid}>
              <ModeButton 
                icon="home-outline" 
                label="Remote" 
                active={workMode === 'Remote'} 
                onPress={() => setWorkMode('Remote')} 
              />
              <ModeButton 
                icon="office-building" 
                label="Hybrid" 
                active={workMode === 'Hybrid'} 
                onPress={() => setWorkMode('Hybrid')} 
              />
              <ModeButton 
                icon="domain" 
                label="On-site" 
                active={workMode === 'On-site'} 
                onPress={() => setWorkMode('On-site')} 
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.inputWithIcon}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.primary} style={styles.iconInInput} />
                <TextInput
                  style={styles.textInputInIcon}
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                />
              </View>
            </View>
          </View>

          {/* Salary Section */}
          <View style={styles.card}>
            <Text style={styles.label}>Salary Range (Annual)</Text>
            <View style={styles.salaryRow}>
              <View style={styles.salaryInputGroup}>
                <Text style={styles.salarySubLabel}>Min</Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.salaryTextInput}
                    keyboardType="numeric"
                    value={formData.minSalary}
                    onChangeText={(text) => setFormData({ ...formData, minSalary: text })}
                  />
                </View>
              </View>
              <View style={styles.salaryInputGroup}>
                <Text style={styles.salarySubLabel}>Max</Text>
                <View style={styles.currencyInput}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.salaryTextInput}
                    keyboardType="numeric"
                    value={formData.maxSalary}
                    onChangeText={(text) => setFormData({ ...formData, maxSalary: text })}
                  />
                </View>
              </View>
            </View>
            
            {/* Range Slider Mockup */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderTrack} />
              <View style={[styles.sliderTrackActive, { width: '40%', left: '30%' }]} />
              <View style={[styles.sliderThumb, { left: '50%' }]} />
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderValueText}>$50k</Text>
              <Text style={styles.sliderValueText}>$250k+</Text>
            </View>
          </View>

          {/* Description Section */}
          <Text style={styles.sectionLabel}>JOB DESCRIPTION & REQUIREMENTS</Text>
          <View style={styles.card}>
            <View style={styles.editorToolbar}>
              <View style={styles.toolbarLeft}>
                <TouchableOpacity style={styles.toolbarBtn}><MaterialCommunityIcons name="format-bold" size={20} color={COLORS.primary} /></TouchableOpacity>
                <TouchableOpacity style={styles.toolbarBtn}><MaterialCommunityIcons name="format-italic" size={20} color={COLORS.primary} /></TouchableOpacity>
                <TouchableOpacity style={styles.toolbarBtn}><MaterialCommunityIcons name="format-list-bulleted" size={20} color={COLORS.primary} /></TouchableOpacity>
              </View>
              <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.editorDivider} />
            <TextInput
              style={styles.editorInput}
              multiline
              placeholder="Outline the key responsibilities, required skills, and what makes this role unique..."
              placeholderTextColor={COLORS.secondary}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
          </View>

          {/* Bottom Action */}
          <TouchableOpacity style={styles.continueButton}>
            <Text style={styles.continueButtonText}>Continue to Step 2</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.draftText}>Drafts are saved automatically as you type.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <RecruiterBottomNav navigation={navigation} activeTab="post_job" showFab />
    </SafeAreaView>
  );
};

const ModeButton = ({ icon, label, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.modeBtn, active && styles.modeBtnActive]} 
    onPress={onPress}
  >
    <MaterialCommunityIcons name={icon} size={24} color={active ? COLORS.primary : COLORS.onSurface} />
    <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  progressHeader: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
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
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  inputDisabled: {
    backgroundColor: '#F0F3FF',
    color: COLORS.secondary,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  selectInputText: {
    fontSize: 15,
    color: COLORS.onSurface,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  modeBtn: {
    flex: 1,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    gap: 4,
  },
  modeBtnActive: {
    backgroundColor: '#EBF1FF',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  modeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  modeLabelActive: {
    color: COLORS.primary,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  iconInInput: {
    marginRight: 8,
  },
  textInputInIcon: {
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  salaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  salaryInputGroup: {
    flex: 1,
  },
  salarySubLabel: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  currencySymbol: {
    fontSize: 15,
    color: COLORS.secondary,
    marginRight: 4,
  },
  salaryTextInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  sliderContainer: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 4,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 2,
  },
  sliderTrackActive: {
    position: 'absolute',
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 4,
    borderColor: '#EBF1FF',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderValueText: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  editorToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toolbarLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  toolbarBtn: {
    padding: 4,
  },
  editorDivider: {
    height: 1,
    backgroundColor: COLORS.outline,
    marginBottom: 16,
  },
  editorInput: {
    fontSize: 15,
    color: COLORS.onSurface,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: '#001a33', // Deep navy
    marginHorizontal: 16,
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  draftText: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 16,
    fontWeight: '500',
  },
});

export default PostJobScreen;
