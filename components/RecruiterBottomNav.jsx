import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#8AB4F8',
};

const NAV_ITEMS = [
  {
    key: 'home',
    route: 'RecruiterDashboard',
    params: { tab: 'home' },
    icon: 'home',
    label: 'Home',
  },
  {
    key: 'post_job',
    route: 'RecruiterDashboard',
    params: { tab: 'post_job' },
    icon: 'plus-box-outline',
    label: 'Post Job',
  },
  {
    key: 'applicants',
    route: 'RecruiterDashboard',
    params: { tab: 'applicants' },
    icon: 'file-document-outline',
    label: 'Applicants',
  },
  {
    key: 'profile',
    route: 'RecruiterDashboard',
    params: { tab: 'profile' },
    icon: 'account-outline',
    label: 'Profile',
  },
];

const RecruiterBottomNav = ({ navigation, activeTab = 'home', showFab = true, onTabPress }) => {
  const insets = useSafeAreaInsets();

  const handlePress = (item) => {
    if (typeof onTabPress === 'function') {
      onTabPress(item.key);
      return;
    }

    navigation.navigate(item.route, item.params);
  };

  return (
    <>
      {showFab ? (
        <TouchableOpacity
          style={[styles.fab, { bottom: 100 + insets.bottom }]}
          onPress={() => handlePress(NAV_ITEMS[1])}
        >
          <MaterialCommunityIcons name="plus" size={32} color={COLORS.white} />
        </TouchableOpacity>
      ) : null}

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 12) }]}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;

          return (
            <TouchableOpacity key={item.key} style={styles.navItem} onPress={() => handlePress(item)}>
              <View style={isActive ? styles.activeNavIndicator : undefined}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={24}
                  color={isActive ? COLORS.primary : COLORS.secondary}
                />
                <Text style={isActive ? styles.navLabelActive : styles.navLabel}>{item.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
