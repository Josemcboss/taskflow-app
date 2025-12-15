// Task Sharing Manager

class SharingManager {
    constructor(supabase, userId) {
        this.supabase = supabase;
        this.userId = userId;
        this.modal = null;
        this.currentTodoId = null;
        this.sharedTasks = new Map(); // Map of todo_id to shared users
    }

    async init() {
        // Create sharing modal
        this.createModal();
        
        // Load shared tasks
        await this.loadSharedTasks();
    }

    createModal() {
        const modalHTML = `
            <div class="modal" id="sharingModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>🔗 Compartir Tarea</h2>
                        <button class="modal-close" id="closeSharingModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="share-section">
                            <p class="share-description">Comparte esta tarea con otros usuarios por email</p>
                            
                            <div class="share-input-group">
                                <input 
                                    type="email" 
                                    id="shareEmailInput" 
                                    class="share-email-input" 
                                    placeholder="email@ejemplo.com"
                                >
                                <select id="sharePermissionSelect" class="share-permission-select">
                                    <option value="view">👁 Solo ver</option>
                                    <option value="edit">✏️ Puede editar</option>
                                </select>
                                <button class="btn-share-add" id="addShareBtn">Compartir</button>
                            </div>
                        </div>

                        <div class="shared-users-section" id="sharedUsersSection">
                            <h3>Usuarios con acceso</h3>
                            <div class="shared-users-list" id="sharedUsersList">
                                <!-- Shared users will be listed here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        this.modal = document.getElementById('sharingModal');
        this.setupModalListeners();
    }

    setupModalListeners() {
        const closeBtn = document.getElementById('closeSharingModal');
        const addShareBtn = document.getElementById('addShareBtn');
        const emailInput = document.getElementById('shareEmailInput');

        closeBtn.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        addShareBtn.addEventListener('click', () => this.shareTask());
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.shareTask();
        });
    }

    async openModal(todoId, todoText) {
        this.currentTodoId = todoId;
        
        // Update modal title with task text
        const modalBody = this.modal.querySelector('.modal-body');
        const taskPreview = modalBody.querySelector('.task-preview');
        if (taskPreview) {
            taskPreview.textContent = todoText;
        } else {
            const description = modalBody.querySelector('.share-description');
            description.innerHTML = `Comparte esta tarea con otros usuarios por email: <br><strong>"${this.escapeHtml(todoText)}"</strong>`;
        }

        // Load current shares
        await this.loadSharesForTask(todoId);

        // Show modal
        this.modal.classList.add('active');
        document.getElementById('shareEmailInput').value = '';
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.currentTodoId = null;
    }

    async shareTask() {
        const emailInput = document.getElementById('shareEmailInput');
        const permissionSelect = document.getElementById('sharePermissionSelect');
        const addShareBtn = document.getElementById('addShareBtn');

        const email = emailInput.value.trim().toLowerCase();
        const permission = permissionSelect.value;

        if (!email) {
            alert('Por favor ingresa un email');
            return;
        }

        if (!this.validateEmail(email)) {
            alert('Por favor ingresa un email válido');
            return;
        }

        if (email === this.userEmail) {
            alert('No puedes compartir contigo mismo');
            return;
        }

        addShareBtn.disabled = true;
        addShareBtn.textContent = 'Compartiendo...';

        // Note: Feature temporarily disabled - requires RPC function
        // TODO: Create Supabase RPC function: get_user_id_by_email
        alert('⚠️ La funcionalidad de compartir tareas está temporalmente deshabilitada.\n\nRequiere configuración adicional en el servidor (función RPC en Supabase).');
        
        addShareBtn.disabled = false;
        addShareBtn.textContent = 'Compartir';
        
        /* Uncomment when RPC function is ready:
        
        try {
            // Get user ID by email using RPC function
            const { data: userId, error: userError } = await this.supabase
                .rpc('get_user_id_by_email', { user_email: email });

            if (userError || !userId) {
                alert('No se encontró un usuario con ese email');
                return;
            }

            // Check if already shared
            const { data: existing } = await this.supabase
                .from('shared_todos')
                .select('id')
                .eq('todo_id', this.currentTodoId)
                .eq('shared_with', userId)
                .single();

            if (existing) {
                alert('Esta tarea ya está compartida con este usuario');
                return;
            }

            // Create share
            const { error: shareError } = await this.supabase
                .from('shared_todos')
                .insert([{
                    todo_id: this.currentTodoId,
                    shared_by: this.userId,
                    shared_with: userId,
                    permission: permission
                }]);

            if (shareError) throw shareError;

            alert(`✅ Tarea compartida con ${email}`);
            emailInput.value = '';

            // Reload shares
            await this.loadSharesForTask(this.currentTodoId);

            // Update shared tasks map
            await this.loadSharedTasks();

        } catch (error) {
            console.error('Error sharing task:', error);
            alert('Error al compartir la tarea');
        } finally {
            addShareBtn.disabled = false;
            addShareBtn.textContent = 'Compartir';
        }
        */
    }

    async loadSharesForTask(todoId) {
        try {
            // Get shares for this task
            const { data: sharesData, error } = await this.supabase
                .from('shared_todos')
                .select('id, permission, created_at, shared_with')
                .eq('todo_id', todoId)
                .eq('shared_by', this.userId);

            if (error) throw error;

            // Get user profiles for each share
            const data = await Promise.all((sharesData || []).map(async (share) => {
                const { data: profileData } = await this.supabase
                    .from('user_profiles')
                    .select('display_name, avatar_url')
                    .eq('id', share.shared_with)
                    .single();
                
                return {
                    ...share,
                    user_profiles: profileData
                };
            }));

            this.renderSharedUsers(data);

        } catch (error) {
            console.error('Error loading shares:', error);
        }
    }

    renderSharedUsers(shares) {
        const container = document.getElementById('sharedUsersList');

        if (shares.length === 0) {
            container.innerHTML = '<p class="no-shares">No has compartido esta tarea aún</p>';
            return;
        }

        const html = shares.map(share => {
            const profile = share.user_profiles;
            const displayName = profile?.display_name || 'Usuario';
            const permission = share.permission === 'edit' ? '✏️ Puede editar' : '👁 Solo ver';

            return `
                <div class="shared-user-item">
                    <div class="shared-user-info">
                        ${profile?.avatar_url ? 
                            `<img src="${profile.avatar_url}" alt="${displayName}" class="shared-user-avatar">` :
                            `<div class="shared-user-avatar-placeholder">👤</div>`
                        }
                        <div class="shared-user-details">
                            <div class="shared-user-name">${this.escapeHtml(displayName)}</div>
                            <div class="shared-user-permission">${permission}</div>
                        </div>
                    </div>
                    <button 
                        class="btn-remove-share" 
                        onclick="sharingManager.removeShare(${share.id}, ${this.currentTodoId})"
                        title="Dejar de compartir">
                        🗑
                    </button>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    async removeShare(shareId, todoId) {
        if (!confirm('¿Dejar de compartir con este usuario?')) return;

        try {
            const { error } = await this.supabase
                .from('shared_todos')
                .delete()
                .eq('id', shareId);

            if (error) throw error;

            alert('✅ Compartición eliminada');
            await this.loadSharesForTask(todoId);
            await this.loadSharedTasks();

        } catch (error) {
            console.error('Error removing share:', error);
            alert('Error al eliminar la compartición');
        }
    }

    async loadSharedTasks() {
        try {
            // Load tasks I've shared
            const { data, error } = await this.supabase
                .from('shared_todos')
                .select('todo_id, shared_with')
                .eq('shared_by', this.userId);

            if (error) throw error;

            // Build map
            this.sharedTasks.clear();
            (data || []).forEach(share => {
                if (!this.sharedTasks.has(share.todo_id)) {
                    this.sharedTasks.set(share.todo_id, []);
                }
                this.sharedTasks.get(share.todo_id).push(share.shared_with);
            });

        } catch (error) {
            console.error('Error loading shared tasks:', error);
        }
    }

    isShared(todoId) {
        return this.sharedTasks.has(todoId);
    }

    getSharedCount(todoId) {
        return this.sharedTasks.get(todoId)?.length || 0;
    }

    // Helpers
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in app.js
window.SharingManager = SharingManager;
