// Notifications Module - Web Notifications API

class NotificationsManager {
    constructor() {
        this.permission = 'default';
        this.checkInterval = null;
        this.enabled = false;
    }

    // Initialize notifications
    async init() {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones de escritorio');
            return false;
        }

        this.permission = Notification.permission;
        
        // Check localStorage for user preference
        const storedPreference = localStorage.getItem('notifications_enabled');
        this.enabled = storedPreference === 'true';

        // If already granted and enabled, start checking
        if (this.permission === 'granted' && this.enabled) {
            this.startChecking();
        }

        return true;
    }

    // Request permission
    async requestPermission() {
        if (!('Notification' in window)) {
            alert('Tu navegador no soporta notificaciones');
            return false;
        }

        if (this.permission === 'granted') {
            this.enable();
            return true;
        }

        if (this.permission === 'denied') {
            alert('Has bloqueado las notificaciones. Por favor, permite las notificaciones en la configuración de tu navegador.');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;

            if (permission === 'granted') {
                this.enable();
                this.showTestNotification();
                return true;
            } else {
                alert('Necesitas permitir las notificaciones para usar esta función');
                return false;
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    // Enable notifications
    enable() {
        this.enabled = true;
        localStorage.setItem('notifications_enabled', 'true');
        this.startChecking();
    }

    // Disable notifications
    disable() {
        this.enabled = false;
        localStorage.setItem('notifications_enabled', 'false');
        this.stopChecking();
    }

    // Toggle notifications
    async toggle() {
        if (!this.enabled) {
            if (this.permission !== 'granted') {
                return await this.requestPermission();
            } else {
                this.enable();
                return true;
            }
        } else {
            this.disable();
            return false;
        }
    }

    // Show test notification
    showTestNotification() {
        this.showNotification(
            '¡Notificaciones activadas!',
            'Recibirás recordatorios de tus tareas próximas a vencer',
            '✓'
        );
    }

    // Show notification
    showNotification(title, body, icon = '✓') {
        if (this.permission !== 'granted' || !this.enabled) {
            return;
        }

        try {
            const notification = new Notification(title, {
                body: body,
                icon: icon,
                badge: icon,
                tag: 'taskflow-notification',
                requireInteraction: false,
                silent: false
            });

            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            // Click handler
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    // Start checking for due tasks
    startChecking() {
        if (this.checkInterval) {
            return; // Already checking
        }

        // Check every 5 minutes
        this.checkInterval = setInterval(() => {
            this.checkDueTasks();
        }, 5 * 60 * 1000);

        // Check immediately
        this.checkDueTasks();
    }

    // Stop checking
    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // Check for tasks due soon
    async checkDueTasks() {
        if (!this.enabled || !window.todos || !window.currentUser) {
            return;
        }

        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const notifiedKey = 'notified_tasks';
        const notifiedTasks = JSON.parse(localStorage.getItem(notifiedKey) || '[]');

        // Filter tasks that are due within 1 hour and not completed
        const dueSoonTasks = window.todos.filter(todo => {
            if (todo.completed || !todo.due_date) return false;
            
            const dueDate = new Date(todo.due_date);
            const isDueSoon = dueDate > now && dueDate <= oneHourFromNow;
            const notAlreadyNotified = !notifiedTasks.includes(todo.id);
            
            return isDueSoon && notAlreadyNotified;
        });

        // Show notifications
        dueSoonTasks.forEach(todo => {
            const dueDate = new Date(todo.due_date);
            const minutesUntilDue = Math.round((dueDate - now) / (1000 * 60));
            
            this.showNotification(
                '⏰ Tarea próxima a vencer',
                `"${todo.text}" vence en ${minutesUntilDue} minutos`,
                '⏰'
            );

            // Mark as notified
            notifiedTasks.push(todo.id);
        });

        // Save notified tasks
        if (dueSoonTasks.length > 0) {
            localStorage.setItem(notifiedKey, JSON.stringify(notifiedTasks));
        }

        // Clean up old notified tasks (older than 24 hours)
        this.cleanupNotifiedTasks();
    }

    // Clean up notified tasks that are old
    cleanupNotifiedTasks() {
        const notifiedKey = 'notified_tasks';
        const notifiedTasks = JSON.parse(localStorage.getItem(notifiedKey) || '[]');
        
        if (!window.todos) return;

        // Keep only tasks that still exist and are not completed
        const validNotifiedTasks = notifiedTasks.filter(taskId => {
            const todo = window.todos.find(t => t.id === taskId);
            return todo && !todo.completed;
        });

        localStorage.setItem(notifiedKey, JSON.stringify(validNotifiedTasks));
    }

    // Get current status
    getStatus() {
        return {
            supported: 'Notification' in window,
            permission: this.permission,
            enabled: this.enabled
        };
    }
}

// Global instance
let notificationsManager = null;
