Firebase Cloud Functions for role management

Deployment
1. Install dependencies: `cd functions && npm install`
2. Login and initialize firebase CLI if not already: `firebase login` and `firebase init functions` (choose existing project)
3. Deploy functions: `firebase deploy --only functions:setDefaultRole,functions:setUserRole`

Usage
- `setDefaultRole` runs automatically on new user signups and sets `role: 'job_seeker'` as a custom claim and writes `users/{uid}.role` in Firestore.
- `setUserRole` is a callable function that admins can invoke to change other users' roles. The caller must have `role: 'admin'` in their custom claims.

Notes
- Custom claims require a token refresh on the client to be visible (`getIdTokenResult(currentUser, true)`).
- Deploying functions requires the Firebase CLI and appropriate project permissions.
