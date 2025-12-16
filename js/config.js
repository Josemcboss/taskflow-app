// Supabase Configuration
// IMPORTANT: Replace these values with your own Supabase project credentials
// You can find these in your Supabase project settings: https://app.supabase.com

// ⚠️ CORRECCIÓN IMPORTANTE:
// La URL debe ser: https://[project-ref].supabase.co
// NO uses la connection string de PostgreSQL (postgresql://...)

const SUPABASE_URL = 'https://mxbzhyffmoijttoexjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14YnpoeWZmbW9panR0b2V4anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3Mzc1MTIsImV4cCI6MjA4MTMxMzUxMn0.1PS46_1geUl38uI471P-PUTr8Y6hvTmhCqLa97JIhLY'; // Reemplaza con tu anon/public key de Supabase

// Initialize Supabase client (evitar redeclaración)
var supabase;

// Función para inicializar Supabase
function initializeSupabase() {
  // Verificar que la librería de Supabase esté cargada
  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.error('⚠️ ERROR: Supabase JS library not loaded!');
    console.error('window.supabase:', window.supabase);
    return false;
  }
  
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized successfully');
    console.log('Supabase client:', supabase);
    return true;
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error);
    return false;
  }
}

// Intentar inicializar inmediatamente
if (!supabase) {
  initializeSupabase();
}

// Check if configuration is set
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn('⚠️ Supabase configuration not set! Please update js/config.js with your Supabase credentials.');
}
