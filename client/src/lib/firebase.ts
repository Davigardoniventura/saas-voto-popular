// client/src/lib/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7-51jkOczpKmlZ8JWUi1yRDnTkOp2Kuk",
  authDomain: "votopopular-a5889.firebaseapp.com",
  projectId: "votopopular-a5889",
  storageBucket: "votopopular-a5889.firebasestorage.app",
  messagingSenderId: "942001769231",
  appId: "1:942001769231:web:436faa6dcccc8384e00c7a"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Exporte o 'auth' para ser usado em outras partes do app
export const auth = getAuth(app);
