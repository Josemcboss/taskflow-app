// Main Application Logic

// DOM Elements
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const notificationsBtn = document.getElementById('notificationsBtn');
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const totalTasksEl = document.getElementById('totalTasks');
const activeTasksEl = document.getElementById('activeTasks');
const completedTasksEl = document.getElementById('completedTasks');
const filterBtns = document.querySelectorAll('.filter-btn:not(.priority-filter)');
const priorityFilterBtns = document.querySelectorAll('.priority-filter');
const prioritySelect = document.getElementById('prioritySelect');
const categorySelect = document.getElementById('categorySelect');
const searchInput = document.getElementById('searchInput');
const charCount = document.getElementById('charCount');

// Notes and attachments elements
const toggleNotesBtn = document.getElementById('toggleNotesBtn');
const notesEditor = document.getElementById('notesEditor');
const notesInput = document.getElementById('notesInput');
const notesCharCount = document.getElementById('notesCharCount');
const uploadAttachmentBtn = document.getElementById('uploadAttachmentBtn');
const attachmentInput = document.getElementById('attachmentInput');
const attachmentsPreview = document.getElementById('attachmentsPreview');

let currentUser = null;
let todos = [];
let currentFilter = 'all';
let currentPriorityFilter = null;
let currentCategoryFilter = null;
let searchQuery = '';
let editingTodoId = null;
let expandedTodos = new Set(); // Track which todos have expanded subtasks
let addingSubtaskToId = null; // Track which todo is having a subtask added

// Notes and attachments state
let notesEditorVisible = false;
let pendingAttachments = []; // Files to upload when task is created

// Initialize app when DOM and Supabase are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    // Intentar inicializar supabase si no está listo
    if (!supabase && typeof initializeSupabase === 'function') {
        console.log('Intentando inicializar Supabase en app.js...');
        initializeSupabase();
    }
    
    // Verificar que supabase esté inicializado
    if (!supabase || !supabase.auth) {
        console.error('Supabase no está inicializado. Reintentando en 500ms...');
        setTimeout(initApp, 500);
        return;
    }
    
    console.log('✅ Supabase listo en app.js');
    init();
}

async function init() {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = session.user;
    userEmail.textContent = currentUser.email;

    // Initialize categories manager
    categoriesManager = new CategoriesManager(supabase, currentUser.id);
    await categoriesManager.init();
    
    // Update category selector
    updateCategorySelector();
    
    // Render category filters
    renderCategoryFilters();
    
    // Callback when categories change
    categoriesManager.onCategoryChange = () => {
        updateCategorySelector();
        renderCategoryFilters();
    };

    // Initialize sharing manager BEFORE loading todos (needed by renderTodos)
    sharingManager = new SharingManager(supabase, currentUser.id);
    sharingManager.userEmail = currentUser.email;
    await sharingManager.init();

    // Load todos
    await loadTodos();
    
    // Initialize drag and drop
    dragDropManager = new DragDropManager(supabase, currentUser.id);
    dragDropManager.init();
    
    // Initialize notifications
    notificationsManager = new NotificationsManager();
    await notificationsManager.init();
    updateNotificationsButton();
    
    // Initialize export manager
    exportManager = new ExportManager(supabase, currentUser.id);
    exportManager.init();
    
    // Expose globally for notifications
    window.todos = todos;
    window.currentUser = currentUser;
    window.sharingManager = sharingManager;
    window.exportManager = exportManager;

    // Set up realtime subscription
    setupRealtimeSubscription();

    // Event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Add todo
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // Character counter
    todoInput.addEventListener('input', updateCharCounter);
    
    // Notes character counter
    notesInput.addEventListener('input', updateNotesCharCounter);

    // Toggle notes editor
    toggleNotesBtn.addEventListener('click', toggleNotesEditor);
    
    // Upload attachments
    uploadAttachmentBtn.addEventListener('click', () => attachmentInput.click());
    attachmentInput.addEventListener('change', handleAttachmentSelection);

    // Search
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderTodos();
    });

    // Notifications
    notificationsBtn.addEventListener('click', async () => {
        const enabled = await notificationsManager.toggle();
        updateNotificationsButton();
    });

    // Export
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportManager.openModal();
        });
    }

    // Logout
    logoutBtn.addEventListener('click', logout);

    // Status filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    // Priority filters
    priorityFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                currentPriorityFilter = null;
            } else {
                priorityFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPriorityFilter = btn.dataset.priority;
            }
            renderTodos();
        });
    });
}

