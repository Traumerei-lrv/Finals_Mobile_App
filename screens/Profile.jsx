import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import {
  getProfileSettings,
  getSavedJobs,
} from '../utils/storage';
import { buildProfileAvatarUrl } from '../utils/imageSources';
import SidebarMenu from '../components/SidebarMenu';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import { subscribeToApplicantApplications } from '../utils/applicationsFirestore';


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
};

const ProfileScreen = ({navigation}) => {
  const [profile, setProfile] = useState({
    fullName: 'Alex Morgan',
    headline: 'Senior Product Designer',
    location: 'Mountain View, CA',
    about: '',
    skills: ['UX DESIGN', 'REACT NATIVE', 'FIGMA', 'LEADERSHIP', 'SYSTEMS THINKING'],
  });
  const [savedCount, setSavedCount] = useState(0);
  const [appliedCount, setAppliedCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const [nextProfile, savedJobs] = await Promise.all([
        getProfileSettings(),
        getSavedJobs(),
      ]);

      if (!isMounted) {
        return;
      }

      setProfile(nextProfile);
      setSavedCount(savedJobs.length);
    };

    void hydrate();

    const focusUnsubscribe = navigation.addListener('focus', () => {
      void hydrate();
    });

    return () => {
      isMounted = false;
      focusUnsubscribe();
    };
  }, [navigation]);

  useEffect(() => {
    const applicantId = auth.currentUser?.uid ?? null;
    const unsubscribe = subscribeToApplicantApplications({
      applicantId,
      onData: (applications) => setAppliedCount(applications.length),
      onError: (error) => console.error('Profile applications subscription error', error),
    });

    return unsubscribe;
  }, []);

  const avatarSource = useMemo(
    () => ({ uri: buildProfileAvatarUrl(profile.fullName || 'Career Go User') }),
    [profile.fullName],
  );

  const handleOpenSidebar = () => setSidebarOpen(true);
  const handleCloseSidebar = () => setSidebarOpen(false);
  const navigateFromSidebar = (routeName) => {
    handleCloseSidebar();
    navigation.navigate(routeName);
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setLogoutLoading(false);
      setLogoutModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SidebarMenu
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        navigation={navigation}
        activeRoute="Profile"
        onItemPress={(item) => navigateFromSidebar(item.route)}
      />
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenSidebar}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.logoText}>Career Go</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="notifications-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={avatarSource}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton}>
              <MaterialCommunityIcons name="pencil" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{profile.fullName}</Text>
          <Text style={styles.userRole}>{profile.headline}</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.secondary} />
            <Text style={styles.locationText}>{profile.location}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1.5 }]}>
             <View style={styles.statIconContainer}>
               <MaterialCommunityIcons name="eye-outline" size={20} color={COLORS.primary} />
             </View>
             <View>
               <Text style={styles.statValue}>1.2k</Text>
               <Text style={styles.statLabel}>Profile Views</Text>
             </View>
          </View>
          <View style={styles.statCardSmallRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{appliedCount}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{savedCount}</Text>
              <Text style={styles.statLabel}>Saved Jobs</Text>
            </View>
          </View>
        </View>

        {/* About Me */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <TouchableOpacity>
              <MaterialCommunityIcons name="information-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionBody}>
            {profile.about}
          </Text>
        </View>

        {/* Experience */}
        <Text style={styles.listSectionTitle}>Experience</Text>
        <View style={styles.jobItem}>
          <View style={styles.jobIconContainer}>
            <MaterialCommunityIcons name="office-building" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.jobInfo}>
            <View style={styles.jobInfoHeader}>
              <Text style={styles.jobTitle}>Lead Designer</Text>
              <Text style={styles.jobDuration}>Present</Text>
            </View>
            <Text style={styles.jobCompany}>Google • Full-time</Text>
            <Text style={styles.jobDate}>Aug 2021 - Now • 2 yrs 8 mos</Text>
          </View>
        </View>

        <View style={styles.jobItem}>
          <View style={styles.jobIconContainer}>
            <MaterialCommunityIcons name="office-building" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.jobInfo}>
            <View style={styles.jobInfoHeader}>
              <Text style={styles.jobTitle}>UX Designer</Text>
              <Text style={styles.jobDuration}>3 yrs</Text>
            </View>
            <Text style={styles.jobCompany}>Airbnb • Contract</Text>
            <Text style={styles.jobDate}>Jan 2018 - Jul 2021</Text>
          </View>
        </View>

        {/* Skills */}
        <Text style={styles.listSectionTitle}>Skills</Text>
        <View style={styles.skillsCloud}>
          {profile.skills.map((skill, index) => (
            <View key={index} style={[styles.skillTag, skill === 'SYSTEMS THINKING' ? styles.skillTagSecondary : styles.skillTagPrimary]}>
              <Text style={[styles.skillTagText, skill === 'SYSTEMS THINKING' ? styles.skillTagTextSecondary : styles.skillTagTextPrimary]}>
                {skill}
              </Text>
            </View>
          ))}
        </View>

        {/* Action Links */}
        <View style={styles.actionLinksContainer}>
          <TouchableOpacity style={styles.actionLink} onPress={() => navigation.navigate('EditProfile')}>
            <View style={styles.actionLinkLeft}>
              <MaterialCommunityIcons name="account-edit-outline" size={22} color={COLORS.primary} />
              <Text style={styles.actionLinkText}>Edit Profile</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionLink} onPress={() => navigation.navigate('ResumeSettings')}>
            <View style={styles.actionLinkLeft}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color={COLORS.primary} />
              <Text style={styles.actionLinkText}>Resume Settings</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionLink} onPress={() => navigation.navigate('PrivacySettings')}>
            <View style={styles.actionLinkLeft}>
              <MaterialCommunityIcons name="shield-outline" size={22} color={COLORS.primary} />
              <Text style={styles.actionLinkText}>Privacy</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionLink, styles.logoutLink]} onPress={() => setLogoutModalVisible(true)}>
            <View style={styles.actionLinkLeft}>
              <MaterialCommunityIcons name="logout" size={22} color="#D32F2F" />
              <Text style={[styles.actionLinkText, { color: '#D32F2F' }]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}onPress={() => navigation.navigate('Home')}>
          <MaterialCommunityIcons name="home-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Search')}>
          <MaterialCommunityIcons name="magnify" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Application')}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Apps</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.activeNavIndicator}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primary} />
            <Text style={styles.navLabelActive}>Profile</Text>
          </View>
        </TouchableOpacity>
      </View>

      <LogoutConfirmModal
        visible={logoutModalVisible}
        loading={logoutLoading}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleLogoutConfirm}
      />
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.white,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: COLORS.surfaceContainer,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  statsRow: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statCardSmallRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#E2E7F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionBody: {
    fontSize: 14,
    color: COLORS.secondary,
    lineHeight: 22,
  },
  listSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
  },
  jobItem: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    flexDirection: 'row',
    gap: 16,
  },
  jobIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#E2E7F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobInfo: {
    flex: 1,
  },
  jobInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jobDuration: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  jobCompany: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  jobDate: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  skillsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  skillTagPrimary: {
    backgroundColor: '#E2E7F9',
  },
  skillTagSecondary: {
    backgroundColor: '#E5E7EB',
  },
  skillTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  skillTagTextPrimary: {
    color: COLORS.primary,
  },
  skillTagTextSecondary: {
    color: '#1F2937',
  },
  actionLinksContainer: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    overflow: 'hidden',
  },
  actionLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  actionLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  logoutLink: {
    borderBottomWidth: 0,
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

export default ProfileScreen;
