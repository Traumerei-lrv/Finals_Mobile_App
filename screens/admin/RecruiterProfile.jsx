import React from 'react';
import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import RecruiterBottomNav from '../../components/RecruiterBottomNav';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import LogoutConfirmModal from '../../components/LogoutConfirmModal';

const { width } = Dimensions.get('window');

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
  accentBlue: '#8AB4F8',
  verified: '#4285F4',
};

const CompanyAccountProfileScreen = ({ navigation }) => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Recruiter logout failed', error);
    } finally {
      setLogoutLoading(false);
      setLogoutModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar - Synced Recruiter Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>JobFinder</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialCommunityIcons name="notifications-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.profileAvatarPlaceholder}>
            <Text style={styles.avatarInitial}>VC</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Company Hero Section */}
        <View style={styles.profileHero}>
          <View style={styles.companyLogoContainerMain}>
             <View style={styles.logoBox}>
                <MaterialCommunityIcons name="rocket-launch" size={40} color={COLORS.white} />
             </View>
          </View>
          
          <Text style={styles.companyName}>Velocity Corp</Text>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>VERIFIED ENTERPRISE</Text>
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="office-building" size={16} color={COLORS.secondary} />
            <Text style={styles.metaText}>Information Technology</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.metaText}>San Francisco, CA (HQ)</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="account-group-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.metaText}>500-1,000 Employees</Text>
          </View>

          <TouchableOpacity style={styles.editButton}>
             <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.white} />
             <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Aggregated Metrics Section */}
        <View style={styles.metricsContainer}>
          <MetricItem 
            label="Total Active Jobs" 
            value="24" 
            icon="briefcase-outline" 
          />
          <MetricItem 
            label="Total Applicants" 
            value="842" 
            icon="account-group-outline" 
          />
          <MetricItem 
            label="Hires this Quarter" 
            value="12" 
            icon="star-outline" 
          />
        </View>

        {/* About Company Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About Velocity Corp</Text>
          <Text style={styles.cardBody}>
            Velocity Corp is at the forefront of cloud infrastructure and data intelligence. We empower global enterprises with scalable solutions that drive digital transformation. Our culture is built on the principles of rapid innovation, radical transparency, and an unwavering commitment to professional growth. We don't just build software; we build the future of connectivity.
          </Text>
          
          <View style={styles.highlightsRow}>
             <View style={styles.highlightBadge}>
                <MaterialCommunityIcons name="check-decagram-outline" size={16} color={COLORS.primary} />
                <Text style={styles.highlightText}>Top Tier Employer</Text>
             </View>
             <View style={styles.highlightBadge}>
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color={COLORS.primary} />
                <Text style={styles.highlightText}>Innovation First</Text>
             </View>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.teamTeaser}>
             <View style={styles.avatarStack}>
                <View style={[styles.miniAvatar, { backgroundColor: '#cfdaf1' }]} />
                <View style={[styles.miniAvatar, { backgroundColor: '#e2e7f9', marginLeft: -12 }]} />
                <View style={[styles.miniAvatar, { backgroundColor: '#1a365d', marginLeft: -12 }]} />
                <View style={[styles.miniAvatarIndicator, { marginLeft: -12 }]}>
                   <Text style={styles.indicatorText}>+18</Text>
                </View>
             </View>
             <Text style={styles.teaserText}>Join our growing team of 800+ experts</Text>
          </View>
        </View>

        {/* Active Departments Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Departments</Text>
          <TouchableOpacity><Text style={styles.viewAllText}>View all</Text></TouchableOpacity>
        </View>
        
        <View style={styles.listContainer}>
          <DepartmentItem icon="code-tags" name="Engineering" count="12 Open Roles" />
          <DepartmentItem icon="palette-outline" name="Design" count="4 Open Roles" />
          <DepartmentItem icon="trending-up" name="Sales & Growth" count="8 Open Roles" />
        </View>

        {/* Team Members Section */}
        <Text style={styles.sectionTitleAlt}>Team Members</Text>
        <View style={styles.listContainer}>
           <MemberItem 
             name="James Wilson" 
             role="ADMIN" 
             avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200" 
           />
           <MemberItem 
             name="Elena Rodriguez" 
             role="RECRUITER" 
             avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200" 
           />
           <TouchableOpacity style={styles.inviteButton}>
              <MaterialCommunityIcons name="account-plus-outline" size={20} color={COLORS.primary} />
              <Text style={styles.inviteText}>Invite New Member</Text>
           </TouchableOpacity>
        </View>

        {/* Account Control Section */}
        <View style={styles.controlCard}>
           <Text style={styles.controlHeader}>Account Control</Text>
           <ControlLink icon="pencil-outline" label="Company Branding" />
           <ControlLink icon="credit-card-outline" label="Billing & Subscription" />
           <ControlLink icon="shield-check-outline" label="Privacy & Security" />
           <ControlLink icon="logout" label="Log Out" isLast onPress={() => setLogoutModalVisible(true)} />
           
           <View style={styles.cogWatermark}>
              <MaterialCommunityIcons name="cog-outline" size={120} color="rgba(255,255,255,0.05)" />
           </View>
        </View>

      </ScrollView>

      <RecruiterBottomNav navigation={navigation} activeTab="profile" showFab />
      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={logoutLoading}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleLogoutConfirm}
      />
    </SafeAreaView>
  );
};

