# Build Guide

This guide documents a successful Expo SDK 54 build flow using sample values only.

Sample reference configuration:

- Expo SDK: `54.0.33`
- React Native: `0.81.5`
- App slug: `example-app`
- Android package: `com.example.app`
- iOS bundle identifier: `com.example.app`
- EAS project ID: `00000000-0000-0000-0000-000000000000`

## 1. Build approach we use

We use three build modes:

1. Development build for native feature testing
2. Preview build for a shareable Android APK
3. Production build for release output

Why this matters:

- Google Sign-In on mobile needs a real native build.
- Expo Go is not enough for this app's native Google auth flow.
- EAS is already configured in this repo through [eas.json](../eas.json).

## 2. Prerequisites

Before building, make sure you have:

- Node.js 20 LTS
- npm
- Expo account access for this project
- EAS CLI available through `npx`
- Android Studio for emulator testing
- Xcode on macOS for iOS builds

Also confirm:

- Dependencies are installed
- Firebase project config is correct
- Google OAuth client IDs are correct
- `google-services.json` is present

## 3. Install dependencies

```bash
npm install
```

## 4. Confirm environment values

Create or verify `.env` in the project root:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
```

These must stay aligned with the Firebase project used by the app.

## 5. Confirm app config before building

Check [app.json](../app.json) and verify:

- `scheme` is your custom app scheme, for example `exampleapp`
- Android package is your app package, for example `com.example.app`
- iOS bundle identifier is your app bundle ID, for example `com.example.app`
- `android.googleServicesFile` points to `./google-services.json`
- the Google Sign-In plugin is present

Check [eas.json](../eas.json) and verify the current profiles:

- `development`: dev client, internal distribution
- `preview`: internal distribution, Android APK
- `production`: release profile

## 6. Development build workflow

Use this when testing:

- Google Sign-In on Android
- Google Sign-In on iOS
- any native plugin behavior

Build the development client:

```bash
npx eas build --platform android --profile development
```

For iOS on macOS:

```bash
npx eas build --platform ios --profile development
```

After installing the build on the device or emulator, start Metro with:

```bash
npm run start:dev-client
```

This is the build flow we should treat as the default for mobile auth testing.

## 7. Preview build workflow

Use this when you want a shareable Android build for testers.

Build the preview APK:

```bash
npx eas build --platform android --profile preview
```

Why preview is useful:

- it produces an APK
- it is easier to install for internal testing
- it avoids Expo Go limitations

## 8. Production build workflow

Use this when preparing the release build.

Android:

```bash
npx eas build --platform android --profile production
```

iOS:

```bash
npx eas build --platform ios --profile production
```

Before running production builds, double-check:

- app name and icons
- bundle/package identifiers
- Firebase project
- Google sign-in config
- any release credentials required by EAS

## 9. Local run commands we use after building

For development client:

```bash
npm run start:dev-client
```

For Android launch from Expo:

```bash
npm run android
```

For iOS launch from Expo:

```bash
npm run ios
```

For web:

```bash
npm run web
```

## 10. What made the build successful for us

These were the key success conditions:

- We used a dev build instead of Expo Go for native Google auth.
- We kept the Android package and iOS bundle ID stable.
- We kept `google-services.json` aligned with the same Firebase project used by the app.
- We kept all Google OAuth client IDs in the same project.
- We used the EAS profiles already defined in the repo instead of inventing a separate build path.

## 11. Common build failures to avoid

Avoid these mistakes:

- Testing native Google Sign-In in Expo Go
- Changing package name without updating Firebase and Google OAuth
- Changing iOS bundle ID without updating Google Sign-In config
- Forgetting to restart Expo after changing `.env`
- Expecting web success to prove native sign-in is configured correctly

## 12. Recommended team workflow

The safest team workflow is:

1. Update `.env`
2. Verify Firebase and Google config
3. Build `development` for auth testing
4. Use `preview` for Android tester installs
5. Use `production` only when the native auth flow is already verified

## 13. Related docs

- [Google Sign-In + Firebase Auth Setup Guide](./GOOGLE_SIGNIN_FIREBASE_SETUP_GUIDE.md)
- [Google Sign-In + Firebase Auth Troubleshooting Guide](./GOOGLE_SIGNIN_FIREBASE_TROUBLESHOOTING.md)
- [How We Resolve the Google Sign-In Problems We Faced](./GOOGLE_SIGNIN_FIREBASE_RESOLUTION_NOTES.md)

## 14. Official references

- Expo SDK 54 docs: https://docs.expo.dev/versions/v54.0.0/
- EAS build config reference: https://docs.expo.dev/build/eas-json/
- Expo AuthSession: https://docs.expo.dev/versions/v54.0.0/sdk/auth-session/
