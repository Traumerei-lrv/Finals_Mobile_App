import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../../components/RecruiterBottomNav';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  outline: '#cfdaf1',
  white: '#ffffff',
};

const PostJobScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    role: '',
    company: '',
    location: '',
    salary: '',
    type: 'Full-time',
    about: '',
  });

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.step}>STEP 1 OF 3</Text>
        <Text style={styles.title}>Job Basics</Text>
        <Text style={styles.subtitle}>Start with the core role details before requirements and final review.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Job Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Senior Product Designer"
            placeholderTextColor={COLORS.secondary}
            value={form.role}
            onChangeText={(value) => updateField('role', value)}
          />

          <Text style={styles.label}>Company</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Velocity Corp"
            placeholderTextColor={COLORS.secondary}
            value={form.company}
            onChangeText={(value) => updateField('company', value)}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. New York, NY (Remote)"
            placeholderTextColor={COLORS.secondary}
            value={form.location}
            onChangeText={(value) => updateField('location', value)}
          />

          <Text style={styles.label}>Salary Range</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. $120k - $160k"
            placeholderTextColor={COLORS.secondary}
            value={form.salary}
            onChangeText={(value) => updateField('salary', value)}
          />

          <Text style={styles.label}>Employment Type</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Full-time"
            placeholderTextColor={COLORS.secondary}
            value={form.type}
            onChangeText={(value) => updateField('type', value)}
          />

          <Text style={styles.label}>About The Role</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Short role summary"
            placeholderTextColor={COLORS.secondary}
            value={form.about}
            onChangeText={(value) => updateField('about', value)}
            multiline
          />

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('PostJobStep2', { draft: form })}
          >
            <Text style={styles.primaryBtnText}>Continue to Step 2</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('RecruiterHome')}>
            <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <RecruiterBottomNav navigation={navigation} activeTab="post_job" showFab />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: 20, paddingBottom: 30 },
  step: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, letterSpacing: 1 },
  title: { fontSize: 30, fontWeight: '800', color: COLORS.primary, marginTop: 8 },
  subtitle: { fontSize: 15, color: COLORS.secondary, marginTop: 6, marginBottom: 18, lineHeight: 22 },
  card: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.outline, borderRadius: 14, padding: 14 },
  label: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    color: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  multiline: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  secondaryBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});

export default PostJobScreen;
