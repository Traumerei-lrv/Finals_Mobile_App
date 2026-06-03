import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getPlatformMetrics } from '../../utils/adminHelpers';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await getPlatformMetrics();
        if (mounted) setMetrics(m);
      } catch (err) {
        // ignore for now
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Platform overview and KPIs</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.kpiRow}>
            <KpiCard label="Total Jobs" value={String(metrics.totalJobs)} />
            <KpiCard label="Open Jobs" value={String(metrics.openJobs)} />
            <KpiCard label="Applications" value={String(metrics.totalApplications)} />
            <KpiCard label="Pending" value={String(metrics.pendingApplications)} />
            <KpiCard label="Users" value={String(metrics.totalUsers)} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const KpiCard = ({ label, value }) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9ff' },
  inner: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a365d' },
  subtitle: { marginTop: 8, color: '#5d7291' },
  kpiRow: { marginTop: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: {
    width: '30%',
    minWidth: 100,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6eaf8',
    marginRight: 12,
    marginBottom: 12,
  },
  kpiValue: { fontSize: 20, fontWeight: '800', color: '#1a365d' },
  kpiLabel: { marginTop: 6, color: '#5d7291', fontWeight: '700', fontSize: 12 },
});
