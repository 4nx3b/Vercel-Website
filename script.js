/* ═══════════════════════════════════════════════════════════════════════════
   therealreze — SIGNAL rebuild
   Complete from-scratch UI layer. All data integrations preserved:
   Last.fm · AniList · GitHub · AMA (Firestore + Telegram + Formspree) ·
   site music player · playground games · widgets · changelog · credits.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ── 0. UTILITIES ─────────────────────────────────────────────────────── */
const $  = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtNum = (n) => Number(n || 0).toLocaleString('en-US');
const fmtTime = (s) => !isFinite(s) || s < 0 ? '0:00' : Math.floor(s/60) + ':' + String(Math.floor(s%60)).padStart(2,'0');
const timeAgo = (iso) => {
  const t = new Date(iso || Date.now()).getTime();
  const d = Math.max(0, Date.now() - t), m = Math.floor(d/60000), h = Math.floor(m/60), day = Math.floor(h/24);
  return day ? day+'d ago' : h ? h+'h ago' : m ? m+'m ago' : 'now';
};
const nowISO = () => new Date().toISOString();
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : ('q_' + Date.now() + '_' + Math.random().toString(16).slice(2)));
const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function jfetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const txt = await res.text();
  let data = null;
  try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = { raw: txt }; }
  if (!res.ok) {
    const msg = data?.error?.message || data?.error || txt || ('HTTP ' + res.status);
    const err = new Error(msg); err.status = res.status; err.data = data; throw err;
  }
  return data;
}

function animateCount(el, target) {
  if (!el) return;
  if (reducedMotion()) { el.textContent = fmtNum(target); return; }
  const dur = 1400, start = performance.now();
  const from = parseInt(String(el.textContent).replace(/[^\d]/g, '')) || 0;
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmtNum(Math.round(from + (target - from) * e));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── 1. THEME ─────────────────────────────────────────────────────────── */
const Theme = (() => {
  function apply(mode) {
    document.documentElement.classList.toggle('light', mode === 'light');
    try { localStorage.setItem('theme', mode); } catch (e) {}
  }
  function toggle() {
    apply(document.documentElement.classList.contains('light') ? 'dark' : 'light');
  }
  function init() {
    try { if (localStorage.getItem('theme') === 'light') apply('light'); } catch (e) {}
    $('theme-toggle')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggle(); });
  }
  return { init, toggle, apply };
})();

/* ── 2. BOOT OVERLAY ──────────────────────────────────────────────────── */
const Boot = (() => {
  const el = () => $('boot');
  const LINES = [
    'init /system/bin/reze …',
    'mount super partition …',
    'verify boot image …',
    'inject magisk modules …',
    'start signal …',
  ];
  let finished = false;

  function done() {
    if (finished) return;
    finished = true;
    const b = el();
    if (!b) return;
    b.classList.add('done');
    b.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.classList.add('booted');
    setTimeout(() => { b.style.display = 'none'; }, 560);
    Reveal.refresh();
  }

  function init() {
    const b = el();
    if (!b) return;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    b.addEventListener('click', done);
    const log = $('boot-log');
    let i = 0;
    const tick = setInterval(() => {
      if (!log) { clearInterval(tick); return; }
      if (i < LINES.length) {
        log.innerHTML = '<span class="ok">[ok]</span> ' + esc(LINES[i]);
        i++;
      } else {
        clearInterval(tick);
        setTimeout(done, 260);
      }
    }, 230);
    // hard cap: never hold the page longer than 2.6s
    setTimeout(done, 2600);
  }
  return { init };
})();

/* ── 3. REVEAL ON SCROLL ──────────────────────────────────────────────── */
const Reveal = (() => {
  let io = null;
  function init() {
    if (reducedMotion()) { $$('.rv').forEach(el => el.classList.add('in')); return; }
    io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
    $$('.rv').forEach(el => io.observe(el));
  }
  function refresh() {
    $$('.rv:not(.in)').forEach(el => io && io.observe(el));
  }
  return { init, refresh };
})();

/* ── 4. NAV / SCROLL SPY ──────────────────────────────────────────────── */
const Nav = (() => {
  const SECTIONS = ['hero', 'about', 'work', 'music', 'anime', 'play', 'ask'];
  function init() {
    const secs = SECTIONS.map(id => document.getElementById(id)).filter(Boolean);
    const links = $$('[data-nav]');
    let ticking = false;
    function update() {
      ticking = false;
      const pos = window.scrollY + window.innerHeight * 0.35;
      let current = secs[0]?.id || 'hero';
      for (const s of secs) if (s.offsetTop <= pos) current = s.id;
      links.forEach(a => a.classList.toggle('active', a.dataset.nav === current));
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }
  return { init };
})();

/* ── 5. HERO CLOCK ────────────────────────────────────────────────────── */
const Clock = (() => {
  function init() {
    const el = $('hero-clock');
    if (!el) return;
    const tick = () => {
      try {
        el.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + ' IST';
      } catch (e) { el.textContent = new Date().toLocaleTimeString(); }
    };
    tick(); setInterval(tick, 1000);
  }
  return { init };
})();

/* ── 6. PHOTO STRIP (about) ───────────────────────────────────────────── */
const Photos = (() => {
  const IMAGES = Array.from({ length: 10 }, (_, i) => `assets/img/reze-${String(i + 1).padStart(2, '0')}.jpg`);
  let idx = 0, timer = null;
  function pad(n) { return String(n + 1).padStart(2, '0'); }
  function render(animate = true) {
    const img = $('photo-img'), count = $('photo-count'), dots = $('photo-dots');
    if (!img) return;
    const show = () => {
      img.src = IMAGES[idx];
      img.classList.remove('swap');
    };
    if (animate && !reducedMotion()) {
      img.classList.add('swap');
      setTimeout(show, 180);
    } else show();
    if (count) count.textContent = `${pad(idx)} / ${String(IMAGES.length).padStart(2, '0')}`;
    if (dots) $$('button', dots).forEach((d, i) => d.classList.toggle('on', i === idx));
  }
  function next() { idx = (idx + 1) % IMAGES.length; render(); }
  function prev() { idx = (idx - 1 + IMAGES.length) % IMAGES.length; render(); }
  function init() {
    if (!$('photo-frame')) return;
    const dots = $('photo-dots');
    if (dots) {
      dots.innerHTML = IMAGES.map((_, i) => `<button type="button" aria-label="Photo ${i + 1}"></button>`).join('');
      $$('button', dots).forEach((d, i) => d.addEventListener('click', () => { idx = i; render(); restart(); }));
    }
    $('photo-next')?.addEventListener('click', () => { next(); restart(); });
    $('photo-prev')?.addEventListener('click', () => { prev(); restart(); });
    render(false);
    restart();
  }
  function restart() {
    clearInterval(timer);
    if (!reducedMotion()) timer = setInterval(next, 7000);
  }
  return { init };
})();

/* ── 7. SKILLS ────────────────────────────────────────────────────────── */
const Skills = (() => {
  const skills = [
    { icon:'🤖', name:'Android Root & Bootloader', sub:'ADB, Fastboot, unlocking, partition management', cat:'CORE' },
    { icon:'🧩', name:'Magisk Module Development', sub:'Module scripting, props, overlays, hooks', cat:'ROOT' },
    { icon:'🔑', name:'KernelSU Integration', sub:'Kernel-level root, module API, overlayfs', cat:'ROOT' },
    { icon:'💿', name:'Custom ROM Development', sub:'AOSP, LineageOS, build system, device trees', cat:'ROM' },
    { icon:'🌙', name:'ROM Porting & Adaptation', sub:'Device bring-up, HAL fixes, vendor blobs', cat:'ROM' },
    { icon:'⚙️', name:'ADB / Fastboot', sub:'Debugging, flashing, sideloading, scripting', cat:'TOOLS' },
    { icon:'🐧', name:'Linux & Bash Scripting', sub:'Shell scripts, system automation, cron, sed/awk', cat:'TOOLS' },
    { icon:'🛡️', name:'Android Security & SELinux', sub:'Policy writing, permissive modes, audit2allow', cat:'CORE' },
    { icon:'💾', name:'Partition & Storage Management', sub:'Super, vendor, system, userdata, recovery', cat:'CORE' },
    { icon:'📦', name:'Open Source Development', sub:'GitHub, git, versioning, CI/CD basics', cat:'DEV' },
    { icon:'🔧', name:'Kernel Customisation', sub:'Config tuning, governors, I/O schedulers, patches', cat:'ROM' },
    { icon:'📱', name:'Device Tree Maintenance', sub:'BoardConfig, overlays, fstab, init scripts', cat:'ROM' },
  ];
  let filter = 'ALL';
  function render(animate = true) {
    const list = $('skill-list');
    if (!list) return;
    const items = filter === 'ALL' ? skills : skills.filter(s => s.cat === filter);
    list.innerHTML = items.map(s => `
      <div class="rowitem">
        <div class="row-art" style="font-size:17px">${s.icon}</div>
        <div class="row-info">
          <div class="row-name">${esc(s.name)}</div>
          <div class="row-sub">${esc(s.sub)}</div>
        </div>
        <span class="panel-badge" style="margin-left:8px">${s.cat}</span>
      </div>`).join('');
    if (animate) list.classList.remove('swap-anim'), list.classList.add('swap-anim');
    const count = $('skill-count');
    if (count) count.textContent = items.length + ' skill' + (items.length !== 1 ? 's' : '') + (filter !== 'ALL' ? ' · ' + filter : '');
  }
  function init() {
    const tabs = $('skill-tabs');
    if (!tabs) return;
    $$('.tab', tabs).forEach(btn => btn.addEventListener('click', () => {
      $$('.tab', tabs).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      render();
    }));
    render(false);
  }
  return { init };
})();

/* ── 8. GITHUB PROJECTS ───────────────────────────────────────────────── */
const Repos = (() => {
  const langColors = {
    JavaScript:'#f7df1e', TypeScript:'#3178c6', Python:'#3572A5',
    Shell:'#89e051', Java:'#b07219', Kotlin:'#A97BFF',
    C:'#8f8f8f', 'C++':'#f34b7d', HTML:'#e34c26', CSS:'#563d7c',
    Go:'#00ADD8', Rust:'#dea584', Ruby:'#701516',
  };
  const langColor = (l) => langColors[l] || '#8b8b8b';
  let all = [], filter = 'all', booted = false;

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function render() {
    const grid = $('repo-grid');
    if (!grid) return;
    const search = ($('repo-search')?.value || '').toLowerCase();
    let list = all;
    if (filter !== 'all') list = list.filter(r => filter === 'C' ? (r.language === 'C' || r.language === 'C++') : r.language === filter);
    if (search) list = list.filter(r => (r.name || '').toLowerCase().includes(search) || (r.description || '').toLowerCase().includes(search));
    if (!list.length) {
      grid.innerHTML = '<div class="repo-empty">No repositories found matching your filter.</div>';
      return;
    }
    grid.innerHTML = list.map(repo => `
      <div class="repo-card">
        <div class="repo-top">
          <div class="repo-lang">${repo.language ? `<span class="lang-dot" style="background:${langColor(repo.language)}"></span>${esc(repo.language)}` : '<span style="color:var(--text-faint)">—</span>'}</div>
          <div class="repo-stars">★ ${fmtNum(repo.stargazers_count)}</div>
        </div>
        <div class="repo-name"><a href="${esc(repo.html_url)}" target="_blank" rel="noopener">${esc(repo.name)}</a></div>
        <div class="repo-desc">${esc(repo.description || 'No description provided.')}</div>
        <div class="repo-meta">Updated ${formatDate(repo.updated_at)}</div>
        <a class="repo-link" href="${esc(repo.html_url)}" target="_blank" rel="noopener">View on GitHub →</a>
      </div>`).join('');
  }

  function renderTabs() {
    const tabs = $('repo-tabs');
    if (!tabs) return;
    const langs = [...new Set(all.map(r => r.language).filter(Boolean))];
    const btns = [{ k: 'all', l: 'All' }, { k: 'C', l: 'C/C++' }, ...langs.filter(l => l !== 'C' && l !== 'C++').map(l => ({ k: l, l }))];
    tabs.innerHTML = btns.map(b => `<button class="tab${filter === b.k ? ' active' : ''}" data-lang="${esc(b.k)}" type="button">${esc(b.l)}</button>`).join('');
    $$('.tab', tabs).forEach(btn => btn.addEventListener('click', () => {
      filter = btn.dataset.lang;
      $$('.tab', tabs).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    }));
  }

  async function load() {
    if (booted) return;
    booted = true;
    try {
      const res = await fetch('https://api.github.com/users/4nx3b/repos?per_page=100&sort=updated', { headers: { Accept: 'application/vnd.github.v3+json' } });
      if (!res.ok) throw Object.assign(new Error('HTTP ' + res.status), { status: res.status });
      const data = await res.json();
      all = (Array.isArray(data) ? data : []).filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count);
      animateCount($('stat-repos'), all.length);
      renderTabs();
      render();
    } catch (e) {
      console.warn('GitHub repos failed', e);
      const grid = $('repo-grid');
      if (grid) grid.innerHTML = `<div class="repo-empty">${e.status === 403 ? 'GitHub rate limit reached. Try again later.' : 'Could not load repositories right now.'}</div>`;
    }
  }

  function init() {
    $('repo-search')?.addEventListener('input', render);
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { load(); io.disconnect(); } });
    }, { rootMargin: '200px' });
    const work = $('work');
    if (work) io.observe(work);
  }
  return { init };
})();

