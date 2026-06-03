import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../../components/RecruiterBottomNav';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainer: '#e2e7f9',
  surfaceContainerLow: '#f0f3ff',
  outline: '#cfdaf1',
  white: '#ffffff',
};

const DEFAULT_SKILLS = ['UI/UX Design', 'Lead Design', 'Prototyping'];
const DEFAULT_QUALIFICATIONS = [
  'Must be able to work in US Timezones',
  'Must have a public portfolio',
];

const PostJobStep2Screen = ({ navigation, route }) => {
  const draft = route?.params?.draft ?? {};

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState(
    Array.isArray(draft?.skills) && draft.skills.length ? draft.skills : DEFAULT_SKILLS,
  );

  const [qualificationInput, setQualificationInput] = useState('');
  const [qualifications, setQualifications] = useState(
    Array.isArray(draft?.qualifications) && draft.qualifications.length
      ? draft.qualifications
      : DEFAULT_QUALIFICATIONS,
  );

  const [minExperience, setMinExperience] = useState(draft?.minExperience ?? '');
  const [education, setEducation] = useState(draft?.education ?? '');
  const [languagesInput, setLanguagesInput] = useState('');
  const [languages, setLanguages] = useState(
    Array.isArray(draft?.languages) && draft.languages.length ? draft.languages : [],
  );

  const recommendedSkills = useMemo(
    () => ['User Research', 'Design Systems', 'Figma'].filter((item) => !skills.includes(item)),
    [skills],
  );

  const addSkill = (value) => {
    const next = String(value ?? '').trim();
    if (!next) return;
    if (skills.some((skill) => skill.toLowerCase() === next.toLowerCase())) return;
    setSkills((prev) => [...prev, next]);
    setSkillInput('');
  };

  const addQualification = (value) => {
    const next = String(value ?? '').trim();
    if (!next) return;
    if (qualifications.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    setQualifications((prev) => [...prev, next]);
    setQualificationInput('');
  };

  const addLanguage = (value) => {
    const next = String(value ?? '').trim();
    if (!next) return;
    if (languages.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    setLanguages((prev) => [...prev, next]);
    setLanguagesInput('');
  };

  const nextDraft = {
    ...draft,
    skills,
    qualifications,
    minExperience,
    education,
    languages,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.profileAvatarPlaceholder}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.headerLogo}>Career Go</Text>
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="notifications-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.stepIndicator}>STEP 2 OF 3</Text>
            <Text style={styles.percentText}>66% Complete</Text>
          </View>
          <Text style={styles.screenTitle}>Requirements & Skills</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '66.66%' }]} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="bullseye-arrow" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>SKILLS & EXPERTISE</Text>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add skill (e.g., React Native)"
              placeholderTextColor={COLORS.secondary}
              value={skillInput}
              onChangeText={setSkillInput}
              onSubmitEditing={() => addSkill(skillInput)}
            />
            <TouchableOpacity style={styles.smallAction} onPress={() => addSkill(skillInput)}>
              <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Added Skills</Text>
          <View style={styles.chipRow}>
            {skills.map((skill) => (
              <View key={skill} style={styles.activeChip}>
                <Text style={styles.activeChipText}>{skill}</Text>
                <TouchableOpacity onPress={() => setSkills((prev) => prev.filter((item) => item !== skill))}>
                  <MaterialCommunityIcons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.inputLabel}>Recommended for this role</Text>
          <View style={styles.chipRow}>
            {recommendedSkills.map((rec) => (
              <TouchableOpacity key={rec} style={styles.recChip} onPress={() => addSkill(rec)}>
                <MaterialCommunityIcons name="plus" size={16} color={COLORS.primary} />
                <Text style={styles.recChipText}>{rec}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>QUALIFICATIONS</Text>
          </View>
          <Text style={styles.cardSubtitle}>Add clear must-have qualifications for this role.</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add qualification"
              placeholderTextColor={COLORS.secondary}
              value={qualificationInput}
              onChangeText={setQualificationInput}
              onSubmitEditing={() => addQualification(qualificationInput)}
            />
            <TouchableOpacity style={styles.smallAction} onPress={() => addQualification(qualificationInput)}>
              <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.listStack}>
            {qualifications.map((item) => (
              <View key={item} style={styles.listItem}>
                <Text style={styles.listText}>{item}</Text>
                <TouchableOpacity onPress={() => setQualifications((prev) => prev.filter((q) => q !== item))}>
                  <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="school-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>EXPERIENCE & EDUCATION</Text>
          </View>

          <Text style={styles.label}>Minimum Experience</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 3+ years"
            placeholderTextColor={COLORS.secondary}
            value={minExperience}
            onChangeText={setMinExperience}
          />

          <Text style={styles.label}>Education</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Bachelor's Degree"
            placeholderTextColor={COLORS.secondary}
            value={education}
            onChangeText={setEducation}
          />

          <Text style={styles.label}>Languages</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add language"
              placeholderTextColor={COLORS.secondary}
              value={languagesInput}
              onChangeText={setLanguagesInput}
              onSubmitEditing={() => addLanguage(languagesInput)}
            />
            <TouchableOpacity style={styles.smallAction} onPress={() => addLanguage(languagesInput)}>
              <MaterialCommunityIcons name="plus" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.chipRow}>
            {languages.map((lang) => (
              <View key={lang} style={styles.recChip}>
                <Text style={styles.recChipText}>{lang}</Text>
                <TouchableOpacity onPress={() => setLanguages((prev) => prev.filter((item) => item !== lang))}>
                  <MaterialCommunityIcons name="close" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('PostJobStep3', { draft: nextDraft })}
          >
            <Text style={styles.continueButtonText}>Continue to Step 3</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="post_job" showFab />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.outline, backgroundColor: COLORS.white,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileAvatarPlaceholder: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.outline,
  },
  headerLogo: { fontSize: 20, fontWeight: '800', color: COLORS.primary, fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif' },
  scrollContent: { paddingBottom: 120 },
  progressHeader: { padding: 20, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.outline },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stepIndicator: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  percentText: { fontSize: 12, fontWeight: '600', color: COLORS.secondary },
  screenTitle: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: 16 },
  progressBarBg: { height: 4, backgroundColor: COLORS.surfaceContainer, borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary },
  card: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: COLORS.outline },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },
  cardSubtitle: { fontSize: 13, color: COLORS.secondary, marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 14 },
  input: {
    flex: 1, borderWidth: 1, borderColor: COLORS.outline, borderRadius: 8,
    paddingHorizontal: 12, height: 46, color: COLORS.primary, backgroundColor: COLORS.white,
  },
  smallAction: { width: 42, height: 42, borderRadius: 8, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  activeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  activeChipText: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  recChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF1FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  recChipText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.outline, marginVertical: 16 },
  listStack: { gap: 10 },
  listItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.outline, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
  },
  listText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: '600', marginRight: 10 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 6, marginTop: 8 },
  continueButton: {
    backgroundColor: '#001a33', height: 56, borderRadius: 8, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20,
  },
  continueButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default PostJobStep2Screen;
