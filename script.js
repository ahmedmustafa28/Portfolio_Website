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

let heroThreeApp = null;

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

  if (heroThreeApp && heroThreeApp.updateTheme) {
    heroThreeApp.updateTheme();
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

/* --- Three.js "Living Data Field" with Interactive Morphing --- */
function initHeroThree() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') {
    return false;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    if (!renderer.getContext()) {
      return false;
    }
  } catch (e) {
    console.warn('WebGL context creation failed:', e);
    return false;
  }

  let width = window.innerWidth;
  let height = window.innerHeight;

  const isMobile = window.innerWidth < 768;
  const isTouch = window.matchMedia('(hover: none)').matches || isMobile;

  renderer.setSize(width, height);
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, width / height, 1, 2500);
  camera.position.z = 450;

  // Node count: 120–180 on desktop, 50–80 on mobile (50 mobile, 140 desktop)
  const nodeCount = isMobile ? 50 : 140;
  const baseMaxDistance = isMobile ? 70 : 90;
  const maxLinePairs = Math.min((nodeCount * (nodeCount - 1)) / 2, isMobile ? 100 : 420);

  function getAccentHex() {
    const isLight = document.documentElement.dataset.theme === 'light';
    return isLight ? 0xc84b00 : 0xff7a1a;
  }

  let currentAccent = getAccentHex();

  // Create soft circular sprite for nodes
  function createCircleTexture() {
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 32;
    spriteCanvas.height = 32;
    const ctx = spriteCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(spriteCanvas);
  }

  // Frustum bounds at z=0 for exact pixel-to-world mapping
  function getFrustumSize() {
    const vHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const vWidth = vHeight * camera.aspect;
    return { vWidth, vHeight };
  }

  let { vWidth, vHeight } = getFrustumSize();
  let spreadX = vWidth * 1.15;
  let spreadY = vHeight * 1.15;
  let spreadZ = 220;

  // Influence radius: 150–250px (set to 200px)
  // Maximum particle movement: 10–20px (set to 14px)
  let influenceRadius = (200 / height) * vHeight;
  let maxMovement = (14 / height) * vHeight;

  // Particles & Morph Anchors
  const particles = [];
  const positions = new Float32Array(nodeCount * 3);

  const cols = isMobile ? 6 : 12;
  const rows = Math.ceil(nodeCount / cols);
  const tiers = isMobile ? 5 : 7;

  for (let i = 0; i < nodeCount; i++) {
    // 1. Hero: Organic Neural Field
    const x0 = (Math.random() - 0.5) * spreadX;
    const y0 = (Math.random() - 0.5) * spreadY;
    const z0 = (Math.random() - 0.5) * spreadZ;

    // 2. Projects: Slightly More Structured (Subtle Lattice)
    const col = i % cols;
    const row = Math.floor(i / cols);
    const latticeX = ((col / (cols - 1)) - 0.5) * spreadX * 0.85;
    const latticeY = ((row / (rows - 1)) - 0.5) * spreadY * 0.75;
    const latticeZ = Math.sin(col * 0.7 + row * 0.5) * 35;
    const xProj = x0 * 0.45 + latticeX * 0.55;
    const yProj = y0 * 0.45 + latticeY * 0.55;
    const zProj = z0 * 0.45 + latticeZ * 0.55;

    // 3. Experience: More Linear Connections (Horizontal Timeline Tiers)
    const tier = i % tiers;
    const tierY = ((tier / (tiers - 1)) - 0.5) * spreadY * 0.65;
    const xExp = x0 * 0.95;
    const yExp = y0 * 0.35 + tierY * 0.65;
    const zExp = z0 * 0.35;

    // 4. Contact: Subtle Particle Convergence Toward Contact Area
    const contAngle = (i / nodeCount) * Math.PI * 2;
    const contRadius = 40 + (i % 5) * 16;
    const targetConvX = Math.cos(contAngle) * contRadius * 1.35;
    const targetConvY = Math.sin(contAngle) * contRadius * 0.85 - 12;
    const targetConvZ = ((i % 5) - 2) * 12;

    const xCont = x0 * 0.22 + targetConvX * 0.78;
    const yCont = y0 * 0.22 + targetConvY * 0.78;
    const zCont = z0 * 0.22 + targetConvZ * 0.78;

    particles.push({
      x0, y0, z0,
      xProj, yProj, zProj,
      xExp, yExp, zExp,
      xCont, yCont, zCont,
      // Idle ambient motion parameters
      freqX: 0.18 + Math.random() * 0.14,
      freqY: 0.16 + Math.random() * 0.12,
      freqZ: 0.14 + Math.random() * 0.10,
      phaseX: Math.random() * Math.PI * 2,
      phaseY: Math.random() * Math.PI * 2,
      phaseZ: Math.random() * Math.PI * 2,
      // Mouse interaction displacement
      dispX: 0,
      dispY: 0,
      targetDispX: 0,
      targetDispY: 0
    });

    const i3 = i * 3;
    positions[i3] = x0;
    positions[i3 + 1] = y0;
    positions[i3 + 2] = z0;
  }

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const isLightInitial = document.documentElement.dataset.theme === 'light';
  const pointMaterial = new THREE.PointsMaterial({
    color: currentAccent,
    size: isMobile ? 3.5 : 4.5,
    map: createCircleTexture(),
    transparent: true,
    opacity: isLightInitial ? 0.85 : 0.75,
    depthWrite: false,
    blending: isLightInitial ? THREE.NormalBlending : THREE.AdditiveBlending
  });

  const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
  scene.add(pointCloud);

  // Dynamic Line Segments for Connections
  const linePositions = new Float32Array(maxLinePairs * 6);
  const lineColors = new Float32Array(maxLinePairs * 6);

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
  lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));

  const lineMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: isLightInitial ? 0.75 : 0.6,
    depthWrite: false,
    blending: isLightInitial ? THREE.NormalBlending : THREE.AdditiveBlending
  });

  const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(linesMesh);

  // Mouse Interaction (Subtle Influence, omitted on mobile/touch)
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let pointerActive = false;
  let pointerWorldX = 0;
  let pointerWorldY = 0;
  let pointerTimer = null;

  if (!isTouch) {
    window.addEventListener('pointermove', (e) => {
      pointerActive = true;
      const nx = (e.clientX / width) * 2 - 1;
      const ny = -(e.clientY / height) * 2 + 1;
      pointerWorldX = (nx * vWidth) / 2;
      pointerWorldY = (ny * vHeight) / 2;

      mouse.targetX = nx * 20;
      mouse.targetY = ny * 15;

      clearTimeout(pointerTimer);
      pointerTimer = setTimeout(() => {
        pointerActive = false;
      }, 2500);
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      pointerActive = false;
      mouse.targetX = 0;
      mouse.targetY = 0;
    });
  }

  // Section Scroll Tracking & Smooth Interpolation
  const sectionOffsets = { projects: 800, experience: 2000, contact: 3200 };

  function updateSectionOffsets() {
    const getTop = (id) => {
      const el = document.getElementById(id);
      if (!el) return 0;
      return el.getBoundingClientRect().top + window.scrollY;
    };
    sectionOffsets.projects = getTop('projects');
    sectionOffsets.experience = getTop('experience');
    sectionOffsets.contact = getTop('contact');
  }

  updateSectionOffsets();

  let targetScrollY = window.scrollY || 0;
  let smoothScrollY = targetScrollY;

  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY || 0;
  }, { passive: true });

  function getSectionWeights(scrollY) {
    const yHero = 0;
    const yProj = Math.max(sectionOffsets.projects - 250, 400);
    const yExp = Math.max(sectionOffsets.experience - 250, yProj + 500);
    const yCont = Math.max(sectionOffsets.contact - 350, yExp + 500);

    let wHero = 0, wProj = 0, wExp = 0, wCont = 0;

    if (scrollY <= yProj) {
      const t = Math.max(0, Math.min(1, (scrollY - yHero) / (yProj - yHero)));
      const s = t * t * (3 - 2 * t);
      wHero = 1 - s;
      wProj = s;
    } else if (scrollY <= yExp) {
      const t = Math.max(0, Math.min(1, (scrollY - yProj) / (yExp - yProj)));
      const s = t * t * (3 - 2 * t);
      wProj = 1 - s;
      wExp = s;
    } else if (scrollY <= yCont) {
      const t = Math.max(0, Math.min(1, (scrollY - yExp) / (yCont - yExp)));
      const s = t * t * (3 - 2 * t);
      wExp = 1 - s;
      wCont = s;
    } else {
      wCont = 1;
    }

    return { wHero, wProj, wExp, wCont };
  }

  function onResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio, 2));

    const frustum = getFrustumSize();
    vWidth = frustum.vWidth;
    vHeight = frustum.vHeight;
    spreadX = vWidth * 1.15;
    spreadY = vHeight * 1.15;
    influenceRadius = (200 / height) * vHeight;
    maxMovement = (14 / height) * vHeight;

    updateSectionOffsets();
  }

  window.addEventListener('resize', onResize);

  function updateTheme() {
    const isLight = document.documentElement.dataset.theme === 'light';
    const newColor = getAccentHex();
    pointMaterial.color.setHex(newColor);
    pointMaterial.opacity = isLight ? 0.85 : 0.75;
    pointMaterial.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    lineMaterial.blending = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    pointMaterial.needsUpdate = true;
    lineMaterial.needsUpdate = true;
    currentAccent = newColor;
  }

  let isPageVisible = !document.hidden;
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
      if (!reduceMotion && !animationId) {
        clock.start();
        animate();
      }
    } else {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }
  });

  const baseAccent = new THREE.Color(currentAccent);
  const clock = new THREE.Clock();
  let animationId = null;

  function animate() {
    if (!isPageVisible) {
      animationId = null;
      return;
    }

    const elapsed = clock.getElapsedTime();

    // Gentle camera parallax
    if (!isTouch) {
      mouse.x += (mouse.targetX - mouse.x) * 0.035;
      mouse.y += (mouse.targetY - mouse.y) * 0.035;
      camera.position.x = mouse.x;
      camera.position.y = mouse.y;
    }
    camera.lookAt(scene.position);

    // Smooth scroll interpolation
    smoothScrollY += (targetScrollY - smoothScrollY) * 0.075;
    const { wHero, wProj, wExp, wCont } = getSectionWeights(smoothScrollY);

    const pos = pointGeometry.attributes.position.array;

    // Update particle positions
    for (let i = 0; i < nodeCount; i++) {
      const p = particles[i];
      const i3 = i * 3;

      // 3. Scroll morph target interpolation
      const targetX = p.x0 * wHero + p.xProj * wProj + p.xExp * wExp + p.xCont * wCont;
      const targetY = p.y0 * wHero + p.yProj * wProj + p.yExp * wExp + p.yCont * wCont;
      const targetZ = p.z0 * wHero + p.zProj * wProj + p.zExp * wExp + p.zCont * wCont;

      // 2. Idle ambient movement (harmonic oscillation)
      const ambX = Math.sin(elapsed * p.freqX + p.phaseX) * 6;
      const ambY = Math.cos(elapsed * p.freqY + p.phaseY) * 6;
      const ambZ = Math.sin(elapsed * p.freqZ + p.phaseZ) * 4;

      const currentX = targetX + ambX;
      const currentY = targetY + ambY;

      // 1. Mouse interaction: subtle deflection with smooth falloff (desktop only)
      if (!isTouch && pointerActive) {
        const dx = currentX - pointerWorldX;
        const dy = currentY - pointerWorldY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < influenceRadius && dist > 0.001) {
          const t = 1 - (dist / influenceRadius);
          const falloff = t * t * (3 - 2 * t);
          const push = maxMovement * falloff;
          p.targetDispX = (dx / dist) * push;
          p.targetDispY = (dy / dist) * push;
        } else {
          p.targetDispX = 0;
          p.targetDispY = 0;
        }

        p.dispX += (p.targetDispX - p.dispX) * 0.08;
        p.dispY += (p.targetDispY - p.dispY) * 0.08;
      } else {
        p.dispX = 0;
        p.dispY = 0;
      }

      pos[i3] = currentX + p.dispX;
      pos[i3 + 1] = currentY + p.dispY;
      pos[i3 + 2] = targetZ + ambZ;
    }

    pointGeometry.attributes.position.needsUpdate = true;

    // Dynamic Connections
    let lineVertexIndex = 0;
    let colorIndex = 0;
    baseAccent.setHex(currentAccent);

    // In Experience state, horizontal lines are emphasized
    const dyFactor = 1.0 + wExp * 2.2;
    // In Contact state, connection radius subtly contracts to match convergence
    const currentMaxDistance = baseMaxDistance * (1.0 - wCont * 0.28);

    for (let i = 0; i < nodeCount && (lineVertexIndex / 6) < maxLinePairs; i++) {
      const i3 = i * 3;
      const x1 = pos[i3];
      const y1 = pos[i3 + 1];
      const z1 = pos[i3 + 2];

      for (let j = i + 1; j < nodeCount && (lineVertexIndex / 6) < maxLinePairs; j++) {
        const j3 = j * 3;
        const dx = x1 - pos[j3];
        const dy = y1 - pos[j3 + 1];
        const dz = z1 - pos[j3 + 2];

        // Linear connection bias in Experience mode
        const effectiveDist = Math.sqrt(dx * dx + (dy * dyFactor) * (dy * dyFactor) + dz * dz);

        if (effectiveDist < currentMaxDistance) {
          const alpha = (1 - effectiveDist / currentMaxDistance) * 0.18;

          linePositions[lineVertexIndex++] = x1;
          linePositions[lineVertexIndex++] = y1;
          linePositions[lineVertexIndex++] = z1;
          linePositions[lineVertexIndex++] = pos[j3];
          linePositions[lineVertexIndex++] = pos[j3 + 1];
          linePositions[lineVertexIndex++] = pos[j3 + 2];

          lineColors[colorIndex++] = baseAccent.r * alpha;
          lineColors[colorIndex++] = baseAccent.g * alpha;
          lineColors[colorIndex++] = baseAccent.b * alpha;
          lineColors[colorIndex++] = baseAccent.r * alpha;
          lineColors[colorIndex++] = baseAccent.g * alpha;
          lineColors[colorIndex++] = baseAccent.b * alpha;
        }
      }
    }

    lineGeometry.setDrawRange(0, lineVertexIndex / 3);
    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
    animationId = requestAnimationFrame(animate);
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    renderer.render(scene, camera);
  } else {
    animate();
  }

  heroThreeApp = { updateTheme, updateSectionOffsets };
  return true;
}

