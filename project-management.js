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
  deleteField,
  serverTimestamp,
  getDocs
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

// Función para obtener el ID del proyecto seleccionado
function getSelectedProjectId() {
  const activeProject = document.querySelector('.project-item.active');
  if (!activeProject) {
    return null;
  }
  return activeProject.getAttribute('data-project-id');
}

// Función para mostrar el modal de subida y configurarlo
export function showUploadModal() {
  const projectId = getSelectedProjectId();
  if (!projectId) {
    alert('Por favor, selecciona un proyecto primero');
    return;
  }
  
  // Limpiar campos del modal
  document.getElementById('modelName').value = '';
  document.getElementById('modelDescription').value = '';
  document.getElementById('modelFile').value = '';
  
  // Guardar el ID del proyecto en el modal
  const modal = document.getElementById('uploadModelModal');
  modal.dataset.projectId = projectId;
  
  // Mostrar el modal
  modal.style.display = 'block';
}

// Función para cerrar el modal de subida
export function closeUploadModal() {
  document.getElementById('uploadModelModal').style.display = 'none';
}

// Función para mostrar el modal de nuevo proyecto
export function showNewProjectModal() {
  document.getElementById('projectName').value = '';
  document.getElementById('projectDescription').value = '';
  document.getElementById('newProjectModal').style.display = 'block';
}

// Función para ocultar el modal de nuevo proyecto
export function hideNewProjectModal() {
  document.getElementById('newProjectModal').style.display = 'none';
}

// Función para ver modelo en AR
export function viewModel(modelUrl, shortUrl, modelName, modelId, projectId) {
  if (shortUrl && shortUrl.includes('/ar.html?')) {
    // Si hay URL corta, usarla directamente
    window.open(shortUrl, '_blank');
  } else if (projectId && modelId) {
    // Si tenemos IDs pero no URL corta, generar URL
    const baseUrl = getGlobalBaseUrl();
    const arViewerUrl = `${baseUrl}/ar.html?id=${projectId}&model=${modelId}`;
    window.open(arViewerUrl, '_blank');
  } else {
    // Fallback - usar la URL directa
    const baseUrl = getGlobalBaseUrl();
    const arViewerUrl = `${baseUrl}/ar-viewer.html?url=${encodeURIComponent(modelUrl)}&name=${encodeURIComponent(modelName)}`;
    window.open(arViewerUrl, '_blank');
  }
}

// Función para probar el visor AR
export function testViewer() {
  window.open('ar-viewer.html', '_blank');
}

// Subir modelo 3D - función actualizada con opción de privacidad
export async function uploadModel() {
  // Obtener el ID del proyecto
  const modal = document.getElementById('uploadModelModal');
  let projectId = modal.dataset.projectId;
  
  if (!projectId) {
    projectId = getSelectedProjectId();
  }
  
  if (!projectId) {
    alert('Por favor, selecciona un proyecto primero');
    return;
  }

  const modelName = document.getElementById('modelName').value;
  const modelDescription = document.getElementById('modelDescription').value;
  const modelFile = document.getElementById('modelFile').files[0];
  // Obtener el valor del checkbox público/privado
  const isPublic = document.getElementById('modelIsPublic').checked;

  if (!modelName || !modelFile) {
    alert('Por favor, completa todos los campos requeridos');
    return;
  }

  try {
    // Mostrar indicador de carga
    const uploadBtn = document.querySelector('#uploadModelModal .btn-primary');
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
    uploadBtn.disabled = true;

    console.log('Subiendo modelo a proyecto:', projectId);
    
    // Generar ID corto para el modelo (6 caracteres)
    const modelId = Math.random().toString(36).substring(2, 8);
    
    // Subir archivo a Storage
    console.log('Subiendo archivo a Storage...');
    const storageRef = ref(storage, `models/${auth.currentUser.uid}/${projectId}/${modelId}.glb`);
    await uploadBytes(storageRef, modelFile);
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Archivo subido exitosamente, URL:', downloadURL);
    
    // Crear información del modelo
    const modelData = {
      id: modelId,
      name: modelName,
      description: modelDescription || '',
      url: downloadURL,
      fileName: modelFile.name,
      uploadedAt: new Date(),
      storageRef: `models/${auth.currentUser.uid}/${projectId}/${modelId}.glb`,
      isPublic: isPublic // Guardar el estado público/privado
    };

    // Referencia al documento del proyecto
    console.log('Actualizando documento del proyecto...');
    const projectRef = doc(db, 'projects', projectId);
    
    // Actualizar el documento del proyecto con el nuevo modelo
    await updateDoc(projectRef, {
      [`models.${modelId}`]: modelData
    });
    console.log('Información del modelo guardada en el proyecto');
    
    // Generar URL simplificada para el visor AR
    const baseUrl = getGlobalBaseUrl();
    const shortUrl = `${baseUrl}/ar.html?id=${projectId}&model=${modelId}`;
    console.log('URL simplificada generada:', shortUrl);
    
    // Guardar la URL en el modelo
    await updateDoc(projectRef, {
      [`models.${modelId}.shortUrl`]: shortUrl
    });

    console.log('Modelo subido exitosamente con ID:', modelId);
    
    // Restaurar botón y cerrar modal
    uploadBtn.innerHTML = originalText;
    uploadBtn.disabled = false;
    closeUploadModal();
    
    // Refrescar la lista de modelos
    loadModels(projectId);
    
  } catch (error) {
    console.error('Error al subir modelo:', error);
    
    // Restaurar botón en caso de error
    const uploadBtn = document.querySelector('#uploadModelModal .btn-primary');
    uploadBtn.innerHTML = 'Subir';
    uploadBtn.disabled = false;
    
    alert('Error al subir modelo: ' + error.message);
  }
}

