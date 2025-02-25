// Importar las funciones necesarias de Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBKzibLWo4MNweXiwr6QoudB9sFb7CeH2w",
  authDomain: "prueba-2-dc1d2.firebaseapp.com",
  projectId: "prueba-2-dc1d2",
  storageBucket: "prueba-2-dc1d2.appspot.com",
  messagingSenderId: "603232032392",
  appId: "1:603232032392:web:575f16d8e613348399313d",
  measurementId: "G-J4QBH6WF5L"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Verificar inicialización
console.log('Firebase inicializado correctamente'); 
