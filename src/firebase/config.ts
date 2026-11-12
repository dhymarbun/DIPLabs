import { Platform } from 'react-native';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const effectiveConfig = isFirebaseConfigured
  ? firebaseConfig
  : {
      apiKey: 'demo-api-key-not-configured',
      authDomain: 'demo-diplabs.firebaseapp.com',
      projectId: 'demo-diplabs',
      storageBucket: 'demo-diplabs.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:000000000000',
    };

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(effectiveConfig);
} else {
  app = getApp();
}

let auth: Auth;
try {
  auth = getAuth(app);
} catch {
  auth = initializeAuth(app);
}

let db: Firestore;
try {
  if (Platform.OS === 'web') {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache(),
    });
  } else {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  }
} catch {
  db = getFirestore(app);
}

export { app, auth, db };
