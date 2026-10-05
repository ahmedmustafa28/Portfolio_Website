const heroSection = document.querySelector('.hero');
const heroPattern = document.querySelector('.hero-pattern');
const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const themeToggle = document.querySelector('.theme-toggle');
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = motionQuery.matches;
let animationFrameId = 0;
let lastPointerEvent = null;
let activeNavLink = null;
let menuOpen = false;
let currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';

/* --- Theme --- */
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

setTheme(currentTheme, false);

/* --- Hero pointer glow --- */
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

/* --- Mobile navigation --- */
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
    const target = targetId && targetId.length > 1 ? document.querySelector(targetId) : null;

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

/* --- Card cursor-tracking glow --- */
function initCardGlows() {
  const cards = document.querySelectorAll('.project-card, .certificate-card');
  cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

/* --- Project card subtle 3D hover --- */
function initProjectCard3D() {
  const cards = document.querySelectorAll('.project-card');
  if (cards.length === 0) return;

  const isTouch = window.matchMedia('(hover: none)').matches || window.innerWidth < 768;
  if (isTouch || reduceMotion) return;

  cards.forEach((card) => {
    let ticking = false;

    card.addEventListener('pointermove', (e) => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          ticking = false;
          return;
        }

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const nx = (x / rect.width - 0.5) * 2;
        const ny = (y / rect.height - 0.5) * 2;
        const rotX = (-ny * 2).toFixed(2);
        const rotY = (nx * 3).toFixed(2);

        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.01, 1.01, 1)`;

        const preview = card.querySelector('.project-preview');
        if (preview) {
          const px = (nx * 2.5).toFixed(1);
          const py = (ny * 1.5).toFixed(1);
          preview.style.transform = `translate3d(${px}px, ${py}px, 8px)`;
        }

        ticking = false;
      });
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
      const preview = card.querySelector('.project-preview');
      if (preview) {
        preview.style.transform = '';
      }
    });
  });
}

/* --- Technical architecture entrance animations --- */
function initTechFlowAnimations() {
  const flows = document.querySelectorAll('.tech-flow');
  if (flows.length === 0) return;

  if (reduceMotion) {
    return;
  }

  flows.forEach((flow) => {
    flow.classList.add('is-animating');
    const items = flow.querySelectorAll('.tech-flow-step, .tech-flow-arrow');
    items.forEach((item, index) => {
      item.style.transitionDelay = `${index * 85}ms`;
    });
  });

  function triggerFlow(flow) {
    if (flow.classList.contains('flow-animated')) return;
    flow.classList.add('flow-animated');
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerFlow(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    flows.forEach((flow) => observer.observe(flow));
  } else {
    flows.forEach((flow) => triggerFlow(flow));
  }

  const detailsList = document.querySelectorAll('.tech-details');
  detailsList.forEach((details) => {
    details.addEventListener('toggle', () => {
      if (details.open) {
        const flow = details.querySelector('.tech-flow');
        if (flow) {
          requestAnimationFrame(() => triggerFlow(flow));
        }
      }
    });
  });
}

/* --- Scroll-triggered section reveals --- */
function initScrollReveals() {
  const revealSections = document.querySelectorAll('.reveal-section');
  if (revealSections.length === 0) return;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealSections.forEach((s) => s.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
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

  revealSections.forEach((s) => observer.observe(s));
}

/* --- Project category filters --- */
function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectGrid = document.querySelector('.project-grid');
  if (filterBtns.length === 0 || !projectGrid) return;

  const projects = projectGrid.querySelectorAll('.project-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const category = btn.getAttribute('data-filter');

      projects.forEach((project) => {
        const rawCategories = project.getAttribute('data-category') || '';
        const categories = rawCategories.trim().split(/\s+/).filter(Boolean);
        project.hidden = !(category === 'all' || categories.includes(category));
      });
    });
  });
}

/* --- Lightbox modal (certificates and project screenshots) --- */
function initLightbox() {
  const modal = document.getElementById('cert-modal');
  if (!modal) return;

  const modalClose = modal.querySelector('.modal-close');
  const modalOverlay = modal.querySelector('.modal-overlay');
  const modalContent = modal.querySelector('.modal-content');
  const modalTitle = modal.querySelector('.modal-title');
  const modalExternalLink = modal.querySelector('.modal-external-link');
  const links = document.querySelectorAll('.certificate-link, .preview-link');
  let lastTrigger = null;

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
        const text = document.createElement('p');
        text.textContent = 'Certificate document ready. Mobile browsers view PDFs best in a dedicated tab.';
        const open = document.createElement('a');
        open.href = href;
        open.target = '_blank';
        open.rel = 'noreferrer';
        open.className = 'button button-primary';
        open.textContent = 'Open Full Certificate';
        fallback.appendChild(text);
        fallback.appendChild(open);
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
      img.alt = title || 'Preview';
      modalContent.appendChild(img);
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (modalClose) modalClose.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    window.setTimeout(() => {
      modalContent.innerHTML = '';
    }, 280);
    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !/\.(pdf|png|jpe?g|webp)$/i.test(href)) return;
      e.preventDefault();
      lastTrigger = link;
      const card = link.closest('.certificate-card, .project-card');
      const heading = card ? card.querySelector('h3') : null;
      const title = link.getAttribute('data-title') || (heading ? heading.textContent : 'Preview');
      openModal(href, title);
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

/* --- Copy email to clipboard --- */
function initCopyEmail() {
  const copyBtn = document.querySelector('.copy-email-btn');
  if (!copyBtn) return;

  const email = copyBtn.getAttribute('data-email') || '';
  const copyText = copyBtn.querySelector('.copy-text');

  function showCopied() {
    copyBtn.classList.add('copied');
    if (copyText) copyText.textContent = 'Copied';
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      if (copyText) copyText.textContent = 'Copy';
    }, 2200);
  }

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
      showCopied();
    } catch (e) {
      const textArea = document.createElement('textarea');
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showCopied();
    }
  });
}

initCardGlows();
initProjectCard3D();
initTechFlowAnimations();
initScrollReveals();
initProjectFilters();
initLightbox();
initCopyEmail();
