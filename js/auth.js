import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from 'firebase/auth';

// Manejar el estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadUserProjects(user.uid);
    } else {
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('arViewer').style.display = 'none';
    }
});

// Función de inicio de sesión
export async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert('Error al iniciar sesión: ' + error.message);
    }
}

// Función de cierre de sesión
export async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        alert('Error al cerrar sesión: ' + error.message);
    }
}  
