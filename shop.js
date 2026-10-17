// Photobox Memories – Foto-Shop auf der Fotoseite der Gäste (QR-Code an der Fotobox): Druckprodukte über Gelato oder
// Printful, Bezahlung über Stripe. Einstellungen pflegt der Betreiber im Dashboard (Verwaltung → Foto-Shop); gespeichert als
// photos/<Konto>/shop.json. Preise und Produkte prüft der Server (Funktion photo-shop) selbst – hier nur Pflege und Anzeige.
// normalize() gibt es gleich noch einmal in supabase/functions/photo-shop/index.ts – immer beide ändern.
(function (G) {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cut = (s, n) => String(s ?? '').trim().slice(0, n);
  const TYPES = [['mug', 'Tasse'], ['magnet', 'Magnet'], ['mousepad', 'Mauspad'], ['canvas', 'Leinwand'], ['poster', 'Poster'], ['print', 'Fotoabzug']];
  // Druckdienste: Gelato braucht die „Product UID“, Printful die Varianten-ID (Zahl)
  const PROVIDERS = [['gelato', 'Gelato'], ['printful', 'Printful']];
  const MODES = [['off', 'Aus'], ['test', 'Test (nur über den Test-Link sichtbar)'], ['live', 'Live (alle Gäste sehen den Shop)']];
  // Vorschläge (Kataloge geprüft am 17.10.2026). Gelato hat keine Magnete und Mauspads, deshalb kommen die von Printful.
  // Kosten ohne MwSt.: Tasse (Gelato) 4,43 € + 4,49 € Versand; Mauspad 22×18 cm (Printful, gedruckt in Lettland) 9,75 $;
  // Magnet 10×10 cm (Printful, nur aus den USA – längere Lieferung, deshalb ausgeschaltet) 3,91 $.
  const DEFAULTS = [
    { id: 'mug', type: 'mug', provider: 'gelato', name: 'Fototasse', cents: 1990, uid: 'mug_product_msz_11-oz_mmat_ceramic-white_cl_4-0' },
    { id: 'mousepad', type: 'mousepad', provider: 'printful', name: 'Mauspad', cents: 2490, uid: '13097' },
    { id: 'magnet', type: 'magnet', provider: 'printful', name: 'Fotomagnet 10 × 10 cm', cents: 1290, uid: '16367', on: false }
  ];
  const UID = { gelato: /^[a-z0-9][a-z0-9_.-]{4,199}$/i, printful: /^\d{1,9}$/ };
  const httpUrl = u => {
    u = cut(u, 300); if (!u) return '';
    try { const x = new URL(/^https?:\/\//i.test(u) ? u : 'https://' + u); return /^https?:$/.test(x.protocol) && x.hostname.includes('.') ? x.href : ''; } catch { return ''; }
  };
  const money = (v, min, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= min && n <= max ? n : null; };

  // gespeicherte Einstellungen in eine sichere, einheitliche Form bringen
  function normalize(c) {
    const o = c && typeof c === 'object' ? c : {};
    const seen = new Set();
    const products = (Array.isArray(o.products) ? o.products : DEFAULTS).slice(0, 16).map((p, i) => {
      let id = /^[a-z0-9-]{1,30}$/.test(String(p?.id)) ? String(p.id) : 'p' + i;
      while (seen.has(id)) id += 'x'; seen.add(id);
      const type = TYPES.some(t => t[0] === p?.type) ? p.type : 'mug';
      const provider = p?.provider === 'printful' ? 'printful' : 'gelato', uid = cut(p?.uid, 200);
      return { id, type, provider, name: cut(p?.name, 60) || TYPES.find(t => t[0] === type)[1], cents: money(p?.cents, 100, 100000) ?? 0, uid: UID[provider].test(uid) ? uid : '', on: p?.on !== false };
    });
    const countries = [...new Set(String(o.countries ?? 'DE, AT').toUpperCase().split(/[^A-Z]+/).filter(x => /^[A-Z]{2}$/.test(x)))].slice(0, 40);
    const l = o.legal || {};
    return {
      mode: MODES.some(m => m[0] === o.mode) ? o.mode : 'off', seller: cut(o.seller, 80), ship: money(o.ship, 0, 10000) ?? 590,
      countries: countries.length ? countries : ['DE'],
      legal: { agb: httpUrl(l.agb), privacy: httpUrl(l.privacy), imprint: httpUrl(l.imprint), withdrawal: httpUrl(l.withdrawal) },
      products
    };
  }
  const legalOk = c => !!(c.legal.agb && c.legal.privacy && c.legal.imprint);
  const active = c => c.products.filter(p => p.on && p.uid && p.cents >= 100);
  const price = (cents, locale) => (cents / 100).toLocaleString(locale || 'de-DE', { style: 'currency', currency: 'EUR' });
  const path = owner => `${owner}/shop.json`;

  // Vorschau des Produkts mit dem Foto des Gastes (nur CSS, das Foto wird nicht verändert). land = Querformat
  function mockup(type, src, land) {
    const u = esc(src), o = land ? 'l' : 'p';
    if (type === 'mug') return `<div class="mk mk-mug"><div class="mug"><i class="hd"></i><div class="mp" style="background-image:url('${u}')"></div></div></div>`;
    if (type === 'canvas') return `<div class="mk mk-canvas"><div class="cv ${o}"><img src="${u}" alt=""></div></div>`;
    if (type === 'print') return `<div class="mk mk-print"><div class="pc ${o} back"></div><div class="pc ${o}"><img src="${u}" alt=""></div></div>`;
    if (type === 'magnet') return `<div class="mk mk-magnet"><div class="mg"><img src="${u}" alt=""></div></div>`;
    if (type === 'mousepad') return `<div class="mk mk-pad"><div class="pad" style="background-image:url('${u}')"></div></div>`;
    return `<div class="mk mk-poster"><div class="fr ${o}"><img src="${u}" alt=""></div></div>`;
  }
  const CSS = `.mk{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:12px;background:linear-gradient(180deg,#f3efe7 0%,#e8e2d6 78%,#d9d1c2 78%,#cfc6b5 100%)}
.mk img{display:block;width:100%;object-fit:cover}
.mk .p img{aspect-ratio:2/3}.mk .l img{aspect-ratio:3/2}
.mk-poster .fr{background:#fff;padding:4%;box-shadow:0 6px 14px rgba(0,0,0,.28)}
.mk-poster .fr.p{width:50%}.mk-poster .fr.l{width:74%}
.mk-canvas{background:linear-gradient(180deg,#eceae6 0%,#dedbd5 78%,#c9c3b8 78%,#bdb6aa 100%)}
.mk-canvas .cv{transform:perspective(500px) rotateY(-16deg);box-shadow:5px 0 0 #6d6a66,7px 2px 0 #55524e,14px 14px 18px rgba(0,0,0,.3)}
.mk-canvas .cv.p{width:50%}.mk-canvas .cv.l{width:72%}
.mk-mug{background:radial-gradient(90% 70% at 50% 30%,#fbfaf7,#e4dfd5)}
.mk-mug .mug{position:relative;width:46%;aspect-ratio:.86;margin-right:12%;background:linear-gradient(90deg,#dedede,#fff 28%,#fff 60%,#cfcfcf);border-radius:5% 5% 12% 12%/4% 4% 9% 9%;box-shadow:0 12px 16px -6px rgba(0,0,0,.35)}
.mk-mug .mp{position:absolute;left:12%;right:12%;top:16%;bottom:16%;background:center/cover no-repeat;border-radius:3px;box-shadow:inset -10px 0 14px rgba(0,0,0,.18),inset 8px 0 10px rgba(255,255,255,.25)}
.mk-mug .hd{position:absolute;left:90%;top:20%;width:36%;height:48%;border:clamp(6px,2.4vw,11px) solid #f2f2f2;border-left:0;border-radius:0 48% 48% 0;box-shadow:3px 4px 6px rgba(0,0,0,.22),inset -2px -2px 3px rgba(0,0,0,.14)}
.mk-print{background:linear-gradient(160deg,#d8c8ad,#b99e78)}
.mk-print .pc{position:absolute;background:#fff;padding:3.5% 3.5% 10%;box-shadow:0 5px 12px rgba(0,0,0,.3);transform:rotate(-5deg)}
.mk-print .pc.p{width:46%}.mk-print .pc.l{width:66%}
.mk-print .pc.back{transform:rotate(7deg) translate(9%,3%);height:56%;background:#f4f4f4}
.mk-print .pc.l.back{height:44%}
.mk-magnet{background:linear-gradient(90deg,#e4e6e8,#f7f8f9 45%,#dfe2e5)}
.mk-magnet .mg{width:56%;aspect-ratio:1;border-radius:10%;overflow:hidden;box-shadow:0 2px 0 #9aa0a6,0 8px 14px rgba(0,0,0,.28)}
.mk-magnet .mg img{height:100%}
.mk-pad{background:linear-gradient(180deg,#d9d4cc,#c9c2b6)}
.mk-pad .pad{width:74%;aspect-ratio:22/18;border-radius:7%;background:center/cover no-repeat;transform:perspective(520px) rotateX(38deg);box-shadow:0 2px 0 #2b2b2b,0 3px 0 #1d1d1b,0 16px 18px rgba(0,0,0,.28)}`;
  let cssDone = false;
  function addCss(doc = document) { if (cssDone && doc === document) return; const s = doc.createElement('style'); s.textContent = CSS; doc.head.appendChild(s); if (doc === document) cssDone = true; }

  G.PM_SHOP = { TYPES, MODES, PROVIDERS, DEFAULTS, normalize, legalOk, active, price, path, mockup, addCss, esc };
})(typeof window !== 'undefined' ? window : globalThis);
