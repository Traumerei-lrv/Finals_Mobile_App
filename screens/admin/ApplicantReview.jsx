import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../components/RecruiterBottomNav';
import { storage } from '../../firebase';
import { getDownloadURL, ref } from 'firebase/storage';
import { archiveDeclinedApplicationForRecruiter, updateApplicationStatus } from '../../utils/applicationsFirestore';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  outline: '#cfdaf1',
  white: '#ffffff',
  success: '#1E8E3E',
  error: '#B91C1C',
};

export default function ApplicantReviewScreen({ navigation, route }) {
  const application = route?.params?.application ?? null;
  const [note, setNote] = useState('');
  const [reviewStatusType, setReviewStatusType] = useState(
    String(application?.statusType ?? 'applied').toLowerCase(),
  );

  const normalizedReviewStatusType = useMemo(
    () => String(reviewStatusType ?? 'applied').toLowerCase(),
    [reviewStatusType],
  );
  const isDeclined = normalizedReviewStatusType === 'declined';
  const isApproved = normalizedReviewStatusType === 'offer';
  const canTakeDecision =
    normalizedReviewStatusType === 'applied' ||
    normalizedReviewStatusType === 'screened' ||
    normalizedReviewStatusType === 'review';
  const interviewDetails =
    application?.interviewDetails && typeof application.interviewDetails === 'object'
      ? application.interviewDetails
      : null;

  const statusLabel = useMemo(() => {
    if (normalizedReviewStatusType === 'screened' || normalizedReviewStatusType === 'review') return 'UNDER REVIEW';
    if (normalizedReviewStatusType === 'offer') return 'APPROVED';
    if (normalizedReviewStatusType === 'declined') return 'DECLINED';
    return 'APPLIED';
  }, [normalizedReviewStatusType]);

  const statusBadgeStyle = useMemo(() => {
    if (isApproved) {
      return [styles.badge, styles.badgeApproved];
    }
    if (isDeclined) {
      return [styles.badge, styles.badgeDeclined];
    }
    return [styles.badge];
  }, [isApproved, isDeclined]);

  useEffect(() => {
    setReviewStatusType(String(application?.statusType ?? 'applied').toLowerCase());
  }, [application?.id, application?.statusType]);

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.title}>Application not found</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    const shouldMarkReview = String(application?.statusType ?? 'applied').toLowerCase() === 'applied';
    if (!shouldMarkReview) {
      return;
    }

    updateApplicationStatus({
      applicationId: application.id,
      status: 'UNDER REVIEW',
      statusType: 'screened',
    }).catch((error) => {
      console.error('Auto mark under review failed', error);
    });
  }, [application?.id, application?.statusType]);

  const handleApprove = () => {
    if (!canTakeDecision) {
      return;
    }

    navigation.navigate('InterviewSchedule', {
      application,
      existingNote: note,
    });
  };

  const handleDeclineConfirmed = async () => {
    try {
      await updateApplicationStatus({ applicationId: application.id, status: 'DECLINED', statusType: 'declined' });
      setReviewStatusType('declined');
      Alert.alert('Updated', 'Application declined.');
    } catch (error) {
      console.error('Decline failed', error);
      Alert.alert('Action failed', 'Unable to decline this application right now.');
    }
  };

  const handleDecline = () => {
    if (!canTakeDecision) {
      return;
    }

    Alert.alert(
      'Decline applicant',
      'This is a final decision. Once you decline this applicant, you will not be able to approve them later.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm Decline',
          style: 'destructive',
          onPress: () => {
            handleDeclineConfirmed();
          },
        },
      ],
    );
  };

  const handleRemoveToArchive = async () => {
    try {
      await archiveDeclinedApplicationForRecruiter({ applicationId: application.id });
      Alert.alert('Archived', 'Application moved to Archived.');
      navigation.goBack();
    } catch (error) {
      console.error('Archive failed', error);
      Alert.alert('Action failed', 'Unable to archive this application right now.');
    }
  };

  const handleOpenResume = async () => {
    let targetUrl = application?.resumeUrl ?? null;
    if (!targetUrl && application?.resumePath) {
      try {
        targetUrl = await getDownloadURL(ref(storage, application.resumePath));
      } catch (error) {
        console.error('Resolve resume URL from path failed', error);
      }
    }

    if (!targetUrl) {
      Alert.alert(
        'Resume file unavailable',
        'This application is using metadata-only resume mode. File name is saved, but no downloadable file is attached.',
      );
      return;
    }

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      await Linking.openURL(targetUrl);
    } catch (error) {
      console.error('Open resume failed', error);
      Alert.alert('Open failed', 'Unable to open this resume link on your device.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Application</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{application.applicantName}</Text>
            <View style={statusBadgeStyle}><Text style={styles.badgeText}>{statusLabel}</Text></View>
          </View>
          <Text style={styles.role}>{application.role}</Text>
          <Text style={styles.meta}>{application.applicantEmail || 'No email provided'}</Text>
          <Text style={styles.meta}>{application.applicantPhone || 'No phone provided'}</Text>
          <Text style={styles.meta}>Job: {application.company} • {application.location}</Text>
        </View>

        {isApproved ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Interview Details</Text>
            <Text style={styles.body}>
              Type: {interviewDetails?.interviewType || 'Not specified'}
            </Text>
            <Text style={styles.body}>
              Format: {interviewDetails?.meetingFormat || 'Not specified'}
            </Text>
            <Text style={styles.body}>
              Date: {interviewDetails?.date || 'Not scheduled'}
            </Text>
            <Text style={styles.body}>
              Time: {interviewDetails?.time || 'Not scheduled'}
            </Text>
            <Text style={styles.body}>
              Timezone: {interviewDetails?.timezone || 'Not specified'}
            </Text>
            <Text style={styles.body}>
              Meeting Link / Location: {interviewDetails?.location || 'Not provided'}
            </Text>
            <Text style={[styles.body, styles.bodyNoMargin]}>
              Candidate Instructions: {interviewDetails?.instructions || 'No instructions provided.'}
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Screening Answer</Text>
          <Text style={styles.body}>{application.screening1 || 'No answer provided.'}</Text>
          <Text style={styles.sectionTitle}>Notice Period</Text>
          <Text style={styles.body}>{application.noticePeriod || 'Not specified'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resume</Text>
          <Text style={styles.body}>{application.resumeFileName || 'No file name available'}</Text>
          {typeof application.resumeFileSize === 'number' ? (
            <Text style={styles.meta}>Size: {Math.ceil(application.resumeFileSize / 1024)} KB</Text>
          ) : null}
          {application.resumeMimeType ? (
            <Text style={styles.meta}>Type: {application.resumeMimeType}</Text>
          ) : null}
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              !(application.resumeUrl || application.resumePath) && styles.secondaryBtnDisabled,
            ]}
            onPress={handleOpenResume}
            disabled={!(application.resumeUrl || application.resumePath)}
          >
            <Text style={styles.secondaryBtnText}>
              {application.resumeUrl || application.resumePath ? 'View Resume' : 'File Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Internal Note</Text>
          <TextInput
            style={[styles.noteInput, !canTakeDecision && styles.noteInputDisabled]}
            multiline
            editable={canTakeDecision}
            placeholder={canTakeDecision ? 'Add private note' : 'Private note is read-only after a final decision'}
            placeholderTextColor={COLORS.secondary}
            value={note}
            onChangeText={setNote}
          />
        </View>

        <View style={styles.actionsRow}>
          {canTakeDecision ? (
            <>
              <TouchableOpacity style={styles.approveBtn} onPress={handleApprove}>
                <Text style={styles.actionText}>Approve & Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
            </>
          ) : null}
          {isDeclined ? (
            <TouchableOpacity style={styles.removeBtn} onPress={handleRemoveToArchive}>
              <Text style={styles.removeText}>Remove to Archive</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="applicants" showFab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.outline, backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  scrollContent: { padding: 16, paddingBottom: 120, gap: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1, borderColor: COLORS.outline, padding: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.primary, flex: 1, marginRight: 8 },
  role: { fontSize: 15, color: COLORS.primary, fontWeight: '700', marginTop: 4, marginBottom: 6 },
  meta: { fontSize: 13, color: COLORS.secondary, marginBottom: 4 },
  badge: { backgroundColor: '#E8F0FE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeApproved: { backgroundColor: '#E8F5E9' },
  badgeDeclined: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 6 },
  body: { fontSize: 14, color: COLORS.secondary, lineHeight: 20, marginBottom: 10 },
  bodyNoMargin: { marginBottom: 0 },
  secondaryBtn: { height: 42, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  secondaryBtnDisabled: { opacity: 0.55 },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  noteInput: { minHeight: 90, borderWidth: 1, borderColor: COLORS.outline, borderRadius: 8, padding: 10, color: COLORS.primary, textAlignVertical: 'top', backgroundColor: COLORS.white },
  noteInputDisabled: { backgroundColor: '#F8FAFC', color: COLORS.secondary },
  actionsRow: { gap: 10, marginTop: 4 },
  approveBtn: { height: 46, backgroundColor: COLORS.success, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  declineBtn: { height: 46, backgroundColor: '#FEE2E2', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', justifyContent: 'center', alignItems: 'center' },
  removeBtn: { height: 46, backgroundColor: '#E8F0FE', borderRadius: 8, borderWidth: 1, borderColor: '#C7D7FE', justifyContent: 'center', alignItems: 'center' },
  actionText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  declineText: { color: COLORS.error, fontSize: 14, fontWeight: '700' },
  removeText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryBtnText: { color: COLORS.white, fontWeight: '700' },
});
