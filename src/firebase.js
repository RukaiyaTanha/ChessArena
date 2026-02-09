import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Replace with your Firebase config
// Get this from Firebase Console > Project Settings > Your apps > SDK setup and configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFYWVXW2aWrX5uk75fx_nILPvh4tm3EdE",
  authDomain: "chess-cc941.firebaseapp.com",
  databaseURL: "https://chess-cc941-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "chess-cc941",
  storageBucket: "chess-cc941.firebasestorage.app",
  messagingSenderId: "942304938373",
  appId: "1:942304938373:web:8b5cfa2904704c6b2cdcec"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;