/* ── 9. LAST.FM ───────────────────────────────────────────────────────── */
const LastFM = (() => {
  const KEY = '1a7e0e8fa3e3ade425800015da9be5ae';
  const USER = 'zensxin';
  const periodLabels = { '1month': 'This Month', '3month': '3 Months', '6month': '6 Months', '12month': 'This Year', 'overall': 'All Time' };
  let period = '1month';
  const DEFAULT_ART = '2a96cbd8b46e442fc41c2b86b821562f'; // last.fm placeholder art id

  const artHtml = (url, fallback = '🎵') => url && !url.includes(DEFAULT_ART) ? `<img src="${esc(url)}" alt="" loading="lazy"/>` : fallback;

  function trackRow(t, i, opts = {}) {
    const art = opts.recent ? t.image?.[1]?.['#text'] : t.image?.[1]?.['#text'];
    const name = opts.recent ? (t.name || '') : (t.name || '');
    const artist = opts.recent ? (t.artist?.['#text'] || t.artist?.name || '') : (t.artist?.name || '');
    const isNow = opts.recent && t['@attr']?.nowplaying === 'true';
    const dateStr = opts.recent && !isNow ? (t.date?.['#text'] || '') : '';
    const end = opts.recent
      ? `<div class="row-end">${isNow ? '<span class="now-badge">NOW</span>' : esc(dateStr)}</div>`
      : `<div class="row-end">${fmtNum(t.playcount)} plays</div>`;
    return `
      <div class="rowitem">
        <div class="row-rank">${String(i + 1).padStart(2, '0')}</div>
        <div class="row-art">${artHtml(art)}</div>
        <div class="row-info">
          <div class="row-name">${esc(name)}</div>
          <div class="row-sub">${esc(artist)}</div>
        </div>
        ${end}
      </div>`;
  }

  function artistRow(a, i) {
    return `
      <div class="rowitem">
        <div class="row-rank">${String(i + 1).padStart(2, '0')}</div>
        <div class="row-art">${artHtml(a.image?.[1]?.['#text'], '♪')}</div>
        <div class="row-info">
          <div class="row-name">${esc(a.name)}</div>
        </div>
        <div class="row-end">${fmtNum(a.playcount)} plays</div>
      </div>`;
  }

  async function load(p) {
    period = p || period;
    const base = `https://ws.audioscrobbler.com/2.0/?api_key=${KEY}&user=${USER}&format=json`;
    $$('#lf-tabs .tab').forEach(b => b.classList.toggle('active', b.dataset.period === period));
    const lbl = $('lf-period-label');
    if (lbl) lbl.textContent = periodLabels[period] || period;

    const [userInfo, topTracks, topArtists, recentTracks] = await Promise.allSettled([
      fetch(`${base}&method=user.getinfo`).then(r => r.json()),
      fetch(`${base}&method=user.gettoptracks&period=${period}&limit=10`).then(r => r.json()),
      fetch(`${base}&method=user.gettopartists&period=${period}&limit=8`).then(r => r.json()),
      fetch(`${base}&method=user.getrecenttracks&limit=12`).then(r => r.json()),
    ]);

    // profile + stats
    if (userInfo.status === 'fulfilled' && userInfo.value?.user) {
      const u = userInfo.value.user;
      if (u.playcount) animateCount($('lf-scrobbles'), parseInt(u.playcount));
      if (u.artist_count) animateCount($('lf-artists'), parseInt(u.artist_count));
      if (u.track_count) animateCount($('lf-tracks'), parseInt(u.track_count));
      if (u.album_count) animateCount($('lf-albums'), parseInt(u.album_count));
      animateCount($('stat-scrobbles'), parseInt(u.playcount) || 0);
      const img = u.image?.[3]?.['#text'] || u.image?.[2]?.['#text'];
      const av = $('lf-avatar'), fb = $('lf-avatar-fb');
      if (img && av) { av.src = img; av.style.display = 'block'; if (fb) fb.style.display = 'none'; }
    } else {
      animateCount($('lf-scrobbles'), 14289);
      animateCount($('lf-artists'), 482);
      animateCount($('lf-tracks'), 1893);
      animateCount($('lf-albums'), 312);
    }

    const tt = $('lf-top-tracks');
    if (tt) {
      const tracks = topTracks.status === 'fulfilled' ? (topTracks.value?.toptracks?.track || []) : [];
      tt.innerHTML = tracks.length ? tracks.map(trackRow).join('') : '<div class="loading-row">No tracks found.</div>';
    }
    const ta = $('lf-top-artists');
    if (ta) {
      const artists = topArtists.status === 'fulfilled' ? (topArtists.value?.topartists?.artist || []) : [];
      ta.innerHTML = artists.length ? artists.map(artistRow).join('') : '<div class="loading-row">No artists found.</div>';
    }
    const rc = $('lf-recent');
    if (rc) {
      const tracks = recentTracks.status === 'fulfilled' ? (recentTracks.value?.recenttracks?.track || []) : [];
      rc.innerHTML = tracks.length
        ? tracks.slice(0, 10).map((t, i) => trackRow(t, i, { recent: true })).join('')
        : '<div class="loading-row">No recent tracks.</div>';
    }
  }

  function init() {
    const tabs = $('lf-tabs');
    if (!tabs) return;
    $$('.tab', tabs).forEach(btn => btn.addEventListener('click', () => load(btn.dataset.period)));
    setTimeout(() => load('1month'), 400);
  }
  return { init };
})();

/* ── 10. SITE MUSIC PLAYER ────────────────────────────────────────────── */
const Music = (() => {
  const SRC = 'https://raw.githubusercontent.com/4nx3b/4nx3b/main/09.%20in%20the%20pool.mp3';
  let audio = null;

  function el() {
    if (audio) return audio;
    audio = new Audio();
    audio.id = 'site-music-audio';
    audio.preload = 'metadata';
    audio.loop = true;
    audio.playsInline = true;
    audio.crossOrigin = 'anonymous';
    audio.volume = 0.85;
    audio.src = SRC;
    ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata', 'volumechange'].forEach(ev => audio.addEventListener(ev, sync));
    return audio;
  }

  function sync() {
    const a = el();
    const playing = !a.paused && !a.ended;
    document.body.classList.toggle('music-playing', playing);
    const fill = $('player-fill');
    if (fill && a.duration) fill.style.width = ((a.currentTime / a.duration) * 100) + '%';
    const curr = $('player-curr'), dur = $('player-dur');
    if (curr) curr.textContent = fmtTime(a.currentTime || 0);
    if (dur) dur.textContent = fmtTime(a.duration || 0);
    const vol = $('player-vol'), volVal = $('player-vol-val');
    const pct = Math.round((a.volume ?? 0.85) * 100);
    if (vol && document.activeElement !== vol) vol.value = String(pct);
    if (volVal) volVal.textContent = pct + '%';
  }

  async function play() {
    const a = el();
    a.muted = false;
    if (!a.volume) a.volume = 0.85;
    try { await a.play(); } catch (e) { /* autoplay policies */ }
    sync();
  }
  function pause() { const a = el(); try { a.pause(); } catch (e) {} sync(); }
  async function toggle() { (el().paused) ? await play() : pause(); }

  function init() {
    el();
    sync();
    $('player-toggle')?.addEventListener('click', toggle);
    $('dock-music')?.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
    $('player-restart')?.addEventListener('click', () => { const a = el(); try { a.currentTime = 0; } catch (e) {} sync(); });
    $('player-vol')?.addEventListener('input', (e) => {
      const a = el();
      a.volume = Math.max(0, Math.min(100, Number(e.target.value || 85))) / 100;
      a.muted = false;
      sync();
    });
    const bar = $('player-progress');
    bar?.addEventListener('click', (e) => {
      const a = el();
      if (!a.duration || isNaN(a.duration)) return;
      const rect = bar.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      a.currentTime = pos * a.duration;
      sync();
    });
  }
  return { init, toggle, play };
})();

