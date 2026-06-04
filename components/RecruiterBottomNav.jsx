import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#8AB4F8',
};

const RecruiterBottomNav = ({ navigation, activeTab = 'home', showFab = true }) => {
  const goHome = () => navigation.navigate('RecruiterHome');
  const goPostJob = () => navigation.navigate('PostJob');
  const goApplicants = () => navigation.navigate('ApplicantsList');
  const goProfile = () => navigation.navigate('RecruiterProfile');

  return (
    <>
      {showFab ? (
        <TouchableOpacity style={styles.fab} onPress={goPostJob}>
          <MaterialCommunityIcons name="plus" size={32} color={COLORS.white} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={goHome}>
          <View style={activeTab === 'home' ? styles.activeNavIndicator : undefined}>
            <MaterialCommunityIcons
              name="home"
              size={24}
              color={activeTab === 'home' ? COLORS.primary : COLORS.secondary}
            />
            <Text style={activeTab === 'home' ? styles.navLabelActive : styles.navLabel}>Home</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={goPostJob}>
          <View style={activeTab === 'post_job' ? styles.activeNavIndicator : undefined}>
            <MaterialCommunityIcons
              name="plus-box-outline"
              size={24}
              color={activeTab === 'post_job' ? COLORS.primary : COLORS.secondary}
            />
            <Text style={activeTab === 'post_job' ? styles.navLabelActive : styles.navLabel}>Post Job</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={goApplicants}>
          <View style={activeTab === 'applicants' ? styles.activeNavIndicator : undefined}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={24}
              color={activeTab === 'applicants' ? COLORS.primary : COLORS.secondary}
            />
            <Text style={activeTab === 'applicants' ? styles.navLabelActive : styles.navLabel}>Applicants</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={goProfile}>
          <View style={activeTab === 'profile' ? styles.activeNavIndicator : undefined}>
            <MaterialCommunityIcons
              name="account-outline"
              size={24}
              color={activeTab === 'profile' ? COLORS.primary : COLORS.secondary}
            />
            <Text style={activeTab === 'profile' ? styles.navLabelActive : styles.navLabel}>Profile</Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#001d3d',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
  activeNavIndicator: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
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

export default RecruiterBottomNav;
