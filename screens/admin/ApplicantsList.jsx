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
import RecruiterBottomNav from '../../components/RecruiterBottomNav';
import { auth } from '../../firebase';
import {
  mapApplicationToRecruiterCard,
  subscribeToRecruiterApplications,
} from '../../utils/applicationsFirestore';

const { width } = Dimensions.get('window');

// Design Tokens (Professional Velocity - matching DS_2)
const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainer: '#e2e7f9',
  surfaceContainerLow: '#f0f3ff',
  onSurface: '#1a365d',
  onSurfaceVariant: '#5d7291',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#8AB4F8',
  statusApplied: '#E8F0FE',
  statusAppliedText: '#1a365d',
  statusInterview: '#FFF4E5',
  statusInterviewText: '#B45309',
  statusOffer: '#E6F4EA',
  statusOfferText: '#1E8E3E',
  statusScreened: '#F1F3F4',
  statusScreenedText: '#5F6368',
};

const ApplicantsListScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [applicants, setApplicants] = useState([]);

  useEffect(() => {
    const recruiterId = auth.currentUser?.uid ?? null;
    const unsubscribe = subscribeToRecruiterApplications({
      recruiterId,
      onData: (applications) => setApplicants(applications.map(mapApplicationToRecruiterCard)),
      onError: (error) => console.error('Applicants subscription error', error),
    });

    return unsubscribe;
  }, []);

  const filteredApplicants = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return applicants;

    return applicants.filter((item) =>
      [item.name, item.role, item.status].filter(Boolean).join(' ').toLowerCase().includes(keyword),
    );
  }, [applicants, search]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar - Synced with Recruiter Dashboard */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>JobFinder</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialCommunityIcons name="notifications-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.profileAvatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search & Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputWrapper}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.secondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search candidates by name..."
              placeholderTextColor={COLORS.secondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <MaterialCommunityIcons name="tune-variant" size={20} color={COLORS.white} style={styles.filterIcon} />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.title}>Applicants</Text>
          <Text style={styles.subtitle}>
            Reviewing {filteredApplicants.length} candidate{filteredApplicants.length === 1 ? '' : 's'} across your jobs.
          </Text>
        </View>

        {/* Applicants List */}
        <View style={styles.applicantsList}>
          {!filteredApplicants.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No applications yet</Text>
              <Text style={styles.emptySubtitle}>When jobseekers apply to your postings, they will appear here.</Text>
            </View>
          ) : null}
          {filteredApplicants.map((item) => (
            <TouchableOpacity key={item.id} style={styles.candidateCard}>
              <View style={styles.cardTop}>
                {item.placeholder ? (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialCommunityIcons name="account" size={32} color={COLORS.primary} />
                  </View>
                ) : (
                  <Image source={{ uri: item.avatar }} style={styles.candidateAvatar} />
                )}
                
                <View style={styles.candidateMainInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.candidateName}>{item.name}</Text>
                    <View style={[styles.statusBadge, getStatusStyle(item.statusType).badge]}>
                      <Text style={[styles.statusText, getStatusStyle(item.statusType).text]}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.candidateRole}>{item.role}</Text>
                  
                  <View style={styles.cardFooter}>
                    <View style={styles.dateRow}>
                      <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={COLORS.secondary} />
                      <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.primary} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="applicants" showFab />
    </SafeAreaView>
  );
};

const getStatusStyle = (type) => {
  switch (type) {
    case 'interview':
      return { badge: styles.badgeInterview, text: styles.textInterview };
    case 'offer':
      return { badge: styles.badgeOffer, text: styles.textOffer };
    case 'screened':
      return { badge: styles.badgeScreened, text: styles.textScreened };
    default:
      return { badge: styles.badgeApplied, text: styles.textApplied };
  }
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
    borderRadius: 8,
    backgroundColor: COLORS.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 8,
  },
  searchSection: {
    padding: 20,
    gap: 12,
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
    color: COLORS.onSurface,
  },
  filterButton: {
    backgroundColor: '#1a365d', // Deep navy for primary actions
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  filterIcon: {
    transform: [{ rotate: '0deg' }],
  },
  filterButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  listHeader: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.onSurfaceVariant,
    lineHeight: 22,
  },
  applicantsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  candidateCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 16,
  },
  candidateAvatar: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateMainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeApplied: { backgroundColor: '#E8F0FE' },
  textApplied: { color: '#1a365d' },
  badgeInterview: { backgroundColor: '#FFF4E5' },
  textInterview: { color: '#B45309' },
  badgeOffer: { backgroundColor: '#E6F4EA' },
  textOffer: { color: '#1E8E3E' },
  badgeScreened: { backgroundColor: '#F1F3F4' },
  textScreened: { color: '#5F6368' },
  candidateRole: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
    paddingTop: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
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
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
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

export default ApplicantsListScreen;
