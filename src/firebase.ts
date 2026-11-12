import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the existing GauKripa Firebase project safely.
export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export auth
export const auth = getAuth(app);

// Lazy Firestore instance to prevent premature gRPC stream initialization
let _db: Firestore | null = null;
export function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(app);
  }
  return _db;
}

export const db = {
  get instance() {
    return getDb();
  }
};

export default app;
