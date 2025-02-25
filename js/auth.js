import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged 
} from 'firebase/auth';
import { setupProjectsListener } from './project-management.js';

// Credenciales de prueba
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = '123456';

// Manejar el estado de autenticación
onAuthStateChanged(auth, (user) => {
    console.log('Estado de autenticación cambiado:', user ? 'Usuario autenticado' : 'No autenticado');
    
    if (user) {
        console.log('Usuario autenticado:', user.email);
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        setupProjectsListener();
    } else {
        console.log('Usuario no autenticado');
        document.getElementById('authSection').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('arViewer').style.display = 'none';
    }
});

// Función de inicio de sesión
export async function login() {
    console.log('Intentando iniciar sesión...');
    
    try {
        const email = document.getElementById('loginEmail').value || TEST_EMAIL;
        const password = document.getElementById('loginPassword').value || TEST_PASSWORD;
        
        console.log('Usando credenciales:', { email });
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Inicio de sesión exitoso:', userCredential.user.email);
        
    } catch (error) {
        console.error('Error de autenticación:', error);
        alert(`Error al iniciar sesión: ${error.message}`);
    }
}

// Función de cierre de sesión
export async function logout() {
    console.log('Intentando cerrar sesión...');
    
    try {
        await signOut(auth);
        console.log('Sesión cerrada exitosamente');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión: ' + error.message);
    }
}

// Auto-login para desarrollo
export async function autoLogin() {
    console.log('Intentando auto-login...');
    
    if (!auth.currentUser) {
        console.log('No hay usuario actual, intentando login automático');
        await login();
    } else {
        console.log('Ya existe una sesión activa');
    }
}

// Llamar al auto-login cuando se carga la página (comentar en producción)
window.addEventListener('load', autoLogin); 
