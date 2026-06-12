# How We Resolve Common Google Sign-In Problems

This document captures common integration problems teams hit during development.

## Problem 1: We mixed web OAuth and native OAuth without separating their roles

What happened:

- Web sign-in and native sign-in were treated like the same setup problem.
- In reality, they need different Google client IDs even though both end in Firebase Auth.

How we resolve it:

- Web uses the web OAuth client ID.
- Android uses the Android OAuth client ID for the package and SHA-1.
- iOS uses the iOS OAuth client ID for the bundle identifier.
- Native Google Sign-In still receives the web client ID so it can return an `idToken` for Firebase.

Rule to keep:

- Never swap the client ID types.

## Problem 2: We tried to test native Google Sign-In in Expo Go

What happened:

- Expo Go does not include the native Google Sign-In module used by this app.
- The app code already guards against this case.

How we resolve it:

- Test web auth in the browser.
- Test Android and iOS Google auth only in a development build or production build.
- Use `npm run start:dev-client` for mobile auth testing.

Rule to keep:

- Expo Go is not a valid test target for this Google native flow.

## Problem 3: Android failed with `DEVELOPER_ERROR`, `code 10`, or a package / SHA-1 mismatch

What happened:

- Android Google Sign-In breaks when package name, SHA-1, and Android OAuth client do not describe the same app.

How we resolve it:

- Keep the Android package name fixed and aligned with the registered Android OAuth client, for example `com.example.app`.
- Register the SHA-1 for the keystore used to sign the installed build.
- Keep the Android OAuth client in the same Firebase / Google Cloud project as Firebase Auth.
- Rebuild the app after changes.

Rule to keep:

- If Android changes signing key or package name, update Google credentials before testing.

## Problem 4: Native Google sign-in returned no ID token

What happened:

- Firebase cannot sign in with Google unless native sign-in returns an ID token.
- The native library requires the web client ID to provide that token.

How we resolve it:

- Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- Pass that value into `GoogleSignin.configure({ webClientId })`.
- Keep it from the same project as Firebase.

Rule to keep:

- If there is no ID token, check the web client ID first.

## Problem 5: Web auth opened, but the app did not finish the sign-in

What happened:

- Browser-based auth can appear to work, but the app still fails if callback handling or authorized domains are wrong.

How we resolve it:

- Keep `localhost` authorized in Firebase Auth for local web testing.
- Keep `WebBrowser.maybeCompleteAuthSession()` in the login screen.
- Keep the Expo scheme configured in `app.json`.

Rule to keep:

- Web OAuth success is not enough; the app must also complete the callback and exchange the token with Firebase.

## Problem 6: iOS config drifted from the OAuth setup

What happened:

- iOS Google sign-in is sensitive to the bundle identifier and reversed URL scheme.

How we resolve it:

- Keep the bundle ID fixed and aligned with the registered iOS OAuth client, for example `com.example.app`.
- Keep iOS OAuth client ID aligned with that bundle.
- Keep `iosUrlScheme` equal to the reversed iOS client ID.
- Rebuild after plugin changes.

Rule to keep:

- If iOS fails alone, check bundle ID and URL scheme before anything else.

## Problem 7: We fixed auth, but user role routing still looked broken

What happened:

- Google sign-in may succeed, but the app also depends on Firestore user profile data for routing and role behavior.

How we resolve it:

- Confirm Firebase Auth user creation succeeded.
- Confirm `users/{uid}` exists.
- Confirm role data is valid.
- Keep `ensureUserProfile` and `AuthContext` behavior in mind during debugging.

Rule to keep:

- Auth success and app success are not always the same thing.

## Final team checklist

Before saying the issue is fixed, confirm all of these:

1. Firebase Auth has Google enabled.
2. All OAuth client IDs belong to the same Firebase / Google Cloud project.
3. Web, Android, and iOS client IDs are not swapped.
4. Android package matches the registered Android app.
5. Android SHA-1 matches the installed build.
6. iOS bundle ID matches the registered iOS app.
7. `iosUrlScheme` matches the reversed iOS client ID.
8. `.env` values are loaded.
9. Web is tested in browser.
10. Mobile is tested in dev build, not Expo Go.

## Official references

- Expo AuthSession: https://docs.expo.dev/versions/v54.0.0/sdk/auth-session/
- Firebase Google Auth: https://firebase.google.com/docs/auth/web/google-signin
- React Native Google Sign-In: https://react-native-google-signin.github.io/docs/original
