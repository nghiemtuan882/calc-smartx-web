// Builds the static site into dist/: one page per language (vi at the root, others in /<code>/).
// Usage: node tools/build.mjs   (SITE_URL overrides the public address used in canonical/hreflang)
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const SITE = (process.env.SITE_URL || 'https://nghiemtuan882.github.io/calc-smartx-web/').replace(/\/?$/, '/');
const APP_ID = 'com.calcsmartx.app';
const VERSION = '1.2';

const APP = read('content/app-strings.json');   // texts taken from the app itself (12 languages)
const SITE_T = read('content/site.json');       // texts written for the website
const EX = read('tools/examples.json');         // per-language example sheet
const CODES = Object.keys(SITE_T);
const DEFAULT = 'vi';

const GROUPS = [
  ['g1', ['f1', 'f2', 'f3', 'f7', 'f11']],
  ['g2', ['f12', 'f13', 'f9']],
  ['g3', ['f4', 'f10', 'f14', 'f6']],
  ['g4', ['f5', 'f8', 'f15']],
];

// Emoji flags per language code
const FLAGS = { vi: '🇻🇳', en: '🇺🇸', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', es: '🇪🇸', pt: '🇧🇷', fr: '🇫🇷', de: '🇩🇪', ru: '🇷🇺', th: '🇹🇭', id: '🇮🇩' };

// Countries per language (ISO 3166-1 alpha-3 for globe)
const LANG_COUNTRIES = {
  vi: ['VNM'], en: ['USA','GBR','AUS','CAN','NZL','IRL','ZAF','SGP','PHL'],
  zh: ['CHN','TWN','HKG','MAC','SGP'], ja: ['JPN'], ko: ['KOR','PRK'],
  es: ['MEX','COL','ARG','ESP','CHL','PER','VEN','ECU','BOL','PRY','URY','CRI','PAN','DOM','HND','SLV','NIC','GTM','CUB'],
  pt: ['BRA','PRT','AGO','MOZ','CPV','STP','GNB','TLS'],
  fr: ['FRA','BEL','CHE','CAN','SEN','CIV','CMR','MLI','MDG','GAB','COG'],
  de: ['DEU','AUT','CHE','LUX','LIE'], ru: ['RUS','BLR','KAZ','KGZ','MDA'],
  th: ['THA'], id: ['IDN'],
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');
const fmt = (v, sep) => {
  const [g, dec] = sep === 'dot' ? ['.', ','] : sep === 'space' ? [' ', ','] : [',', '.'];
  const r = Math.round(v * 1000) / 1000;
  const [i, f] = Math.abs(r).toString().split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, g) + (f ? dec + f : '');
};
const href = (from, to) => {           // relative link between language pages
  const up = from === DEFAULT ? '' : '../';
  return up + (to === DEFAULT ? '' : to + '/');
};
const abs = (code) => SITE + (code === DEFAULT ? '' : code + '/');
const calc = (e, qty = e.qty) => {
  const amount = e.price * qty, vat = amount * (1 + e.vat / 100);
  return { qty, amount, vat, each: vat / e.parts, total: e.fee * qty };
};

const sv = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
const APPICON = {
  undo: sv('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  redo: sv('<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>'),
  exp: sv('<path d="M12 3v12"/><path d="m7.5 7.5 4.5-4.5 4.5 4.5"/><path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12"/>'),
  shot: sv('<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>'),
  set: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  hide: sv('<path d="m6 9 6 6 6-6"/>'),
  note: sv('<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><path d="M16 5h1.5A1.5 1.5 0 0 1 19 6.5V11M8 5H6.5A1.5 1.5 0 0 0 5 6.5v12A1.5 1.5 0 0 0 6.5 20H11"/><path d="m14 20 .5-2.5 5-5 2 2-5 5z"/>'),
  trash: sv('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M5.5 7l1 12a1.5 1.5 0 0 0 1.5 1.4h8a1.5 1.5 0 0 0 1.5-1.4l1-12"/><path d="M9 7V4.5h6V7"/>'),
  bs: sv('<path d="M9 5h10.5A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5H9l-6-7z"/><path d="m11 9 6 6M17 9l-6 6"/>'),
  spark: '<svg class="spark" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5C12.7 7.3 16.7 11.3 22.5 12C16.7 12.7 12.7 16.7 12 22.5C11.3 16.7 7.3 12.7 1.5 12C7.3 11.3 11.3 7.3 12 1.5Z" fill="currentColor"/></svg>',
};
const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.6 2.3a1.2 1.2 0 0 0-.6 1v17.4a1.2 1.2 0 0 0 .6 1l9.6-9.7zm10.6 8.7 2.8-2.8L6.3 1.6zm0 2-9 9 11.7-6.7zm3.7-4.3-3 3 3 3 2.9-1.7a1.3 1.3 0 0 0 0-2.4z"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
};

function page(code) {
  const T = SITE_T[code], A = APP[code], e = EX[code], sep = A.sep;
  const up = code === DEFAULT ? './' : '../';
  const v = calc(e);
  const F = (n) => fmt(n, sep);
  const play = `https://play.google.com/store/apps/details?id=${APP_ID}&amp;hl=${code === 'zh' ? 'zh-CN' : code}`;
  const playKey = (cls = '') => `<a class="key key--primary ${cls}" href="${play}" rel="noopener">${ICON.play}<span>${esc(T.cta)}</span></a>`;

  // one token in the live sheet, drawn the way the app draws it (c1 blue, c2 purple, c3 orange link chains)
  const tk = (val, opts = {}) => {
    const cls = ['t', opts.op && 'o', opts.c && 'c' + opts.c, opts.box && 'box', opts.sel && 'sel'].filter(Boolean).join(' ');
    const lab = opts.label ? `<small>${esc(opts.label)}</small>` : '';
    const dv = opts.key ? ` data-v="${opts.key}"` : '';
    return `<span class="${cls}">${lab}<b${dv}>${esc(val)}</b></span>`;
  };
  const op = (s) => tk(s, { op: true });
  const lines = [
    [tk(F(e.price), { label: A.ex_price }), op('×'), tk(F(v.qty), { label: A.ex_qty, key: 'qty', c: 3, box: true, sel: true }), op('='), tk(F(v.amount), { label: A.ex_amount, key: 'amount', c: 1, box: true })],
    [tk(F(v.amount), { label: A.ex_amount, key: 'amount', c: 1 }), op('+'), tk(F(e.vat)), op('%'), op('='), tk(F(v.vat), { label: A.ex_vat, key: 'vat', c: 2, box: true })],
    [tk(F(v.vat), { label: A.ex_vat, key: 'vat', c: 2 }), op('÷'), tk(F(e.parts), { label: A.ex_parts }), op('='), tk(F(v.each), { label: A.ex_each, key: 'each' })],
    [tk(F(e.fee), { label: A.ex_fee }), op('×'), tk(F(v.qty), { label: A.ex_qty, key: 'qty', c: 3 }), op('='), tk(F(v.total), { label: A.ex_total, key: 'total' })],
  ];
  // the app's own keypad: tool column, digits, green operator column
  const dec = sep === 'comma' ? '.' : ',';
  const K = (label, cls = '', act = '') => `<button type="button" class="k ${cls}"${act ? ` data-k="${act}"` : ' tabindex="-1" aria-hidden="true"'}>${label}</button>`;
  const pad = [
    K(APPICON.hide, 'tl'), K(APPICON.note, 'tl'), K(APPICON.trash, 'tl', 'clear'), K(APPICON.bs, 'tl', 'bs'), K('÷', 'op'),
    K('(', 'tl'), K('7', '', '7'), K('8', '', '8'), K('9', '', '9'), K('×', 'op'),
    K(')', 'tl'), K('4', '', '4'), K('5', '', '5'), K('6', '', '6'), K('−', 'op'),
    K('%', 'tl'), K('1', '', '1'), K('2', '', '2'), K('3', '', '3'), K('+', 'op'),
    K('±', 'tl'), K(dec), K('000', 'k000', '000'), K('0', '', '0'), K('=', 'op'),
  ].join('');
  const exData = esc(JSON.stringify({ ...e, sep }));

  const ledgerRows = [
    [`${F(e.price)} × ${F(e.qty)}`, F(v.amount), `${A.ex_price} × ${A.ex_qty} = ${A.ex_amount}`],
    [`${F(v.amount)} + ${F(e.vat)} %`, F(v.vat), A.ex_vat],
    [`${F(v.vat)} ÷ ${F(e.parts)}`, F(v.each), `${A.ex_each} (${A.ex_parts}: ${e.parts})`],
    [`${F(e.fee)} × ${F(e.qty)}`, F(v.total), `${A.ex_fee} × ${A.ex_qty} = ${A.ex_total}`],
  ];

  const langOptions = CODES.map((c) => `<option value="${c}" data-href="${href(code, c)}"${c === code ? ' selected' : ''}>${esc(APP[c].name)}</option>`).join('');
  const langCards = CODES.map((c) => {
    const ve = calc(EX[c]);
    return `<li><a href="${href(code, c)}" hreflang="${SITE_T[c].html}" lang="${SITE_T[c].html}" data-lang="${c}"${c === code ? ' aria-current="page"' : ''}><span class="flag" aria-hidden="true">${FLAGS[c]}</span><strong>${esc(APP[c].name)}</strong></a></li>`;
  }).join('');
  // Globe data: highlight countries by language
  const globeData = esc(JSON.stringify(Object.fromEntries(CODES.map(c => [c, LANG_COUNTRIES[c]]))));

  let n = 0;
  const groups = GROUPS.map(([g, ids]) => `
      <div class="grp">
        <div class="grp__h"><span aria-hidden="true">${String(GROUPS.findIndex((x) => x[0] === g) + 1).padStart(2, '0')}</span><h3>${esc(T[g])}</h3></div>
        <ul class="feats">${ids.map((id) => { n++; return `
          <li class="feat">
            <div class="feat__clip cut"><img src="${up}static/gif/${code}-${id}.gif" width="546" height="285" loading="lazy" decoding="async" alt="${esc(A[id + 't'])}"></div>
            <h4>${esc(A[id + 't'])}</h4>
            <p>${esc(A[id + 'd'])}</p>
          </li>`; }).join('')}
        </ul>
      </div>`).join('');

  const alternates = CODES.map((c) => `<link rel="alternate" hreflang="${SITE_T[c].html}" href="${abs(c)}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${abs(DEFAULT)}">`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'MobileApplication', name: 'Calc SmartX', operatingSystem: 'Android',
    applicationCategory: 'UtilitiesApplication', softwareVersion: VERSION, inLanguage: T.html, description: T.desc,
    url: abs(code), image: SITE + 'static/logo-512.png',
  };

  return `<!doctype html>
<html lang="${T.html}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(T.title)}</title>
<meta name="description" content="${esc(T.desc)}">
<link rel="canonical" href="${abs(code)}">
${alternates}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(T.title)}">
<meta property="og:description" content="${esc(T.desc)}">
<meta property="og:url" content="${abs(code)}">
<meta property="og:image" content="${SITE}static/og.png">
<meta property="og:locale" content="${T.html.replace('-', '_')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f7f9fc">
<link rel="icon" href="${up}static/logo.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${up}static/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600&family=Roboto:wght@300;400;500&family=IBM+Plex+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${up}static/css/site.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${code === DEFAULT ? `<script>try{var l=localStorage.getItem('csx-lang');if(l&&l!=='${DEFAULT}'&&${JSON.stringify(CODES)}.indexOf(l)>0)location.replace(l+'/')}catch(e){}</script>` : ''}
</head>
<body>
<div id="splash" aria-hidden="true">
  <div class="splash__ring"><img src="${up}static/logo.svg" alt="Calc SmartX" width="72" height="72"></div>
  <div class="splash__name">Calc SmartX</div>
  <div class="splash__bar-wrap"><div class="splash__bar"></div></div>
</div>
<a class="skip" href="#main">${esc(T.skip)}</a>
<header class="nav">
  <div class="container nav__in">
    <a class="brand" href="${href(code, code)}"><img src="${up}static/logo.svg" alt="" width="40" height="40">Calc SmartX</a>
    <nav class="nav__links" aria-label="Calc SmartX">
      <a href="#features">${esc(T.nav_feat)}</a>
      <a href="#example">${esc(T.nav_ex)}</a>
      <a href="#languages">${esc(T.nav_lang)}</a>
    </nav>
    <div class="nav__end">
      <label class="langsel"><span class="langsel__lbl">${esc(T.lang)}</span><span class="langsel__flag" aria-hidden="true">${FLAGS[code]}</span><select id="langsel">${langOptions}</select>${ICON.chev}</label>
      <span class="nav__soon">${esc(T.soon_h)}</span>
    </div>
  </div>
</header>

<main id="main">
  <section class="hero" aria-labelledby="h1">
    <canvas class="field" aria-hidden="true"></canvas>
    <div class="container hero__in">
      <div class="hero__text">
        <h1 id="h1">${esc(T.hero_h)}</h1>
        <p class="lead">${esc(T.hero_p)}</p>
        <div class="hero__acts"><span class="hero__soon-badge">${esc(T.soon_h)}</span></div>
      </div>
      <div class="hero__sheet">
        <p class="try" id="try">${esc(T.try)}</p>
        <div class="phone" id="sheet" data-ex="${exData}" role="group" aria-labelledby="try">
          <div class="ph__top" aria-hidden="true">
            <span class="ph__ic">${APPICON.undo}${APPICON.redo}</span>
            <span class="ph__brand">${APPICON.spark}Calc SmartX</span>
            <span class="ph__ic">${APPICON.exp}${APPICON.shot}${APPICON.set}</span>
          </div>
          <div class="ph__sheet" aria-live="polite">
            ${lines.map((l) => `<div class="ln">${l.join('')}</div>`).join('\n            ')}
          </div>
          <div class="ph__pad">${pad}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" id="example" aria-labelledby="h-ex">
    <div class="container ex">
      <figure class="ex__shot cut" style="margin:0"><img src="${up}static/shots/${code}.webp" width="824" height="1560" loading="lazy" decoding="async" alt="${esc(T.shot_alt)}"></figure>
      <div class="ex__body">
        <h2 id="h-ex">${esc(T.ex_h)}</h2>
        <p>${esc(fill(T.ex_p, { cur: e.cur, vat: F(e.vat), parts: F(e.parts) }))}</p>
        <div class="ledger-wrap">
          <table class="ledger">
            <thead><tr><th scope="col">${esc(A.col_expr)}</th><th scope="col">${esc(A.col_res)}</th><th scope="col">${esc(A.col_note)}</th></tr></thead>
            <tbody>${ledgerRows.map((r, i) => `<tr${i === 1 ? ' class="hit"' : ''}><td class="m">${esc(r[0])}</td><td class="m">${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" id="features" aria-labelledby="h-feat">
    <div class="container">
      <div class="sec__head">
        <h2 id="h-feat">${esc(T.feat_h)}</h2>
        <p class="lead">${esc(T.feat_p)}</p>
      </div>
      ${groups}
    </div>
  </section>

  <section class="sec" id="languages" aria-labelledby="h-lang">
    <div class="container">
      <div class="sec__head">
        <h2 id="h-lang">${esc(T.lang_h)}</h2>
        <p class="lead">${esc(T.lang_p)}</p>
      </div>
      <ul class="langs">${langCards}</ul>
    </div>
  </section>

  <section class="sec theme-sec" id="themes" aria-labelledby="h-themes">
    <div class="container">
      <div class="theme-layout">
        <div class="theme-text">
          <h2 id="h-themes">${esc(T.theme_h)}</h2>
          <p class="lead">${esc(T.theme_p)}</p>
          <div class="theme-toggle" role="group">
            <button class="theme-btn theme-btn--light is-active" data-theme="light">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              ${esc(T.theme_light)}
            </button>
            <button class="theme-btn theme-btn--dark" data-theme="dark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ${esc(T.theme_dark)}
            </button>
          </div>
        </div>
        <div class="theme-preview">
          <div class="theme-mockup" id="theme-mockup" data-active="light">
            <div class="tm-light">
              <div class="tm-bar">
                <div class="tm-bar-left"><span class="tm-icon"></span><span class="tm-icon"></span><span class="tm-icon"></span></div>
                <div class="tm-brand-pill"><span class="tm-spark">✦</span>Calc SmartX</div>
                <div class="tm-bar-right"><span class="tm-icon"></span><span class="tm-icon"></span><span class="tm-icon"></span></div>
              </div>
              <div class="tm-sheet">
                <div class="tm-row">150.000 × 3</div>
                <div class="tm-row">495.000 + 10%</div>
                <div class="tm-row tm-row-eq">150.000 × 3 + 10%</div>
              </div>
              <div class="tm-expr">150.000 × 3 + 10% =</div>
              <div class="tm-result">495.000</div>
              <div class="tm-pad">
                <span class="tm-k tool">∨</span><span class="tm-k">7</span><span class="tm-k">8</span><span class="tm-k">9</span><span class="tm-k op">÷</span>
                <span class="tm-k tool">(</span><span class="tm-k">4</span><span class="tm-k">5</span><span class="tm-k">6</span><span class="tm-k op">×</span>
                <span class="tm-k tool">)</span><span class="tm-k">1</span><span class="tm-k">2</span><span class="tm-k">3</span><span class="tm-k op">−</span>
                <span class="tm-k tool">%</span><span class="tm-k">0</span><span class="tm-k">,</span><span class="tm-k">±</span><span class="tm-k op">+</span>
                <span class="tm-k tool">xʸ</span><span class="tm-k" style="grid-column:span 2">⌫</span><span class="tm-k" style="visibility:hidden"></span><span class="tm-k op">=</span>
              </div>
            </div>
            <div class="tm-dark">
              <div class="tm-bar">
                <div class="tm-bar-left"><span class="tm-icon"></span><span class="tm-icon"></span><span class="tm-icon"></span></div>
                <div class="tm-brand-pill"><span class="tm-spark">✦</span>Calc SmartX</div>
                <div class="tm-bar-right"><span class="tm-icon"></span><span class="tm-icon"></span><span class="tm-icon"></span></div>
              </div>
              <div class="tm-sheet">
                <div class="tm-row">150.000 × 3</div>
                <div class="tm-row">495.000 + 10%</div>
                <div class="tm-row tm-row-eq">150.000 × 3 + 10%</div>
              </div>
              <div class="tm-expr">150.000 × 3 + 10% =</div>
              <div class="tm-result">495.000</div>
              <div class="tm-pad">
                <span class="tm-k tool">∨</span><span class="tm-k">7</span><span class="tm-k">8</span><span class="tm-k">9</span><span class="tm-k op">÷</span>
                <span class="tm-k tool">(</span><span class="tm-k">4</span><span class="tm-k">5</span><span class="tm-k">6</span><span class="tm-k op">×</span>
                <span class="tm-k tool">)</span><span class="tm-k">1</span><span class="tm-k">2</span><span class="tm-k">3</span><span class="tm-k op">−</span>
                <span class="tm-k tool">%</span><span class="tm-k">0</span><span class="tm-k">,</span><span class="tm-k">±</span><span class="tm-k op">+</span>
                <span class="tm-k tool">xʸ</span><span class="tm-k" style="grid-column:span 2">⌫</span><span class="tm-k" style="visibility:hidden"></span><span class="tm-k op">=</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="sec device-sec" id="devices" aria-labelledby="h-devices">
    <div class="container">
      <div class="sec__head">
        <h2 id="h-devices">${esc(T.device_h)}</h2>
        <p class="lead">${esc(T.device_p)}</p>
      </div>
      <div class="device-tabs" role="tablist">
        <button class="dev-tab is-active" role="tab" aria-selected="true" data-device="phone">${esc(T.device_phone)}</button>
        <button class="dev-tab" role="tab" aria-selected="false" data-device="tablet">${esc(T.device_tablet)}</button>
      </div>
      <div class="device-stage" id="device-stage">
        <div class="dev-scene" data-active="phone">

          <!-- Phone -->
          <div class="dev-frame dev-phone" data-device="phone">
            <div class="dev-shell">
              <div class="dev-screen">
                <div class="ds-bar">
                  <div class="ds-bar-left"><span class="ds-icon"></span><span class="ds-icon"></span></div>
                  <div class="ds-brand-pill"><span class="ds-spark">✦</span>Calc SmartX</div>
                  <div class="ds-bar-right"><span class="ds-icon"></span><span class="ds-icon"></span></div>
                </div>
                <div class="ds-sheet">
                  <div class="ds-row">150.000 × 3</div>
                  <div class="ds-row">495.000 + 10%</div>
                  <div class="ds-row ds-row--cur">150.000 × 3 + 10%</div>
                </div>
                <div class="ds-expr">150.000 × 3 + 10% =</div>
                <div class="ds-result">495.000</div>
                <div class="ds-pad">
                  <span class="ds-k tool">∨</span><span class="ds-k">7</span><span class="ds-k">8</span><span class="ds-k">9</span><span class="ds-k op">÷</span>
                  <span class="ds-k tool">(</span><span class="ds-k">4</span><span class="ds-k">5</span><span class="ds-k">6</span><span class="ds-k op">×</span>
                  <span class="ds-k tool">)</span><span class="ds-k">1</span><span class="ds-k">2</span><span class="ds-k">3</span><span class="ds-k op">−</span>
                  <span class="ds-k tool">%</span><span class="ds-k">0</span><span class="ds-k">,</span><span class="ds-k">±</span><span class="ds-k op">+</span>
                  <span class="ds-k tool">xʸ</span><span class="ds-k" style="grid-column:span 2">⌫</span><span class="ds-k" style="visibility:hidden"></span><span class="ds-k op">=</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tablet / Foldable -->
          <div class="dev-frame dev-tablet" data-device="tablet">
            <div class="dev-shell">
              <div class="dev-screen">
                <div class="ds-bar">
                  <div class="ds-bar-left"><span class="ds-icon"></span><span class="ds-icon"></span></div>
                  <div class="ds-brand-pill"><span class="ds-spark">✦</span>Calc SmartX</div>
                  <div class="ds-bar-right"><span class="ds-icon"></span><span class="ds-icon"></span></div>
                </div>
                <div class="ds-sheet ds-sheet--wide">
                  <div class="ds-row">1.500.000 × 5</div>
                  <div class="ds-row">8.250.000 + 10%</div>
                  <div class="ds-row">8.250.000 ÷ 12</div>
                  <div class="ds-row ds-row--cur">1.500.000 × 5 + 10%</div>
                </div>
                <div class="ds-expr">1.500.000 × 5 + 10% =</div>
                <div class="ds-result">8.250.000</div>
                <div class="ds-pad ds-pad--wide">
                  <span class="ds-k tool">∨</span><span class="ds-k">7</span><span class="ds-k">8</span><span class="ds-k">9</span><span class="ds-k op">÷</span>
                  <span class="ds-k tool">(</span><span class="ds-k">4</span><span class="ds-k">5</span><span class="ds-k">6</span><span class="ds-k op">×</span>
                  <span class="ds-k tool">)</span><span class="ds-k">1</span><span class="ds-k">2</span><span class="ds-k">3</span><span class="ds-k op">−</span>
                  <span class="ds-k tool">%</span><span class="ds-k">0</span><span class="ds-k">,</span><span class="ds-k">±</span><span class="ds-k op">+</span>
                  <span class="ds-k tool">xʸ</span><span class="ds-k" style="grid-column:span 2">⌫</span><span class="ds-k" style="visibility:hidden"></span><span class="ds-k op">=</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>

  <section class="sec faq-sec" id="faq" aria-labelledby="h-faq">
    <div class="container">
      <div class="sec__head">
        <h2 id="h-faq">${esc(T.faq_h)}</h2>
      </div>
      <dl class="faq">${[1,2,3,4,5].map(i => `
        <div class="faq__item">
          <dt><button class="faq__q" aria-expanded="false">${esc(T['faq_'+i+'q'])}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></dt>
          <dd class="faq__a" hidden>${esc(T['faq_'+i+'a'])}</dd>
        </div>`).join('')}
      </dl>
    </div>
  </section>

  <section class="soon-sec" id="soon" aria-labelledby="h-soon">
    <div class="container">
      <div class="soon__panel">
        <div class="soon__icon"><img src="${up}static/logo.svg" alt="" width="72" height="72"></div>
        <div class="soon__body">
          <h2 id="h-soon">${esc(T.soon_h)}</h2>
          <p>${esc(T.soon_p)}</p>
          <form class="soon__form" action="https://formspree.io/f/xvgrzojn" method="POST" novalidate>
            <input type="email" name="email" required placeholder="your@email.com" autocomplete="email">
            <button type="submit" class="key key--primary">${esc(T.soon_btn)}</button>
          </form>
          <p class="soon__note">${esc(T.soon_note)}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="dl" aria-labelledby="h-dl">
    <div class="container">
      <div class="dl__panel">
        <div class="gfield" aria-hidden="true"></div>
        <h2 id="h-dl">${esc(T.soon_h)}</h2>
        <p>${esc(T.soon_p)}</p>
        <div class="dl__act"><img src="${up}static/logo.svg" alt="" width="88" height="88">
          <form class="soon__form soon__form--inline" action="https://formspree.io/f/xvgrzojn" method="POST" novalidate>
            <input type="email" name="email" required placeholder="your@email.com" autocomplete="email">
            <button type="submit" class="key key--primary">${esc(T.soon_btn)}</button>
          </form>
        </div>
      </div>
    </div>
  </section>
</main>

<footer class="foot">
  <div class="container">
    <div class="foot__mast">
      <a class="brand" href="${href(code, code)}"><img src="${up}static/logo.svg" alt="" width="48" height="48">Calc SmartX</a>
      <p>${esc(T.foot)}</p>
    </div>
    <div class="foot__row">
      <span>© 2026 Calc SmartX</span>
      <span>Android</span>
    </div>
  </div>
</footer>
<script src="${up}static/js/site.js" defer></script>
</body>
</html>
`;
}

// ---------- write dist ----------
const DIST = path.join(ROOT, 'dist');
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'static'), path.join(DIST, 'static'), { recursive: true, filter: (p) => !p.endsWith('.png') || /logo-512|apple-touch|og\.png/.test(p) });
for (const code of CODES) {
  const dir = code === DEFAULT ? DIST : path.join(DIST, code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(code));
}
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${CODES.map((c) => `<url><loc>${abs(c)}</loc>${CODES.map((d) => `<xhtml:link rel="alternate" hreflang="${SITE_T[d].html}" href="${abs(d)}"/>`).join('')}</url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// sanity checks: every language has every text and every clip
const missing = [];
for (const c of CODES) {
  for (const k of Object.keys(SITE_T[DEFAULT])) if (!SITE_T[c][k]) missing.push(`site.${c}.${k}`);
  for (const [, ids] of GROUPS) for (const id of ids) {
    if (!APP[c][id + 't'] || !APP[c][id + 'd']) missing.push(`app.${c}.${id}`);
    if (!fs.existsSync(path.join(ROOT, 'static/gif', `${c}-${id}.gif`))) missing.push(`gif ${c}-${id}`);
  }
  if (!fs.existsSync(path.join(ROOT, 'static/shots', `${c}.webp`))) missing.push(`shot ${c}`);
}
console.log(`built ${CODES.length} pages into dist/` + (missing.length ? `\nmissing (${missing.length}): ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ' …' : ''}` : ' – nothing missing'));
if (missing.length && process.env.CI) process.exit(1);
