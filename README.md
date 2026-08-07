# Logopedia Sant Genís

Web pública + plataforma interna del centro de logopedia Ester Serrano, en Barcelona.

## Estructura
- `index.html`, `quienes-somos.html`, `contacto.html`, `blog.html` — web pública.
- `login.html`, `registro.html` — acceso a la plataforma.
- `portal-cliente.html`, `portal-logopeda.html`, `portal-admin.html` — los 3 portales, según rol.
- `style.css` — estilos compartidos.
- `supabase-client.js` — conexión a Supabase (auth + base de datos).

## Cómo se edita
Es un sitio estático, sin build ni dependencias de instalación: se edita directo el HTML/CSS/JS de cada archivo. Se sirve con GitHub Pages desde la rama `main`.

## Backend
Supabase (proyecto `logopedia-sant-genis`) maneja login, base de datos y permisos por rol (Row Level Security). El detalle del modelo de datos y la arquitectura completa está documentado en el vault de Pablo, nota `Logopedia-Sant-Genis`.
