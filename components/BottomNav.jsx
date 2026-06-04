import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  outline: '#cfdaf1',
  white: '#ffffff',
};

const NAV_ITEMS = [
  { key: 'home', route: 'JobSeekerDashboard', params: { tab: 'home' }, label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'search', route: 'JobSeekerDashboard', params: { tab: 'search' }, label: 'Search', icon: 'magnify', activeIcon: 'magnify' },
  { key: 'applications', route: 'JobSeekerDashboard', params: { tab: 'applications' }, label: 'Apps', icon: 'file-document-outline', activeIcon: 'file-document' },
  { key: 'profile', route: 'JobSeekerDashboard', params: { tab: 'profile' }, label: 'Profile', icon: 'account-outline', activeIcon: 'account' },
];

export default function BottomNav({ navigation, activeRoute, onTabPress }) {
  const insets = useSafeAreaInsets();

  const handlePress = (item) => {
    if (typeof onTabPress === 'function') {
      onTabPress(item.key);
      return;
    }

    navigation.navigate(item.route, item.params);
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 12) }]}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === activeRoute || item.route === activeRoute;

        return (
          <TouchableOpacity
            key={item.key}
            style={isActive ? styles.navItemActive : styles.navItem}
            onPress={() => handlePress(item)}
          >
            {isActive ? (
              <View style={styles.activeNavIndicator}>
                <MaterialCommunityIcons name={item.activeIcon} size={24} color={COLORS.primary} />
                <Text style={styles.navLabelActive}>{item.label}</Text>
              </View>
            ) : (
              <>
                <MaterialCommunityIcons name={item.icon} size={24} color={COLORS.secondary} />
                <Text style={styles.navLabel}>{item.label}</Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
