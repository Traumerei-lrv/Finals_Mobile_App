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

### 3. Create environment variables
Create a `.env` file in the project root and add:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
```

Important:
- Your Google OAuth client IDs must be from the same Google Cloud/Firebase project used by this app.
- In Firebase Authentication, enable the Google sign-in provider.

### 4. Start Expo
```bash
npm run start
```

### 5. Run on your target platform
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
npx expo start -c
```
