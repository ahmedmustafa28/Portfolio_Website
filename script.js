const heroSection = document.querySelector('.hero');
const heroPattern = document.querySelector('.hero-pattern');
const pageLoader = document.querySelector('.page-loader');
const pageLoaderCount = document.querySelector('.page-loader-count');
const loaderBar = document.querySelector('.loader-bar');
const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const themeToggle = document.querySelector('.theme-toggle');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = motionQuery.matches;
const loaderStartTime = performance.now();
const loaderDuration = 800;
let animationFrameId = 0;
let lastPointerEvent = null;
let activeNavLink = null;
let menuOpen = false;
let currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
let loaderFrameId = 0;

function getNextTheme(theme) {
  return theme === 'light' ? 'dark' : 'light';
}

function setTheme(theme, persist = true) {
  currentTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = currentTheme;
  document.documentElement.style.colorScheme = currentTheme;

  if (themeToggle) {
    const nextTheme = getNextTheme(currentTheme);
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    themeToggle.setAttribute('aria-pressed', String(currentTheme === 'light'));
  }

  if (persist) {
    try {
      localStorage.setItem('theme', currentTheme);
    } catch (error) {
      // Ignore storage errors.
    }
  }
}

function toggleTheme() {
  setTheme(getNextTheme(currentTheme));
}

function hideLoader() {
  if (!pageLoader) {
    return;
  }

  document.documentElement.classList.add('is-ready');
}

function updateLoaderProgress(timestamp) {
  if (!pageLoaderCount) {
    return;
  }

  const elapsed = timestamp - loaderStartTime;
  const progress = reduceMotion ? 1 : Math.min(elapsed / loaderDuration, 1);
  const percent = reduceMotion ? 100 : Math.round(progress * 100);

  pageLoaderCount.textContent = `${String(percent).padStart(3, '0')}%`;
  if (loaderBar) {
    loaderBar.style.width = `${percent}%`;
  }

  if (!reduceMotion && progress < 1) {
    loaderFrameId = window.requestAnimationFrame(updateLoaderProgress);
    return;
  }

  pageLoaderCount.textContent = '100%';
  if (loaderBar) {
    loaderBar.style.width = '100%';
  }
}

function startLoaderProgress() {
  if (!pageLoader || !pageLoaderCount) {
    return;
  }

  if (reduceMotion) {
    pageLoaderCount.textContent = '100%';
    if (loaderBar) {
      loaderBar.style.width = '100%';
    }
    return;
  }

  loaderFrameId = window.requestAnimationFrame(updateLoaderProgress);
}

function scheduleLoaderHide() {
  if (!pageLoader) {
    return;
  }

  const elapsed = performance.now() - loaderStartTime;
  const remaining = Math.max(0, loaderDuration - elapsed);
  window.setTimeout(() => {
    if (pageLoaderCount) {
      pageLoaderCount.textContent = '100%';
    }
    if (loaderBar) {
      loaderBar.style.width = '100%';
    }

    hideLoader();
  }, remaining);
}

setTheme(currentTheme, false);
startLoaderProgress();

function updateHeroGlow(event) {
  if (!heroSection || !heroPattern || reduceMotion) {
    return;
  }

  const rect = heroSection.getBoundingClientRect();
  const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
  const pointerY = ((event.clientY - rect.top) / rect.height) * 100;

  heroPattern.style.setProperty('--pattern-x', `${event.clientX - rect.left}px`);
  heroPattern.style.setProperty('--pattern-y', `${event.clientY - rect.top}px`);
  heroPattern.style.setProperty('--glow-x', `${pointerX.toFixed(2)}%`);
  heroPattern.style.setProperty('--glow-y', `${pointerY.toFixed(2)}%`);
  heroPattern.style.setProperty('--glow-opacity', '0.12');
}

function scheduleGlowUpdate(event) {
  if (!heroSection || !heroPattern || reduceMotion) {
    return;
  }

  lastPointerEvent = event;

  if (animationFrameId) {
    return;
  }

  animationFrameId = window.requestAnimationFrame(() => {
    animationFrameId = 0;

    if (lastPointerEvent) {
      updateHeroGlow(lastPointerEvent);
    }
  });
}

function resetGlow() {
  if (!heroPattern || reduceMotion) {
    return;
  }

  heroPattern.style.setProperty('--glow-opacity', '0');
}

function getFocusableNavElements() {
  if (!nav) {
    return [];
  }

  return Array.from(nav.querySelectorAll('a, button')).filter((element) => !element.hasAttribute('disabled'));
}

