 import { db, storage, auth } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where,
    deleteDoc,
    doc,
    updateDoc 
} from 'firebase/firestore';
import { 
    ref, 
    uploadBytes, 
    getDownloadURL,
    deleteObject 
} from 'firebase/storage';

// Crear nuevo proyecto
export async function createNewProject() {
    const name = document.getElementById('projectName').value;
    const description = document.getElementById('projectDescription').value;
    
    try {
        const docRef = await addDoc(collection(db, 'projects'), {
            name,
            description,
            userId: auth.currentUser.uid,
            createdAt: new Date(),
            models: []
        });
        
        alert('Proyecto creado exitosamente');
        loadUserProjects();
    } catch (error) {
        alert('Error al crear el proyecto: ' + error.message);
    }
}

// Cargar proyectos del usuario
export async function loadUserProjects() {
    const projectsDiv = document.getElementById('projectsList');
    projectsDiv.innerHTML = '';

    const q = query(
        collection(db, 'projects'), 
        where('userId', '==', auth.currentUser.uid)
    );

    try {
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const projectElement = createProjectElement(doc.id, project);
            projectsDiv.appendChild(projectElement);
        });
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
    }
}

// Crear elemento HTML para cada proyecto
function createProjectElement(projectId, project) {
    const div = document.createElement('div');
    div.className = 'project-card';
    div.innerHTML = `
        <h3>${project.name}</h3>
        <p>${project.description}</p>
        <button onclick="showUploadModal('${projectId}')">Añadir Modelo</button>
        <div class="models-list">
            ${createModelsListHTML(project.models)}
        </div>
    `;
    return div;
}

// Subir modelo 3D
export async function uploadModel(projectId) {
    const file = document.getElementById('modelFile').files[0];
    const modelName = document.getElementById('modelName').value;
    const modelDescription = document.getElementById('modelDescription').value;

    if (!file) {
        alert('Por favor selecciona un archivo');
        return;
    }

    try {
        // Subir archivo al Storage
        const storageRef = ref(storage, `models/${auth.currentUser.uid}/${projectId}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Actualizar documento del proyecto
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, {
            [`models.${Date.now()}`]: {
                name: modelName,
                description: modelDescription,
                url: downloadURL,
                fileName: file.name,
                uploadedAt: new Date()
            }
        });

        alert('Modelo subido exitosamente');
        closeUploadModal();
        loadUserProjects();
    } catch (error) {
        alert('Error al subir el modelo: ' + error.message);
    }
}

// Crear HTML para la lista de modelos
function createModelsListHTML(models) {
    if (!models) return '';
    
    return Object.entries(models).map(([modelId, model]) => `
        <div class="model-item">
            <h4>${model.name}</h4>
            <p>${model.description}</p>
            <button onclick="viewModel('${model.url}')">Ver en AR</button>
            <button onclick="deleteModel('${modelId}')">Eliminar</button>
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
