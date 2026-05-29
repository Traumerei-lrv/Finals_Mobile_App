import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions,
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

const PostJobStep2Screen = ({ navigation, route }) => {
  const draft = route?.params?.draft ?? null;
  const [qualifications, setQualifications] = useState([
    { id: 1, text: 'Must be able to work in US Timezones', sub: 'Standard EST/PST overlap of at least 4 hours.', checked: true },
    { id: 2, text: 'Must have a public portfolio', sub: 'Behance, Dribbble, or personal site required.', checked: true },
  ]);

  const [skills, setSkills] = useState(['UI/UX Design', 'Lead Design', 'Prototyping']);
  const [minExperience, setMinExperience] = useState('5-8 years');
  const [education, setEducation] = useState("Bachelor's Degree");
  const [languages, setLanguages] = useState(['English (Native/Fluent)', 'Spanish (Professional)']);

  const toggleQualification = (id) => {
    setQualifications(qualifications.map(q => q.id === id ? { ...q, checked: !q.checked } : q));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.profileAvatarPlaceholder}>
             <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.headerLogo}>Recruiter Hub</Text>
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="notifications-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Progress Header */}
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

        {/* Skills & Expertise Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
             <MaterialCommunityIcons name="bullseye-arrow" size={20} color={COLORS.primary} />
             <Text style={styles.cardTitle}>SKILLS & EXPERTISE</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.secondary} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Add skills (e.g., Figma, React Native)"
              placeholderTextColor={COLORS.secondary}
            />
          </View>

          <Text style={styles.inputLabel}>Added Skills</Text>
          <View style={styles.chipRow}>
            {skills.map((skill, index) => (
              <View key={index} style={styles.activeChip}>
                <Text style={styles.activeChipText}>{skill}</Text>
                <MaterialCommunityIcons name="close" size={16} color={COLORS.white} />
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.inputLabel}>Recommended for this role</Text>
          <View style={styles.chipRow}>
            {['User Research', 'Design Systems', 'Figma'].map((rec, index) => (
              <TouchableOpacity key={index} style={styles.recChip}>
                <MaterialCommunityIcons name="plus" size={16} color={COLORS.primary} />
                <Text style={styles.recChipText}>{rec}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Qualifications Checklist */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
             <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={20} color={COLORS.primary} />
             <Text style={styles.cardTitle}>QUALIFICATIONS CHECKLIST</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Define the non-negotiable "must-have" items for this position.
          </Text>

          {qualifications.map((q) => (
            <View key={q.id} style={styles.qualItem}>
              <TouchableOpacity onPress={() => toggleQualification(q.id)} style={[styles.checkbox, q.checked && styles.checkboxChecked]}>
                {q.checked && <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />}
              </TouchableOpacity>
              <View style={styles.qualContent}>
                <Text style={styles.qualText}>{q.text}</Text>
                <Text style={styles.qualSubText}>{q.sub}</Text>
              </View>
              <TouchableOpacity>
                <MaterialCommunityIcons name="delete-outline" size={22} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addQualButton}>
             <MaterialCommunityIcons name="plus-circle-outline" size={20} color={COLORS.primary} />
             <Text style={styles.addQualText}>Add new qualification</Text>
          </TouchableOpacity>
        </View>

        {/* Experience & Education */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
             <MaterialCommunityIcons name="school-outline" size={20} color={COLORS.primary} />
             <Text style={styles.cardTitle}>EXPERIENCE & EDUCATION</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Minimum Experience</Text>
            <TouchableOpacity style={styles.selectInput}>
              <Text style={styles.selectText}>{minExperience}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Education Level</Text>
            <TouchableOpacity style={styles.selectInput}>
              <Text style={styles.selectText}>{education}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.label}>Languages</Text>
            <TouchableOpacity><Text style={styles.addLangText}>+ Add Language</Text></TouchableOpacity>
          </View>

          <View style={styles.langList}>
             {languages.map((lang, index) => (
               <View key={index} style={styles.langItem}>
                 <Text style={styles.langText}>{lang}</Text>
                 <TouchableOpacity>
                   <MaterialCommunityIcons name="close" size={18} color={COLORS.secondary} />
                 </TouchableOpacity>
               </View>
             ))}
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('PostJobStep3', { draft })}
          >
            <Text style={styles.continueButtonText}>Continue to Step 3</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveExitButton}>
            <Text style={styles.saveExitText}>Save and exit later</Text>
          </TouchableOpacity>
        </View>

        {/* Pro Tip Banner */}
        <View style={styles.proTipBanner}>
           <View style={styles.proTipHeader}>
              <MaterialCommunityIcons name="information-outline" size={18} color={COLORS.white} />
              <Text style={styles.proTipTitle}>PRO TIP</Text>
           </View>
           <Text style={styles.proTipDescription}>
             Roles with clear, specific skill requirements receive 40% more qualified applications within the first 48 hours.
           </Text>
        </View>

      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="post_job" showFab />
    </SafeAreaView>
  );
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  headerLogo: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  scrollContent: {
    paddingBottom: 120,
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
    marginBottom: 8,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
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
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 18,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.onSurface,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  recChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF1FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  recChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.outline,
    marginVertical: 20,
  },
  qualItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.outline,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  qualContent: {
    flex: 1,
  },
  qualText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  qualSubText: {
    fontSize: 12,
    color: COLORS.secondary,
    lineHeight: 16,
  },
  addQualButton: {
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderStyle: 'dashed',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  addQualText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  selectText: {
    fontSize: 14,
    color: COLORS.onSurface,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addLangText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  langList: {
    gap: 8,
    marginBottom: 24,
  },
  langItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F3FF',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  langText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  continueButton: {
    backgroundColor: '#001a33', // Deep navy
    height: 56,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  saveExitButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  saveExitText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  proTipBanner: {
    margin: 16,
    backgroundColor: '#1a365d',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  proTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  proTipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  proTipDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
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

export default PostJobStep2Screen;