// Update character counter
function updateCharCounter() {
    const length = todoInput.value.length;
    charCount.textContent = length;
    
    const counterEl = document.querySelector('.char-counter');
    counterEl.classList.remove('warning', 'danger');
    
    if (length >= 180) {
        counterEl.classList.add('danger');
    } else if (length >= 150) {
        counterEl.classList.add('warning');
    }
}

// Update notes character counter
function updateNotesCharCounter() {
    const length = notesInput.value.length;
    notesCharCount.textContent = length;
    
    const counterEl = document.querySelector('.char-counter-notes');
    counterEl.classList.remove('warning', 'danger');
    
    if (length >= 1800) {
        counterEl.classList.add('danger');
    } else if (length >= 1500) {
        counterEl.classList.add('warning');
    }
}

// Toggle notes editor
function toggleNotesEditor() {
    notesEditorVisible = !notesEditorVisible;
    
    if (notesEditorVisible) {
        notesEditor.style.display = 'block';
        toggleNotesBtn.classList.add('active');
        toggleNotesBtn.textContent = '📝 Ocultar notas y archivos';
    } else {
        notesEditor.style.display = 'none';
        toggleNotesBtn.classList.remove('active');
        toggleNotesBtn.textContent = '📝 Agregar notas o archivos adjuntos';
    }
}

// Handle attachment selection
function handleAttachmentSelection(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    // Validate number of files
    if (pendingAttachments.length + files.length > 5) {
        alert('Máximo 5 archivos por tarea');
        return;
    }
    
    // Validate file sizes
    for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
            alert(`El archivo "${file.name}" excede el tamaño máximo de 10MB`);
            return;
        }
    }
    
    // Add files to pending
    pendingAttachments.push(...files);
    
    // Render preview
    renderAttachmentsPreview();
    
    // Clear input
    attachmentInput.value = '';
}

// Render attachments preview
function renderAttachmentsPreview() {
    attachmentsPreview.innerHTML = '';
    
    pendingAttachments.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'attachment-item';
        
        const icon = getFileIcon(file.type);
        const size = formatFileSize(file.size);
        
        item.innerHTML = `
            <span class="attachment-icon">${icon}</span>
            <span class="attachment-name" title="${file.name}">${file.name}</span>
            <span class="attachment-size">${size}</span>
            <button class="btn-remove-attachment" onclick="removeAttachment(${index})">×</button>
        `;
        
        attachmentsPreview.appendChild(item);
    });
}

// Remove attachment from pending list
window.removeAttachment = function(index) {
    pendingAttachments.splice(index, 1);
    renderAttachmentsPreview();
};

// Get file icon based on type
function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('text')) return '📃';
    return '📎';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Load todos from Supabase
async function loadTodos() {
    try {
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Load attachments for all todos
        const { data: attachments, error: attError } = await supabase
            .from('todo_attachments')
            .select('*')
            .in('todo_id', (data || []).map(t => t.id));

        if (attError) console.error('Error loading attachments:', attError);

        // Separate parent tasks and subtasks
        const allTodos = data || [];
        const parentTodos = allTodos.filter(t => !t.parent_id).sort((a, b) => (a.position || 0) - (b.position || 0));
        const subtasks = allTodos.filter(t => t.parent_id);
        
        // Attach subtasks and attachments to their parents
        todos = parentTodos.map(todo => ({
            ...todo,
            subtasks: subtasks.filter(st => st.parent_id === todo.id),
            attachments: (attachments || []).filter(att => att.todo_id === todo.id)
        }));
        
        renderTodos();
        updateStats();
        
        // Update global reference for notifications
        window.todos = todos;
    } catch (error) {
        console.error('Error loading todos:', error);
        showEmptyState('Error al cargar las tareas. Por favor recarga la página.');
    }
}

