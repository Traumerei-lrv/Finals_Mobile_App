import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../../components/RecruiterBottomNav';
import { auth } from '../../../firebase';
import { createRecruiterJobPosting } from '../../../utils/jobsFirestore';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainer: '#e2e7f9',
  surfaceContainerLow: '#f0f3ff',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#00a8e1',
};

const PostJobStep3Screen = ({ navigation, route }) => {
  const draft = route?.params?.draft ?? {};
  const role = draft?.role?.trim() || 'Senior Product Designer';
  const company = draft?.company?.trim() || 'Velocity Corp';
  const location = draft?.location?.trim() || 'Remote';
  const salary = draft?.salary?.trim() || 'Competitive';
  const type = draft?.type?.trim() || 'Full-time';
  const about = draft?.about?.trim() || `${company} is hiring a ${role}.`;
  const skills = Array.isArray(draft?.skills) ? draft.skills.filter(Boolean) : [];
  const qualifications = Array.isArray(draft?.qualifications) ? draft.qualifications.filter(Boolean) : [];
  const [isPosting, setIsPosting] = useState(false);

  const handlePostJob = async () => {
    if (isPosting) {
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser?.uid) {
      Alert.alert('Sign in required', 'Please sign in again before posting a job.');
      return;
    }

    try {
      setIsPosting(true);
      const jobId = await createRecruiterJobPosting({
        recruiterId: currentUser.uid,
        draft,
      });

      navigation.replace('PostJobSuccess', {
        postedJob: {
          id: jobId,
          role,
          company,
          location,
          salary,
          type,
          about,
          skills,
          qualifications,
        },
      });
    } catch (error) {
      console.error('Failed to post job', error);
      Alert.alert('Posting failed', 'Unable to post job right now. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>Career Go</Text>
        <View style={styles.profileAvatarPlaceholder}>
          <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.stepIndicator}>STEP 3 OF 3: FINAL REVIEW</Text>
            <Text style={styles.percentText}>100% Complete</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '100%' }]} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.jobTitle}>{role}</Text>
          <Text style={styles.companyInfo}>{company} • {location}</Text>
          <View style={styles.tagRow}>
            <View style={styles.typeTag}><Text style={styles.typeTagText}>{type.toUpperCase()}</Text></View>
          </View>
          <Text style={styles.salaryText}>{salary}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About the Role</Text>
          <Text style={styles.sectionBody}>{about}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Required Skills</Text>
          {skills.length ? skills.map((item) => (
            <View key={item} style={styles.rowItem}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.accentBlue} />
              <Text style={styles.rowText}>{item}</Text>
            </View>
          )) : <Text style={styles.emptyText}>No skills added.</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Qualifications</Text>
          {qualifications.length ? qualifications.map((item) => (
            <View key={item} style={styles.rowItem}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.accentBlue} />
              <Text style={styles.rowText}>{item}</Text>
            </View>
          )) : <Text style={styles.emptyText}>No qualifications added.</Text>}
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.postButton, isPosting && styles.postButtonDisabled]}
            onPress={handlePostJob}
            disabled={isPosting}
          >
            {isPosting ? (
              <>
                <ActivityIndicator color={COLORS.white} />
                <Text style={styles.postButtonText}>Posting...</Text>
              </>
            ) : (
              <>
                <Text style={styles.postButtonText}>Post Job Now</Text>
                <MaterialCommunityIcons name="rocket-launch-outline" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="post_job" showFab />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.outline, backgroundColor: COLORS.white },
  backButton: { padding: 8 },
  headerLogo: { fontSize: 22, fontWeight: '800', color: COLORS.primary, fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif' },
  profileAvatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceContainerLow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.outline },
  scrollContent: { paddingBottom: 100 },
  progressHeader: { padding: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.outline },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stepIndicator: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  percentText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  progressBarBg: { height: 4, backgroundColor: COLORS.surfaceContainer, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary },
  card: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outline },
  jobTitle: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  companyInfo: { fontSize: 14, color: COLORS.secondary, fontWeight: '500' },
  tagRow: { flexDirection: 'row', marginTop: 10, marginBottom: 10 },
  typeTag: { backgroundColor: '#EBF1FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  typeTagText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  salaryText: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 10 },
  sectionBody: { fontSize: 15, color: COLORS.secondary, lineHeight: 22 },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  rowText: { fontSize: 14, color: COLORS.primary, fontWeight: '600', flex: 1 },
  emptyText: { fontSize: 13, color: COLORS.secondary },
  postButton: { backgroundColor: '#001a33', height: 56, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  postButtonDisabled: { opacity: 0.8 },
  postButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
});

export default PostJobStep3Screen;
