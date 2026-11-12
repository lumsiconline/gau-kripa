import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  DbService,
  DbAstrologer,
  DbBooking,
  DbChatSession,
  DbWallet,
  DbReview,
  DbSettings,
  DbSchema
} from './db';

const customDbId = (firebaseConfig as any).firestoreDatabaseId;

let appInstance: FirebaseApp | null = null;
export let firestoreDb: Firestore | null = null;
let isFirestoreAvailable = false;
let checkDone = false;

/**
 * Non-blocking REST probe to check if Cloud Firestore API is enabled on the Google Cloud project.
 * This avoids opening gRPC 'Listen' streams when the API is not yet activated in GCP.
 */
async function probeFirestoreApi(): Promise<boolean> {
  if (checkDone) return isFirestoreAvailable;
  try {
    const probeUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/settings/config?key=${firebaseConfig.apiKey}`;
    const res = await fetch(probeUrl, { method: 'GET' });
    const data = await res.json().catch(() => ({}));

    if (res.status === 403 && (data?.error?.status === 'PERMISSION_DENIED' || data?.error?.message?.includes('Cloud Firestore API has not been used'))) {
      console.log(`ℹ️ Cloud Firestore API is disabled in project "${firebaseConfig.projectId}". Operating securely in local database mode (src/server/db.json).`);
      isFirestoreAvailable = false;
      checkDone = true;
      return false;
    }

    // API is enabled
    isFirestoreAvailable = true;
    checkDone = true;
    return true;
  } catch {
    isFirestoreAvailable = false;
    checkDone = true;
    return false;
  }
}

/**
 * Seeds initial collections to Firestore from local data if collections are empty.
 */
export async function initFirestoreDatabase(localDb: DbSchema) {
  const isAvailable = await probeFirestoreApi();
  if (!isAvailable) {
    return;
  }

  try {
    if (!appInstance) {
      const existing = getApps().find(a => a.name === 'server-firestore');
      appInstance = existing || initializeApp(firebaseConfig, 'server-firestore');
      firestoreDb = customDbId ? getFirestore(appInstance, customDbId) : getFirestore(appInstance);
    }

    if (!firestoreDb) return;
    const db = firestoreDb;

    console.log(`📡 Connecting to Cloud Firestore: ${firebaseConfig.projectId} (${customDbId || '(default)'})...`);
    
    // Check if settings already exist in Firestore
    const settingsDoc = await getDoc(doc(db, 'settings', 'config'));
    if (!settingsDoc.exists()) {
      console.log('🌱 Seeding initial GauKripa catalog and data to Cloud Firestore...');
      
      // 1. Settings
      await setDoc(doc(db, 'settings', 'config'), localDb.settings);

      // 2. Services
      for (const service of localDb.services) {
        await setDoc(doc(db, 'services', service.id), service);
      }

      // 3. Astrologers
      for (const astro of localDb.astrologers) {
        await setDoc(doc(db, 'astrologers', astro.id), astro);
      }

      // 4. Bookings
      for (const booking of localDb.bookings) {
        await setDoc(doc(db, 'bookings', booking.id), booking);
      }

      // 5. Wallets
      for (const [phone, wallet] of Object.entries(localDb.wallets)) {
        await setDoc(doc(db, 'wallets', phone), wallet);
      }

      // 6. Reviews
      for (const review of localDb.reviews) {
        await setDoc(doc(db, 'reviews', review.id), review);
      }

      console.log('✅ Initial seed data successfully committed to Cloud Firestore!');
    } else {
      console.log('✅ Cloud Firestore already initialized with existing live records.');
    }
  } catch (err: any) {
    isFirestoreAvailable = false;
    console.log('ℹ️ Cloud Firestore unavailable. Falling back cleanly to local database mode.');
  }
}

export async function syncService(service: DbService) {
  if (!isFirestoreAvailable || !firestoreDb) return;
  const db = firestoreDb;
  try {
    await setDoc(doc(db, 'services', service.id), service, { merge: true });
  } catch {}
}

export async function deleteService(id: string) {
  if (!isFirestoreAvailable || !firestoreDb) return;
  const db = firestoreDb;
  try {
    await deleteDoc(doc(db, 'services', id));
  } catch {}
}

export async function syncAstrologer(astro: DbAstrologer) {
  if (!isFirestoreAvailable || !firestoreDb) return;
  const db = firestoreDb;
  try {
    await setDoc(doc(db, 'astrologers', astro.id), astro, { merge: true });
  } catch {}
}

export async function syncBooking(booking: DbBooking) {
  if (!isFirestoreAvailable || !firestoreDb) return;
  const db = firestoreDb;
  try {
    await setDoc(doc(db, 'bookings', booking.id), booking, { merge: true });
  } catch {}
}

export async function syncChatSession(session: DbChatSession) {
  if (!isFirestoreAvailable || !firestoreDb) return;
  const db = firestoreDb;
  try {
    await setDoc(doc(db, 'chatSessions', session.id), session, { merge: true });
  } catch {}
}

export async function syncWallet(wallet: DbWallet) {
  if (!isFirestoreAvailable || !firestoreDb) return;
  const db = firestoreDb;
  try {
    await setDoc(doc(db, 'wallets', wallet.phone), wallet, { merge: true });
  } catch {}
}

export async function syncReview(review: DbReview) {
  if (!isFirestoreAvailable || !firestoreDb) return;
  const db = firestoreDb;
  try {
    await setDoc(doc(db, 'reviews', review.id), review, { merge: true });
  } catch {}
}

export async function deleteReview(id: string) {
  if (!isFirestoreAvailable || !firestoreDb) return;
  const db = firestoreDb;
  try {
    await deleteDoc(doc(db, 'reviews', id));
  } catch {}
}

export async function syncSettings(settings: DbSettings) {
  if (!isFirestoreAvailable || !firestoreDb) return;
  const db = firestoreDb;
  try {
    await setDoc(doc(db, 'settings', 'config'), settings, { merge: true });
  } catch {}
}

export async function getFirestoreStats() {
  if (!isFirestoreAvailable || !firestoreDb) {
    return {
      connected: false,
      mode: 'local_database',
      projectId: firebaseConfig.projectId,
      status: 'Cloud Firestore API not activated in Google Cloud project. Server is using local persistent JSON storage.'
    };
  }

  try {
    const db = firestoreDb;
    const [srvSnap, astSnap, bkgSnap, wltSnap, revSnap] = await Promise.all([
      getDocs(collection(db, 'services')),
      getDocs(collection(db, 'astrologers')),
      getDocs(collection(db, 'bookings')),
      getDocs(collection(db, 'wallets')),
      getDocs(collection(db, 'reviews')),
    ]);

    return {
      connected: true,
      projectId: firebaseConfig.projectId,
      databaseId: customDbId || '(default)',
      collections: {
        services: srvSnap.size,
        astrologers: astSnap.size,
        bookings: bkgSnap.size,
        wallets: wltSnap.size,
        reviews: revSnap.size
      }
    };
  } catch (err: any) {
    return {
      connected: false,
      projectId: firebaseConfig.projectId,
      error: err?.message || String(err)
    };
  }
}
