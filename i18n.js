// FotoBox – Übersetzungen für Fotobox-App, Dashboard und Galerie (gleiche Datei in app-desktop/app/i18n.js)
// Die Oberfläche ist auf Deutsch geschrieben. Diese Datei übersetzt alles Sichtbare – Textknoten und die Attribute
// title, placeholder, aria-label, alt – anhand der Wörterbücher lang/<sprache>.js, auch was später per Skript
// dazukommt (MutationObserver). Schlüssel ist immer der deutsche Text.
//   I18N.t(text, lang)        – einen Text übersetzen (unbekannt = unverändert)
//   I18N.watch(root, langOf)  – Bereich übersetzen und beobachten; langOf(element) liefert die Sprache dafür
//   I18N.refresh()            – alles neu übersetzen (nach einem Sprachwechsel)
//   I18N.load(lang, base)     – Wörterbuch nachladen (Dashboard, Galerie) → Promise
//   I18N.flag(code, h)        – kleine Flagge als SVG (Windows zeigt keine Flaggen-Emojis)
// Regeln für Schlüssel: Zahlen im Text werden zu {0}, {1} … („noch {0} übrig“); {x}, {y}, {z} stehen für beliebigen
// Text, der unverändert übernommen wird (Namen: „Ereignis „{x}“ löschen?“). Teile mit „ · “ werden einzeln übersetzt.
// Elemente mit translate="no" (Namen, Kundendaten, Eingaben der Betreiber) bleiben unberührt.
(function (G) {
  'use strict';
  const LANGS = [
    { code: 'de', name: 'Deutsch', locale: 'de-DE' },
    { code: 'en', name: 'English', locale: 'en-GB' },
    { code: 'tr', name: 'Türkçe', locale: 'tr-TR' },
    { code: 'fr', name: 'Français', locale: 'fr-FR' },
    { code: 'es', name: 'Español', locale: 'es-ES' },
    { code: 'it', name: 'Italiano', locale: 'it-IT' }];
  const CODES = LANGS.map(l => l.code);
  const D = {}, P = {}, MEMO = {}; // Wörterbücher, Muster mit {x} und schon übersetzte Texte je Sprache
  const missing = new Set();       // zum Nachpflegen: Texte ohne Übersetzung (I18N.missing in der Konsole)
  const norm = s => String(s).replace(/\s+/g, ' ').trim();
  const reEsc = s => s.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
  const LETTER = /\p{L}/u, WORD = /\p{L}{2}/u, NUM = /\d+(?:[.,:/]\d+)*/g;

  function add(lang, dict) {
    const d = D[lang] || (D[lang] = new Map()), p = P[lang] || (P[lang] = []);
    for (const [k, v] of Object.entries(dict)) {
      if (typeof v !== 'string' || !v) continue;
      const nk = norm(k); d.set(nk, v);
      if (/\{[xyz]\}/.test(nk)) {
        const names = [];
        const re = new RegExp('^' + reEsc(nk).replace(/\\\{([xyz]|\d)\\\}/g, (_, n) => { names.push(n); return /\d/.test(n) ? '(\\d+(?:[.,:/]\\d+)*)' : '(.+?)'; }) + '$');
        p.push({ re, names, out: v });
      }
    }
    MEMO[lang] = new Map();
  }
  // {0} … nach Nummer; {x} mehrfach nach Reihenfolge (das erste {x} der Übersetzung bekommt das erste des Originals)
  const fill = (out, vals) => out.replace(/\{([xyz]|\d)\}/g, (m, n) => { const v = vals[n]; return Array.isArray(v) ? (v.length ? v.shift() : m) : v ?? m; });

  // Kern eines Textes ohne Symbole am Rand („📸 Tippen zum Starten“, „Weiter →“, „Lädt …“)
  const EDGE = /^([^\p{L}\p{N}]*)([\s\S]*?)([^\p{L}\p{N}.!?…%)]*)$/u;
  function core(s, lang, deep) {
    const d = D[lang];
    if (d.has(s)) return d.get(s);
    // Zahlen als Platzhalter
    const nums = []; const tpl = s.replace(NUM, m => '{' + (nums.push(m) - 1) + '}');
    if (nums.length && d.has(tpl)) return fill(d.get(tpl), nums);
    // Aufzählung mit Mittelpunkt: jeden Teil einzeln
    if (s.includes(' · ') && deep < 3) {
      const parts = s.split(' · '), out = parts.map(x => tr(x, lang, deep + 1));
      if (out.some((x, i) => x !== parts[i])) return out.join(' · ');
    }
    // „Bezeichnung: Wert“ – beide Seiten einzeln
    const ci = s.indexOf(': ');
    if (ci > 0 && deep < 3) {
      const a = s.slice(0, ci), b = s.slice(ci + 2), ta = tr(a, lang, deep + 1), tb = tr(b, lang, deep + 1);
      if (ta !== a || tb !== b) return ta + (lang === 'fr' ? ' : ' : ': ') + tb;
    }
    // Aufzählung mit Kommas – nur wenn kein mehrwortiges Stück deutsch bleibt
    if (s.includes(', ') && deep < 3) {
      const parts = s.split(', '), out = parts.map(x => tr(x, lang, deep + 1));
      if (out.some((x, i) => x !== parts[i]) && out.every((x, i) => x !== parts[i] || !/\s/.test(parts[i].trim()))) return out.join(', ');
    }
    // Muster mit beliebigem Text
    for (const p of P[lang]) {
      const m = p.re.exec(s); if (!m) continue;
      const vals = {}; p.names.forEach((n, i) => { (vals[n] ||= []).push(m[i + 1]); }); // Namen u. Ä. bleiben, wie sie sind
      return fill(p.out, vals);
    }
    // Notlösung für zusammengesetzte Texte („zuletzt “ + Datum): die Wortteile zwischen den Zahlen einzeln
    if (nums.length && deep < 2) {
      const parts = s.split(/(\d+(?:[.,:/]\d+)*)/);
      const piece = x => { const n = norm(x); if (d.has(n)) return x.replace(n, d.get(n)); const m = EDGE.exec(n); return m && m[2] && d.has(m[2]) ? x.replace(m[2], d.get(m[2])) : x; };
      const out = parts.map((x, i) => i % 2 || !WORD.test(x) ? x : piece(x));
      if (out.some((x, i) => x !== parts[i])) return out.join('');
    }
    return null;
  }
  // deutsche Anführungszeichen am Rand in die der Zielsprache
  const Q = { en: ['“', '”'], tr: ['“', '”'], fr: ['« ', ' »'], es: ['«', '»'], it: ['«', '»'] };
  const quotes = (s, lang) => Q[lang] ? s.replace(/[„“]/g, c => Q[lang][c === '„' ? 0 : 1]) : s;
  function tr(s, lang, deep = 0) {
    if (s == null || lang === 'de' || !D[lang]) return s;
    s = String(s); if (!LETTER.test(s)) return s;
    const memo = MEMO[lang] || (MEMO[lang] = new Map()); if (memo.has(s)) return memo.get(s);
    const lead = /^\s*/.exec(s)[0], trail = /\s*$/.exec(s)[0], whole = norm(s);
    let out = core(whole, lang, deep);
    if (out != null) out = lead + out + trail;
    else {
      const m = EDGE.exec(whole);
      if (m && m[2] && (m[1] || m[3])) { const c = core(m[2], lang, deep); if (c != null) out = lead + quotes(m[1], lang) + c + quotes(m[3], lang) + trail; }
    }
    if (out == null) { out = s; if (!deep && WORD.test(whole) && whole.length < 400) missing.add(whole); }
    memo.set(s, out); return out;
  }

  // ---------- Seite übersetzen ----------
  const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
  const SRC = new WeakMap();   // Textknoten → { src: deutscher Text, out: zuletzt gesetzt }
  const ASRC = new WeakMap();  // Element → { attr: { src, out } }
  const watched = [];
  const SKIP = /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT|CODE)$/;
  const skipEl = e => { for (; e; e = e.parentElement) if (SKIP.test(e.tagName) || e.getAttribute('translate') === 'no' || e.isContentEditable) return true; return false; };
  function doText(n, lang) {
    let r = SRC.get(n);
    if (!r || n.data !== r.out) { r = { src: n.data, out: n.data }; SRC.set(n, r); } // neu oder vom Programm geändert
    const out = lang === 'de' ? r.src : tr(r.src, lang);
    r.out = out; if (out !== n.data) n.data = out;
  }
  function doAttr(el, a, lang) {
    const v = el.getAttribute(a); if (v == null) return;
    let m = ASRC.get(el); if (!m) ASRC.set(el, m = {});
    let r = m[a]; if (!r || v !== r.out) r = m[a] = { src: v, out: v };
    if (!LETTER.test(r.src)) return;
    const out = lang === 'de' ? r.src : tr(r.src, lang);
    r.out = out; if (out !== v) el.setAttribute(a, out);
  }
  const accept = { acceptNode: n => n.nodeType === 1 && (SKIP.test(n.tagName) || n.getAttribute('translate') === 'no' || n.namespaceURI === 'http://www.w3.org/2000/svg') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT };
  function walk(root, langOf) {
    if (root.nodeType === 3) { if (LETTER.test(root.data) && !skipEl(root.parentElement)) doText(root, langOf(root.parentElement)); return; }
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && (skipEl(root) || root.namespaceURI === 'http://www.w3.org/2000/svg')) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, accept);
    for (let n = root; n; n = tw.nextNode()) {
      if (n.nodeType === 3) { if (LETTER.test(n.data)) doText(n, langOf(n.parentElement)); }
      else if (n.nodeType === 1) for (const a of ATTRS) if (n.hasAttribute(a)) doAttr(n, a, langOf(n));
    }
  }
  const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(list => {
    for (const m of list) {
      const w = watched.find(w => w.root.contains(m.target)); if (!w) continue;
      if (m.type === 'childList') m.addedNodes.forEach(n => walk(n, w.langOf));
      else if (m.type === 'characterData') {
        const n = m.target, r = SRC.get(n);
        if ((!r || n.data !== r.out) && LETTER.test(n.data) && !skipEl(n.parentElement)) doText(n, w.langOf(n.parentElement));
      } else if (m.type === 'attributes') {
        const el = m.target, r = ASRC.get(el)?.[m.attributeName];
        if ((!r || el.getAttribute(m.attributeName) !== r.out) && !skipEl(el)) doAttr(el, m.attributeName, w.langOf(el));
      }
    }
  }) : null;
  function watch(root, langOf) {
    watched.push({ root, langOf });
    mo?.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    walk(root, langOf);
  }
  const refresh = () => watched.forEach(w => walk(w.root, w.langOf));

  // Wörterbuch nachladen (Dashboard und Galerie laden nur die gewählte Sprache)
  const loading = {};
  function load(lang, base = '') {
    if (lang === 'de' || D[lang] || !CODES.includes(lang)) return Promise.resolve();
    return loading[lang] || (loading[lang] = new Promise(res => {
      const s = document.createElement('script'); s.src = base + 'lang/' + lang + '.js?v=' + (G.I18N_V || '1');
      s.onload = s.onerror = () => res(); document.head.appendChild(s);
    }));
  }
  // Sprache des Browsers bzw. Windows, falls unterstützt
  const guess = (fallback = 'en') => { for (const l of (navigator.languages || [navigator.language || ''])) { const c = String(l).slice(0, 2).toLowerCase(); if (CODES.includes(c)) return c; } return fallback; };

  // ---------- Flaggen ----------
  let fid = 0;
  const FLAG = {
    de: () => '<path fill="#000" d="M0 0h30v6.67H0z"/><path fill="#D00" d="M0 6.67h30v6.66H0z"/><path fill="#FFCE00" d="M0 13.33h30V20H0z"/>',
    fr: () => '<path fill="#0055A4" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#EF4135" d="M20 0h10v20H20z"/>',
    it: () => '<path fill="#009246" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#CE2B37" d="M20 0h10v20H20z"/>',
    es: () => '<path fill="#AA151B" d="M0 0h30v20H0z"/><path fill="#F1BF00" d="M0 5h30v10H0z"/>',
    tr: () => '<path fill="#E30A17" d="M0 0h30v20H0z"/><circle cx="10.6" cy="10" r="5" fill="#fff"/><circle cx="11.85" cy="10" r="4" fill="#E30A17"/>'
      + '<polygon fill="#fff" points="13.90,10.00 15.63,9.44 15.63,7.62 16.70,9.09 18.42,8.53 17.35,10.00 18.42,11.47 16.70,10.91 15.63,12.38 15.63,10.56"/>',
    en: () => { const id = 'uk' + (++fid); return `<clipPath id="${id}"><path d="M15 10h15v10zv10h-15zh-15v-10zv-10h15z"/></clipPath><path fill="#012169" d="M0 0h30v20H0z"/>`
      + `<path stroke="#fff" stroke-width="4" d="M0 0l30 20M30 0L0 20"/><path stroke="#C8102E" stroke-width="2.4" clip-path="url(#${id})" d="M0 0l30 20M30 0L0 20"/>`
      + '<path stroke="#fff" stroke-width="6.6" d="M15 0v20M0 10h30"/><path stroke="#C8102E" stroke-width="4" d="M15 0v20M0 10h30"/>'; }
  };
  const flag = (code, h = 20) => `<svg class="i18n-flag" width="${Math.round(h * 1.5)}" height="${h}" viewBox="0 0 30 20" aria-hidden="true" style="border-radius:${Math.max(2, h * .12)}px;display:inline-block;vertical-align:middle;flex:none">${(FLAG[code] || FLAG.de)()}</svg>`;

  // Gestalteter Bildschirm (Layout) in einer Sprache: Texte und Start-Knopf übersetzt, alles andere bleibt (Kopie)
  const ONLY_PH = /^\s*(\{\w+\}\s*)*$/;
  function layout(L, lang) {
    if (!L || !Array.isArray(L.elements) || lang === 'de' || !D[lang]) return L;
    let changed = false;
    const els = L.elements.map(e => {
      if ((e.type !== 'text' && e.type !== 'button' && e.type !== 'sbtn') || !e.text || ONLY_PH.test(e.text)) return e;
      const t = String(e.text).split('\n').map(l => tr(l, lang)).join('\n');
      if (t === e.text) return e; changed = true; return { ...e, text: t };
    });
    return changed ? { ...L, elements: els } : L;
  }
  const info = code => LANGS.find(l => l.code === code) || LANGS[0];
  G.I18N = { LANGS, CODES, add, t: tr, watch, refresh, load, guess, flag, info, layout, missing, has: lang => lang === 'de' || !!D[lang] };
})(typeof window !== 'undefined' ? window : globalThis);
