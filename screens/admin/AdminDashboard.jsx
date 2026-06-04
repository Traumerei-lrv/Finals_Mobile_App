import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteApp, getApp, getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, initializeAuth, signOut as signOutSecondary } from 'firebase/auth';
import { View, Text, StyleSheet, ActivityIndicator, TextInput, Button, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Platform } from 'react-native';
import AdminSidebarMenu from '../../components/AdminSidebarMenu';
import { getPlatformMetrics } from '../../utils/adminHelpers';
import app, { auth, db, firebaseConfig } from '../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, doc, getDocs, getFirestore, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

function formatTimestamp(value) {
  if (!value) return '—';
  if (value.toDate && typeof value.toDate === 'function') {
    try {
      return value.toDate().toLocaleString();
    } catch (error) {
      return '—';
    }
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? value : new Date(parsed).toLocaleString();
  }
  try {
    return String(value);
  } catch (error) {
    return '—';
  }
}

function getUserName(user) {
  const profile = user?.profile || {};
  const firstLastName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  return (
    profile.fullName ||
    user?.displayName ||
    profile.displayName ||
    profile.name ||
    firstLastName ||
    profile.email ||
    user?.email ||
    '—'
  );
}

function getUserEmail(user) {
  return user?.email || user?.profile?.email || '—';
}

function getUserRole(user) {
  return user?.role || user?.profile?.role || '—';
}

function isUserDeleted(user) {
  return Boolean(user?.profile?.deletedAt);
}

function getUserStatus(user) {
  if (isUserDeleted(user)) return 'Deleted';
  if (user?.disabled) return 'Disabled';
  return 'Active';
}

function isCurrentAdminUser(uid) {
  return auth.currentUser?.uid === uid;
}

