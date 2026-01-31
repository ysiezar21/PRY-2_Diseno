// src/config/firebase.config.ts

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================
// Reemplaza estos valores con los de tu proyecto Firebase
// Puedes obtenerlos en: Firebase Console > Configuración del proyecto > Tus apps

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "TU_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tu-proyecto.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tu-proyecto",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tu-proyecto.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123..."
};

// ============================================
// INICIALIZACIÓN DE FIREBASE
// ============================================

// Inicializa la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// Obtiene la instancia de autenticación
export const auth = getAuth(app);

// Obtiene la instancia de Firestore (base de datos)
export const db = getFirestore(app);

// Exporta la app por si se necesita en algún lugar
export default app;