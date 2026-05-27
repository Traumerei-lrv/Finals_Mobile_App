import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  primary: '#1a365d',
  outline: '#cfdaf1',
  white: '#ffffff',
};

const MENU_ITEMS = [
  { key: 'saved', label: 'Saved Jobs', icon: 'bookmark-outline' },
  { key: 'applied', label: 'Applied', icon: 'file-document-outline' },
  { key: 'notifications', label: 'Notifications', icon: 'bell-outline' },
  { key: 'help', label: 'Help & Support', icon: 'help-circle-outline' },
];

export default function SidebarMenu({ isOpen, onClose, onItemPress }) {
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
          <TouchableOpacity key={item.key} style={styles.sidebarItem} onPress={() => onItemPress(item.key)}>
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
  sidebarItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
