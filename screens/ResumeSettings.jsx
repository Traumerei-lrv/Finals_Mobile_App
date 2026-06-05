import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getResumeSettings, saveResumeSettings } from '../utils/storage';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  outline: '#cfdaf1',
  white: '#ffffff',
};

export default function ResumeSettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    resumeName: '',
    resumeUpdatedAt: '',
    resumeSize: '',
    autoFill: true,
    publicVisibility: true,
    anonymousBrowsing: false,
    portfolioLinks: [],
  });

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const storedSettings = await getResumeSettings();
      if (isMounted) {
        setSettings(storedSettings);
      }
    };

    void hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = async (key, value) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    await saveResumeSettings(nextSettings);
  };

  const handlePortfolioChange = async (id, value) => {
    const nextLinks = settings.portfolioLinks.map((item) =>
      item.id === id ? { ...item, url: value } : item,
    );
    const nextSettings = { ...settings, portfolioLinks: nextLinks };
    setSettings(nextSettings);
    await saveResumeSettings(nextSettings);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resume Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLead}>
          Manage the resume details and portfolio links used across applications and recruiter discovery.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Primary Resume File Name</Text>
          <TextInput
            style={styles.input}
            value={settings.resumeName}
            placeholderTextColor={COLORS.secondary}
            onChangeText={(text) => handleChange('resumeName', text)}
          />

          <Text style={styles.label}>Resume Last Updated Label</Text>
          <TextInput
            style={styles.input}
            value={settings.resumeUpdatedAt}
            placeholderTextColor={COLORS.secondary}
            onChangeText={(text) => handleChange('resumeUpdatedAt', text)}
          />

          <Text style={styles.label}>Resume Size</Text>
          <TextInput
            style={styles.input}
            value={settings.resumeSize}
            placeholderTextColor={COLORS.secondary}
            onChangeText={(text) => handleChange('resumeSize', text)}
          />
        </View>

        <SettingsToggle
          title="Auto-fill Applications"
          description="Use this resume by default when applying."
          value={settings.autoFill}
          onValueChange={(value) => handleChange('autoFill', value)}
        />
        <SettingsToggle
          title="Public Resume Visibility"
          description="Allow verified recruiters to find your resume in search."
          value={settings.publicVisibility}
          onValueChange={(value) => handleChange('publicVisibility', value)}
        />
        <SettingsToggle
          title="Anonymous Browsing"
          description="Hide your current employer while recruiters browse your profile."
          value={settings.anonymousBrowsing}
          onValueChange={(value) => handleChange('anonymousBrowsing', value)}
        />

        <Text style={styles.sectionTitle}>Portfolio Links</Text>
        {settings.portfolioLinks.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.portfolioTitleRow}>
              <View style={styles.portfolioIconWrap}>
                <MaterialCommunityIcons name={item.icon} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.portfolioLabel}>{item.label}</Text>
            </View>
            <TextInput
              style={styles.input}
              value={item.url}
              placeholderTextColor={COLORS.secondary}
              onChangeText={(text) => handlePortfolioChange(item.id, text)}
              autoCapitalize="none"
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsToggle({ title, description, value, onValueChange }) {
  return (
    <View style={styles.toggleCard}>
      <View style={styles.toggleTextBlock}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.outline, true: COLORS.primary }}
        thumbColor={COLORS.white}
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
  headerSpacer: { width: 24 },
  content: { padding: 20, paddingBottom: 40 },
  sectionLead: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 21,
    marginBottom: 18,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.outline,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    color: COLORS.primary,
    fontSize: 14,
    marginBottom: 14,
  },
  toggleCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  toggleTextBlock: { flex: 1 },
  toggleTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  toggleDescription: { fontSize: 13, lineHeight: 19, color: COLORS.secondary },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  portfolioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  portfolioIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E2E7F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
