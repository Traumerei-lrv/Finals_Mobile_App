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
import { auth } from '../firebase';
import BottomNav, { BOTTOM_NAV_BASE_HEIGHT } from '../components/BottomNav';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import SidebarMenu from '../components/SidebarMenu';
import {
  clearRecentSearches,
  getRecentSearches,
  getSavedJobs,
  removeSavedJob,
  saveJob,
  saveRecentSearch,
} from '../utils/storage';
import { buildProfileAvatarUrl } from '../utils/imageSources';
import {
  archiveApplicationForApplicant,
  mapApplicationToJobSeekerCard,
  subscribeToApplicantApplications,
} from '../utils/applicationsFirestore';
import {
  searchJobsFromList,
  subscribeToOpenJobs,
} from '../utils/jobsFirestore';
import { FEATURED_HOME_JOB, SEARCH_RECOMMENDED_JOBS } from '../data/jobs';
import { useAuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const DEFAULT_RECENT_SEARCHES = ['Product Designer', 'Remote', 'Google'];
const MAIN_TABS = ['home', 'search', 'applications', 'profile'];
const APPLICATION_TABS = ['All', 'Active', 'Interviews', 'Archive'];

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
  statusInterview: '#8AB4F8',
  statusReview: '#e2e7f9',
  statusDeclined: '#FEE2E2',
  statusDeclinedText: '#B91C1C',
  statusWithdrawn: '#FFF1F2',
  statusWithdrawnText: '#BE123C',
  error: '#B91C1C',
  tagBg: '#E2E7F9',
};

function normalizeTab(value) {
  return MAIN_TABS.includes(value) ? value : 'home';
}

function getTabFromRoute(route) {
  if (route?.params?.tab) {
    return normalizeTab(route.params.tab);
  }

  if (route?.name === 'Search') {
    return 'search';
  }

  if (route?.name === 'Application') {
    return 'applications';
  }

  if (route?.name === 'Profile') {
    return 'profile';
  }

  return 'home';
}

