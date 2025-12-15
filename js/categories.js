// Categories Management Module

class CategoriesManager {
    constructor(supabase, userId) {
        this.supabase = supabase;
        this.userId = userId;
        this.categories = [];
        this.modal = null;
        this.onCategoryChange = null; // Callback when categories change
    }

    // Initialize categories
    async init() {
        await this.loadCategories();
        this.createModal();
        this.setupEventListeners();
    }

    // Load categories from Supabase
    async loadCategories() {
        try {
            const { data, error } = await this.supabase
                .from('categories')
                .select('*')
                .eq('user_id', this.userId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            this.categories = data || [];
            return this.categories;
        } catch (error) {
            console.error('Error loading categories:', error);
            return [];
        }
    }

    // Get all categories
    getCategories() {
        return this.categories;
    }

    // Create category modal HTML
    createModal() {
        const modalHTML = `
            <div id="categoryModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Gestionar Categorías</h2>
                        <button class="modal-close" onclick="categoriesManager.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <!-- Add Category Form -->
                        <div class="category-form">
                            <input type="text" id="categoryName" class="category-input" 
                                   placeholder="Nombre de la categoría" maxlength="50">
                            <input type="color" id="categoryColor" class="category-color-picker" value="#667eea">
                            <select id="categoryIcon" class="category-icon-select">
                                <option value="📁">📁 Carpeta</option>
                                <option value="💼">💼 Trabajo</option>
                                <option value="🏠">🏠 Casa</option>
                                <option value="📚">📚 Estudios</option>
                                <option value="🏥">🏥 Salud</option>
                                <option value="🎮">🎮 Ocio</option>
                                <option value="🛒">🛒 Compras</option>
                                <option value="💰">💰 Finanzas</option>
                                <option value="🎯">🎯 Metas</option>
                                <option value="⭐">⭐ Importante</option>
                            </select>
                            <button id="addCategoryBtn" class="btn-primary">Agregar</button>
                        </div>

                        <!-- Categories List -->
                        <div id="categoriesList" class="categories-list">
                            <!-- Categories will be rendered here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body if it doesn't exist
        if (!document.getElementById('categoryModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.modal = document.getElementById('categoryModal');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        const addBtn = document.getElementById('addCategoryBtn');
        const nameInput = document.getElementById('categoryName');

        addBtn.addEventListener('click', () => this.addCategory());
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCategory();
        });

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    // Open modal
    openModal() {
        this.modal.style.display = 'flex';
        this.renderCategories();
        document.getElementById('categoryName').focus();
    }

    // Close modal
    closeModal() {
        this.modal.style.display = 'none';
        document.getElementById('categoryName').value = '';
        document.getElementById('categoryColor').value = '#667eea';
        document.getElementById('categoryIcon').value = '📁';
    }

    // Add new category
    async addCategory() {
        const nameInput = document.getElementById('categoryName');
        const colorInput = document.getElementById('categoryColor');
        const iconInput = document.getElementById('categoryIcon');

        const name = nameInput.value.trim();
        const color = colorInput.value;
        const icon = iconInput.value;

        if (!name) {
            alert('Por favor ingresa un nombre para la categoría');
            return;
        }

        try {
            const { data, error } = await this.supabase
                .from('categories')
                .insert([{
                    user_id: this.userId,
                    name: name,
                    color: color,
                    icon: icon
                }])
                .select();

            if (error) throw error;

            this.categories.push(data[0]);
            this.renderCategories();
            
            // Clear form
            nameInput.value = '';
            colorInput.value = '#667eea';
            iconInput.value = '📁';

            // Notify change
            if (this.onCategoryChange) {
                this.onCategoryChange();
            }
        } catch (error) {
            console.error('Error adding category:', error);
            if (error.code === '23505') {
                alert('Ya existe una categoría con ese nombre');
            } else {
                alert('Error al crear la categoría');
            }
        }
    }

    // Delete category
    async deleteCategory(id) {
        if (!confirm('¿Estás seguro de eliminar esta categoría? Las tareas asociadas no se eliminarán.')) {
            return;
        }

        try {
            const { error } = await this.supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.categories = this.categories.filter(c => c.id !== id);
            this.renderCategories();

            // Notify change
            if (this.onCategoryChange) {
                this.onCategoryChange();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Error al eliminar la categoría');
        }
    }

    // Render categories list
    renderCategories() {
        const listEl = document.getElementById('categoriesList');
        
        if (this.categories.length === 0) {
            listEl.innerHTML = '<p class="empty-message">No hay categorías. ¡Crea la primera!</p>';
            return;
        }

        const html = this.categories.map(cat => `
            <div class="category-item" style="border-left: 4px solid ${cat.color}">
                <span class="category-icon">${cat.icon}</span>
                <span class="category-name">${this.escapeHtml(cat.name)}</span>
                <div class="category-color-preview" style="background: ${cat.color}"></div>
                <button class="btn-icon-small btn-delete-small" 
                        onclick="categoriesManager.deleteCategory(${cat.id})"
                        title="Eliminar">
                    🗑
                </button>
            </div>
        `).join('');

        listEl.innerHTML = html;
    }

    // Render category selector for todo form
    renderCategorySelector(selectedId = null) {
        const options = [
            '<option value="">Sin categoría</option>',
            ...this.categories.map(cat => `
                <option value="${cat.id}" ${selectedId == cat.id ? 'selected' : ''}>
                    ${cat.icon} ${this.escapeHtml(cat.name)}
                </option>
            `)
        ];

        return options.join('');
    }

    // Render category filter buttons
    renderCategoryFilters() {
        if (this.categories.length === 0) return '';

        return this.categories.map(cat => `
            <button class="filter-btn category-filter" 
                    data-category="${cat.id}"
                    style="border-color: ${cat.color}">
                ${cat.icon} ${this.escapeHtml(cat.name)}
            </button>
        `).join('');
    }

    // Get category by ID
    getCategoryById(id) {
        return this.categories.find(c => c.id == id);
    }

    // Render category badge for todo item
    renderCategoryBadge(categoryId) {
        if (!categoryId) return '';
        
        const category = this.getCategoryById(categoryId);
        if (!category) return '';

        return `
            <span class="category-badge" style="background: ${category.color}15; border-color: ${category.color}; color: ${category.color}">
                ${category.icon} ${this.escapeHtml(category.name)}
            </span>
        `;
    }

    // Utility function
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Global instance (will be initialized in app.js)
let categoriesManager = null;
