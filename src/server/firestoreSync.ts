import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs
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

// Initialize Firebase App for Server-Side synchronization
const app = initializeApp(firebaseConfig, 'server-firestore');
const customDbId = (firebaseConfig as any).firestoreDatabaseId;
export const firestoreDb = customDbId ? getFirestore(app, customDbId) : getFirestore(app);

let isInitialized = false;

/**
 * Seeds initial collections to Firestore from local data if collections are empty.
 */
export async function initFirestoreDatabase(localDb: DbSchema) {
  if (isInitialized) return;
  try {
    console.log(`📡 Connecting to Cloud Firestore: ${firebaseConfig.projectId} (${customDbId || '(default)'})...`);
    
    // Check if settings already exist in Firestore
    const settingsDoc = await getDoc(doc(firestoreDb, 'settings', 'config'));
    if (!settingsDoc.exists()) {
      console.log('🌱 Seeding initial GauKripa catalog and data to Cloud Firestore...');
      
      // 1. Settings
      await setDoc(doc(firestoreDb, 'settings', 'config'), localDb.settings);

      // 2. Services
      for (const service of localDb.services) {
        await setDoc(doc(firestoreDb, 'services', service.id), service);
      }

      // 3. Astrologers
      for (const astro of localDb.astrologers) {
        await setDoc(doc(firestoreDb, 'astrologers', astro.id), astro);
      }

      // 4. Bookings
      for (const booking of localDb.bookings) {
        await setDoc(doc(firestoreDb, 'bookings', booking.id), booking);
      }

      // 5. Wallets
      for (const [phone, wallet] of Object.entries(localDb.wallets)) {
        await setDoc(doc(firestoreDb, 'wallets', phone), wallet);
      }

      // 6. Reviews
      for (const review of localDb.reviews) {
        await setDoc(doc(firestoreDb, 'reviews', review.id), review);
      }

      console.log('✅ Initial seed data successfully committed to Cloud Firestore!');
    } else {
      console.log('✅ Cloud Firestore already initialized with existing live records.');
    }

    isInitialized = true;
  } catch (err: any) {
    console.log('ℹ️ Operating in local database mode (Cloud Firestore pending API activation in Firebase console).');
  }
}

export async function syncService(service: DbService) {
  try {
    await setDoc(doc(firestoreDb, 'services', service.id), service, { merge: true });
  } catch (err) {
    // Quietly ignore if Firestore is offline
  }
}

export async function deleteService(id: string) {
  try {
    await deleteDoc(doc(firestoreDb, 'services', id));
  } catch (err) {
    // Quietly ignore if Firestore is offline
  }
}

export async function syncAstrologer(astro: DbAstrologer) {
  try {
    await setDoc(doc(firestoreDb, 'astrologers', astro.id), astro, { merge: true });
  } catch (err) {
    // Quietly ignore if Firestore is offline
  }
}

export async function syncBooking(booking: DbBooking) {
  try {
    await setDoc(doc(firestoreDb, 'bookings', booking.id), booking, { merge: true });
  } catch (err) {
    // Quietly ignore if Firestore is offline
  }
}

export async function syncChatSession(session: DbChatSession) {
  try {
    await setDoc(doc(firestoreDb, 'chatSessions', session.id), session, { merge: true });
  } catch (err) {
    // Quietly ignore if Firestore is offline
  }
}

export async function syncWallet(wallet: DbWallet) {
  try {
    await setDoc(doc(firestoreDb, 'wallets', wallet.phone), wallet, { merge: true });
  } catch (err) {
    // Quietly ignore if Firestore is offline
  }
}

export async function syncReview(review: DbReview) {
  try {
    await setDoc(doc(firestoreDb, 'reviews', review.id), review, { merge: true });
  } catch (err) {
    // Quietly ignore if Firestore is offline
  }
}

export async function deleteReview(id: string) {
  try {
    await deleteDoc(doc(firestoreDb, 'reviews', id));
  } catch (err) {
    // Quietly ignore if Firestore is offline
  }
}

export async function syncSettings(settings: DbSettings) {
  try {
    await setDoc(doc(firestoreDb, 'settings', 'config'), settings, { merge: true });
  } catch (err) {
    // Quietly ignore if Firestore is offline
  }
}

export async function getFirestoreStats() {
  try {
    const [srvSnap, astSnap, bkgSnap, wltSnap, revSnap] = await Promise.all([
      getDocs(collection(firestoreDb, 'services')),
      getDocs(collection(firestoreDb, 'astrologers')),
      getDocs(collection(firestoreDb, 'bookings')),
      getDocs(collection(firestoreDb, 'wallets')),
      getDocs(collection(firestoreDb, 'reviews')),
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