export default function JobSeekerDashboard({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const bottomNavPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 12);
  const bottomNavHeight = BOTTOM_NAV_BASE_HEIGHT + bottomNavPadding;
  const { user, userProfile } = useAuthContext();
  const [activeTab, setActiveTab] = useState(() => getTabFromRoute(route));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [homeSearch, setHomeSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(DEFAULT_RECENT_SEARCHES);
  const [selectedApplicationJob, setSelectedApplicationJob] = useState(null);
  const [applicationTab, setApplicationTab] = useState('All');
  const [submittedApplications, setSubmittedApplications] = useState([]);
  const [pendingArchiveIds, setPendingArchiveIds] = useState([]);
  const [profile, setProfile] = useState({
    fullName: 'Career Go User',
    headline: 'Job Seeker',
    location: 'Location not set',
    about: 'Tell recruiters about your experience and goals.',
    skills: ['UX DESIGN', 'REACT NATIVE', 'FIGMA', 'LEADERSHIP', 'SYSTEMS THINKING'],
  });
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    const nextTab = getTabFromRoute(route);
    setActiveTab(nextTab);

    if (typeof route?.params?.query === 'string') {
      setSearchQuery(route.params.query);
    }

    if (typeof route?.params?.applicationTab === 'string') {
      setApplicationTab(route.params.applicationTab);
    }
  }, [route?.params?.applicationTab, route?.params?.query, route?.params?.tab]);

  useEffect(() => {
    const unsubscribe = subscribeToOpenJobs(
      (nextJobs) => setJobs(nextJobs),
      (error) => console.error('Job seeker dashboard jobs subscription error', error),
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateSavedJobs = async () => {
      const storedSavedJobs = await getSavedJobs();
      if (isMounted) {
        setSavedJobs(storedSavedJobs);
      }
    };

    const hydrateRecentSearches = async () => {
      const storedSearches = await getRecentSearches();
      if (isMounted) {
        setRecentSearches(storedSearches.length ? storedSearches : DEFAULT_RECENT_SEARCHES);
      }
    };

    void hydrateSavedJobs();
    void hydrateRecentSearches();

    const focusUnsubscribe = navigation.addListener('focus', () => {
      void hydrateSavedJobs();
      void hydrateRecentSearches();
    });

    return () => {
      isMounted = false;
      focusUnsubscribe();
    };
  }, [navigation]);

  useEffect(() => {
    const applicantId = auth.currentUser?.uid ?? null;
    const unsubscribe = subscribeToApplicantApplications({
      applicantId,
      onData: (applications) => {
        setSubmittedApplications(applications.map(mapApplicationToJobSeekerCard));
      },
      onError: (error) => console.error('Job seeker dashboard applications subscription error', error),
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const displayName =
      userProfile?.fullName ||
      user?.displayName ||
      user?.email?.split('@')[0] ||
      'Career Go User';

    setProfile((prev) => ({
      ...prev,
      fullName: displayName,
      headline: userProfile?.headline || prev.headline || 'Job Seeker',
      location: userProfile?.location || prev.location || 'Location not set',
      about: userProfile?.about || prev.about || 'Tell recruiters about your experience and goals.',
      skills: Array.isArray(userProfile?.skills) && userProfile.skills.length ? userProfile.skills : prev.skills,
    }));
  }, [user?.displayName, user?.email, userProfile]);

  const savedJobIds = useMemo(() => new Set(savedJobs.map((job) => job.id)), [savedJobs]);
  const allApplications = useMemo(
    () => submittedApplications.filter((application) => !pendingArchiveIds.includes(application.id)),
    [pendingArchiveIds, submittedApplications],
  );
  const appliedCount = allApplications.length;
  const savedCount = savedJobs.length;
  const avatarSource = useMemo(
    () => ({ uri: buildProfileAvatarUrl(profile.fullName || 'Career Go User') }),
    [profile.fullName],
  );
  const featuredJob = jobs[0] ?? FEATURED_HOME_JOB;
  const displayedJobs = useMemo(() => {
    const fallbackJobs = jobs.slice(1, 7).length ? jobs.slice(1, 7) : jobs;
    const normalizedQuery = homeSearch.trim();
    if (!normalizedQuery) {
      return fallbackJobs;
    }

    const matches = searchJobsFromList(jobs, normalizedQuery);
    return matches.length ? matches.slice(0, 6) : fallbackJobs;
  }, [homeSearch, jobs]);
  const searchSourceJobs = jobs.length ? jobs : SEARCH_RECOMMENDED_JOBS;
  const recommendedJobs = useMemo(() => {
    if (!searchQuery.trim()) {
      return searchSourceJobs.slice(0, 9);
    }

    const results = searchJobsFromList(searchSourceJobs, searchQuery);
    return results.length ? results : searchSourceJobs.slice(0, 9);
  }, [searchQuery, searchSourceJobs]);
  const filteredApplications = useMemo(
    () =>
      allApplications.filter((application) => {
        if (applicationTab === 'All') return true;
        if (applicationTab === 'Active') return ['applied', 'review', 'offer'].includes(application.statusType);
        if (applicationTab === 'Interviews') return application.statusType === 'interview';
        if (applicationTab === 'Archive') {
          return application.statusType === 'declined' || application.statusType === 'withdrawn';
        }
        return true;
      }),
    [allApplications, applicationTab],
  );

  const getJobId = (job) => job.id ?? [job.role, job.company, job.location].join('|').toLowerCase();

  const handleOpenSidebar = () => setSidebarOpen(true);
  const handleCloseSidebar = () => setSidebarOpen(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'applications') {
      setSelectedApplicationJob(null);
    }
  };

  const handleSidebarItemPress = (item) => {
    handleCloseSidebar();
    if (item.route === 'JobSeekerDashboard' && item.params?.tab) {
      handleTabChange(item.params.tab);
      return;
    }
    navigation.navigate(item.route, item.params);
  };

  const handleToggleSaveJob = async (job) => {
    const jobId = getJobId(job);
    const nextSavedJobs = savedJobIds.has(jobId)
      ? await removeSavedJob(jobId)
      : await saveJob(job);

    setSavedJobs(nextSavedJobs);
  };

  const handleSearchSubmit = async () => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      return;
    }

    const nextRecentSearches = await saveRecentSearch(normalizedQuery);
    setRecentSearches(nextRecentSearches);
  };

  const handleRecentSearchPress = async (query) => {
    setSearchQuery(query);
    const nextRecentSearches = await saveRecentSearch(query);
    setRecentSearches(nextRecentSearches);
  };

  const handleClearAllRecentSearches = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const handleFindJobsFromHome = async () => {
    const normalizedQuery = homeSearch.trim();
    if (normalizedQuery) {
      const nextRecentSearches = await saveRecentSearch(normalizedQuery);
      setRecentSearches(nextRecentSearches);
      setSearchQuery(normalizedQuery);
    }
    handleTabChange('search');
  };

  const handleDeleteArchivedApplication = async (application) => {
    setPendingArchiveIds((prev) => (prev.includes(application.id) ? prev : [...prev, application.id]));
    try {
      await archiveApplicationForApplicant({ applicationId: application.id });
    } catch (error) {
      console.error('Archive applicant application failed', error);
      setPendingArchiveIds((prev) => prev.filter((id) => id !== application.id));
      Alert.alert('Delete failed', 'Unable to delete this application right now. Please try again.');
    }
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setLogoutLoading(false);
      setLogoutModalVisible(false);
    }
  };

  if (activeTab === 'applications' && selectedApplicationJob) {
    return (
      <ApplicationDetailView
        job={selectedApplicationJob}
        onBack={() => setSelectedApplicationJob(null)}
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
        activeRoute={activeTab}
        onItemPress={handleSidebarItemPress}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 2 }]}>
        <TouchableOpacity onPress={handleOpenSidebar}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.logoText}>Career Go</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        <KeyboardAwareScrollView
          style={styles.flex}
          enableOnAndroid
          enableAutomaticScroll
          extraHeight={Platform.OS === 'ios' ? 24 : 112}
          extraScrollHeight={Platform.OS === 'ios' ? 24 : 112}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'home' ? (
            <HomeTab
              homeSearch={homeSearch}
              setHomeSearch={setHomeSearch}
              featuredJob={featuredJob}
              displayedJobs={displayedJobs}
              savedJobIds={savedJobIds}
              getJobId={getJobId}
              onFindJobs={handleFindJobsFromHome}
              onToggleSaveJob={handleToggleSaveJob}
              onOpenJob={(job) => navigation.navigate('JobDetails', { job })}
            />
          ) : null}

          {activeTab === 'search' ? (
            <SearchTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              recentSearches={recentSearches}
              recommendedJobs={recommendedJobs}
              savedJobIds={savedJobIds}
              getJobId={getJobId}
              onSearchSubmit={handleSearchSubmit}
              onClearRecentSearches={handleClearAllRecentSearches}
              onRecentSearchPress={handleRecentSearchPress}
              onToggleSaveJob={handleToggleSaveJob}
              onOpenJob={(job) => navigation.navigate('JobDetails', { job })}
            />
          ) : null}

          {activeTab === 'applications' ? (
            <ApplicationsTab
              activeTab={applicationTab}
              applications={filteredApplications}
              onTabChange={setApplicationTab}
              onOpenJob={setSelectedApplicationJob}
              onDeleteApplication={handleDeleteArchivedApplication}
            />
          ) : null}

          {activeTab === 'profile' ? (
            <ProfileTab
              profile={profile}
              avatarSource={avatarSource}
              appliedCount={appliedCount}
              savedCount={savedCount}
              navigation={navigation}
              onLogout={() => setLogoutModalVisible(true)}
            />
          ) : null}
        </KeyboardAwareScrollView>

        {activeTab === 'home' ? (
          <TouchableOpacity style={[styles.fab, { bottom: bottomNavHeight + 14 }]}>
            <MaterialCommunityIcons name="pencil-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        ) : null}
      </View>

        <BottomNav
          navigation={navigation}
          activeRoute={activeTab}
          onTabPress={handleTabChange}
        />

      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={logoutLoading}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleLogoutConfirm}
      />
    </SafeAreaView>
  );
}

