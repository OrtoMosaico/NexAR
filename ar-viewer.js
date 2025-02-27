// ar-viewer.js - versión final que no depende de Firestore

// Función para inicializar el visor
function initViewer() {
  try {
    console.log("Inicializando visor AR directo...");
    
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const modelUrl = urlParams.get('url'); // URL directa del modelo
    const modelName = urlParams.get('name') || 'Modelo 3D';
    
    // Configurar título y nombre
    document.title = `Visor AR - ${modelName}`;
    const modelNameElement = document.getElementById('modelName');
    if (modelNameElement) {
      modelNameElement.textContent = modelName;
    }
    
    // Obtener el model-viewer
    const viewer = document.querySelector('model-viewer');
    if (!viewer) {
      console.error("No se encontró el elemento model-viewer");
      showError("Error: No se encontró el componente de visualización");
      return;
    }
    
    if (modelUrl) {
      // Si tenemos URL, cargar el modelo directamente
      console.log("Cargando modelo desde URL directa");
      viewer.src = modelUrl;
      viewer.alt = modelName;
      
      // Mostrar mensaje para iniciar AR
      const arPrompt = document.getElementById('arPrompt');
      if (arPrompt) {
        arPrompt.style.display = 'block';
      }
    } else {
      // Si no hay URL, cargar modelo de demostración
      console.log("No se proporcionó URL, cargando modelo de demostración");
      viewer.src = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
      viewer.alt = 'Modelo de demostración';
      
      // Actualizar título
      document.title = "Visor AR - Modelo de demostración";
      if (modelNameElement) {
        modelNameElement.textContent = "Modelo de demostración";
      }
    }
    
    // Eventos de carga
    viewer.addEventListener('load', () => {
      console.log("Modelo cargado correctamente");
      // Ocultar mensaje de error si estaba visible
      const errorElement = document.getElementById('errorMessage');
      if (errorElement) {
        errorElement.style.display = 'none';
      }
    });
    
    viewer.addEventListener('error', (error) => {
      console.error("Error al cargar el modelo:", error);
      showError("Error al cargar el modelo. El formato puede no ser compatible o la URL es inaccesible.");
    });
    
  } catch (error) {
    console.error("Error:", error);
    showError(`Error: ${error.message}`);
  }
}

// Función auxiliar para mostrar errores
function showError(message) {
  console.error(message);
  const errorElement = document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  } else {
    alert(message);
  }
}

// Configurar botones
function setupButtons() {
  const backButton = document.getElementById('backButton');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.history.back();
    });
  }
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log("Documento cargado, inicializando visor...");
  initViewer();
  setupButtons();
});
  