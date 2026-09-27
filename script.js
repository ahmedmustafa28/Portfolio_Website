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
        const rawCategories = project.getAttribute('data-category') || '';
        const categories = rawCategories.trim().split(/\s+/).filter(Boolean);
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

/* --- Interactive Encryption Simulator (AES-256-GCM via Web Crypto API) --- */
function initCryptoSimulator() {
  const simulator = document.querySelector('.crypto-simulator');
  if (!simulator) return;

  const input = simulator.querySelector('.sim-input');
  const encryptBtn = simulator.querySelector('.encrypt-btn');
  const decryptBtn = simulator.querySelector('.decrypt-btn');
  const output = simulator.querySelector('.sim-output');
  const status = simulator.querySelector('.sim-status');

  let currentCiphertext = '';
  const AES_KEY_STRING = 'infosec_portfolio_aes_256_key_32'; // 32 bytes for AES-256

  function bufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToBuffer(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function encryptAESGCM(text) {
    if (window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder();
      const rawKey = enc.encode(AES_KEY_STRING);
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        enc.encode(text)
      );
      const packed = new Uint8Array(12 + encrypted.byteLength);
      packed.set(iv, 0);
      packed.set(new Uint8Array(encrypted), 12);
      return 'AES-GCM-256:' + bufferToBase64(packed.buffer);
    } else {
      const b64 = btoa(unescape(encodeURIComponent(text)));
      return 'AES-GCM-256:' + b64;
    }
  }

  async function decryptAESGCM(cipherString) {
    if (!cipherString.startsWith('AES-GCM-256:')) {
      throw new Error('Invalid ciphertext format');
    }
    const b64 = cipherString.replace('AES-GCM-256:', '');
    if (window.crypto && window.crypto.subtle) {
      const packedBuffer = base64ToBuffer(b64);
      const packedBytes = new Uint8Array(packedBuffer);
      if (packedBytes.length < 13) throw new Error('Data payload too short');
      const iv = packedBytes.slice(0, 12);
      const cipherData = packedBytes.slice(12);

      const enc = new TextEncoder();
      const rawKey = enc.encode(AES_KEY_STRING);
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        cipherData
      );
      return new TextDecoder().decode(decrypted);
    } else {
      return decodeURIComponent(escape(atob(b64)));
    }
  }

  encryptBtn.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) return;

    status.textContent = 'ENCRYPTING...';
    status.style.color = 'var(--accent)';
    encryptBtn.disabled = true;

    try {
      currentCiphertext = await encryptAESGCM(text);
      output.textContent = currentCiphertext;
      status.textContent = 'ENCRYPTED';
      status.style.color = '#10b981';
      encryptBtn.disabled = false;
      decryptBtn.disabled = false;
    } catch (err) {
      status.textContent = 'ENCRYPTION ERROR';
      status.style.color = '#ef4444';
      encryptBtn.disabled = false;
    }
  });

  decryptBtn.addEventListener('click', async () => {
    if (!currentCiphertext) return;

    status.textContent = 'DECRYPTING...';
    status.style.color = 'var(--accent)';
    decryptBtn.disabled = true;

    try {
      const originalText = await decryptAESGCM(currentCiphertext);
      output.textContent = originalText;
      status.textContent = 'DECRYPTED';
      status.style.color = '#10b981';
      decryptBtn.disabled = true;
      currentCiphertext = '';
    } catch (err) {
      output.textContent = '[Decryption failed: integrity check or tag mismatch]';
      status.textContent = 'AUTH TAG FAILED';
      status.style.color = '#ef4444';
      decryptBtn.disabled = true;
    }
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
  const modalTitle = modal.querySelector('.modal-title');
  const modalExternalLink = modal.querySelector('.modal-external-link');
  const certLinks = document.querySelectorAll('.certificate-link');

  function openModal(href, title) {
    modalContent.innerHTML = '';
    if (modalTitle && title) {
      modalTitle.textContent = title;
    }
    if (modalExternalLink) {
      modalExternalLink.href = href;
    }

    const isMobile = window.innerWidth < 768;

    if (href.endsWith('.pdf')) {
      if (isMobile) {
        const fallback = document.createElement('div');
        fallback.className = 'modal-mobile-fallback';
        fallback.innerHTML = `
          <p>Certificate document ready. Mobile browsers view PDFs best in a dedicated tab.</p>
          <a href="${href}" target="_blank" rel="noreferrer" class="button button-primary">Open Full Certificate ↗</a>
        `;
        modalContent.appendChild(fallback);
      } else {
        const iframe = document.createElement('iframe');
        iframe.src = href;
        iframe.title = title || 'Certificate Preview';
        modalContent.appendChild(iframe);
      }
    } else {
      const img = document.createElement('img');
      img.src = href;
      img.alt = title || 'Certificate Preview';
      modalContent.appendChild(img);
    }

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
      const card = link.closest('.certificate-card');
      const title = card ? card.querySelector('h3')?.textContent : 'Certificate Document';

      if (href && (href.endsWith('.pdf') || href.endsWith('.png') || href.endsWith('.jpg') || href.endsWith('.jpeg'))) {
        e.preventDefault();
        openModal(href, title);
      }
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* --- Copy Email to Clipboard with Visual Feedback --- */
function initCopyEmail() {
  const copyBtn = document.querySelector('.copy-email-btn');
  if (!copyBtn) return;

  const email = copyBtn.getAttribute('data-email') || 'bhurgrimustafa203@gmail.com';
  const copyText = copyBtn.querySelector('.copy-text');

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
      copyBtn.classList.add('copied');
      if (copyText) copyText.textContent = 'Copied! ✓';
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        if (copyText) copyText.textContent = 'Copy';
      }, 2200);
    } catch (e) {
      const textArea = document.createElement('textarea');
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      copyBtn.classList.add('copied');
      if (copyText) copyText.textContent = 'Copied! ✓';
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        if (copyText) copyText.textContent = 'Copy';
      }, 2200);
    }
  });
}

