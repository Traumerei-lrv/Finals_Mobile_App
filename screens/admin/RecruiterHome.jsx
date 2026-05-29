import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../components/RecruiterBottomNav';

const { width } = Dimensions.get('window');

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
  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
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
        {/* Recruitment Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recruitment Overview</Text>
        </View>

        <View style={styles.overviewContainer}>
          <OverviewCard 
            icon="briefcase-variant" 
            label="ACTIVE LISTINGS" 
            value="24" 
            iconBg={COLORS.primary}
          />
          <OverviewCard 
            icon="account-group" 
            label="NEW APPLICANTS" 
            value="142" 
            iconBg={COLORS.primary}
          />
          <OverviewCard 
            icon="calendar-blank" 
            label="INTERVIEWS" 
            value="12" 
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
          <JobPostingCard 
            title="Senior Product Designer"
            meta="Posted 2 days ago • London, UK"
            applicants="48 Applicants"
            shortlisted="8 Shortlisted"
            status="OPEN"
          />
          <JobPostingCard 
            title="Backend Engineer (Go)"
            meta="Posted 5 days ago • Remote"
            applicants="112 Applicants"
            shortlisted="15 Shortlisted"
            status="OPEN"
          />
          <JobPostingCard 
            title="QA Lead"
            meta="Posted 14 days ago • Berlin, DE"
            applicants="25 Applicants"
            status="CLOSED"
            hired
          />
        </View>

        {/* Pending Review */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pending Review</Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>8 New</Text>
          </View>
        </View>

        <View style={styles.reviewList}>
          <CandidateReviewItem 
            name="Marcus Thorne"
            role="Senior Product Designer"
            description="&quot;8+ years exp in FinTech...&quot;"
            avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop"
          />
          <CandidateReviewItem 
            name="Sarah Jenkins"
            role="Backend Engineer"
            description="&quot;Expertise in Go and AWS...&quot;"
            avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
          />
          <CandidateReviewItem 
            name="David Chen"
            role="Product Manager"
            description="&quot;Led teams of 15+ at Google...&quot;"
            avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop"
          />
          
          <TouchableOpacity style={styles.processAllButton}>
            <Text style={styles.processAllText}>Process All New Applications</Text>
          </TouchableOpacity>
        </View>
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

const JobPostingCard = ({ title, meta, applicants, shortlisted, status, hired }) => (
  <View style={styles.jobCard}>
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
      {shortlisted ? (
        <Text style={styles.jobCardShortlisted}>{shortlisted}</Text>
      ) : hired ? (
        <Text style={styles.hiredText}>Hired</Text>
      ) : null}
    </View>
  </View>
);

const CandidateReviewItem = ({ name, role, description, avatar }) => (
  <View style={styles.reviewItem}>
    <Image source={{ uri: avatar }} style={styles.candidateAvatar} />
    <View style={styles.reviewContent}>
      <Text style={styles.candidateName}>{name}</Text>
      <Text style={styles.candidateRole}>{role}</Text>
      <Text style={styles.candidateDesc}>{description}</Text>
    </View>
    <TouchableOpacity style={styles.chevronButton}>
      <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
    </TouchableOpacity>
  </View>
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
  reviewList: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  reviewItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    alignItems: 'center',
  },
  candidateAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 16,
  },
  reviewContent: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  candidateRole: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  candidateDesc: {
    fontSize: 13,
    color: COLORS.secondary,
    fontStyle: 'italic',
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processAllButton: {
    backgroundColor: '#E8F0FE',
    paddingVertical: 16,
    alignItems: 'center',
  },
  processAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default RecruiterDashboardNoAIScreen;
