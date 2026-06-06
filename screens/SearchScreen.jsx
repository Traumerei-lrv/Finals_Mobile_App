import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  clearRecentSearches,
  getRecentSearches,
  getSavedJobs,
  removeSavedJob,
  saveJob,
  saveRecentSearch,
} from '../utils/storage';
import { SEARCH_RECOMMENDED_JOBS, searchJobs } from '../data/jobs';
import SidebarMenu from '../components/SidebarMenu';

const { width } = Dimensions.get('window');

const DEFAULT_RECENT_SEARCHES = ['Product Designer', 'Remote', 'Google'];

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
  secondaryContainer: '#e2e7f9',
  onSecondaryContainer: '#1a365d',
};

const SearchJobsScreen = ({navigation, route}) => {
  const [search, setSearch] = useState('');
  const [recentSearches, setRecentSearches] = useState(DEFAULT_RECENT_SEARCHES);
  const [savedJobs, setSavedJobs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route?.params?.query) {
      setSearch(String(route.params.query));
    }
  }, [route?.params?.query]);

  useEffect(() => {
    let isMounted = true;

    const hydrateRecentSearches = async () => {
      const storedSearches = await getRecentSearches();

      if (!isMounted) {
        return;
      }

      setRecentSearches(storedSearches.length ? storedSearches : DEFAULT_RECENT_SEARCHES);
    };

    hydrateRecentSearches();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateSavedJobs = async () => {
      const storedSavedJobs = await getSavedJobs();
      if (isMounted) {
        setSavedJobs(storedSavedJobs);
      }
    };

    void hydrateSavedJobs();
    const focusUnsubscribe = navigation.addListener('focus', () => {
      void hydrateSavedJobs();
    });

    return () => {
      isMounted = false;
      focusUnsubscribe();
    };
  }, [navigation]);

  const handleSearchSubmit = async () => {
    if (!search.trim()) {
      return;
    }

    const nextRecentSearches = await saveRecentSearch(search);
    setRecentSearches(nextRecentSearches);
    setSearch('');
  };

  const handleRecentSearchPress = async (query) => {
    setSearch(query);
    const nextRecentSearches = await saveRecentSearch(query);
    setRecentSearches(nextRecentSearches);
  };

  const handleClearAllRecentSearches = async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  };

  const getJobId = (job) => job.id ?? [job.role, job.company, job.location].join('|').toLowerCase();
  const savedJobIds = useMemo(() => new Set(savedJobs.map((job) => job.id)), [savedJobs]);
  const handleToggleSaveJob = async (job) => {
    const jobId = getJobId(job);
    const nextSavedJobs = savedJobIds.has(jobId)
      ? await removeSavedJob(jobId)
      : await saveJob(job);

    setSavedJobs(nextSavedJobs);
  };
  const handleOpenSidebar = () => setSidebarOpen(true);
  const handleCloseSidebar = () => setSidebarOpen(false);
  const navigateFromSidebar = (routeName) => {
    handleCloseSidebar();
    navigation.navigate(routeName);
  };

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    try {
      const [storedSearches, storedSavedJobs] = await Promise.all([
        getRecentSearches(),
        getSavedJobs(),
      ]);
      setRecentSearches(storedSearches.length ? storedSearches : DEFAULT_RECENT_SEARCHES);
      setSavedJobs(storedSavedJobs);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const recommendedJobs = useMemo(() => {
    if (!search.trim()) {
      return SEARCH_RECOMMENDED_JOBS.slice(0, 9);
    }

    const results = searchJobs(search);
    return results.length ? results : SEARCH_RECOMMENDED_JOBS.slice(0, 9);
  }, [search]);

  return (
    <SafeAreaView style={styles.container}>
      <SidebarMenu
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        navigation={navigation}
        activeRoute="Search"
        onItemPress={(item) => navigateFromSidebar(item.route)}
      />
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenSidebar}>  
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.logoText}>Career Go</Text>
        <View style={{ width: 24 }} />
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
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <View style={styles.searchInputWrapper}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search job titles or companies"
              placeholderTextColor={COLORS.secondary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={handleSearchSubmit}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialCommunityIcons name="tune-variant" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Recent Searches */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <TouchableOpacity onPress={handleClearAllRecentSearches}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {recentSearches.map((chip) => (
            <TouchableOpacity key={chip} style={styles.chip} onPress={() => handleRecentSearchPress(chip)}>
              <Text style={styles.chipText}>{chip}</Text>
              <MaterialCommunityIcons name="close" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          ))}
          {!recentSearches.length ? <Text style={styles.emptyRecentSearches}>No recent searches yet.</Text> : null}
        </ScrollView>

        {/* Popular Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
        </View>
        <View style={styles.categoryGrid}>
          <CategoryCard icon="palette-outline" label="Design" count="1.2k+ Jobs" />
          <CategoryCard icon="code-tags" label="Engineering" count="2.5k+ Jobs" />
          <CategoryCard icon="megaphone-outline" label="Marketing" count="800+ Jobs" />
          <CategoryCard icon="trending-up" label="Sales" count="1.5k+ Jobs" />
        </View>

        {/* Recommendations */}
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
            <JobCard
              key={job.id}
              role={job.role}
              company={job.company}
              location={job.location}
              tags={[job.type, job.salary, ...(job.tags ?? [])].filter(Boolean).slice(0, 3)}
              posted={job.posted}
              urgent={job.company === 'Google'}
              isSaved={savedJobIds.has(getJobId(job))}
              onToggleSave={() => handleToggleSaveJob(job)}
              onPress={() => navigation.navigate('JobDetails', { job })}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <MaterialCommunityIcons name="home-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive} onPress={() => navigation.navigate('Search')}>
          <View style={styles.activeNavIndicator}>
            <MaterialCommunityIcons name="magnify" size={24} color={COLORS.primary} />
            <Text style={styles.navLabelActive}>Search</Text>
          </View>
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

const CategoryCard = ({ icon, label, count }) => (
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

const JobCard = ({ role, company, location, tags, posted, urgent, applicants, isSaved, onToggleSave, onPress }) => (
  <TouchableOpacity style={styles.jobCard} onPress={onPress}>
    <View style={styles.jobCardTop}>
      <View style={styles.companyLogoContainer}>
        <MaterialCommunityIcons name="office-building" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.jobMainInfo}>
        <View style={styles.jobHeaderRow}>
          <Text style={styles.jobRole}>{role}</Text>
          <TouchableOpacity onPress={onToggleSave}>
            <MaterialCommunityIcons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? COLORS.primary : COLORS.secondary}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.jobCompanyLocation}>{company} • {location}</Text>
      </View>
    </View>
    
    <View style={styles.tagRow}>
      {tags.map((tag, i) => (
        <View key={i} style={styles.jobTag}>
          <Text style={styles.jobTagText}>{tag}</Text>
        </View>
      ))}
    </View>

    <View style={styles.jobDivider} />

    <View style={styles.jobCardFooter}>
      <Text style={styles.postedText}>{posted}</Text>
      {urgent ? (
        <View style={styles.urgentBadge}>
          <MaterialCommunityIcons name="lightning-bolt" size={14} color="#1a365d" />
          <Text style={styles.urgentText}>Urgent Hiring</Text>
        </View>
      ) : applicants ? (
        <Text style={styles.applicantsText}>{applicants}</Text>
      ) : (
        <View style={styles.applicantAvatars}>
          <View style={styles.avatarCircle} />
          <View style={[styles.avatarCircle, { marginLeft: -8 }]} />
          <View style={[styles.avatarCircleActive, { marginLeft: -8 }]}>
             <Text style={styles.avatarPlus}>+12</Text>
          </View>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

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
    backgroundColor: COLORS.white,
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
  searchHeader: {
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
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
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
  jobList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 16,
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
  jobRole: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jobCompanyLocation: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  jobTag: {
    backgroundColor: '#E2E7F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  jobTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jobDivider: {
    height: 1,
    backgroundColor: COLORS.outline,
    marginBottom: 12,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postedText: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  applicantsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
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
  },
  activeNavIndicator: {
    backgroundColor: '#8AB4F8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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

export default SearchJobsScreen;
