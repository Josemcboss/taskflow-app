// Profile Page Logic

// DOM Elements
const logoutBtn = document.getElementById('logoutBtn');
const displayNameInput = document.getElementById('displayName');
const emailInput = document.getElementById('email');
const bioInput = document.getElementById('bio');
const bioCharCount = document.getElementById('bioCharCount');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const avatarPreview = document.getElementById('avatarPreview');
const avatarInput = document.getElementById('avatarInput');
const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
const removeAvatarBtn = document.getElementById('removeAvatarBtn');
const notificationsToggle = document.getElementById('notificationsToggle');
const emailRemindersToggle = document.getElementById('emailRemindersToggle');
const themeSelect = document.getElementById('themeSelect');

// Stats elements
const statTotalTasks = document.getElementById('statTotalTasks');
const statCompletedTasks = document.getElementById('statCompletedTasks');
const statActiveTasks = document.getElementById('statActiveTasks');
const statHighPriority = document.getElementById('statHighPriority');
const statOverdueTasks = document.getElementById('statOverdueTasks');
const statCategories = document.getElementById('statCategories');

// Account info elements
const memberSince = document.getElementById('memberSince');
const lastUpdated = document.getElementById('lastUpdated');
const userId = document.getElementById('userId');

let currentUser = null;
let userProfile = null;

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
    
    // Load profile data
    await loadProfile();
    
    // Load statistics
    await loadStatistics();
    
    // Setup event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Logout
    logoutBtn.addEventListener('click', logout);
    
    // Save profile
    saveProfileBtn.addEventListener('click', saveProfile);
    
    // Bio character counter
    bioInput.addEventListener('input', updateBioCharCounter);
    
    // Avatar upload
    uploadAvatarBtn.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', handleAvatarUpload);
    removeAvatarBtn.addEventListener('click', removeAvatar);
    
    // Preferences
    notificationsToggle.addEventListener('change', updatePreferences);
    emailRemindersToggle.addEventListener('change', updatePreferences);
    themeSelect.addEventListener('change', updatePreferences);
}

// Load user profile
async function loadProfile() {
    try {
        // Get or create profile
        let { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        // If no profile exists, create one
        if (!profile) {
            const { data: newProfile, error: createError } = await supabase
                .from('user_profiles')
                .insert([{
                    id: currentUser.id,
                    display_name: currentUser.email.split('@')[0]
                }])
                .select()
                .single();

            if (createError) throw createError;
            profile = newProfile;
        }

        userProfile = profile;
        
        // Populate form
        displayNameInput.value = profile.display_name || '';
        emailInput.value = currentUser.email;
        bioInput.value = profile.bio || '';
        updateBioCharCounter();
        
        // Set avatar
        if (profile.avatar_url) {
            avatarPreview.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar">`;
            removeAvatarBtn.style.display = 'inline-block';
        }
        
        // Set preferences
        notificationsToggle.checked = profile.notifications_enabled !== false;
        emailRemindersToggle.checked = profile.email_reminders === true;
        themeSelect.value = profile.theme || 'dark';
        
        // Set account info
        userId.textContent = currentUser.id;
        memberSince.textContent = formatDate(profile.created_at);
        lastUpdated.textContent = formatDate(profile.updated_at);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error al cargar el perfil');
    }
}

// Save profile
async function saveProfile() {
    const displayName = displayNameInput.value.trim();
    const bio = bioInput.value.trim();

    if (!displayName) {
        alert('Por favor ingresa tu nombre');
        return;
    }

    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = 'Guardando...';

    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({
                display_name: displayName,
                bio: bio,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        alert('✅ Perfil actualizado correctamente');
        await loadProfile();
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error al guardar el perfil');
    } finally {
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Guardar Cambios';
    }
}

// Update bio character counter
function updateBioCharCounter() {
    const length = bioInput.value.length;
    bioCharCount.textContent = length;
}

// Handle avatar upload
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen');
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert('La imagen debe ser menor a 2MB');
        return;
    }

    uploadAvatarBtn.disabled = true;
    uploadAvatarBtn.textContent = 'Subiendo...';

    try {
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}/avatar.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // Update profile with avatar URL
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                avatar_url: publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        if (updateError) throw updateError;

        // Update UI
        avatarPreview.innerHTML = `<img src="${publicUrl}" alt="Avatar">`;
        removeAvatarBtn.style.display = 'inline-block';

        alert('✅ Avatar actualizado correctamente');
    } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Error al subir el avatar. Asegúrate de que el bucket "avatars" existe en Supabase Storage.');
    } finally {
        uploadAvatarBtn.disabled = false;
        uploadAvatarBtn.textContent = 'Cambiar Avatar';
        avatarInput.value = '';
    }
}

// Remove avatar
async function removeAvatar() {
    if (!confirm('¿Estás seguro de eliminar tu avatar?')) return;

    try {
        // Remove from storage
        const fileName = `${currentUser.id}/avatar.jpg`;
        await supabase.storage
            .from('avatars')
            .remove([fileName]);

        // Update profile
        const { error } = await supabase
            .from('user_profiles')
            .update({
                avatar_url: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        if (error) throw error;

        // Update UI
        avatarPreview.innerHTML = '<div class="avatar-placeholder">👤</div>';
        removeAvatarBtn.style.display = 'none';

        alert('✅ Avatar eliminado');
    } catch (error) {
        console.error('Error removing avatar:', error);
        alert('Error al eliminar el avatar');
    }
}

// Update preferences
async function updatePreferences() {
    try {
        const { error } = await supabase
            .from('user_profiles')
            .update({
                notifications_enabled: notificationsToggle.checked,
                email_reminders: emailRemindersToggle.checked,
                theme: themeSelect.value,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating preferences:', error);
        alert('Error al actualizar preferencias');
    }
}

// Load statistics
async function loadStatistics() {
    try {
        // Get all todos
        const { data: todos, error: todosError } = await supabase
            .from('todos')
            .select('*')
            .eq('user_id', currentUser.id);

        if (todosError) throw todosError;

        // Calculate stats
        const total = todos.length;
        const completed = todos.filter(t => t.completed).length;
        const active = total - completed;
        const highPriority = todos.filter(t => t.priority === 'high').length;
        
        const now = new Date();
        const overdue = todos.filter(t => {
            if (!t.due_date || t.completed) return false;
            return new Date(t.due_date) < now;
        }).length;

        // Get categories count
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('user_id', currentUser.id);

        if (catError) throw catError;

        // Update UI
        statTotalTasks.textContent = total;
        statCompletedTasks.textContent = completed;
        statActiveTasks.textContent = active;
        statHighPriority.textContent = highPriority;
        statOverdueTasks.textContent = overdue;
        statCategories.textContent = categories.length;

    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Logout
async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
    }
    window.location.href = 'index.html';
}
