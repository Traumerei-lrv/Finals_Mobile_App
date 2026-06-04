import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../../components/RecruiterBottomNav';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainerLow: '#f0f3ff',
  onSurfaceVariant: '#5d7291',
  outline: '#cfdaf1',
  white: '#ffffff',
};

const JobPostingSuccessScreen = ({ navigation, route }) => {
  const postedJob = route?.params?.postedJob ?? {};
  const role = postedJob?.role || 'Untitled Role';
  const company = postedJob?.company || 'Unknown Company';
  const location = postedJob?.location || 'Remote';
  const salary = postedJob?.salary || 'Competitive';
  const type = postedJob?.type || 'Full-time';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="briefcase-outline" size={24} color={COLORS.primary} />
          <Text style={styles.headerLogo}>Career Go</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.successIconSection}>
          <View style={styles.successIconContainer}>
            <MaterialCommunityIcons name="rocket-launch" size={48} color={COLORS.white} />
          </View>
        </View>

        <View style={styles.headlineSection}>
          <Text style={styles.title}>Job Successfully Posted!</Text>
          <Text style={styles.subtitle}>Your listing is now live and visible to candidates.</Text>
        </View>

        <View style={styles.jobCard}>
          <View style={styles.tagRow}>
            <View style={styles.typeTag}><Text style={styles.typeTagText}>{String(type).toUpperCase()}</Text></View>
            <Text style={styles.postedDate}>Posted Today</Text>
          </View>
          <Text style={styles.salaryText}>{salary}</Text>
          <Text style={styles.jobTitle}>{role}</Text>
          <Text style={styles.jobLocation}>{company} • {location}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('ApplicantsList', { jobId: postedJob?.id })}>
            <MaterialCommunityIcons name="account-group-outline" size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Manage Applicants</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('RecruiterHome')}>
            <Text style={styles.secondaryButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="post_job" showFab />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.outline, backgroundColor: COLORS.white },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { fontSize: 22, fontWeight: '800', color: COLORS.primary, fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif' },
  scrollContent: { paddingBottom: 120 },
  successIconSection: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  successIconContainer: { width: 96, height: 96, borderRadius: 20, backgroundColor: '#8AB4F8', justifyContent: 'center', alignItems: 'center' },
  headlineSection: { alignItems: 'center', paddingHorizontal: 24, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: COLORS.onSurfaceVariant, textAlign: 'center', lineHeight: 24 },
  jobCard: { backgroundColor: COLORS.white, marginHorizontal: 20, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outline, marginBottom: 24 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  typeTag: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  typeTagText: { fontSize: 10, fontWeight: '800', color: COLORS.white },
  postedDate: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  salaryText: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  jobTitle: { fontSize: 22, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  jobLocation: { fontSize: 14, color: COLORS.onSurfaceVariant },
  buttonContainer: { paddingHorizontal: 20, gap: 16, marginBottom: 40 },
  primaryButton: { backgroundColor: '#001a33', height: 56, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  secondaryButton: { backgroundColor: COLORS.surface, height: 56, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outline, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
});

export default JobPostingSuccessScreen;