function HomeTab({
  homeSearch,
  setHomeSearch,
  featuredJob,
  displayedJobs,
  savedJobIds,
  getJobId,
  onFindJobs,
  onToggleSaveJob,
  onOpenJob,
}) {
  return (
    <>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for jobs, companies, or keywords"
            placeholderTextColor={COLORS.secondary}
            value={homeSearch}
            onChangeText={setHomeSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={onFindJobs}>
          <Text style={styles.filterButtonText}>Find Jobs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Featured Opportunities</Text>
          <Text style={styles.sectionSubtitle}>Top picks for your professional growth</Text>
        </View>
        <View style={styles.paginationButtons}>
          <TouchableOpacity style={styles.pageButton}>
            <MaterialCommunityIcons name="chevron-left" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.pageButton}>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredList}>
        <View style={styles.featuredCard}>
          <View style={styles.featuredHeader}>
            <View style={styles.companyLogoPlaceholder}>
              <MaterialCommunityIcons name={featuredJob?.icon ?? 'office-building'} size={24} color={COLORS.white} />
            </View>
            <View style={styles.featuredTextWrap}>
              <Text style={styles.featuredRole}>{featuredJob?.role ?? 'No featured job yet'}</Text>
              <Text style={styles.featuredCompany}>
                {featuredJob?.company ?? 'No company yet'} • {featuredJob?.location ?? 'No location yet'}
              </Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            {(featuredJob?.tags ?? ['FULL-TIME', 'REMOTE FRIENDLY']).slice(0, 2).map((tag, index) => (
              <View key={`${tag}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.featuredFooter}>
            <Text style={styles.salaryText}>{featuredJob?.salary ?? 'No salary yet'}</Text>
            <TouchableOpacity style={styles.applyButton} onPress={() => featuredJob && onOpenJob(featuredJob)}>
              <Text style={styles.applyButtonText}>Apply Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.sectionHeader, { marginTop: 32 }]}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Jobs Near You</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>124 new</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.mapToggle}>
          <MaterialCommunityIcons name="map-outline" size={18} color={COLORS.primary} />
          <Text style={styles.mapToggleText}>Toggle Map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.jobList}>
        {!displayedJobs.length ? (
          <View style={styles.emptyJobsCard}>
            <Text style={styles.emptyJobsTitle}>No jobs posted yet</Text>
            <Text style={styles.emptyJobsSubtitle}>Recruiter job postings will appear here in real time.</Text>
          </View>
        ) : null}
        {displayedJobs.map((job) => (
          <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => onOpenJob(job)}>
            <View style={styles.jobCardHeader}>
              <View style={[styles.jobIconContainer, { backgroundColor: job.color || COLORS.primary }]}>
                <MaterialCommunityIcons name={job.icon || 'office-building'} size={20} color={COLORS.white} />
              </View>
              <TouchableOpacity onPress={() => onToggleSaveJob(job)}>
                <MaterialCommunityIcons
                  name={savedJobIds.has(getJobId(job)) ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={savedJobIds.has(getJobId(job)) ? COLORS.primary : COLORS.secondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.jobRole}>{job.role}</Text>
            <Text style={styles.jobCompany}>{job.company} • {job.location}</Text>
            <View style={styles.tagRow}>
              <View style={styles.jobTag}><Text style={styles.jobTagText}>{job.salary}</Text></View>
              <View style={styles.jobTag}><Text style={styles.jobTagText}>{job.type}</Text></View>
            </View>
            <View style={styles.jobCardFooter}>
              <Text style={styles.postedText}>{job.posted}</Text>
              <TouchableOpacity style={styles.detailsLink} onPress={() => onOpenJob(job)}>
                <Text style={styles.detailsLinkText}>Details</Text>
                <MaterialCommunityIcons name="arrow-right" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.premiumBanner}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop' }}
          style={styles.premiumImage}
        />
        <View style={styles.premiumContent}>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>
          <Text style={styles.premiumTitle}>Stand out with AI-powered resume analysis</Text>
          <Text style={styles.premiumDescription}>
            Our premium members get 3x more recruiter views with tailored suggestions for their job.
          </Text>
          <TouchableOpacity style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

function SearchTab({
  searchQuery,
  setSearchQuery,
  recentSearches,
  recommendedJobs,
  savedJobIds,
  getJobId,
  onSearchSubmit,
  onClearRecentSearches,
  onRecentSearchPress,
  onToggleSaveJob,
  onOpenJob,
}) {
  return (
    <>
      <View style={styles.searchHeader}>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search job titles or companies"
            placeholderTextColor={COLORS.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={onSearchSubmit}
          />
        </View>
        <TouchableOpacity style={styles.filterIconButton}>
          <MaterialCommunityIcons name="tune-variant" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Searches</Text>
        <TouchableOpacity onPress={onClearRecentSearches}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {recentSearches.map((chip) => (
          <TouchableOpacity key={chip} style={styles.chip} onPress={() => onRecentSearchPress(chip)}>
            <Text style={styles.chipText}>{chip}</Text>
            <MaterialCommunityIcons name="close" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        ))}
        {!recentSearches.length ? <Text style={styles.emptyRecentSearches}>No recent searches yet.</Text> : null}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular Categories</Text>
      </View>
      <View style={styles.categoryGrid}>
        <CategoryCard icon="palette-outline" label="Design" count="1.2k+ Jobs" />
        <CategoryCard icon="code-tags" label="Engineering" count="2.5k+ Jobs" />
        <CategoryCard icon="megaphone-outline" label="Marketing" count="800+ Jobs" />
        <CategoryCard icon="trending-up" label="Sales" count="1.5k+ Jobs" />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <Text style={styles.sectionSubtitle}>Based on your recent activity</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.jobList}>
        {recommendedJobs.map((job) => (
          <SearchJobCard
            key={job.id}
            job={job}
            isSaved={savedJobIds.has(getJobId(job))}
            onToggleSave={() => onToggleSaveJob(job)}
            onPress={() => onOpenJob(job)}
          />
        ))}
      </View>
    </>
  );
}

function ApplicationsTab({ activeTab, applications, onTabChange, onOpenJob, onDeleteApplication }) {
  return (
    <>
      <View style={styles.appSectionHeader}>
        <Text style={styles.sectionTitle}>My Applications</Text>
        <Text style={styles.sectionSubtitle}>Track your current and archived job applications</Text>
      </View>

      <View style={styles.tabBar}>
        {APPLICATION_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => onTabChange(tab)}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.applicationList}>
        {applications.map((application) => (
          <ApplicationCard
            key={application.id}
            {...application}
            onPress={() => onOpenJob(application)}
            onDelete={
              application.statusType === 'withdrawn' || application.statusType === 'declined'
                ? () => onDeleteApplication(application)
                : null
            }
          />
        ))}
        {!applications.length ? (
          <View style={styles.emptyJobsCard}>
            <Text style={styles.emptyJobsTitle}>No applications in this section</Text>
            <Text style={styles.emptyJobsSubtitle}>Your applications will appear here as soon as you apply.</Text>
          </View>
        ) : null}
      </View>
    </>
  );
}

function ProfileTab({ profile, avatarSource, appliedCount, savedCount, navigation, onLogout }) {
  return (
    <>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image source={avatarSource} style={styles.avatar} />
          <TouchableOpacity style={styles.editAvatarButton}>
            <MaterialCommunityIcons name="pencil" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{profile.fullName}</Text>
        <Text style={styles.userRole}>{profile.headline}</Text>
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.secondary} />
          <Text style={styles.locationText}>{profile.location}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { flex: 1.5 }]}>
          <View style={styles.statIconContainer}>
            <MaterialCommunityIcons name="eye-outline" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.statValue}>1.2k</Text>
            <Text style={styles.statLabel}>Profile Views</Text>
          </View>
        </View>
        <View style={styles.statCardSmallRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{appliedCount}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{savedCount}</Text>
            <Text style={styles.statLabel}>Saved Jobs</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <TouchableOpacity>
            <MaterialCommunityIcons name="information-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionBody}>{profile.about}</Text>
      </View>

      <Text style={styles.listSectionTitle}>Experience</Text>
      <ExperienceCard title="Lead Designer" duration="Present" company="Google • Full-time" date="Aug 2021 - Now • 2 yrs 8 mos" />
      <ExperienceCard title="UX Designer" duration="3 yrs" company="Airbnb • Contract" date="Jan 2018 - Jul 2021" />

      <Text style={styles.listSectionTitle}>Skills</Text>
      <View style={styles.skillsCloud}>
        {profile.skills.map((skill, index) => (
          <View
            key={`${skill}-${index}`}
            style={[styles.skillTag, skill === 'SYSTEMS THINKING' ? styles.skillTagSecondary : styles.skillTagPrimary]}
          >
            <Text
              style={[
                styles.skillTagText,
                skill === 'SYSTEMS THINKING' ? styles.skillTagTextSecondary : styles.skillTagTextPrimary,
              ]}
            >
              {skill}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actionLinksContainer}>
        <ActionLink
          icon="account-edit-outline"
          label="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <ActionLink
          icon="file-document-outline"
          label="Resume Settings"
          onPress={() => navigation.navigate('ResumeSettings')}
        />
        <ActionLink
          icon="shield-outline"
          label="Privacy"
          onPress={() => navigation.navigate('PrivacySettings')}
        />
        <ActionLink
          icon="logout"
          label="Logout"
          danger
          isLast
          onPress={onLogout}
        />
      </View>
    </>
  );
}

function CategoryCard({ icon, label, count }) {
  return (
    <TouchableOpacity style={styles.categoryCard}>
      <View style={styles.categoryIconContainer}>
        <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
      </View>
      <View>
        <Text style={styles.categoryLabel}>{label}</Text>
        <Text style={styles.categoryCount}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SearchJobCard({ job, isSaved, onToggleSave, onPress }) {
  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress}>
      <View style={styles.jobCardTop}>
        <View style={styles.companyLogoContainer}>
          <MaterialCommunityIcons name="office-building" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.jobMainInfo}>
          <View style={styles.jobHeaderRow}>
            <Text style={styles.jobRole}>{job.role}</Text>
            <TouchableOpacity onPress={onToggleSave}>
              <MaterialCommunityIcons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? COLORS.primary : COLORS.secondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.jobCompanyLocation}>{job.company} • {job.location}</Text>
        </View>
      </View>

      <View style={styles.tagRow}>
        {[job.type, job.salary, ...(job.tags ?? [])].filter(Boolean).slice(0, 3).map((tag, index) => (
          <View key={`${tag}-${index}`} style={styles.jobTag}>
            <Text style={styles.jobTagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.jobDivider} />

      <View style={styles.jobCardFooter}>
        <Text style={styles.postedText}>{job.posted}</Text>
        <View style={styles.applicantAvatars}>
          <View style={styles.avatarCircle} />
          <View style={[styles.avatarCircle, { marginLeft: -8 }]} />
          <View style={[styles.avatarCircleActive, { marginLeft: -8 }]}>
            <Text style={styles.avatarPlus}>+12</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ExperienceCard({ title, duration, company, date }) {
  return (
    <View style={styles.jobItem}>
      <View style={styles.jobItemIconContainer}>
        <MaterialCommunityIcons name="office-building" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.jobInfo}>
        <View style={styles.jobInfoHeader}>
          <Text style={styles.jobTitle}>{title}</Text>
          <Text style={styles.jobDuration}>{duration}</Text>
        </View>
        <Text style={styles.jobCompany}>{company}</Text>
        <Text style={styles.jobDate}>{date}</Text>
      </View>
    </View>
  );
}

function ActionLink({ icon, label, danger = false, isLast = false, onPress }) {
  return (
    <TouchableOpacity style={[styles.actionLink, isLast && styles.actionLinkLast]} onPress={onPress}>
      <View style={styles.actionLinkLeft}>
        <MaterialCommunityIcons name={icon} size={22} color={danger ? '#D32F2F' : COLORS.primary} />
        <Text style={[styles.actionLinkText, danger && styles.actionLinkTextDanger]}>{label}</Text>
      </View>
      {!danger ? <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.secondary} /> : null}
    </TouchableOpacity>
  );
}

function ApplicationCard({
  role,
  company,
  date,
  status,
  statusType,
  step,
  progress,
  progressColor,
  icon,
  onPress,
  onDelete,
}) {
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

      <View style={styles.viewDetailRow}>
        {typeof onDelete === 'function' ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(event) => {
              event?.stopPropagation?.();
              onDelete();
            }}
          >
            <MaterialCommunityIcons name="delete-outline" size={16} color={COLORS.error} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.viewDetailText}>View job details</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.accentBlue} />
      </View>
    </TouchableOpacity>
  );
}

function ApplicationDetailView({ job, onBack, navigation }) {
  const [activeTab, setActiveTab] = useState('Description');
  const tabs = ['Description', 'Company', 'Reviews'];

  let statusStyle = detailStyles.statusReview;
  let statusTextStyle = detailStyles.statusReviewText;
  if (job.statusType === 'interview') {
    statusStyle = detailStyles.statusInterview;
    statusTextStyle = detailStyles.statusInterviewText;
  } else if (job.statusType === 'declined') {
    statusStyle = detailStyles.statusDeclined;
    statusTextStyle = detailStyles.statusDeclinedText;
  } else if (job.statusType === 'withdrawn') {
    statusStyle = detailStyles.statusWithdrawn;
    statusTextStyle = detailStyles.statusWithdrawnText;
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={detailStyles.scrollContent}>
        <View style={detailStyles.heroSection}>
          <View style={detailStyles.companyLogoContainer}>
            <MaterialCommunityIcons name={job.icon} size={36} color={COLORS.primary} />
          </View>
          <Text style={detailStyles.jobTitle}>{job.role}</Text>
          <Text style={detailStyles.companyInfo}>{job.company} · {job.location}</Text>

          <View style={detailStyles.tagRow}>
            {(job.tags ?? []).map((tag, index) => (
              <View key={`${tag}-${index}`} style={detailStyles.tag}>
                <Text style={detailStyles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <View style={[detailStyles.statusBadgeHero, statusStyle]}>
            <Text style={[detailStyles.statusBadgeText, statusTextStyle]}>{job.status}</Text>
          </View>

          <View style={detailStyles.salaryContainer}>
            <Text style={detailStyles.salaryAmount}>{job.salary}</Text>
            <Text style={detailStyles.salaryPeriod}> {job.salaryPeriod}</Text>
          </View>
        </View>

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

        <View style={detailStyles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[detailStyles.tabItem, activeTab === tab && detailStyles.tabItemActive]}
            >
              <Text style={[detailStyles.tabText, activeTab === tab && detailStyles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={detailStyles.contentPadding}>
          {activeTab === 'Description' ? (
            <>
              <Text style={detailStyles.sectionTitle}>About the role</Text>
              <Text style={detailStyles.sectionBody}>{job.about}</Text>

              <Text style={detailStyles.sectionTitle}>Responsibilities</Text>
              {(job.responsibilities ?? []).map((item, index) => (
                <BulletItem key={`resp-${index}`} text={item} />
              ))}

              <Text style={detailStyles.sectionTitle}>Qualifications</Text>
              {(job.qualifications ?? []).map((item, index) => (
                <CheckItem key={`qual-${index}`} text={item} />
              ))}
            </>
          ) : null}
          {activeTab === 'Company' ? (
            <Text style={detailStyles.sectionBody}>Company information coming soon...</Text>
          ) : null}
          {activeTab === 'Reviews' ? (
            <Text style={detailStyles.sectionBody}>Reviews coming soon...</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={detailStyles.bottomBar}>
        <TouchableOpacity style={detailStyles.saveButton}>
          <MaterialCommunityIcons name="bookmark-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        {!ctaConfig.disabled ? (
          <TouchableOpacity
            style={detailStyles.applyButton}
            onPress={() => navigation.navigate('TrackApplication', { job })}
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
}

function BulletItem({ text }) {
  return (
    <View style={detailStyles.listItem}>
      <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.accentBlue} style={detailStyles.listIcon} />
      <Text style={detailStyles.listItemText}>{text}</Text>
    </View>
  );
}

function CheckItem({ text }) {
  return (
    <View style={detailStyles.listItem}>
      <MaterialCommunityIcons name="check-decagram-outline" size={18} color={COLORS.secondary} style={detailStyles.listIcon} />
      <Text style={detailStyles.listItemText}>{text}</Text>
    </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  searchContainer: {
    padding: 20,
    flexDirection: 'row',
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
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
    color: COLORS.onSurface,
  },
  filterButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  filterIconButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  appSectionHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  featuredList: {
    paddingLeft: 20,
  },
  featuredCard: {
    width: width * 0.8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 20,
    marginRight: 16,
  },
  featuredHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  featuredTextWrap: {
    flex: 1,
  },
  companyLogoPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredRole: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  featuredCompany: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tagText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
  },
  applyButton: {
    backgroundColor: '#8AB4F8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  applyButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#E2E7F9',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  mapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapToggleText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  jobList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  emptyJobsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 16,
    marginBottom: 4,
  },
  emptyJobsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  emptyJobsSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 16,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobRole: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 12,
  },
  jobTag: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outline,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  jobTagText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline,
  },
  postedText: {
    fontSize: 11,
    color: COLORS.secondary,
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsLinkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  premiumBanner: {
    margin: 20,
    backgroundColor: '#EBF1FF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumImage: {
    width: '100%',
    height: 180,
  },
  premiumContent: {
    padding: 20,
  },
  premiumBadge: {
    backgroundColor: '#8AB4F8',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  premiumBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 28,
    marginBottom: 12,
  },
  premiumDescription: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  premiumButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  premiumButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchHeader: {
    padding: 20,
    flexDirection: 'row',
    gap: 12,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chipRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E7F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyRecentSearches: {
    fontSize: 13,
    color: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#E2E7F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  categoryCount: {
    fontSize: 11,
    color: COLORS.secondary,
  },
  jobCardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  companyLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#F0F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobMainInfo: {
    flex: 1,
  },
  jobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobCompanyLocation: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  jobDivider: {
    height: 1,
    backgroundColor: COLORS.outline,
    marginBottom: 12,
  },
  applicantAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E7F9',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a365d',
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlus: {
    fontSize: 8,
    color: COLORS.white,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  tabLabelActive: {
    color: COLORS.white,
  },
  applicationList: {
    padding: 20,
    gap: 16,
  },
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
  cardHeaderLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  titleContainer: {
    flex: 1,
  },
  roleText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  companyText: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    maxWidth: 110,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusInterview: {
    backgroundColor: COLORS.statusInterview,
  },
  statusInterviewText: {
    color: COLORS.primary,
  },
  statusReview: {
    backgroundColor: COLORS.statusReview,
  },
  statusReviewText: {
    color: COLORS.primary,
  },
  statusDeclined: {
    backgroundColor: COLORS.statusDeclined,
  },
  statusDeclinedText: {
    color: COLORS.statusDeclinedText,
  },
  statusWithdrawn: {
    backgroundColor: COLORS.statusWithdrawn,
  },
  statusWithdrawnText: {
    color: COLORS.statusWithdrawnText,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressWrapper: {
    height: 8,
    width: '100%',
  },
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
  viewDetailText: {
    fontSize: 12,
    color: COLORS.accentBlue,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
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
  editAvatarButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  statsRow: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statCardSmallRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#E2E7F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  sectionBody: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 22,
  },
  listSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  jobItem: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    flexDirection: 'row',
    gap: 16,
  },
  jobItemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#E2E7F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobInfo: {
    flex: 1,
  },
  jobInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jobDuration: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  jobDate: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  skillsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  skillTagPrimary: {
    backgroundColor: '#E2E7F9',
  },
  skillTagSecondary: {
    backgroundColor: '#E5E7EB',
  },
  skillTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  skillTagTextPrimary: {
    color: COLORS.primary,
  },
  skillTagTextSecondary: {
    color: '#1F2937',
  },
  actionLinksContainer: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    overflow: 'hidden',
  },
  actionLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  actionLinkLast: {
    borderBottomWidth: 0,
  },
  actionLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionLinkTextDanger: {
    color: '#D32F2F',
  },
});

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
  statusInterview: { backgroundColor: COLORS.statusInterview },
  statusInterviewText: { color: COLORS.primary },
  statusReview: { backgroundColor: COLORS.statusReview },
  statusReviewText: { color: COLORS.primary },
  statusDeclined: { backgroundColor: COLORS.statusDeclined },
  statusDeclinedText: { color: COLORS.statusDeclinedText },
  statusWithdrawn: { backgroundColor: COLORS.statusWithdrawn },
  statusWithdrawnText: { color: COLORS.statusWithdrawnText },
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
