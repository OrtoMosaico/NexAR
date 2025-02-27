// ar-viewer.js

// Importar dependencias necesarias
import { auth } from './firebase-config.js';

// Clase principal para el visor AR
class ARViewer {
    constructor() {
        this.modelViewer = null;
        this.arViewer = null;
        this.mainApp = null;
        this.init();
    }

    init() {
        this.modelViewer = document.querySelector('#modelViewer');
        this.arViewer = document.querySelector('#arViewer');
        this.mainApp = document.querySelector('#mainApp');
        
        if (!this.modelViewer) {
            console.error('No se encontró el elemento model-viewer');
            return;
        }

        // Configurar event listeners
        this.modelViewer.addEventListener('load', () => {
            console.log('Modelo cargado exitosamente');
        });

        this.modelViewer.addEventListener('error', (error) => {
            console.error('Error al cargar el modelo:', error);
        });
    }

    loadModel(modelUrl) {
        if (!modelUrl) {
            console.error('URL del modelo no proporcionada');
            return;
        }

        console.log('Cargando modelo:', modelUrl);

        // Mostrar el visor
        if (this.mainApp) this.mainApp.style.display = 'none';
        if (this.arViewer) this.arViewer.style.display = 'block';

        // Configurar y cargar el modelo
        if (this.modelViewer) {
            try {
                // Limpiar src anterior si existe
                this.modelViewer.src = '';
                
                // Configurar nuevo modelo
                this.modelViewer.src = modelUrl;
                this.modelViewer.cameraControls = true;
                this.modelViewer.ar = true;
                this.modelViewer.autoRotate = true;
                this.modelViewer.shadowIntensity = 1;
                this.modelViewer.exposure = 1;
                
                // Actualizar título con nombre del archivo
                const fileName = modelUrl.split('/').pop();
                const modelTitle = document.getElementById('modelTitle');
                if (modelTitle) {
                    modelTitle.textContent = fileName || 'Modelo 3D';
                }
            } catch (error) {
                console.error('Error al configurar el modelo:', error);
                alert('Error al configurar el modelo');
            }
        } else {
            console.error('Model viewer no inicializado');
        }
    }

    hideViewer() {
        if (this.arViewer) this.arViewer.style.display = 'none';
        if (this.mainApp) this.mainApp.style.display = 'block';
    }

    resetPosition() {
        if (this.modelViewer) {
            this.modelViewer.cameraOrbit = 'auto auto auto';
            this.modelViewer.cameraTarget = 'auto auto auto';
        }
    }

    toggleRotation() {
        if (this.modelViewer) {
            this.modelViewer.autoRotate = !this.modelViewer.autoRotate;
        }
    }

    decreaseScale() {
        if (this.modelViewer) {
            const currentScale = parseFloat(this.modelViewer.scale.split(' ')[0]) || 1;
            this.modelViewer.scale = `${Math.max(0.1, currentScale * 0.8)}`;
        }
    }

    increaseScale() {
        if (this.modelViewer) {
            const currentScale = parseFloat(this.modelViewer.scale.split(' ')[0]) || 1;
            this.modelViewer.scale = `${Math.min(10, currentScale * 1.2)}`;
        }
    }
}

// Crear instancia global
const arViewer = new ARViewer();

// Funciones exportadas
export function viewModel(modelUrl) {
    try {
        const decodedUrl = decodeURIComponent(modelUrl);
        console.log('URL del modelo a cargar:', decodedUrl);
        
        // Verificar que la URL sea válida
        if (!decodedUrl || !decodedUrl.startsWith('https://')) {
            console.error('URL del modelo no válida:', decodedUrl);
            alert('URL del modelo no válida');
            return;
        }

        arViewer.loadModel(decodedUrl);
    } catch (error) {
        console.error('Error al procesar URL del modelo:', error);
        alert('Error al cargar el modelo');
    }
}

export function hideViewer() {
    arViewer.hideViewer();
}

export function resetModelPosition() {
    arViewer.resetPosition();
}

export function toggleRotation() {
    arViewer.toggleRotation();
}

export function decreaseScale() {
    arViewer.decreaseScale();
}

export function increaseScale() {
    arViewer.increaseScale();
}

// Hacer funciones disponibles globalmente
window.viewModel = viewModel;
window.hideViewer = hideViewer;
window.resetModelPosition = resetModelPosition;
window.toggleRotation = toggleRotation;
window.decreaseScale = decreaseScale;
window.increaseScale = increaseScale;

export default ARViewer;
  