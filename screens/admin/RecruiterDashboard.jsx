import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { signOut } from 'firebase/auth';
import RecruiterBottomNav, { RECRUITER_BOTTOM_NAV_BASE_HEIGHT } from '../../components/RecruiterBottomNav';
import RecruiterSidebarMenu from '../../components/RecruiterSidebarMenu';
import LogoutConfirmModal from '../../components/LogoutConfirmModal';
import { useAuthContext } from '../../context/AuthContext';
import { auth } from '../../firebase';
import {
  subscribeToRecruiterJobs,
  createRecruiterJobPosting,
  deleteRecruiterJobPosting,
} from '../../utils/jobsFirestore';
import { subscribeToRecruiterApplications } from '../../utils/applicationsFirestore';

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
  accentBlue: '#8AB4F8',
  verified: '#4285F4',
  openTag: '#E6F4EA',
  openTagText: '#1E8E3E',
  closedTag: '#F1F3F4',
  closedTagText: '#5F6368',
  danger: '#D32F2F',
};

const MAIN_TABS = ['home', 'post_job', 'applicants', 'profile'];

function normalizeTab(value) {
  return MAIN_TABS.includes(value) ? value : 'home';
}

function getTabFromRoute(route) {
  if (route?.params?.tab) {
    return normalizeTab(route.params.tab);
  }

  if (route?.name === 'PostJob') {
    return 'post_job';
  }

  if (route?.name === 'ApplicantsList') {
    return 'applicants';
  }

  if (route?.name === 'RecruiterProfile') {
    return 'profile';
  }

  return 'home';
}

