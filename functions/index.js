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
