import React from 'react';
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import { withdrawApplicationForApplicant } from '../utils/applicationsFirestore';

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
  error: '#B91C1C',
  success: '#1a365d', // Using primary for completed steps
};

const TrackApplicationScreen = ({ navigation, route }) => {
  const job = route?.params?.job ?? null;
  const statusType = job?.statusType ?? 'applied';
  const isAppliedOnly = statusType === 'applied';
  const isUnderReview = statusType === 'review' || statusType === 'screened';
  const isInterview = statusType === 'interview';
  const isOffer = statusType === 'offer';
  const interviewDetails = job?.interviewDetails ?? {};
  const hasInterviewDetails = Boolean(
    interviewDetails?.date ||
    interviewDetails?.time ||
    interviewDetails?.location ||
    interviewDetails?.instructions,
  );
  const interviewDateTime = [interviewDetails?.date, interviewDetails?.time].filter(Boolean).join(' • ');
  const statusBadgeText = isOffer
    ? 'OFFER STAGE'
    : isInterview
      ? 'INTERVIEW STAGE'
      : isUnderReview
        ? 'UNDER REVIEW'
        : statusType === 'withdrawn'
          ? 'WITHDRAWN'
          : 'APPLIED';
  const handleWithdrawApplication = async () => {
    const applicationId = job?.id ?? null;
    if (!applicationId) {
      Alert.alert('Withdraw failed', 'Application ID is missing. Please try again from My Applications.');
      return;
    }

    try {
      await withdrawApplicationForApplicant({ applicationId });
      navigation.navigate('JobSeekerDashboard', { tab: 'applications', applicationTab: 'Archive' });
    } catch (error) {
      console.error('Withdraw application failed', error);
      Alert.alert('Withdraw failed', 'Unable to withdraw this application right now. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Details</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialCommunityIcons name="more-vertical" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Job Summary Card */}
        <View style={styles.card}>
          <View style={styles.jobHeader}>
            <View style={styles.companyLogoContainer}>
              <Image
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.png' }}
                style={styles.companyLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.jobTitleContainer}>
              <Text style={styles.jobTitle}>{job?.role ?? 'Senior Product Designer'}</Text>
              <View style={styles.companyRow}>
                <MaterialCommunityIcons name="office-building" size={16} color={COLORS.secondary} />
                <Text style={styles.companyName}>{job?.company ?? 'Google'}</Text>
              </View>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.secondary} />
                <Text style={styles.locationText}>{job?.location ?? 'Mountain View, CA (Hybrid)'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{statusBadgeText}</Text>
          </View>
        </View>

        {/* Application Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application Progress</Text>
          
          <View style={styles.timeline}>
            <TimelineItem 
              title="Applied"
              date="Oct 12"
              description="Your application was successfully submitted."
              status="completed"
            />
            {isAppliedOnly ? (
              <TimelineItem 
                title="Under Review"
                date="Pending"
                description="Waiting for recruiter to review your profile."
                status="pending"
              />
            ) : (
              <TimelineItem 
                title="Under Review"
                date="Updated"
                description="A recruiter has reviewed your profile and portfolio."
                status="completed"
              />
            )}
            {isInterview ? (
              <TimelineActiveItem 
                title="Interview"
                date="Scheduled"
                description="Next: Technical Interview with the team."
                appointmentDateTime={interviewDateTime || 'Date/time to be confirmed'}
                appointmentLocation={interviewDetails?.location || 'Location/link not provided'}
              />
            ) : (
              <TimelineItem 
                title="Interview"
                date="Pending"
                description="Interview stage will start once shortlisted."
                status={isOffer ? 'completed' : 'pending'}
              />
            )}
            <TimelineItem 
              title="Offer"
              date={isOffer ? 'Updated' : 'Pending'}
              description="Final decision after interview rounds."
              status={isOffer ? 'completed' : 'pending'}
              isLast
            />
          </View>
        </View>

        {hasInterviewDetails ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interview Details</Text>
            <View style={styles.card}>
              <Text style={styles.interviewTitle}>{interviewDetails?.interviewType || 'Interview'}</Text>
              <Text style={styles.interviewMeta}>{interviewDateTime || 'Date/time to be confirmed'}</Text>
              <Text style={styles.interviewMeta}>
                {interviewDetails?.meetingFormat || 'Remote'} • {interviewDetails?.timezone || 'Timezone not set'}
              </Text>
              <Text style={styles.interviewMeta}>{interviewDetails?.location || 'Location/link not provided'}</Text>
              {interviewDetails?.instructions ? (
                <Text style={styles.interviewInstructions}>{interviewDetails.instructions}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Hiring Team */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderLabel}>HIRING TEAM</Text>
          <View style={styles.card}>
            <View style={styles.recruiterRow}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop' }}
                style={styles.recruiterAvatar}
              />
              <View style={styles.recruiterInfo}>
                <Text style={styles.recruiterName}>Sarah Jenkins</Text>
                <Text style={styles.recruiterRole}>Senior Tech Recruiter</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.secondaryButton}>
              <MaterialCommunityIcons name="chat-outline" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryButtonText}>Message Recruiter</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manage Application */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderLabel}>MANAGE APPLICATION</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.dangerAction} onPress={handleWithdrawApplication}>
              <MaterialCommunityIcons name="close-circle-outline" size={24} color={COLORS.error} />
              <Text style={styles.dangerActionText}>Withdraw Application</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Withdrawing will remove you from consideration for this role.
            </Text>
          </View>
        </View>

        {/* Resource Banner */}
        <View style={styles.resourceBanner}>
          <Text style={styles.resourceTitle}>Preparing for your interview?</Text>
          <Text style={styles.resourceDescription}>
            Read our guide on Google's design interview process.
          </Text>
          <TouchableOpacity style={styles.resourceButton}>
            <Text style={styles.resourceButtonText}>View Resource</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav navigation={navigation} activeRoute="applications" />
    </SafeAreaView>
  );
};

