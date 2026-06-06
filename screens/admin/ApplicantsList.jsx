import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../components/RecruiterBottomNav';
import RecruiterSidebarMenu from '../../components/RecruiterSidebarMenu';
import { auth } from '../../firebase';
import { subscribeToRecruiterApplications } from '../../utils/applicationsFirestore';
import { subscribeToRecruiterJobs } from '../../utils/jobsFirestore';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#8AB4F8',
};

const ApplicantsListScreen = ({ navigation, route }) => {
  const initialJobId = route?.params?.jobId ?? null;
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [search, setSearch] = useState('');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setSelectedJobId(route?.params?.jobId ?? null);
  }, [route?.params?.jobId]);

  useEffect(() => {
    const recruiterId = auth.currentUser?.uid ?? null;
    const unsubscribeJobs = subscribeToRecruiterJobs({
      recruiterId,
      onData: setJobs,
      onError: (error) => console.error('Recruiter jobs subscription error', error),
    });
    const unsubscribeApps = subscribeToRecruiterApplications({
      recruiterId,
      onData: setApplications,
      onError: (error) => console.error('Applicants subscription error', error),
    });

    return () => {
      unsubscribeJobs();
      unsubscribeApps();
    };
  }, [refreshKey]);

  const applicationsByJobId = useMemo(() => {
    const grouped = {};
    applications.forEach((application) => {
      if (!application.jobId) return;
      if (!grouped[application.jobId]) grouped[application.jobId] = [];
      grouped[application.jobId].push(application);
    });
    return grouped;
  }, [applications]);

  const jobCards = useMemo(() => {
    return jobs
      .map((job) => ({
        id: job.id,
        title: job.role,
        location: job.location,
        posted: job.posted,
        applicants: (applicationsByJobId[job.id] ?? []).length,
      }))
      .sort((a, b) => b.applicants - a.applicants);
  }, [jobs, applicationsByJobId]);

  const selectedJobApplications = useMemo(() => {
    if (!selectedJobId) return [];
    const keyword = search.trim().toLowerCase();
    const source = applicationsByJobId[selectedJobId] ?? [];
    if (!keyword) return source;

    return source.filter((item) =>
      [item.applicantName, item.applicantEmail, item.status, item.statusType]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    );
  }, [applicationsByJobId, search, selectedJobId]);

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) ?? null, [jobs, selectedJobId]);

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
        activeRoute="ApplicantsList"
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => (selectedJobId ? setSelectedJobId(null) : setSidebarOpen(true))}
        >
          <MaterialCommunityIcons name={selectedJobId ? 'arrow-left' : 'menu'} size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Career Go</Text>
        <View style={styles.profileAvatarPlaceholder}>
          <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
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
        {!selectedJobId ? (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.title}>Posted Jobs</Text>
            </View>

            <View style={styles.applicantsList}>
              {!jobCards.length ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No job posts yet</Text>
                  <Text style={styles.emptySubtitle}>Create a job posting and applicant cards will appear here.</Text>
                </View>
              ) : null}

              {jobCards.map((job) => (
                <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => setSelectedJobId(job.id)}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobMeta}>{job.posted} • {job.location}</Text>
                  <View style={styles.jobFooter}>
                    <Text style={styles.jobApplicants}>{job.applicants} Applicant{job.applicants === 1 ? '' : 's'}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.searchSection}>
              <View style={styles.searchInputWrapper}>
                <MaterialCommunityIcons name="magnify" size={20} color={COLORS.secondary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search applicant by name or email"
                  placeholderTextColor={COLORS.secondary}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.title}>{selectedJob?.role ?? 'Applicants'}</Text>
              <Text style={styles.subtitle}>
                {selectedJobApplications.length} candidate{selectedJobApplications.length === 1 ? '' : 's'} for this role.
              </Text>
            </View>

            <View style={styles.applicantsList}>
              {!selectedJobApplications.length ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No applications yet</Text>
                  <Text style={styles.emptySubtitle}>Applicants for this job will appear here.</Text>
                </View>
              ) : null}

              {selectedJobApplications.map((item) => {
                return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.candidateCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('ApplicantReview', { application: item })}
                >
                  <Text style={styles.candidateName}>{item.applicantName}</Text>
                  <Text style={styles.candidateRole}>{item.applicantEmail || 'No email provided'}</Text>
                  <Text style={styles.candidateStatus}>Status: {item.status}</Text>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.secondaryAction}
                      onPress={(event) => {
                        event?.stopPropagation?.();
                        navigation.navigate('ApplicantReview', { application: item });
                      }}
                    >
                      <Text style={styles.secondaryActionText}>Review</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="applicants" showFab />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
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
  iconButton: { padding: 4 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { paddingBottom: 120, paddingTop: 8 },
  searchSection: { padding: 20, paddingBottom: 8 },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.primary },
  listHeader: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.primary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.secondary },
  applicantsList: { paddingHorizontal: 20, gap: 16 },
  emptyCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.outline },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: COLORS.secondary },
  jobCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.outline },
  jobTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 6 },
  jobMeta: { fontSize: 13, color: COLORS.secondary, marginBottom: 12 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.outline, paddingTop: 10 },
  jobApplicants: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  candidateCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.outline },
  candidateName: { fontSize: 17, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  candidateRole: { fontSize: 13, color: COLORS.secondary, marginBottom: 6 },
  candidateStatus: { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginBottom: 14 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  secondaryAction: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.outline, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  secondaryActionText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  deleteAction: {
    minWidth: 92,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  deleteActionText: { color: '#B91C1C', fontSize: 13, fontWeight: '700' },
});

export default ApplicantsListScreen;