/* --- Interactive NLP Lexical & Sentiment Engine Demo --- */
function initNlpDemo() {
  const container = document.querySelector('.nlp-simulator');
  if (!container) return;

  const input = container.querySelector('.nlp-input');
  const analyzeBtn = container.querySelector('.nlp-analyze-btn');
  const clearBtn = container.querySelector('.nlp-clear-btn');
  const statTokens = container.querySelector('.nlp-stat-tokens');
  const statFiltered = container.querySelector('.nlp-stat-filtered');
  const statPolarity = container.querySelector('.nlp-stat-polarity');
  const tokensContainer = container.querySelector('.nlp-tokens-container');
  const chips = container.querySelectorAll('.sim-chip');

  const lexicon = {
    great: 3, excellent: 3, amazing: 3, love: 3, best: 3, brilliant: 3, perfect: 3,
    good: 2, successfully: 2, success: 2, win: 2, progress: 2, optimized: 2, secure: 2,
    fast: 1, clean: 1, working: 1, deployed: 1, safe: 1, helpful: 1, solid: 1,
    bug: -2, critical: -2, error: -2, failed: -2, fail: -2, broken: -2, poor: -2, bad: -2,
    defect: -2, risk: -2, issue: -1, slow: -1, warning: -1, dropped: -1,
    crash: -3, crashed: -3, terrible: -3, worst: -3, vulnerability: -3
  };

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'is', 'was', 'were', 'be', 'been', 'being', 'it', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'our', 'their', 'by', 'as', 'from',
    'kya', 'hai', 'tha', 'thi', 'aur', 'ya', 'bhi', 'hum', 'tum'
  ]);

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  function resetOutputs() {
    if (statTokens) statTokens.textContent = '0';
    if (statFiltered) statFiltered.textContent = '0';
    if (statPolarity) {
      statPolarity.textContent = '--';
      statPolarity.style.color = '';
    }
    if (tokensContainer) {
      tokensContainer.innerHTML = '<span class="nlp-token-placeholder">Enter text above to inspect client-side tokenization and sentiment scoring.</span>';
    }
  }

  function runAnalysis() {
    const rawText = input.value.trim();
    if (!rawText) {
      resetOutputs();
      return;
    }

    const words = rawText.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
    let score = 0;
    let filteredCount = 0;
    const renderedTokens = [];

    for (const w of words) {
      if (stopWords.has(w)) {
        filteredCount++;
        renderedTokens.push(`<span class="nlp-token-pill nlp-token-stop" title="Stop-word removed">${escapeHtml(w)}</span>`);
      } else if (Object.prototype.hasOwnProperty.call(lexicon, w)) {
        const val = lexicon[w];
        score += val;
        const cls = val > 0 ? 'nlp-token-pos' : 'nlp-token-neg';
        const sign = val > 0 ? `+${val}` : `${val}`;
        renderedTokens.push(`<span class="nlp-token-pill ${cls}" title="Polarity weight: ${sign}">${escapeHtml(w)} (${sign})</span>`);
      } else {
        renderedTokens.push(`<span class="nlp-token-pill nlp-token-content">${escapeHtml(w)}</span>`);
      }
    }

    if (statTokens) statTokens.textContent = String(words.length);
    if (statFiltered) statFiltered.textContent = String(filteredCount);

    if (statPolarity) {
      if (score > 0) {
        statPolarity.textContent = `Positive (+${score})`;
        statPolarity.style.color = '#10b981';
      } else if (score < 0) {
        statPolarity.textContent = `Negative (${score})`;
        statPolarity.style.color = '#ef4444';
      } else {
        statPolarity.textContent = 'Neutral (0)';
        statPolarity.style.color = 'var(--text-secondary)';
      }
    }

    if (tokensContainer) {
      tokensContainer.innerHTML = renderedTokens.join('');
    }
  }

  if (analyzeBtn) analyzeBtn.addEventListener('click', runAnalysis);

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runAnalysis();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      resetOutputs();
      input.focus();
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const sample = chip.getAttribute('data-sample') || '';
      input.value = sample;
      runAnalysis();
    });
  });
}

// Start interactive features
initHeroCanvas();
initCardGlows();
initScrollReveals();
initProjectFilters();
initCryptoSimulator();
initCertLightbox();
initCopyEmail();
initNlpDemo();


