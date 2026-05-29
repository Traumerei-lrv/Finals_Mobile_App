import React from 'react';
import {
  Alert,
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
import { auth } from '../../../firebase';
import { createRecruiterJobPosting } from '../../../utils/jobsFirestore';

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
  accentYellow: '#f9b208',
  secondaryContainer: '#e2e7f9',
  onSecondaryContainer: '#1a365d',
  success: '#1a365d',
};

const PostJobStep3Screen = ({ navigation, route }) => {
  const draft = route?.params?.draft ?? {};
  const role = draft?.role?.trim() || 'Senior Product Designer';
  const company = draft?.company?.trim() || 'Velocity Corp';
  const location = draft?.location?.trim() || 'New York, NY (Remote)';
  const salary = draft?.salary?.trim() || '$140k - $180k';
  const type = draft?.type?.trim() || 'FULL-TIME';
  const about = draft?.about?.trim();

  const handlePostJob = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser?.uid) {
      Alert.alert('Sign in required', 'Please sign in again before posting a job.');
      return;
    }

    try {
      await createRecruiterJobPosting({
        recruiterId: currentUser.uid,
        draft: {
          role,
          company,
          location,
          salary,
          type,
          about,
        },
      });
      navigation.navigate('PostJobSuccess');
    } catch (error) {
      console.error('Failed to post job', error);
      Alert.alert('Posting failed', 'Unable to post job right now. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>TalentLink</Text>
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
        {/* Progress Header */}
        <View style={styles.progressHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.stepIndicator}>STEP 3 OF 3: FINAL REVIEW</Text>
            <Text style={styles.percentText}>100% Complete</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '100%' }]} />
          </View>
        </View>

        {/* Job Header Card */}
        <View style={styles.card}>
          <View style={styles.jobHeaderRow}>
            <View style={styles.companyLogoContainer}>
               <MaterialCommunityIcons name="office-building" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle}>{role}</Text>
              <Text style={styles.companyInfo}>{company} • {location}</Text>
            </View>
          </View>
          <View style={styles.tagRow}>
            <View style={styles.typeTag}><Text style={styles.typeTagText}>{type.toUpperCase()}</Text></View>
          </View>
          <Text style={styles.salaryText}>{salary} / yr</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.metaText}>Posted Just Now</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.metaText}>Mid-Senior Level</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="briefcase-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.metaText}>Design & UX</Text>
            </View>
          </View>
        </View>

        {/* About the Role Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>About the Role</Text>
          </View>
          <Text style={styles.sectionBody}>
            {about || `${company} is looking for a skilled ${role} to join the team and deliver meaningful impact.`}
          </Text>
        </View>

        {/* Requirements & Core Skills Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="lightning-bolt" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Requirements & Core Skills</Text>
          </View>
          
          <View style={styles.skillsSubsection}>
             <Text style={styles.subsectionLabel}>TECHNICAL SKILLS</Text>
             <SkillItem text="Figma, ProtoPie, and Design Systems" />
             <SkillItem text="User Research & Usability Testing" />
             <SkillItem text="Interaction & Motion Design" />
          </View>

          <View style={styles.skillsSubsection}>
             <Text style={styles.subsectionLabel}>SOFT SKILLS</Text>
             <SkillItem text="Stakeholder Management" />
             <SkillItem text="Collaborative Problem Solving" />
             <SkillItem text="Mentorship & Team Leadership" />
          </View>
        </View>

        {/* Qualifications & Education Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="school-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Qualifications & Education</Text>
          </View>
          
          <QualificationCard icon="briefcase-variant-outline" text="5+ years of experience in Product Design or UX/UI roles" />
          <QualificationCard icon="school-outline" text="Bachelor's or Master's in Design, HCI, or related field" />
          <QualificationCard icon="star-outline" text="Strong portfolio demonstrating shipped enterprise products" />
        </View>

        {/* Ready to Publish Section */}
        <View style={styles.card}>
          <Text style={styles.readyTitle}>Ready to publish?</Text>
          <Text style={styles.readySubtitle}>
            Review all details carefully. Once posted, this job will be visible to our network of 2M+ active candidates.
          </Text>
          
          <TouchableOpacity style={styles.postButton} onPress={handlePostJob}>
            <Text style={styles.postButtonText}>Post Job Now</Text>
            <MaterialCommunityIcons name="rocket-launch-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryAction}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryActionText}>Edit Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction}>
              <MaterialCommunityIcons name="content-save-outline" size={20} color={COLORS.primary} />
              <Text style={styles.secondaryActionText}>Save Draft</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.visibilityRow}>
             <MaterialCommunityIcons name="eye-outline" size={18} color={COLORS.primary} />
             <View style={styles.visibilityContent}>
                <Text style={styles.visibilityLabel}>Public Visibility</Text>
                <Text style={styles.visibilitySub}>This post will be shared across LinkedIn and Twitter partners automatically.</Text>
             </View>
          </View>
        </View>

        {/* Recruiter Tip Banner */}
        <View style={styles.recruiterTip}>
           <View style={styles.tipHeader}>
             <MaterialCommunityIcons name="lightbulb-outline" size={18} color={COLORS.white} />
             <Text style={styles.tipTitle}>RECRUITER TIP</Text>
           </View>
           <Text style={styles.tipText}>
             "Adding a salary range increases application volume by up to 40%. Great job including yours!"
           </Text>
           <View style={styles.scoreRow}>
              <View style={styles.scoreBarBg}>
                 <View style={[styles.scoreBarFill, { width: '85%' }]} />
              </View>
           </View>
           <Text style={styles.scoreLabel}>Job Score: Professional Excellence</Text>
        </View>

      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="post_job" showFab />
    </SafeAreaView>
  );
};

const SkillItem = ({ text }) => (
  <View style={styles.skillItem}>
    <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.accentBlue} />
    <Text style={styles.skillText}>{text}</Text>
  </View>
);

const QualificationCard = ({ icon, text }) => (
  <View style={styles.qualCard}>
    <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
    <Text style={styles.qualCardText}>{text}</Text>
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
  backButton: {
    padding: 8,
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
    paddingBottom: 100,
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
  stepIndicator: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
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
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  jobHeaderRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  companyLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeTag: {
    backgroundColor: '#EBF1FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  salaryText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.outline,
    marginBottom: 16,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sectionBody: {
    fontSize: 15,
    color: COLORS.secondary,
    lineHeight: 22,
  },
  skillsSubsection: {
    backgroundColor: '#F0F3FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  subsectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  qualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    marginBottom: 12,
  },
  qualCardText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    lineHeight: 20,
  },
  readyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  readySubtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  postButton: {
    backgroundColor: '#001a33',
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  postButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  secondaryAction: {
    flex: 1,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline,
  },
  visibilityContent: {
    flex: 1,
  },
  visibilityLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  visibilitySub: {
    fontSize: 11,
    color: COLORS.secondary,
    lineHeight: 16,
  },
  recruiterTip: {
    margin: 16,
    backgroundColor: '#1a365d',
    borderRadius: 12,
    padding: 24,
    marginBottom: 40,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 20,
  },
  scoreRow: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: COLORS.accentBlue,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
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

export default PostJobStep3Screen;
