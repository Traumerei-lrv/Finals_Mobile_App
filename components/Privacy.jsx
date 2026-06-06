import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  secondaryContainer: '#e2e7f9',
};

const PrivacySettingsScreen = () => {
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerLogo}>Career Go</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Privacy</Text>
          <Text style={styles.subtitle}>
            Manage how your information is shared and how you interact with recruiters.
          </Text>
        </View>

        {/* Privacy Toggles */}
        <View style={styles.settingsGroup}>
          <PrivacyToggle
            icon="eye-outline"
            title="Profile Visibility"
            description="Control who can find and view your professional profile in search results."
            value={profileVisibility}
            onValueChange={setProfileVisibility}
          />
          <PrivacyToggle
            icon="message-text-outline"
            title="Allow recruiters to message me"
            description="Receive direct messages from hiring managers for opportunities that match your skill set."
            value={allowMessages}
            onValueChange={setAllowMessages}
          />
          <PrivacyToggle
            icon="database-outline"
            title="Data Sharing"
            description="Allow Career Go to share anonymized salary data with partners for market research."
            value={dataSharing}
            onValueChange={setDataSharing}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        {/* Trust & Security Card */}
        <View style={styles.securityCard}>
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Trust & Security</Text>
            <Text style={styles.securityDescription}>
              Your data is encrypted using AES-256 standards. We never sell your personal information to third-party advertisers.
            </Text>
          </View>
          <View style={styles.lockIconContainer}>
            <MaterialCommunityIcons name="lock-outline" size={48} color="rgba(255,255,255,0.15)" />
          </View>
        </View>

        {/* Resources Section */}
        <View style={styles.resourcesSection}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.resourceList}>
            <ResourceItem label="Privacy Policy" />
            <ResourceItem label="Terms of Service" />
            <ResourceItem label="Data Request" isLast />
          </View>
        </View>

        {/* Pro Protection Banner (Simplified) */}
        <View style={styles.proBanner}>
           <View style={styles.badge}>
             <Text style={styles.badgeText}>PRO PROTECTION</Text>
           </View>
           <Text style={styles.proTitle}>2FA is enabled</Text>
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="home-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="magnify" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Apps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <View style={styles.activeNavIndicator}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
            <Text style={styles.navLabelActive}>Profile</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const PrivacyToggle = ({ icon, title, description, value, onValueChange }) => (
  <View style={styles.toggleCard}>
    <View style={styles.toggleHeader}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name={icon} size={22} color={COLORS.primary} />
      </View>
      <View style={styles.toggleTextContainer}>
        <Text style={styles.toggleTitle}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.outline, true: COLORS.primary }}
        thumbColor={COLORS.white}
      />
    </View>
    <Text style={styles.toggleDescription}>{description}</Text>
  </View>
);

const ResourceItem = ({ label, isLast }) => (
  <TouchableOpacity style={[styles.resourceItem, isLast && { borderBottomWidth: 0 }]}>
    <Text style={styles.resourceLabel}>{label}</Text>
    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.secondary} />
  </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  titleSection: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    lineHeight: 24,
  },
  settingsGroup: {
    paddingHorizontal: 20,
    gap: 16,
  },
  toggleCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  toggleDescription: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    marginLeft: 60, // Align with title text
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 24,
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  securityCard: {
    margin: 20,
    backgroundColor: '#1a365d',
    borderRadius: 12,
    padding: 24,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  securityContent: {
    flex: 1,
    zIndex: 2,
  },
  securityTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 12,
  },
  securityDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  lockIconContainer: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    zIndex: 1,
  },
  resourcesSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
  },
  resourceList: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 12,
    overflow: 'hidden',
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  resourceLabel: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  proBanner: {
    margin: 20,
    backgroundColor: '#E2E7F9',
    borderRadius: 12,
    padding: 24,
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: 'rgba(26, 54, 93, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  proTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
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

export default PrivacySettingsScreen;
