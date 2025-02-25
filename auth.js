// auth.js
import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

import { setupProjectsListener } from './project-management.js';

// Credenciales de prueba (asegúrate de que existan en Firebase Auth)
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
  console.log('Función login ejecutada');
  
  try {
    // Obtener valores de los campos
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    if (!emailInput || !passwordInput) {
      console.error('No se encontraron los campos de login');
      return;
    }
    
    const email = emailInput.value || TEST_EMAIL;
    const password = passwordInput.value || TEST_PASSWORD;
    
    console.log('Intentando iniciar sesión con:', email);
    
    // Intentar login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login exitoso:', userCredential.user.email);
    
  } catch (error) {
    console.error('Error durante el login:', error);
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
  console.log('Iniciando proceso de auto-login');
  try {
    if (!auth.currentUser) {
      console.log('No hay usuario activo, intentando login automático');
      await login();
    } else {
      console.log('Ya existe una sesión activa:', auth.currentUser.email);
    }
  } catch (error) {
    console.error('Error en auto-login:', error);
  }
}