// Función mejorada para obtener la URL base correcta
function getGlobalBaseUrl() {
  // Detectar GitHub Pages
  if (window.location.hostname.includes('github.io')) {
    const repoName = window.location.pathname.split('/')[1]; // Obtener el nombre del repositorio
    return `https://${window.location.hostname}/${repoName}`;
  }
  
  // Para desarrollo local o cualquier otro entorno
  return window.location.origin;
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
  
  // Contenido del proyecto con botones de edición y eliminación
  div.innerHTML = `
    <div class="project-content" data-project-id="${projectId}">
      <h3>${project.name}</h3>
      <small>${new Date(project.createdAt.toDate()).toLocaleDateString()}</small>
    </div>
    <div class="project-actions">
      <button class="btn-icon edit-project" title="Editar proyecto">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn-icon delete-project" title="Eliminar proyecto">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  
  // Manejar clic en el contenido del proyecto (seleccionar proyecto)
  const projectContent = div.querySelector('.project-content');
  projectContent.addEventListener('click', () => {
    // Obtener el proyecto actualizado
    getDoc(doc(db, 'projects', projectId)).then(docSnap => {
      if (docSnap.exists()) {
        const projectData = docSnap.data();
        
        // Actualizar UI
        document.querySelectorAll('.project-item').forEach(item => {
          item.classList.remove('active');
        });
        div.classList.add('active');
        
        // Actualizar título y mostrar botón de añadir modelo
        document.getElementById('currentProjectName').textContent = projectData.name;
        document.getElementById('addModelBtn').style.display = 'block';
        
        // Mostrar modelos del proyecto
        loadModels(projectId, projectData);
        
        // Cerrar el menú en dispositivos móviles
        if (window.innerWidth <= 768) {
          const sidebar = document.querySelector('.sidebar');
          if (sidebar) {
            sidebar.classList.remove('active');
            sidebar.style.display = 'none';
          }
        }
      }
    });
  });
  
  // Manejar clic en botón de editar
  const editButton = div.querySelector('.edit-project');
  editButton.addEventListener('click', (e) => {
    e.stopPropagation();
    showEditProjectModal(projectId, project);
  });
  
  // Manejar clic en botón de eliminar
  const deleteButton = div.querySelector('.delete-project');
  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`¿Estás seguro de que deseas eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`)) {
      deleteProject(projectId);
    }
  });
  
  return div;
}

// Función para cargar los modelos de un proyecto
async function loadModels(projectId, projectData = null) {
  try {
    // Si no se proporcionaron datos del proyecto, obtenerlos
    if (!projectData) {
      const projectSnap = await getDoc(doc(db, 'projects', projectId));
      if (!projectSnap.exists()) {
        throw new Error('El proyecto no existe');
      }
      projectData = projectSnap.data();
    }
    
    // Actualizar título
    document.getElementById('currentProjectName').textContent = projectData.name;
    
    // Mostrar modelos
    const modelsGrid = document.getElementById('modelsList');
    modelsGrid.innerHTML = '';
    
    if (projectData.models && Object.keys(projectData.models).length > 0) {
      Object.entries(projectData.models).forEach(([modelId, model]) => {
        const modelCard = createModelCard(modelId, model, projectId);
        modelsGrid.appendChild(modelCard);
      });
    } else {
      modelsGrid.innerHTML = '<p>No hay modelos en este proyecto</p>';
    }
  } catch (error) {
    console.error('Error al cargar modelos:', error);
    document.getElementById('modelsList').innerHTML = `<p>Error al cargar modelos: ${error.message}</p>`;
  }
}

// Crear tarjeta de modelo
function createModelCard(modelId, model, projectId) {
  console.log('Creando tarjeta para modelo:', model);
  
  // Crear elemento div para la tarjeta
  const div = document.createElement('div');
  div.className = 'model-card';
  
  // Añadir un icono más sutil para indicar privacidad
  const privacyIcon = model.isPublic 
    ? '<i class="fas fa-globe" title="Modelo público" style="color: #28a745; margin-left: 5px;"></i>' 
    : '<i class="fas fa-lock" title="Modelo privado" style="color: #6c757d; margin-left: 5px;"></i>';
    
  div.innerHTML = `
    <div class="model-preview">
      <i class="fas fa-cube fa-4x"></i>
    </div>
    <div class="model-info">
      <h4>${model.name} ${privacyIcon}</h4>
      <p>${model.description || 'Sin descripción'}</p>
    </div>
    <div class="model-actions">
      <button class="view-btn"><i class="fas fa-eye"></i></button>
      <button class="qr-btn"><i class="fas fa-qrcode"></i></button>
      <button class="edit-btn"><i class="fas fa-edit"></i></button>
      <button class="delete-btn"><i class="fas fa-trash"></i></button>
    </div>
  `;
  
  // Añadir event listeners
  div.querySelector('.view-btn').addEventListener('click', () => {
    viewModel(model.url, model.shortUrl, model.name, modelId, projectId);
  });
  
  div.querySelector('.qr-btn').addEventListener('click', () => {
    showQRModal(model.url, model.name, model.shortUrl, modelId, projectId);
  });
  
  div.querySelector('.edit-btn').addEventListener('click', () => {
    showEditModelModal(projectId, modelId, model);
  });
  
  div.querySelector('.delete-btn').addEventListener('click', () => {
    deleteModel(projectId, modelId);
  });
  
  return div;
}

// Funciones para el modal de edición de proyecto
export function showEditProjectModal(projectId, project) {
  // Guardar el ID del proyecto en el modal
  const modal = document.getElementById('editProjectModal');
  modal.dataset.projectId = projectId;
  
  // Llenar los campos con la información actual
  document.getElementById('editProjectName').value = project.name;
  document.getElementById('editProjectDescription').value = project.description || '';
  
  // Mostrar el modal
  modal.style.display = 'block';
}

export function hideEditProjectModal() {
  document.getElementById('editProjectModal').style.display = 'none';
}

// Función para actualizar un proyecto
export async function updateProject() {
  try {
    const modal = document.getElementById('editProjectModal');
    const projectId = modal.dataset.projectId;
    
    if (!projectId) {
      throw new Error('ID de proyecto no encontrado');
    }
    
    const name = document.getElementById('editProjectName').value;
    const description = document.getElementById('editProjectDescription').value;
    
    if (!name) {
      alert('Por favor, ingresa un nombre para el proyecto');
      return;
    }
    
    // Obtener referencia al documento del proyecto
    const projectRef = doc(db, 'projects', projectId);
    
    // Actualizar el documento
    await updateDoc(projectRef, {
      name,
      description,
      updatedAt: serverTimestamp()
    });
    
    console.log('Proyecto actualizado correctamente');
    
    // Actualizar UI
    const projectItem = document.querySelector(`.project-item[data-project-id="${projectId}"]`);
    if (projectItem) {
      const projectTitle = projectItem.querySelector('h3');
      if (projectTitle) {
        projectTitle.textContent = name;
      }
      
      // Si el proyecto está seleccionado, actualizar el título
      if (projectItem.classList.contains('active')) {
        document.getElementById('currentProjectName').textContent = name;
      }
    }
    
    // Cerrar modal
    hideEditProjectModal();
    
  } catch (error) {
    console.error('Error al actualizar el proyecto:', error);
    alert('Error al actualizar el proyecto: ' + error.message);
  }
}

// Funciones para manejo de códigos QR
let currentQRUrl = '';

// Función para mostrar QR
export function showQRModal(modelUrl, modelName, shortUrl, modelId, projectId) {
  try {
    let arViewerUrl;
    
    if (shortUrl && shortUrl.includes('/ar.html?')) {
      // Usar URL corta directamente
      arViewerUrl = shortUrl;
    } else if (projectId && modelId) {
      // Generar URL basada en IDs
      const baseUrl = getGlobalBaseUrl();
      arViewerUrl = `${baseUrl}/ar.html?id=${projectId}&model=${modelId}`;
    } else {
      // Fallback
      const baseUrl = getGlobalBaseUrl();
      arViewerUrl = `${baseUrl}/ar-viewer.html?url=${encodeURIComponent(modelUrl)}&name=${encodeURIComponent(modelName)}`;
    }
    
    // Generar QR...
    document.getElementById('qrUrl').textContent = arViewerUrl;
    
    const qrContainer = document.getElementById('qrCode');
    qrContainer.innerHTML = '';
    
    try {
      new QRCode(qrContainer, {
        text: arViewerUrl,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (e) {
      console.error("Error al generar QR:", e);
      const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(arViewerUrl)}`;
      qrContainer.innerHTML = `<img src="${apiUrl}" alt="QR Code" style="width:256px; height:256px">`;
    }
    
    document.getElementById('qrModal').style.display = 'block';
  } catch (error) {
    console.error('Error al mostrar QR:', error);
    alert('Error al mostrar QR: ' + error.message);
  }
}

