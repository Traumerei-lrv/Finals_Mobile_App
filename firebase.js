// firebase.js
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_API_KEY = 'AIzaSyD0i3TfA1QTL_h1GpZeI67tt8H3vrbDiL8'.trim();

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "realtime-database-cd1d6.firebaseapp.com",
  databaseURL: "https://realtime-database-cd1d6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "realtime-database-cd1d6",
  storageBucket: "realtime-database-cd1d6.firebasestorage.app",
  messagingSenderId: "139373810157",
  appId: "1:139373810157:web:29c92f510e23ab84d157e4"
};

if (!firebaseConfig.apiKey || !firebaseConfig.apiKey.startsWith('AIza')) {
  throw new Error('Invalid Firebase apiKey format. Update firebase.js with a valid Web API key.');
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

export const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: (() => {
          const { getReactNativePersistence } = require('firebase/auth');
          return getReactNativePersistence(AsyncStorage);
        })(),
      });
export default app;