/* ── 11. ANILIST ──────────────────────────────────────────────────────── */
const AniList = (() => {
  let cache = [], filter = 'ALL', page = 1;
  const PER_PAGE = 15;

  function render() {
    const list = $('ani-list');
    if (!list) return;
    let items = cache;
    if (filter !== 'ALL') items = items.filter(x => x.status === filter);
    const totalPages = Math.ceil(items.length / PER_PAGE) || 1;
    page = Math.min(Math.max(1, page), totalPages);
    const start = (page - 1) * PER_PAGE;
    const pageItems = items.slice(start, start + PER_PAGE);

    list.innerHTML = pageItems.length ? pageItems.map(a => `
      <a class="rowitem" href="https://anilist.co/anime/${a.media.id}" target="_blank" rel="noopener">
        <div class="ani-cover"><img src="${esc(a.media.coverImage.large)}" loading="lazy" alt=""></div>
        <div class="row-info">
          <div class="row-name">${esc(a.media.title.romaji)}</div>
          <div class="row-sub">${a.progress || 0}/${a.media.episodes || '?'} episodes · ${esc(a.status.toLowerCase())}</div>
        </div>
        <span class="ani-score">★ ${a.score || 0}</span>
      </a>`).join('') : '<div class="loading-row">Nothing here yet.</div>';

    const pag = $('ani-pager');
    if (pag) {
      if (totalPages <= 1) { pag.innerHTML = ''; }
      else {
        let btns = `<button class="page-btn" ${page === 1 ? 'disabled' : ''} data-p="${page - 1}" type="button" aria-label="Previous page">‹</button>`;
        const range = 2;
        for (let p = 1; p <= totalPages; p++) {
          if (p === 1 || p === totalPages || (p >= page - range && p <= page + range)) {
            btns += `<button class="page-btn${p === page ? ' active' : ''}" data-p="${p}" type="button">${p}</button>`;
          } else if (p === page - range - 1 || p === page + range + 1) {
            btns += `<span class="page-info">…</span>`;
          }
        }
        btns += `<button class="page-btn" ${page === totalPages ? 'disabled' : ''} data-p="${page + 1}" type="button" aria-label="Next page">›</button>`;
        pag.innerHTML = btns;
        $$('.page-btn', pag).forEach(b => b.addEventListener('click', () => { page = Number(b.dataset.p); render(); }));
      }
    }
  }

  async function load() {
    const query = `query{
      User(name:"zensxin"){
        avatar{large}
        statistics{anime{count episodesWatched minutesWatched}}
      }
      MediaListCollection(userName:"zensxin",type:ANIME){
        lists{
          status
          entries{
            status progress score
            media{
              id
              episodes
              title{romaji}
              coverImage{large}
            }
          }
        }
      }
    }`;
    try {
      const r = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const d = await r.json();
      if (d.data?.User?.avatar?.large) { const a = $('ani-avatar'); if (a) a.src = d.data.User.avatar.large; }
      cache = [];
      d.data.MediaListCollection.lists.forEach(group => {
        group.entries.forEach(entry => cache.push({ ...entry, status: group.status }));
      });
      const st = d.data.User.statistics.anime;
      const stats = $('ani-stats');
      if (stats) stats.textContent = `${fmtNum(st.count)} anime · ${fmtNum(st.episodesWatched)} eps · ${fmtNum(Math.round(st.minutesWatched / 60))} hrs`;
      animateCount($('stat-anime'), st.count);
      render();
    } catch (e) {
      console.warn('AniList failed', e);
      const list = $('ani-list');
      if (list) list.innerHTML = '<div class="loading-row">Could not load AniList right now.</div>';
      const stats = $('ani-stats');
      if (stats) stats.textContent = 'anilist.co/user/zensxin';
    }
  }

  function init() {
    const tabs = $('ani-tabs');
    if (!tabs) return;
    $$('.tab', tabs).forEach(btn => btn.addEventListener('click', () => {
      $$('.tab', tabs).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filter = btn.dataset.filter;
      page = 1;
      render();
    }));
    setTimeout(load, 600);
  }
  return { init };
})();

/* ── 12. NOW WIDGETS (quotes · time) ──────────────────────────────────── */
const Widgets = (() => {
  const QUOTES = [
    ['Want to run away with me?', 'Reze'],
    ['I also never went to school.', 'Reze'],
    ['Even if my heart is fake, my feelings are real.', 'Reze'],
    ['Maybe a normal life was the real dream.', 'Reze Arc'],
    ['Spring will be here soon.', 'Your Lie in April'],
    ['Was I able to live inside someone\u2019s heart?', 'Your Lie in April'],
  ];
  let qi = 0;

  function setQuote() {
    const q = QUOTES[qi++ % QUOTES.length];
    const t = $('quote-text'), a = $('quote-author');
    if (!t || !a) return;
    t.classList.remove('q-anim'); a.classList.remove('q-anim');
    void t.offsetWidth;
    t.textContent = '\u201C' + q[0] + '\u201D';
    a.textContent = '— ' + q[1];
    t.classList.add('q-anim'); a.classList.add('q-anim');
  }

  function tickTime() {
    const now = new Date();
    const opts = { hour: 'numeric', minute: '2-digit', hour12: true };
    let local = '';
    try { local = now.toLocaleTimeString('en-US', { ...opts, timeZone: 'Asia/Kolkata' }); } catch (e) { local = now.toLocaleTimeString('en-US', opts); }
    const your = now.toLocaleTimeString('en-US', opts);
    const l = $('time-ist'), y = $('time-you'), note = $('time-note');
    if (l) l.textContent = local;
    if (y) y.textContent = your;
    if (note) note.textContent = local === your ? 'Same timezone — we are synced.' : 'Time zones apart, same signal.';
  }

  function init() {
    setQuote();
    $('quote-swap')?.addEventListener('click', setQuote);
    tickTime();
    setInterval(tickTime, 1000);
  }
  return { init };
})();

/* ── 13. SOCIAL LINKS ─────────────────────────────────────────────────── */
const Socials = (() => {
  const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" ${extra} fill="currentColor" aria-hidden="true">${d}</svg>`;
  const LINKS = [
    { name: 'GitHub', url: 'https://github.com/4nx3b', icon: svg('<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>') },
    { name: 'Telegram', url: 'https://t.me/therealreze', icon: svg('<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>') },
    { name: 'Instagram', url: 'https://instagram.com/4nx3b', icon: svg('<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>') },
    { name: 'Discord', url: 'https://discord.com/users/1128166734604537949', icon: svg('<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>') },
    { name: 'YouTube Music', url: 'https://music.youtube.com/channel/UCzCt_fdj0vtv6U3bpVrHNzA', icon: svg('<path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/>') },
    { name: 'Last.fm', url: 'https://www.last.fm/user/zensxin', icon: svg('<path d="M10.584 17.21l-.88-2.392s-1.43 1.594-3.573 1.594c-1.897 0-3.244-1.648-3.244-4.288 0-3.378 1.704-4.59 3.382-4.59 2.42 0 3.188 1.57 3.848 3.574l.879 2.75c.879 2.64 2.53 4.752 7.293 4.752 3.409 0 5.722-1.043 5.722-3.793 0-2.22-1.265-3.37-3.63-3.924l-1.76-.384c-1.21-.274-1.565-.769-1.565-1.593 0-.935.741-1.483 1.95-1.483 1.32 0 2.034.494 2.144 1.676l2.75-.33C24.736 6.64 23.035 5.5 20.285 5.5c-3.024 0-4.838 1.374-4.838 3.737 0 1.956 1.1 3.2 3.847 3.848l1.87.439c1.374.303 1.814.88 1.814 1.758 0 1.07-.99 1.51-2.915 1.51-2.75 0-3.93-1.428-4.588-3.38l-.88-2.749c-1.154-3.578-3.023-4.883-6.707-4.883C3.133 5.78 0 7.843 0 12.04c0 4.07 2.42 6.18 5.995 6.18 3.08 0 4.59-1.012 4.59-1.012z"/>') },
    { name: 'AniList', url: 'https://anilist.co/user/zensxin/', icon: svg('<path d="M6.361 2.943 0 21.056h4.942l1.077-3.133H11.4l1.077 3.133H17.5L11.134 2.943zM7.543 14.075l1.801-5.515 1.8 5.515zM22.689 17.502v-14.56h-4.399v16.02c0 1.117.807 2.038 1.909 2.038h4.712v-3.498z"/>') },
    { name: 'Snapchat', url: 'https://www.snapchat.com/@zensxin', icon: svg('<path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.12.068.281.134.462.134.896 0 1.77-.587 1.77-1.36 0-.754-.596-1.14-1.046-1.14-.08 0-.157.01-.229.03-.037-.1-.11-.23-.233-.328.077-.163.145-.367.145-.563 0-.32-.196-.53-.435-.53-.117 0-.232.04-.328.113a1.267 1.267 0 0 0-.328-.73c.065-.118.103-.252.103-.394 0-.447-.342-.81-.762-.81-.22 0-.426.1-.574.262-.09-.064-.193-.11-.304-.135a.75.75 0 0 0-.155-.587.772.772 0 0 0-.583-.268c-.327 0-.596.217-.688.514a1.08 1.08 0 0 0-.457-.1.909.909 0 0 0-.76.418c-.173-.11-.375-.172-.59-.172-.623 0-1.127.502-1.127 1.125 0 .07.007.138.02.205a1.7 1.7 0 0 0-.394.044c.007-.097.01-.196.01-.296C12.88 2.097 11.374.793 9.81.793c-.97 0-1.818.464-2.378 1.185a3.55 3.55 0 0 0-.665-.064c-1.49 0-2.875 1.07-3.326 2.628C2.92 5.57 2.93 6.89 3.1 7.984c-.43.023-.84.177-1.183.484-.317.286-.496.677-.496 1.1 0 .858.733 1.544 1.636 1.544.234 0 .457-.05.66-.136l-.005.09c0 .35-.023.707-.062 1.055-.213 1.938-1.012 3.615-2.264 4.831-.395.378-.628.845-.628 1.35 0 .56.27 1.048.688 1.35.506.366 1.252.598 2.11.672.287.023.578.044.872.053.43.49.94.956 1.563 1.36 1.127.727 2.464 1.126 3.876 1.126 1.435 0 2.793-.413 3.938-1.166a7.72 7.72 0 0 0 1.541-1.36 11.84 11.84 0 0 0 .893-.06c.88-.074 1.644-.309 2.154-.68.424-.307.698-.8.698-1.363 0-.504-.234-.97-.63-1.346-1.258-1.21-2.06-2.885-2.273-4.823a15.17 15.17 0 0 1-.062-1.057l-.004-.086c.204.085.426.134.659.134.9 0 1.636-.687 1.636-1.544 0-.423-.178-.814-.496-1.1a2.195 2.195 0 0 0-1.18-.48c.17-1.094.18-2.414-.341-3.437C16.553 1.257 15.196.793 14.226.793h-.014"/>') },
    { name: 'Pinterest', url: 'https://www.pinterest.com/asaxxhiii', icon: svg('<path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>') },
    { name: 'Facebook', url: 'https://facebook.com/4nx3b', icon: svg('<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>') },
    { name: 'Trakt', url: 'https://app.trakt.tv/profile/therealreze', icon: svg('<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM5.563 5.09L12 11.52l2.557-2.556 1.44 1.44L12 14.393 4.122 6.53zm12.428 13.83l-6.555-6.56L9.128 14l-1.44-1.44 2.75-2.75 8 8.002z"/>') },
    { name: 'Email', url: 'mailto:asaxxhiii@gmail.com', icon: svg('<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>') },
  ];

  function init() {
    const grid = $('social-grid');
    if (!grid) return;
    grid.innerHTML = LINKS.map(l => `
      <a class="social-link" href="${esc(l.url)}" ${l.url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} title="${esc(l.name)}">
        ${l.icon}<span>${esc(l.name)}</span>
      </a>`).join('');
  }
  return { init };
})();