const MetricItem = ({ label, value, icon }) => (
  <View style={styles.metricCard}>
    <View style={styles.metricTextContent}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
    <View style={styles.metricIconContainer}>
       <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
    </View>
  </View>
);

const DepartmentItem = ({ icon, name, count }) => (
  <TouchableOpacity style={styles.listItem}>
    <View style={styles.listIconBox}>
       <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
    </View>
    <View style={styles.listContent}>
       <Text style={styles.itemName}>{name}</Text>
       <Text style={styles.itemSub}>{count}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.secondary} />
  </TouchableOpacity>
);

const MemberItem = ({ name, role, avatar }) => (
  <View style={styles.memberItem}>
    <Image source={{ uri: avatar }} style={styles.memberAvatar} />
    <View style={styles.listContent}>
       <Text style={styles.memberName}>{name}</Text>
       <Text style={styles.memberRole}>{role}</Text>
    </View>
    <TouchableOpacity style={styles.moreButton}>
       <MaterialCommunityIcons name="dots-vertical" size={20} color={COLORS.secondary} />
    </TouchableOpacity>
  </View>
);

const ControlLink = ({ icon, label, isLast, onPress }) => (
  <TouchableOpacity style={[styles.controlItem, isLast && { borderBottomWidth: 0 }]} onPress={onPress}>
    <View style={styles.controlLeft}>
       <MaterialCommunityIcons name={icon} size={22} color={COLORS.white} />
       <Text style={styles.controlLabel}>{label}</Text>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingTop: 16,
  },
  profileHero: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 24,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  companyLogoContainerMain: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  companyName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: '#8AB4F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 16,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#001a33',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  metricsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.outline,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTextContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  metricIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
  },
  cardBody: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: 20,
  },
  highlightsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F3FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.outline,
    marginBottom: 20,
  },
  teamTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  miniAvatarIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  teaserText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.verified,
  },
  sectionTitleAlt: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  listContainer: {
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    overflow: 'hidden',
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    gap: 16,
  },
  listIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 13,
    color: COLORS.secondary,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    gap: 16,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  memberRole: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  moreButton: {
    padding: 4,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderStyle: 'dashed',
  },
  inviteText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  controlCard: {
    backgroundColor: '#001d3d',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 24,
    marginBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  controlHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 24,
  },
  controlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  controlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  cogWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.5,
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

export default CompanyAccountProfileScreen;
