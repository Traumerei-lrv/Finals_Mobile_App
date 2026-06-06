import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../components/RecruiterBottomNav';
import RecruiterSidebarMenu from '../../components/RecruiterSidebarMenu';
import { useAuthContext } from '../../context/AuthContext';
import { auth } from '../../firebase';
import { subscribeToRecruiterJobs } from '../../utils/jobsFirestore';
import { subscribeToRecruiterApplications } from '../../utils/applicationsFirestore';

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
  accentBlue: '#8AB4F8',
  openTag: '#E6F4EA',
  openTagText: '#1E8E3E',
  closedTag: '#F1F3F4',
  closedTagText: '#5F6368',
};

const RecruiterDashboardNoAIScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAdmin } = useAuthContext();

  useEffect(() => {
    const recruiterId = auth.currentUser?.uid ?? null;
    const unsubscribeJobs = subscribeToRecruiterJobs({
      recruiterId,
      onData: setJobs,
      onError: (error) => console.error('Recruiter jobs subscription error', error),
    });
    const unsubscribeApplications = subscribeToRecruiterApplications({
      recruiterId,
      onData: setApplications,
      onError: (error) => console.error('Recruiter applications subscription error', error),
    });

    return () => {
      unsubscribeJobs();
      unsubscribeApplications();
    };
  }, [refreshKey]);

  const applicantsByJobId = useMemo(() => {
    const grouped = {};
    applications.forEach((application) => {
      const jobId = application.jobId;
      if (!jobId) return;
      grouped[jobId] = (grouped[jobId] ?? 0) + 1;
    });
    return grouped;
  }, [applications]);

  const pendingApplications = useMemo(
    () => applications.filter((application) => application.statusType === 'applied').length,
    [applications],
  );

  const recentJobs = useMemo(() => jobs.slice(0, 6), [jobs]);

  const handleRefresh = () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);
    setRefreshKey((current) => current + 1);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <RecruiterSidebarMenu
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeRoute="RecruiterHome"
        showAdmin={isAdmin && typeof isAdmin === 'function' ? isAdmin() : false}
      />
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setSidebarOpen(true)}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Career Go</Text>
        <View style={styles.headerRight}>
          <View style={{ width: 24 }} />
          <View style={styles.profileAvatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Recruitment Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recruitment Overview</Text>
        </View>

        <View style={styles.overviewContainer}>
          <OverviewCard 
            icon="briefcase-variant" 
            label="ACTIVE LISTINGS" 
            value={String(jobs.filter((job) => job.status !== 'closed').length)} 
            iconBg={COLORS.primary}
          />
          <OverviewCard 
            icon="account-group" 
            label="NEW APPLICANTS" 
            value={String(applications.length)} 
            iconBg={COLORS.primary}
          />
          <OverviewCard 
            icon="calendar-blank" 
            label="PENDING REVIEW" 
            value={String(pendingApplications)} 
            iconBg="#E8F0FE"
            iconColor={COLORS.primary}
          />
        </View>

        {/* Recent Job Postings */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Job Postings</Text>
          <TouchableOpacity style={styles.viewAllRow}>
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.jobList}>
          {!recentJobs.length ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>No job posts yet</Text>
              <Text style={styles.emptyStateSubtitle}>Create a posting and it will appear here automatically.</Text>
            </View>
          ) : null}
          {recentJobs.map((job) => {
            const applicantsCount = applicantsByJobId[job.id] ?? 0;
            const status = job.status === 'closed' ? 'CLOSED' : 'OPEN';
            return (
              <JobPostingCard
                key={job.id}
                title={job.role}
                meta={`${job.posted} • ${job.location}`}
                applicants={`${applicantsCount} Applicant${applicantsCount === 1 ? '' : 's'}`}
                status={status}
                onPress={() => navigation.navigate('ApplicantsList', { jobId: job.id, jobTitle: job.role })}
              />
            );
          })}
        </View>

        {/* Pending Review */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pending Review</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{pendingApplications} New</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.processAllButton} onPress={() => navigation.navigate('ApplicantsList')}>
          <Text style={styles.processAllText}>Open Applicants Inbox</Text>
        </TouchableOpacity>
      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="home" showFab />
    </SafeAreaView>
  );
};

const OverviewCard = ({ icon, label, value, iconBg, iconColor }) => (
  <View style={styles.overviewCard}>
    <View style={[styles.cardIconContainer, { backgroundColor: iconBg }]}>
      <MaterialCommunityIcons name={icon} size={24} color={iconColor || COLORS.white} />
    </View>
    <View style={styles.cardContent}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  </View>
);

const JobPostingCard = ({ title, meta, applicants, status, onPress }) => (
  <TouchableOpacity style={styles.jobCard} onPress={onPress}>
    <View style={styles.jobCardHeader}>
      <Text style={styles.jobCardTitle}>{title}</Text>
      <View style={[styles.statusTag, status === 'OPEN' ? styles.tagOpen : styles.tagClosed]}>
        <Text style={[styles.statusTagText, status === 'OPEN' ? styles.tagOpenText : styles.tagClosedText]}>{status}</Text>
      </View>
    </View>
    <Text style={styles.jobCardMeta}>{meta}</Text>
    <View style={styles.jobCardDivider} />
    <View style={styles.jobCardFooter}>
      <Text style={styles.jobCardApplicants}>{applicants}</Text>
      <Text style={styles.jobCardShortlisted}>View applicants</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
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
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  overviewContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  jobList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  jobCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    flex: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagOpen: {
    backgroundColor: COLORS.openTag,
  },
  tagOpenText: {
    color: COLORS.openTagText,
    fontSize: 10,
    fontWeight: '800',
  },
  tagClosed: {
    backgroundColor: COLORS.closedTag,
  },
  tagClosedText: {
    color: COLORS.closedTagText,
    fontSize: 10,
    fontWeight: '800',
  },
  jobCardMeta: {
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 16,
  },
  jobCardDivider: {
    height: 1,
    backgroundColor: COLORS.outline,
    marginBottom: 12,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardApplicants: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  jobCardShortlisted: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  hiredText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '800',
  },
  emptyStateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  newBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  processAllButton: {
    marginHorizontal: 20,
    backgroundColor: '#E8F0FE',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 10,
  },
  processAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default RecruiterDashboardNoAIScreen;
