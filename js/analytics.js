// Analytics Page Logic

// DOM Elements
const logoutBtn = document.getElementById('logoutBtn');
const dateRangeBtns = document.querySelectorAll('.date-range-btn');
const completionRateEl = document.getElementById('completionRate');
const dailyAverageEl = document.getElementById('dailyAverage');
const currentStreakEl = document.getElementById('currentStreak');
const avgCompletionTimeEl = document.getElementById('avgCompletionTime');
const exportReportBtn = document.getElementById('exportReportBtn');

let currentUser = null;
let todos = [];
let categories = [];
let selectedRange = 7; // days
let charts = {};

// Initialize
init();

async function init() {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = session.user;

    // Load data
    await loadTodos();
    await loadCategories();

    // Setup event listeners
    setupEventListeners();

    // Render initial analytics
    renderAnalytics();
}

function setupEventListeners() {
    // Logout
    logoutBtn.addEventListener('click', logout);

    // Date range buttons
    dateRangeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            dateRangeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedRange = btn.dataset.range;
            renderAnalytics();
        });
    });

    // Export report
    exportReportBtn.addEventListener('click', exportReport);
}

// Load todos
async function loadTodos() {
    try {
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: true });

        if (error) throw error;

        todos = data || [];
    } catch (error) {
        console.error('Error loading todos:', error);
    }
}

// Load categories
async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', currentUser.id);

        if (error) throw error;

        categories = data || [];
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Filter todos by date range
function getFilteredTodos() {
    if (selectedRange === 'all') return todos;

    const days = parseInt(selectedRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return todos.filter(t => new Date(t.created_at) >= cutoffDate);
}

// Render analytics
function renderAnalytics() {
    const filteredTodos = getFilteredTodos();

    if (filteredTodos.length === 0) {
        showEmptyState();
        return;
    }

    // Update overview stats
    updateOverviewStats(filteredTodos);

    // Render charts
    renderCompletionChart(filteredTodos);
    renderPriorityChart(filteredTodos);
    renderCategoryChart(filteredTodos);
    renderWeekdayChart(filteredTodos);

    // Render detailed stats
    renderTopCategories(filteredTodos);
    renderRecentActivity(filteredTodos);
}

// Update overview stats
function updateOverviewStats(filteredTodos) {
    const completed = filteredTodos.filter(t => t.completed).length;
    const total = filteredTodos.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    completionRateEl.textContent = `${completionRate}%`;

    // Daily average
    const days = selectedRange === 'all' ? 
        Math.ceil((new Date() - new Date(filteredTodos[0]?.created_at || new Date())) / (1000 * 60 * 60 * 24)) : 
        parseInt(selectedRange);
    const dailyAvg = days > 0 ? (completed / days).toFixed(1) : 0;
    dailyAverageEl.textContent = dailyAvg;

    // Current streak
    const streak = calculateStreak();
    currentStreakEl.textContent = `${streak} día${streak !== 1 ? 's' : ''}`;

    // Average completion time
    const avgTime = calculateAvgCompletionTime(filteredTodos);
    avgCompletionTimeEl.textContent = avgTime;
}

// Calculate current streak
function calculateStreak() {
    const completedTodos = todos.filter(t => t.completed).sort((a, b) => 
        new Date(b.updated_at) - new Date(a.updated_at)
    );

    if (completedTodos.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const todo of completedTodos) {
        const todoDate = new Date(todo.updated_at);
        todoDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((currentDate - todoDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak) {
            streak++;
        } else if (diffDays > streak) {
            break;
        }
    }

    return streak;
}

// Calculate average completion time
function calculateAvgCompletionTime(filteredTodos) {
    const completedTodos = filteredTodos.filter(t => t.completed);
    
    if (completedTodos.length === 0) return '0h';

    let totalTime = 0;
    
    completedTodos.forEach(todo => {
        const created = new Date(todo.created_at);
        const completed = new Date(todo.updated_at);
        const diff = completed - created;
        totalTime += diff;
    });

    const avgMs = totalTime / completedTodos.length;
    const avgHours = Math.round(avgMs / (1000 * 60 * 60));
    
    if (avgHours < 24) {
        return `${avgHours}h`;
    } else {
        const days = Math.round(avgHours / 24);
        return `${days}d`;
    }
}

// Render completion chart
function renderCompletionChart(filteredTodos) {
    const ctx = document.getElementById('completionChart');
    
    // Destroy existing chart
    if (charts.completion) {
        charts.completion.destroy();
    }

    // Group by date
    const dateGroups = {};
    filteredTodos.forEach(todo => {
        const date = new Date(todo.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        if (!dateGroups[date]) {
            dateGroups[date] = { created: 0, completed: 0 };
        }
        dateGroups[date].created++;
        if (todo.completed) {
            dateGroups[date].completed++;
        }
    });

    const labels = Object.keys(dateGroups);
    const createdData = Object.values(dateGroups).map(g => g.created);
    const completedData = Object.values(dateGroups).map(g => g.completed);

    charts.completion = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Creadas',
                    data: createdData,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Completadas',
                    data: completedData,
                    borderColor: 'rgba(79, 172, 254, 1)',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

// Render priority chart
function renderPriorityChart(filteredTodos) {
    const ctx = document.getElementById('priorityChart');
    
    if (charts.priority) {
        charts.priority.destroy();
    }

    const priorities = {
        high: filteredTodos.filter(t => t.priority === 'high').length,
        medium: filteredTodos.filter(t => t.priority === 'medium').length,
        low: filteredTodos.filter(t => t.priority === 'low').length
    };

    charts.priority = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Alta', 'Media', 'Baja'],
            datasets: [{
                data: [priorities.high, priorities.medium, priorities.low],
                backgroundColor: [
                    'rgba(245, 87, 108, 0.8)',
                    'rgba(255, 216, 155, 0.8)',
                    'rgba(74, 222, 128, 0.8)'
                ],
                borderColor: [
                    'rgba(245, 87, 108, 1)',
                    'rgba(255, 216, 155, 1)',
                    'rgba(74, 222, 128, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'rgba(255, 255, 255, 0.7)', padding: 15 }
                }
            }
        }
    });
}

// Render category chart
function renderCategoryChart(filteredTodos) {
    const ctx = document.getElementById('categoryChart');
    
    if (charts.category) {
        charts.category.destroy();
    }

    const categoryCounts = {};
    const categoryColors = {};
    
    categories.forEach(cat => {
        categoryCounts[cat.name] = 0;
        categoryColors[cat.name] = cat.color;
    });
    
    categoryCounts['Sin categoría'] = 0;
    categoryColors['Sin categoría'] = '#64748b';

    filteredTodos.forEach(todo => {
        if (todo.category_id) {
            const cat = categories.find(c => c.id === todo.category_id);
            if (cat) {
                categoryCounts[cat.name]++;
            }
        } else {
            categoryCounts['Sin categoría']++;
        }
    });

    const labels = Object.keys(categoryCounts).filter(k => categoryCounts[k] > 0);
    const data = labels.map(l => categoryCounts[l]);
    const colors = labels.map(l => categoryColors[l]);

    charts.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tareas',
                data: data,
                backgroundColor: colors.map(c => c + '80'),
                borderColor: colors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: 'rgba(255, 255, 255, 0.5)', stepSize: 1 },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                    grid: { display: false }
                }
            }
        }
    });
}

