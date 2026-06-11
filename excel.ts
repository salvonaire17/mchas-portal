import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with experimentalForceLongPolling to handle restricted networks (like some iframes)
// and enable multi-tab persistence for offline-first performance
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

import { enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a a time.
            console.warn('Firestore persistence failed-precondition');
        } else if (err.code === 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence
            console.warn('Firestore persistence unimplemented');
        }
    });
}

import { browserLocalPersistence, setPersistence } from 'firebase/auth';
export const auth = getAuth();
setPersistence(auth, browserLocalPersistence);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);