export default function AdminDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
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
  const [creatingUser, setCreatingUser] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [createErrorMessage, setCreateErrorMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      }).sort((a, b) => {
        const ta = a.creationTime && a.creationTime !== '—' ? Date.parse(a.creationTime) || 0 : 0;
        const tb = b.creationTime && b.creationTime !== '—' ? Date.parse(b.creationTime) || 0 : 0;
        return tb - ta;
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
    return {
      ...u,
      creationTime: formatTimestamp(u.creationTime),
      lastSignInTime: formatTimestamp(u.lastSignInTime),
    };
  }

  function applyFilters() {
    const q = searchText.trim().toLowerCase();
    return users.filter((u) => {
      if (filterRole !== 'all') {
        const r = getUserRole(u).toLowerCase();
        if (r !== filterRole) return false;
      }
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && u.disabled) return false;
        if (filterStatus === 'disabled' && !u.disabled) return false;
        if (filterStatus === 'deleted' && !isUserDeleted(u)) return false;
        if (filterStatus === 'active' && isUserDeleted(u)) return false;
        if (filterStatus === 'disabled' && isUserDeleted(u)) return false;
      }
      if (!q) return true;
      const name = getUserName(u).toLowerCase();
      const email = getUserEmail(u).toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }

  const filteredUsers = applyFilters();
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const pagedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const selectedCount = selectedIds.size;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  function resetCreateForm() {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setRole('job_seeker');
  }

  function getCreateUserErrorMessage(error) {
    const code = error?.code || '';
    if (
      code === 'auth/email-already-in-use' ||
      code === 'functions/already-exists' ||
      String(error?.message || '').toLowerCase().includes('email-already-in-use')
    ) {
      return 'This email is already in use.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters.';
    }
    return 'Failed to create user.';
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
      setCreateErrorMessage('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setCreateErrorMessage('Password must be at least 6 characters.');
      return;
    }
    try {
      setCreateErrorMessage('');
      setCreatingUser(true);

      if (functionsClient) {
        const adminCreate = httpsCallable(functionsClient, 'adminCreateUser');
        const res = await adminCreate({ email, password, displayName, role });
        if (res.data && res.data.success) {
          resetCreateForm();
          setSuccessMessage('Account created successfully in Firebase Authentication and Firestore.');
          setCreateErrorMessage('');
          setSuccessModalVisible(true);
          Alert.alert('Success', 'Account created successfully.');
          fetchUsers();
          return;
        }
      }

      const isolatedAppName = `admin-create-${Date.now()}`;
      const secondaryApp = getApps().some((existingApp) => existingApp.name === isolatedAppName)
        ? getApp(isolatedAppName)
        : initializeApp(firebaseConfig, isolatedAppName);

      let secondaryAuth;
      if (Platform.OS === 'web') {
        secondaryAuth = getAuth(secondaryApp);
      } else {
        const { getReactNativePersistence } = require('firebase/auth');
        secondaryAuth = initializeAuth(secondaryApp, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      }

      try {
        const credential = await createUserWithEmailAndPassword(secondaryAuth, email.trim().toLowerCase(), password);
        const secondaryDb = getFirestore(secondaryApp);
        const uid = credential.user.uid;
        const normalizedName = displayName.trim();

        await setDoc(doc(secondaryDb, 'users', uid), {
          fullName: normalizedName || null,
          email: email.trim().toLowerCase(),
          role,
          createdAt: serverTimestamp(),
        }, { merge: true });

        if (role === 'recruiter') {
          await setDoc(doc(secondaryDb, 'recruiters', uid), {
            fullName: normalizedName || null,
            email: email.trim().toLowerCase(),
            contactPerson: normalizedName || null,
            createdAt: serverTimestamp(),
            verified: false,
          }, { merge: true });
        }

        resetCreateForm();
        setSuccessMessage('Account created successfully in Firebase Authentication and Firestore.');
        setCreateErrorMessage('');
        setSuccessModalVisible(true);
        Alert.alert('Success', 'Account created successfully.');
        fetchUsers();
      } finally {
        await signOutSecondary(secondaryAuth).catch(() => {});
        await deleteApp(secondaryApp).catch(() => {});
      }
    } catch (err) {
      console.error('create user error', err);
      setCreateErrorMessage(getCreateUserErrorMessage(err));
    } finally {
      setCreatingUser(false);
    }
  }

  async function toggleDisabled(uid, disabled) {
    try {
      if (isCurrentAdminUser(uid)) {
        Alert.alert('Blocked', 'You cannot deactivate or activate your own admin account from this dashboard.');
        return;
      }

      if (functionsClient) {
        const adminSet = httpsCallable(functionsClient, 'adminSetDisabled');
        const res = await adminSet({ uid, disabled });
        if (res.data && res.data.success) {
          fetchUsers();
        }
        return;
      }

      await updateDoc(doc(db, 'users', uid), {
        active: !disabled,
        updatedAt: serverTimestamp(),
      });
      fetchUsers();
    } catch (err) {
      console.error('toggleDisabled error', err);
      Alert.alert('Error', 'Failed to update user');
    }
  }

  async function handleDelete(uid) {
    if (isCurrentAdminUser(uid)) {
      Alert.alert('Blocked', 'You cannot delete your own admin account from this dashboard.');
      return;
    }

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <AdminSidebarMenu
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        activeRoute="AdminDashboard"
      />
      <KeyboardAwareScrollView
        style={styles.flex}
        enableOnAndroid
        enableAutomaticScroll
        extraHeight={Platform.OS === 'ios' ? 24 : 140}
        extraScrollHeight={Platform.OS === 'ios' ? 24 : 140}
        keyboardOpeningTime={0}
        contentContainerStyle={[styles.inner, { paddingBottom: 120 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
            <MaterialCommunityIcons name="menu" size={22} color="#1a365d" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Platform overview and KPIs</Text>
          </View>
        </View>

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
              {!!successMessage && (
                <View style={styles.successBanner}>
                  <Text style={styles.successBannerText}>{successMessage}</Text>
                </View>
              )}
              {!!createErrorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{createErrorMessage}</Text>
                </View>
              )}
              <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => setShowCreate((s) => !s)} style={styles.addButton}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>{showCreate ? 'Close' : 'Add Account'}</Text>
                </TouchableOpacity>
              </View>

              {showCreate && (
                <View style={{ marginTop: 8 }}>
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
                  <Button title={creatingUser ? 'Creating...' : 'Create Account'} onPress={handleCreateUser} disabled={creatingUser} />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Users</Text>
              <Text style={styles.resultsText}>
                {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'} found
                {selectedCount ? ` • ${selectedCount} selected` : ''}
              </Text>
              <View style={styles.usersToolbar}>
                <View style={styles.searchRow}>
                  <TextInput
                    placeholder="Search name or email"
                    value={searchText}
                    onChangeText={(t) => { setSearchText(t); setCurrentPage(1); }}
                    style={[styles.input, styles.searchInput]}
                  />
                  <TouchableOpacity onPress={selectAllOnPage} style={styles.smallButton}>
                    <Text>Select page</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.controlsGrid}>
                  <View style={styles.controlCard}>
                    <Text style={styles.controlLabel}>Role Filter</Text>
                    <View style={styles.chipRow}>
                      <TouchableOpacity onPress={() => { setFilterRole('all'); setCurrentPage(1); }} style={[styles.roleButton, filterRole === 'all' && styles.roleActive]}><Text>All</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setFilterRole('job_seeker'); setCurrentPage(1); }} style={[styles.roleButton, filterRole === 'job_seeker' && styles.roleActive]}><Text>Job Seeker</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setFilterRole('recruiter'); setCurrentPage(1); }} style={[styles.roleButton, filterRole === 'recruiter' && styles.roleActive]}><Text>Recruiter</Text></TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.controlCard}>
                    <Text style={styles.controlLabel}>Status Filter</Text>
                    <View style={styles.chipRow}>
                      <TouchableOpacity onPress={() => { setFilterStatus('all'); setCurrentPage(1); }} style={[styles.roleButton, filterStatus === 'all' && styles.roleActive]}><Text>All</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setFilterStatus('active'); setCurrentPage(1); }} style={[styles.roleButton, filterStatus === 'active' && styles.roleActive]}><Text>Active</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setFilterStatus('disabled'); setCurrentPage(1); }} style={[styles.roleButton, filterStatus === 'disabled' && styles.roleActive]}><Text>Disabled</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setFilterStatus('deleted'); setCurrentPage(1); }} style={[styles.roleButton, filterStatus === 'deleted' && styles.roleActive]}><Text>Deleted</Text></TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.controlCard}>
                    <Text style={styles.controlLabel}>Items Per Page</Text>
                    <View style={styles.chipRow}>
                      <TouchableOpacity onPress={() => { setItemsPerPage(10); setCurrentPage(1); }} style={[styles.roleButton, itemsPerPage === 10 && styles.roleActive]}><Text>10</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setItemsPerPage(25); setCurrentPage(1); }} style={[styles.roleButton, itemsPerPage === 25 && styles.roleActive]}><Text>25</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => { setItemsPerPage(50); setCurrentPage(1); }} style={[styles.roleButton, itemsPerPage === 50 && styles.roleActive]}><Text>50</Text></TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {loadingUsers ? (
                <ActivityIndicator style={{ marginTop: 12 }} />
              ) : (
                <>
                  {pagedUsers.length === 0 ? (
                    <Text style={{ marginTop: 12, color: '#666' }}>No users found.</Text>
                  ) : (
                    <View style={{ marginTop: 12 }}>
                      {pagedUsers.map((item) => {
                        const status = getUserStatus(item);
                        const isSelf = isCurrentAdminUser(item.uid);
                        return (
                          <View key={item.uid} style={styles.userCard}>
                            <View style={styles.userCardHeader}>
                              <TouchableOpacity onPress={() => toggleSelect(item.uid)} style={styles.checkbox}>
                                <Text>{selectedIds.has(item.uid) ? '☑' : '☐'}</Text>
                              </TouchableOpacity>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.userName}>{getUserName(item)}</Text>
                                <Text style={styles.userEmail}>{getUserEmail(item)}</Text>
                                {isSelf && (
                                  <Text style={styles.selfTag}>Current admin account</Text>
                                )}
                              </View>
                              <View style={[styles.statusPill, status === 'Deleted' && styles.statusDeleted, status === 'Disabled' && styles.statusDisabled]}>
                                <Text style={styles.statusText}>{status}</Text>
                              </View>
                            </View>

                            <View style={styles.metaBlock}>
                              <Text style={styles.metaLabel}>UID</Text>
                              <Text style={styles.metaValue}>{item.uid}</Text>
                            </View>

                            <View style={styles.metaBlock}>
                              <Text style={styles.metaLabel}>Role</Text>
                              <Text style={styles.metaValue}>{getUserRole(item)}</Text>
                            </View>

                            <View style={styles.metaRow}>
                              <View style={styles.metaCol}>
                                <Text style={styles.metaLabel}>Last sign in</Text>
                                <Text style={styles.metaValue}>{item.lastSignInTime}</Text>
                              </View>
                              <View style={styles.metaCol}>
                                <Text style={styles.metaLabel}>Created</Text>
                                <Text style={styles.metaValue}>{item.creationTime}</Text>
                              </View>
                            </View>

                            <View style={styles.userActions}>
                              <TouchableOpacity onPress={() => toggleDisabled(item.uid, !item.disabled)} style={[styles.smallButton, isSelf && styles.actionDisabled]} disabled={isSelf}>
                                <Text style={isSelf && styles.actionDisabledText}>{item.disabled ? 'Activate' : 'Deactivate'}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDelete(item.uid)} style={[styles.smallButton, { borderColor: '#f8d7da' }, isSelf && styles.actionDisabled]} disabled={!functionsClient || isSelf}>
                                <Text style={[{ color: 'red' }, isSelf && styles.actionDisabledText]}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
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
      </KeyboardAwareScrollView>
      {successModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Account Created</Text>
            <Text style={styles.modalMessage}>
              {successMessage || 'The new user account was created successfully in Firebase Authentication and Firestore.'}
            </Text>
            <TouchableOpacity onPress={() => { setSuccessModalVisible(false); setSuccessMessage(''); }} style={styles.modalButton}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  flex: { flex: 1 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 54, 93, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 1000,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e6eaf8',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1a365d' },
  modalMessage: { marginTop: 10, color: '#5d7291', lineHeight: 22 },
  modalButton: {
    marginTop: 18,
    backgroundColor: '#1e88ff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: { color: '#fff', fontWeight: '800' },
  successBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cfe8d6',
    backgroundColor: '#edf9f0',
  },
  successBannerText: {
    color: '#21663a',
    fontWeight: '700',
    lineHeight: 20,
  },
  errorBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f3c7cd',
    backgroundColor: '#fff1f3',
  },
  errorBannerText: {
    color: '#9f1239',
    fontWeight: '700',
    lineHeight: 20,
  },
  inner: { padding: 20, paddingBottom: 36 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe5f7',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
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
  resultsText: { color: '#243256', marginTop: 10, fontWeight: '700' },
  usersToolbar: { marginTop: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 240, marginBottom: 0 },
  controlsGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  controlCard: {
    flexGrow: 1,
    minWidth: 220,
    backgroundColor: '#f8faff',
    borderWidth: 1,
    borderColor: '#e6eefc',
    borderRadius: 10,
    padding: 12,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5d7291',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderColor: '#e6eaf8', padding: 8, borderRadius: 6, marginBottom: 8, backgroundColor: '#fff' },
  roleButton: { padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e6eaf8', backgroundColor: '#fff' },
  roleActive: { backgroundColor: '#e6f0ff', borderColor: '#9fc3ff' },
  userCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef2ff',
    borderRadius: 10,
    backgroundColor: '#fbfcff',
    marginBottom: 12,
  },
  userCardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { marginRight: 12, paddingTop: 2 },
  userName: { fontWeight: '800', color: '#1a365d', fontSize: 15 },
  userEmail: { color: '#5d7291', marginTop: 4 },
  selfTag: { color: '#1a365d', marginTop: 6, fontSize: 12, fontWeight: '700' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#e6f7eb',
    marginLeft: 8,
  },
  statusDisabled: { backgroundColor: '#fff4d8' },
  statusDeleted: { backgroundColor: '#fde8e8' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#243256' },
  metaBlock: { marginTop: 12 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 12, fontWeight: '700', color: '#5d7291', textTransform: 'uppercase' },
  metaValue: { marginTop: 4, color: '#243256' },
  userActions: { marginTop: 14, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  smallButton: { padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center' },
  actionDisabled: { opacity: 0.5 },
  actionDisabledText: { color: '#7a8599' },
  deleteButton: { borderColor: '#f8d7da' },
  deleteButtonText: { color: 'red' },
  addButton: { backgroundColor: '#1e88ff', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
});