const TimelineItem = ({ title, date, description, status, isLast }) => (
  <View style={styles.timelineItem}>
    <View style={styles.timelineLeft}>
      <View style={[
        styles.timelineDot,
        status === 'completed' ? styles.dotCompleted : styles.dotPending
      ]}>
        {status === 'completed' && <MaterialCommunityIcons name="check" size={14} color={COLORS.white} />}
      </View>
      {!isLast && <View style={[
        styles.timelineLine,
        status === 'completed' ? styles.lineCompleted : styles.linePending
      ]} />}
    </View>
    <View style={styles.timelineContent}>
      <View style={styles.timelineHeader}>
        <Text style={[styles.timelineTitle, status === 'pending' && styles.textPending]}>{title}</Text>
        <Text style={styles.timelineDate}>{date}</Text>
      </View>
      <Text style={[styles.timelineDescription, status === 'pending' && styles.textPending]}>{description}</Text>
    </View>
  </View>
);

const TimelineActiveItem = ({ title, date, description, appointmentDateTime, appointmentLocation }) => (
  <View style={styles.timelineItem}>
    <View style={styles.timelineLeft}>
      <View style={styles.dotActive}>
        <View style={styles.dotActiveInner} />
      </View>
      <View style={styles.timelineLine} />
    </View>
    <View style={styles.timelineContent}>
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineDate}>{date}</Text>
      </View>
      <Text style={styles.timelineDescription}>{description}</Text>
      
      {/* Interview Appointment Card */}
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentIconContainer}>
          <MaterialCommunityIcons name="calendar-clock" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentDateTime}>{appointmentDateTime}</Text>
          <Text style={styles.appointmentLocation}>{appointmentLocation}</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.addCalText}>Add to Cal</Text>
        </TouchableOpacity>
      </View>
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
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  jobHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  companyLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  companyLogo: {
    width: '100%',
    height: '100%',
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  companyName: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  statusBadge: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 20,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 80,
  },
  timelineLeft: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dotCompleted: {
    backgroundColor: COLORS.primary,
  },
  dotPending: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.outline,
  },
  dotActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    zIndex: 2,
  },
  dotActiveInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4285F4',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: -2,
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: COLORS.primary,
  },
  linePending: {
    backgroundColor: COLORS.outline,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  timelineDate: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  timelineDescription: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  textPending: {
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    marginTop: 12,
    gap: 12,
  },
  appointmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDateTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  appointmentLocation: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  interviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  interviewMeta: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginBottom: 4,
    lineHeight: 20,
  },
  interviewInstructions: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 20,
  },
  addCalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285F4',
  },
  recruiterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  recruiterAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  recruiterInfo: {
    flex: 1,
  },
  recruiterName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  recruiterRole: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  secondaryButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  dangerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  dangerActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
  },
  helperText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  resourceBanner: {
    margin: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    marginTop: 32,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
  },
  resourceDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    marginBottom: 20,
  },
  resourceButton: {
    backgroundColor: '#4285F4',
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
  },
  resourceButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default TrackApplicationScreen;
