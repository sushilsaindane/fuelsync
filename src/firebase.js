import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCCJbnVa6JAuijTVUytZgCoffHxJxGksmo",
  authDomain: "fuelsync-92ccb.firebaseapp.com",
  projectId: "fuelsync-92ccb",
  storageBucket: "fuelsync-92ccb.firebasestorage.app",
  messagingSenderId: "844346014660",
  appId: "1:844346014660:web:b886aa7b7bda7df18f0291",
  measurementId: "G-ELZDEWLT9L"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = "my-local-app-id";
export const BANGALORE_PRICE = 102.92;