function setMenuState(isOpen, returnFocus = false) {
  if (!navToggle || !navLinks) {
    return;
  }

  menuOpen = isOpen;
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  navLinks.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('nav-open', isOpen);

  if (returnFocus) {
    navToggle.focus();
  }

  if (isOpen) {
    const focusables = getFocusableNavElements();
    const firstFocusable = focusables.find((element) => element !== navToggle) || navToggle;
    window.setTimeout(() => firstFocusable.focus(), 0);
  }
}

function closeMenu(returnFocus = false) {
  if (!menuOpen) {
    return;
  }

  setMenuState(false, returnFocus);
}

function toggleMenu() {
  setMenuState(!menuOpen);
}

function setActiveNav(sectionId) {
  const nextActiveLink = navLinks ? navLinks.querySelector(`a[href="#${sectionId}"]`) : null;

  if (activeNavLink === nextActiveLink) {
    return;
  }

  if (activeNavLink) {
    activeNavLink.classList.remove('active');
  }

  if (nextActiveLink) {
    nextActiveLink.classList.add('active');
    activeNavLink = nextActiveLink;
  }
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const targetId = anchor.getAttribute('href');
    const target = targetId ? document.querySelector(targetId) : null;

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    closeMenu(false);
  });
});

if (heroSection) {
  heroSection.addEventListener('pointermove', scheduleGlowUpdate);
  heroSection.addEventListener('pointerenter', scheduleGlowUpdate);
  heroSection.addEventListener('pointerleave', resetGlow);
}

if (navToggle) {
  navToggle.addEventListener('click', toggleMenu);
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleLoaderHide, { once: true });
} else {
  scheduleLoaderHide();
}

document.addEventListener('keydown', (event) => {
  if (!menuOpen) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu(true);
    return;
  }

  if (event.key !== 'Tab' || !nav) {
    return;
  }

  const focusables = getFocusableNavElements();

  if (focusables.length === 0) {
    return;
  }

  const firstFocusable = focusables[0];
  const lastFocusable = focusables[focusables.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey && activeElement === firstFocusable) {
    event.preventDefault();
    lastFocusable.focus();
  } else if (!event.shiftKey && activeElement === lastFocusable) {
    event.preventDefault();
    firstFocusable.focus();
  }
});

const sections = ['about', 'projects', 'skills', 'experience', 'certificates', 'contact']
  .map((sectionId) => document.getElementById(sectionId))
  .filter(Boolean);

const initialSectionId = window.location.hash.replace('#', '');

if (sections.length > 0) {
  if (sections.some((section) => section.id === initialSectionId)) {
    setActiveNav(initialSectionId);
  } else {
    setActiveNav('about');
  }
}

if ('IntersectionObserver' in window && navLinks) {
  const observer = new IntersectionObserver((entries) => {
    const visibleEntries = entries.filter((entry) => entry.isIntersecting);

    if (visibleEntries.length === 0) {
      return;
    }

    visibleEntries.sort((firstEntry, secondEntry) => secondEntry.intersectionRatio - firstEntry.intersectionRatio);
    setActiveNav(visibleEntries[0].target.id);
  }, {
    root: null,
    rootMargin: '-35% 0px -50% 0px',
    threshold: [0.15, 0.3, 0.5, 0.75],
  });

  sections.forEach((section) => observer.observe(section));
}

if (motionQuery.addEventListener) {
  motionQuery.addEventListener('change', () => {
    window.location.reload();
  });
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 767 && menuOpen) {
    closeMenu(false);
  }
});