// Render weekday chart
function renderWeekdayChart(filteredTodos) {
    const ctx = document.getElementById('weekdayChart');
    
    if (charts.weekday) {
        charts.weekday.destroy();
    }

    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    filteredTodos.filter(t => t.completed).forEach(todo => {
        const day = new Date(todo.updated_at).getDay();
        counts[day]++;
    });

    charts.weekday = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weekdays,
            datasets: [{
                label: 'Completadas',
                data: counts,
                backgroundColor: 'rgba(79, 172, 254, 0.6)',
                borderColor: 'rgba(79, 172, 254, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: 'rgba(255, 255, 255, 0.5)', stepSize: 1 },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                    grid: { display: false }
                }
            }
        }
    });
}

// Render top categories
function renderTopCategories(filteredTodos) {
    const tbody = document.querySelector('#topCategoriesTable tbody');
    
    const categoryStats = {};
    
    categories.forEach(cat => {
        categoryStats[cat.id] = {
            name: cat.name,
            color: cat.color,
            total: 0,
            completed: 0
        };
    });

    filteredTodos.forEach(todo => {
        if (todo.category_id && categoryStats[todo.category_id]) {
            categoryStats[todo.category_id].total++;
            if (todo.completed) {
                categoryStats[todo.category_id].completed++;
            }
        }
    });

    const sortedCategories = Object.values(categoryStats)
        .filter(c => c.total > 0)
        .sort((a, b) => b.completed - a.completed)
        .slice(0, 5);

    if (sortedCategories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No hay datos suficientes</td></tr>';
        return;
    }

    tbody.innerHTML = sortedCategories.map(cat => {
        const rate = Math.round((cat.completed / cat.total) * 100);
        const rateClass = rate >= 70 ? 'high' : rate >= 40 ? 'medium' : 'low';
        
        return `
            <tr>
                <td>
                    <div class="category-cell">
                        <div class="category-dot" style="background-color: ${cat.color}"></div>
                        ${cat.name}
                    </div>
                </td>
                <td>${cat.completed}/${cat.total}</td>
                <td><span class="completion-rate ${rateClass}">${rate}%</span></td>
            </tr>
        `;
    }).join('');
}

// Render recent activity
function renderRecentActivity(filteredTodos) {
    const container = document.getElementById('activityList');
    
    const recentTodos = [...filteredTodos]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5);

    if (recentTodos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No hay actividad reciente</p>';
        return;
    }

    container.innerHTML = recentTodos.map(todo => {
        const icon = todo.completed ? '✅' : '📝';
        const action = todo.completed ? 'completó' : 'creó';
        const time = formatRelativeTime(new Date(todo.updated_at));
        
        return `
            <div class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-content">
                    <div class="activity-text">
                        ${action === 'completó' ? 'Completaste' : 'Creaste'}: "${todo.text.substring(0, 40)}${todo.text.length > 40 ? '...' : ''}"
                    </div>
                    <div class="activity-time">${time}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Format relative time
function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    return 'Hace un momento';
}

// Show empty state
function showEmptyState() {
    document.querySelector('.analytics-overview').innerHTML = `
        <div class="analytics-empty" style="grid-column: 1 / -1;">
            <div class="analytics-empty-icon">📊</div>
            <div class="analytics-empty-text">No hay datos suficientes</div>
            <div class="analytics-empty-subtext">Crea y completa tareas para ver tus estadísticas</div>
        </div>
    `;
}

// Export report (placeholder - full implementation would use jsPDF)
async function exportReport() {
    alert('📄 Función de exportación a PDF en desarrollo. Por ahora puedes usar la funcionalidad de exportación en la página principal.');
}

// Logout
async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    }
    window.location.href = 'index.html';
}
