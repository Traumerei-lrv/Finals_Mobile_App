import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../firebase';
import {
  archiveApplicationForApplicant,
  mapApplicationToJobSeekerCard,
  subscribeToApplicantApplications,
} from '../utils/applicationsFirestore';
import SidebarMenu from '../components/SidebarMenu';

const { width } = Dimensions.get('window');

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
  statusInterview: '#8AB4F8',
  statusReview: '#e2e7f9',
  statusDeclined: '#FEE2E2',
  statusDeclinedText: '#B91C1C',
  statusWithdrawn: '#FFF1F2',
  statusWithdrawnText: '#BE123C',
  error: '#B91C1C',
  tagBg: '#E2E7F9',
};

// ─── Main screen ──────────────────────────────────────────────────────────────
const MyApplicationsScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);
  const [submittedApplications, setSubmittedApplications] = useState([]);
  const [pendingArchiveIds, setPendingArchiveIds] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = ['All', 'Active', 'Interviews', 'Archive'];

  useEffect(() => {
    const applicantId = auth.currentUser?.uid ?? null;
    const unsubscribe = subscribeToApplicantApplications({
      applicantId,
      onData: (applications) => {
        setSubmittedApplications(applications.map(mapApplicationToJobSeekerCard));
      },
      onError: (error) => console.error('Applications subscription error', error),
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (route?.params?.initialTab === 'Archive') {
      setActiveTab('Archive');
      navigation.setParams({ initialTab: undefined });
    }
  }, [navigation, route?.params?.initialTab]);

  const allApplications = useMemo(
    () => submittedApplications.filter((application) => !pendingArchiveIds.includes(application.id)),
    [pendingArchiveIds, submittedApplications],
  );
  const handleOpenSidebar = () => setSidebarOpen(true);
  const handleCloseSidebar = () => setSidebarOpen(false);
  const navigateFromSidebar = (routeName) => {
    handleCloseSidebar();
    navigation.navigate(routeName);
  };

  const filteredApps = allApplications.filter((app) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return ['applied', 'review', 'offer'].includes(app.statusType);
    if (activeTab === 'Interviews') return app.statusType === 'interview';
    if (activeTab === 'Archive') return app.statusType === 'declined' || app.statusType === 'withdrawn';
    return true;
  });

  const handleDeleteArchivedApp = async (app) => {
    setPendingArchiveIds((prev) => (prev.includes(app.id) ? prev : [...prev, app.id]));
    try {
      await archiveApplicationForApplicant({ applicationId: app.id });
    } catch (error) {
      console.error('Archive applicant application failed', error);
      setPendingArchiveIds((prev) => prev.filter((id) => id !== app.id));
      Alert.alert('Delete failed', 'Unable to delete this application right now. Please try again.');
    }
  };

  if (selectedJob) {
    return (
      <JobDetailView
        job={selectedJob}
        onBack={() => setSelectedJob(null)}
        navigation={navigation}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SidebarMenu
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        navigation={navigation}
        activeRoute="Application"
        onItemPress={(item) => navigateFromSidebar(item.route)}
      />
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenSidebar}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Applications</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="notifications-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.applicationList}>
          {filteredApps.map((app) => (
            <ApplicationCard
              key={app.id}
              {...app}
              onPress={() => setSelectedJob(app)}
              onDelete={
                app.statusType === 'withdrawn' || app.statusType === 'declined'
                  ? () => handleDeleteArchivedApp(app)
                  : null
              }
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Home')}>
          <MaterialCommunityIcons name="home-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Search')}>
          <MaterialCommunityIcons name="magnify" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive} onPress={() => navigation?.navigate('Application')}>
          <View style={styles.activeNavIndicator}>
            <MaterialCommunityIcons name="file-document" size={24} color={COLORS.primary} />
            <Text style={styles.navLabelActive}>Apps</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Profile')}>
          <MaterialCommunityIcons name="account-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Application card ─────────────────────────────────────────────────────────
const ApplicationCard = ({
  role, company, date, status, statusType, step,
  progress, progressColor, icon, onPress, onDelete,
}) => {
  let statusStyle = styles.statusReview;
  let statusTextStyle = styles.statusReviewText;
  if (statusType === 'interview') {
    statusStyle = styles.statusInterview;
    statusTextStyle = styles.statusInterviewText;
  } else if (statusType === 'declined') {
    statusStyle = styles.statusDeclined;
    statusTextStyle = styles.statusDeclinedText;
  } else if (statusType === 'withdrawn') {
    statusStyle = styles.statusWithdrawn;
    statusTextStyle = styles.statusWithdrawnText;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.companyLogoContainer}>
            <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.roleText}>{role}</Text>
            <Text style={styles.companyText}>{company}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={[styles.statusText, statusTextStyle]}>{status}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.dateText}>{date}</Text>
        </View>
        <Text style={styles.stepText}>{step}</Text>
      </View>

      <View style={styles.progressWrapper}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress * 100}%` },
              progressColor && { backgroundColor: progressColor },
            ]}
          />
        </View>
      </View>

      {/* Tap hint */}
      <View style={styles.viewDetailRow}>
        {typeof onDelete === 'function' && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(event) => {
              event?.stopPropagation?.();
              onDelete?.();
            }}
          >
            <MaterialCommunityIcons name="delete-outline" size={16} color={COLORS.error} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.viewDetailText}>View job details</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.accentBlue} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Job detail view ─────────────────────────────────────────────────────────
const JobDetailView = ({ job, onBack, navigation }) => {
  const [activeTab, setActiveTab] = useState('Description');
  const tabs = ['Description', 'Company', 'Reviews'];

  let statusStyle = styles.statusReview;
  let statusTextStyle = styles.statusReviewText;
  if (job.statusType === 'interview') {
    statusStyle = styles.statusInterview;
    statusTextStyle = styles.statusInterviewText;
  } else if (job.statusType === 'declined') {
    statusStyle = styles.statusDeclined;
    statusTextStyle = styles.statusDeclinedText;
  } else if (job.statusType === 'withdrawn') {
    statusStyle = styles.statusWithdrawn;
    statusTextStyle = styles.statusWithdrawnText;
  }

  const getCtaConfig = () => {
    if (job.statusType === 'declined' || job.statusType === 'withdrawn') {
      return { label: 'Application Closed', disabled: true };
    }
    if (job.statusType === 'applied') {
      return { label: 'Pending', disabled: true };
    }
    if (job.statusType === 'review') {
      return { label: 'Under Review', disabled: true };
    }
    if (job.statusType === 'offer' || job.statusType === 'interview') {
      return { label: 'View Interview Details', disabled: false };
    }
    return { label: 'Continue Application', disabled: false };
  };

  const ctaConfig = getCtaConfig();

  return (
    <SafeAreaView style={detailStyles.container}>
      {/* Header */}
      <View style={detailStyles.header}>
        <TouchableOpacity style={detailStyles.headerButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={detailStyles.headerTitleContainer}>
          <Text style={detailStyles.headerTitle} numberOfLines={1}>{job.role}</Text>
          <Text style={detailStyles.headerSubtitle}>{job.company}</Text>
        </View>
        <View style={detailStyles.headerActions}>
          <TouchableOpacity style={detailStyles.headerButton}>
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={detailStyles.headerButton}>
            <MaterialCommunityIcons name="bookmark-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={detailStyles.scrollContent}
      >
        {/* Hero */}
        <View style={detailStyles.heroSection}>
          <View style={detailStyles.companyLogoContainer}>
            <MaterialCommunityIcons name={job.icon} size={36} color={COLORS.primary} />
          </View>
          <Text style={detailStyles.jobTitle}>{job.role}</Text>
          <Text style={detailStyles.companyInfo}>{job.company} · {job.location}</Text>

          <View style={detailStyles.tagRow}>
            {job.tags.map((tag) => (
              <View key={tag} style={detailStyles.tag}>
                <Text style={detailStyles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Application status badge inside detail */}
          <View style={[detailStyles.statusBadgeHero, statusStyle]}>
            <Text style={[detailStyles.statusBadgeText, statusTextStyle]}>{job.status}</Text>
          </View>

          <View style={detailStyles.salaryContainer}>
            <Text style={detailStyles.salaryAmount}>{job.salary}</Text>
            <Text style={detailStyles.salaryPeriod}> {job.salaryPeriod}</Text>
          </View>
        </View>

        {/* Progress row */}
        <View style={detailStyles.progressSection}>
          <View style={detailStyles.progressMeta}>
            <Text style={detailStyles.progressLabel}>Application progress</Text>
            <Text style={detailStyles.progressStep}>{job.step}</Text>
          </View>
          <View style={detailStyles.progressBarBackground}>
            <View
              style={[
                detailStyles.progressBarFill,
                { width: `${job.progress * 100}%` },
                job.progressColor && { backgroundColor: job.progressColor },
              ]}
            />
          </View>
        </View>

        {/* Content tabs */}
        <View style={detailStyles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[detailStyles.tabItem, activeTab === tab && detailStyles.tabItemActive]}
            >
              <Text style={[detailStyles.tabText, activeTab === tab && detailStyles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={detailStyles.contentPadding}>
          {activeTab === 'Description' && (
            <>
              <Text style={detailStyles.sectionTitle}>About the role</Text>
              <Text style={detailStyles.sectionBody}>{job.about}</Text>

              <Text style={detailStyles.sectionTitle}>Responsibilities</Text>
              {job.responsibilities.map((item, i) => (
                <BulletItem key={i} text={item} />
              ))}

              <Text style={detailStyles.sectionTitle}>Qualifications</Text>
              {job.qualifications.map((item, i) => (
                <CheckItem key={i} text={item} />
              ))}
            </>
          )}
          {activeTab === 'Company' && (
            <Text style={detailStyles.sectionBody}>Company information coming soon...</Text>
          )}
          {activeTab === 'Reviews' && (
            <Text style={detailStyles.sectionBody}>Reviews coming soon...</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={detailStyles.bottomBar}>
        <TouchableOpacity style={detailStyles.saveButton}>
          <MaterialCommunityIcons name="bookmark-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        {!ctaConfig.disabled ? (
          <TouchableOpacity
            style={detailStyles.applyButton}
            onPress={() => navigation?.navigate('TrackApplication', { job })}
          >
            <Text style={detailStyles.applyButtonText}>{ctaConfig.label}</Text>
          </TouchableOpacity>
        ) : (
          <View style={[detailStyles.applyButton, detailStyles.applyButtonDisabled]}>
            <Text style={detailStyles.applyButtonText}>{ctaConfig.label}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── Shared sub-components ────────────────────────────────────────────────────
const BulletItem = ({ text }) => (
  <View style={detailStyles.listItem}>
    <MaterialCommunityIcons
      name="check-circle-outline"
      size={18}
      color={COLORS.accentBlue}
      style={detailStyles.listIcon}
    />
    <Text style={detailStyles.listItemText}>{text}</Text>
  </View>
);

const CheckItem = ({ text }) => (
  <View style={detailStyles.listItem}>
    <MaterialCommunityIcons
      name="check-decagram-outline"
      size={18}
      color={COLORS.secondary}
      style={detailStyles.listIcon}
    />
    <Text style={detailStyles.listItemText}>{text}</Text>
  </View>
);

// ─── Styles: list screen ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabItemActive: { backgroundColor: COLORS.primary },
  tabLabel: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  tabLabelActive: { color: COLORS.white },
  scrollContent: { paddingBottom: 100 },
  applicationList: { padding: 20, gap: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  companyLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  titleContainer: { flex: 1 },
  roleText: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  companyText: { fontSize: 14, color: COLORS.secondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, maxWidth: 110 },
  statusText: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
  statusInterview: { backgroundColor: COLORS.statusInterview },
  statusInterviewText: { color: COLORS.primary },
  statusReview: { backgroundColor: COLORS.statusReview },
  statusReviewText: { color: COLORS.primary },
  statusDeclined: { backgroundColor: COLORS.statusDeclined },
  statusDeclinedText: { color: COLORS.statusDeclinedText },
  statusWithdrawn: { backgroundColor: COLORS.statusWithdrawn },
  statusWithdrawnText: { color: COLORS.statusWithdrawnText },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: COLORS.secondary, fontWeight: '500' },
  stepText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  progressWrapper: { height: 8, width: '100%' },
  progressBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  deleteButton: {
    marginRight: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '700',
  },
  viewDetailText: { fontSize: 12, color: COLORS.accentBlue, fontWeight: '600' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navItemActive: { flex: 1, alignItems: 'center' },
  activeNavIndicator: {
    backgroundColor: '#8AB4F8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: { fontSize: 11, color: COLORS.secondary, fontWeight: '600' },
  navLabelActive: { fontSize: 11, color: COLORS.primary, fontWeight: '800' },
});

// ─── Styles: detail view ──────────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
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
  headerActions: { flexDirection: 'row' },
  scrollContent: { paddingBottom: 110 },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.surfaceContainerLow,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 8,
  },
  companyLogoContainer: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 12,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  companyInfo: { fontSize: 16, color: COLORS.secondary, fontWeight: '500', marginBottom: 16 },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  statusBadgeHero: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 16,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  salaryContainer: { flexDirection: 'row', alignItems: 'baseline' },
  salaryAmount: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  salaryPeriod: { fontSize: 16, color: COLORS.secondary, fontWeight: '500' },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 12, color: COLORS.secondary, fontWeight: '500' },
  progressStep: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  progressBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  tabItem: {
    paddingVertical: 16,
    marginRight: 24,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  tabTextActive: { color: COLORS.primary },
  contentPadding: { padding: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionBody: { fontSize: 15, color: COLORS.secondary, lineHeight: 24 },
  listItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  listIcon: { marginTop: 2, marginRight: 12 },
  listItemText: { flex: 1, fontSize: 15, color: COLORS.secondary, lineHeight: 22 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline,
    gap: 16,
  },
  saveButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
  },
  applyButtonDisabled: { backgroundColor: COLORS.secondary },
  applyButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default MyApplicationsScreen;
