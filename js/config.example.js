// Supabase Configuration Example
// Copy this file and rename to config.js with your actual credentials

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Example of how it should look:
// const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
// const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY...';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
