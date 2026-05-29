import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getSavedJobs,
  removeSavedJob,
  saveJob,
} from '../utils/storage';
import SidebarMenu from '../components/SidebarMenu';
import {
  searchJobsFromList,
  subscribeToOpenJobs,
} from '../utils/jobsFirestore';

const { width } = Dimensions.get('window');

// Design Tokens (Professional Velocity)
const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainer: '#e2e7f9',
  surfaceContainerHigh: '#d4dbf4',
  onSurface: '#1a365d',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#00a8e1',
  accentYellow: '#f9b208',
  secondaryContainer: '#e2e7f9',
  onSecondaryContainer: '#1a365d',
};

const JobSeekerHome = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [savedJobs, setSavedJobs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const hydrateSavedJobs = async () => {
      const storedSavedJobs = await getSavedJobs();

      if (isMounted) {
        setSavedJobs(storedSavedJobs);
      }
    };

    hydrateSavedJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOpenJobs(
      (nextJobs) => setJobs(nextJobs),
      (error) => console.error('Home jobs subscription error', error),
    );

    return unsubscribe;
  }, []);

  const savedJobIds = useMemo(() => new Set(savedJobs.map((job) => job.id)), [savedJobs]);
  const featuredJob = jobs[0] ?? null;
  const displayedJobs = useMemo(() => {
    const fallbackJobs = jobs.slice(1, 7).length ? jobs.slice(1, 7) : jobs;
    const normalizedQuery = search.trim();
    if (!normalizedQuery) {
      return fallbackJobs;
    }

    const matches = searchJobsFromList(jobs, normalizedQuery);
    return matches.length ? matches.slice(0, 6) : fallbackJobs;
  }, [jobs, search]);

  const getJobId = (job) => job.id ?? [job.role, job.company, job.location].join('|').toLowerCase();

  const handleToggleSaveJob = async (job) => {
    const jobId = getJobId(job);
    const nextSavedJobs = savedJobIds.has(jobId)
      ? await removeSavedJob(jobId)
      : await saveJob(job);

    setSavedJobs(nextSavedJobs);
  };

  const handleRemoveSavedJob = async (jobId) => {
    const nextSavedJobs = await removeSavedJob(jobId);
    setSavedJobs(nextSavedJobs);
  };

  const handleOpenSidebar = () => setSidebarOpen(true);
  const handleCloseSidebar = () => setSidebarOpen(false);

  const navigateFromSidebar = (screenName) => {
    handleCloseSidebar();
    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.container}>
      <SidebarMenu
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        navigation={navigation}
        activeRoute="Home"
        onItemPress={(item) => navigateFromSidebar(item.route)}
      />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenSidebar}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
          <Text style={styles.logoText}>Career Go</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="notifications-outline" size={4} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for jobs, companies, or keywords"
              placeholderTextColor={COLORS.secondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => navigation.navigate('Search')}>
            <Text style={styles.filterButtonText}>Find Jobs</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Opportunities */}
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
              <View>
                <Text style={styles.featuredRole}>{featuredJob?.role ?? 'Senior Product Designer'}</Text>
              <Text style={styles.featuredCompany}>
                  {featuredJob?.company ?? 'No company yet'} • {featuredJob?.location ?? 'No location yet'}
              </Text>
              </View>
            </View>
            <View style={styles.tagRow}>
              {(featuredJob?.tags ?? ['FULL-TIME', 'REMOTE FRIENDLY']).slice(0, 2).map((tag) => (
                <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
              ))}
            </View>
            <View style={styles.featuredFooter}>
              <Text style={styles.salaryText}>{featuredJob?.salary ?? 'No salary yet'}</Text>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => featuredJob && navigation.navigate('JobDetails', { job: featuredJob })}
              >
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Jobs Near You */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.sectionTitle}>Jobs Near You</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>124 new</Text></View>
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
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => navigation.navigate('JobDetails', { job })}
            >
              <View style={styles.jobCardHeader}>
                <View style={[styles.jobIconContainer, { backgroundColor: job.color }]}>
                  <MaterialCommunityIcons name={job.icon} size={20} color={COLORS.white} />
                </View>
                <TouchableOpacity onPress={() => handleToggleSaveJob(job)}>
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
                <TouchableOpacity style={styles.detailsLink} onPress={() => navigation.navigate('JobDetails', { job })}>
                  <Text style={styles.detailsLinkText}>Details</Text>
                  <MaterialCommunityIcons name="arrow-right" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Premium Banner */}
        <View style={styles.premiumBanner}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop' }}
            style={styles.premiumImage}
          />
          <View style={styles.premiumContent}>
            <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>PREMIUM</Text></View>
            <Text style={styles.premiumTitle}>Stand out with AI-powered resume analysis</Text>
            <Text style={styles.premiumDescription}>Our premium members get 3x more recruiter views with tailored suggestions for their job .</Text>
            <TouchableOpacity style={styles.premiumButton}>
              <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <MaterialCommunityIcons name="pencil-outline" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive} onPress={() => navigation.navigate('Home')}>
          <MaterialCommunityIcons name="home" size={24} color={COLORS.onSecondaryContainer} />
          <Text style={styles.navLabelActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Search')}>
          <MaterialCommunityIcons name="magnify" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Application')}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Apps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <MaterialCommunityIcons name="account-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  scrollContent: {
    paddingBottom: 100,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
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
  paginationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sidebarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 24, 48, 0.28)',
    zIndex: 20,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.outline,
    paddingTop: 56,
    paddingHorizontal: 18,
    zIndex: 30,
    transform: [{ translateX: -280 }],
  },
  sidebarOpen: {
    transform: [{ translateX: 0 }],
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sidebarItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
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
    gap: 8,
    marginBottom: 20,
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
  savedJobMainInfo: {
    flex: 1,
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
    bottom: 90,
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
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  navLabelActive: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '800',
  },
});

export default JobSeekerHome;