// Update notifications button
function updateNotificationsButton() {
    if (!notificationsManager) return;
    
    const status = notificationsManager.getStatus();
    if (status.enabled) {
        notificationsBtn.style.opacity = '1';
        notificationsBtn.title = 'Notificaciones activadas (Click para desactivar)';
    } else {
        notificationsBtn.style.opacity = '0.5';
        notificationsBtn.title = 'Notificaciones desactivadas (Click para activar)';
    }
}

// Add new todo
async function addTodo() {
    const text = todoInput.value.trim();

    if (!text) return;

    addBtn.disabled = true;
    addBtn.textContent = 'Agregando...';

    const priority = prioritySelect.value;
    const categoryId = categorySelect.value || null;
    const notes = notesInput.value.trim() || null;

    try {
        // Insert todo with notes
        const { data, error } = await supabase
            .from('todos')
            .insert([
                {
                    user_id: currentUser.id,
                    text: text,
                    completed: false,
                    priority: priority,
                    category_id: categoryId,
                    notes: notes
                }
            ])
            .select();

        if (error) throw error;

        const newTodo = data[0];

        // Upload attachments if any
        if (pendingAttachments.length > 0) {
            await uploadAttachments(newTodo.id);
        }

        todos.unshift(newTodo);
        todoInput.value = '';
        notesInput.value = '';
        pendingAttachments = [];
        renderAttachmentsPreview();
        updateCharCounter();
        updateNotesCharCounter();
        
        // Hide notes editor if visible
        if (notesEditorVisible) {
            toggleNotesEditor();
        }
        
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error adding todo:', error);
        alert('Error al agregar la tarea. Por favor intenta de nuevo.');
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'Agregar';
    }
}