export function hideQRModal() {
  document.getElementById('qrModal').style.display = 'none';
}

export function downloadQR() {
  try {
    // Intentar obtener el canvas generado por qrcode.js
    const canvas = document.querySelector('#qrCode canvas');
    
    if (canvas) {
      // Si tenemos un canvas, usar su contenido
      const link = document.createElement('a');
      link.download = 'qr-ar-model.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Si no hay canvas, buscar imagen (método alternativo)
      const img = document.querySelector('#qrCode img');
      if (img) {
        // Crear un link para descargar directamente la imagen
        const link = document.createElement('a');
        link.download = 'qr-ar-model.png';
        link.href = img.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('No se encontró el QR para descargar');
      }
    }
  } catch (error) {
    console.error('Error al descargar QR:', error);
    alert('Error al descargar QR: ' + error.message);
  }
}

// Funciones para el modal de edición de modelo
export function showEditModelModal(projectId, modelId, model) {
  // Guardar IDs en el modal
  const modal = document.getElementById('editModelModal');
  modal.dataset.projectId = projectId;
  modal.dataset.modelId = modelId;
  
  // Llenar los campos con la información actual
  document.getElementById('editModelName').value = model.name;
  document.getElementById('editModelDescription').value = model.description || '';
  document.getElementById('editModelIsPublic').checked = model.isPublic === true;
  
  // Mostrar el modal
  modal.style.display = 'block';
}

