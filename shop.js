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
  // Tasse: auf welcher Hälfte der Druckfläche das Foto ohne eigene Wahl sitzt (Gäste schalten im Bestellfenster „Henkel links/rechts“ um)
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
  const MUG = { W: 700, oy: 150, cx: 406.5, r: 193.5, yT: 288, yB: 741, kT: -13, kB: 22 }; // oy: gezeigt wird der Ausschnitt 700 × 700 ab dieser Höhe
  const IMGS = {};
  const loadImg = src => IMGS[src] || (IMGS[src] = new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => { delete IMGS[src]; rej(new Error('Bild nicht geladen')); }; i.src = src; }));
  // Tasse (Annahme nach der Printful-Vorlage, bitte mit einem Testauftrag bestätigen): Die Druckfläche geht einmal um die
  // Tasse, ihre RÄNDER (u = 0 und u = 1) liegen am Henkel, die Mitte (u = 0,5) gegenüber. Steht der Henkel links im Bild,
  // sieht man die linke Hälfte (Mitte u = 0,25 – so sehen andere die Tasse, wenn ein Rechtshänder trinkt), Henkel rechts
  // zeigt die rechte Hälfte (u = 0,75). view = u in der Bildmitte. Die Fläche reicht nicht ganz um die Tasse: wrap() ist der
  // Anteil des Umfangs, bei dem das Foto auf dem Druckband unverzerrt erscheint (11-oz-Tasse ≈ 0,96, der Rest liegt am Henkel).
  const wrap = A => Math.min(1, A * (MUG.yB - MUG.yT) / (2 * Math.PI * MUG.r));
  const viewOf = side => typeof side === 'number' ? side : side === 'right' ? .75 : .25;
  const FRONT = 140 / 360; // Tasse „Vorderseite“: so viel vom Umfang bedeckt das Foto
  // Lage begrenzen, je Richtung: Ist das Foto kleiner als die Fläche, bleibt es ganz darauf; ist es größer, bedeckt es sie ganz.
  const keep = (pos, size) => Math.min(Math.max(0, 1 - size), Math.max(Math.min(0, 1 - size), pos));
  // Vorlagen je Produkt – eine Quelle für Bestellfenster, Produktkarten und Standardlage; die erste ist der Standard.
  // ia: Seitenverhältnis des Fotos, A: der Druckfläche, view: Tasse (siehe oben). fill: Die Fläche (Tasse: die volle Höhe)
  // bleibt immer bedeckt, sonst bleibt das ganze Foto auf der Fläche. min/max: erlaubte Breite (Zoom) in dieser Vorlage.
  // Die Namen sind deutsch, das Bestellfenster übersetzt sie.
  function presets(type, ia, A, view = .25) {
    const wH = ia / A, hOf = w => w / wH, mid = (w, cx = .5) => ({ x: keep(cx - w / 2, w), y: keep((1 - hOf(w)) / 2, hOf(w)), w });
    if (type === 'mug') {
      const fw = Math.min(wH, 1, FRONT / wrap(A)); // nie höher als das Druckband
      const front = { id: 'front', name: 'Vorderseite', fill: false, place: mid(fw, view), min: fw / 3, max: Math.min(1, wH) };
      // Hoch- und Quadratfotos haben schon als „Vorderseite“ die volle Höhe – „Groß“ sähe genauso aus: nur eine Vorlage, Zoom bis 3-fach
      if (fw >= wH - 1e-9) return [{ ...front, max: wH * 3 }];
      return [front, { id: 'big', name: 'Groß', fill: true, place: mid(wH, view), min: wH, max: wH * 3 }];
    }
    const cw = Math.max(1, wH), fw = Math.min(1, wH);
    // Foto mit genau dem Seitenverhältnis der Fläche: „Füllen“ = „Ganzes Foto“ – nur eine Vorlage
    if (cw - fw < 1e-6) return [{ id: 'fill', name: 'Füllen', fill: true, place: { x: 0, y: 0, w: 1 }, min: 1 / 3, max: 3 }];
    return [{ id: 'fill', name: 'Füllen', fill: true, place: { x: (1 - cw) / 2, y: hOf(cw) > 1 ? 0 : (1 - hOf(cw)) / 2, w: cw }, min: cw, max: cw * 3 }, // zu hohe Fotos oben ausgerichtet – Köpfe bleiben drauf
      { id: 'fit', name: 'Ganzes Foto', fill: false, place: mid(fw), min: fw / 3, max: fw }];
  }
  // Wo das Foto ohne eigene Platzierung sitzt: die Standard-Vorlage (Tasse „Vorderseite“, sonst „Füllen“).
  // side: 'left'/'right' (Einstellung des Betreibers) oder gleich view als Zahl
  const defaultPlace = (type, ia, A, side) => ({ ...presets(type, ia, A, viewOf(side))[0].place });
  // Geometrie der Vorschau in Anteilen der Leinwand (0…1): at(X, Y) → [u, v] auf der Druckfläche (Verschieben mit dem Finger),
  // xy(u, v) → [X, Y] (Hilfslinien). real = mit echtem Produktfoto, sonst nur die flache Druckfläche.
  function geom(type, A, view = .25, real = true) {
    if (real && type === 'mug') {
      const f = wrap(A), flip = view >= .5, cx = (flip ? MUG.W - MUG.cx : MUG.cx) / MUG.W, r = MUG.r / MUG.W;
      const band = c => [(MUG.yT - MUG.oy + MUG.kT * c) / MUG.W, (MUG.yB - MUG.yT + (MUG.kB - MUG.kT) * c) / MUG.W]; // obere Kante, Höhe
      // Winkel auf dem Zylinder; zum Rand hin geradlinig weiter, damit das Foto auch neben der Tasse dem Finger folgt
      const ang = s => Math.abs(s) <= .9 ? Math.asin(s) : Math.sign(s) * (Math.asin(.9) + (Math.abs(s) - .9) / Math.sqrt(.19));
      return { kind: 'mug', f, flip, cx, r, band, vis: [view - 1 / (4 * f), view + 1 / (4 * f)],
        at: (X, Y) => { const s = (X - cx) / r, [t, h] = band(Math.sqrt(Math.max(0, 1 - s * s))); return [view + ang(s) / (2 * Math.PI * f), (Y - t) / h]; },
        xy: (u, v) => { const th = (u - view) * 2 * Math.PI * f, [t, h] = band(Math.cos(th)); return [cx + r * Math.sin(th), t + v * h]; } };
    }
    if (real && type === 'mousepad') { // leicht gedreht auf dem Tisch
      const w = .8, h = w * 647 / 791, co = Math.cos(.07), si = Math.sin(.07);
      return { kind: 'mousepad', w, h,
        at: (X, Y) => { const dx = X - .5, dy = Y - .5; return [(dx * co - dy * si) / w + .5, (dx * si + dy * co) / h + .5]; },
        xy: (u, v) => { const px = (u - .5) * w, py = (v - .5) * h; return [.5 + px * co + py * si, .5 - px * si + py * co]; } };
    }
    const w = A >= 1 ? .84 : .84 * A, h = w / A, x0 = (1 - w) / 2, y0 = (1 - h) / 2;
    return { kind: 'flat', box: [x0, y0, w, h], at: (X, Y) => [(X - x0) / w, (Y - y0) / h], xy: (u, v) => [x0 + u * w, y0 + v * h] };
  }
  function roundRect(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  // Zeichnet das Produkt mit dem Foto sofort in die Leinwand cv (quadratisch); die Bilder sind schon geladen, ph darf auch eine
  // verkleinerte Leinwand sein. base: leeres Produktfoto – ohne (Magnet, Poster … oder nicht geladen) die flache Druckfläche.
  // opts: view (Tasse, siehe oben) oder wie bisher side, place {x,y,w}, area [B,H], guides {u, v} (Hilfslinien an diesen
  // Stellen der Fläche), ghost (Teile des Fotos außerhalb der Fläche blass zeigen – beim Verschieben)
  function paint(cv, type, base, ph, { side = 'left', view, place = null, area = null, guides = null, ghost = false } = {}) {
    const R = REAL[type], real = !!(R && base), A = area && area[0] > 0 && area[1] > 0 ? area[0] / area[1] : R ? R.A : 1;
    const V = view ?? viewOf(side), iw = ph.naturalWidth || ph.width, ih = ph.naturalHeight || ph.height, ia = iw / ih;
    const P = place || defaultPlace(type, ia, A, V), pH = P.w * A / ia, S = cv.width, x = cv.getContext('2d'), G = geom(type, A, V, real);
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
    const g = x.createRadialGradient(S * .5, S * .36, S * .05, S * .5, S * .55, S * .8); g.addColorStop(0, '#fdfcf9'); g.addColorStop(1, '#e6e0d4');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    if (G.kind === 'mug') {
      // Im Produktfoto steht der Henkel links; für „Henkel rechts“ wird es gespiegelt – das Foto des Gastes nie
      const { f, flip, cx, r, band } = G;
      x.globalCompositeOperation = 'multiply';
      x.save(); if (flip) { x.translate(S, 0); x.scale(-1, 1); } x.drawImage(base, 0, MUG.oy, MUG.W, MUG.W, 0, 0, S, S); x.restore();
      const v0 = Math.max(0, P.y), v1 = Math.min(1, P.y + pH);
      if (v1 > v0) for (let X = Math.ceil((cx - r) * S); X < (cx + r) * S; X++) {
        const s = Math.max(-.999, Math.min(.999, (X / S - cx) / r)), th = Math.asin(s), c = Math.cos(th), u = V + th / (2 * Math.PI * f);
        if (u < 0 || u > 1 || u < P.x || u > P.x + P.w) continue; // Streifen am Henkel bzw. außerhalb des Fotos
        const sx = (u - P.x) / P.w * iw, sw = Math.max(1, iw / (2 * Math.PI * f * r * S * Math.max(.05, c) * P.w)), [t, h] = band(c);
        x.drawImage(ph, Math.min(iw - sw, sx), (v0 - P.y) / pH * ih, sw, (v1 - v0) / pH * ih, X, (t + v0 * h) * S, 1.5, (v1 - v0) * h * S);
      }
      // Glanz der Keramik (Licht kommt im Foto von der Henkel-Seite): schmaler heller Streifen über dem Druck
      x.globalCompositeOperation = 'screen';
      const gy = (MUG.yT - MUG.oy - 10) / MUG.W * S, gh = (MUG.yB - MUG.yT + 40) / MUG.W * S, gw = r * .16 * S;
      const gx = (cx + (flip ? .55 : -.55) * r) * S, gl = x.createLinearGradient(gx - gw, 0, gx + gw, 0);
      gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.5, 'rgba(255,255,255,.32)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gl; x.fillRect(gx - gw, gy, gw * 2, gh);
      const g2x = (cx + (flip ? -.2 : .2) * r) * S, g2 = x.createLinearGradient(g2x - gw * 2, 0, g2x + gw * 2, 0);
      g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(.5, 'rgba(255,255,255,.1)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g2; x.fillRect(g2x - gw * 2, gy, gw * 4, gh);
    } else if (G.kind === 'mousepad') {
      // Mauspad: leicht gedreht auf dem Tisch, weicher Schatten, Stoffstruktur aus dem Produktfoto, darauf das Foto
      const w = S * G.w, h = S * G.h, rad = w * 48 / 791, draw = () => x.drawImage(ph, -w / 2 + P.x * w, -h / 2 + P.y * h, P.w * w, pH * h);
      x.translate(S / 2, S * .5); x.rotate(-.07);
      if (ghost) { x.globalAlpha = .28; draw(); x.globalAlpha = 1; }
      x.save(); x.shadowColor = 'rgba(40,30,15,.32)'; x.shadowBlur = S * .045; x.shadowOffsetY = S * .022; x.fillStyle = '#f2f2f2'; roundRect(x, -w / 2, -h / 2, w, h, rad); x.fill(); x.restore();
      x.save(); roundRect(x, -w / 2, -h / 2, w, h, rad); x.clip();
      x.drawImage(base, 42, 176, 791, 647, -w / 2, -h / 2, w, h);
      x.globalCompositeOperation = 'multiply'; draw();
      x.globalCompositeOperation = 'soft-light'; const sh = x.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      sh.addColorStop(0, 'rgba(255,255,255,.35)'); sh.addColorStop(.6, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.18)');
      x.fillStyle = sh; x.fillRect(-w / 2, -h / 2, w, h); x.restore();
      x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = Math.max(1, S * .004); roundRect(x, -w / 2, -h / 2, w, h, rad); x.stroke();
    } else {
      // Flache Druckfläche (Magnet, Poster …): weiße Fläche mit Schatten, darauf das Foto; Tasse mit Henkel-Streifen an beiden Rändern
      const [bx, by, bw, bh] = G.box.map(v => v * S), rad = Math.min(bw, bh) * (type === 'magnet' ? .08 : type === 'mug' ? 0 : .015);
      const draw = () => x.drawImage(ph, bx + P.x * bw, by + P.y * bh, P.w * bw, pH * bh);
      if (ghost) { x.globalAlpha = .28; draw(); x.globalAlpha = 1; }
      x.save(); x.shadowColor = 'rgba(40,30,15,.3)'; x.shadowBlur = S * .03; x.shadowOffsetY = S * .012; x.fillStyle = '#fff'; roundRect(x, bx, by, bw, bh, rad); x.fill(); x.restore();
      x.save(); roundRect(x, bx, by, bw, bh, rad); x.clip(); draw();
      if (type === 'mug') { x.fillStyle = 'rgba(29,29,27,.14)'; x.fillRect(bx, by, bw * .035, bh); x.fillRect(bx + bw * .965, by, bw * .035, bh); }
      x.restore(); x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = Math.max(1, S * .003); roundRect(x, bx, by, bw, bh, rad); x.stroke();
    }
    if (guides && (guides.u != null || guides.v != null)) { // Hilfslinien beim Einrasten in der Mitte
      x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
      x.strokeStyle = '#e5007d'; x.lineWidth = Math.max(1.5, S * .004); x.setLineDash([S * .018, S * .012]); x.beginPath();
      const [ua, ub] = G.vis ? [Math.max(0, G.vis[0]), Math.min(1, G.vis[1])] : [0, 1], line = q => q.forEach(([X, Y], i) => x[i ? 'lineTo' : 'moveTo'](X * S, Y * S));
      if (guides.u != null && guides.u >= ua && guides.u <= ub) line([G.xy(guides.u, 0), G.xy(guides.u, 1)]);
      if (guides.v != null) line(Array.from({ length: 25 }, (_, i) => G.xy(ua + (ub - ua) * i / 24, guides.v)));
      x.stroke();
    }
    x.restore();
  }
  // Wie paint(), lädt die Bilder vorher (Produktkarten). Fehlt das leere Produktfoto, wird die flache Druckfläche gezeichnet.
  // opts.alt: Ersatzbild, wenn src nicht lädt (z. B. das Original, solange seine Vorschau noch nicht hochgeladen ist)
  async function drawReal(cv, type, src, opts = {}) {
    const R = REAL[type]; if (!R && !opts.area) return;
    const [base, ph] = await Promise.all([R ? loadImg(R.src).catch(() => null) : null, loadImg(src).catch(e => opts.alt ? loadImg(opts.alt) : Promise.reject(e))]);
    paint(cv, type, base, ph, opts);
  }
  let mkId = 0;
  // Vorschau des Produkts mit dem Foto des Gastes, gleich danach in eine Leinwand gezeichnet: Tasse/Mauspad mit echtem
  // Produktfoto, andere Produkte mit bekannter Druckfläche (Printful, opts.area) als flache Fläche – beide mit der gewählten
  // bzw. der Standardlage. Ohne Druckfläche (Gelato) nur CSS. land = Querformat; opts wie bei drawReal
  function mockup(type, src, land, opts = {}) {
    const u = esc(src), o = land ? 'l' : 'p';
    if (REAL[type] || opts.area) {
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

  G.PM_SHOP = { TYPES, MODES, VATS, PROVIDERS, SIDES, DEFAULTS, normalize, legalOk, active, price, path, mockup, drawReal, addCss, esc,
    REAL, loadImg, defaultPlace, presets, geom, paint, keep, wrap };
})(typeof window !== 'undefined' ? window : globalThis);
