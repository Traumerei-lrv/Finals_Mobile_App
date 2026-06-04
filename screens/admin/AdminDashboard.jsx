import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator, TextInput, Button, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { getPlatformMetrics } from '../../utils/adminHelpers';
import app, { db } from '../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // create-account form state
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('job_seeker');
  const [showCreate, setShowCreate] = useState(false);
  const [functionsClient, setFunctionsClient] = useState(null);

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

    // initialize callable functions and attempt to fetch users via callable;
    // if the callable fails (not deployed), gracefully fall back to Firestore
    let fn = null;
    try {
      fn = getFunctions(app);
    } catch (e) {
      console.warn('Failed to init Functions client', e);
      fn = null;
    }

    // fetch users after functions client initialization attempt
    fetchUsers(fn);

    return () => { mounted = false; };
  }, []);

  async function fetchUsers(client) {
    setLoadingUsers(true);
    try {
      const fn = client || functionsClient;
      if (fn) {
        // try callable; if it fails (functions not deployed), fall back to Firestore
        try {
          const adminList = httpsCallable(fn, 'adminListUsers');
          const res = await adminList({ maxResults: 200 });
          if (res.data && res.data.success) {
            // enable functionsClient for admin actions
            setFunctionsClient(fn);
            // sort by creation time desc when available
            const fetched = (res.data.users || []).sort((a, b) => {
              const ta = a.creationTime ? new Date(a.creationTime).getTime() : 0;
              const tb = b.creationTime ? new Date(b.creationTime).getTime() : 0;
              return tb - ta;
            }).map(normalizeUser);
            setUsers(fetched);
            return;
          }
        } catch (callErr) {
          console.warn('adminListUsers callable failed, falling back to Firestore', callErr);
          // ensure functions client not used for admin actions
          setFunctionsClient(null);
        }
      }

      // fallback: read Firestore `users` collection for display only
      const snap = await getDocs(collection(db, 'users'));
      const docs = snap.docs.map((d) => {
        const data = d.data();
        return normalizeUser({
          uid: d.id,
          email: data.email || null,
          displayName: data.displayName || null,
          role: data.role || null,
          profile: data,
          disabled: data.active === false,
          lastSignInTime: null,
          creationTime: data.createdAt ? data.createdAt.toDate?.() || data.createdAt : null,
        });
      });
      setUsers(docs);
    } catch (err) {
      console.error('fetchUsers failed', err);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }

  // normalize various timestamp formats to safe display strings
  function normalizeUser(u) {
    const fmt = (val) => {
      if (!val) return null;
      // Firestore Timestamp
      if (val.toDate && typeof val.toDate === 'function') {
        try { return val.toDate().toLocaleString(); } catch (e) { /* fallthrough */ }
      }
      if (val instanceof Date) return val.toLocaleString();
      if (typeof val === 'string') {
        const t = Date.parse(val);
        if (!isNaN(t)) return new Date(t).toLocaleString();
        return val;
      }
      try { return String(val); } catch (e) { return null; }
    };

    return {
      ...u,
      creationTime: fmt(u.creationTime) || '—',
      lastSignInTime: fmt(u.lastSignInTime) || '—',
    };
  }

  function applyFilters() {
    const q = searchText.trim().toLowerCase();
    return users.filter((u) => {
      if (filterRole !== 'all') {
        const r = (u.role || (u.profile && u.profile.role) || '').toLowerCase();
        if (r !== filterRole) return false;
      }
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && u.disabled) return false;
        if (filterStatus === 'disabled' && !u.disabled) return false;
        if (filterStatus === 'deleted' && !u.profile?.deletedAt) return false;
      }
      if (!q) return true;
      const name = (u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }

  const filteredUsers = applyFilters();
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const pagedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function toggleSelect(uid) {
    setSelectedIds((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  function selectAllOnPage() {
    const allIds = pagedUsers.map((u) => u.uid);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(Array.from(prev));
      if (allSelected) {
        allIds.forEach((id) => next.delete(id));
      } else {
        allIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function bulkSetDisabled(disabled) {
    if (selectedIds.size === 0) {
      Alert.alert('No selection', 'Select users first');
      return;
    }
    Alert.alert('Confirm', `${disabled ? 'Deactivate' : 'Activate'} ${selectedIds.size} accounts?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: async () => {
        try {
          if (!functionsClient) throw new Error('Functions client not initialized');
          const adminSet = httpsCallable(functionsClient, 'adminSetDisabled');
          await Promise.all(Array.from(selectedIds).map((uid) => adminSet({ uid, disabled })));
          setSelectedIds(new Set());
          fetchUsers();
        } catch (err) {
          console.error('bulkSetDisabled error', err);
          Alert.alert('Error', 'Bulk update failed');
        }
      } }
    ]);
  }

  async function bulkDelete(soft = true) {
    if (selectedIds.size === 0) {
      Alert.alert('No selection', 'Select users first');
      return;
    }
    Alert.alert('Confirm', `Delete ${selectedIds.size} accounts?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          if (!functionsClient) throw new Error('Functions client not initialized');
          const adminDelete = httpsCallable(functionsClient, 'adminDeleteUser');
          await Promise.all(Array.from(selectedIds).map((uid) => adminDelete({ uid, soft })));
          setSelectedIds(new Set());
          fetchUsers();
        } catch (err) {
          console.error('bulkDelete error', err);
          Alert.alert('Error', 'Bulk delete failed');
        }
      } }
    ]);
  }

  async function handleCreateUser() {
    if (!email || !password) {
      Alert.alert('Validation', 'Email and password are required');
      return;
    }
    try {
      if (!functionsClient) throw new Error('Functions client not initialized');
      const adminCreate = httpsCallable(functionsClient, 'adminCreateUser');
      const res = await adminCreate({ email, password, displayName, role });
      if (res.data && res.data.success) {
        Alert.alert('Success', 'User created');
        setEmail(''); setPassword(''); setDisplayName(''); setRole('job_seeker');
        fetchUsers();
      }
    } catch (err) {
      console.error('create user error', err);
      Alert.alert('Error', 'Failed to create user');
    }
  }

  async function toggleDisabled(uid, disabled) {
    try {
      if (!functionsClient) throw new Error('Functions client not initialized');
      const adminSet = httpsCallable(functionsClient, 'adminSetDisabled');
      const res = await adminSet({ uid, disabled });
      if (res.data && res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error('toggleDisabled error', err);
      Alert.alert('Error', 'Failed to update user');
    }
  }

  async function handleDelete(uid) {
    Alert.alert('Confirm', 'Delete this user (soft delete)?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          if (!functionsClient) throw new Error('Functions client not initialized');
          const adminDelete = httpsCallable(functionsClient, 'adminDeleteUser');
          const res = await adminDelete({ uid, soft: true });
          if (res.data && res.data.success) {
            fetchUsers();
          }
        } catch (err) {
          console.error('delete error', err);
          Alert.alert('Error', 'Failed to delete user');
        }
      } }
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Platform overview and KPIs</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <>
            <View style={styles.kpiRow}>
              <KpiCard label="Total Jobs" value={String(metrics.totalJobs)} />
              <KpiCard label="Open Jobs" value={String(metrics.openJobs)} />
              <KpiCard label="Applications" value={String(metrics.totalApplications)} />
              <KpiCard label="Pending" value={String(metrics.pendingApplications)} />
              <KpiCard label="Users" value={String(metrics.totalUsers)} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create Account</Text>
              <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setShowCreate((s) => !s)} style={styles.addButton}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{showCreate ? 'Close' : 'Add Account'}</Text>
                </TouchableOpacity>
              </View>

              {showCreate && (
                <ScrollView horizontal={false} style={{ marginTop: 8 }}>
                  <TextInput placeholder="Full name" value={displayName} onChangeText={setDisplayName} style={styles.input} />
                  <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
                  <TextInput placeholder="Temporary password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
                  <View style={{ marginVertical: 8 }}>
                    <Text style={{ marginBottom: 6 }}>Role</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => setRole('job_seeker')} style={[styles.roleButton, role === 'job_seeker' && styles.roleActive]}>
                        <Text>Job Seeker</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setRole('recruiter')} style={[styles.roleButton, role === 'recruiter' && styles.roleActive]}>
                        <Text>Recruiter</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Button title="Create Account" onPress={handleCreateUser} />
                </ScrollView>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Users</Text>
              {!functionsClient && (
                <Text style={{ color: 'crimson', marginTop: 8 }}>Warning: Admin Functions not initialized — user actions will be disabled until Functions are deployed.</Text>
              )}
              <Text style={{ color: '#666', marginTop: 8 }}>Note: For security, password values are not stored or retrievable and therefore are not displayed.</Text>
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput placeholder="Search name or email" value={searchText} onChangeText={(t) => { setSearchText(t); setCurrentPage(1); }} style={[styles.input, { flex: 1 }]} />
                <View style={{ marginLeft: 8 }}>
                  <TouchableOpacity onPress={selectAllOnPage} style={styles.smallButton}><Text>Select page</Text></TouchableOpacity>
                </View>
              </View>

              <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => { setFilterRole('all'); setCurrentPage(1); }} style={[styles.roleButton, filterRole === 'all' && styles.roleActive]}><Text>All</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setFilterRole('job_seeker'); setCurrentPage(1); }} style={[styles.roleButton, filterRole === 'job_seeker' && styles.roleActive]}><Text>Job Seeker</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setFilterRole('recruiter'); setCurrentPage(1); }} style={[styles.roleButton, filterRole === 'recruiter' && styles.roleActive]}><Text>Recruiter</Text></TouchableOpacity>
                <View style={{ width: 12 }} />
                <TouchableOpacity onPress={() => { setFilterStatus('all'); setCurrentPage(1); }} style={[styles.roleButton, filterStatus === 'all' && styles.roleActive]}><Text>All</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setFilterStatus('active'); setCurrentPage(1); }} style={[styles.roleButton, filterStatus === 'active' && styles.roleActive]}><Text>Active</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setFilterStatus('disabled'); setCurrentPage(1); }} style={[styles.roleButton, filterStatus === 'disabled' && styles.roleActive]}><Text>Disabled</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => { setFilterStatus('deleted'); setCurrentPage(1); }} style={[styles.roleButton, filterStatus === 'deleted' && styles.roleActive]}><Text>Deleted</Text></TouchableOpacity>
              </View>

              <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => bulkSetDisabled(false)} style={styles.smallButton}><Text>Activate</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => bulkSetDisabled(true)} style={styles.smallButton}><Text>Deactivate</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => bulkDelete(true)} style={[styles.smallButton, { borderColor: '#f8d7da' }]}><Text style={{ color: 'red' }}>Delete</Text></TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text>Per page:</Text>
                  <TouchableOpacity onPress={() => { setItemsPerPage(10); setCurrentPage(1); }} style={[styles.roleButton, itemsPerPage === 10 && styles.roleActive]}><Text>10</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => { setItemsPerPage(25); setCurrentPage(1); }} style={[styles.roleButton, itemsPerPage === 25 && styles.roleActive]}><Text>25</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => { setItemsPerPage(50); setCurrentPage(1); }} style={[styles.roleButton, itemsPerPage === 50 && styles.roleActive]}><Text>50</Text></TouchableOpacity>
                </View>
              </View>

              {loadingUsers ? (
                <ActivityIndicator style={{ marginTop: 12 }} />
              ) : (
                <>
                  {pagedUsers.length === 0 ? (
                    <Text style={{ marginTop: 12, color: '#666' }}>No users found.</Text>
                  ) : (
                    <FlatList
                      data={pagedUsers}
                      keyExtractor={(item) => item.uid}
                      renderItem={({ item }) => {
                        const fullName = item.displayName || item.profile?.fullName || item.profile?.name || ((item.profile?.firstName || '') + (item.profile?.lastName ? ' ' + item.profile.lastName : '')) || item.email || '—';
                        return (
                          <View style={styles.userRow}>
                            <TouchableOpacity onPress={() => toggleSelect(item.uid)} style={{ marginRight: 12 }}>
                              <Text>{selectedIds.has(item.uid) ? '☑' : '☐'}</Text>
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontWeight: '700' }}>{fullName}</Text>
                              <Text style={{ color: '#666' }}>{item.email || (item.profile && item.profile.email) || '—'}</Text>
                              <Text style={{ color: '#666' }}>Password: (not available)</Text>
                              <Text style={{ color: '#666' }}>{item.role || (item.profile && item.profile.role) || '—'}</Text>
                              <Text style={{ color: '#666' }}>Last sign in: {item.lastSignInTime || '—'}</Text>
                              <Text style={{ color: '#666' }}>Created: {item.creationTime || '—'}</Text>
                            </View>
                            <View style={{ justifyContent: 'center' }}>
                              <TouchableOpacity onPress={() => toggleDisabled(item.uid, !item.disabled)} style={styles.smallButton} disabled={!functionsClient}>
                                <Text>{item.disabled ? 'Activate' : 'Deactivate'}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDelete(item.uid)} style={[styles.smallButton, { marginTop: 8 }]} disabled={!functionsClient}>
                                <Text style={{ color: 'red' }}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      }}
                    />
                  )}

                  <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setCurrentPage((p) => Math.max(1, p - 1))} style={styles.roleButton}><Text>Prev</Text></TouchableOpacity>
                    <Text>Page {currentPage} / {totalPages}</Text>
                    <TouchableOpacity onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} style={styles.roleButton}><Text>Next</Text></TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </>
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
  section: { marginTop: 20, backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eef2ff' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#243256' },
  input: { borderWidth: 1, borderColor: '#e6eaf8', padding: 8, borderRadius: 6, marginBottom: 8, backgroundColor: '#fff' },
  roleButton: { padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e6eaf8', backgroundColor: '#fff' },
  roleActive: { backgroundColor: '#e6f0ff', borderColor: '#9fc3ff' },
  userRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f4fb', alignItems: 'center' },
  smallButton: { padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center' },
  addButton: { backgroundColor: '#1e88ff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
});
