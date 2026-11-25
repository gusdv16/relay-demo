import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   Navegación
   -------------------------------------------------------------------------- */

function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('is-solid', window.scrollY > 40);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initMenu() {
  const button = document.getElementById('menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!button || !menu) return;

  const setOpen = (open) => {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', open);

    if (open) {
      requestAnimationFrame(() => {
        menu.querySelector('a')?.focus({ preventScroll: true });
      });
    } else {
      button.focus({ preventScroll: true });
    }
  };

  button.addEventListener('click', () => {
    setOpen(button.getAttribute('aria-expanded') !== 'true');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 980 && menu.classList.contains('is-open')) {
      setOpen(false);
    }
  });
}

/* --------------------------------------------------------------------------
   Animaciones de entrada
   -------------------------------------------------------------------------- */

function initHero() {
  const lines = gsap.utils.toArray('[data-hero-line]');
  if (!lines.length) return;

  if (reduceMotion) {
    gsap.set('[data-hero]', { opacity: 1 });
    return;
  }

  gsap.set(lines, { yPercent: 115 });

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.15 });

  tl.to(lines, { yPercent: 0, duration: 1.15, stagger: 0.09 })
    .from('[data-hero="1"]', { opacity: 0, y: 14, duration: 0.8 }, 0.1)
    .from('[data-hero="2"]', { opacity: 0, y: 18, duration: 0.9 }, 0.5)
    .from('[data-hero="3"]', { opacity: 0, y: 16, duration: 0.8 }, 0.75)
    .from('[data-hero="4"]', { opacity: 0, y: 14, duration: 0.8 }, 0.9)
    .from('.scroll-cue', { opacity: 0, duration: 0.8 }, 1.2);
}

function initSectionTitles() {
  const titles = gsap.utils.toArray('[data-lines]');
  if (!titles.length) return;

  titles.forEach((title) => {
    const lines = title.querySelectorAll('.line-inner');
    if (!lines.length) return;

    if (reduceMotion) return;

    gsap.fromTo(
      lines,
      { yPercent: 112 },
      {
        yPercent: 0,
        duration: 1.05,
        ease: 'power4.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: title,
          start: 'top 88%',
          once: true,
        },
      }
    );
  });
}

function initReveals() {
  if (reduceMotion) return;

  const selector = '.stats, .specs-grid, .formats, .usecases, .quotes, .taste-card, .form-card, .contact-list li';
  const elements = gsap.utils.toArray(selector);
  if (!elements.length) return;

  gsap.set(elements, { opacity: 0, y: 26 });

  ScrollTrigger.batch(elements, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.07,
        overwrite: true,
      });
    },
  });
}

/* --------------------------------------------------------------------------
   Marquee
   -------------------------------------------------------------------------- */

function initMarquee() {
  const track = document.getElementById('marquee-track');
  if (!track) return;

  const group = track.querySelector('.marquee__group');
  if (!group) return;

  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.appendChild(clone);

  if (reduceMotion) return;

  gsap.to(track, {
    xPercent: -50,
    duration: 42,
    ease: 'none',
    repeat: -1,
  });
}

/* --------------------------------------------------------------------------
   Contadores, medidores y parallax
   -------------------------------------------------------------------------- */

function formatNumber(value, decimals = 0) {
  return new Intl.NumberFormat('es-UY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function initCounters() {
  const counters = gsap.utils.toArray('[data-count]');
  if (!counters.length) return;

  const animate = () => {
    counters.forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = Number(el.dataset.decimals || 0);
      if (Number.isNaN(target)) return;
      const state = { value: 0 };

      gsap.to(state, {
        value: target,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = formatNumber(state.value, decimals);
        },
        onComplete: () => {
          el.textContent = formatNumber(target, decimals);
        },
      });
    });
  };

  if (reduceMotion) {
    counters.forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = Number(el.dataset.decimals || 0);
      if (!Number.isNaN(target)) el.textContent = formatNumber(target, decimals);
    });
    return;
  }

  ScrollTrigger.create({
    trigger: '#calidad',
    start: 'top 72%',
    once: true,
    onEnter: animate,
  });
}

function initMeters() {
  const meters = gsap.utils.toArray('[data-meter]');
  if (!meters.length) return;

  const fill = () => {
    meters.forEach((el, index) => {
      gsap.to(el, {
        width: `${el.dataset.meter}%`,
        duration: reduceMotion ? 0 : 1.1,
        ease: 'power3.out',
        delay: reduceMotion ? 0 : index * 0.1,
      });
    });
  };

  if (reduceMotion) {
    fill();
    return;
  }

  ScrollTrigger.create({
    trigger: '.taste-card',
    start: 'top 82%',
    once: true,
    onEnter: fill,
  });
}

function initParallax() {
  if (reduceMotion) return;

  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    gsap.fromTo(
      el,
      { y: 22 },
      {
        y: -22,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

/* --------------------------------------------------------------------------
   Formulario B2B (mailto, sin backend)
   -------------------------------------------------------------------------- */

function initForm() {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const get = (key) => String(data.get(key) || '').trim() || '—';

    const subject = `Solicitud de muestras — ${get('empresa')}`;
    const body = [
      'Solicitud de muestras / información mayorista',
      '',
      `Nombre: ${get('nombre')}`,
      `Empresa o local: ${get('empresa')}`,
      `Email: ${get('email')}`,
      `Teléfono: ${get('telefono')}`,
      `Tipo de negocio: ${get('perfil')}`,
      `Volumen estimado: ${get('volumen')}`,
      '',
      'Mensaje:',
      get('mensaje'),
    ].join('\n');

    window.location.href = `mailto:ventas@origen34.uy?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    status.textContent =
      'Abrimos tu cliente de correo con la consulta. Si no se abrió, escribinos a ventas@origen34.uy o por WhatsApp al +598 99 123 456.';
    status.classList.add('is-visible');
  });
}

/* --------------------------------------------------------------------------
   Escena 3D del hero
   -------------------------------------------------------------------------- */

function initBottle() {
  const canvas = document.getElementById('bottle-canvas');
  if (!canvas) return;

  import('./bottle.js')
    .then(({ initBottle: start }) => start(canvas))
    .catch(() => {
      canvas.style.display = 'none';
    });
}

/* --------------------------------------------------------------------------
   Proceso: narrativa de scroll
   -------------------------------------------------------------------------- */

function initProcessSection() {
  const section = document.querySelector('[data-process]');
  if (!section || reduceMotion) return;

  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2') || probe.getContext('webgl');
  if (!gl) return;

  let started = false;

  const start = () => {
    if (started) return;
    started = true;

    import('./process.js')
      .then(({ initProcess }) => initProcess(section))
      .catch(() => {
        section.classList.remove('is-live');
      });
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(section);
  } else {
    start();
  }
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */

function boot() {
  initNav();
  initMenu();
  initHero();
  initSectionTitles();
  initReveals();
  initMarquee();
  initCounters();
  initMeters();
  initParallax();
  initForm();
  initBottle();
  initProcessSection();

  // Las fuentes y la escena 3D pueden cambiar alturas: recalculamos una vez.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
