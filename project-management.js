// project-management.js
import { db, storage, auth } from './firebase-config.js';
import {
  collection,
  addDoc,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  orderBy,
  getDoc,
  deleteField
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// Referencia a la colección de proyectos
const projectsCollection = collection(db, 'projects');

// Crear nuevo proyecto
export async function createNewProject() {
  const name = document.getElementById('projectName').value;
  const description = document.getElementById('projectDescription').value;
  
  if (!name || !description) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    await addDoc(projectsCollection, {
      name,
      description,
      userId: auth.currentUser.uid, // Importante para las reglas
      createdAt: new Date(),
      models: {},
      status: 'active'
    });
    
    alert('Proyecto creado exitosamente');
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    alert('Error al crear el proyecto: ' + error.message);
  }
}

// Escuchar cambios en tiempo real de los proyectos
export function setupProjectsListener() {
  if (!auth.currentUser) return;

  const q = query(
    projectsCollection,
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const projectsDiv = document.getElementById('projectsList');
    projectsDiv.innerHTML = '';

    snapshot.forEach((docSnapshot) => {
      const project = docSnapshot.data();
      const projectElement = createProjectElement(docSnapshot.id, project);
      projectsDiv.appendChild(projectElement);
    });
  });
}

// Eliminar proyecto
export async function deleteProject(projectId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este proyecto?')) return;

  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    const projectData = projectSnap.data();

    if (projectData.models) {
      for (const modelId in projectData.models) {
        await deleteModel(projectId, modelId);
      }
    }

    await deleteDoc(projectRef);
    alert('Proyecto eliminado exitosamente');
  } catch (error) {
    console.error('Error al eliminar proyecto:', error);
    alert('Error al eliminar el proyecto: ' + error.message);
  }
}

// Subir modelo 3D
export async function uploadModel() {
  const modal = document.getElementById('uploadModelModal');
  const projectId = modal.dataset.projectId;
  const file = document.getElementById('modelFile').files[0];
  const modelName = document.getElementById('modelName').value;
  const modelDescription = document.getElementById('modelDescription').value;

  if (!file || !modelName || !modelDescription) {
    alert('Por favor completa todos los campos');
    return;
  }

  try {
    const modelId = Date.now().toString();
    const storageRef = ref(storage, `models/${auth.currentUser.uid}/${projectId}/${modelId}_${file.name}`);
    
    // Subir archivo
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('URL del modelo:', downloadURL); // Debug

    // Actualizar documento del proyecto
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      [`models.${modelId}`]: {
        name: modelName,
        description: modelDescription,
        url: downloadURL,
        fileName: file.name,
        uploadedAt: new Date(),
        storageRef: storageRef.fullPath
      }
    });

    alert('Modelo subido exitosamente');
    closeUploadModal();
  } catch (error) {
    console.error('Error al subir modelo:', error);
    alert('Error al subir el modelo: ' + error.message);
  }
}

// Eliminar modelo
export async function deleteModel(projectId, modelId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este modelo?')) return;

  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    const projectData = projectSnap.data();
    const modelData = projectData.models[modelId];

    // Eliminar archivo del storage
    if (modelData.storageRef) {
      const storageReference = ref(storage, modelData.storageRef);
      await deleteObject(storageReference);
    }

    // Eliminar la referencia del modelo en Firestore
    await updateDoc(projectRef, {
      [`models.${modelId}`]: deleteField()
    });

    alert('Modelo eliminado exitosamente');
  } catch (error) {
    console.error('Error al eliminar modelo:', error);
    alert('Error al eliminar el modelo: ' + error.message);
  }
}

// Crear elemento HTML para cada proyecto en el sidebar
function createProjectElement(projectId, project) {
  const div = document.createElement('div');
  div.className = 'project-item';
  div.setAttribute('data-project-id', projectId);
  div.innerHTML = `
    <h3>${project.name}</h3>
    <small>${new Date(project.createdAt.toDate()).toLocaleDateString()}</small>
  `;
  
  div.addEventListener('click', () => selectProject(projectId, project));
  return div;
}

