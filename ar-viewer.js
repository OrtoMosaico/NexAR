// Importar dependencias necesarias
import { auth } from './firebase-config.js';

// Clase principal para el visor AR
class ARViewer {
    constructor() {
        this.modelViewer = document.getElementById('modelViewer');
        this.arViewer = document.getElementById('arViewer');
        this.adminPanel = document.getElementById('adminPanel');
        
        // Configuración inicial del modelo
        this.defaultSettings = {
            cameraControls: true,
            ar: true,
            autoRotate: true,
            shadowIntensity: 1,
            exposure: 1,
            shadowSoftness: 1,
            environmentImage: 'neutral'
        };

        this.setupEventListeners();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Manejar eventos AR
        this.modelViewer?.addEventListener('ar-status', (event) => {
            console.log('Estado AR:', event.detail.status);
        });

        // Manejar errores de carga
        this.modelViewer?.addEventListener('error', (event) => {
            console.error('Error al cargar el modelo:', event.detail);
            alert('Error al cargar el modelo 3D');
        });

        // Manejar carga exitosa
        this.modelViewer?.addEventListener('load', () => {
            console.log('Modelo cargado exitosamente');
        });
    }

    // Cargar y mostrar un modelo
    loadModel(modelUrl, options = {}) {
        if (!this.modelViewer) {
            console.error('Model viewer no encontrado');
            return;
        }

        console.log('Cargando modelo:', modelUrl);

        // Combinar configuración por defecto con opciones personalizadas
        const settings = { ...this.defaultSettings, ...options };

        // Aplicar configuración
        Object.entries(settings).forEach(([key, value]) => {
            this.modelViewer[key] = value;
        });

        // Establecer la URL del modelo
        this.modelViewer.src = modelUrl;

        // Mostrar el visor AR y ocultar el panel de administración
        this.showARViewer();
    }

    // Mostrar el visor AR
    showARViewer() {
        if (this.arViewer) {
            this.arViewer.style.display = 'block';
        }
        if (this.adminPanel) {
            this.adminPanel.style.display = 'none';
        }
    }

    // Ocultar el visor AR
    hideARViewer() {
        if (this.arViewer) {
            this.arViewer.style.display = 'none';
        }
        if (this.adminPanel) {
            this.adminPanel.style.display = 'block';
        }
    }

    // Controles del modelo
    resetPosition() {
        if (this.modelViewer) {
            this.modelViewer.cameraOrbit = 'auto auto auto';
            this.modelViewer.cameraTarget = 'auto auto auto';
        }
    }

    toggleAutoRotate() {
        if (this.modelViewer) {
            this.modelViewer.autoRotate = !this.modelViewer.autoRotate;
        }
    }

    setExposure(value) {
        if (this.modelViewer) {
            this.modelViewer.exposure = value;
        }
    }

    setShadowIntensity(value) {
        if (this.modelViewer) {
            this.modelViewer.shadowIntensity = value;
        }
    }
}

// Crear instancia del visor AR
const arViewer = new ARViewer();

// Exportar funciones para uso global
export function viewModel(modelUrl, options = {}) {
    arViewer.loadModel(modelUrl, options);
}

export function hideViewer() {
    arViewer.hideARViewer();
}

export function resetModelPosition() {
    arViewer.resetPosition();
}

export function toggleRotation() {
    arViewer.toggleAutoRotate();
}

// Hacer algunas funciones disponibles globalmente para los botones HTML
window.viewModel = viewModel;
window.hideViewer = hideViewer;
window.resetModelPosition = resetModelPosition;
window.toggleRotation = toggleRotation;

// Exportar la clase completa por si se necesita más funcionalidad
export default ARViewer; 