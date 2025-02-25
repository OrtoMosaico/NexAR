// project-management.js
import { db, storage, auth } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
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
      userId: auth.currentUser.uid,
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

// Crear elemento HTML para cada proyecto
function createProjectElement(projectId, project) {
  const div = document.createElement('div');
  div.className = 'project-card';
  div.innerHTML = `
    <div class="project-header">
      <h3>${project.name}</h3>
      <div class="project-actions">
        <button onclick="showUploadModal('${projectId}')" class="btn-add">Añadir Modelo</button>
        <button onclick="deleteProject('${projectId}')" class="btn-delete">Eliminar Proyecto</button>
      </div>
    </div>
    <p class="project-description">${project.description}</p>
    <div class="models-list">
      ${createModelsListHTML(project.models, projectId)}
    </div>
    <div class="project-footer">
      <small>Creado: ${new Date(project.createdAt.toDate()).toLocaleDateString()}</small>
    </div>
  `;
  return div;
}

function createModelsListHTML(models, projectId) {
  if (!models) return '<p>No hay modelos en este proyecto</p>';
  
  return Object.entries(models).map(([modelId, model]) => `
    <div class="model-item">
      <div class="model-header">
        <h4>${model.name}</h4>
        <span class="model-date">
          ${new Date(model.uploadedAt.toDate()).toLocaleDateString()}
        </span>
      </div>
      <p class="model-description">${model.description}</p>
      <div class="model-actions">
        <button onclick="viewModel('${model.url}')" class="btn-view">Ver en AR</button>
        <button onclick="deleteModel('${projectId}', '${modelId}')" class="btn-delete">Eliminar</button>
      </div>
    </div>
  `).join('');
}

// Mostrar modal de subida
export function showUploadModal(projectId) {
  const modal = document.getElementById('uploadModelModal');
  modal.style.display = 'block';
  modal.dataset.projectId = projectId;
}

// Cerrar modal de subida
export function closeUploadModal() {
  document.getElementById('uploadModelModal').style.display = 'none';
  document.getElementById('modelFile').value = '';
  document.getElementById('modelName').value = '';
  document.getElementById('modelDescription').value = '';
}

// Ver modelo en AR
export function viewModel(modelUrl) {
  const modelViewer = document.getElementById('modelViewer');
  const arViewer = document.getElementById('arViewer');
  
  modelViewer.src = modelUrl;
  arViewer.style.display = 'block';
  document.getElementById('adminPanel').style.display = 'none';
}
