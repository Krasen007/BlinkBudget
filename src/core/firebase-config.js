import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJGBxvJXETIp2u4Y54GCuc2fMmlGDwGQ8",
  authDomain: "blinkbudget-sync.firebaseapp.com",
  projectId: "blinkbudget-sync",
  storageBucket: "blinkbudget-sync.firebasestorage.app",
  messagingSenderId: "363794681094",
  appId: "1:363794681094:web:979ebd677b582e4d906287",
  measurementId: "G-NP43LFVSNF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
