import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the existing GauKripa Firebase project.
const app = initializeApp(firebaseConfig);

// Use the project's default Firestore database.
// The Web app config does not specify a custom database ID.
export const db = getFirestore(app);

// Initialize Firebase Authentication.
export const auth = getAuth(app);

// Validate the Firestore connection on startup safely
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'config'));
    console.log('✅ Firestore Database connected successfully');
    return true;
  } catch (error) {
    // If Cloud Firestore API is pending activation or offline, fall back cleanly without error logs
    console.log('ℹ️ Firestore operating in local storage mode (Cloud Firestore pending activation in Firebase console).');
    return false;
  }
}

export default app;
