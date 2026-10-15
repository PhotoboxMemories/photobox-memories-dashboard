// FotoBox – Druck-Layouts, Vorlagen (Designs) und Bild-Zusammensetzung.
// Wird von der App UND vom Dashboard benutzt (gleiche Datei in beiden Ordnern).
(function (G) {
  'use strict';

  const FONTS = {
    modern: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
    elegant: 'Didot,"Bodoni 72","Bodoni MT",Georgia,"Times New Roman",serif',
    script: '"Snell Roundhand","Brush Script MT","Segoe Script","Lucida Handwriting",cursive',
    typewriter: '"American Typewriter","Courier New",Courier,monospace',
    arial: 'Arial,Helvetica,sans-serif', georgia: 'Georgia,"Times New Roman",serif', impact: 'Impact,"Arial Black",sans-serif',
    verdana: 'Verdana,Geneva,sans-serif', trebuchet: '"Trebuchet MS",Tahoma,sans-serif', times: '"Times New Roman",Times,serif'
  };
  const FONT_NAMES = { modern: 'Modern', elegant: 'Elegant', script: 'Handschrift', typewriter: 'Schreibmaschine',
    arial: 'Arial', georgia: 'Georgia', impact: 'Impact', verdana: 'Verdana', trebuchet: 'Trebuchet', times: 'Times' };

  // Maße in Pixel bei 300 dpi (10×15 cm)
  const LAYOUTS = {
    single: { w: 1800, h: 1200, slots: [[50, 50, 1700, 950]], band: { x: 50, y: 1000, w: 1700, h: 200, title: 72, sub: 40 } },
    strip: { w: 1200, h: 1800, copies: [0, 600], slots: [0, 1, 2, 3].map(i => [30, 30 + i * 380, 540, 360]),
      band: { x: 30, y: 1540, w: 540, h: 240, title: 52, sub: 32 } },
    grid: { w: 1800, h: 1200, slots: [[40, 40, 850, 480], [910, 40, 850, 480], [40, 540, 850, 480], [910, 540, 850, 480]],
      band: { x: 40, y: 1030, w: 1720, h: 150, title: 64, sub: 36 } },
    anim: { w: 800, h: 640, slots: [[16, 16, 768, 512]], band: { x: 16, y: 536, w: 768, h: 96, title: 40, sub: 24 } },
    // Hochformat (z.B. für um 90° gedrehte Kameras)
    singleP: { w: 1200, h: 1800, slots: [[50, 50, 1100, 1450]], band: { x: 50, y: 1510, w: 1100, h: 260, title: 76, sub: 42 } },
    stripP: { w: 1200, h: 1800, copies: [0, 600], slots: [0, 1, 2].map(i => [30, 30 + i * 500, 540, 480]),
      band: { x: 30, y: 1540, w: 540, h: 240, title: 52, sub: 32 } },
    gridP: { w: 1200, h: 1800, slots: [[40, 40, 550, 700], [610, 40, 550, 700], [40, 760, 550, 700], [610, 760, 550, 700]],
      band: { x: 40, y: 1490, w: 1120, h: 270, title: 72, sub: 40 } },
    animP: { w: 640, h: 900, slots: [[16, 16, 608, 760]], band: { x: 16, y: 786, w: 608, h: 104, title: 38, sub: 22 } }
  };

  // ---------- Zeichen-Helfer ----------
  function rng(seed) { // gleiche Zufallswerte bei jedem Druck
    let a = seed >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function rr(x, X, Y, W, H, r) { x.beginPath(); x.roundRect ? x.roundRect(X, Y, W, H, r) : x.rect(X, Y, W, H); }
  function drawCover(x, img, dx, dy, dw, dh) {
    const iw = img.naturalWidth || img.videoWidth || img.width, ih = img.naturalHeight || img.videoHeight || img.height;
    const s = Math.max(dw / iw, dh / ih), sw = dw / s, sh = dh / s;
    x.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, dx, dy, dw, dh);
  }
  function confetti(x, R, n, colors, seed, sizeF = 1) {
    const r = rng(seed), s = Math.min(R.w, R.h) / 1200;
    for (let i = 0; i < n; i++) {
      x.save();
      x.translate(R.x + r() * R.w, R.y + r() * R.h); x.rotate(r() * Math.PI);
      x.fillStyle = colors[i % colors.length]; x.globalAlpha = .85;
      const k = (8 + r() * 14) * s * sizeF;
      if (r() < .5) x.fillRect(-k, -k / 2.5, k * 2, k / 1.25); else { x.beginPath(); x.arc(0, 0, k * .7, 0, 7); x.fill(); }
      x.restore();
    }
  }
  function leaf(x, cx, cy, len, ang, col) {
    x.save(); x.translate(cx, cy); x.rotate(ang); x.fillStyle = col;
    x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(len * .5, -len * .28, len, 0); x.quadraticCurveTo(len * .5, len * .28, 0, 0); x.fill();
    x.restore();
  }
  function flower(x, cx, cy, r, col, center) {
    x.save(); x.translate(cx, cy); x.fillStyle = col;
    for (let i = 0; i < 5; i++) { x.rotate(Math.PI * 2 / 5); x.beginPath(); x.ellipse(r * .55, 0, r * .55, r * .36, 0, 0, 7); x.fill(); }
    x.fillStyle = center; x.beginPath(); x.arc(0, 0, r * .28, 0, 7); x.fill();
    x.restore();
  }
  function floralCluster(x, cx, cy, s, flip) {
    const d = flip ? -1 : 1;
    [['#7fa37a', -.3], ['#9bbf8f', .5], ['#6b8f66', 1.2], ['#a8c79c', -1.1]].forEach(([c, a], i) =>
      leaf(x, cx, cy, s * (1 - i * .12), (flip ? Math.PI : 0) + a, c));
    flower(x, cx + d * s * .25, cy + d * s * .12, s * .32, '#f2b8c6', '#e8c07a');
    flower(x, cx - d * s * .05, cy - d * s * .22, s * .25, '#ffffff', '#e8c07a');
    flower(x, cx + d * s * .45, cy - d * s * .15, s * .2, '#e98fa6', '#f3d58f');
  }
  function balloon(x, cx, cy, r, col) {
    x.save();
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = r * .04; x.beginPath(); x.moveTo(cx, cy + r * 1.15);
    x.bezierCurveTo(cx - r * .3, cy + r * 1.6, cx + r * .3, cy + r * 2, cx, cy + r * 2.6); x.stroke();
    x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, r * .85, r * 1.05, 0, 0, 7); x.fill();
    x.beginPath(); x.moveTo(cx - r * .12, cy + r * 1.12); x.lineTo(cx + r * .12, cy + r * 1.12); x.lineTo(cx, cy + r * .98); x.fill();
    x.fillStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.ellipse(cx - r * .3, cy - r * .4, r * .14, r * .26, -.5, 0, 7); x.fill();
    x.restore();
  }
  function snowflake(x, cx, cy, r, col) {
    x.save(); x.translate(cx, cy); x.strokeStyle = col; x.lineWidth = Math.max(1.5, r * .12); x.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      x.rotate(Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -r);
      x.moveTo(0, -r * .55); x.lineTo(-r * .25, -r * .8); x.moveTo(0, -r * .55); x.lineTo(r * .25, -r * .8); x.stroke();
    }
    x.restore();
  }
  function corner(x, X, Y, s, rot, col) { // Gold-Ornament
    x.save(); x.translate(X, Y); x.rotate(rot); x.strokeStyle = col; x.lineWidth = s * .06; x.lineCap = 'round';
    x.beginPath(); x.moveTo(0, s); x.lineTo(0, s * .25); x.quadraticCurveTo(0, 0, s * .25, 0); x.lineTo(s, 0); x.stroke();
    x.beginPath(); x.arc(s * .32, s * .32, s * .12, 0, 7); x.stroke();
    x.fillStyle = col; x.beginPath(); x.moveTo(s * 1.1, 0); x.lineTo(s * 1.2, -s * .08); x.lineTo(s * 1.3, 0); x.lineTo(s * 1.2, s * .08); x.fill();
    x.beginPath(); x.moveTo(0, s * 1.1); x.lineTo(-s * .08, s * 1.2); x.lineTo(0, s * 1.3); x.lineTo(s * .08, s * 1.2); x.fill();
    x.restore();
  }

  // ---------- Vorlagen ----------
  // Jede Vorlage: Standardfarben/Schrift + optionale Deko unter (under) oder über (over) den Fotos.
  // R = Bereich (bei Fotostreifen: ein Streifen), s = Maßstab, b = Text-Band
  const TEMPLATES = [
    { id: 'classic', name: 'Klassisch', cat: 'Alle Anlässe', frame: '#ffffff', text: '#222222', accent: '#ff3d7f', font: 'modern' },
    { id: 'elegant', name: 'Schwarz Elegant', cat: 'Alle Anlässe', frame: '#111111', text: '#f3efe6', accent: '#c9a45c', font: 'elegant',
      slotBorder: { w: 3, c: '#c9a45c' },
      under(x, R, s) { x.strokeStyle = '#c9a45c'; x.lineWidth = 3 * s; x.strokeRect(R.x + 16 * s, R.y + 16 * s, R.w - 32 * s, R.h - 32 * s); } },
    { id: 'wedding', name: 'Hochzeit Gold', cat: 'Hochzeit', frame: '#fbf7ef', text: '#6b5a3a', accent: '#c9a45c', font: 'script',
      slotBorder: { w: 2, c: '#c9a45c' },
      under(x, R, s) {
        x.strokeStyle = '#c9a45c'; x.lineWidth = 4 * s; x.strokeRect(R.x + 12 * s, R.y + 12 * s, R.w - 24 * s, R.h - 24 * s);
        x.lineWidth = 1.5 * s; x.strokeRect(R.x + 24 * s, R.y + 24 * s, R.w - 48 * s, R.h - 48 * s);
      },
      over(x, R, s) {
        const k = 70 * s, m = 34 * s;
        corner(x, R.x + m, R.y + m, k, 0, '#c9a45c'); corner(x, R.x + R.w - m, R.y + m, k, Math.PI / 2, '#c9a45c');
        corner(x, R.x + R.w - m, R.y + R.h - m, k, Math.PI, '#c9a45c'); corner(x, R.x + m, R.y + R.h - m, k, -Math.PI / 2, '#c9a45c');
      } },
    { id: 'floral', name: 'Floral Rosé', cat: 'Hochzeit', frame: '#fbeef0', text: '#8a4b5a', accent: '#e98fa6', font: 'script',
      radius: 18,
      over(x, R, s) {
        floralCluster(x, R.x + 40 * s, R.y + 40 * s, 190 * s, false);
        floralCluster(x, R.x + R.w - 40 * s, R.y + R.h - 40 * s, 190 * s, true);
      } },
    { id: 'neon', name: 'Party Neon', cat: 'Party', frame: '#0b0620', text: '#ffffff', accent: '#ff2bd6', font: 'modern',
      radius: 14, slotBorder: { w: 6, c: '#ff2bd6', glow: '#ff2bd6' },
      under(x, R, s) {
        const g = x.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h);
        g.addColorStop(0, '#12002e'); g.addColorStop(1, '#001a2e'); x.fillStyle = g; x.fillRect(R.x, R.y, R.w, R.h);
        const r = rng(7);
        for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(${r() < .5 ? '255,43,214' : '0,229,255'},${.15 + r() * .35})`; x.beginPath(); x.arc(R.x + r() * R.w, R.y + r() * R.h, (2 + r() * 5) * s, 0, 7); x.fill(); }
        x.save(); x.shadowColor = '#00e5ff'; x.shadowBlur = 25 * s; x.strokeStyle = '#00e5ff'; x.lineWidth = 5 * s;
        x.strokeRect(R.x + 14 * s, R.y + 14 * s, R.w - 28 * s, R.h - 28 * s); x.restore();
      } },
    { id: 'confetti', name: 'Konfetti', cat: 'Party', frame: '#ffffff', text: '#222222', accent: '#ff5d8f', font: 'modern',
      under(x, R) { confetti(x, R, 220, ['#ff5d8f', '#ffd166', '#06d6a0', '#118ab2', '#9b5de5'], 3); } },
    { id: 'birthday', name: 'Geburtstag', cat: 'Geburtstag', frame: '#fff6e5', text: '#3b3355', accent: '#ff7b54', font: 'modern',
      radius: 16,
      under(x, R) { confetti(x, R, 90, ['#ff7b54', '#ffd56b', '#7fc8f8', '#b388eb'], 11, .8); },
      over(x, R, s, b) {
        if (!b) return;
        const r = b.h * .26, y = b.y + b.h * .28;
        balloon(x, b.x + r * 1.2, y, r, '#ff7b54'); balloon(x, b.x + r * 2.6, y + r * .35, r * .85, '#7fc8f8');
        balloon(x, b.x + b.w - r * 1.2, y, r, '#b388eb'); balloon(x, b.x + b.w - r * 2.6, y + r * .35, r * .85, '#ffd56b');
      } },
    { id: 'film', name: 'Vintage Film', cat: 'Alle Anlässe', frame: '#141414', text: '#efe6d2', accent: '#e0b64a', font: 'typewriter',
      insetX: .035,
      under(x, R, s) {
        x.fillStyle = '#efe6d2';
        const hw = 26 * s, hh = 38 * s, gap = 34 * s, left = R.x + 12 * s, right = R.x + R.w - 12 * s - hw;
        for (let y = R.y + 20 * s; y < R.y + R.h - hh; y += hh + gap) { rr(x, left, y, hw, hh, 5 * s); x.fill(); rr(x, right, y, hw, hh, 5 * s); x.fill(); }
      } },
    { id: 'polaroid', name: 'Polaroid', cat: 'Alle Anlässe', frame: '#f3efe7', text: '#2f2f2f', accent: '#d9534f', font: 'script',
      shadow: true,
      over(x, R, s, b, slots) {
        const r = rng(5);
        slots.forEach(sl => {
          x.save(); x.translate(sl[0] + sl[2] / 2 + (r() - .5) * sl[2] * .3, sl[1] + 4 * s); x.rotate((r() - .5) * .25);
          x.fillStyle = 'rgba(235,222,190,.8)'; x.fillRect(-60 * s, -18 * s, 120 * s, 36 * s); x.restore();
        });
      } },
    { id: 'christmas', name: 'Weihnachten', cat: 'Saison', frame: '#0f3d2e', text: '#ffffff', accent: '#c8102e', font: 'elegant',
      slotBorder: { w: 4, c: '#ffffff' },
      under(x, R, s) {
        x.strokeStyle = '#c8102e'; x.lineWidth = 10 * s; x.strokeRect(R.x + 8 * s, R.y + 8 * s, R.w - 16 * s, R.h - 16 * s);
        const r = rng(9);
        for (let i = 0; i < 70; i++) snowflake(x, R.x + r() * R.w, R.y + r() * R.h, (8 + r() * 16) * s, 'rgba(255,255,255,.55)');
      },
      over(x, R, s, b) {
        if (!b) return;
        const r = rng(4);
        for (let i = 0; i < 6; i++) snowflake(x, b.x + r() * b.w, b.y + r() * b.h, (10 + r() * 12) * s, 'rgba(255,255,255,.7)');
      } },
    { id: 'business', name: 'Business Navy', cat: 'Firmenfeier', frame: '#0d1b2a', text: '#ffffff', accent: '#e0b64a', font: 'modern',
      slotBorder: { w: 3, c: 'rgba(255,255,255,.85)' },
      over(x, R, s, b) { if (b) { x.fillStyle = '#e0b64a'; x.fillRect(b.x + b.w * .35, b.y + 6 * s, b.w * .3, 5 * s); } } },
    { id: 'tropical', name: 'Sommer', cat: 'Saison', frame: '#bdf2ea', text: '#0b4250', accent: '#ff9f1c', font: 'modern',
      radius: 22,
      under(x, R, s) {
        const g = x.createLinearGradient(R.x, R.y, R.x, R.y + R.h);
        g.addColorStop(0, '#9ff0e5'); g.addColorStop(1, '#ffe3a3'); x.fillStyle = g; x.fillRect(R.x, R.y, R.w, R.h);
      },
      over(x, R, s, b) {
        if (!b) return;
        x.fillStyle = '#ff9f1c'; x.beginPath(); x.arc(b.x + b.w - b.h * .45, b.y + b.h * .5, b.h * .28, 0, 7); x.fill();
        [[-.6, '#2a9d8f'], [-.2, '#3fb68b'], [.25, '#2a9d8f']].forEach(([a, c]) => leaf(x, b.x + b.h * .1, b.y + b.h * .95, b.h * .9, -Math.PI / 2 + a, c));
      } }
  ];
  const byId = id => TEMPLATES.find(t => t.id === id) || TEMPLATES[0];

  // ---------- Text-Band (Titel, Untertitel, Logo) ----------
  function drawBand(x, b, ox, o) {
    const bx = b.x + ox, logo = o.logo;
    const hasLogo = logo && logo.complete !== false && (logo.naturalWidth || logo.width);
    const ar = hasLogo ? (logo.naturalWidth || logo.width) / (logo.naturalHeight || logo.height) : 1;
    let textW = b.w * .9, logoH = 0;
    if (hasLogo && b.w > b.h * 3) {           // breites Band: Logo links
      let lh = b.h * .7, lw = Math.min(lh * ar, b.w * .22); lh = lw / ar;
      x.drawImage(logo, bx + b.h * .15, b.y + (b.h - lh) / 2, lw, lh);
      textW = b.w - 2 * (lw + b.h * .3);
    } else if (hasLogo) logoH = b.h * .36;    // schmales Band: Logo oben
    const lines = [];
    const script = o.font === 'script';
    if (o.title) lines.push({ t: o.title, s: b.title * (script ? 1.15 : 1), w: script ? 400 : 700 });
    if (o.subtitle) lines.push({ t: o.subtitle, s: b.sub, w: 400, font: script ? 'elegant' : o.font });
    const gap = b.h * .05;
    const total = lines.reduce((a, l) => a + l.s, 0) + gap * Math.max(0, lines.length - 1) + (logoH ? logoH + gap : 0);
    let y = b.y + (b.h - total) / 2;
    if (logoH) {
      const lw = Math.min(logoH * ar, textW), lh = lw / ar;
      x.drawImage(logo, bx + (b.w - lw) / 2, y + (logoH - lh) / 2, lw, lh);
      y += logoH + gap;
    }
    x.fillStyle = o.textColor; x.textAlign = 'center'; x.textBaseline = 'top';
    for (const l of lines) {
      let s = l.s;
      do x.font = `${l.w} ${s}px ${FONTS[l.font || o.font] || FONTS.modern}`; while (x.measureText(l.t).width > textW && (s -= 2) > 10);
      x.fillText(l.t, bx + b.w / 2, y + (l.s - s) / 2);
      y += l.s + gap;
    }
  }

  // ---------- Zusammensetzen ----------
  // o: { template, frame, textColor, font, title, subtitle, logo, filter, hideBand }
  function render(L, photos, o) {
    const t = typeof o.template === 'object' ? o.template : byId(o.template);
    const c = document.createElement('canvas'); c.width = L.w; c.height = L.h;
    const x = c.getContext('2d');
    x.fillStyle = o.frame || t.frame; x.fillRect(0, 0, L.w, L.h);
    const copies = L.copies || [0], regW = L.copies ? L.w / L.copies.length : L.w;
    for (const ox of copies) {
      const R = { x: ox, y: 0, w: regW, h: L.h }, s = Math.min(R.w, R.h) / 1200;
      const band = L.band && { ...L.band, x: L.band.x + ox };
      const slots = L.slots.map(([sx, sy, sw, sh]) => {
        const dx = (t.insetX || 0) * regW, dy = (t.insetY || 0) * L.h;
        return [sx + ox + dx, sy + dy, sw - 2 * dx, sh - 2 * dy];
      });
      if (t.under) { x.save(); t.under(x, R, s, band, slots); x.restore(); }
      slots.forEach((sl, i) => {
        const [X, Y, W, H] = sl, rad = (t.radius || 0) * s;
        if (t.shadow) {
          x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 24 * s; x.shadowOffsetY = 8 * s;
          x.fillStyle = '#fff'; rr(x, X, Y, W, H, rad); x.fill(); x.restore();
        }
        const img = photos[i % photos.length];
        x.save();
        if (rad) { rr(x, X, Y, W, H, rad); x.clip(); }
        if (o.filter && o.filter !== 'none') x.filter = o.filter;
        if (img) drawCover(x, img, X, Y, W, H);
        x.restore();
        if (t.slotBorder) {
          x.save(); x.strokeStyle = t.slotBorder.c; x.lineWidth = t.slotBorder.w * s * 2;
          if (t.slotBorder.glow) { x.shadowColor = t.slotBorder.glow; x.shadowBlur = 22 * s; }
          rr(x, X, Y, W, H, rad); x.stroke(); x.restore();
        }
      });
      if (band && !o.hideBand) drawBand(x, L.band, ox, { ...o, font: o.font || t.font, textColor: o.textColor || t.text });
      if (t.over) { x.save(); t.over(x, R, s, band, slots); x.restore(); }
    }
    if (L.copies && !o.hideBand) { // Schnittlinie zwischen den Streifen
      x.save(); x.strokeStyle = 'rgba(128,128,128,.25)'; x.setLineDash([8, 10]);
      x.beginPath(); x.moveTo(L.w / 2, 0); x.lineTo(L.w / 2, L.h); x.stroke(); x.restore();
    }
    return c;
  }

  // Platzhalter-Foto für Vorschauen (Person als Silhouette)
  function placeholder(i = 0, w = 1600, h = 1000) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'), hues = [210, 330, 30, 160, 270, 190];
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${hues[i % 6]},35%,72%)`); g.addColorStop(1, `hsl(${hues[i % 6] + 30},30%,52%)`);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,.55)';
    const n = 1 + (i % 2);
    for (let k = 0; k < n; k++) {
      const cx = w * (n === 1 ? .5 : .36 + k * .28), r = h * .16;
      x.beginPath(); x.arc(cx, h * .42, r, 0, 7); x.fill();
      x.beginPath(); x.ellipse(cx, h * .95, r * 1.9, r * 1.5, 0, Math.PI, 0); x.fill();
    }
    return c;
  }

  // =====================================================================
  // Frei gestaltete Fotolayouts (Layout-Editor)
  // layout = { id, name, format, w, h, bg, twoPerPage, secondary, elements: [ … ] }
  // Element-Typen: photo (n = Fotonummer), image (src), text, shape (rect/ellipse), deco (Vorlagen-Deko)
  // =====================================================================
  // Papierformate wie bei LumaBooth (Zoll, kurze Seite zuerst), sortiert von klein nach groß. Je Format gibt es Hoch- und
  // Querformat (quadratische nur einmal). Schlüssel: Größe + p/l; ältere Schlüssel (2x6, 4x6p, 5x7l, sq …) bleiben gültig.
  // pair = „2 pro Seite“ möglich; Panoramen (sehr lange Streifen) werden in einem Stück gedruckt.
  const SIZES = [['2x6', 2, 6, '2×6 Streifen'], ['3x4', 3, 4], ['3.5x5', 3.5, 5], ['4x4', 4, 4], ['4x4.5', 4, 4.5], ['4x6', 4, 6], ['4x8', 4, 8],
    ['4.5x6', 4.5, 6], ['5x5', 5, 5], ['5x7', 5, 7], ['5x8', 5, 8], ['6x6', 6, 6], ['6x8', 6, 8], ['6x9', 6, 9], ['7x8', 7, 8, '8×7'],
    ['8x8', 8, 8], ['8x9', 8, 9], ['8x10', 8, 10], ['8x12', 8, 12], ['6x14', 6, 14, '6×14 Panorama'], ['6x20', 6, 20, '6×20 Panorama'],
    ['8x18', 8, 18, '8×18 Panorama'], ['8x22', 8, 22, '8×22 Panorama'], ['8x26', 8, 26, '8×26 Panorama'], ['8x32', 8, 32, '8×32 Panorama']];
  const OLD_KEY = { '2x6p': '2x6', '4x4': 'sq' };
  const FORMATS = {};
  for (const [size, a, b, name] of SIZES) {
    const nm = name || `${String(a).replace('.', ',')}×${String(b).replace('.', ',')}`, pair = b <= 12;
    if (a === b) { FORMATS[OLD_KEY[size] || size] = { w: a * 300, h: b * 300, in: [a, b], size, orient: '', pair, label: nm + ' Quadrat' }; continue; }
    FORMATS[OLD_KEY[size + 'p'] || size + 'p'] = { w: a * 300, h: b * 300, in: [a, b], size, orient: 'p', pair, label: nm + (size === '2x6' ? '' : ' Hochformat') };
    FORMATS[size + 'l'] = { w: b * 300, h: a * 300, in: [b, a], size, orient: 'l', pair, label: nm + (size === '2x6' ? ' quer' : ' Querformat') };
  }
  const SIZE_LIST = SIZES.map(([size, a, b, name]) => ({ size, square: a === b, label: name || `${String(a).replace('.', ',')}×${String(b).replace('.', ',')}` }));
  const formatKey = (size, orient) => Object.keys(FORMATS).find(k => FORMATS[k].size === size && (FORMATS[k].orient === orient || !FORMATS[k].orient)) || null;
  const uid = () => Math.random().toString(36).slice(2, 10);
  // Grundaufteilungen je Format: [Format, Anzahl Fotos, Fotofelder]
  function presetSlots(format, n) {
    const F = FORMATS[format], W = F.w, H = F.h;
    const m = Math.round(Math.min(W, H) * .05), g = Math.round(m * .6);
    const tall = H / W >= 2, wide = W / H >= 2; // Streifen und Panoramen
    const bandH = tall ? Math.round(W * .47) : Math.round(H * (W > H ? .17 : .15));
    const top = m, availH = H - bandH - m - m / 2, availW = W - 2 * m;
    const rows = (k, cols = 1) => {
      const out = [], r = Math.ceil(k / cols), cw = (availW - g * (cols - 1)) / cols, ch = (availH - g * (r - 1)) / r;
      for (let i = 0; i < k; i++) out.push([m + (i % cols) * (cw + g), top + Math.floor(i / cols) * (ch + g), cw, ch]);
      return out;
    };
    if (tall) return rows(n);
    if (wide) return rows(n, n);
    if (n === 1) return rows(1);
    if (n === 2) return W > H ? rows(2, 2) : rows(2);
    if (n === 3 && W > H) { // großes Foto links, zwei kleine rechts
      const bw = availW * .62, sw = availW - bw - g, sh = (availH - g) / 2;
      return [[m, top, bw, availH], [m + bw + g, top, sw, sh], [m + bw + g, top + sh + g, sw, sh]];
    }
    if (n === 3) return rows(3);
    return rows(n, 2);
  }
  const PRESETS = [['2x6', 2], ['2x6', 3], ['2x6', 4], ['2x6l', 3], ['4x6p', 1], ['4x6p', 2], ['4x6p', 3], ['4x6p', 4],
    ['4x6l', 1], ['4x6l', 2], ['4x6l', 3], ['4x6l', 4], ['5x7p', 1], ['5x7l', 1], ['5x7l', 3], ['sq', 1], ['sq', 4], ['6x6', 1], ['6x6', 4],
    ['6x8p', 1], ['6x8p', 4], ['6x8l', 1], ['6x8l', 3], ['6x9p', 3], ['8x10p', 1], ['8x10p', 4], ['8x10l', 4], ['6x20p', 3], ['6x14l', 3]];
  // Neues Layout aus Format + Vorlage (Design) erzeugen
  function createLayout(format, n, tplId = 'classic', name) {
    const F = FORMATS[format], t = byId(tplId), W = F.w, H = F.h;
    const slots = presetSlots(format, n);
    const last = slots.reduce((a, s) => Math.max(a, s[1] + s[3]), 0);
    const m = Math.round(Math.min(W, H) * .05), bandY = last + m * .6, bandH = H - bandY - m * .6;
    const els = [];
    if (t.under) els.push({ id: uid(), type: 'deco', tpl: t.id, layer: 'under', x: 0, y: 0, w: W, h: H, rot: 0, locked: true });
    slots.forEach((s, i) => els.push({ id: uid(), type: 'photo', n: i + 1, x: Math.round(s[0]), y: Math.round(s[1]), w: Math.round(s[2]), h: Math.round(s[3]), rot: 0,
      radius: t.radius || 0, stroke: t.slotBorder?.c || '', strokeW: t.slotBorder ? t.slotBorder.w * 2 : 0, shadow: !!t.shadow }));
    const tsz = Math.round(Math.min(W, bandH * 3.2) * .085);
    els.push({ id: uid(), type: 'text', text: '{titel}', font: t.font, size: 'auto', color: t.text, weight: t.font === 'script' ? 400 : 700, align: 'center',
      x: Math.round(m), y: Math.round(bandY + bandH * .1), w: Math.round(W - 2 * m), h: Math.round(bandH * .5), rot: 0 });
    els.push({ id: uid(), type: 'text', text: '{untertitel}', font: t.font === 'script' ? 'elegant' : t.font, size: 'auto', color: t.text, weight: 400, align: 'center',
      x: Math.round(m), y: Math.round(bandY + bandH * .62), w: Math.round(W - 2 * m), h: Math.round(bandH * .28), rot: 0 });
    if (t.over) els.push({ id: uid(), type: 'deco', tpl: t.id, layer: 'over', x: 0, y: 0, w: W, h: H, rot: 0, locked: true });
    return { id: uid(), name: name || `${F.label} · ${n} Foto${n > 1 ? 's' : ''}`, format, w: W, h: H, bg: t.frame, tpl: t.id,
      twoPerPage: F.size === '2x6', secondary: false, elements: els };
  }
  const photoCount = L => L.elements.filter(e => e.type === 'photo').reduce((a, e) => Math.max(a, e.n || 1), 0);

  // Bilder (Logos, Designs) einmal laden und merken
  const imgCache = new Map();
  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    if (imgCache.has(src)) { const i = imgCache.get(src); return i.complete ? Promise.resolve(i) : new Promise(r => { i.addEventListener('load', () => r(i)); i.addEventListener('error', () => r(null)); }); }
    const i = new Image(); i.crossOrigin = 'anonymous'; imgCache.set(src, i);
    return new Promise(r => { i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  }
  const preloadLayout = L => Promise.all([L.bgImage, ...L.elements.filter(e => (e.type === 'image' || e.type === 'button') && e.src).map(e => e.src)].filter(Boolean).map(loadImg));

  // ---------- Startbildschirm (frei gestaltbar wie ein Layout, aber in Bildschirmgröße) ----------
  const SCREEN_SIZES = { portrait: { w: 1080, h: 1920, label: 'Hochformat' }, landscape: { w: 1920, h: 1080, label: 'Querformat' } };
  // Themen: [Verlauf von, Verlauf bis, Winkel°], Textfarbe, Knopffarbe, Symbolfarbe
  const T = (id, name, cat, a, b, ang, text, btn, ico) => ({ id, name, cat, grad: [a, b, ang], text, btn, ico });
  const SCREEN_THEMES = [
    T('luma', 'Morgenlicht', 'Neutral', '#5b8fa8', '#8fb56a', 160, '#ffffff', '#ffffff', '#222222'),
    T('night', 'Nachtschwarz', 'Neutral', '#1D1D1B', '#4a4a45', 160, '#ffffff', '#F7C838', '#1D1D1B'),
    T('white', 'Reinweiß', 'Neutral', '#ffffff', '#eef0f3', 180, '#1d1d24', '#1D1D1B', '#ffffff'),
    T('sand', 'Sand', 'Neutral', '#f3e7d3', '#d9c2a0', 170, '#4a3b28', '#ffffff', '#4a3b28'),
    T('wedgold', 'Gold & Creme', 'Hochzeit', '#fbf7ef', '#e8d5a8', 170, '#6b5a3a', '#c9a45c', '#ffffff'),
    T('wedrose', 'Rosé', 'Hochzeit', '#fbe9ec', '#e8b7c0', 165, '#7a3b4a', '#ffffff', '#7a3b4a'),
    T('wedgreen', 'Eukalyptus', 'Hochzeit', '#eef3ea', '#a9c0a2', 170, '#33452f', '#ffffff', '#33452f'),
    T('wednavy', 'Navy & Gold', 'Hochzeit', '#0d1b2a', '#243b55', 160, '#f1dfae', '#e0b64a', '#0d1b2a'),
    T('party', 'Neon-Party', 'Party', '#3a0ca3', '#f72585', 150, '#ffffff', '#4cc9f0', '#1d1d24'),
    T('disco', 'Disco', 'Party', '#0f0c29', '#7b2ff7', 150, '#ffffff', '#f72585', '#ffffff'),
    T('sunset', 'Sonnenuntergang', 'Party', '#ff7b54', '#ffd56b', 170, '#3b2b1a', '#ffffff', '#ff7b54'),
    T('bday', 'Konfetti', 'Geburtstag', '#fff6e5', '#ffc7a6', 165, '#3b3355', '#ff7b54', '#ffffff'),
    T('kids', 'Kunterbunt', 'Geburtstag', '#4cc9f0', '#b5e48c', 150, '#1d3557', '#ffd60a', '#1d3557'),
    T('xmas', 'Tannengrün', 'Weihnachten', '#0b3d2e', '#14532d', 165, '#f8f1d8', '#c1121f', '#ffffff'),
    T('xmasred', 'Festlich Rot', 'Weihnachten', '#7f1d1d', '#b91c1c', 165, '#fff7e6', '#f1dfae', '#7f1d1d'),
    T('newyear', 'Silvester', 'Weihnachten', '#0b0b0f', '#2b2b36', 160, '#f1dfae', '#f1dfae', '#0b0b0f'),
    T('corp', 'Business Blau', 'Firma', '#0d1b2a', '#1b4b7a', 160, '#ffffff', '#e0b64a', '#0d1b2a'),
    T('corplight', 'Business Hell', 'Firma', '#f4f6f9', '#d8dee8', 180, '#1b2a3a', '#1b4b7a', '#ffffff'),
  ];
  function createScreen(orient, o = {}) {
    const F = SCREEN_SIZES[orient] || SCREEN_SIZES.portrait, t = SCREEN_THEMES.find(x => x.id === o.theme) || SCREEN_THEMES[1], u = Math.min(F.w, F.h) / 1080;
    const mid = (w, y, h) => ({ x: Math.round((F.w - w) / 2), y: Math.round(y), w: Math.round(w), h: Math.round(h), rot: 0 });
    const els = [];
    if (o.logo) els.push({ id: uid(), type: 'image', src: o.logo, fit: 'contain', opacity: 1, ...mid(300 * u, F.h * .06, 190 * u) });
    els.push({ id: uid(), type: 'text', role: 'title', text: '{titel}', font: 'modern', size: 'auto', color: t.text, weight: 800, align: 'center', ...mid(F.w * .84, F.h * .2, 120 * u) });
    els.push({ id: uid(), type: 'text', role: 'subtitle', text: '{untertitel}', font: 'modern', size: 'auto', color: t.text, weight: 400, align: 'center', opacity: .9, ...mid(F.w * .7, F.h * .2 + 130 * u, 56 * u) });
    els.push({ id: uid(), type: 'button', text: o.startText ?? 'Tippen zum Starten', font: 'modern', fill: t.btn, color: t.text, icon: t.ico, hidden: o.startText === '', ...mid(420 * u, F.h * .78, 260 * u) });
    return { id: uid(), screen: true, orient: SCREEN_SIZES[orient] ? orient : 'portrait', w: F.w, h: F.h, theme: t.id, bg: t.grad[0], bgGrad: [...t.grad], bgImage: '', bgFit: 'cover', live: false, elements: els };
  }
  // Gestalteten Startbildschirm für die andere Ausrichtung umrechnen (Hoch ↔ Quer). Mittelpunkte wandern mit,
  // Größen schrumpfen gleichmäßig (nie verzerrt) – so überlappt nichts. Elemente über (fast) die ganze Breite bzw. Höhe
  // bleiben so breit bzw. hoch wie der Bildschirm. Das Ergebnis ist ein Vorschlag, den man im Editor weiter anpassen kann.
  function adaptScreen(L, orient) {
    const F = SCREEN_SIZES[orient]; if (!L || !F) return L;
    if (L.orient === orient) return L;
    const out = JSON.parse(JSON.stringify(L)), sx = F.w / L.w, sy = F.h / L.h, k = Math.min(sx, sy), toPortrait = sy > sx;
    for (const e of out.elements || []) {
      const fullW = e.w >= L.w * .9, fullH = e.h >= L.h * .9, cx = (e.x + e.w / 2) * sx, cy = (e.y + e.h / 2) * sy;
      // quer → hoch: oben und unten ist viel Platz – Texte und Knöpfe dürfen größer bleiben, solange sie in die Breite passen
      const ke = toPortrait ? Math.max(k, Math.min(1, F.w * .92 / e.w)) : k;
      // Texte (Schrift passt sich dem Kästchen an) behalten beim Hochformat ihre Höhe – Bilder und Knöpfe bleiben unverzerrt
      e.w = Math.round(fullW ? e.w * sx : e.w * ke); e.h = Math.round(fullH ? e.h * sy : e.h * (toPortrait && e.type === 'text' ? 1 : ke));
      e.x = Math.round(Math.min(Math.max(cx - e.w / 2, 0), F.w - e.w)); e.y = Math.round(Math.min(Math.max(cy - e.h / 2, 0), F.h - e.h));
    }
    out.orient = orient; out.w = F.w; out.h = F.h; out.adapted = true;
    return out;
  }
  function applyTheme(L, id) {
    const t = SCREEN_THEMES.find(x => x.id === id); if (!t) return;
    L.theme = t.id; L.bg = t.grad[0]; L.bgGrad = [...t.grad]; L.bgImage = ''; L.live = false;
    for (const e of L.elements) { if (e.type === 'text') e.color = t.text; if (e.type === 'button') { e.fill = t.btn; e.color = t.text; e.icon = t.ico; } }
  }
  function drawScreenBg(x, L, o) {
    if (L.live && !o.placeholders) { x.clearRect(0, 0, L.w, L.h); return; } // Fotobox: dahinter läuft das Kamerabild
    if (L.bgGrad) {
      const a = (L.bgGrad[2] - 90) * Math.PI / 180, r = Math.hypot(L.w, L.h) / 2, cx = L.w / 2, cy = L.h / 2;
      const g = x.createLinearGradient(cx - Math.cos(a) * r, cy - Math.sin(a) * r, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      g.addColorStop(0, L.bgGrad[0]); g.addColorStop(1, L.bgGrad[1]); x.fillStyle = g;
    } else x.fillStyle = L.bg || '#1D1D1B';
    x.fillRect(0, 0, L.w, L.h);
    const img = L.bgImage && imgCache.get(L.bgImage);
    if (img && img.complete && img.naturalWidth) {
      if (L.bgFit === 'contain') { const k = Math.min(L.w / img.naturalWidth, L.h / img.naturalHeight), w = img.naturalWidth * k, h = img.naturalHeight * k; x.drawImage(img, (L.w - w) / 2, (L.h - h) / 2, w, h); }
      else drawCover(x, img, 0, 0, L.w, L.h);
    }
    if (L.live) { // Editor: Hinweis statt Kamerabild
      x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(0, 0, L.w, L.h);
      x.fillStyle = 'rgba(255,255,255,.75)'; x.font = `600 ${Math.min(L.w, L.h) * .035}px system-ui,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(G.I18N_UI ? G.I18N_UI('Hier läuft an der Fotobox das Live-Kamerabild') : 'Hier läuft an der Fotobox das Live-Kamerabild', L.w / 2, L.h / 2);
    }
  }
  // Start-Knopf: runder Knopf mit Kamera (oder eigenem Bild), Beschriftung darunter
  function drawButtonEl(x, e) {
    const w = e.w, h = e.h, label = String(e.text || '').trim(), d = Math.min(w, label ? h * .68 : h), cy = -h / 2 + d / 2;
    const img = e.src && imgCache.get(e.src);
    if (img && img.complete && img.naturalWidth) { const k = Math.min(d / img.naturalWidth, d / img.naturalHeight); x.drawImage(img, -img.naturalWidth * k / 2, cy - img.naturalHeight * k / 2, img.naturalWidth * k, img.naturalHeight * k); }
    else {
      x.save(); x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = d * .12; x.shadowOffsetY = d * .04;
      x.fillStyle = e.fill || '#ffffff'; x.beginPath(); x.arc(0, cy, d / 2, 0, 7); x.fill(); x.restore();
      const s = d * .2; x.strokeStyle = e.icon || '#222222'; x.lineWidth = d * .045; x.lineJoin = 'round';
      rr(x, -s * 1.15, cy - s * .75, s * 2.3, s * 1.7, s * .3); x.stroke();
      x.beginPath(); x.arc(0, cy + s * .1, s * .5, 0, 7); x.stroke();
      x.beginPath(); x.moveTo(-s * .45, cy - s * .75); x.lineTo(-s * .25, cy - s * 1.1); x.lineTo(s * .25, cy - s * 1.1); x.lineTo(s * .45, cy - s * .75); x.stroke();
    }
    if (label) {
      const lh = h - d; let size = lh * .5; const fam = FONTS[e.font] || FONTS.modern, setF = () => { x.font = `700 ${size}px ${fam}`; };
      setF(); while (size > 8 && x.measureText(label).width > w) { size -= 1; setF(); }
      x.fillStyle = e.color || '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, 0, -h / 2 + d + lh * .55);
    }
  }

  function fillText(t, v) {
    return String(t || '').replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
  }
  function drawTextEl(x, e, vals) {
    const lines = fillText(e.text, vals).split('\n');
    const fam = FONTS[e.font] || FONTS.modern, w = e.w, h = e.h;
    let size = e.size === 'auto' || !e.size ? h / lines.length / 1.15 : +e.size;
    const setF = () => { x.font = `${e.italic ? 'italic ' : ''}${e.weight || 400} ${size}px ${fam}`; };
    setF();
    if (e.size === 'auto' || !e.size) while (size > 6 && Math.max(...lines.map(l => x.measureText(l).width)) > w) { size -= 1; setF(); }
    x.fillStyle = e.color || '#222'; x.textBaseline = 'middle';
    x.textAlign = e.align || 'center';
    const ax = e.align === 'left' ? -w / 2 : e.align === 'right' ? w / 2 : 0;
    const lh = size * 1.15, y0 = -((lines.length - 1) * lh) / 2;
    lines.forEach((l, i) => x.fillText(l, ax, y0 + i * lh));
  }
  function placeholderPhoto(x, e, w, h) {
    const hues = [150, 205, 45, 330, 270, 20];
    x.fillStyle = `hsl(${hues[((e.n || 1) - 1) % 6]},45%,62%)`; x.fillRect(-w / 2, -h / 2, w, h);
    x.fillStyle = 'rgba(0,0,0,.72)';
    const r = Math.min(w, h) * .16;
    x.beginPath(); x.arc(-w * .08, -h * .08, r, 0, 7); x.fill();
    x.beginPath(); x.ellipse(-w * .08, h / 2, r * 1.8, r * 1.6, 0, Math.PI, 0); x.fill();
    x.fillStyle = 'rgba(0,0,0,.85)'; x.font = `700 ${Math.min(w, h) * .38}px system-ui,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(String(e.n || 1), w * .28, h * .12);
  }
  // Layout zeichnen. o: { photos, values, filter, placeholders (Editor-Vorschau) }
  function renderLayout(L, o = {}, into) {
    const c = into || document.createElement('canvas');
    if (c.width !== L.w || c.height !== L.h) { c.width = L.w; c.height = L.h; }
    const x = c.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    if (L.screen) drawScreenBg(x, L, o); else { x.fillStyle = L.bg || '#ffffff'; x.fillRect(0, 0, L.w, L.h); }
    const photos = o.photos || [];
    const slots = L.elements.filter(e => e.type === 'photo').map(e => [e.x, e.y, e.w, e.h]);
    const texts = L.elements.filter(e => e.type === 'text');
    const band = texts.length ? (() => { const x0 = Math.min(...texts.map(t => t.x)), y0 = Math.min(...texts.map(t => t.y));
      const x1 = Math.max(...texts.map(t => t.x + t.w)), y1 = Math.max(...texts.map(t => t.y + t.h)); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; })() : null;
    for (const e of L.elements) {
      if (e.hidden) continue;
      if (e.type === 'deco') {
        const t = byId(e.tpl), fn = e.layer === 'over' ? t.over : t.under;
        if (fn) { x.save(); fn(x, { x: 0, y: 0, w: L.w, h: L.h }, Math.min(L.w, L.h) / 1200, band, slots); x.restore(); }
        continue;
      }
      const w = e.w, h = e.h;
      x.save(); x.translate(e.x + w / 2, e.y + h / 2); x.rotate((e.rot || 0) * Math.PI / 180);
      x.globalAlpha = e.opacity != null ? e.opacity : 1;
      if (e.type === 'photo') {
        const rad = e.radius || 0;
        if (e.shadow) { x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = Math.min(w, h) * .04; x.shadowOffsetY = Math.min(w, h) * .015; x.fillStyle = '#fff'; rr(x, -w / 2, -h / 2, w, h, rad); x.fill(); x.restore(); }
        x.save(); rr(x, -w / 2, -h / 2, w, h, rad); x.clip();
        const img = photos.length ? photos[((e.n || 1) - 1) % photos.length] : null;
        if (img) { if (o.filter && o.filter !== 'none') x.filter = o.filter; drawCover(x, img, -w / 2, -h / 2, w, h); }
        else placeholderPhoto(x, e, w, h);
        x.restore();
        if (e.stroke && e.strokeW) { x.strokeStyle = e.stroke; x.lineWidth = e.strokeW; rr(x, -w / 2, -h / 2, w, h, rad); x.stroke(); }
      } else if (e.type === 'image') {
        const img = imgCache.get(e.src);
        if (img && img.complete && img.naturalWidth) {
          if (e.fit === 'cover') drawCover(x, img, -w / 2, -h / 2, w, h);
          else if (e.fit === 'contain') { const k = Math.min(w / img.naturalWidth, h / img.naturalHeight); x.drawImage(img, -img.naturalWidth * k / 2, -img.naturalHeight * k / 2, img.naturalWidth * k, img.naturalHeight * k); }
          else x.drawImage(img, -w / 2, -h / 2, w, h);
        } else if (o.placeholders) { x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(-w / 2, -h / 2, w, h); }
      } else if (e.type === 'button') {
        drawButtonEl(x, e);
      } else if (e.type === 'answer') { // Antwort des Gastes auf Umfrage-Frage Nr. e.q
        const a = o.values && Array.isArray(o.values.antworten) ? o.values.antworten[(e.q || 1) - 1] : null;
        const t = a != null && a !== '' ? String(a) : o.placeholders ? `Umfrageantwort ${e.q || 1}` : '';
        if (t) drawTextEl(x, { ...e, text: t.replace(/[{}]/g, '') }, null);
      } else if (e.type === 'signature') { // Unterschrift des Gastes (an der Fotobox gezeichnet), eingefärbt
        const sig = o.values && o.values.unterschrift;
        if (sig && sig.width) {
          const t = document.createElement('canvas'); t.width = sig.width; t.height = sig.height; const tx = t.getContext('2d');
          tx.drawImage(sig, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = e.color || '#000000'; tx.fillRect(0, 0, t.width, t.height);
          const k = Math.min(w / t.width, h / t.height); x.drawImage(t, -t.width * k / 2, -t.height * k / 2, t.width * k, t.height * k);
        } else if (o.placeholders) {
          x.strokeStyle = e.color || '#000000'; x.lineWidth = Math.max(2, h * .035); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
          const n = 7; for (let i = 0; i <= n * 8; i++) { const p = i / (n * 8), px = -w * .42 + w * .84 * p, py = Math.sin(p * n * Math.PI * 2) * h * .22 * (1 - p * .5) - Math.sin(p * Math.PI) * h * .08; i ? x.lineTo(px, py) : x.moveTo(px, py); }
          x.stroke(); x.globalAlpha *= .5; x.lineWidth = Math.max(1, h * .012); x.beginPath(); x.moveTo(-w * .46, h * .36); x.lineTo(w * .46, h * .36); x.stroke();
        }
      } else if (e.type === 'text') {
        drawTextEl(x, e, o.values);
      } else if (e.type === 'shape') {
        x.beginPath();
        if (e.shape === 'ellipse') x.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); else rr(x, -w / 2, -h / 2, w, h, e.radius || 0);
        if (e.fill) { x.fillStyle = e.fill; x.fill(); }
        if (e.stroke && e.strokeW) { x.strokeStyle = e.stroke; x.lineWidth = e.strokeW; x.stroke(); }
      }
      x.restore();
    }
    return c;
  }
  // Druckbogen „2 pro Seite“ (wie LumaBooth): zwei Ausdrucke auf einem Blatt, entlang der kurzen Seite nebeneinander –
  // z. B. 2×6-Streifen auf 4×6, 4×6 auf 6×8, 5×7 auf 8×10. Der Drucker schneidet sie auseinander.
  const sheetOf = L => !L.twoPerPage ? { w: L.w, h: L.h } : L.w <= L.h ? { w: L.w * 2, h: L.h, dx: L.w, dy: 0 } : { w: L.w, h: L.h * 2, dx: 0, dy: L.h };
  function renderSheet(L, o = {}) {
    const one = renderLayout(L, o);
    if (!L.twoPerPage) return one;
    const S = sheetOf(L), c = document.createElement('canvas'); c.width = S.w; c.height = S.h;
    const x = c.getContext('2d'); x.drawImage(one, 0, 0); x.drawImage(one, S.dx, S.dy);
    return c;
  }

  G.FBR = { FONTS, FONT_NAMES, LAYOUTS, TEMPLATES, templateById: byId, render, drawBand, drawCover, placeholder,
    FORMATS, SIZE_LIST, formatKey, sheetOf, PRESETS, presetSlots, createLayout, photoCount, renderLayout, renderSheet, loadImg, preloadLayout, fillText, uid,
    SCREEN_SIZES, SCREEN_THEMES, createScreen, adaptScreen, applyTheme };
})(window);
