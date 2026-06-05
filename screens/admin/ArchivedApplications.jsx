import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../components/RecruiterBottomNav';
import RecruiterSidebarMenu from '../../components/RecruiterSidebarMenu';
import { auth } from '../../firebase';
import { subscribeToRecruiterApplications } from '../../utils/applicationsFirestore';
import { useAuthContext } from '../../context/AuthContext';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#8AB4F8',
};

export default function ArchivedApplicationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const recruiterId = auth.currentUser?.uid ?? null;
    const unsubscribe = subscribeToRecruiterApplications({
      recruiterId,
      includeArchived: true,
      onData: setApplications,
      onError: (error) => console.error('Archived applications subscription error', error),
    });

    return unsubscribe;
  }, []);

  const archivedApplications = useMemo(
    () => applications.filter((application) => application.recruiterArchived),
    [applications],
  );

  const handleSidebarItemPress = (item) => {
    setSidebarOpen(false);

    if (item.route === 'RecruiterDashboard' && item.params?.tab) {
      navigation.navigate(item.route, item.params);
      return;
    }

    navigation.navigate(item.route, item.params);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <RecruiterSidebarMenu
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeRoute="ArchivedApplications"
        onItemPress={handleSidebarItemPress}
        showAdmin={isAdmin && typeof isAdmin === 'function' ? isAdmin() : false}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) + 2 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setSidebarOpen(true)}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Archived Applications</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Archived Records</Text>
          <Text style={styles.summaryValue}>{archivedApplications.length}</Text>
          <Text style={styles.summaryHint}>Removed applicants stay here until you review them again.</Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Recent Archived Applicants</Text>
          <Text style={styles.sectionSubtitle}>Tap a card to inspect the application details.</Text>
        </View>

        <View style={styles.listContainer}>
          {!archivedApplications.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No archived applicants yet</Text>
              <Text style={styles.emptySubtitle}>Archived applications removed from the inbox will appear here.</Text>
            </View>
          ) : null}

          {archivedApplications.map((application) => (
            <TouchableOpacity
              key={application.id}
              style={styles.card}
              onPress={() => navigation.navigate('ApplicantReview', { application })}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{application.applicantName}</Text>
                  <Text style={styles.role}>{application.role}</Text>
                </View>
                <View style={styles.badge}>
                  <MaterialCommunityIcons name="archive-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.badgeText}>ARCHIVED</Text>
                </View>
              </View>

              <Text style={styles.meta}>{application.applicantEmail || 'No email provided'}</Text>
              <Text style={styles.meta}>{application.company} • {application.location}</Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => navigation.navigate('ApplicantReview', { application })}
                >
                  <Text style={styles.reviewButtonText}>Review</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="applicants" showFab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
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
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  headerRightSpacer: { width: 24 },
  scrollContent: { paddingBottom: 120, paddingTop: 16 },
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryLabel: { fontSize: 13, fontWeight: '700', color: COLORS.secondary, marginBottom: 6 },
  summaryValue: { fontSize: 34, fontWeight: '800', color: COLORS.primary },
  summaryHint: { marginTop: 4, fontSize: 12, color: COLORS.secondary, lineHeight: 18 },
  listHeader: { paddingHorizontal: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  sectionSubtitle: { marginTop: 4, fontSize: 13, color: COLORS.secondary },
  listContainer: { paddingHorizontal: 20, gap: 14 },
  emptyCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.outline },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: COLORS.secondary, lineHeight: 18 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  name: { fontSize: 17, fontWeight: '800', color: COLORS.primary },
  role: { fontSize: 13, color: COLORS.secondary, marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E8F0FE',
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  meta: { fontSize: 12, color: COLORS.secondary, marginTop: 6 },
  actionsRow: { marginTop: 14 },
  reviewButton: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewButtonText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});
