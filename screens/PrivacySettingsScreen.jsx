import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getPrivacySettings, savePrivacySettings } from '../utils/storage';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  outline: '#cfdaf1',
  white: '#ffffff',
};

export default function PrivacySettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    profileVisible: true,
    recruiterMessages: true,
    activityStatus: false,
    shareAnalytics: true,
  });

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const storedSettings = await getPrivacySettings();
      if (isMounted) {
        setSettings(storedSettings);
      }
    };

    void hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = async (key, value) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    await savePrivacySettings(nextSettings);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Control who can discover you, contact you, and see your activity inside Career Go.
        </Text>

        <PrivacyToggle
          title="Profile Visibility"
          description="Allow recruiters to discover your public profile."
          value={settings.profileVisible}
          onValueChange={(value) => handleToggle('profileVisible', value)}
        />
        <PrivacyToggle
          title="Recruiter Messages"
          description="Let verified recruiters contact you directly."
          value={settings.recruiterMessages}
          onValueChange={(value) => handleToggle('recruiterMessages', value)}
        />
        <PrivacyToggle
          title="Activity Status"
          description="Show when you were recently active in the app."
          value={settings.activityStatus}
          onValueChange={(value) => handleToggle('activityStatus', value)}
        />
        <PrivacyToggle
          title="Share Usage Analytics"
          description="Help improve recommendations by sharing app usage insights."
          value={settings.shareAnalytics}
          onValueChange={(value) => handleToggle('shareAnalytics', value)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyToggle({ title, description, value, onValueChange }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
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
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.secondary,
    marginBottom: 18,
  },
  card: {
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
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  cardDescription: { fontSize: 13, lineHeight: 19, color: COLORS.secondary },
});
