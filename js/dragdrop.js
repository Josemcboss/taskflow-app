// Drag and Drop Module using SortableJS

class DragDropManager {
    constructor(supabase, userId) {
        this.supabase = supabase;
        this.userId = userId;
        this.sortable = null;
    }

    // Initialize drag and drop
    init() {
        const todoListEl = document.getElementById('todoList');
        
        if (!todoListEl || typeof Sortable === 'undefined') {
            console.warn('Sortable.js not loaded or todo list element not found');
            return;
        }

        this.sortable = Sortable.create(todoListEl, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            handle: '.todo-item',
            filter: '.todo-edit-input, .btn-icon, .todo-checkbox, .subtask-toggle, .subtasks-container',
            preventOnFilter: true,
            
            onStart: (evt) => {
                // Add dragging class to body
                document.body.classList.add('is-dragging');
            },
            
            onEnd: async (evt) => {
                // Remove dragging class
                document.body.classList.remove('is-dragging');
                
                // If position didn't change, do nothing
                if (evt.oldIndex === evt.newIndex) {
                    return;
                }

                // Update positions
                await this.updatePositions(evt.oldIndex, evt.newIndex);
            }
        });
    }

    // Update positions in database
    async updatePositions(oldIndex, newIndex) {
        try {
            // Get current visible todos from the DOM
            const todoElements = document.querySelectorAll('.todo-item');
            const todoIds = Array.from(todoElements).map(el => {
                // Extract todo ID from onclick attribute
                const checkboxEl = el.querySelector('.todo-checkbox');
                if (checkboxEl) {
                    const onclickAttr = checkboxEl.getAttribute('onclick');
                    const match = onclickAttr.match(/toggleTodo\((\d+)\)/);
                    return match ? parseInt(match[1]) : null;
                }
                return null;
            }).filter(id => id !== null);

            // Update positions in database
            const updates = todoIds.map((id, index) => ({
                id: id,
                position: index
            }));

            // Batch update
            for (const update of updates) {
                await this.supabase
                    .from('todos')
                    .update({ position: update.position })
                    .eq('id', update.id);
            }

            console.log('Positions updated successfully');
        } catch (error) {
            console.error('Error updating positions:', error);
        }
    }

    // Destroy sortable instance
    destroy() {
        if (this.sortable) {
            this.sortable.destroy();
            this.sortable = null;
        }
    }

    // Reinitialize (useful when todo list changes)
    reinit() {
        this.destroy();
        this.init();
    }
}

// Global instance (will be initialized in app.js)
let dragDropManager = null;
