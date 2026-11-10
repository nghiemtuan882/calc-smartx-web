// Calc SmartX site: live sheet, ASCII field, language switch. Content is fully rendered without this script.
(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');

  /* ---------- Splash screen: show once per session ---------- */
  const splash = document.getElementById('splash');
  if (splash) {
    const seen = (() => { try { return sessionStorage.getItem('csx-splash'); } catch(e) { return null; } })();
    if (seen) {
      splash.classList.add('splash--done');
    } else {
      // Hide after animation completes (~2.1s total)
      setTimeout(() => {
        splash.classList.add('splash--done');
        try { sessionStorage.setItem('csx-splash', '1'); } catch(e) {}
      }, 2100);
    }
  }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- language switch ---------- */
  const sel = document.getElementById('langsel');
  if (sel) sel.addEventListener('change', () => {
    try { localStorage.setItem('csx-lang', sel.value); } catch (e) {}
    location.href = sel.selectedOptions[0].dataset.href;
  });
  document.querySelectorAll('.langs a').forEach((a) => a.addEventListener('click', () => {
    try { localStorage.setItem('csx-lang', a.dataset.lang); } catch (e) {}
  }));

  /* ---------- live sheet: the app's keypad edits the selected quantity ---------- */
  const sheet = document.getElementById('sheet');
  if (sheet) {
    const d = JSON.parse(sheet.dataset.ex);
    const fmt = (v) => {
      const [g, dec] = d.sep === 'dot' ? ['.', ','] : d.sep === 'space' ? [' ', ','] : [',', '.'];
      const r = Math.round(v * 1000) / 1000;
      const [i, f] = Math.abs(r).toString().split('.');
      return (r < 0 ? '−' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, g) + (f ? dec + f : '');
    };
    const cells = {};
    sheet.querySelectorAll('[data-v]').forEach((b) => { (cells[b.dataset.v] ||= []).push(b); });
    let digits = String(d.qty), fresh = true;
    const set = (k, v) => (cells[k] || []).forEach((b) => {
      const t = fmt(v);
      if (b.textContent === t) return;
      b.textContent = t;
      if (!reduce) { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 600); }
    });
    const calc = () => {
      const qty = Number(digits || 0);
      const amount = d.price * qty, vat = amount * (1 + d.vat / 100), each = vat / d.parts, total = d.fee * qty;
      set('qty', qty); set('amount', amount); set('vat', vat); set('each', each); set('total', total);
    };
    const press = (k) => {
      if (k === 'bs') { digits = fresh ? '' : digits.slice(0, -1); fresh = false; }
      else if (k === 'clear') { digits = String(d.qty); fresh = true; }
      else {
        const base = fresh ? '' : digits;
        const next = (base === '0' ? '' : base) + k;
        if (next.replace(/^0+/, '').length <= 4) { digits = next.replace(/^0+(?=\d)/, ''); fresh = false; }
      }
      calc();
    };
    sheet.querySelectorAll('.k').forEach((b) => b.addEventListener('click', () => {
      b.classList.add('press'); setTimeout(() => b.classList.remove('press'), 140);
      if (b.dataset.k) press(b.dataset.k);
    }));
    sheet.addEventListener('keydown', (e) => {
      const k = /^[0-9]$/.test(e.key) ? e.key : e.key === 'Backspace' ? 'bs' : e.key === 'Escape' ? 'clear' : null;
      if (k) { e.preventDefault(); press(k); }
    });
    calc();
  }

  /* ---------- Dark/light theme toggle ---------- */
  const themeMockup = document.getElementById('theme-mockup');
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      if (themeMockup) themeMockup.dataset.active = btn.dataset.theme;
    });
  });

  /* ---------- Device tabs ---------- */
  const devScene = document.querySelector('.dev-scene');
  document.querySelectorAll('.dev-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.dev-tab').forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      if (devScene) {
        devScene.dataset.active = tab.dataset.device;
        // trigger fold animation
        const fold = devScene.querySelector('.dev-fold');
        if (fold && tab.dataset.device === 'fold') {
          fold.classList.remove('fold-animate');
          void fold.offsetWidth;
          fold.classList.add('fold-animate');
        }
      }
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq__q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const dd = btn.closest('.faq__item').querySelector('.faq__a');
      if (dd) dd.hidden = expanded;
    });
  });

  /* ---------- ASCII field: digits drift in raw on the left, settle into sheet rows on the right ---------- */
  const cv = document.querySelector('canvas.field');
  if (cv && cv.getContext) {
    const ctx = cv.getContext('2d');
    const cs = getComputedStyle(root);
    const tint = ['--color-glyph-1', '--color-glyph-2', '--color-glyph-3', '--color-glyph-4', '--color-accent-deep'].map((v) => cs.getPropertyValue(v).trim());
    const CW = 8, CH = 16, ramp = ' .·:+−×÷=0123456789';
    let w = 0, h = 0, cols = 0, rows = 0, t = Math.random() * 100, raf = 0, on = true, px = -999, py = -999;
    const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
    const noise = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), e = hash(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + e) * u * v;
    };
    const size = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
      w = r.width; h = r.height; cols = Math.ceil(w / CW); rows = Math.ceil(h / CH);
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = '12px "JetBrains Mono", ui-monospace, monospace'; ctx.textBaseline = 'top';
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let y = 0; y < rows; y++) {
        const rowLine = y % 4 === 1; // resolved side: digits settle into number-like runs on every fourth row
        for (let x = 0; x < cols; x++) {
          const k = x / cols; // 0 raw (left) .. 1 resolved (right)
          let n = noise(x * 0.09 + t * 0.35, y * 0.16 - t * 0.12);
          const dx = (x * CW - px) / 90, dy = (y * CH - py) / 90, lens = Math.max(0, 1 - (dx * dx + dy * dy));
          const resolved = k > 0.6;
          if (resolved) { if (!rowLine || (x + y * 3) % 13 > 8) continue; n = 0.5 + n * 0.35; }
          n = Math.min(1, n + lens * 0.4);
          if (n < 0.5) continue;
          const lvl = Math.min(4, Math.floor((n - 0.5) / 0.5 * 5));
          const ch = resolved ? String(Math.floor(hash(x, y + Math.floor(t * 0.5)) * 10)) : ramp[Math.min(ramp.length - 1, 1 + Math.floor((n - 0.5) / 0.5 * 8))];
          ctx.fillStyle = tint[resolved ? Math.min(3, lvl) : Math.min(2, lvl)];
          ctx.fillText(ch, x * CW, y * CH + 1);
        }
      }
    };
    let last = 0;
    const loop = (ts) => { raf = requestAnimationFrame(loop); if (ts - last < 33) return; last = ts; t += 0.02; draw(); };
    size(); cv.classList.add('is-live');
    if (reduce) draw();
    else {
      new IntersectionObserver(([e]) => { on = e.isIntersecting; cancelAnimationFrame(raf); if (on) raf = requestAnimationFrame(loop); }).observe(cv);
      cv.parentElement.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; }, { passive: true });
      cv.parentElement.addEventListener('pointerleave', () => { px = py = -999; });
    }
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(); }, 150); });
  }
})();
