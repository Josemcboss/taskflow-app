// Export Data Module

class ExportManager {
    constructor(supabase, userId) {
        this.supabase = supabase;
        this.userId = userId;
        this.modal = null;
    }

    init() {
        this.createModal();
    }

    createModal() {
        const modalHTML = `
            <div class="modal" id="exportModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📄 Exportar Datos</h2>
                        <button class="modal-close" id="closeExportModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="export-options">
                            <p class="export-description">Exporta tus tareas en diferentes formatos</p>
                            
                            <div class="export-format-section">
                                <h3>Formato de Exportación</h3>
                                <div class="format-options">
                                    <label class="format-option">
                                        <input type="radio" name="exportFormat" value="pdf" checked>
                                        <div class="format-card">
                                            <div class="format-icon">📄</div>
                                            <div class="format-name">PDF</div>
                                            <div class="format-desc">Documento completo con formato</div>
                                        </div>
                                    </label>
                                    
                                    <label class="format-option">
                                        <input type="radio" name="exportFormat" value="csv">
                                        <div class="format-card">
                                            <div class="format-icon">📊</div>
                                            <div class="format-name">CSV</div>
                                            <div class="format-desc">Compatible con Excel</div>
                                        </div>
                                    </label>
                                    
                                    <label class="format-option">
                                        <input type="radio" name="exportFormat" value="json">
                                        <div class="format-card">
                                            <div class="format-icon">💾</div>
                                            <div class="format-name">JSON</div>
                                            <div class="format-desc">Respaldo completo de datos</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div class="export-filters-section">
                                <h3>Filtros</h3>
                                <div class="export-filters">
                                    <label class="export-checkbox">
                                        <input type="checkbox" id="exportCompleted" checked>
                                        <span>Incluir tareas completadas</span>
                                    </label>
                                    <label class="export-checkbox">
                                        <input type="checkbox" id="exportActive" checked>
                                        <span>Incluir tareas activas</span>
                                    </label>
                                    <label class="export-checkbox">
                                        <input type="checkbox" id="exportSubtasks" checked>
                                        <span>Incluir subtareas</span>
                                    </label>
                                    <label class="export-checkbox">
                                        <input type="checkbox" id="exportNotes" checked>
                                        <span>Incluir notas</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel-export" id="cancelExportBtn">Cancelar</button>
                        <button class="btn-export-confirm" id="confirmExportBtn">Exportar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        this.modal = document.getElementById('exportModal');
        this.setupModalListeners();
    }

    setupModalListeners() {
        const closeBtn = document.getElementById('closeExportModal');
        const cancelBtn = document.getElementById('cancelExportBtn');
        const confirmBtn = document.getElementById('confirmExportBtn');

        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        confirmBtn.addEventListener('click', () => this.confirmExport());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
    }

    openModal() {
        this.modal.classList.add('active');
    }

    closeModal() {
        this.modal.classList.remove('active');
    }

    async confirmExport() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        const includeCompleted = document.getElementById('exportCompleted').checked;
        const includeActive = document.getElementById('exportActive').checked;
        const includeSubtasks = document.getElementById('exportSubtasks').checked;
        const includeNotes = document.getElementById('exportNotes').checked;

        const confirmBtn = document.getElementById('confirmExportBtn');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Exportando...';

        try {
            // Get all data
            const todos = await this.getTodos();
            const categories = await this.getCategories();

            // Filter todos
            let filteredTodos = todos.filter(t => !t.parent_id); // Only parent tasks

            if (!includeCompleted) {
                filteredTodos = filteredTodos.filter(t => !t.completed);
            }
            if (!includeActive) {
                filteredTodos = filteredTodos.filter(t => t.completed);
            }

            // Add subtasks if needed
            if (includeSubtasks) {
                filteredTodos = filteredTodos.map(todo => ({
                    ...todo,
                    subtasks: todos.filter(t => t.parent_id === todo.id)
                }));
            }

            // Export based on format
            switch (format) {
                case 'pdf':
                    await this.exportPDF(filteredTodos, categories, includeNotes);
                    break;
                case 'csv':
                    this.exportCSV(filteredTodos, includeNotes);
                    break;
                case 'json':
                    this.exportJSON(filteredTodos, categories, includeNotes, includeSubtasks);
                    break;
            }

            this.closeModal();
            alert('✅ Datos exportados correctamente');

        } catch (error) {
            console.error('Error exporting:', error);
            alert('Error al exportar los datos');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Exportar';
        }
    }

    async getTodos() {
        const { data, error } = await this.supabase
            .from('todos')
            .select('*')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async getCategories() {
        const { data, error } = await this.supabase
            .from('categories')
            .select('*')
            .eq('user_id', this.userId);

        if (error) throw error;
        return data || [];
    }

    // Export to PDF using jsPDF
    async exportPDF(todos, categories, includeNotes) {
        // Load jsPDF dynamically
        if (!window.jspdf) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.0/jspdf.plugin.autotable.min.js');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text('TaskFlow - Reporte de Tareas', 14, 20);

        // Date
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`, 14, 28);

