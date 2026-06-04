# Career Go

Career Go is an IT-focused job finder app with three user roles:
- Job Seeker
- Recruiter
- Admin

For job seekers, Career Go helps you discover IT opportunities, browse job details, and track your applications in one place.

## Setup Guide

### 1. Prerequisites
- Node.js 20 LTS (recommended for Expo SDK 54)
- npm
- Git

Platform tooling (based on where you will run the app):
- Android: Android Studio + Android SDK/emulator
- iOS (macOS only): Xcode + CocoaPods
- Physical device testing: Expo Go app (Android/iOS)

### 2. Install dependencies
```bash
npm install
```

### 3. Firebase and Google OAuth checklist
This app depends on the same Firebase project data that the team uses.

Before running the app, make sure:
- Firebase Authentication is enabled for Email/Password
- Google sign-in is enabled in Firebase Authentication if you want to test Google login
- The Firebase project contains the expected `users/{uid}` documents for each demo account
- Role fields in Firestore are set correctly, for example:
  - `admin`
  - `recruiter`
  - `job_seeker`

Important:
- Admin/recruiter routing is decided from Firebase data, not from local gitignored files
- If an admin logs in and gets sent to the job seeker flow, the most likely cause is that the logged-in account is missing its Firestore role or is pointed at the wrong Firebase project
- The app first checks `users/{uid}` for `role`, `userRole`, or `type`
- If no role is found there, it may fall back to `recruiters/{uid}`
- If nothing is found, the app defaults to `job_seeker`

### 4. Create environment variables
Create a `.env` file in the project root and add:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
```

Important:
- Your Google OAuth client IDs must be from the same Google Cloud/Firebase project used by this app.
- Expo Go on mobile does not support the native Google Sign-In flow used by the app. Use a development build if you need to test Google login on mobile.

### 5. Start Expo
```bash
npm start
```

This starts the app in Expo Go mode by default.

If you need the custom dev client flow instead:
```bash
npm run start:dev-client
```

### 6. Run on your target platform
- Web:
```bash
npm run web
```
- Android:
```bash
npm run android
```
- iOS:
```bash
npm run ios
```

If needed, clear Expo cache:
```bash
npx expo start --go --clear
```

## Demo Credentials

### Admin
- Email: `admin@gmail.com`
- Password: `password`

### Job Seeker
- Email: `alvin@gmail.com`
- Password: `password123`

### Recruiter
- Email: `hart@gmail.com`
- Password: `password`

### Recruiter
- Email: `cloudbridege@gmail.com`
- Password: `password`

## Troubleshooting

### Admin account opens job seeker dashboard
Check the Firebase project first.

Things to verify:
- The account exists in Firebase Authentication
- A matching Firestore document exists at `users/{uid}`
- That Firestore document has `role: "admin"` for the admin account
- If testing recruiter access, confirm the role is `recruiter`
- Your teammate is using the same Firebase project and `.env` values as the rest of the team

### Mobile app works but Google login does not
That is expected in Expo Go for this project.

Use:
```bash
npm run start:dev-client
```

### Expo cache seems stale
Run:
```bash
npx expo start --go --clear
```
