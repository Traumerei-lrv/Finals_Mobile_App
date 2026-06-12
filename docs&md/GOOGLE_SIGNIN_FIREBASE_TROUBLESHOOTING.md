# Google Sign-In + Firebase Auth Troubleshooting Guide

This guide is focused on the integration pattern used in this repo: web OAuth on web, native Google Sign-In on Android and iOS, and Firebase Authentication as the final auth provider.

## Symptom: Google login works on web but fails on Android

Likely causes:

- The Android OAuth client ID does not match your app package, for example `com.example.app`
- The signing certificate SHA-1 is not registered in Google Cloud / Firebase
- The app is being opened in Expo Go instead of a dev build

What to check:

1. Confirm [app.json](../app.json) still uses the intended Android package, for example `com.example.app`.
2. Confirm [google-services.json](../google-services.json) contains the same package.
3. Confirm the Android OAuth client belongs to the same Firebase / Google Cloud project as the rest of your app.
4. Confirm the APK / dev build signing SHA-1 is added in Firebase / Google Cloud.
5. Confirm you are not testing inside Expo Go.

## Symptom: `DEVELOPER_ERROR`, `code 10`, or configuration mismatch on Android

This almost always means Google sees the wrong combination of:

- Android package name
- SHA-1 fingerprint
- Android OAuth client ID

Resolution:

1. Open the Android OAuth client in Google Cloud credentials.
2. Verify the package name matches your registered Android app, for example `com.example.app`.
3. Verify the SHA-1 belongs to the keystore used to sign the installed app.
4. Download or regenerate `google-services.json` if the Android app registration changed.
5. Rebuild the Android app.

## Symptom: Google popup closes but Firebase login never completes on web

Likely causes:

- `localhost` is missing from Firebase Auth authorized domains
- The web client ID is wrong
- The popup completed, but the app did not process the callback correctly

What to check:

1. Confirm `localhost` is authorized in Firebase Authentication.
2. Confirm the web client ID is the web OAuth client, not Android or iOS.
3. Confirm [screens/job_Seeker/LoginScreen.jsx](../screens/job_Seeker/LoginScreen.jsx) still calls `WebBrowser.maybeCompleteAuthSession()`.
4. Confirm `request` is available before calling `promptAsync`.

## Symptom: Google sign-in fails with “no ID token returned”

Likely causes:

- Native Google Sign-In was configured without the web client ID
- The wrong client ID type was passed into `webClientId`

Resolution:

1. Confirm `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set.
2. Confirm it is the web OAuth client.
3. Confirm native config still calls `GoogleSignin.configure({ webClientId, iosClientId, ... })`.

This repo depends on `webClientId` for native `idToken` retrieval.

## Symptom: Google sign-in button does nothing or stays loading on web

Likely causes:

- Expo environment variables were changed, but Expo was not restarted
- The auth request object is still `null`

Resolution:

1. Restart Expo after changing `.env`.
2. Clear cache if needed:

```bash
npx expo start --clear
```

3. Check whether the UI is showing the helper text that request loading has not completed.

## Symptom: Google sign-in fails only on iOS

Likely causes:

- iOS client ID is wrong
- `iosUrlScheme` does not match the reversed iOS client ID
- Bundle identifier changed and Google OAuth config was not updated

Resolution:

1. Confirm the iOS bundle ID matches your registered iOS app, for example `com.example.app`.
2. Confirm the iOS OAuth client was created for that bundle ID.
3. Confirm `iosUrlScheme` in [app.json](../app.json) matches the reversed iOS client ID.
4. Rebuild the iOS app after changing the plugin config.

## Symptom: Works in one teammate’s machine but not another

Likely causes:

- Different Firebase project
- Different `.env` values
- Different Android signing certificate
- One person is testing in Expo Go and another is using a dev build

Resolution:

1. Standardize the Firebase project ID across the whole team.
2. Standardize the Google OAuth client IDs.
3. Standardize the Android app package name.
4. Standardize the test method: web on browser, native on dev builds.

## Symptom: User signs in with Google but routing or profile logic breaks afterward

Likely causes:

- Firebase Auth succeeded, but profile creation or role data failed
- `users/{uid}` is missing or incomplete

What to check:

1. Confirm Firebase Auth shows the user account.
2. Confirm Firestore has a matching `users/{uid}` document.
3. Confirm the role field is present and valid.
4. Check [utils/ensureUserProfile.js](../utils/ensureUserProfile.js) and [context/AuthContext.jsx](../context/AuthContext.jsx).

## Symptom: `auth/account-exists-with-different-credential`

Meaning:

- The email already exists in Firebase under a different provider.

Resolution:

1. Sign in with the original provider first.
2. Link the Google credential to the existing account.
3. If needed, add a product decision for account linking UX.

This repo does not currently appear to implement a full account-linking flow, so this remains a valid edge case to handle later.

## Fast diagnostic order

When debugging, check in this order:

1. Are we testing web, Android, or iOS?
2. Are we in Expo Go or a dev build?
3. Are all three OAuth client IDs from the same Firebase / Google Cloud project?
4. Does Android package / iOS bundle match the OAuth client configuration?
5. Does Android SHA-1 match the installed build?
6. Does web have `localhost` authorized?
7. After config changes, was the app rebuilt and Expo restarted?

## Official references

- Expo AuthSession: https://docs.expo.dev/versions/v54.0.0/sdk/auth-session/
- Firebase Google Auth: https://firebase.google.com/docs/auth/web/google-signin
- React Native Google Sign-In: https://react-native-google-signin.github.io/docs/original
