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
import RecruiterBottomNav from '../../../components/RecruiterBottomNav';

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
  accentBlue: '#00a8e1',
  secondaryContainer: '#e2e7f9',
};

const JobPostingSuccessScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="briefcase-outline" size={24} color={COLORS.primary} />
          <Text style={styles.headerLogo}>JobFinder</Text>
        </View>
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
        {/* Success Icon */}
        <View style={styles.successIconSection}>
          <View style={styles.successIconContainer}>
            <MaterialCommunityIcons name="rocket-launch" size={48} color={COLORS.white} />
          </View>
        </View>

        {/* Headline */}
        <View style={styles.headlineSection}>
          <Text style={styles.title}>Job Successfully Posted!</Text>
          <Text style={styles.subtitle}>
            Your search for the perfect Senior Product Designer starts now.
          </Text>
        </View>

        {/* Job Summary Card */}
        <View style={styles.jobCard}>
          <View style={styles.cardHeader}>
             <View style={styles.tagRow}>
                <View style={styles.typeTag}><Text style={styles.typeTagText}>FULL-TIME</Text></View>
                <Text style={styles.postedDate}>Posted Today</Text>
             </View>
             <Text style={styles.salaryText}>$140k - $185k</Text>
          </View>
          <Text style={styles.jobTitle}>Senior Product Designer</Text>
          <Text style={styles.jobLocation}>Design Operations • San Francisco, CA (Hybrid)</Text>
        </View>

        {/* What Happens Next Card */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.cardTitle}>What happens next?</Text>
          
          <NextStepItem 
            icon="earth"
            title="Your post is live on our 2M+ network"
            description="The listing is being distributed across our global network of high-intent job seekers."
          />
          
          <NextStepItem 
            icon="email-outline"
            title="You'll receive notifications for new applicants"
            description="Stay updated with real-time alerts whenever a qualified candidate submits an application."
          />
          
          <NextStepItem 
            icon="chart-timeline-variant"
            title="Track progress in your dashboard"
            description="Manage applicants, schedule interviews, and move candidates through your pipeline."
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton}>
            <MaterialCommunityIcons name="pencil-outline" size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>Manage This Job</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('RecruiterHome')}>
            <Text style={styles.secondaryButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="post_job" showFab />
    </SafeAreaView>
  );
};

const NextStepItem = ({ icon, title, description }) => (
  <View style={styles.stepItem}>
    <View style={styles.stepIconContainer}>
      <MaterialCommunityIcons name={icon} size={22} color={COLORS.primary} />
    </View>
    <View style={styles.stepTextContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
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
  iconButton: {
    padding: 4,
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  successIconSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 20,
    backgroundColor: '#8AB4F8', // Lighter blue for the rocket icon background
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headlineSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
  postedDate: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  salaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  jobLocation: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  nextStepsCard: {
    backgroundColor: '#F0F3FF', // Matching the light container from screenshot
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  stepIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E7F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#001a33', // Deep navy
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
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

export default JobPostingSuccessScreen;
