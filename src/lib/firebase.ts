import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getMessaging, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let messaging: Messaging | null = null;

const firebaseInitialized = !!(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

if (firebaseInitialized) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        forceOwnership: true
      })
    });
  } catch(e) {
    console.error("Could not enable Firestore persistence", e);
    db = getFirestore(app);
  }

  if (typeof window !== 'undefined') {
    messaging = getMessaging(app);
  }
}

export { app, auth, db, messaging, firebaseInitialized, firebaseConfig };