export default function RecruiterDashboard({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const bottomNavPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 12);
  const bottomNavHeight = RECRUITER_BOTTOM_NAV_BASE_HEIGHT + bottomNavPadding;
  const { isAdmin, recruiterProfile, userProfile, user } = useAuthContext();
  const [activeTab, setActiveTab] = useState(() => getTabFromRoute(route));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(route?.params?.jobId ?? null);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState(null);
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

  useEffect(() => {
    setActiveTab(getTabFromRoute(route));
    setSelectedJobId(route?.params?.jobId ?? null);
  }, [route?.name, route?.params?.jobId, route?.params?.tab]);

  useEffect(() => {
    const recruiterId = auth.currentUser?.uid ?? null;
    const unsubscribeJobs = subscribeToRecruiterJobs({
      recruiterId,
      onData: setJobs,
      onError: (error) => console.error('Recruiter dashboard jobs subscription error', error),
    });
    const unsubscribeApplications = subscribeToRecruiterApplications({
      recruiterId,
      onData: setApplications,
      onError: (error) => console.error('Recruiter dashboard applications subscription error', error),
    });

    return () => {
      unsubscribeJobs();
      unsubscribeApplications();
    };
  }, []);

  const applicantsByJobId = useMemo(() => {
    const grouped = {};
    applications.forEach((application) => {
      const jobId = application.jobId;
      if (!jobId) return;
      if (!grouped[jobId]) grouped[jobId] = [];
      grouped[jobId].push(application);
    });
    return grouped;
  }, [applications]);

  const applicantsCountByJobId = useMemo(() => {
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

  const totalActiveJobs = useMemo(
    () => jobs.filter((job) => String(job?.status ?? 'open').toLowerCase() !== 'closed').length,
    [jobs],
  );

  const recentJobs = useMemo(() => jobs.slice(0, 6), [jobs]);

  const jobCards = useMemo(
    () =>
      jobs
        .map((job) => ({
          id: job.id,
          title: job.role,
          location: job.location,
          posted: job.posted,
          applicants: applicantsCountByJobId[job.id] ?? 0,
        }))
        .sort((a, b) => b.applicants - a.applicants),
    [applicantsCountByJobId, jobs],
  );

  const selectedJobApplications = useMemo(() => {
    if (!selectedJobId) return [];
    const keyword = applicantSearch.trim().toLowerCase();
    const source = applicantsByJobId[selectedJobId] ?? [];
    if (!keyword) return source;

    return source.filter((item) =>
      [item.applicantName, item.applicantEmail, item.status, item.statusType]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    );
  }, [applicantSearch, applicantsByJobId, selectedJobId]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const recruiterName =
    recruiterProfile?.fullName ||
    userProfile?.fullName ||
    user?.displayName ||
    'Recruiter';
  const companyName = recruiterProfile?.company?.trim() || formData.companyName || 'Your Company';
  const recruiterEmail = recruiterProfile?.email || userProfile?.email || user?.email || 'No email';
  const initials = recruiterName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'R';
  const aboutCompany =
    recruiterProfile?.about ||
    recruiterProfile?.description ||
    `Recruiting team profile for ${companyName}. Update your company description to help candidates understand your mission and culture.`;
  const hiresThisQuarter = useMemo(() => {
    const now = new Date();
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1).getTime();
    return applications.filter((application) => {
      const isApproved = String(application?.statusType ?? '').toLowerCase() === 'offer';
      const createdAtMs = application?.createdAtMs ?? 0;
      return isApproved && createdAtMs >= quarterStart;
    }).length;
  }, [applications]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'applicants') {
      setSelectedJobId(null);
      setApplicantSearch('');
    }
  };

  const handleSidebarItemPress = (item) => {
    setSidebarOpen(false);
    if (item.route === 'RecruiterDashboard' && item.params?.tab) {
      handleTabChange(item.params.tab);
      return;
    }
    navigation.navigate(item.route, item.params);
  };

  const openApplicantsView = (jobId = null) => {
    setSelectedJobId(jobId);
    setApplicantSearch('');
    setActiveTab('applicants');
  };

  const buildSalaryLabel = () => {
    const min = formData.minSalary.trim();
    const max = formData.maxSalary.trim();
    if (min && max) return `$${min} - $${max}`;
    if (min) return `$${min}+`;
    if (max) return `Up to $${max}`;
    return 'Competitive';
  };

  const draftPayload = useMemo(
    () => ({
      role: formData.jobTitle.trim() || 'Untitled Role',
      company: formData.companyName.trim() || companyName,
      location: formData.location.trim() || 'Remote',
      type: workMode,
      salary: buildSalaryLabel(),
      about: formData.description.trim(),
      industry: formData.industry.trim(),
    }),
    [companyName, formData.companyName, formData.description, formData.industry, formData.jobTitle, formData.location, formData.maxSalary, formData.minSalary, workMode],
  );

  const handleContinueToStep2 = () => {
    navigation.navigate('PostJobStep2', { draft: draftPayload });
  };

  const handleQuickPostJob = async () => {
    if (!formData.jobTitle.trim()) {
      Alert.alert('Missing title', 'Please enter a job title before posting.');
      return;
    }

    const recruiterId = auth.currentUser?.uid ?? null;
    if (!recruiterId) {
      Alert.alert('Sign in required', 'Please sign in again before posting a job.');
      return;
    }

    try {
      setCreatingJob(true);
      const jobId = await createRecruiterJobPosting({
        recruiterId,
        draft: draftPayload,
      });

      navigation.navigate('PostJobSuccess', {
        postedJob: {
          id: jobId,
          role: draftPayload.role,
          company: draftPayload.company,
          location: draftPayload.location,
          salary: draftPayload.salary,
          type: draftPayload.type,
        },
      });
    } catch (error) {
      console.error('Failed to post job', error);
      Alert.alert('Posting failed', 'Unable to post job right now. Please try again.');
    } finally {
      setCreatingJob(false);
    }
  };

  const handleDeleteJob = (job) => {
    if (!job?.id) {
      return;
    }

    Alert.alert(
      'Delete job posting',
      `Delete "${job.role || job.title || 'this job'}"? This will also remove its related applications.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const recruiterId = auth.currentUser?.uid ?? null;
            if (!recruiterId) {
              Alert.alert('Sign in required', 'Please sign in again before deleting a job.');
              return;
            }

            try {
              setDeletingJobId(job.id);
              await deleteRecruiterJobPosting({ recruiterId, jobId: job.id });
              if (selectedJobId === job.id) {
                setSelectedJobId(null);
              }
            } catch (error) {
              console.error('Failed to delete recruiter job', error);
              Alert.alert('Delete failed', error?.message || 'Unable to delete this job right now. Please try again.');
            } finally {
              setDeletingJobId((current) => (current === job.id ? null : current));
            }
          },
        },
      ],
    );
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Recruiter logout failed', error);
    } finally {
      setLogoutLoading(false);
      setLogoutModalVisible(false);
    }
  };

  const headerTitle =
    activeTab === 'post_job'
      ? 'Post a Job'
      : activeTab === 'applicants'
        ? 'Applicants'
        : activeTab === 'profile'
          ? 'Recruiter Profile'
          : 'Career Go';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <RecruiterSidebarMenu
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeRoute={activeTab}
        onItemPress={handleSidebarItemPress}
        showAdmin={isAdmin && typeof isAdmin === 'function' ? isAdmin() : false}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 2 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setSidebarOpen(true)}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialCommunityIcons name="notifications-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.profileAvatarPlaceholder}>
            <Text style={styles.avatarInitial}>{initials}</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentArea}>
        <KeyboardAwareScrollView
          style={styles.flex}
          enableOnAndroid
          enableAutomaticScroll
          extraHeight={Platform.OS === 'ios' ? 24 : 124}
          extraScrollHeight={Platform.OS === 'ios' ? 24 : 124}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'home' ? (
            <HomeTab
              jobs={jobs}
              recentJobs={recentJobs}
              pendingApplications={pendingApplications}
              applications={applications}
              applicantsCountByJobId={applicantsCountByJobId}
              onOpenApplicants={openApplicantsView}
              onDeleteJob={handleDeleteJob}
              deletingJobId={deletingJobId}
            />
          ) : null}

          {activeTab === 'post_job' ? (
            <PostJobTab
              navigation={navigation}
              workMode={workMode}
              setWorkMode={setWorkMode}
              formData={formData}
              setFormData={setFormData}
              creatingJob={creatingJob}
              onContinue={handleContinueToStep2}
              onQuickPost={handleQuickPostJob}
            />
          ) : null}

          {activeTab === 'applicants' ? (
            <ApplicantsTab
              selectedJobId={selectedJobId}
              setSelectedJobId={setSelectedJobId}
              search={applicantSearch}
              setSearch={setApplicantSearch}
              jobCards={jobCards}
              selectedJob={selectedJob}
              selectedJobApplications={selectedJobApplications}
              navigation={navigation}
              onDeleteJob={handleDeleteJob}
              deletingJobId={deletingJobId}
            />
          ) : null}

          {activeTab === 'profile' ? (
            <ProfileTab
              recruiterName={recruiterName}
              recruiterEmail={recruiterEmail}
              companyName={companyName}
              initials={initials}
              aboutCompany={aboutCompany}
              totalActiveJobs={totalActiveJobs}
              totalApplicants={applications.length}
              hiresThisQuarter={hiresThisQuarter}
              navigation={navigation}
              onLogout={() => setLogoutModalVisible(true)}
            />
          ) : null}
        </KeyboardAwareScrollView>

        <RecruiterBottomNav
          navigation={navigation}
          activeTab={activeTab}
          showFab
          onTabPress={handleTabChange}
        />
      </View>

      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={logoutLoading}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleLogoutConfirm}
      />
    </SafeAreaView>
  );
}

function HomeTab({ jobs, recentJobs, pendingApplications, applications, applicantsCountByJobId, onOpenApplicants, onDeleteJob, deletingJobId }) {
  return (
    <>
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

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Job Postings</Text>
        <TouchableOpacity style={styles.viewAllRow} onPress={() => onOpenApplicants(null)}>
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
          const applicantsCount = applicantsCountByJobId[job.id] ?? 0;
          const status = job.status === 'closed' ? 'CLOSED' : 'OPEN';
          return (
            <JobPostingCard
              key={job.id}
              job={job}
              title={job.role}
              meta={`${job.posted} • ${job.location}`}
              applicants={`${applicantsCount} Applicant${applicantsCount === 1 ? '' : 's'}`}
              status={status}
              onPress={() => onOpenApplicants(job.id)}
              onDelete={() => onDeleteJob(job)}
              deleting={deletingJobId === job.id}
            />
          );
        })}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Pending Review</Text>
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>{pendingApplications} New</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.processAllButton} onPress={() => onOpenApplicants(null)}>
        <Text style={styles.processAllText}>Open Applicants Inbox</Text>
      </TouchableOpacity>
    </>
  );
}

function PostJobTab({
  workMode,
  setWorkMode,
  formData,
  setFormData,
  creatingJob,
  onContinue,
  onQuickPost,
}) {
  return (
    <>
      <View style={styles.progressHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>Post a New Job</Text>
          <Text style={styles.stepText}>Step 1 of 3</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '33.33%' }]} />
        </View>
      </View>

      <Text style={styles.sectionLabel}>BASIC INFO</Text>
      <View style={styles.formCard}>
        <FormField label="Job Title">
          <TextInput
            style={styles.input}
            placeholder="e.g. Senior Software Engineer"
            placeholderTextColor={COLORS.secondary}
            value={formData.jobTitle}
            onChangeText={(text) => setFormData({ ...formData, jobTitle: text })}
          />
        </FormField>

        <FormField label="Company Name">
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={formData.companyName}
            editable={false}
          />
        </FormField>

        <FormField label="Industry">
          <TouchableOpacity style={styles.selectInput}>
            <Text style={styles.selectInputText}>{formData.industry}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.secondary} />
          </TouchableOpacity>
        </FormField>
      </View>

      <Text style={styles.sectionLabel}>JOB DETAILS</Text>
      <View style={styles.formCard}>
        <Text style={styles.label}>Work Mode</Text>
        <View style={styles.modeGrid}>
          <ModeButton icon="home-outline" label="Remote" active={workMode === 'Remote'} onPress={() => setWorkMode('Remote')} />
          <ModeButton icon="office-building" label="Hybrid" active={workMode === 'Hybrid'} onPress={() => setWorkMode('Hybrid')} />
          <ModeButton icon="domain" label="On-site" active={workMode === 'On-site'} onPress={() => setWorkMode('On-site')} />
        </View>

        <FormField label="Location">
          <View style={styles.inputWithIcon}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.primary} style={styles.iconInInput} />
            <TextInput
              style={styles.textInputInIcon}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
          </View>
        </FormField>
      </View>

      <View style={styles.formCard}>
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
      </View>

      <Text style={styles.sectionLabel}>JOB DESCRIPTION & REQUIREMENTS</Text>
      <View style={styles.formCard}>
        <View style={styles.editorToolbar}>
          <View style={styles.toolbarLeft}>
            <TouchableOpacity style={styles.toolbarBtn}>
              <MaterialCommunityIcons name="format-bold" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn}>
              <MaterialCommunityIcons name="format-italic" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn}>
              <MaterialCommunityIcons name="format-list-bulleted" size={20} color={COLORS.primary} />
            </TouchableOpacity>
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

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>Continue to Step 2</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryPostButton, creatingJob && styles.secondaryPostButtonDisabled]}
          onPress={onQuickPost}
          disabled={creatingJob}
        >
          <Text style={styles.secondaryPostButtonText}>{creatingJob ? 'Posting...' : 'Quick Post Now'}</Text>
        </TouchableOpacity>
        <Text style={styles.draftText}>Drafts are saved automatically as you type.</Text>
      </View>
    </>
  );
}

function ApplicantsTab({ selectedJobId, setSelectedJobId, search, setSearch, jobCards, selectedJob, selectedJobApplications, navigation, onDeleteJob, deletingJobId }) {
  return !selectedJobId ? (
    <>
      <View style={styles.listHeader}>
        <Text style={styles.title}>Posted Jobs</Text>
        <Text style={styles.subtitle}>Tap a job card to view and manage its applicants.</Text>
      </View>

      <View style={styles.applicantsList}>
        {!jobCards.length ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No job posts yet</Text>
            <Text style={styles.emptyStateSubtitle}>Create a job posting and applicant cards will appear here.</Text>
          </View>
        ) : null}

        {jobCards.map((job) => (
          <JobPostingCard
            key={job.id}
            job={job}
            title={job.title}
            meta={`${job.posted} • ${job.location}`}
            applicants={`${job.applicants} Applicant${job.applicants === 1 ? '' : 's'}`}
            status="OPEN"
            onPress={() => setSelectedJobId(job.id)}
            onDelete={() => onDeleteJob(job)}
            deleting={deletingJobId === job.id}
            hideStatus
          />
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
        <TouchableOpacity style={styles.backToJobs} onPress={() => setSelectedJobId(null)}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.primary} />
          <Text style={styles.backToJobsText}>Back to Jobs</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{selectedJob?.role ?? 'Applicants'}</Text>
        <Text style={styles.subtitle}>
          {selectedJobApplications.length} candidate{selectedJobApplications.length === 1 ? '' : 's'} for this role.
        </Text>
        {selectedJob ? (
          <TouchableOpacity
            style={[styles.inlineDeleteButton, deletingJobId === selectedJob.id && styles.inlineDeleteButtonDisabled]}
            onPress={() => onDeleteJob(selectedJob)}
            disabled={deletingJobId === selectedJob.id}
          >
            <MaterialCommunityIcons name="delete-outline" size={16} color={COLORS.danger} />
            <Text style={styles.inlineDeleteButtonText}>
              {deletingJobId === selectedJob.id ? 'Deleting...' : 'Delete Job'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.applicantsList}>
        {!selectedJobApplications.length ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No applications yet</Text>
            <Text style={styles.emptyStateSubtitle}>Applicants for this job will appear here.</Text>
          </View>
        ) : null}

        {selectedJobApplications.map((item) => (
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
        ))}
      </View>
    </>
  );
}

function ProfileTab({
  recruiterName,
  recruiterEmail,
  companyName,
  initials,
  aboutCompany,
  totalActiveJobs,
  totalApplicants,
  hiresThisQuarter,
  navigation,
  onLogout,
}) {
  return (
    <>
      <View style={styles.profileHero}>
        <View style={styles.companyLogoContainerMain}>
          <View style={styles.logoBox}>
            <MaterialCommunityIcons name="rocket-launch" size={40} color={COLORS.white} />
          </View>
        </View>

        <Text style={styles.companyName}>{companyName}</Text>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>VERIFIED ENTERPRISE</Text>
        </View>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="office-building" size={16} color={COLORS.secondary} />
          <Text style={styles.metaText}>{recruiterName}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="email-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.metaText}>{recruiterEmail}</Text>
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="account-circle-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.metaText}>Owner {initials}</Text>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditRecruiterProfile')}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.white} />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsContainer}>
        <MetricItem label="Total Active Jobs" value={String(totalActiveJobs)} icon="briefcase-outline" />
        <MetricItem label="Total Applicants" value={String(totalApplicants)} icon="account-group-outline" />
        <MetricItem label="Hires this Quarter" value={String(hiresThisQuarter)} icon="star-outline" />
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.cardTitle}>About {companyName}</Text>
        <Text style={styles.cardBody}>{aboutCompany}</Text>

        <View style={styles.highlightsRow}>
          <View style={styles.highlightBadge}>
            <MaterialCommunityIcons name="check-decagram-outline" size={16} color={COLORS.primary} />
            <Text style={styles.highlightText}>Top Tier Employer</Text>
          </View>
          <View style={styles.highlightBadge}>
            <MaterialCommunityIcons name="lightbulb-outline" size={16} color={COLORS.primary} />
            <Text style={styles.highlightText}>Innovation First</Text>
          </View>
        </View>
      </View>

      <View style={styles.controlCard}>
        <Text style={styles.controlHeader}>Account Control</Text>
        <ControlLink icon="shield-check-outline" label="Privacy & Security" />
        <ControlLink icon="logout" label="Log Out" isLast onPress={onLogout} />
      </View>
    </>
  );
}

function OverviewCard({ icon, label, value, iconBg, iconColor }) {
  return (
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
}

function JobPostingCard({ title, meta, applicants, status, onPress, onDelete, deleting = false, hideStatus = false }) {
  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress}>
      <View style={styles.jobCardHeader}>
        <Text style={styles.jobCardTitle}>{title}</Text>
        {hideStatus ? null : (
          <View style={[styles.statusTag, status === 'OPEN' ? styles.tagOpen : styles.tagClosed]}>
            <Text style={[styles.statusTagText, status === 'OPEN' ? styles.tagOpenText : styles.tagClosedText]}>{status}</Text>
          </View>
        )}
      </View>
      <Text style={styles.jobCardMeta}>{meta}</Text>
      <View style={styles.jobCardDivider} />
      <View style={styles.jobCardFooter}>
        <Text style={styles.jobCardApplicants}>{applicants}</Text>
        <View style={styles.jobCardActions}>
          {typeof onDelete === 'function' ? (
            <TouchableOpacity
              style={[styles.deleteJobButton, deleting && styles.deleteJobButtonDisabled]}
              onPress={(event) => {
                event?.stopPropagation?.();
                onDelete();
              }}
              disabled={deleting}
            >
              <MaterialCommunityIcons name="delete-outline" size={14} color={COLORS.danger} />
              <Text style={styles.deleteJobButtonText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.jobCardShortlisted}>View applicants</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ModeButton({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.modeBtn, active && styles.modeBtnActive]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={24} color={active ? COLORS.primary : COLORS.onSurface} />
      <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function FormField({ label, children }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function MetricItem({ label, value, icon }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTextContent}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <View style={styles.metricIconContainer}>
        <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
      </View>
    </View>
  );
}

function ControlLink({ icon, label, isLast, onPress }) {
  return (
    <TouchableOpacity style={[styles.controlItem, isLast && styles.controlItemLast]} onPress={onPress}>
      <View style={styles.controlLeft}>
        <MaterialCommunityIcons name={icon} size={22} color={COLORS.white} />
        <Text style={styles.controlLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentArea: {
    flex: 1,
    position: 'relative',
  },
  flex: {
    flex: 1,
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
    borderRadius: 12,
    backgroundColor: COLORS.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 24,
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
  jobCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  deleteJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteJobButtonDisabled: {
    opacity: 0.7,
  },
  deleteJobButtonText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
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
  formCard: {
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
  postActions: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: '#001a33',
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryPostButton: {
    marginTop: 12,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  secondaryPostButtonDisabled: {
    opacity: 0.7,
  },
  secondaryPostButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  draftText: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 16,
    fontWeight: '500',
  },
  listHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  inlineDeleteButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inlineDeleteButtonDisabled: {
    opacity: 0.7,
  },
  inlineDeleteButtonText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  backToJobs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backToJobsText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  applicantsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  searchSection: {
    padding: 20,
    paddingBottom: 8,
  },
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
  },
  candidateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  candidateName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  candidateRole: {
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  candidateStatus: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  profileHero: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 24,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  companyLogoContainerMain: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: '#8AB4F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#001a33',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  metricsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.outline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTextContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  metricIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
  },
  cardBody: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: 20,
  },
  highlightsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F3FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  controlCard: {
    backgroundColor: '#001d3d',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  controlHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 24,
  },
  controlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  controlItemLast: {
    borderBottomWidth: 0,
  },
  controlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
