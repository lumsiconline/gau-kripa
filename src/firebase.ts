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

// Validate the Firestore connection on startup.
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'settings', 'config'));
    console.log('✅ Firestore Database connected successfully');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    // A missing document still confirms that Firestore is reachable.
    console.log('✅ Firestore Database reachable:', (error as Error)?.message);
    return true;
  }
}

testFirestoreConnection();

export default app;