        // Stats
        const completed = todos.filter(t => t.completed).length;
        const active = todos.filter(t => !t.completed).length;
        
        doc.setFontSize(12);
        doc.text(`Total de tareas: ${todos.length}`, 14, 38);
        doc.text(`Completadas: ${completed}`, 14, 45);
        doc.text(`Activas: ${active}`, 14, 52);

        // Table data
        const tableData = todos.map(todo => {
            const category = categories.find(c => c.id === todo.category_id);
            const priority = {
                high: 'Alta',
                medium: 'Media',
                low: 'Baja'
            }[todo.priority || 'medium'];

            return [
                todo.text,
                priority,
                category?.name || 'Sin categoría',
                todo.completed ? 'Sí' : 'No'
            ];
        });

        // Add table
        doc.autoTable({
            startY: 60,
            head: [['Tarea', 'Prioridad', 'Categoría', 'Completada']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [102, 126, 234] }
        });

        // Add notes if included
        if (includeNotes) {
            const todosWithNotes = todos.filter(t => t.notes);
            
            if (todosWithNotes.length > 0) {
                doc.addPage();
                doc.setFontSize(16);
                doc.text('Notas de Tareas', 14, 20);
                
                let yPos = 30;
                todosWithNotes.forEach(todo => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text(todo.text.substring(0, 60), 14, yPos);
                    
                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    const lines = doc.splitTextToSize(todo.notes, 180);
                    doc.text(lines, 14, yPos + 7);
                    
                    yPos += 7 + (lines.length * 5) + 10;
                });
            }
        }

        // Save
        doc.save(`TaskFlow_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    // Export to CSV
    exportCSV(todos, includeNotes) {
        const headers = ['Tarea', 'Prioridad', 'Categoría', 'Completada', 'Fecha Creación'];
        if (includeNotes) headers.push('Notas');

        const rows = todos.map(todo => {
            const row = [
                this.escapeCSV(todo.text),
                todo.priority || 'medium',
                todo.category_id || '',
                todo.completed ? 'Sí' : 'No',
                new Date(todo.created_at).toLocaleDateString('es-ES')
            ];
            
            if (includeNotes) {
                row.push(this.escapeCSV(todo.notes || ''));
            }
            
            return row.join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        this.downloadFile(csv, `TaskFlow_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    }

    // Export to JSON
    exportJSON(todos, categories, includeNotes, includeSubtasks) {
        const data = {
            exportDate: new Date().toISOString(),
            version: '2.0',
            categories: categories,
            todos: todos.map(todo => {
                const obj = {
                    id: todo.id,
                    text: todo.text,
                    completed: todo.completed,
                    priority: todo.priority,
                    category_id: todo.category_id,
                    created_at: todo.created_at,
                    updated_at: todo.updated_at
                };

                if (includeNotes && todo.notes) {
                    obj.notes = todo.notes;
                }

                if (includeSubtasks && todo.subtasks) {
                    obj.subtasks = todo.subtasks;
                }

                return obj;
            })
        };

        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, `TaskFlow_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    }

    // Helper: Escape CSV values
    escapeCSV(str) {
        if (!str) return '';
        str = str.toString().replace(/"/g, '""');
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str}"`;
        }
        return str;
    }

    // Helper: Download file
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Helper: Load external script
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

// Export for use in app.js
window.ExportManager = ExportManager;
