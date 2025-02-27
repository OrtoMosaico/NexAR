// Reglas recomendadas para Firestore
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Proyectos - acceso completo para usuarios autenticados a sus propios proyectos
    match /projects/{projectId} {
      allow read: if true; // Permitir lectura para todos (importante para el visor AR)
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // Modelos - mismas reglas que para proyectos
      match /models/{modelId} {
        allow read: if true; // Permitir lectura para todos
        allow write: if request.auth != null && request.auth.uid == get(/databases/$(database)/documents/projects/$(projectId)).data.userId;
      }
    }
    
    // Configuración y otros documentos
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
*/

// Reglas para Storage
/*
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permitir lecturas públicas para todos los archivos
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
*/ 