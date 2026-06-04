const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Set a default role for newly created users and write a users doc for easy UI reads
exports.setDefaultRole = functions.auth.user().onCreate(async (user) => {
  const role = 'job_seeker';
  try {
    await admin.auth().setCustomUserClaims(user.uid, { role });
    await admin.firestore().collection('users').doc(user.uid).set({ role }, { merge: true });
    console.log(`Set default role '${role}' for user ${user.uid}`);
  } catch (err) {
    console.error('Error setting default role', err);
  }
});

// Callable function to allow admins to change a user's role
exports.setUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Request had no authentication.');
  }

  // Only allow callers with admin role to change roles
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set roles.');
  }

  const { uid, role } = data || {};
  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'Must provide uid and role');
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    await admin.firestore().collection('users').doc(uid).set({ role }, { merge: true });
    return { success: true };
  } catch (err) {
    console.error('Error setting user role', err);
    throw new functions.https.HttpsError('internal', 'Failed to set role');
  }
});

// Callable: create a new user (admin only)
exports.adminCreateUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Request had no authentication.');
  }
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can create users.');
  }

  const { email, password, displayName, role = 'job_seeker' } = data || {};
  if (!email || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'Must provide email and password');
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedName = displayName ? String(displayName).trim() : '';
    const userRecord = await admin.auth().createUser({
      email: normalizedEmail,
      password,
      displayName: normalizedName || undefined,
    });
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: normalizedEmail,
      displayName: normalizedName || null,
      fullName: normalizedName || null,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
    }, { merge: true });

    if (role === 'recruiter') {
      await admin.firestore().collection('recruiters').doc(userRecord.uid).set({
        email: normalizedEmail,
        fullName: normalizedName || null,
        contactPerson: normalizedName || null,
        verified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await admin.firestore().collection('admin_logs').add({
      action: 'createUser',
      actor: context.auth.uid,
      targetUid: userRecord.uid,
      payload: { email: normalizedEmail, role },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (err) {
    console.error('adminCreateUser error', err);
    throw new functions.https.HttpsError('internal', 'Failed to create user');
  }
});

// Callable: enable/disable (activate/deactivate) a user
exports.adminSetDisabled = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Request had no authentication.');
  }
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can change user active state.');
  }

  const { uid, disabled } = data || {};
  if (!uid || typeof disabled !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'Must provide uid and disabled boolean');
  }
  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError('failed-precondition', 'Admins cannot change the active state of their own account.');
  }

  try {
    await admin.auth().updateUser(uid, { disabled });
    await admin.firestore().collection('users').doc(uid).set({ active: !disabled, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    await admin.firestore().collection('admin_logs').add({
      action: disabled ? 'deactivateUser' : 'activateUser',
      actor: context.auth.uid,
      targetUid: uid,
      payload: { disabled },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (err) {
    console.error('adminSetDisabled error', err);
    throw new functions.https.HttpsError('internal', 'Failed to update user state');
  }
});

// Callable: delete a user (hard delete from auth, mark in Firestore)
exports.adminDeleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Request had no authentication.');
  }
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users.');
  }

  const { uid, soft = true } = data || {};
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'Must provide uid');
  }
  if (uid === context.auth.uid) {
    throw new functions.https.HttpsError('failed-precondition', 'Admins cannot delete their own account.');
  }

  try {
    if (soft) {
      await admin.firestore().collection('users').doc(uid).set({ deletedAt: admin.firestore.FieldValue.serverTimestamp(), active: false }, { merge: true });
    } else {
      await admin.auth().deleteUser(uid);
      await admin.firestore().collection('users').doc(uid).delete().catch(() => {});
    }

    await admin.firestore().collection('admin_logs').add({
      action: soft ? 'softDeleteUser' : 'deleteUser',
      actor: context.auth.uid,
      targetUid: uid,
      payload: { soft },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (err) {
    console.error('adminDeleteUser error', err);
    throw new functions.https.HttpsError('internal', 'Failed to delete user');
  }
});

// Callable: list users (limited) with merged Firestore profile data
exports.adminListUsers = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Request had no authentication.');
  }
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can list users.');
  }

  const { maxResults = 200 } = data || {};
  try {
    const list = await admin.auth().listUsers(Math.min(maxResults, 1000));
    const users = await Promise.all(list.users.map(async (u) => {
      const doc = await admin.firestore().collection('users').doc(u.uid).get().catch(() => null);
      const profile = doc && doc.exists ? doc.data() : {};
      return {
        uid: u.uid,
        email: u.email || null,
        displayName: u.displayName || null,
        disabled: u.disabled || false,
        lastSignInTime: u.metadata?.lastSignInTime || null,
        creationTime: u.metadata?.creationTime || null,
        role: (u.customClaims && u.customClaims.role) || profile.role || null,
        profile,
      };
    }));

    return { success: true, users };
  } catch (err) {
    console.error('adminListUsers error', err);
    throw new functions.https.HttpsError('internal', 'Failed to list users');
  }
});
