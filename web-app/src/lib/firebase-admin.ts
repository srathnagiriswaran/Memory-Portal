import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      console.warn("Firebase Admin SDK not initialized: Missing project ID. (This is expected during build without env vars)");
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Mock the db/storage objects if not initialized so build doesn't crash
const isInitialized = admin.apps.length > 0;
export const adminDb = isInitialized ? admin.firestore() : ({} as any);
export const adminStorage = isInitialized ? admin.storage() : ({} as any);