/* ── 14. PLAYGROUND GAMES ─────────────────────────────────────────────── */
const Games = (() => {
  const GAMES = [
    { id: 'snake',    icon: '♞', name: 'Snake',         desc: 'Classic game. High chance of self-sabotage.' },
    { id: 'pong',     icon: '◉', name: 'Ping Pong',     desc: 'You vs an AI paddle. First to 5 wins.' },
    { id: 'quiz',     icon: '▱', name: 'Roast Quiz',    desc: 'A personality test but every answer is a personal attack.' },
    { id: 'flappy',   icon: '⌁', name: 'Flappy',        desc: 'Infuriating physics. Avoid the pipes.' },
    { id: 'mines',    icon: '⚑', name: 'Minesweeper',   desc: 'Classic logic. Avoid the mines.' },
    { id: 'reaction', icon: '◌', name: 'Reaction Test', desc: 'Click when it turns green.' },
    { id: 'dodge',    icon: '⌖', name: 'Dodge',         desc: 'Survive against angry geometry.' },
  ];
  let cleanup = null;
  const modal = () => $('game-modal');
  const root = () => $('game-body');

  function over(msg, retry) {
    const st = root().querySelector('.game-status');
    if (st) st.textContent = msg;
    setTimeout(() => {
      if (!root().querySelector('.game-retry')) {
        const b = document.createElement('button');
        b.className = 'game-retry'; b.type = 'button'; b.textContent = 'Try again';
        b.onclick = () => retry();
        root().appendChild(b);
      }
    }, 800);
  }

  function canvas(w, h, status = '') {
    root().innerHTML = `<canvas class="game-canvas" width="${w}" height="${h}"></canvas><div class="game-status">${status}</div>`;
    const cv = root().querySelector('canvas');
    return [cv, cv.getContext('2d'), root().querySelector('.game-status')];
  }

  /* — snake — */
  function snake() {
    const [cv, ctx, st] = canvas(320, 320, 'Choose a direction to start.');
    let timer, started = false, alive = true, score = 0, n = 16, cell = 20;
    let snk = [{x:8,y:8}], dir = {x:0,y:0}, food = {x:4,y:5};
    root().insertAdjacentHTML('beforeend', `<div class="game-ctl"><span></span><button data-d="up">↑</button><span></span><button data-d="left">←</button><button data-d="down">↓</button><button data-d="right">→</button></div>`);
    function draw() {
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-2').trim() || '#0d0e11';
      ctx.fillRect(0,0,320,320);
      ctx.fillStyle = '#f2f3f0';
      snk.forEach(p => ctx.fillRect(p.x*cell+1, p.y*cell+1, cell-2, cell-2));
      ctx.fillStyle = '#c9f73a';
      ctx.fillRect(food.x*cell+2, food.y*cell+2, cell-4, cell-4);
    }
    function set(d) {
      if (!alive) return;
      const nd = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}[d];
      if (!nd) return;
      if (started && nd.x === -dir.x && nd.y === -dir.y) return;
      dir = nd;
      if (!started) { started = true; tick(); }
    }
    function tick() {
      const h = {x: snk[0].x + dir.x, y: snk[0].y + dir.y};
      if (h.x < 0 || h.y < 0 || h.x >= n || h.y >= n || snk.some(p => p.x === h.x && p.y === h.y)) {
        alive = false; draw(); return over('Game over · score ' + score, snake);
      }
      snk.unshift(h);
      if (h.x === food.x && h.y === food.y) {
        score++;
        do { food = {x: Math.floor(Math.random()*n), y: Math.floor(Math.random()*n)}; } while (snk.some(p => p.x === food.x && p.y === food.y));
      } else snk.pop();
      st.textContent = 'Score ' + score;
      draw();
      timer = setTimeout(tick, 145);
    }
    $$('[data-d]', root()).forEach(b => b.addEventListener('click', () => set(b.dataset.d)));
    const key = (e) => {
      const map = {ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right'};
      if (map[e.key]) { e.preventDefault(); set(map[e.key]); }
    };
    document.addEventListener('keydown', key);
    cleanup = () => { clearTimeout(timer); document.removeEventListener('keydown', key); };
    draw();
  }

  /* — pong — */
  function pong() {
    const [cv, ctx, st] = canvas(360, 240, 'Move on canvas to serve.');
    let raf, started = false, py = 90, ay = 90, bx = 180, by = 120, vx = 3, vy = 2, ps = 0, as = 0;
    function move(e) {
      const r = cv.getBoundingClientRect();
      const cy = (e.touches ? e.touches[0].clientY : e.clientY);
      py = Math.max(0, Math.min(180, (cy - r.top) / r.height * 240 - 30));
      if (!started) { started = true; loop(); }
    }
    cv.addEventListener('pointerdown', move);
    cv.addEventListener('pointermove', (e) => { if (started) move(e); });
    function loop() {
      ay += (by - ay - 30) * .055; bx += vx; by += vy;
      if (by < 0 || by > 240) vy *= -1;
      if (bx < 18 && by > py && by < py + 60) vx = Math.abs(vx) + .12;
      if (bx > 342 && by > ay && by < ay + 60) vx = -Math.abs(vx) - .12;
      if (bx < 0) { as++; bx = 180; vx = 3; }
      if (bx > 360) { ps++; bx = 180; vx = -3; }
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-2').trim() || '#0d0e11';
      ctx.fillRect(0,0,360,240);
      ctx.fillStyle = '#f2f3f0';
      ctx.fillRect(10, py, 8, 60); ctx.fillRect(342, ay, 8, 60);
      ctx.beginPath(); ctx.arc(bx, by, 7, 0, 7); ctx.fill();
      st.textContent = `You ${ps} · AI ${as}`;
      if (ps < 5 && as < 5) raf = requestAnimationFrame(loop);
      else over(ps > as ? 'You win' : 'AI wins', pong);
    }
    cleanup = () => cancelAnimationFrame(raf);
  }

  /* — quiz — */
  function quiz() {
    const qs = [
      ['Pick a debugging style.', ['Logs everywhere', 'Read docs', 'Blame vendor'], ['Chaotic but effective.', 'Rare discipline.', 'Valid, sadly.']],
      ['Your debugging style?', ['Scientific', 'Panic console logs', 'Blame vendor blobs'], ['Responsible. Suspicious.', 'A classic gremlin.', 'Correct, honestly.']],
      ['Pick a superpower.', ['Fastboot never fails', 'Infinite battery', 'No merge conflicts'], ['Impossible dream.', 'Rooted monk energy.', 'Too powerful.']],
    ];
    let i = 0;
    const q = qs[i % qs.length];
    root().innerHTML = `<div class="game-status">${esc(q[0])}</div><div class="quiz-opts">${q[1].map((o, k) => `<button type="button">${esc(o)}</button>`).join('')}</div>`;
    $$('.quiz-opts button', root()).forEach((b, k) => b.addEventListener('click', () => {
      root().querySelector('.game-status').textContent = q[2][k];
      setTimeout(() => { i++; quiz(); }, 1400);
    }));
    cleanup = null;
  }

  /* — flappy — */
  function flappy() {
    const [cv, ctx, st] = canvas(320, 420, 'Tap canvas to start/flap.');
    let raf, started = false, alive = true, y = 210, v = 0, pipes = [], t = 0, score = 0;
    function flap() { if (!alive) return; if (!started) { started = true; loop(); } v = -7; }
    cv.addEventListener('pointerdown', flap);
    function loop() {
      t++; v += .45; y += v;
      if (t % 88 === 0) { const top = 35 + Math.random() * 210; pipes.push({x:320, top, gap:122, sc:false}); }
      pipes.forEach(p => p.x -= 2.35);
      pipes = pipes.filter(p => p.x > -50);
      for (const p of pipes) {
        if (52 > p.x && 52 < p.x + 42 && (y < p.top || y > p.top + p.gap)) alive = false;
        if (!p.sc && p.x < 52) { score++; p.sc = true; }
      }
      if (y < 0 || y > 420) alive = false;
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-2').trim() || '#0d0e11';
      ctx.fillRect(0,0,320,420);
      ctx.fillStyle = '#f2f3f0';
      ctx.beginPath(); ctx.arc(52, y, 12, 0, 7); ctx.fill();
      ctx.fillStyle = '#c9f73a';
      pipes.forEach(p => { ctx.fillRect(p.x, 0, 42, p.top); ctx.fillRect(p.x, p.top + p.gap, 42, 420); });
      st.textContent = 'Score ' + score;
      if (alive) raf = requestAnimationFrame(loop);
      else over('Game over · score ' + score, flappy);
    }
    cleanup = () => cancelAnimationFrame(raf);
  }

  /* — mines — */
  function mines() {
    root().innerHTML = `<div class="game-status">Pick safe cells. Avoid mines.</div><div class="mine-grid"></div>`;
    const grid = root().querySelector('.mine-grid');
    const mines = new Set();
    while (mines.size < 10) mines.add(Math.floor(Math.random() * 64));
    let ended = false, safe = 0;
    for (let i = 0; i < 64; i++) {
      const b = document.createElement('button');
      b.className = 'mine-cell'; b.type = 'button';
      b.addEventListener('click', () => {
        if (ended) return;
        if (mines.has(i)) {
          ended = true;
          b.textContent = '×'; b.classList.add('boom');
          [...grid.children].forEach((c, j) => { if (mines.has(j)) { c.textContent = '×'; c.classList.add('boom'); } });
          return over('Boom · mine triggered', mines);
        }
        const x = i % 8, y = Math.floor(i / 8);
        let c = 0;
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < 8 && ny < 8 && mines.has(ny * 8 + nx)) c++;
        }
        b.textContent = c || '·'; b.disabled = true; safe++;
        root().querySelector('.game-status').textContent = `Safe cells ${safe}/54`;
      });
      grid.appendChild(b);
    }
    cleanup = null;
  }

  /* — reaction — */
  function reaction() {
    root().innerHTML = `<div class="game-status">Tap Begin to arm the test.</div><div class="react-box" role="button" tabindex="0">Begin</div>`;
    const box = root().querySelector('.react-box'), st = root().querySelector('.game-status');
    let ready = false, start = 0, timer;
    const arm = () => {
      box.textContent = 'Wait…'; st.textContent = 'Wait for green.'; ready = false;
      timer = setTimeout(() => { ready = true; start = performance.now(); box.classList.add('ready'); box.textContent = 'CLICK!'; }, 900 + Math.random() * 1900);
    };
    box.addEventListener('click', () => {
      if (box.textContent === 'Begin' || box.textContent === 'Again?') return arm();
      if (!ready) { clearTimeout(timer); return over('Too early.', reaction); }
      st.textContent = 'Reaction ' + Math.round(performance.now() - start) + 'ms';
      ready = false; box.classList.remove('ready'); box.textContent = 'Again?';
    });
    cleanup = () => clearTimeout(timer);
  }

  /* — dodge — */
  function dodge() {
    root().innerHTML = `<div class="game-status">Press inside arena to start.</div><div class="dodge-wrap"><div class="dodge-player"></div></div>`;
    const wrap = root().querySelector('.dodge-wrap'), pl = root().querySelector('.dodge-player'), st = root().querySelector('.game-status');
    let raf, started = false, alive = true, x = 36, y = 120, en = [], start = 0;
    function move(e) {
      const r = wrap.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX);
      const cy = (e.touches ? e.touches[0].clientY : e.clientY);
      x = (cx - r.left) / r.width * wrap.clientWidth;
      y = (cy - r.top) / r.height * wrap.clientHeight;
      if (!started) { started = true; start = performance.now(); loop(); }
    }
    wrap.addEventListener('pointerdown', move);
    wrap.addEventListener('pointermove', (e) => { if (started) move(e); });
    function loop() {
      if (!alive) return;
      if (Math.random() < .045) {
        const d = document.createElement('div');
        d.className = 'dodge-enemy';
        d.style.left = wrap.clientWidth + 'px';
        d.style.top = Math.random() * (wrap.clientHeight - 24) + 'px';
        wrap.appendChild(d);
        en.push({el:d, x:wrap.clientWidth, y:parseFloat(d.style.top), v:2 + Math.random() * 3});
      }
      pl.style.left = x + 'px'; pl.style.top = y + 'px';
      en.forEach(o => {
        o.x -= o.v; o.el.style.left = o.x + 'px';
        if (Math.abs(o.x - x) < 22 && Math.abs(o.y - y) < 22) {
          alive = false;
          over('Hit · survived ' + Math.round((performance.now() - start) / 1000) + 's', dodge);
        }
      });
      en = en.filter(o => o.x > -30);
      st.textContent = 'Survive ' + Math.round((performance.now() - start) / 1000) + 's';
      if (alive) raf = requestAnimationFrame(loop);
    }
    cleanup = () => cancelAnimationFrame(raf);
  }

  const RUNNERS = { snake, pong, quiz, flappy, mines, reaction, dodge };

  function showStart(id) {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    root().innerHTML = `<div class="game-over-wrap"><div class="game-over-inner"><button class="game-start" type="button">Tap to start</button></div></div>`;
    root().querySelector('.game-start').onclick = () => RUNNERS[id] ? RUNNERS[id]() : snake();
  }

  function open(id) {
    const m = modal();
    if (!m) return;
    $('game-title').textContent = (id || 'snake').replace(/-/g, ' ');
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    showStart(id);
  }
  function close() {
    const m = modal();
    if (!m) return;
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    root().innerHTML = '';
  }

  function init() {
    const grid = $('game-grid');
    if (grid) {
      grid.innerHTML = GAMES.map(g => `
        <div class="game-card-ui">
          <div class="game-ico">${g.icon}</div>
          <div class="game-name">${esc(g.name)}</div>
          <div class="game-desc">${esc(g.desc)}</div>
          <button class="game-play" data-game="${g.id}" type="button">Play →</button>
        </div>`).join('');
      $$('.game-play', grid).forEach(b => b.addEventListener('click', () => open(b.dataset.game)));
    }
    $('game-close')?.addEventListener('click', close);
    modal()?.addEventListener('click', (e) => { if (e.target === modal()) close(); });
  }
  return { init, open, close };
})();

