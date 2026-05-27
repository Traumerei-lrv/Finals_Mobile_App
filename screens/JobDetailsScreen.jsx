import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getJobDetails } from '../data/jobs';
import {
  getAppliedJobs,
  getSavedJobs,
  removeSavedJob,
  saveJob,
} from '../utils/storage';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainer: '#e2e7f9',
  outline: '#cfdaf1',
  white: '#ffffff',
};

export default function JobDetailsScreen({ navigation, route }) {
  const job = getJobDetails(route?.params?.job);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrateSavedState = async () => {
      const savedJobs = await getSavedJobs();
      const appliedJobs = await getAppliedJobs();
      const savedIds = new Set(savedJobs.map((item) => item.id));
      const appliedIds = new Set(appliedJobs.map((item) => item.id));
      if (isMounted && job) {
        setIsSaved(savedIds.has(job.id));
        setIsApplied(appliedIds.has(job.id));
      }
    };

    void hydrateSavedState();
    return () => {
      isMounted = false;
    };
  }, [job]);

  if (!job) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Job details unavailable</Text>
        <TouchableOpacity style={styles.backOnlyButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backOnlyButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleToggleSave = async () => {
    if (!job) {
      return;
    }

    if (isSaved) {
      await removeSavedJob(job.id);
      setIsSaved(false);
      return;
    }

    await saveJob(job);
    setIsSaved(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{job.role}</Text>
          <Text style={styles.headerSubtitle}>{job.company}</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={handleToggleSave}>
          <MaterialCommunityIcons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Image source={{ uri: job.imageUrl }} style={styles.heroImage} />
          <View style={styles.companyLogoContainer}>
            <Image source={{ uri: job.logoUrl }} style={styles.companyLogo} />
          </View>
          <Text style={styles.jobTitle}>{job.role}</Text>
          <Text style={styles.companyInfo}>{job.company} · {job.location}</Text>

          <View style={styles.tagRow}>
            {job.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.salaryContainer}>
            <Text style={styles.salaryAmount}>{job.salary}</Text>
            {job.salaryPeriod ? <Text style={styles.salaryPeriod}> {job.salaryPeriod}</Text> : null}
          </View>
          <Text style={styles.postedText}>{job.posted}</Text>
        </View>

        <View style={styles.contentPadding}>
          <Text style={styles.sectionTitle}>About the role</Text>
          <Text style={styles.sectionBody}>{job.about}</Text>

          <Text style={styles.sectionTitle}>Responsibilities</Text>
          {job.responsibilities.map((item, i) => (
            <RowItem key={`${item}-${i}`} icon="check-circle-outline" text={item} />
          ))}

          <Text style={styles.sectionTitle}>Qualifications</Text>
          {job.qualifications.map((item, i) => (
            <RowItem key={`${item}-${i}`} icon="check-decagram-outline" text={item} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {isApplied ? (
          <View style={[styles.applyButton, styles.pendingButton]}>
            <Text style={styles.applyButtonText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => navigation.navigate('SubmitApplication', { job })}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const RowItem = ({ icon, text }) => (
  <View style={styles.listItem}>
    <MaterialCommunityIcons name={icon} size={18} color={COLORS.primary} style={styles.listIcon} />
    <Text style={styles.listItemText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  backOnlyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backOnlyButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  headerButton: { padding: 8 },
  headerTitleContainer: { flex: 1, paddingHorizontal: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  headerSubtitle: { fontSize: 12, color: COLORS.secondary },
  scrollContent: { paddingBottom: 110 },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.surfaceContainer,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 8,
  },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    marginBottom: 18,
  },
  companyLogoContainer: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 12,
  },
  companyLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  companyInfo: { fontSize: 16, color: COLORS.secondary, fontWeight: '500', marginBottom: 14 },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: '#D4DBF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  salaryContainer: { flexDirection: 'row', alignItems: 'baseline' },
  salaryAmount: { fontSize: 30, fontWeight: '800', color: COLORS.primary },
  salaryPeriod: { fontSize: 15, color: COLORS.secondary, fontWeight: '500' },
  postedText: { marginTop: 6, fontSize: 12, color: COLORS.secondary },
  contentPadding: { padding: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionBody: { fontSize: 15, color: COLORS.secondary, lineHeight: 24 },
  listItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  listIcon: { marginTop: 2, marginRight: 12 },
  listItemText: { flex: 1, fontSize: 15, color: COLORS.secondary, lineHeight: 22 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 54,
  },
  pendingButton: {
    backgroundColor: COLORS.secondary,
  },
  applyButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
