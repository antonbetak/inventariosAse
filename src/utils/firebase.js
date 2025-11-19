// src/utils/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDE289Xmxr24iyUx52lsRqF4cPgZtKnMVc",
  authDomain: "inventario-sanate-c789a.firebaseapp.com",
  projectId: "inventario-sanate-c789a",
  storageBucket: "inventario-sanate-c789a.firebasestorage.app",
  messagingSenderId: "410093191014",
  appId: "1:410093191014:web:0dbb1c39b47da798cb52a7",
  measurementId: "G-K1KYFET6FM"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// AUTH (LO QUE NECESITAS PARA EL LOGIN)
export const auth = getAuth(app);
