// Logopedia Sant Genís — conexión a Supabase
// La anon key es pública por diseño (así funciona Supabase): la seguridad real
// la dan las políticas de Row Level Security configuradas en la base de datos.
const SUPABASE_URL = 'https://fmznceilmjhysuyxpwpu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtem5jZWlsbWpoeXN1eXhwd3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjE0NzQsImV4cCI6MjEwMTY5NzQ3NH0.W1TtOT-GMf21ZFsbk9tk7tJAP6u9Ak0WhFLEbThfsQk';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exige sesión activa. Si no hay, redirige a login. Devuelve la sesión si existe.
async function exigirSesion() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

// Trae el perfil (rol, nombre, etc.) del usuario logueado.
async function obtenerPerfil(userId) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) { console.error('Error obteniendo perfil:', error); return null; }
  return data;
}

// Si el rol del perfil no coincide con el esperado, redirige a su portal correcto.
function redirigirSegunRol(rol) {
  const destino = { admin: 'portal-admin.html', logopeda: 'portal-logopeda.html', cliente: 'portal-cliente.html' }[rol] || 'login.html';
  window.location.href = destino;
}

async function cerrarSesion() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  const d = new Date(fechaStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