/* --- Fallback 2D Canvas Particle System --- */
function init2DHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let particles = [];
  let animationId = null;
  const maxParticles = 65;
  const connectionDistance = 110;
  let mouse = { x: null, y: null, radius: 150 };

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('pointerleave', () => {
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

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !reduceMotion && !animationId) {
      animate();
    } else if (document.hidden && animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  });

  if (!reduceMotion) {
    animate();
  }
}

/* --- Hero Canvas Master Initializer --- */
function initHeroCanvas() {
  if (typeof THREE !== 'undefined') {
    const success = initHeroThree();
    if (success) return;
  }
  if (!reduceMotion) {
    init2DHeroCanvas();
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

/* --- Project Card Subtle 3D Hover & Internal Parallax --- */
function initProjectCard3D() {
  const cards = document.querySelectorAll('.project-card');
  if (cards.length === 0) return;

  const isTouch = window.matchMedia('(hover: none)').matches || window.innerWidth < 768;
  if (isTouch || reduceMotion) return;

  cards.forEach(card => {
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

        // Normalized relative coordinates from center: -1 to +1
        const nx = (x / rect.width - 0.5) * 2;
        const ny = (y / rect.height - 0.5) * 2;

        // rotateX: approximately ±2°
        // rotateY: approximately ±3°
        // scale: approximately 1.01
        const rotX = (-ny * 2).toFixed(2);
        const rotY = (nx * 3).toFixed(2);

        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.01, 1.01, 1)`;

        // Subtle internal parallax on preview image
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

/* --- Technical Architecture Sections Entrance Animations --- */
function initTechFlowAnimations() {
  const flows = document.querySelectorAll('.tech-flow');
  if (flows.length === 0) return;

  if (reduceMotion) {
    return;
  }

  flows.forEach(flow => {
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

  // Viewport entrance observer
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          triggerFlow(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    flows.forEach(flow => observer.observe(flow));
  } else {
    flows.forEach(flow => triggerFlow(flow));
  }

  // Also trigger when details tag is opened
  const detailsList = document.querySelectorAll('.tech-details');
  detailsList.forEach(details => {
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

      setTimeout(() => {
        if (heroThreeApp && heroThreeApp.updateSectionOffsets) {
          heroThreeApp.updateSectionOffsets();
        }
      }, 300);
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
initProjectCard3D();
initTechFlowAnimations();
initScrollReveals();
initProjectFilters();
initCryptoSimulator();
initCertLightbox();
initCopyEmail();
initNlpDemo();


