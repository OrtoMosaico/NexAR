// ar-viewer.js

class ARViewer {
    constructor() {
      this.modelViewer = document.getElementById('modelViewer');
      this.arViewer = document.getElementById('arViewer');
      this.adminPanel = document.getElementById('adminPanel');
      
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
  
    loadModel(modelUrl, options = {}) {
      if (!this.modelViewer) {
        console.error('Model viewer no encontrado');
        return;
      }
      
      console.log('Cargando modelo:', modelUrl);
  
      // Configuración básica
      this.modelViewer.src = modelUrl;
      
      // Para iOS
      if (modelUrl.endsWith('.glb')) {
        const iosSrc = modelUrl.replace('.glb', '.usdz');
        this.modelViewer.iosSrc = iosSrc;
      }
  
      // Configuraciones AR
      this.modelViewer.ar = true;
      this.modelViewer.arModes = 'webxr scene-viewer quick-look';
      this.modelViewer.arScale = 'auto';
      
      // Otras configuraciones
      const settings = {
        ...this.defaultSettings,
        cameraControls: true,
        autoRotate: true,
        shadowIntensity: 1,
        exposure: 1,
        ...options
      };
  
      Object.entries(settings).forEach(([key, value]) => {
        this.modelViewer[key] = value;
      });
  
      // Monitorear estado AR
      this.modelViewer.addEventListener('ar-status', (event) => {
        console.log('Estado AR:', event.detail.status);
        if (event.detail.status === 'failed') {
          console.error('Error AR:', event.detail.error);
          alert('No se pudo iniciar AR. Por favor, asegúrate de usar un dispositivo compatible.');
        }
      });
  
      this.showARViewer();
    }
  
    showARViewer() {
      if (this.arViewer) {
        this.arViewer.style.display = 'block';
      }
      if (this.adminPanel) {
        this.adminPanel.style.display = 'none';
      }
    }
  
    hideARViewer() {
      if (this.arViewer) {
        this.arViewer.style.display = 'none';
      }
      if (this.adminPanel) {
        this.adminPanel.style.display = 'block';
      }
    }
  
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
  
    setScale(scale) {
      if (this.modelViewer) {
        this.modelViewer.scale = `${scale} ${scale} ${scale}`;
      }
    }
  }
  
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
  
  export function decreaseScale() {
    const currentScale = arViewer.modelViewer.scale.split(' ')[0];
    const newScale = Math.max(0.1, currentScale * 0.8);
    arViewer.setScale(newScale);
  }
  
  export function increaseScale() {
    const currentScale = arViewer.modelViewer.scale.split(' ')[0];
    const newScale = Math.min(10, currentScale * 1.2);
    arViewer.setScale(newScale);
  }
  
  // Hacer funciones disponibles globalmente
  window.viewModel = viewModel;
  window.hideViewer = hideViewer;
  window.resetModelPosition = resetModelPosition;
  window.toggleRotation = toggleRotation;
  window.decreaseScale = decreaseScale;
  window.increaseScale = increaseScale;
  
  export default ARViewer;
  