/* --- Hero Neural Particle Canvas --- */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId = null;
  const maxParticles = 65;
  const connectionDistance = 110;
  let mouse = { x: null, y: null, radius: 150 };

  function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 1.5 + 1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 122, 26, 0.4)';
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }
  }
  initParticles();

  const parent = canvas.parentElement;
  parent.addEventListener('pointermove', (e) => {
    const rect = parent.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  parent.addEventListener('pointerleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const alpha = (1 - dist / connectionDistance) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(255, 122, 26, ${alpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }

      if (mouse.x !== null && mouse.y !== null) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const alpha = (1 - dist / mouse.radius) * 0.2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(255, 122, 26, ${alpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  if (!reduceMotion) {
    animate();
  }
}

/* --- Card Cursor-Tracking Glow Effect --- */
function initCardGlows() {
  const cards = document.querySelectorAll('.project-card, .certificate-card');
  cards.forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/* --- Scroll-Triggered Section Reveals --- */
function initScrollReveals() {
  const sections = document.querySelectorAll('.reveal-section');
  if (sections.length === 0) return;

  if (reduceMotion) {
    sections.forEach(s => s.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.1
  });

  sections.forEach(s => observer.observe(s));
}

/* --- Project Category Filters --- */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectGrid = document.querySelector('.project-grid');
  if (filterBtns.length === 0 || !projectGrid) return;

  const projects = projectGrid.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const category = btn.getAttribute('data-filter');

      projects.forEach(project => {
        const categories = project.getAttribute('data-category').split(' ');
        if (category === 'all' || categories.includes(category)) {
          project.style.display = '';
          setTimeout(() => {
            project.style.opacity = '1';
            project.style.transform = 'scale(1)';
          }, 50);
        } else {
          project.style.opacity = '0';
          project.style.transform = 'scale(0.96)';
          project.style.display = 'none';
        }
      });
    });
  });
}

/* --- Interactive Encryption Simulator --- */
function initCryptoSimulator() {
  const simulator = document.querySelector('.crypto-simulator');
  if (!simulator) return;

  const input = simulator.querySelector('.sim-input');
  const encryptBtn = simulator.querySelector('.encrypt-btn');
  const decryptBtn = simulator.querySelector('.decrypt-btn');
  const output = simulator.querySelector('.sim-output');
  const status = simulator.querySelector('.sim-status');

  let currentCiphertext = '';

  function mockEncrypt(text) {
    if (!text) return '';
    const b64 = btoa(unescape(encodeURIComponent(text)));
    return 'AES256_' + b64.replace(/[a-zA-Z]/g, (c) => {
      return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    });
  }

  function mockDecrypt(ciphertext) {
    if (!ciphertext || !ciphertext.startsWith('AES256_')) return '';
    const rot = ciphertext.substring(7);
    const b64 = rot.replace(/[a-zA-Z]/g, (c) => {
      return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    });
    try {
      return decodeURIComponent(escape(atob(b64)));
    } catch (e) {
      return '[Decryption Error: Invalid Padding]';
    }
  }

  encryptBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;

    status.textContent = 'ENCRYPTING...';
    status.style.color = '#ff7a1a';
    encryptBtn.disabled = true;

    window.setTimeout(() => {
      currentCiphertext = mockEncrypt(text);
      output.textContent = currentCiphertext;
      status.textContent = 'ENCRYPTED';
      status.style.color = '#10b981';
      encryptBtn.disabled = false;
      decryptBtn.disabled = false;
    }, 450);
  });

  decryptBtn.addEventListener('click', () => {
    if (!currentCiphertext) return;

    status.textContent = 'DECRYPTING...';
    status.style.color = '#ff7a1a';
    decryptBtn.disabled = true;

    window.setTimeout(() => {
      const originalText = mockDecrypt(currentCiphertext);
      output.textContent = originalText;
      status.textContent = 'DECRYPTED';
      status.style.color = '#10b981';
      decryptBtn.disabled = true;
      currentCiphertext = '';
    }, 450);
  });

  input.addEventListener('input', () => {
    encryptBtn.disabled = input.value.trim() === '';
    decryptBtn.disabled = true;
    output.textContent = '--';
    status.textContent = 'READY';
    status.style.color = '#10b981';
    currentCiphertext = '';
  });
}

/* --- Lightbox Modal --- */
function initCertLightbox() {
  const modal = document.getElementById('cert-modal');
  if (!modal) return;

  const modalClose = modal.querySelector('.modal-close');
  const modalOverlay = modal.querySelector('.modal-overlay');
  const modalContent = modal.querySelector('.modal-content');
  const certLinks = document.querySelectorAll('.certificate-link');

  function openModal(href) {
    modalContent.innerHTML = '';
    let element;

    if (href.endsWith('.pdf')) {
      element = document.createElement('iframe');
      element.src = href;
    } else {
      element = document.createElement('img');
      element.src = href;
      element.alt = 'Certificate';
    }

    modalContent.appendChild(element);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      modalContent.innerHTML = '';
    }, 280);
  }

  certLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && (href.endsWith('.pdf') || href.endsWith('.png') || href.endsWith('.jpg') || href.endsWith('.jpeg'))) {
        e.preventDefault();
        openModal(href);
      }
    });
  });

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

// Start interactive features
initHeroCanvas();
initCardGlows();
initScrollReveals();
initProjectFilters();
initCryptoSimulator();
initCertLightbox();
