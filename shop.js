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
  // Umsatzsteuer auf Bezahlseite und Rechnung: 19 % in den Preisen enthalten, oder Kleinunternehmer ohne Ausweis
  const VATS = [[19, '19 % MwSt. (in den Preisen enthalten)'], [0, 'Kleinunternehmer (§ 19 UStG, ohne MwSt.)']];
  // Vorschläge (Kataloge geprüft am 17.10.2026). Alle über Printful, weil der Server dort genau angeben kann, wo das
  // Original-Foto auf der Druckfläche sitzt. Kosten ohne MwSt.: Tasse 11 oz 6,75 $ (gedruckt in Spanien/Lettland),
  // Mauspad 22×18 cm 9,75 $ (Lettland), Magnet 10×10 cm 3,91 $ (nur USA – längere Lieferung, deshalb ausgeschaltet).
  // Gelato geht weiterhin (Druckdienst umstellen), dort platziert Gelato das Foto aber selbst.
  const DEFAULTS = [
    { id: 'mug', type: 'mug', provider: 'printful', name: 'Fototasse', cents: 1990, uid: '1320', side: 'left' },
    { id: 'mousepad', type: 'mousepad', provider: 'printful', name: 'Mauspad', cents: 2490, uid: '13097' },
    { id: 'magnet', type: 'magnet', provider: 'printful', name: 'Fotomagnet 10 × 10 cm', cents: 1290, uid: '16367', on: false }
  ];
  // Tasse: auf welcher Hälfte der Druckfläche das Foto sitzt
  const SIDES = [['left', 'linke Hälfte (Rechtshänder)'], ['right', 'rechte Hälfte (Linkshänder)']];
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
      return { id, type, provider, name: cut(p?.name, 60) || TYPES.find(t => t[0] === type)[1], cents: money(p?.cents, 100, 100000) ?? 0, uid: UID[provider].test(uid) ? uid : '', on: p?.on !== false, side: p?.side === 'right' ? 'right' : 'left' };
    });
    const countries = [...new Set(String(o.countries ?? 'DE, AT').toUpperCase().split(/[^A-Z]+/).filter(x => /^[A-Z]{2}$/.test(x)))].slice(0, 40);
    const l = o.legal || {};
    return {
      mode: MODES.some(m => m[0] === o.mode) ? o.mode : 'off', seller: cut(o.seller, 80), ship: money(o.ship, 0, 10000) ?? 590, vat: Number(o.vat) === 0 ? 0 : 19,
      countries: countries.length ? countries : ['DE'],
      legal: { agb: httpUrl(l.agb), privacy: httpUrl(l.privacy), imprint: httpUrl(l.imprint), withdrawal: httpUrl(l.withdrawal) },
      products
    };
  }
  const legalOk = c => !!(c.legal.agb && c.legal.privacy && c.legal.imprint);
  const active = c => c.products.filter(p => p.on && p.uid && p.cents >= 100);
  const price = (cents, locale) => (cents / 100).toLocaleString(locale || 'de-DE', { style: 'currency', currency: 'EUR' });
  const path = owner => `${owner}/shop.json`;

  // ---------- Echte Produktfotos: leere Tasse / leeres Mauspad (Printful-Katalog) mit dem Foto des Gastes darauf ----------
  // Maße in den Fotos (Pixel): Tasse 700 × 1000, Henkel links, Körper x 213–600 (Mitte 406,5, Radius 193,5), Druckband
  // (3,5" der 3,8" hohen Tasse) oben 288 / unten 741 in der Mitte, Wölbung der Linien oben −13 / unten +22.
  // Mauspad 875 × 1000, Fläche x 42–833, y 176–823, Ecken-Radius 48. Das Gästefoto wird nur gezeichnet, nie ausgelesen –
  // so geht es auch mit Fotos von anderen Servern (keine CORS-Freigabe nötig).
  const REAL = { mug: { src: 'bilder/produkt-tasse.jpg', A: 9 / 3.5 }, mousepad: { src: 'bilder/produkt-mauspad.jpg', A: 8.7 / 7.1 } };
  const IMGS = {};
  const loadImg = src => IMGS[src] || (IMGS[src] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => { delete IMGS[src]; rej(new Error('Bild nicht geladen')); }; i.src = src; }));
  // Wo das Foto ohne eigene Platzierung sitzt (wie im Bestellfenster): Tasse volle Höhe auf einer Hälfte, Mauspad füllend
  function defaultPlace(type, ia, A, side) {
    if (type === 'mug') { let h = 1, w = ia / A; if (w > .625) { w = .625; h = w * A / ia; } const cx = side === 'right' ? .75 : .25; return { x: Math.min(1 - w, Math.max(0, cx - w / 2)), y: (1 - h) / 2, w }; }
    const w = Math.max(1, ia / A), h = w * A / ia; return { x: (1 - w) / 2, y: h > 1 ? 0 : (1 - h) / 2, w }; // zu hohe Fotos oben ausgerichtet – Köpfe bleiben drauf
  }
  function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  // Zeichnet das Produktfoto in die Leinwand cv (quadratisch). opts: side (Tasse: linke/rechte Hälfte), place {x,y,w}, area [B,H]
  async function drawReal(cv, type, src, { side = 'left', place = null, area = null } = {}) {
    const R = REAL[type]; if (!R) return;
    const [base, ph] = await Promise.all([loadImg(R.src), loadImg(src)]);
    const A = area && area[0] > 0 && area[1] > 0 ? area[0] / area[1] : R.A, iw = ph.naturalWidth, ih = ph.naturalHeight, ia = iw / ih;
    const P = place || defaultPlace(type, ia, A, side), pH = P.w * A / ia, S = cv.width, x = cv.getContext('2d');
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over';
    const g = x.createRadialGradient(S * .5, S * .36, S * .05, S * .5, S * .55, S * .8); g.addColorStop(0, '#fdfcf9'); g.addColorStop(1, '#e6e0d4');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    if (type === 'mug') {
      // Henkel rechts = linke Hälfte der Druckfläche zeigt nach vorn (wie im Bestellfenster); das Foto selbst wird nie gespiegelt
      const flip = side !== 'right', k = S / 700, oy = 150, cx = (flip ? 700 - 406.5 : 406.5), r = 193.5, yT = 288 - oy, H = 741 - 288, kT = -13, kB = 22, u0 = side === 'right' ? .5 : 0;
      x.globalCompositeOperation = 'multiply';
      x.save(); if (flip) { x.translate(S, 0); x.scale(-1, 1); } x.drawImage(base, 0, oy, 700, 700, 0, 0, S, S); x.restore();
      const v0 = Math.max(0, P.y), v1 = Math.min(1, P.y + pH);
      if (v1 > v0) for (let X = Math.ceil((cx - r) * k); X < (cx + r) * k; X++) {
        const s = Math.max(-.999, Math.min(.999, (X / k - cx) / r)), th = Math.asin(s), c = Math.cos(th), u = u0 + .5 * (th / Math.PI + .5);
        if (u < P.x || u > P.x + P.w) continue;
        const sx = (u - P.x) / P.w * iw, sw = Math.max(1, .5 / Math.PI / (r * k * Math.max(.05, c)) / P.w * iw);
        const top = (yT + kT * c) * k, span = (H + (kB - kT) * c) * k;
        x.drawImage(ph, Math.min(iw - sw, sx), (v0 - P.y) / pH * ih, sw, (v1 - v0) / pH * ih, X, top + v0 * span, 1.5, (v1 - v0) * span);
      }
      // Glanz der Keramik (Licht kommt im Foto von der Henkel-Seite): schmaler heller Streifen über dem Druck
      x.globalCompositeOperation = 'screen';
      const gx = (cx + (flip ? .55 : -.55) * r) * k, gw = r * .16 * k, gl = x.createLinearGradient(gx - gw, 0, gx + gw, 0);
      gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.5, 'rgba(255,255,255,.32)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gl; x.fillRect(gx - gw, (yT - 10) * k, gw * 2, (H + 40) * k);
      const g2x = (cx + (flip ? -.2 : .2) * r) * k, g2 = x.createLinearGradient(g2x - gw * 2, 0, g2x + gw * 2, 0);
      g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(.5, 'rgba(255,255,255,.1)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g2; x.fillRect(g2x - gw * 2, (yT - 10) * k, gw * 4, (H + 40) * k);
    } else {
      // Mauspad: leicht gedreht auf dem Tisch, weicher Schatten, Stoffstruktur aus dem Produktfoto, darauf das Foto
      const w = S * .8, h = w * 647 / 791, rad = w * 48 / 791;
      x.translate(S / 2, S * .5); x.rotate(-.07);
      x.save(); x.shadowColor = 'rgba(40,30,15,.32)'; x.shadowBlur = S * .045; x.shadowOffsetY = S * .022; x.fillStyle = '#f2f2f2'; roundRect(x, -w / 2, -h / 2, w, h, rad); x.fill(); x.restore();
      x.save(); roundRect(x, -w / 2, -h / 2, w, h, rad); x.clip();
      x.drawImage(base, 42, 176, 791, 647, -w / 2, -h / 2, w, h);
      x.globalCompositeOperation = 'multiply'; x.drawImage(ph, -w / 2 + P.x * w, -h / 2 + P.y * h, P.w * w, pH * h);
      x.globalCompositeOperation = 'soft-light'; const sh = x.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      sh.addColorStop(0, 'rgba(255,255,255,.35)'); sh.addColorStop(.6, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.18)');
      x.fillStyle = sh; x.fillRect(-w / 2, -h / 2, w, h); x.restore();
      x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = Math.max(1, S * .004); roundRect(x, -w / 2, -h / 2, w, h, rad); x.stroke();
    }
    x.restore();
  }
  let mkId = 0;
  // Vorschau des Produkts mit dem Foto des Gastes. Tasse/Mauspad: echtes Produktfoto (wird gleich danach gezeichnet),
  // sonst nur CSS. land = Querformat; opts wie bei drawReal
  function mockup(type, src, land, opts = {}) {
    const u = esc(src), o = land ? 'l' : 'p';
    if (REAL[type]) {
      const id = 'pmk' + (++mkId);
      const paint = (n = 0) => { const c = document.getElementById(id); if (c) drawReal(c, type, src, opts).catch(() => {}); else if (n < 20) requestAnimationFrame(() => paint(n + 1)); };
      requestAnimationFrame(() => paint());
      return `<div class="mk mk-real"><canvas id="${id}" width="640" height="640"></canvas></div>`;
    }
    if (type === 'mug') return `<div class="mk mk-mug"><div class="mug"><i class="hd"></i><div class="mp" style="background-image:url('${u}')"></div></div></div>`;
    if (type === 'canvas') return `<div class="mk mk-canvas"><div class="cv ${o}"><img src="${u}" alt=""></div></div>`;
    if (type === 'print') return `<div class="mk mk-print"><div class="pc ${o} back"></div><div class="pc ${o}"><img src="${u}" alt=""></div></div>`;
    if (type === 'magnet') return `<div class="mk mk-magnet"><div class="mg"><img src="${u}" alt=""></div></div>`;
    if (type === 'mousepad') return `<div class="mk mk-pad"><div class="pad" style="background-image:url('${u}')"></div></div>`;
    return `<div class="mk mk-poster"><div class="fr ${o}"><img src="${u}" alt=""></div></div>`;
  }
  const CSS = `.mk{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:12px;background:linear-gradient(180deg,#f3efe7 0%,#e8e2d6 78%,#d9d1c2 78%,#cfc6b5 100%)}
.mk img{display:block;width:100%;object-fit:cover}
.mk-real{background:#efeae1}.mk-real canvas{display:block;width:100%;height:100%}
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

  G.PM_SHOP = { TYPES, MODES, VATS, PROVIDERS, SIDES, DEFAULTS, normalize, legalOk, active, price, path, mockup, drawReal, addCss, esc };
})(typeof window !== 'undefined' ? window : globalThis);
