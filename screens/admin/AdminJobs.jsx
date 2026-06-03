import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';

export default function AdminJobs() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Jobs Management</Text>
        <Text style={styles.subtitle}>Create, edit and manage job postings.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9ff' },
  inner: { padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#1a365d' },
  subtitle: { marginTop: 8, color: '#5d7291' },
});