/* ── 15. MODAL HELPERS ────────────────────────────────────────────────── */
const Modals = (() => {
  function open(id) {
    const m = $(id);
    if (!m) return;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function close(id) {
    const m = $(id);
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
  function init() {
    // backdrop + esc close
    $$('.modal').forEach(m => {
      m.addEventListener('click', (e) => { if (e.target === m) { m.classList.remove('open'); m.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open'); } });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $$('.modal.open').forEach(m => {
          if (m.id === 'game-modal') Games.close();
          else { m.classList.remove('open'); m.setAttribute('aria-hidden','true'); }
        });
        document.body.classList.remove('modal-open');
      }
    });
  }
  return { open, close, init };
})();

/* ── 16. CHANGELOG ────────────────────────────────────────────────────── */
const Changelog = (() => {
  const LOGS = [
    { date: '2026-09-17', time: '00:00 IST', items: [
      'Complete UI rebuild from scratch — new SIGNAL design system, new typography, new components.',
      'All data features adapted: Last.fm, AniList, GitHub projects, AMA, music player, games, widgets.',
      'Embedded photos moved to optimized lazy-loaded image files (14 MB of inline JS removed).',
      'Mobile-first layout with bottom dock navigation, safe-area support, and reduced-motion mode.',
    ]},
    { date: '2026-07-01', time: '09:45 IST', items: [
      'Converted Games from a full separate page into a blurred popup browser that opens another popup for each game.',
      'Made popup closing animate smoothly instead of disappearing instantly.',
      'Locked background taps and scrolling while popups are open, keeping only the top music player accessible.',
      'Added page-change animations for AniList pagination and AMA question pagination.',
    ]},
    { date: '2026-06-30', time: '21:45 IST', items: [
      'Updated social links: Snapchat, Instagram, Pinterest, Facebook, Discord, and email.',
      'Added Telegram bot notifications for new website questions.',
      'Removed the Telegram notification header text.',
      'Added Telegram reply-to-answer support for website questions.',
      'Added Changelogs pill and blurred scrolling changelog popup.',
      'Improved mobile admin answer popup stability.',
    ]},
    { date: '2026-06-30', time: '15:52 IST', items: [
      'Added secure Vercel API route for Telegram question notifications.',
      'Connected the ASK ME ANYTHING form to /api/telegram.',
    ]},
  ];

  function init() {
    const list = $('cl-list');
    if (list) {
      list.innerHTML = LOGS.map(log => `
        <article class="cl-entry">
          <div class="cl-date">${esc(log.date)} <span>${esc(log.time)}</span></div>
          <ul>${log.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        </article>`).join('');
    }
    $('changelog-btn')?.addEventListener('click', () => Modals.open('changelog-modal'));
    $('changelog-close')?.addEventListener('click', () => Modals.close('changelog-modal'));
  }
  return { init };
})();

/* ── 17. ASK ME ANYTHING ─────────────────────────────────────────────────
   Firestore REST persistence · Telegram + Formspree notify · owner
   email/password auth · public answered list with votes + sorting.       */
const AMA = (() => {
  const FIREBASE = { apiKey: 'AIzaSyCUG-oxLlGWKulnV8E0PwSEmr_s0EyCRUk', projectId: 'therealreze-2a3bf' };
  const ADMIN_EMAIL = 'asaxxhiii@gmail.com';
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwvdqnyn';
  const COL = 'amaQuestions';
  const AUTH_KEY = 'ama_owner_auth_v4';
  const PUBLIC_AUTH_KEY = 'ama_public_anon_auth_v4';
  const QUEUE_KEY = 'ama_pending_questions_v4';
  const MY_IDS_KEY = 'ama_my_question_ids_v4';
  const VOTED_KEY = 'ama_voted_question_ids_v6';
  const SORT_KEY = 'ama_public_sort_v6';
  const DAILY_LIMIT = 10;
  const PUBLIC_PAGE_SIZE = 4;

  const base = () => `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents`;
  const docUrl = (id) => `${base()}/${COL}/${encodeURIComponent(id)}`;
  const colUrl = () => `${base()}/${COL}`;
  const queryUrl = () => `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents:runQuery`;

  let publicItems = [], publicPage = 1;
  let publicSort = (() => { try { return localStorage.getItem(SORT_KEY) || 'top'; } catch (e) { return 'top'; } })();
  let ownerItems = [], ownerFilter = 'unanswered';

  /* — auth helpers — */
  const auth = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch (e) { return null; } };
  const setAuth = (a) => localStorage.setItem(AUTH_KEY, JSON.stringify(a));
  const clearAuth = () => localStorage.removeItem(AUTH_KEY);
  const publicAuth = () => { try { return JSON.parse(localStorage.getItem(PUBLIC_AUTH_KEY) || 'null'); } catch (e) { return null; } };
  const setPublicAuth = (a) => { try { localStorage.setItem(PUBLIC_AUTH_KEY, JSON.stringify(a)); } catch (e) {} };

  async function ownerToken() { return refreshTokenIfNeeded(); }
  async function publicToken() {
    let a = publicAuth();
    if (a?.idToken && a.expiresAt && Date.now() < a.expiresAt - 60000) return a.idToken;
    const res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FIREBASE.apiKey, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error?.message || 'Anonymous auth failed');
    a = { idToken: data.idToken, refreshToken: data.refreshToken, expiresAt: Date.now() + (Number(data.expiresIn || 3600) * 1000) };
    setPublicAuth(a);
    return a.idToken;
  }
  async function refreshTokenIfNeeded() {
    let a = auth();
    if (!a?.refreshToken) throw new Error('Login again.');
    if (a.expiresAt && Date.now() < a.expiresAt - 60000) return a.idToken;
    const data = await jfetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: a.refreshToken }).toString()
    });
    a = { ...a, idToken: data.id_token, refreshToken: data.refresh_token || a.refreshToken, expiresAt: Date.now() + (Number(data.expires_in || 3600) * 1000) };
    setAuth(a);
    return a.idToken;
  }

  /* — firestore value mapping — */
  function toFields(q) {
    return { fields: {
      id: { stringValue: q.id },
      name: { stringValue: q.name },
      question: { stringValue: q.question },
      answer: { stringValue: q.answer || '' },
      answered: { booleanValue: !!q.answered },
      dismissed: { booleanValue: !!q.dismissed },
      votes: { integerValue: String(Number(q.votes || 0)) },
      createdAt: { stringValue: q.createdAt || nowISO() },
      answeredAt: q.answeredAt ? { stringValue: q.answeredAt } : { nullValue: null }
    }};
  }
  function fromDoc(doc) {
    const f = doc.fields || {};
    return {
      id: (f.id && f.id.stringValue) || (doc.name ? doc.name.split('/').pop() : ''),
      name: f.name?.stringValue || 'Anonymous',
      question: f.question?.stringValue || '',
      answer: f.answer?.stringValue || '',
      answered: !!f.answered?.booleanValue,
      dismissed: !!f.dismissed?.booleanValue,
      votes: Number(f.votes?.integerValue || f.votes?.doubleValue || 0),
      createdAt: f.createdAt?.stringValue || '',
      answeredAt: f.answeredAt?.stringValue || ''
    };
  }

  /* — daily rate limit — */
  const todayKey = () => 'ama_count_' + new Date().toISOString().slice(0, 10);
  const getUsed = () => { try { return Number(localStorage.getItem(todayKey()) || '0'); } catch (e) { return 0; } };
  const setUsed = (n) => { try { localStorage.setItem(todayKey(), String(n)); } catch (e) {} updateUsed(); };
  const updateUsed = () => { const el = $('ama-used'); if (el) el.textContent = `Used ${Math.min(getUsed(), DAILY_LIMIT)}/${DAILY_LIMIT} today`; };
  const setStatus = (msg, type) => { const el = $('ama-status'); if (!el) return; el.textContent = msg || ''; el.className = 'ama-status' + (type ? ' ' + type : ''); };

  /* — queue — */
  const getQueue = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return []; } };
  const setQueue = (q) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));

  async function writeQuestion(q) {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const a = auth();
      if (a?.idToken && a.email === ADMIN_EMAIL) headers.Authorization = 'Bearer ' + await ownerToken();
      else headers.Authorization = 'Bearer ' + await publicToken();
    } catch (e) {
      console.warn('Public auth unavailable; trying Firestore write without token.', e);
    }
    await jfetch(docUrl(q.id), { method: 'PATCH', headers, body: JSON.stringify(toFields(q)) });
  }

  function notifyTelegram(q) {
    return fetch('/api/telegram', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name: q.name, question: q.question, id: q.id, createdAt: q.createdAt })
    }).then(async res => {
      if (!res.ok) {
        let msg = 'Telegram HTTP ' + res.status;
        try { const data = await res.json(); msg = data?.error || msg; } catch (e) {}
        throw new Error(msg);
      }
      return res;
    });
  }
  function notifyFormspree(q) {
    return fetch(FORMSPREE_ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: 'New AMA question from ' + q.name,
        email: ADMIN_EMAIL,
        name: q.name,
        question: q.question,
        message: `New question on your website\n\nFrom: ${q.name}\nQuestion: ${q.question}`
      })
    }).then(res => { if (!res.ok) throw new Error('Formspree HTTP ' + res.status); return res; });
  }

  async function flushQueue() {
    if (window.__amaFlushInProgress) return;
    window.__amaFlushInProgress = true;
    try {
      let q = getQueue();
      if (!q.length) return;
      const seen = new Set();
      q = q.filter(item => { if (!item?.id || seen.has(item.id)) return false; seen.add(item.id); return true; });
      const remaining = [];
      for (const item of q) {
        const next = { ...item };
        let keepQueued = false;
        if (!next.telegramNotified) {
          next.telegramNotified = true;
          setQueue(q.map(x => x.id === next.id ? next : x));
          try { await notifyTelegram(next); }
          catch (e) { console.warn('AMA Telegram notification failed; will retry later.', e); next.telegramNotified = false; keepQueued = true; }
        }
        if (!next.emailNotified) {
          try { await notifyFormspree(next); next.emailNotified = true; }
          catch (e) { console.warn('AMA email fallback failed; will retry later.', e); }
        }
        try { await writeQuestion(next); }
        catch (e) { console.warn('AMA Firestore write pending; keeping question queued locally.', e); keepQueued = true; }
        if (keepQueued) remaining.push(next);
      }
      setQueue(remaining);
    } finally {
      window.__amaFlushInProgress = false;
    }
  }

  /* — votes — */
  const getVotedIds = () => { try { return JSON.parse(localStorage.getItem(VOTED_KEY) || '[]'); } catch (e) { return []; } };
  const setVotedIds = (ids) => { try { localStorage.setItem(VOTED_KEY, JSON.stringify(ids)); } catch (e) {} };
  const hasVoted = (id) => getVotedIds().includes(id);
  const setVoted = (id, yes) => { const ids = getVotedIds(); const next = yes ? [...new Set([...ids, id])] : ids.filter(x => x !== id); setVotedIds(next); };

  async function toggleVoteQuestion(id, btn) {
    if (!id) return;
    const item = publicItems.find(q => q.id === id);
    if (!item) return;
    const wasVoted = hasVoted(id);
    const delta = wasVoted ? -1 : 1;
    const previousVotes = Number(item.votes || 0);
    const optimisticVotes = Math.max(0, previousVotes + delta);
    item.votes = optimisticVotes;
    setVoted(id, !wasVoted);
    if (btn) {
      btn.classList.toggle('voted', !wasVoted);
      btn.setAttribute('aria-pressed', !wasVoted ? 'true' : 'false');
      const sp = btn.querySelector('span');
      if (sp) sp.textContent = String(optimisticVotes);
    }
    try {
      let savedVotes = null;
      try {
        const res = await fetch('/api/ama-vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ id, delta })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || typeof data?.votes === 'undefined') throw new Error(data?.error || ('Vote API HTTP ' + res.status));
        savedVotes = Number(data.votes || 0);
      } catch (apiErr) {
        const headers = { 'Content-Type': 'application/json' };
        try {
          const a = auth();
          if (a?.idToken && a.email === ADMIN_EMAIL) headers.Authorization = 'Bearer ' + await ownerToken();
          else headers.Authorization = 'Bearer ' + await publicToken();
        } catch (e) {}
        await jfetch(docUrl(id) + '?updateMask.fieldPaths=votes', {
          method: 'PATCH', headers,
          body: JSON.stringify({ fields: { votes: { integerValue: String(optimisticVotes) } } })
        });
        savedVotes = optimisticVotes;
      }
      item.votes = Math.max(0, Number(savedVotes || 0));
    } catch (e) {
      console.warn('Vote sync failed; reverting optimistic vote state.', e);
      item.votes = previousVotes;
      setVoted(id, wasVoted);
      if (btn) {
        btn.classList.toggle('voted', wasVoted);
        btn.setAttribute('aria-pressed', wasVoted ? 'true' : 'false');
        const sp = btn.querySelector('span');
        if (sp) sp.textContent = String(previousVotes);
      }
      setStatus('Could not save that upvote right now.', 'err');
      setTimeout(() => { if (($('ama-status')?.textContent || '') === 'Could not save that upvote right now.') setStatus('', ''); }, 2400);
      return;
    }
    renderPublic();
  }

  /* — public list — */
  function sortPublicItems(items) {
    const arr = [...items];
    if (publicSort === 'oldest') arr.sort((a, b) => new Date(a.answeredAt || a.createdAt) - new Date(b.answeredAt || b.createdAt));
    else if (publicSort === 'recent') arr.sort((a, b) => new Date(b.answeredAt || b.createdAt) - new Date(a.answeredAt || a.createdAt));
    else arr.sort((a, b) => (Number(b.votes || 0) - Number(a.votes || 0)) || (new Date(b.answeredAt || b.createdAt) - new Date(a.answeredAt || a.createdAt)));
    return arr;
  }

  function renderPublic() {
    const list = $('ama-list');
    if (!list) return;
    const sorted = sortPublicItems(publicItems);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PUBLIC_PAGE_SIZE));
    publicPage = Math.min(Math.max(1, publicPage), totalPages);
    const pageItems = sorted.slice((publicPage - 1) * PUBLIC_PAGE_SIZE, (publicPage - 1) * PUBLIC_PAGE_SIZE + PUBLIC_PAGE_SIZE);
    if (!pageItems.length) {
      list.innerHTML = '<div class="ama-empty">No answered questions yet. Be the first menace.</div>';
      return;
    }
    const ownerMode = auth()?.email === ADMIN_EMAIL;
    const pageBtns = Array.from({ length: totalPages }, (_, i) => `<button class="page-btn${publicPage === i + 1 ? ' active' : ''}" data-page="${i + 1}" type="button">${i + 1}</button>`).join('');
    const topControls = `<div class="ama-public-controls">
      <button class="sort-pill${publicSort === 'top' ? ' active' : ''}" data-sort="top" type="button">Top</button>
      <button class="sort-pill${publicSort === 'recent' ? ' active' : ''}" data-sort="recent" type="button">Recent</button>
      <button class="sort-pill${publicSort === 'oldest' ? ' active' : ''}" data-sort="oldest" type="button">Oldest</button>
      ${totalPages > 1 ? `<div class="ama-page-pills">${pageBtns}</div>` : ''}
    </div>`;
    const itemsHtml = pageItems.map(q => `
      <article class="ama-item" data-id="${esc(q.id)}">
        <div class="ama-meta">
          <span class="ama-from">${esc(q.name)}</span>
          <span class="ama-time">${timeAgo(q.createdAt)}</span>
          ${ownerMode ? '<button class="ama-del" type="button" aria-label="Delete question" title="Delete question">×</button>' : ''}
        </div>
        <div class="ama-q">${esc(q.question)}</div>
        <div class="ama-a">${esc(q.answer)}</div>
        <button class="ama-vote${hasVoted(q.id) ? ' voted' : ''}" data-id="${esc(q.id)}" type="button" aria-pressed="${hasVoted(q.id) ? 'true' : 'false'}">▲ <span>${Number(q.votes || 0)}</span></button>
      </article>`).join('');
    list.innerHTML = topControls + itemsHtml;
    $$('.ama-del', list).forEach(b => b.addEventListener('click', () => ownerDeleteQuestion(b.closest('.ama-item')?.dataset.id, b, 'public')));
    $$('.page-btn', list).forEach(b => b.addEventListener('click', () => { publicPage = Number(b.dataset.page) || 1; renderPublic(); }));
    $$('.sort-pill', list).forEach(b => b.addEventListener('click', () => {
      publicSort = b.dataset.sort || 'top';
      try { localStorage.setItem(SORT_KEY, publicSort); } catch (e) {}
      publicPage = 1;
      renderPublic();
    }));
    $$('.ama-vote', list).forEach(b => b.addEventListener('click', () => toggleVoteQuestion(b.dataset.id, b)));
  }

  async function loadPublic() {
    const list = $('ama-list');
    if (!list) return;
    list.innerHTML = '<div class="loading-row">Loading questions…</div>';
    try {
      const headers = { 'Content-Type': 'application/json' };
      try {
        const a = auth();
        if (a?.idToken && a.email === ADMIN_EMAIL) headers.Authorization = 'Bearer ' + await ownerToken();
      } catch (e) { console.warn('Could not attach owner token for public AMA read.', e); }
      const data = await jfetch(queryUrl(), {
        method: 'POST', headers,
        body: JSON.stringify({ structuredQuery: {
          from: [{ collectionId: COL }],
          where: { fieldFilter: { field: { fieldPath: 'answered' }, op: 'EQUAL', value: { booleanValue: true } } },
          limit: 80
        }})
      });
      publicItems = (data || []).filter(x => x.document).map(x => fromDoc(x.document)).filter(q => (q.answer || '').trim());
      publicPage = 1;
      renderPublic();
    } catch (e) {
      console.error('Public load failed', e);
      list.innerHTML = '<div class="ama-empty">Could not load answered questions. Check Firestore rules.</div>';
    }
  }

  /* — name modal — */
  function openNameModal() {
    Modals.open('ama-name-modal');
    updateFinalSendState();
    const q = $('ama-question-input');
    if (q && q.blur) { try { q.blur(); } catch (e) {} }
  }
  function closeNameModal() { Modals.close('ama-name-modal'); }
  function updateFinalSendState() {
    const btn = $('ama-final-send'), nameEl = $('ama-name-input');
    if (!btn) return;
    const ok = !!(nameEl && nameEl.value.trim());
    btn.disabled = !ok;
    btn.setAttribute('aria-disabled', ok ? 'false' : 'true');
  }
  function submitQuestionInstant() {
    const nameEl = $('ama-name-input'), qEl = $('ama-question-input');
    const name = (nameEl?.value || '').trim().slice(0, 60), question = (qEl?.value || '').trim().slice(0, 280);
    if (!name || !question) { setStatus('Name and question are required.', 'err'); updateFinalSendState(); return; }
    const sendBtn = $('ama-final-send');
    if (sendBtn) sendBtn.disabled = true;
    const q = { id: uuid(), name, question, answer: '', answered: false, dismissed: false, votes: 0, createdAt: nowISO(), answeredAt: null };
    const queue = getQueue(); queue.push(q); setQueue(queue);
    if (qEl) qEl.value = '';
    if (nameEl) nameEl.value = '';
    setUsed(getUsed() + 1);
    closeNameModal();
    setStatus('Question sent.', 'ok');
    setTimeout(() => setStatus('', ''), 3000);
    flushQueue();
  }

  /* — owner — */
  const ownerStatus = (msg, cls = '') => { const el = $('ama-owner-status'); if (el) { el.textContent = msg || ''; el.className = 'ama-owner-status' + (cls ? ' ' + cls : ''); } };
  const ownerList = (html) => { const el = $('ama-owner-list'); if (el) el.innerHTML = html; };

  function renderOwnerAuth() {
    const a = auth(), box = $('ama-owner-auth');
    if (!box) return;
    if (a?.idToken && a.email === ADMIN_EMAIL) {
      box.innerHTML = `<div class="ama-login" style="flex-direction:row;justify-content:center">
        <button class="btn btn-line btn-sm" id="ama-v4-logout" type="button">Logout</button>
        <button class="btn btn-solid btn-sm" id="ama-v4-load" type="button">Load questions</button>
      </div>`;
      $('ama-v4-logout')?.addEventListener('click', () => { clearAuth(); renderOwnerAuth(); ownerList(''); const tabs = $('ama-owner-tabs'); if (tabs) tabs.innerHTML = ''; ownerStatus('Logged out.'); loadPublic(); });
      $('ama-v4-load')?.addEventListener('click', loadOwnerQuestions);
      ownerStatus('Tap Load questions to refresh.');
    } else {
      box.innerHTML = `<div class="ama-login">
        <input id="ama-v4-email" type="email" autocomplete="email" placeholder="Admin email">
        <input id="ama-v4-pass" type="password" autocomplete="current-password" placeholder="Admin password">
        <button class="btn btn-solid" id="ama-v4-login" type="button">Login</button>
      </div>`;
      $('ama-v4-login')?.addEventListener('click', loginOwner);
      ['ama-v4-email', 'ama-v4-pass'].forEach(id => $(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') loginOwner(); }));
      ownerList(''); ownerStatus('');
    }
  }
  async function loginOwner() {
    const email = ($('ama-v4-email')?.value || '').trim(), password = $('ama-v4-pass')?.value || '';
    if (!email || !password) { ownerStatus('Enter email and password.', 'err'); return; }
    const btn = $('ama-v4-login');
    if (btn) { btn.disabled = true; btn.textContent = 'Logging in…'; }
    try {
      const data = await jfetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE.apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });
      if (data.email !== ADMIN_EMAIL) throw new Error('Wrong account.');
      setAuth({ email: data.email, idToken: data.idToken, refreshToken: data.refreshToken, expiresAt: Date.now() + (Number(data.expiresIn || 3600) * 1000) });
      renderOwnerAuth();
    } catch (e) { console.error('Owner login failed', e); ownerStatus(e.message || 'Login failed.', 'err'); }
    finally { if (btn) { btn.disabled = false; btn.textContent = 'Login'; } }
  }

  const ownerState = (q) => (q.answered || (q.answer || '').trim()) ? 'answered' : (q.dismissed ? 'dismissed' : 'unanswered');

  function renderOwnerTabs() {
    const tabs = $('ama-owner-tabs');
    if (!tabs) return;
    const counts = { answered: 0, dismissed: 0, unanswered: 0 };
    ownerItems.forEach(q => { const st = ownerState(q); counts[st] = (counts[st] || 0) + 1; });
    tabs.innerHTML = ['answered', 'dismissed', 'unanswered'].map(k =>
      `<button class="tab${ownerFilter === k ? ' active' : ''}" data-filter="${k}" type="button">${k} · ${counts[k] || 0}</button>`).join('');
    $$('.tab', tabs).forEach(btn => btn.addEventListener('click', () => { ownerFilter = btn.dataset.filter; renderOwnerItems(); }));
  }
  function renderOwnerItems() {
    renderOwnerTabs();
    const visible = ownerItems.filter(q => ownerState(q) === ownerFilter);
    if (!visible.length) { ownerList(`<div class="ama-owner-help">No ${ownerFilter} questions.</div>`); return; }
    ownerList(visible.map(q => {
      const state = ownerState(q);
      const meta = `${esc(q.name)} · ${timeAgo(q.createdAt)} · ${state}`;
      const answerBox = state === 'dismissed'
        ? (q.answer ? `<div class="ama-owner-q">A: ${esc(q.answer)}</div>` : '')
        : `<textarea class="ama-owner-answer" ${state === 'answered' ? 'readonly' : ''} placeholder="Write your answer…">${esc(q.answer || '')}</textarea>`;
      const actions = state === 'answered'
        ? '<button class="btn btn-line btn-sm ama-v4-edit" type="button">Edit</button><button class="btn danger btn-sm ama-v4-delete" type="button">Delete</button>'
        : state === 'unanswered'
          ? '<button class="btn btn-solid btn-sm ama-v4-save" type="button">Save answer</button><button class="btn btn-line btn-sm ama-v4-dismiss" type="button">Dismiss</button><button class="btn danger btn-sm ama-v4-delete" type="button">Delete</button>'
          : '<button class="btn danger btn-sm ama-v4-delete" type="button">Delete</button>';
      return `<article class="ama-owner-item" data-id="${esc(q.id)}">
        <div class="ama-owner-meta">${meta}</div>
        <div class="ama-owner-q">Q: ${esc(q.question)}</div>
        ${answerBox}
        <div class="ama-owner-actions">${actions}</div>
      </article>`;
    }).join(''));
    $$('.ama-v4-save').forEach(b => b.addEventListener('click', () => saveAnswer(b)));
    $$('.ama-v4-dismiss').forEach(b => b.addEventListener('click', () => dismissQuestion(b.closest('.ama-owner-item').dataset.id, b)));
    $$('.ama-v4-edit').forEach(b => b.addEventListener('click', () => editAnsweredQuestion(b)));
    $$('.ama-v4-delete').forEach(b => b.addEventListener('click', () => ownerDeleteQuestion(b.closest('.ama-owner-item')?.dataset.id, b, 'owner')));
  }

  async function normalizeLegacyAnsweredQuestions(token) {
    const legacy = ownerItems.filter(q => (q.answer || '').trim() && (!q.answered || q.dismissed));
    if (!legacy.length) return 0;
    let fixed = 0;
    for (const q of legacy) {
      const answeredAt = q.answeredAt || q.createdAt || nowISO();
      try {
        await jfetch(docUrl(q.id) + '?updateMask.fieldPaths=answered&updateMask.fieldPaths=dismissed&updateMask.fieldPaths=answeredAt', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ fields: { answered: { booleanValue: true }, dismissed: { booleanValue: false }, answeredAt: { stringValue: answeredAt } } })
        });
        const it = ownerItems.find(x => x.id === q.id);
        if (it) { it.answered = true; it.dismissed = false; it.answeredAt = answeredAt; }
        fixed++;
      } catch (e) { console.warn('Legacy normalize failed for', q.id, e); }
    }
    return fixed;
  }

  async function loadOwnerQuestions() {
    ownerStatus('Loading questions…'); ownerList('');
    try {
      const token = await refreshTokenIfNeeded();
      const data = await jfetch(colUrl() + '?pageSize=200', { headers: { Authorization: 'Bearer ' + token } });
      ownerItems = (data.documents || []).map(fromDoc).filter(q => q.question);
      ownerItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      if (!ownerItems.length) { ownerStatus('No questions found in Firestore. Send a new question, then tap Load questions.'); renderOwnerTabs(); return; }
      const fixed = await normalizeLegacyAnsweredQuestions(token);
      if (!['answered', 'dismissed', 'unanswered'].includes(ownerFilter)) ownerFilter = 'unanswered';
      ownerStatus(ownerItems.length + ' question' + (ownerItems.length === 1 ? '' : 's') + ' loaded.' + (fixed ? ' Fixed ' + fixed + ' old answered flag' + (fixed === 1 ? '' : 's') + '.' : ''));
      renderOwnerItems();
      if (fixed) loadPublic();
    } catch (e) { console.error('Owner load failed', e); ownerStatus(e.message || 'Could not load questions. Check Firestore rules.', 'err'); }
  }

  async function saveAnswer(btn) {
    const card = btn.closest('.ama-owner-item'), id = card?.dataset.id, answer = card?.querySelector('textarea')?.value.trim();
    if (!id || !answer) { ownerStatus('Write an answer first.', 'err'); return; }
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const token = await refreshTokenIfNeeded();
      const savedAt = nowISO();
      await jfetch(docUrl(id) + '?updateMask.fieldPaths=answer&updateMask.fieldPaths=answered&updateMask.fieldPaths=answeredAt&updateMask.fieldPaths=dismissed', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ fields: { answer: { stringValue: answer.slice(0, 1000) }, answered: { booleanValue: true }, answeredAt: { stringValue: savedAt }, dismissed: { booleanValue: false } } })
      });
      const idx = ownerItems.findIndex(q => q.id === id);
      if (idx > -1) ownerItems[idx] = { ...ownerItems[idx], answer: answer.slice(0, 1000), answered: true, dismissed: false, answeredAt: savedAt };
      btn.textContent = 'Saved'; ownerStatus('Answer saved.');
      loadPublic(); renderOwnerItems();
    } catch (e) { console.error('Save failed', e); ownerStatus(e.message || 'Could not save answer.', 'err'); btn.textContent = 'Save answer'; }
    finally { setTimeout(() => { btn.disabled = false; if (btn.textContent === 'Saved') btn.textContent = 'Save answer'; }, 800); }
  }

  async function editAnsweredQuestion(btn) {
    const card = btn.closest('.ama-owner-item'), id = card?.dataset.id;
    const item = ownerItems.find(q => q.id === id);
    if (!id || !item) return;
    const next = prompt('Edit the answer:', item.answer || '');
    if (next === null) return;
    const answer = next.trim().slice(0, 1000);
    if (!answer) { ownerStatus('Answer cannot be empty.', 'err'); return; }
    btn.disabled = true; btn.textContent = 'saving…';
    try {
      const token = await refreshTokenIfNeeded();
      const savedAt = nowISO();
      await jfetch(docUrl(id) + '?updateMask.fieldPaths=answer&updateMask.fieldPaths=answered&updateMask.fieldPaths=answeredAt&updateMask.fieldPaths=dismissed', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ fields: { answer: { stringValue: answer }, answered: { booleanValue: true }, answeredAt: { stringValue: savedAt }, dismissed: { booleanValue: false } } })
      });
      item.answer = answer; item.answered = true; item.dismissed = false; item.answeredAt = savedAt;
      ownerStatus('Answer edited.'); loadPublic(); renderOwnerItems();
    } catch (e) { console.error('Edit failed', e); ownerStatus(e.message || 'Could not edit answer.', 'err'); btn.disabled = false; btn.textContent = 'Edit'; }
  }

  async function dismissQuestion(id, btn) {
    if (!id || !confirm('Dismiss this question?')) return;
    btn.disabled = true; btn.textContent = 'Dismissing…';
    try {
      const token = await refreshTokenIfNeeded();
      await jfetch(docUrl(id) + '?updateMask.fieldPaths=dismissed&updateMask.fieldPaths=answered', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ fields: { dismissed: { booleanValue: true }, answered: { booleanValue: false } } })
      });
      const item = ownerItems.find(q => q.id === id);
      if (item) { item.dismissed = true; item.answered = false; }
      ownerStatus('Question dismissed.');
      renderOwnerItems();
    } catch (e) { ownerStatus(e.message || 'Could not dismiss.', 'err'); btn.disabled = false; btn.textContent = 'Dismiss'; }
  }

  async function ownerDeleteQuestion(id, btn, source = 'owner') {
    if (!id || !confirm('Delete this question permanently?')) return;
    const oldText = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    try {
      const token = await refreshTokenIfNeeded();
      await jfetch(docUrl(id), { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
      ownerItems = ownerItems.filter(q => q.id !== id);
      ownerStatus('Question deleted.');
      if (source === 'public') loadPublic();
      else renderOwnerItems();
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = oldText || 'Delete'; }
      if (source === 'public') alert('Could not delete: ' + (e.message || 'unknown error'));
      else ownerStatus(e.message || 'Could not delete question.', 'err');
    }
  }

  /* — bind — */
  function bind() {
    updateUsed();
    loadPublic();
    flushQueue();
    setInterval(flushQueue, 15000);

    const refresh = $('ama-public-refresh');
    refresh?.addEventListener('click', () => {
      refresh.disabled = true;
      loadPublic().finally(() => { refresh.disabled = false; });
    });

    const form = $('ama-question-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (getUsed() >= DAILY_LIMIT) { setStatus('Daily limit reached. Try again tomorrow.', 'err'); return; }
      const q = ($('ama-question-input')?.value || '').trim();
      if (!q) { setStatus('Type a question first.', 'err'); return; }
      openNameModal();
    });

    const nameInput = $('ama-name-input');
    ['input', 'change', 'keyup', 'compositionend'].forEach(ev => nameInput?.addEventListener(ev, updateFinalSendState, true));
    nameInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); updateFinalSendState(); if (!$('ama-final-send')?.disabled) submitQuestionInstant(); }
    });
    const finalSend = $('ama-final-send');
    finalSend?.addEventListener('click', (e) => {
      e.preventDefault();
      updateFinalSendState();
      if (!finalSend.disabled) submitQuestionInstant();
    });
    $('ama-name-close')?.addEventListener('click', closeNameModal);

    let ownerOpenStamp = 0;
    $('ama-owner-btn')?.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const now = Date.now();
      if (now - ownerOpenStamp < 700) return;
      ownerOpenStamp = now;
      Modals.open('ama-owner-modal');
      renderOwnerAuth();
    });
    $('ama-owner-close')?.addEventListener('click', () => Modals.close('ama-owner-modal'));
  }

  function init() { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind(); }
  return { init };
})();

/* ── 18. INIT ─────────────────────────────────────────────────────────── */
const INIT_STEPS = [
  ['theme', Theme], ['boot', Boot], ['reveal', Reveal], ['nav', Nav], ['clock', Clock],
  ['photos', Photos], ['skills', Skills], ['repos', Repos], ['lastfm', LastFM], ['music', Music],
  ['anilist', AniList], ['widgets', Widgets], ['socials', Socials], ['games', Games],
  ['modals', Modals], ['changelog', Changelog], ['ama', AMA],
];
function initSite() {
  // Isolated init: one failing module must never take down the rest of the page.
  INIT_STEPS.forEach(([name, mod]) => {
    try { mod.init(); }
    catch (e) { console.error('[init:' + name + ']', e); }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSite);
else initSite();
