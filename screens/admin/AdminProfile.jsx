import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../firebase';
import AdminSidebarMenu from '../../components/AdminSidebarMenu';
import LogoutConfirmModal from '../../components/LogoutConfirmModal';
import { useAuthContext } from '../../context/AuthContext';
import { signOutFromAllProviders } from '../../utils/authProviders';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  white: '#ffffff',
  outline: '#dbe5f7',
  chip: '#e8f0fe',
  accent: '#1e88ff',
  danger: '#d32f2f',
};

function formatJoinedDate(value) {
  if (!value) {
    return 'Not available';
  }

  try {
    if (value?.toDate && typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString();
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    const parsed = Date.parse(String(value));
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toLocaleDateString();
    }
  } catch (error) {
    return 'Not available';
  }

  return 'Not available';
}

export default function AdminProfile({ navigation }) {
  const { user, userProfile, recruiterProfile } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const adminName =
    userProfile?.fullName ||
    recruiterProfile?.fullName ||
    user?.displayName ||
    user?.email ||
    'Admin User';
  const adminEmail = userProfile?.email || recruiterProfile?.email || user?.email || 'No email';
  const adminRole = useMemo(() => {
    const rawRole =
      userProfile?.role ||
      userProfile?.userRole ||
      userProfile?.type ||
      recruiterProfile?.role ||
      'admin';
    return String(rawRole).replace(/_/g, ' ').toUpperCase();
  }, [recruiterProfile?.role, userProfile?.role, userProfile?.type, userProfile?.userRole]);
  const initials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A';
  const joinedDate = formatJoinedDate(userProfile?.createdAt || recruiterProfile?.createdAt);

  async function handleLogoutConfirm() {
    setLogoutLoading(true);
    try {
      await signOutFromAllProviders();
    } catch (error) {
      console.error('Admin logout failed', error);
    } finally {
      setLogoutLoading(false);
      setLogoutModalVisible(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <AdminSidebarMenu
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeRoute="AdminProfile"
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => setSidebarOpen(true)}>
          <MaterialCommunityIcons name="menu" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{adminName}</Text>
          <Text style={styles.email}>{adminEmail}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{adminRole}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <InfoRow icon="email-outline" label="Email" value={adminEmail} />
          <InfoRow icon="identifier" label="User ID" value={user?.uid || 'Not available'} />
          <InfoRow icon="calendar-month-outline" label="Joined" value={joinedDate} />
        </View>

        <View style={styles.infoCard}>  
          <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutModalVisible(true)}>
            <MaterialCommunityIcons name="logout" size={18} color={COLORS.white} />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={logoutLoading}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleLogoutConfirm}
      />
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, isLast = false }) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '800',
  },
  name: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  email: {
    marginTop: 8,
    fontSize: 15,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  roleChip: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.chip,
  },
  roleChipText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 18,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  sectionBody: {
    color: COLORS.secondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2fb',
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.chip,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 18,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
});
