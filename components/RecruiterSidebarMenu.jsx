import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1a365d',
  outline: '#cfdaf1',
  white: '#ffffff',
};

const MENU_ITEMS_BASE = [
  { key: 'archived', route: 'ArchivedApplications', label: 'Archived', icon: 'archive-outline' },
];

const ADMIN_ITEM = { key: 'admin', route: 'AdminDashboard', label: 'Admin', icon: 'shield-account-outline' };

export default function RecruiterSidebarMenu({ isOpen, onClose, navigation, activeRoute, onItemPress, showAdmin = false }) {
  const MENU_ITEMS = showAdmin ? [ADMIN_ITEM, ...MENU_ITEMS_BASE] : MENU_ITEMS_BASE;
  const handlePress = (item) => {
    if (typeof onItemPress === 'function') {
      onItemPress(item);
      return;
    }

    if (navigation?.navigate && item.route) {
      navigation.navigate(item.route);
    }

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <>
      {isOpen ? <TouchableOpacity style={styles.sidebarBackdrop} activeOpacity={1} onPress={onClose} /> : null}
      <View style={[styles.sidebar, isOpen && styles.sidebarOpen]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Menu</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.sidebarItem, activeRoute === item.route && styles.sidebarItemActive]}
            onPress={() => handlePress(item)}
          >
            <MaterialCommunityIcons name={item.icon} size={20} color={COLORS.primary} />
            <Text style={styles.sidebarItemText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sidebarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 24, 48, 0.28)',
    zIndex: 20,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    backgroundColor: COLORS.white,
    borderRightWidth: 1,
    borderRightColor: COLORS.outline,
    paddingTop: 56,
    paddingHorizontal: 18,
    zIndex: 30,
    transform: [{ translateX: -280 }],
  },
  sidebarOpen: {
    transform: [{ translateX: 0 }],
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sidebarItemActive: {
    backgroundColor: '#E2E7F9',
  },
  sidebarItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});