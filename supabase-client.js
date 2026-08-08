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

// Si quien ha iniciado sesión es admin, muestra una barra para previsualizar
// los tres portales (útil para demos internas). No cambia el rol real del
// usuario ni sus permisos: solo es un atajo de navegación.
function mostrarBarraVistaAdmin(rolReal, vistaActual, contenedorId) {
  if (rolReal !== 'admin') return;
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  const vistas = [
    { id: 'admin', label: 'Administración', href: 'portal-admin.html' },
    { id: 'logopeda', label: 'Logopeda', href: 'portal-logopeda.html' },
    { id: 'cliente', label: 'Paciente (demo)', href: 'portal-cliente.html' },
  ];
  cont.innerHTML = `
    <div style="background:var(--azul-oscuro);color:#fff;padding:10px 24px;font-size:.85rem;display:flex;flex-wrap:wrap;align-items:center;gap:10px;">
      <span>Vista de administrador — estás viendo:</span>
      ${vistas.map(v => `<a href="${v.href}" style="color:#fff;text-decoration:${v.id === vistaActual ? 'underline' : 'none'};font-weight:${v.id === vistaActual ? '700' : '400'};opacity:${v.id === vistaActual ? '1' : '.8'};">${v.label}</a>`).join(' · ')}
      <span style="opacity:.75;">(el portal de paciente muestra un caso de ejemplo)</span>
    </div>`;
}

async function cerrarSesion() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

// Escapa HTML antes de insertar cualquier dato escrito por un usuario (nombre, notas,
// mensajes, etc.) dentro de innerHTML. Sin esto, alguien podría escribir <script> en un
// campo de texto (nombre, mensaje de contacto...) y ese código se ejecutaría en el
// navegador de otra persona (logopeda/admin) cuando lo vea. Usar SIEMPRE con datos que
// vengan de un formulario o de la base de datos y se inserten con innerHTML/template strings.
function esc(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  const d = new Date(fechaStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// --- Integración Google Calendar (cada logopeda conecta su propio calendario) ---
// GOOGLE_CLIENT_ID se rellena cuando se crea el cliente OAuth en Google Cloud Console.
const GOOGLE_CLIENT_ID = '926995120162-vt0shk2368ob2an2pacq19hoom9tcdvc.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = 'https://fmznceilmjhysuyxpwpu.supabase.co/functions/v1/google-calendar-callback';

async function estadoGoogleCalendar(logopedaId) {
  const { data } = await supabaseClient.from('logopeda_google_calendar').select('conectado, conectado_en').eq('logopeda_id', logopedaId).maybeSingle();
  return data;
}

async function conectarGoogleCalendar() {
  if (!GOOGLE_CLIENT_ID) {
    alert('La conexión con Google Calendar todavía no está activada del todo. Pídele a Pablo que termine de configurarla.');
    return;
  }
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    state: session.access_token,
  });
  window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
}

async function desconectarGoogleCalendar(logopedaId) {
  if (!confirm('¿Desconectar tu Google Calendar? Las próximas citas dejarán de sincronizarse.')) return;
  await supabaseClient.from('logopeda_google_calendar').delete().eq('logopeda_id', logopedaId);
}

// Sincroniza (crea/actualiza/borra) el evento de Google Calendar de una cita.
// No bloquea la interfaz ni muestra error si el logopeda no tiene el calendario conectado.
async function sincronizarCitaGoogle(citaId, accion) {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;
    await fetch(`${SUPABASE_URL}/functions/v1/google-calendar-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ citaId, accion }),
    });
  } catch (e) {
    console.warn('No se pudo sincronizar con Google Calendar:', e);
  }
}
