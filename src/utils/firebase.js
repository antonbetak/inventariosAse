// Importar Firebase App
import { initializeApp } from "firebase/app";

// Importar Firestore
import { getFirestore } from "firebase/firestore";

// (Opcional) Analytics
import { getAnalytics } from "firebase/analytics";

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

// Inicializar Firestore y exportarlo
export const db = getFirestore(app);

// Opcional: Analytics
export const analytics = getAnalytics(app);
