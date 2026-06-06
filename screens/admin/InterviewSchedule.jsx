import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../firebase';
import RecruiterBottomNav from '../../components/RecruiterBottomNav';
import { approveApplicationWithInterview } from '../../utils/applicationsFirestore';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#8AB4F8',
  mutedSurface: '#eef4ff',
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function formatDateValue(value) {
  return `${padDatePart(value.getMonth() + 1)}/${padDatePart(value.getDate())}/${value.getFullYear()}`;
}

function parseDateValue(value) {
  if (!value || typeof value !== 'string') return null;

  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [, monthText, dayText, yearText] = match;
  const month = Number(monthText);
  const day = Number(dayText);
  const year = Number(yearText);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = firstDayOfMonth.getDay();
  const cells = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push({ key: `empty-start-${index}`, isEmpty: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const value = new Date(year, month, day);
    cells.push({
      key: formatDateValue(value),
      isEmpty: false,
      label: day,
      value,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `empty-end-${cells.length}`, isEmpty: true });
  }

  return cells;
}

export default function InterviewScheduleScreen({ navigation, route }) {
  const application = route?.params?.application ?? null;
  const existing = application?.interviewDetails ?? null;
  const existingDate = useMemo(() => parseDateValue(existing?.date), [existing?.date]);
  const [isSaving, setIsSaving] = useState(false);
  const [interviewType, setInterviewType] = useState(existing?.interviewType || 'Technical Interview');
  const [meetingFormat, setMeetingFormat] = useState(existing?.meetingFormat || 'Remote');
  const [date, setDate] = useState(existing?.date || '');
  const [time, setTime] = useState(existing?.time || '');
  const [timezone, setTimezone] = useState(existing?.timezone || 'GMT+8');
  const [location, setLocation] = useState(existing?.location || '');
  const [instructions, setInstructions] = useState(existing?.instructions || '');
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(existingDate || new Date());

  const candidateName = useMemo(() => application?.applicantName || 'Applicant', [application?.applicantName]);
  const selectedDate = useMemo(() => parseDateValue(date), [date]);
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const monthLabel = useMemo(
    () =>
      calendarMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [calendarMonth]
  );

  const openCalendar = () => {
    setCalendarMonth(selectedDate || existingDate || new Date());
    setIsCalendarVisible(true);
  };

  const closeCalendar = () => setIsCalendarVisible(false);

  const handlePickDate = (value) => {
    setDate(formatDateValue(value));
    setCalendarMonth(value);
    closeCalendar();
  };

  const goToPreviousMonth = () => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Application context is missing.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!date.trim() || !time.trim() || !location.trim()) {
      Alert.alert('Required fields', 'Please fill interview date, time, and location/link.');
      return;
    }

    try {
      setIsSaving(true);
      await approveApplicationWithInterview({
        applicationId: application.id,
        interviewDetails: {
          interviewType,
          meetingFormat,
          date,
          time,
          timezone,
          location,
          instructions,
          scheduledBy: auth.currentUser?.uid ?? null,
        },
      });

      Alert.alert('Interview scheduled', 'Interview details were saved and sent to the applicant.');
      navigation.navigate('ApplicantsList', { jobId: application.jobId });
    } catch (error) {
      console.error('Schedule interview failed', error);
      Alert.alert('Save failed', 'Unable to save interview details right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Interview</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.candidateCard}>
          <Text style={styles.candidateName}>{candidateName}</Text>
          <Text style={styles.candidateMeta}>{application.role}</Text>
          <Text style={styles.candidateMeta}>{application.applicantEmail || 'No email provided'}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Interview Type</Text>
          <TextInput
            value={interviewType}
            onChangeText={setInterviewType}
            style={styles.input}
            placeholder="e.g. Technical Interview"
            placeholderTextColor={COLORS.secondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Meeting Format</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, meetingFormat === 'Remote' && styles.toggleButtonActive]}
              onPress={() => setMeetingFormat('Remote')}
            >
              <Text style={[styles.toggleText, meetingFormat === 'Remote' && styles.toggleTextActive]}>Remote</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, meetingFormat === 'On-site' && styles.toggleButtonActive]}
              onPress={() => setMeetingFormat('On-site')}
            >
              <Text style={[styles.toggleText, meetingFormat === 'On-site' && styles.toggleTextActive]}>On-site</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.rowItem]}>
            <Text style={styles.label}>Interview Date</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={openCalendar} activeOpacity={0.85}>
              <Text style={[styles.datePickerText, !date && styles.datePickerPlaceholder]}>
                {date || 'Select a date'}
              </Text>
              <MaterialCommunityIcons name="calendar-month-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.inputGroup, styles.rowItem]}>
            <Text style={styles.label}>Interview Time</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              style={styles.input}
              placeholder="e.g. 2:00 PM"
              placeholderTextColor={COLORS.secondary}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Timezone</Text>
          <TextInput
            value={timezone}
            onChangeText={setTimezone}
            style={styles.input}
            placeholder="e.g. GMT+8"
            placeholderTextColor={COLORS.secondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Meeting Link / Location</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            placeholder="Google Meet link or office address"
            placeholderTextColor={COLORS.secondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Candidate Instructions</Text>
          <TextInput
            value={instructions}
            onChangeText={setInstructions}
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="What should the applicant prepare"
            placeholderTextColor={COLORS.secondary}
          />
        </View>

        <TouchableOpacity style={[styles.submitBtn, isSaving && styles.submitBtnDisabled]} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.submitBtnText}>{isSaving ? 'Saving...' : 'Approve & Send Interview Details'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent animationType="fade" visible={isCalendarVisible} onRequestClose={closeCalendar}>
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Interview Date</Text>
              <TouchableOpacity onPress={closeCalendar} style={styles.iconButton}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarMonthRow}>
              <TouchableOpacity style={styles.calendarNavButton} onPress={goToPreviousMonth}>
                <MaterialCommunityIcons name="chevron-left" size={22} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.calendarMonthLabel}>{monthLabel}</Text>
              <TouchableOpacity style={styles.calendarNavButton} onPress={goToNextMonth}>
                <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekRow}>
              {WEEKDAY_LABELS.map((label) => (
                <Text key={label} style={styles.calendarWeekLabel}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day) =>
                day.isEmpty ? (
                  <View key={day.key} style={styles.calendarDayCell} />
                ) : (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.calendarDayCell,
                      styles.calendarDayButton,
                      selectedDate && formatDateValue(selectedDate) === day.key && styles.calendarDayButtonActive,
                    ]}
                    onPress={() => handlePickDate(day.value)}
                  >
                    <Text
                      style={[
                        styles.calendarDayLabel,
                        selectedDate && formatDateValue(selectedDate) === day.key && styles.calendarDayLabelActive,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
      </Modal>

      <RecruiterBottomNav navigation={navigation} activeTab="applicants" showFab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  primaryBtnText: { color: COLORS.white, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  scrollContent: { padding: 16, paddingBottom: 120 },
  candidateCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  candidateName: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  candidateMeta: { fontSize: 13, color: COLORS.secondary, marginBottom: 2 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, color: COLORS.primary, fontWeight: '700', marginBottom: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    color: COLORS.primary,
  },
  datePickerButton: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  datePickerPlaceholder: {
    color: COLORS.secondary,
  },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    color: COLORS.primary,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    padding: 4,
    backgroundColor: COLORS.white,
  },
  toggleButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: { backgroundColor: COLORS.primary },
  toggleText: { color: COLORS.secondary, fontWeight: '700' },
  toggleTextActive: { color: COLORS.white },
  submitBtn: {
    marginTop: 8,
    height: 52,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 19, 34, 0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  calendarMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.mutedSurface,
  },
  calendarMonthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekLabel: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  calendarDayButton: {
    borderRadius: 12,
  },
  calendarDayButtonActive: {
    backgroundColor: COLORS.primary,
  },
  calendarDayLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  calendarDayLabelActive: {
    color: COLORS.white,
  },
});
