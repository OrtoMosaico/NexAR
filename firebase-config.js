// firebase-config.js

// IMPORTS desde el CDN de Firebase v9+ (ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

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

// Ejemplo de reglas para Storage que deberías aplicar en la consola de Firebase:
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lectura pública para los modelos públicos
    match /public-models/{fileName} {
      allow read: if true;
    }
    
    // Permitir lectura pública para los metadatos públicos
    match /public-metadata/{fileName} {
      allow read: if true;
    }
    
    // Reglas normales para el resto de archivos
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
*/ 