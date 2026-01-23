import { initializeApp } from 'firebase/app'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const firebaseApp = initializeApp(firebaseConfig)
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID
const firestoreSettings = {
  experimentalForceLongPolling: true,
  useFetchStreams: false
}

export const firestore = databaseId
  ? initializeFirestore(firebaseApp, firestoreSettings, databaseId)
  : initializeFirestore(firebaseApp, firestoreSettings)