// Upload attachments to Supabase Storage
async function uploadAttachments(todoId) {
    for (const file of pendingAttachments) {
        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${currentUser.id}/${todoId}/${Date.now()}_${file.name}`;

            // Upload to storage
            const { error: uploadError } = await supabase.storage
                .from('attachments')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('attachments')
                .getPublicUrl(fileName);

            // Save attachment record
            const { error: insertError } = await supabase
                .from('todo_attachments')
                .insert([{
                    todo_id: todoId,
                    file_name: file.name,
                    file_url: publicUrl,
                    file_size: file.size,
                    file_type: file.type
                }]);

            if (insertError) throw insertError;

        } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            alert(`Error al subir ${file.name}. Asegúrate de que el bucket "attachments" existe en Supabase Storage.`);
        }
    }
}

// Toggle todo completion
async function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
        const { error } = await supabase
            .from('todos')
            .update({ completed: !todo.completed })
            .eq('id', id);

        if (error) throw error;

        todo.completed = !todo.completed;
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error toggling todo:', error);
        alert('Error al actualizar la tarea.');
    }
}

// Start editing todo
function startEdit(id) {
    editingTodoId = id;
    renderTodos();
}

// Save edited todo
async function saveEdit(id) {
    const input = document.querySelector(`#edit-input-${id}`);
    const newText = input.value.trim();

    if (!newText) return;

    try {
        const { error } = await supabase
            .from('todos')
            .update({ text: newText })
            .eq('id', id);

        if (error) throw error;

        const todo = todos.find(t => t.id === id);
        if (todo) todo.text = newText;

        editingTodoId = null;
        renderTodos();
    } catch (error) {
        console.error('Error updating todo:', error);
        alert('Error al actualizar la tarea.');
    }
}

// Cancel edit
function cancelEdit() {
    editingTodoId = null;
    renderTodos();
}

// Delete todo
async function deleteTodo(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;

    try {
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        todos = todos.filter(t => t.id !== id);
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error deleting todo:', error);
        alert('Error al eliminar la tarea.');
    }
}

// Render todos
function renderTodos() {
    let filteredTodos = todos;

    // Filter by status
    if (currentFilter === 'active') {
        filteredTodos = filteredTodos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTodos = filteredTodos.filter(t => t.completed);
    }

    // Filter by priority
    if (currentPriorityFilter) {
        filteredTodos = filteredTodos.filter(t => t.priority === currentPriorityFilter);
    }

    // Filter by category
    if (currentCategoryFilter) {
        filteredTodos = filteredTodos.filter(t => t.category_id == currentCategoryFilter);
    }

    // Filter by search
    if (searchQuery) {
        filteredTodos = filteredTodos.filter(t => 
            t.text.toLowerCase().includes(searchQuery)
        );
    }

    if (filteredTodos.length === 0) {
        showEmptyState();
        return;
    }

    const html = filteredTodos.map(todo => {
        const isEditing = editingTodoId === todo.id;
        const priority = todo.priority || 'medium';
        const priorityLabels = {
            high: '🔴 Alta',
            medium: '🟡 Media',
            low: '🟢 Baja'
        };
        
        const hasSubtasks = todo.subtasks && todo.subtasks.length > 0;
        const isExpanded = expandedTodos.has(todo.id);
        const progress = getSubtaskProgress(todo);
        const isAddingSubtask = addingSubtaskToId === todo.id;

        // Highlight search terms
        let displayText = escapeHtml(todo.text);
        if (searchQuery && !isEditing) {
            const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi');
            displayText = displayText.replace(regex, '<span class="search-highlight">$1</span>');
        }

        // Render subtasks
        let subtasksHTML = '';
        if (hasSubtasks && isExpanded) {
            subtasksHTML = `
                <div class="subtasks-container">
                    ${todo.subtasks.map(subtask => `
                        <div class="subtask-item ${subtask.completed ? 'completed' : ''}">
                            <div class="todo-checkbox" onclick="toggleSubtask(${subtask.id}, ${todo.id})"></div>
                            <div class="todo-text">${escapeHtml(subtask.text)}</div>
                            <button class="btn-icon btn-delete" 
                                    onclick="deleteSubtask(${subtask.id}, ${todo.id})" 
                                    title="Eliminar">🗑</button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Render subtask input form
        let subtaskInputHTML = '';
        if (isAddingSubtask) {
            subtaskInputHTML = `
                <div class="subtask-input-form">
                    <input type="text" 
                           id="subtask-input-${todo.id}" 
                           class="subtask-input" 
                           placeholder="Escribe la subtarea..."
                           maxlength="200">
                    <button class="btn-save-subtask" onclick="addSubtask(${todo.id})">Agregar</button>
                    <button class="btn-cancel-subtask" onclick="cancelAddSubtask()">Cancelar</button>
                </div>
            `;
        }

        return `
      <div class="todo-item ${todo.completed ? 'completed' : ''} ${hasSubtasks || isAddingSubtask ? 'has-subtasks' : ''}">
        <div class="todo-main-content">
          ${hasSubtasks ? `
            <button class="subtask-toggle ${isExpanded ? 'expanded' : ''}" 
                    onclick="toggleSubtasks(${todo.id})">
              ▶
            </button>
          ` : '<div style="width: 24px;"></div>'}
          <div class="todo-checkbox" onclick="toggleTodo(${todo.id})"></div>
          <div class="todo-text-wrapper">
            ${isEditing ? `
              <input 
                type="text" 
                class="todo-edit-input" 
                id="edit-input-${todo.id}"
                value="${escapeHtml(todo.text)}"
                autofocus
              >
            ` : `
              <div class="todo-text">${displayText}</div>
              <div style="display: flex; gap: 8px; align-items: center;">
                  <span class="priority-badge ${priority}">${priorityLabels[priority]}</span>
                  ${categoriesManager.renderCategoryBadge(todo.category_id)}
              </div>
            `}
          </div>
          <div class="todo-actions">
            ${isEditing ? `
              <button class="btn-icon btn-save" onclick="saveEdit(${todo.id})" title="Guardar">✓</button>
              <button class="btn-icon btn-cancel" onclick="cancelEdit()" title="Cancelar">✕</button>
            ` : `
              ${!hasSubtasks && !isAddingSubtask ? `
                <button class="btn-icon" 
                        style="background: rgba(79, 172, 254, 0.1); color: #4facfe;" 
                        onclick="startAddSubtask(${todo.id})" 
                        title="Agregar subtarea">+</button>
              ` : ''}
              <button class="btn-share-task ${sharingManager && sharingManager.isShared(todo.id) ? 'shared' : ''}" 
                      onclick="openShareModal(${todo.id}, '${escapeHtml(todo.text).replace(/'/g, "\\'")}')" 
                      title="Compartir tarea">
                🔗${sharingManager && sharingManager.isShared(todo.id) ? ` (${sharingManager.getSharedCount(todo.id)})` : ''}
              </button>
              <button class="btn-icon btn-edit" onclick="startEdit(${todo.id})" title="Editar">✎</button>
              <button class="btn-icon btn-delete" onclick="deleteTodo(${todo.id})" title="Eliminar">🗑</button>
            `}
          </div>
        </div>
        ${progress ? `
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width: ${progress.percentage}%"></div>
            </div>
            <div class="progress-text">${progress.completed}/${progress.total} subtareas completadas</div>
          </div>
        ` : ''}
        ${todo.notes && !isEditing ? `
          <div class="task-notes">${escapeHtml(todo.notes)}</div>
        ` : ''}
        ${todo.attachments && todo.attachments.length > 0 && !isEditing ? `
          <div class="task-attachments">
            ${todo.attachments.map(att => `
              <a href="${att.file_url}" 
                 class="task-attachment-item" 
                 target="_blank" 
                 download="${att.file_name}"
                 title="${att.file_name}">
                <span class="attachment-icon">${getFileIcon(att.file_type)}</span>
                <span>${att.file_name.length > 20 ? att.file_name.substring(0, 20) + '...' : att.file_name}</span>
                <span class="attachment-download-icon">⬇</span>
              </a>
            `).join('')}
          </div>
        ` : ''}
        ${subtasksHTML}
        ${subtaskInputHTML}
        ${!isAddingSubtask && hasSubtasks ? `
          <button class="btn-add-subtask" onclick="startAddSubtask(${todo.id})">
            + Agregar subtarea
          </button>
        ` : ''}
      </div>
    `;
    }).join('');

    todoList.innerHTML = html;
    
    // Reinitialize drag and drop after rendering
    if (dragDropManager && filteredTodos.length > 0) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => dragDropManager.reinit(), 0);
    }
}

