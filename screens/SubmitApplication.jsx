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
import { saveAppliedJob } from '../utils/storage';

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
  error: '#B91C1C',
};

const SubmitApplicationScreen = ({ navigation, route }) => {
  const job = route?.params?.job ?? null;
  const [formData, setFormData] = useState({
    fullName: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    phoneNumber: '+1 (555) 000-0000',
    screening1: '',
    noticePeriod: '',
  });

  const handleSubmitApplication = async () => {
    if (!job) {
      return;
    }

    await saveAppliedJob(job);
    navigation.navigate('ApplicationSubmitted', { job });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Submit Application</Text>
          {job ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {job.role} at {job.company}
            </Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Progress Header */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.stepText}>STEP 1 OF 2</Text>
              <Text style={styles.percentText}>50% Complete</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '50%' }]} />
            </View>
          </View>

          {/* Section: Upload CV */}
          <View style={styles.sectionHeader}>
             <MaterialCommunityIcons name="file-document-outline" size={20} color={COLORS.primary} />
             <Text style={styles.sectionTitle}>Upload CV</Text>
          </View>
          
          <TouchableOpacity style={styles.uploadBox}>
            <View style={styles.pdfIconContainer}>
               <MaterialCommunityIcons name="file-pdf-box" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.uploadTitle}>Upload Resume</Text>
            <Text style={styles.uploadSubtitle}>
              Drag and drop or click to browse (PDF, max 5MB)
            </Text>
          </TouchableOpacity>

          {/* Section: Contact Information */}
          <View style={styles.sectionHeader}>
             <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.primary} />
             <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              placeholder="Your full name"
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="your.email@example.com"
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              keyboardType="phone-pad"
              placeholder="+1 (555) 000-0000"
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
            />
          </View>

          {/* Section: Screening Questions */}
          <Text style={styles.centeredSectionTitle}>Screening Questions</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Why are you a good fit for this role? <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              placeholder="Tell us about your experience and motivation..."
              value={formData.screening1}
              onChangeText={(text) => setFormData({ ...formData, screening1: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>What is your notice period? <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2 weeks, Immediate"
              value={formData.noticePeriod}
              onChangeText={(text) => setFormData({ ...formData, noticePeriod: text })}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitApplication}>
            <Text style={styles.submitButtonText}>Submit Application</Text>
            <MaterialCommunityIcons name="send" size={18} color={COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By clicking submit, you agree to our <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
          </Text>

          {/* Footer Branding */}
          <View style={styles.footer}>
            <Text style={styles.footerLogo}>JobFinder</Text>
            <Text style={styles.footerTagline}>
              Empowering professional growth through seamless connections. Our platform ensures reliability and precision in every hire.
            </Text>
            
            <Text style={styles.footerHeader}>CORPORATE RESOURCES</Text>
            <TouchableOpacity><Text style={styles.footerLink}>Hiring Policy</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLink}>Talent Community</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLink}>Security Standards</Text></TouchableOpacity>
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  progressSection: {
    padding: 20,
    backgroundColor: COLORS.white,
    marginBottom: 20,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  percentText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  centeredSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  uploadBox: {
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: COLORS.white,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  pdfIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  formGroup: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: '#F0F3FF', // Matches surfaceContainerLow
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 12,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 40,
    lineHeight: 18,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    marginTop: 60,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  footerLogo: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  footerTagline: {
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  footerHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
});

export default SubmitApplicationScreen;
