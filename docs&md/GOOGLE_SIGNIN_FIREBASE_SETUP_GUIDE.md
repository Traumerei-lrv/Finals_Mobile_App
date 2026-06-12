# Google Sign-In + Firebase Auth Setup Guide

This guide covers the full Google Sign-In flow from web OAuth to Android and iOS for an Expo SDK 54 app.

Sample reference configuration:

- Expo SDK: `54.0.33`
- App scheme: `exampleapp`
- Android package: `com.example.app`
- iOS bundle identifier: `com.example.app`
- Firebase project ID: `your-firebase-project-id`
- Firebase project number: `123456789012`

## 1. Understand the auth flow in this app

This project uses two Google sign-in paths:

- Web: `expo-auth-session` opens Google OAuth in the browser, then sends the Google ID token to Firebase with `signInWithCredential`.
- Android and iOS: `@react-native-google-signin/google-signin` handles native Google login, then sends the Google ID token to Firebase with `signInWithCredential`.

That means all Google OAuth client IDs must belong to the same Firebase / Google Cloud project.

## 2. Firebase console setup

In your Firebase project:

1. Open Authentication.
2. Enable `Email/Password`.
3. Enable `Google`.
4. Set the Google provider support email.
5. In Authentication settings, make sure your development domains are authorized for web testing.

For local web testing, `localhost` must be in Firebase Auth authorized domains.

## 3. Create the required OAuth client IDs

Create or verify these three Google OAuth clients in the same project:

- Web client
- Android client
- iOS client

Sample client IDs for documentation only:

- Web client ID: `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com`
- Android client ID: `YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com`
- iOS client ID: `YOUR_IOS_CLIENT_ID.apps.googleusercontent.com`

Important mapping:

- `webClientId` must be the web client, not the Android client.
- Android OAuth client must match your app package, for example `com.example.app`.
- iOS OAuth client must match your app bundle ID, for example `com.example.app`.

## 4. Android setup

Your app should include [google-services.json](../google-services.json), and it should match:

- Package: `com.example.app`
- Project number: `123456789012`
- SHA-1 hash registered for one Android client

Checklist:

1. Keep `app.json` Android package aligned with your Android OAuth client, for example `com.example.app`.
2. Keep `android.googleServicesFile` pointed to `./google-services.json`.
3. If you install the app with a different signing key than the one registered in Google Cloud, add that SHA-1 too.
4. Rebuild the Android app after changing package name, SHA-1, or plugin config.

## 5. iOS setup

This Expo app uses the Google Sign-In config plugin and an iOS URL scheme in `app.json`.

Current plugin config:

- Plugin: `@react-native-google-signin/google-signin`
- `iosUrlScheme`: `com.googleusercontent.apps.YOUR_REVERSED_IOS_CLIENT_ID`

Checklist:

1. Keep `ios.bundleIdentifier` aligned with your iOS OAuth client, for example `com.example.app`.
2. Keep the iOS OAuth client ID aligned with that bundle ID.
3. Keep `iosUrlScheme` equal to the reversed iOS client ID from Google.
4. Rebuild the iOS native app after changing the plugin config.

## 6. Expo app config requirements

The current [app.json](../app.json) already includes what this flow needs:

- `scheme: "exampleapp"`
- Android package
- iOS bundle identifier
- Google Sign-In config plugin
- `expo-web-browser`
- `expo-dev-client`

The custom scheme matters for browser-based auth return handling.

## 7. Environment variables

Create a root `.env` file with:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
```

Why this matters:

- Web sign-in needs the web client ID.
- Native sign-in still needs the web client ID to return an `idToken`.
- iOS native config also uses the iOS client ID.

## 8. Install dependencies

```bash
npm install
```

This repo already depends on:

- `firebase`
- `expo-auth-session`
- `expo-crypto`
- `expo-web-browser`
- `@react-native-google-signin/google-signin`
- `expo-dev-client`

## 9. Build and run correctly

For mobile Google Sign-In, do not use Expo Go.

Use:

```bash
npm run start:dev-client
```

Then run a development build on the target platform.

Use web separately with:

```bash
npm run web
```

## 10. Code path to verify

The main Google sign-in logic is in [screens/job_Seeker/LoginScreen.jsx](../screens/job_Seeker/LoginScreen.jsx).

What to verify there:

- `WebBrowser.maybeCompleteAuthSession()` is called for web popup completion.
- Web uses `Google.useIdTokenAuthRequest`.
- Native calls `GoogleSignin.configure(...)` before sign-in.
- Native passes `webClientId` into `GoogleSignin.configure(...)`.
- Both paths end with `GoogleAuthProvider.credential(idToken)`.
- Both paths sign into Firebase using `signInWithCredential(auth, credential)`.

## 11. Test checklist

Test these separately:

1. Web login on `localhost`
2. Android login on a dev build
3. iOS login on a dev build
4. Existing user login
5. New Google user first login
6. Sign out and sign in again

Expected success result:

- Firebase Auth user is created or signed in
- `users/{uid}` exists or is created
- Role routing continues correctly inside the app

## 12. Official references

- Expo AuthSession: https://docs.expo.dev/versions/v54.0.0/sdk/auth-session/
- Firebase Google Auth: https://firebase.google.com/docs/auth/web/google-signin
- React Native Google Sign-In: https://react-native-google-signin.github.io/docs/original
