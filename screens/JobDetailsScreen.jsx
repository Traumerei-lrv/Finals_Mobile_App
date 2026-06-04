import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../firebase';
import { hasApplicantAppliedToJob } from '../utils/applicationsFirestore';
import {
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

const OfficeLocation3D = React.lazy(() => import('../components/OfficeLocation3D'));

export default function JobDetailsScreen({ navigation, route }) {
  const job = route?.params?.job ?? null;
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isOfficePreviewExpanded, setIsOfficePreviewExpanded] = useState(false);

  const locationLabel = useMemo(() => {
    const details = [
      job?.locationDetails?.city,
      job?.locationDetails?.region,
      job?.locationDetails?.country,
    ].filter(Boolean);
    return details.join(', ') || job?.location || 'Office address is currently unavailable';
  }, [job]);

  const coordinatesLabel = useMemo(() => {
    const lat = Number(job?.locationCoordinates?.lat);
    const lng = Number(job?.locationCoordinates?.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }, [job]);

  useEffect(() => {
    let isMounted = true;

    const hydrateSavedState = async () => {
      const savedJobs = await getSavedJobs();
      const savedIds = new Set(savedJobs.map((item) => item.id));
      if (isMounted && job) {
        const applicantId = auth.currentUser?.uid ?? null;
        const alreadyApplied = applicantId
          ? await hasApplicantAppliedToJob({ jobId: job.id, applicantId })
          : false;
        setIsSaved(savedIds.has(job.id));
        setIsApplied(alreadyApplied);
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
          <Image
            source={{
              uri:
                job.imageUrl ??
                'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop',
            }}
            style={styles.heroImage}
          />
          <View style={styles.companyLogoContainer}>
            <Image
              source={{
                uri:
                  job.logoUrl ??
                  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=300&auto=format&fit=crop',
              }}
              style={styles.companyLogo}
            />
          </View>
          <Text style={styles.jobTitle}>{job.role}</Text>
          <Text style={styles.companyInfo}>{job.company} · {job.location}</Text>

          <View style={styles.tagRow}>
            {(job.tags ?? [job.type ?? 'Full-time']).map((tag) => (
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
          <Text style={styles.sectionBody}>
            {job.about ??
              `${job.company} is hiring a ${job.role} to help scale product quality and business impact.`}
          </Text>

          <Text style={styles.sectionTitle}>Responsibilities</Text>
          {(job.responsibilities ?? []).map((item, i) => (
            <RowItem key={`${item}-${i}`} icon="check-circle-outline" text={item} />
          ))}

          <Text style={styles.sectionTitle}>Qualifications</Text>
          {(job.qualifications ?? []).map((item, i) => (
            <RowItem key={`${item}-${i}`} icon="check-decagram-outline" text={item} />
          ))}

          <Text style={styles.sectionTitle}>Office Location</Text>
          <View style={styles.officeHeaderRow}>
            <MaterialCommunityIcons name="office-building-marker-outline" size={18} color={COLORS.primary} />
            <Text style={styles.officeLocationText}>{locationLabel}</Text>
          </View>
          {coordinatesLabel ? (
            <View style={styles.officeCoordinatesRow}>
              <MaterialCommunityIcons name="crosshairs-gps" size={16} color={COLORS.secondary} />
              <Text style={styles.officeCoordinatesText}>{coordinatesLabel}</Text>
            </View>
          ) : null}

          <View style={styles.officeCard}>
            <View style={styles.officeCanvasContainer}>
              <Suspense fallback={<OfficeCanvasFallback message="Loading 3D office view..." />}>
                <OfficeLocation3D height={220} interactive={false} />
              </Suspense>
            </View>
            <Pressable
              accessibilityRole="button"
              style={styles.expandOfficeButton}
              onPress={() => setIsOfficePreviewExpanded(true)}
            >
              <MaterialCommunityIcons name="arrow-expand" size={18} color={COLORS.primary} />
              <Text style={styles.expandOfficeButtonText}>View Larger</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isOfficePreviewExpanded}
        onRequestClose={() => setIsOfficePreviewExpanded(false)}
      >
        <View style={styles.officeModalBackdrop}>
          <View style={styles.officeModalSheet}>
            <View style={styles.officeModalHeader}>
              <View>
                <Text style={styles.officeModalTitle}>Office Location</Text>
                <Text style={styles.officeModalSubtitle}>{locationLabel}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.officeModalCloseButton}
                onPress={() => setIsOfficePreviewExpanded(false)}
              >
                <MaterialCommunityIcons name="close" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.officeModalCanvasContainer}>
              <Suspense fallback={<OfficeCanvasFallback message="Loading immersive office view..." />}>
                <OfficeLocation3D height={360} interactive />
              </Suspense>
            </View>
          </View>
        </View>
      </Modal>

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

const OfficeCanvasFallback = ({ message }) => (
  <View style={styles.officeCanvasFallback}>
    <ActivityIndicator size="small" color={COLORS.primary} />
    <Text style={styles.officeCanvasFallbackText}>{message}</Text>
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
  officeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  officeLocationText: {
    flex: 1,
    color: COLORS.secondary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  officeCoordinatesRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  officeCoordinatesText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  officeCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
    backgroundColor: '#eef2ff',
    overflow: 'hidden',
  },
  officeCanvasContainer: {
    height: 220,
    backgroundColor: '#f2f6ff',
  },
  officeCanvasFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  officeCanvasFallbackText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  expandOfficeButton: {
    borderTopWidth: 1,
    borderTopColor: COLORS.outline,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
  },
  expandOfficeButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  officeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 24, 41, 0.45)',
    justifyContent: 'flex-end',
  },
  officeModalSheet: {
    height: '78%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 18,
  },
  officeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  officeModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  officeModalSubtitle: {
    marginTop: 4,
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 280,
  },
  officeModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officeModalCanvasContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outline,
    backgroundColor: '#f2f6ff',
  },
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