// Show empty state
function showEmptyState(customMessage) {
    let message = 'No hay tareas aquí';
    let subtext = 'Agrega tu primera tarea para comenzar';

    if (currentFilter === 'active') {
        message = '¡Excelente trabajo!';
        subtext = 'No tienes tareas pendientes';
    } else if (currentFilter === 'completed') {
        message = 'No hay tareas completadas';
        subtext = 'Completa una tarea para verla aquí';
    }

    if (customMessage) {
        message = customMessage;
        subtext = '';
    }

    todoList.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">${message}</div>
      <div class="empty-subtext">${subtext}</div>
    </div>
  `;
}

// Update statistics
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;

    totalTasksEl.textContent = total;
    activeTasksEl.textContent = active;
    completedTasksEl.textContent = completed;
}

// Setup realtime subscription
function setupRealtimeSubscription() {
    supabase
        .channel('todos')
        .on('postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'todos',
                filter: `user_id=eq.${currentUser.id}`
            },
            (payload) => {
                // Reload todos on any change
                loadTodos();
            }
        )
        .subscribe();
}

// Logout
async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    }
    window.location.href = 'index.html';
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Utility function to escape regex special characters
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Update category selector
function updateCategorySelector() {
    categorySelect.innerHTML = categoriesManager.renderCategorySelector();
}

// Toggle subtasks visibility
function toggleSubtasks(todoId) {
    if (expandedTodos.has(todoId)) {
        expandedTodos.delete(todoId);
    } else {
        expandedTodos.add(todoId);
    }
    renderTodos();
}

// Open share modal
function openShareModal(todoId, todoText) {
    sharingManager.openModal(todoId, todoText);
}

// Start adding subtask
function startAddSubtask(parentId) {
    addingSubtaskToId = parentId;
    renderTodos();
}

// Cancel adding subtask
function cancelAddSubtask() {
    addingSubtaskToId = null;
    renderTodos();
}

// Add subtask
async function addSubtask(parentId) {
    const input = document.getElementById(`subtask-input-${parentId}`);
    const text = input.value.trim();

    if (!text) return;

    try {
        const { data, error } = await supabase
            .from('todos')
            .insert([{
                user_id: currentUser.id,
                text: text,
                completed: false,
                parent_id: parentId,
                is_subtask: true
            }])
            .select();

        if (error) throw error;

        // Add subtask to parent
        const parent = todos.find(t => t.id === parentId);
        if (parent) {
            if (!parent.subtasks) parent.subtasks = [];
            parent.subtasks.push(data[0]);
        }

        addingSubtaskToId = null;
        expandedTodos.add(parentId);
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error adding subtask:', error);
        alert('Error al agregar la subtarea.');
    }
}

// Toggle subtask completion
async function toggleSubtask(subtaskId, parentId) {
    try {
        const parent = todos.find(t => t.id === parentId);
        const subtask = parent?.subtasks?.find(st => st.id === subtaskId);
        
        if (!subtask) return;

        const { error } = await supabase
            .from('todos')
            .update({ completed: !subtask.completed })
            .eq('id', subtaskId);

        if (error) throw error;

        subtask.completed = !subtask.completed;
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error toggling subtask:', error);
        alert('Error al actualizar la subtarea.');
    }
}

// Delete subtask
async function deleteSubtask(subtaskId, parentId) {
    if (!confirm('¿Estás seguro de eliminar esta subtarea?')) return;

    try {
        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', subtaskId);

        if (error) throw error;

        const parent = todos.find(t => t.id === parentId);
        if (parent?.subtasks) {
            parent.subtasks = parent.subtasks.filter(st => st.id !== subtaskId);
        }

        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error deleting subtask:', error);
        alert('Error al eliminar la subtarea.');
    }
}

// Calculate subtask progress
function getSubtaskProgress(todo) {
    if (!todo.subtasks || todo.subtasks.length === 0) {
        return null;
    }
    
    const total = todo.subtasks.length;
    const completed = todo.subtasks.filter(st => st.completed).length;
    const percentage = Math.round((completed / total) * 100);
    
    return { total, completed, percentage };
}

// Render category filters
function renderCategoryFilters() {
    const filtersContainer = document.getElementById('categoryFilters');
    const categoriesHTML = categoriesManager.renderCategoryFilters();
    const manageBtn = '<button class="btn-categories" onclick="categoriesManager.openModal()">📋 Categorías</button>';
    
    filtersContainer.innerHTML = categoriesHTML + manageBtn;
    
    // Add event listeners to category filters
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                currentCategoryFilter = null;
            } else {
                document.querySelectorAll('.category-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategoryFilter = btn.dataset.category;
            }
            renderTodos();
        });
    });
}