// Función para seleccionar un proyecto
function selectProject(projectId, project) {
  // Actualizar UI
  document.querySelectorAll('.project-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-project-id="${projectId}"]`).classList.add('active');
  
  // Actualizar título y mostrar botón de añadir modelo
  document.getElementById('currentProjectName').textContent = project.name;
  document.getElementById('addModelBtn').style.display = 'block';
  
  // Mostrar modelos del proyecto
  const modelsGrid = document.getElementById('modelsList');
  modelsGrid.innerHTML = '';
  
  if (project.models) {
    Object.entries(project.models).forEach(([modelId, model]) => {
      const modelCard = createModelCard(modelId, model, projectId);
      modelsGrid.appendChild(modelCard);
    });
  } else {
    modelsGrid.innerHTML = '<p>No hay modelos en este proyecto</p>';
  }
}

// Crear tarjeta de modelo
function createModelCard(modelId, model, projectId) {
  console.log('Creando tarjeta para modelo:', model); // Debug
  
  const div = document.createElement('div');
  div.className = 'model-card';
  div.innerHTML = `
    <div class="model-preview">
      <i class="fas fa-cube fa-3x"></i>
    </div>
    <div class="model-info">
      <h4>${model.name}</h4>
      <p>${model.description}</p>
      <small>Subido: ${new Date(model.uploadedAt.toDate()).toLocaleDateString()}</small>
    </div>
    <div class="model-actions">
      <button onclick="viewModel('${encodeURIComponent(model.url)}')" class="btn btn-primary">
        <i class="fas fa-eye"></i> Ver en AR
      </button>
      <button onclick="deleteModel('${projectId}', '${modelId}')" class="btn btn-danger">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  return div;
}

// Funciones para el modal de nuevo proyecto
export function showNewProjectModal() {
    document.getElementById('newProjectModal').style.display = 'block';
}

export function hideNewProjectModal() {
    document.getElementById('newProjectModal').style.display = 'none';
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';
}

// Funciones para el modal de subida de modelos
export function showUploadModal() {
    const currentProject = document.querySelector('.project-item.active');
    if (!currentProject) {
        alert('Por favor, selecciona un proyecto primero');
        return;
    }
    
    const modal = document.getElementById('uploadModelModal');
    modal.style.display = 'block';
    modal.dataset.projectId = currentProject.getAttribute('data-project-id');
}

export function closeUploadModal() {
    document.getElementById('uploadModelModal').style.display = 'none';
    document.getElementById('modelFile').value = '';
    document.getElementById('modelName').value = '';
    document.getElementById('modelDescription').value = '';
}

// Función para ver modelo en AR (abre en una nueva ventana)
export function viewModel(modelUrl) {
  try {
    console.log('Abriendo visor AR con modelo:', modelUrl);
    
    // Crear URL con parámetros
    const url = `ar-viewer.html?url=${encodeURIComponent(modelUrl)}`;
    
    // Abrir en una nueva ventana/pestaña
    window.open(url, '_blank');
    
  } catch (error) {
    console.error('Error al abrir el visor AR:', error);
    alert('Error al abrir el visor AR: ' + error.message);
  }
}

// Función para probar el visor AR con un modelo de ejemplo
export function testViewer() {
  window.open('ar-viewer.html', '_blank');
}

// Hacer TODAS las funciones disponibles globalmente
window.createNewProject = createNewProject;
window.deleteProject = deleteProject;
window.uploadModel = uploadModel;
window.deleteModel = deleteModel;
window.showNewProjectModal = showNewProjectModal;
window.hideNewProjectModal = hideNewProjectModal;
window.showUploadModal = showUploadModal;
window.closeUploadModal = closeUploadModal;
window.viewModel = viewModel;
window.testViewer = testViewer;
