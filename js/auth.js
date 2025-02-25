import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from 'firebase/auth';

// Credenciales de prueba
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = '123456';

// Manejar el estado de autenticación
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        setupProjectsListener(); // Iniciar escucha de proyectos
    } else {
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('arViewer').style.display = 'none';
    }
});

// Función de inicio de sesión
export async function login() {
    const email = document.getElementById('loginEmail').value || TEST_EMAIL;
    const password = document.getElementById('loginPassword').value || TEST_PASSWORD;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Error de autenticación:', error);
        alert('Error al iniciar sesión: ' + error.message);
    }
}

// Función de cierre de sesión
export async function logout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
    }
}

// Auto-login para desarrollo (opcional)
export async function autoLogin() {
    if (!auth.currentUser) {
        await login();
    }
}

// Llamar al auto-login cuando se carga la página (comentar en producción)
window.addEventListener('load', autoLogin); 