export function hideEditModelModal() {
  document.getElementById('editModelModal').style.display = 'none';
}

// Función para actualizar un modelo
export async function updateModel() {
  try {
    const modal = document.getElementById('editModelModal');
    const projectId = modal.dataset.projectId;
    const modelId = modal.dataset.modelId;
    
    if (!projectId || !modelId) {
      throw new Error('IDs no encontrados');
    }
    
    const name = document.getElementById('editModelName').value;
    const description = document.getElementById('editModelDescription').value;
    const isPublic = document.getElementById('editModelIsPublic').checked;
    
    if (!name) {
      alert('Por favor, ingresa un nombre para el modelo');
      return;
    }
    
    // Referencia al documento del proyecto
    const projectRef = doc(db, 'projects', projectId);
    
    // Actualizar solo los campos necesarios en el modelo existente
    await updateDoc(projectRef, {
      [`models.${modelId}.name`]: name,
      [`models.${modelId}.description`]: description,
      [`models.${modelId}.isPublic`]: isPublic,
      [`models.${modelId}.updatedAt`]: new Date()
    });
    
    console.log('Modelo actualizado correctamente');
    
    // Cerrar modal
    hideEditModelModal();
    
    // Refrescar la lista de modelos para mostrar los cambios
    loadModels(projectId);
    
  } catch (error) {
    console.error('Error al actualizar el modelo:', error);
    alert('Error al actualizar el modelo: ' + error.message);
  }
}

// Hacer TODAS las funciones disponibles globalmente
window.createNewProject = createNewProject;
window.deleteProject = deleteProject;
window.updateProject = updateProject;
window.uploadModel = uploadModel;
window.deleteModel = deleteModel;
window.showNewProjectModal = showNewProjectModal;
window.hideNewProjectModal = hideNewProjectModal;
window.showEditProjectModal = showEditProjectModal;
window.hideEditProjectModal = hideEditProjectModal;
window.showUploadModal = showUploadModal;
window.closeUploadModal = closeUploadModal;
window.viewModel = viewModel;
window.testViewer = testViewer;
window.showQRModal = showQRModal;
window.hideQRModal = hideQRModal;
window.downloadQR = downloadQR;
window.showEditModelModal = showEditModelModal;
window.hideEditModelModal = hideEditModelModal;
window.updateModel = updateModel;
