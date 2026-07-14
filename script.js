const heroSection = document.querySelector('.hero');
const heroPattern = document.querySelector('.hero-pattern');
const pageLoader = document.querySelector('.page-loader');
const pageLoaderCount = document.querySelector('.page-loader-count');
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

  if (!reduceMotion && progress < 1) {
    loaderFrameId = window.requestAnimationFrame(updateLoaderProgress);
    return;
  }

  pageLoaderCount.textContent = '100%';
}

function startLoaderProgress() {
  if (!pageLoader || !pageLoaderCount) {
    return;
  }

  if (reduceMotion) {
    pageLoaderCount.textContent = '100%';
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
