import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getProfileSettings, saveProfileSettings } from '../utils/storage';
import { buildProfileAvatarUrl } from '../utils/imageSources';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  outline: '#cfdaf1',
  white: '#ffffff',
};

export default function EditProfileScreen({ navigation }) {
  const [form, setForm] = useState({
    fullName: '',
    headline: '',
    location: '',
    about: '',
    skillsText: '',
  });

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const settings = await getProfileSettings();
      if (!isMounted) {
        return;
      }

      setForm({
        fullName: settings.fullName,
        headline: settings.headline,
        location: settings.location,
        about: settings.about,
        skillsText: settings.skills.join(', '),
      });
    };

    void hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    const skills = form.skillsText
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);

    await saveProfileSettings({
      fullName: form.fullName.trim(),
      headline: form.headline.trim(),
      location: form.location.trim(),
      about: form.about.trim(),
      skills,
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.avatarBlock}>
          <Image source={{ uri: buildProfileAvatarUrl(form.fullName || 'JobFinder User') }} style={styles.avatar} />
          <Text style={styles.avatarCaption}>Profile image from DiceBear</Text>
        </View>

        <Field
          label="Full Name"
          value={form.fullName}
          onChangeText={(text) => setForm((prev) => ({ ...prev, fullName: text }))}
        />
        <Field
          label="Professional Title"
          value={form.headline}
          onChangeText={(text) => setForm((prev) => ({ ...prev, headline: text }))}
        />
        <Field
          label="Location"
          value={form.location}
          onChangeText={(text) => setForm((prev) => ({ ...prev, location: text }))}
        />
        <Field
          label="About"
          value={form.about}
          multiline
          onChangeText={(text) => setForm((prev) => ({ ...prev, about: text }))}
        />
        <Field
          label="Skills"
          helperText="Separate skills with commas"
          value={form.skillsText}
          onChangeText={(text) => setForm((prev) => ({ ...prev, skillsText: text }))}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>Update Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, helperText, multiline = false, value, onChangeText }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  saveText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  content: { padding: 20, paddingBottom: 40 },
  avatarBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  avatarCaption: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  helperText: { fontSize: 12, color: COLORS.secondary, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 12,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.primary,
    fontSize: 15,
  },
  textArea: {
    minHeight: 130,
  },
  primaryButton: {
    marginTop: 8,
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
