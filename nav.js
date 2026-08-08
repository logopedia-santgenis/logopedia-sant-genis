(function () {
  var btn = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  var fondo = document.getElementById('navFondo');
  if (!btn || !menu || !fondo) return;

  function abrir() {
    menu.classList.add('abierto');
    btn.classList.add('abierto');
    fondo.classList.add('abierto');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function cerrar() {
    menu.classList.remove('abierto');
    btn.classList.remove('abierto');
    fondo.classList.remove('abierto');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', function () {
    if (menu.classList.contains('abierto')) cerrar(); else abrir();
  });
  fondo.addEventListener('click', cerrar);
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', cerrar);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrar();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 980) cerrar();
  });
})();
