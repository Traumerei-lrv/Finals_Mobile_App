import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  outline: '#cfdaf1',
  white: '#ffffff',
};

const NAV_ITEMS = [
  { route: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { route: 'Search', label: 'Search', icon: 'magnify', activeIcon: 'magnify' },
  { route: 'Application', label: 'Apps', icon: 'file-document-outline', activeIcon: 'file-document' },
  { route: 'Profile', label: 'Profile', icon: 'account-outline', activeIcon: 'account' },
];

export default function BottomNav({ navigation, activeRoute }) {
  return (
    <View style={styles.bottomNav}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.route === activeRoute;

        return (
          <TouchableOpacity
            key={item.route}
            style={isActive ? styles.navItemActive : styles.navItem}
            onPress={() => navigation.navigate(item.route)}
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
