/* ============================================================================
   ENHANCE.JS — additive premium interaction/visual layer
   -----------------------------------------------------------------------
   Everything here is namespaced under window.Enhance and is OPT-IN via
   data-attributes or specific element IDs. Nothing in your existing
   script.js is modified, removed, or overridden. Load this file AFTER
   script.js.

   Required in your HTML <head> or before this file: nothing — CDN libs
   (GSAP, ScrollTrigger, Lenis, SplitType) are loaded dynamically by this
   file so you don't have to touch your HTML's <script> tags at all.

   To activate a feature, add the matching data-attribute/class to any
   element. See the "USAGE" comment block at the bottom of this file.
   ============================================================================ */
(function () {
  'use strict';

  const Enhance = (window.Enhance = window.Enhance || {});

  /* ==========================================================================
     0. ENVIRONMENT / FEATURE DETECTION
     ========================================================================== */
  const mqReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const isSmallScreen = matchMedia('(max-width: 768px)').matches;
  const isLowEnd = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || isSmallScreen;

  const env = (Enhance.env = {
    reducedMotion: !!(mqReduced && mqReduced.matches),
    isTouch,
    isSmallScreen,
    isLowEnd,
  });

  function applyReducedMotionClass() {
    document.documentElement.classList.toggle('enh-reduced-motion', env.reducedMotion);
  }
  applyReducedMotionClass();
  if (mqReduced && mqReduced.addEventListener) {
    mqReduced.addEventListener('change', (e) => {
      env.reducedMotion = e.matches;
      applyReducedMotionClass();
    });
  }

  /* ==========================================================================
     1. CDN LOADER (core infra)
     ========================================================================== */
  const CDN = {
    gsap: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
    scrollTrigger: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
    lenis: 'https://unpkg.com/lenis@1.1.16/dist/lenis.min.js',
    splitType: 'https://unpkg.com/split-type@0.3.4/umd/index.min.js',
  };

  const loadedScripts = new Map();
  function loadScript(src) {
    if (loadedScripts.has(src)) return loadedScripts.get(src);
    const p = new Promise((resolve) => {
      let settled = false;
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          console.warn('[Enhance] timeout loading', src);
          resolve(false);
        }
      }, 4000);
      s.onload = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(true);
        }
      };
      s.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          console.warn('[Enhance] failed to load', src);
          resolve(false);
        }
      };
      document.head.appendChild(s);
    });
    loadedScripts.set(src, p);
    return p;
  }

  async function loadCore() {
    await Promise.all([loadScript(CDN.gsap), loadScript(CDN.splitType)]);
    if (window.gsap) {
      await loadScript(CDN.scrollTrigger);
      if (window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
    }
    if (!env.isLowEnd) await loadScript(CDN.lenis);
    return {
      gsap: window.gsap || null,
      ScrollTrigger: window.ScrollTrigger || null,
      Lenis: window.Lenis || null,
      SplitType: window.SplitType || null,
    };
  }

  /* ==========================================================================
     2. PERFORMANCE UTILITIES
     ========================================================================== */
  const utils = (Enhance.utils = {
    clamp: (v, min, max) => Math.min(max, Math.max(min, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    mapRange: (v, inMin, inMax, outMin, outMax) =>
      outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin),
    debounce(fn, wait) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
      };
    },
    rafThrottle(fn) {
      let ticking = false;
      let lastArgs = null;
      return (...args) => {
        lastArgs = args;
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          fn(...lastArgs);
          ticking = false;
        });
      };
    },
    prefersReducedMotion: () => env.reducedMotion,
  });

  /* ==========================================================================
     3. ANIMATION MANAGER — central registry so everything can be paused when
        the tab is hidden, and torn down cleanly if ever needed.
     ========================================================================== */
  const registry = new Map();
  const manager = (Enhance.manager = {
    register(name, { init, pause, resume, kill } = {}) {
      registry.set(name, { init, pause, resume, kill, active: false });
    },
    initAll() {
      registry.forEach((entry, name) => {
        try {
          if (entry.init && !entry.active) {
            entry.init();
            entry.active = true;
          }
        } catch (err) {
          console.warn('[Enhance] init failed for', name, err);
        }
      });
    },
    pauseAll() {
      registry.forEach((entry) => entry.pause && entry.pause());
    },
    resumeAll() {
      registry.forEach((entry) => entry.resume && entry.resume());
    },
    killAll() {
      registry.forEach((entry) => entry.kill && entry.kill());
      registry.clear();
    },
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) manager.pauseAll();
    else manager.resumeAll();
  });

  /* ==========================================================================
     4. LENIS — smooth scrolling
     ========================================================================== */
  let lenisInstance = null;
  function initLenis(gsap, Lenis) {
    if (!Lenis || env.reducedMotion || env.isTouch || env.isLowEnd) return null;
    document.documentElement.classList.add('enh-lenis');
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    if (gsap) {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
    if (window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
    }
    lenisInstance = lenis;
    Enhance.lenis = lenis;
    return lenis;
  }

  /* ==========================================================================
     CURSOR & INTERACTIONS
     ========================================================================== */

  /* ---- Physics cursor: dot follows instantly, ring lags with spring lerp ---- */
  function initPhysicsCursor() {
    if (env.isTouch || env.reducedMotion) return;
    const dot = document.createElement('div');
    dot.className = 'enh-cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'enh-cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add('enh-cursor-active');

    let mx = window.innerWidth / 2,
      my = window.innerHeight / 2;
    let rx = mx,
      ry = my;
    let raf = null;

    window.addEventListener(
      'pointermove',
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
      },
      { passive: true }
    );

    window.addEventListener('pointerdown', () => ring.classList.add('is-down'));
    window.addEventListener('pointerup', () => ring.classList.remove('is-down'));

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest && e.target.closest('a, button, [data-magnetic], [data-cursor-hover]')) {
        ring.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest && e.target.closest('a, button, [data-magnetic], [data-cursor-hover]')) {
        ring.classList.remove('is-hover');
      }
    });

    function tick() {
      rx = utils.lerp(rx, mx, 0.18);
      ry = utils.lerp(ry, my, 0.18);
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      raf = requestAnimationFrame(tick);
    }
    tick();

    manager.register('physicsCursor', {
      pause: () => raf && cancelAnimationFrame(raf),
      resume: () => (raf = requestAnimationFrame(tick)),
      kill: () => {
        raf && cancelAnimationFrame(raf);
        dot.remove();
        ring.remove();
      },
    });
  }

  /* ---- Magnetic buttons ---- */
  function initMagnetic(selector = '[data-magnetic]') {
    if (env.isTouch || env.reducedMotion) return;
    document.querySelectorAll(selector).forEach((el) => {
      const strength = parseFloat(el.dataset.magneticStrength) || 0.35;
      let raf = null;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${dx}px, ${dy}px)`;
        });
      });
      el.addEventListener('pointerleave', () => {
        if (raf) cancelAnimationFrame(raf);
        el.style.transition = 'transform .4s cubic-bezier(.22,1,.36,1)';
        el.style.transform = 'translate(0,0)';
        setTimeout(() => (el.style.transition = ''), 400);
      });
    });
  }

  /* ---- Ripple ---- */
  function initRipple(selector = '[data-ripple]') {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener('pointerdown', (e) => {
        const r = el.getBoundingClientRect();
        const size = Math.max(r.width, r.height) * 1.6;
        const span = document.createElement('span');
        span.className = 'enh-ripple';
        span.style.width = span.style.height = size + 'px';
        span.style.left = e.clientX - r.left - size / 2 + 'px';
        span.style.top = e.clientY - r.top - size / 2 + 'px';
        el.appendChild(span);
        span.addEventListener('animationend', () => span.remove());
      });
    });
  }

  /* ---- Spotlight (radial glow tracking cursor) ---- */
  function initSpotlight(selector = '[data-spotlight]') {
    if (env.isTouch) return;
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener(
        'pointermove',
        utils.rafThrottle((e) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty('--enh-x', e.clientX - r.left + 'px');
          el.style.setProperty('--enh-y', e.clientY - r.top + 'px');
        })
      );
    });
  }

  /* ==========================================================================
     TYPOGRAPHY
     ========================================================================== */

  /* ---- SplitType-based char/word reveal on scroll ---- */
  function initSplitReveal(gsap, SplitType, selector = '[data-split-reveal]') {
    if (!SplitType || !gsap) return;
    document.querySelectorAll(selector).forEach((el) => {
      const mode = el.dataset.splitReveal || 'chars'; // chars | words
      const split = new SplitType(el, { types: mode === 'words' ? 'words' : 'chars' });
      const targets = mode === 'words' ? split.words : split.chars;
      targets.forEach((t) => t.classList.add(mode === 'words' ? 'enh-word' : 'enh-char'));
      gsap.set(targets, { opacity: 0, y: '60%' });
      const trigger = window.ScrollTrigger
        ? { trigger: el, start: 'top 85%', once: true }
        : null;
      gsap.to(targets, {
        opacity: 1,
        y: '0%',
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.02,
        scrollTrigger: trigger,
      });
    });
  }

  /* ---- Text reveal (mask-based, translateY via CSS class toggle) ---- */
  function initTextReveal(selector = '[data-text-reveal]') {
    document.querySelectorAll(selector).forEach((el) => {
      if (!el.querySelector('.enh-reveal-mask')) {
        const inner = document.createElement('span');
        inner.className = 'enh-reveal-mask';
        inner.innerHTML = el.innerHTML;
        el.innerHTML = '';
        el.appendChild(inner);
      }
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('enh-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll(selector).forEach((el) => io.observe(el));
  }

  /* ---- Scramble text effect ---- */
  const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function scrambleInto(el, finalText, duration = 700) {
    const start = performance.now();
    const original = el.textContent;
    function frame(now) {
      const progress = utils.clamp((now - start) / duration, 0, 1);
      const revealCount = Math.floor(progress * finalText.length);
      let out = '';
      for (let i = 0; i < finalText.length; i++) {
        if (i < revealCount) out += finalText[i];
        else if (finalText[i] === ' ') out += ' ';
        else out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
      }
      el.textContent = out;
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = finalText;
    }
    requestAnimationFrame(frame);
    return original;
  }
  function initScramble(selector = '[data-scramble]') {
    document.querySelectorAll(selector).forEach((el) => {
      const finalText = el.dataset.scrambleText || el.textContent;
      const trigger = el.dataset.scrambleTrigger || 'hover'; // hover | inview
      if (trigger === 'hover') {
        el.addEventListener('mouseenter', () => scrambleInto(el, finalText));
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                scrambleInto(el, finalText);
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.6 }
        );
        io.observe(el);
      }
    });
  }
  Enhance.scramble = scrambleInto;

  /* ==========================================================================
     CARDS & SECTIONS
     ========================================================================== */

  /* ---- 3D tilt ---- */
  function initTilt(selector = '[data-tilt]') {
    if (env.isTouch || env.reducedMotion) return;
    document.querySelectorAll(selector).forEach((el) => {
      const max = parseFloat(el.dataset.tiltMax) || 10;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(800px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  /* ---- Mouse lighting on cards (pure CSS var, JS just tracks position) ---- */
  function initMouseLighting(selector = '[data-mouse-light]') {
    if (env.isTouch) return;
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener(
        'pointermove',
        utils.rafThrottle((e) => {
          const r = el.getBoundingClientRect();
          el.style.setProperty('--enh-x', e.clientX - r.left + 'px');
          el.style.setProperty('--enh-y', e.clientY - r.top + 'px');
        })
      );
    });
  }

  /* ---- Staggered reveal groups (new, separate from your legacy observers) ---- */
  function initStaggerGroups(selector = '[data-enh-stagger]') {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('enh-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    document.querySelectorAll(selector).forEach((el) => io.observe(el));
  }

  /* ---- Floating (pure CSS via [data-float], nothing to wire up in JS) ---- */

  /* ==========================================================================
     BACKGROUND SYSTEMS
     ========================================================================== */

  /* ---- Particles (canvas) ---- */
  function initParticles(mountSelector = '#enh-particles') {
    const mount = document.querySelector(mountSelector);
    if (!mount || env.reducedMotion) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'enh-particles-canvas';
    mount.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w, h, particles, raf;
    const COUNT = env.isLowEnd ? 34 : 80;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    function makeParticles() {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.4,
      }));
    }
    function step() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(step);
    }
    resize();
    makeParticles();
    step();
    window.addEventListener('resize', utils.debounce(() => { resize(); makeParticles(); }, 200));

    manager.register('particles', {
      pause: () => raf && cancelAnimationFrame(raf),
      resume: () => (raf = requestAnimationFrame(step)),
      kill: () => { raf && cancelAnimationFrame(raf); canvas.remove(); },
    });
  }

  /* ---- Animated grid (canvas, subtle moving grid lines) ---- */
  function initAnimatedGrid(mountSelector = '#enh-grid') {
    const mount = document.querySelector(mountSelector);
    if (!mount || env.reducedMotion || env.isLowEnd) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'enh-grid-canvas';
    mount.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w, h, offset = 0, raf;
    const SPACING = 46;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    function step() {
      offset = (offset + 0.06) % SPACING;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx.lineWidth = 1;
      for (let x = -SPACING + offset; x < w; x += SPACING) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = -SPACING + offset; y < h; y += SPACING) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      raf = requestAnimationFrame(step);
    }
    resize();
    step();
    window.addEventListener('resize', utils.debounce(resize, 200));

    manager.register('grid', {
      pause: () => raf && cancelAnimationFrame(raf),
      resume: () => (raf = requestAnimationFrame(step)),
      kill: () => { raf && cancelAnimationFrame(raf); canvas.remove(); },
    });
  }

  /* ---- Noise overlay (pure CSS layer, SVG turbulence data-uri) ---- */
  function initNoise() {
    if (document.querySelector('.enh-noise-layer')) return;
    const layer = document.createElement('div');
    layer.className = 'enh-noise-layer';
    document.body.appendChild(layer);
  }

  /* ---- Ambient lighting blobs (drift slowly via CSS/JS translate) ---- */
  function initAmbientLighting(count = 3) {
    if (env.reducedMotion) return;
    const layer = document.createElement('div');
    layer.className = 'enh-ambient-layer';
    for (let i = 0; i < count; i++) {
      const blob = document.createElement('div');
      blob.className = 'enh-ambient-blob';
      blob.style.left = Math.random() * 80 + '%';
      blob.style.top = Math.random() * 80 + '%';
      layer.appendChild(blob);
    }
    document.body.appendChild(layer);
    if (window.gsap) {
      layer.querySelectorAll('.enh-ambient-blob').forEach((blob) => {
        window.gsap.to(blob, {
          x: () => utils.mapRange(Math.random(), 0, 1, -120, 120),
          y: () => utils.mapRange(Math.random(), 0, 1, -120, 120),
          duration: () => 14 + Math.random() * 10,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });
    }
  }

  /* ==========================================================================
     UI SYSTEMS
     ========================================================================== */

  /* ---- Command palette (Cmd/Ctrl+K) ---- */
  function initCommandPalette(items = []) {
    if (document.querySelector('.enh-cmdk-backdrop')) return;
    const backdrop = document.createElement('div');
    backdrop.className = 'enh-cmdk-backdrop';
    backdrop.innerHTML = `
      <div class="enh-cmdk-panel" role="dialog" aria-modal="true" aria-label="Command palette">
        <input class="enh-cmdk-input" type="text" placeholder="Type a command or search…" autocomplete="off" />
        <div class="enh-cmdk-list"></div>
      </div>`;
    document.body.appendChild(backdrop);
    const input = backdrop.querySelector('.enh-cmdk-input');
    const list = backdrop.querySelector('.enh-cmdk-list');
    let activeIndex = 0;
    let filtered = items;

    function render() {
      list.innerHTML = '';
      if (!filtered.length) {
        list.innerHTML = '<div class="enh-cmdk-empty">No results</div>';
        return;
      }
      filtered.forEach((item, i) => {
        const row = document.createElement('div');
        row.className = 'enh-cmdk-item' + (i === activeIndex ? ' enh-active' : '');
        row.textContent = item.label;
        row.addEventListener('click', () => { item.action && item.action(); close(); });
        list.appendChild(row);
      });
    }
    function open() {
      backdrop.classList.add('enh-open');
      input.value = '';
      filtered = items;
      activeIndex = 0;
      render();
      setTimeout(() => input.focus(), 50);
    }
    function close() {
      backdrop.classList.remove('enh-open');
    }
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      filtered = items.filter((i) => i.label.toLowerCase().includes(q));
      activeIndex = 0;
      render();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { activeIndex = Math.min(activeIndex + 1, filtered.length - 1); render(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { activeIndex = Math.max(activeIndex - 1, 0); render(); e.preventDefault(); }
      if (e.key === 'Enter' && filtered[activeIndex]) { filtered[activeIndex].action && filtered[activeIndex].action(); close(); }
      if (e.key === 'Escape') close();
    });
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        backdrop.classList.contains('enh-open') ? close() : open();
      }
    });

    Enhance.commandPalette = { open, close, setItems: (next) => { items = next; filtered = next; } };
  }

  /* ---- Toasts ---- */
  function ensureToastStack() {
    let stack = document.querySelector('.enh-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'enh-toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    return stack;
  }
  function toast(message, { type = 'info', duration = 3200 } = {}) {
    const stack = ensureToastStack();
    const el = document.createElement('div');
    el.className = 'enh-toast';
    el.dataset.type = type;
    el.innerHTML = `<span class="enh-toast-dot"></span><span>${message}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add('enh-leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, duration);
  }
  Enhance.toast = toast;

  /* ---- Popups (generic, additive — distinct from your `ama-modal` system) ---- */
  function createPopup(contentHTML) {
    const backdrop = document.createElement('div');
    backdrop.className = 'enh-popup-backdrop';
    backdrop.innerHTML = `<div class="enh-popup" role="dialog" aria-modal="true">${contentHTML}</div>`;
    document.body.appendChild(backdrop);
    function open() { backdrop.classList.add('enh-open'); }
    function close() { backdrop.classList.remove('enh-open'); }
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    return { el: backdrop, open, close, destroy: () => backdrop.remove() };
  }
  Enhance.createPopup = createPopup;

  /* ---- Scroll progress bar ---- */
  function initProgressBar() {
    if (document.querySelector('.enh-progress-bar')) return;
    const bar = document.createElement('div');
    bar.className = 'enh-progress-bar';
    document.body.appendChild(bar);
    const update = utils.rafThrottle(() => {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const pct = height > 0 ? (scrollTop / height) * 100 : 0;
      bar.style.width = pct + '%';
    });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---- Dock navigation ---- */
  function initDock(items = []) {
    if (!items.length || document.querySelector('.enh-dock')) return;
    const dock = document.createElement('div');
    dock.className = 'enh-dock';
    dock.setAttribute('role', 'navigation');
    dock.setAttribute('aria-label', 'Quick navigation');
    items.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'enh-dock-item';
      el.title = item.label || '';
      el.innerHTML = item.icon || (item.label ? item.label[0] : '•');
      el.addEventListener('click', () => {
        if (item.href) {
          const target = document.querySelector(item.href);
          if (target) target.scrollIntoView({ behavior: env.reducedMotion ? 'auto' : 'smooth' });
        }
        item.action && item.action();
      });
      if (!env.isTouch) {
        el.addEventListener('pointerenter', () => { el.style.transform = 'translateY(-6px) scale(1.08)'; });
        el.addEventListener('pointerleave', () => { el.style.transform = ''; });
      }
      dock.appendChild(el);
    });
    document.body.appendChild(dock);
  }

  /* ==========================================================================
     LOADING & TRANSITIONS
     ========================================================================== */

  /* ---- Secondary loader — only runs if #enh-loader exists in the DOM, so it
     never doubles up with your existing #intro-overlay preloader. ---- */
  function initEnhanceLoader() {
    const loader = document.getElementById('enh-loader');
    if (!loader) return;
    if (!loader.querySelector('.enh-loader-bar')) {
      const bar = document.createElement('div');
      bar.className = 'enh-loader-bar';
      loader.appendChild(bar);
    }
    const barEl = loader.querySelector('.enh-loader-bar');
    let progress = 0;
    function set(pct) {
      progress = utils.clamp(pct, 0, 100);
      barEl.style.setProperty('--enh-progress', progress + '%');
    }
    function done() {
      set(100);
      setTimeout(() => loader.classList.add('enh-hidden'), 250);
    }
    Enhance.loader = { set, done };
    return { set, done };
  }

  /* ---- Page transitions for internal anchor navigation ---- */
  function initPageTransitions(selector = 'a[data-enh-transition]') {
    if (env.reducedMotion) return;
    let overlay = document.getElementById('enh-transition-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'enh-transition-overlay';
      document.body.appendChild(overlay);
    }
    document.querySelectorAll(selector).forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        e.preventDefault();
        overlay.classList.add('enh-active');
        setTimeout(() => { window.location.href = href; }, 420);
      });
    });
  }

  /* ---- Asset preloading ---- */
  function preloadAssets(urls = []) {
    return Promise.all(
      urls.map(
        (url) =>
          new Promise((resolve) => {
            const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(url);
            if (isImage) {
              const img = new Image();
              img.onload = img.onerror = () => resolve(url);
              img.src = url;
            } else {
              fetch(url, { mode: 'no-cors' }).then(() => resolve(url)).catch(() => resolve(url));
            }
          })
      )
    );
  }
  Enhance.preloadAssets = preloadAssets;

  /* ==========================================================================
     BOOT SEQUENCE
     ========================================================================== */
  async function boot() {
    // 1. Run all synchronous & pure DOM interactive effects immediately (no waiting on external CDNs)
    initPhysicsCursor();
    initMagnetic();
    initRipple();
    initSpotlight();
    initTilt();
    initMouseLighting();
    initStaggerGroups();
    initTextReveal();
    initScramble();
    if (document.body.hasAttribute('data-enh-noise')) initNoise();
    if (document.body.hasAttribute('data-enh-progress')) initProgressBar();
    initEnhanceLoader();
    initPageTransitions();
    manager.initAll();

    // 2. Load external CDNs asynchronously for heavy animation engines
    const { gsap, ScrollTrigger, Lenis, SplitType } = await loadCore();

    // 3. Initialize features dependent on GSAP, SplitType, or Lenis
    initLenis(gsap, Lenis);
    initSplitReveal(gsap, SplitType);
    initParticles('#enh-particles');
    initAnimatedGrid('#enh-grid');
    if (document.body.hasAttribute('data-enh-ambient')) initAmbientLighting();

    if (ScrollTrigger) ScrollTrigger.refresh();

    Enhance.ready = true;
    document.dispatchEvent(new CustomEvent('enhance:ready'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Public API for things that need manual setup (palette items & dock items
  // are page-specific, so they're exposed rather than auto-initialized).
  Enhance.initCommandPalette = initCommandPalette;
  Enhance.initDock = initDock;
  Enhance.utils = utils;
})();

/* ============================================================================
   USAGE — add these to elements already in your HTML, no markup restructuring
   required:

   Cursor:            automatic (desktop only, skipped on touch/reduced-motion)
   Magnetic button:   <button data-magnetic data-magnetic-strength="0.4">Hi</button>
   Ripple:            <button data-ripple>Click</button>
   Spotlight card:    <div data-spotlight class="project-card">...</div>
   Split text reveal: <h2 data-split-reveal="chars">Headline</h2>
   Text mask reveal:  <span data-text-reveal>Reveals on scroll</span>
   Scramble on hover: <span data-scramble>Hover me</span>
   Scramble in view:  <span data-scramble data-scramble-trigger="inview" data-scramble-text="42">--</span>
   3D tilt card:      <div data-tilt data-tilt-max="12">...</div>
   Mouse light card:  <div data-mouse-light>...</div>
   Stagger group:     <div data-enh-stagger><div>1</div><div>2</div><div>3</div></div>
   Floating element:  <div data-float="slow">✦</div>
   Particles bg:      <div id="enh-particles" class="enh-bg-layer"></div>  (place once, e.g. in <body>)
   Animated grid bg:  <div id="enh-grid" class="enh-bg-layer"></div>
   Noise overlay:     <body data-enh-noise>
   Ambient blobs:     <body data-enh-ambient>
   Progress bar:      <body data-enh-progress>
   Command palette:   Enhance.initCommandPalette([{label:'Go to Projects', action:()=>...}])
   Toast:             Enhance.toast('Saved!', {type:'success'})
   Popup:             const p = Enhance.createPopup('<h3>Hi</h3>'); p.open();
   Dock nav:          Enhance.initDock([{label:'Home', icon:'🏠', href:'#top'}, ...])
   Loader:            <div id="enh-loader"></div> in HTML, then Enhance.loader.set(50) / .done()
   Page transition:   <a href="/other.html" data-enh-transition>Other page</a>
   Preload assets:    Enhance.preloadAssets(['/img/a.jpg','/img/b.jpg']).then(...)

   Everything respects prefers-reduced-motion and disables heavy effects
   (cursor, tilt, particles, ambient blobs, Lenis) automatically on touch
   devices and low-end hardware (env.isLowEnd).
   ============================================================================ */
