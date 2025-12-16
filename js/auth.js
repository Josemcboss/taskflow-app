// Authentication Logic

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const switchLink = document.getElementById('switchLink');
const switchText = document.getElementById('switchText');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

let isLoginMode = true;

// Check if user is already logged in
checkAuth();

async function checkAuth() {
    if (!supabase || !supabase.auth) {
        console.error('Supabase client not initialized');
        return;
    }
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            window.location.href = 'app.html';
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
}

// Toggle between login and register
switchLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;

    if (isLoginMode) {
        loginForm.classList.remove('form-hidden');
        registerForm.classList.add('form-hidden');
        authTitle.textContent = 'Bienvenido de vuelta';
        authSubtitle.textContent = 'Inicia sesión para continuar con tus tareas';
        switchText.textContent = '¿No tienes una cuenta?';
        switchLink.textContent = 'Regístrate';
    } else {
        loginForm.classList.add('form-hidden');
        registerForm.classList.remove('form-hidden');
        authTitle.textContent = 'Crea tu cuenta';
        authSubtitle.textContent = 'Comienza a organizar tu vida hoy';
        switchText.textContent = '¿Ya tienes una cuenta?';
        switchLink.textContent = 'Inicia sesión';
    }

    hideMessages();
});

// Login Form Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showError('Por favor completa todos los campos');
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.innerHTML = 'Iniciando sesión<span class="spinner"></span>';

    // Validar que supabase esté inicializado
    if (!supabase || !supabase.auth) {
        showError('Error: Supabase no está inicializado correctamente');
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        showSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
        setTimeout(() => {
            window.location.href = 'app.html';
        }, 1000);

    } catch (error) {
        showError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
    }
});

// Register Form Submit
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerPasswordConfirm').value;

    // Validation
    if (!email || !password || !confirmPassword) {
        showError('Por favor completa todos los campos');
        return;
    }

    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }

    const registerBtn = document.getElementById('registerBtn');
    const originalText = registerBtn.innerHTML;
    registerBtn.disabled = true;
    registerBtn.innerHTML = 'Creando cuenta<span class="spinner"></span>';

    // Validar que supabase esté inicializado
    if (!supabase || !supabase.auth) {
        showError('Error: Supabase no está inicializado correctamente');
        registerBtn.disabled = false;
        registerBtn.innerHTML = originalText;
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        // Check if email confirmation is required
        if (data.user && !data.session) {
            showSuccess('¡Cuenta creada! Por favor verifica tu correo electrónico.');
            registerBtn.disabled = false;
            registerBtn.innerHTML = originalText;
        } else {
            showSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
            setTimeout(() => {
                window.location.href = 'app.html';
            }, 1000);
        }

    } catch (error) {
        showError(error.message || 'Error al crear la cuenta. Por favor intenta de nuevo.');
        registerBtn.disabled = false;
        registerBtn.innerHTML = originalText;
    }
});

// Helper functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

function hideMessages() {
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}
