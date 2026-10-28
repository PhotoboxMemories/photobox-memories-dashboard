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
    verdana: 'Verdana,Geneva,sans-serif', trebuchet: '"Trebuchet MS",Tahoma,sans-serif', times: '"Times New Roman",Times,serif',
    // Schriften des BoothDesigners (Dateien in fonts-bd/, offline mitgeliefert) – damit übernommene Designs gleich aussehen und die Texte bearbeitbar bleiben
    greatvibes: '"Great Vibes",cursive', dancing: '"Dancing Script",cursive', pacifico: '"Pacifico",cursive', shrikhand: '"Shrikhand",serif',
    righteous: '"Righteous",sans-serif', playfair: '"Playfair Display",Georgia,serif', bodoni: '"Bodoni Moda",Didot,serif',
    cormorant: '"Cormorant Garamond",Georgia,serif', cinzel: '"Cinzel",serif', montserrat: '"Montserrat",sans-serif', manrope: '"Manrope",sans-serif'
  };
  const FONT_NAMES = { modern: 'Modern', elegant: 'Elegant', script: 'Handschrift', typewriter: 'Schreibmaschine',
    arial: 'Arial', georgia: 'Georgia', impact: 'Impact', verdana: 'Verdana', trebuchet: 'Trebuchet', times: 'Times',
    greatvibes: 'Great Vibes', dancing: 'Dancing Script', pacifico: 'Pacifico', shrikhand: 'Shrikhand', righteous: 'Righteous',
    playfair: 'Playfair Display', bodoni: 'Bodoni Moda', cormorant: 'Cormorant Garamond', cinzel: 'Cinzel', montserrat: 'Montserrat', manrope: 'Manrope' };
  // BoothDesigner-Schriften einbinden (neben render.js liegt fonts-bd/fonts.css) und vorladen, damit schon der erste Druck sie hat
  (function loadBdFonts() {
    if (!G.document || !document.head) return;
    const me = document.currentScript && document.currentScript.src;
    if (!me || document.querySelector('link[data-bd-fonts]')) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.dataset.bdFonts = '1'; l.href = new URL('fonts-bd/fonts.css', me).href;
    l.onload = () => { if (!document.fonts) return;
      for (const f of ['Great Vibes', 'Dancing Script', 'Pacifico', 'Shrikhand', 'Righteous', 'Playfair Display', 'Bodoni Moda', 'Cormorant Garamond', 'Cinzel', 'Montserrat', 'Manrope'])
        for (const w of [400, 600, 700]) document.fonts.load(`${w} 40px "${f}"`).catch(() => {}); };
    document.head.appendChild(l);
  })();

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
  // Fotos werden stark verkleinert (Kamera ~3000 px → Layout 300 dpi, Streifen nur ~540 px breit): mit der
  // hochwertigen Glättung, sonst wirken Kanten und Haare unruhig und unscharf (Standard des Browsers ist „low“)
  const hq = x => { x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; return x; };
  // o.scale: dasselbe Layout in höherer Auflösung zeichnen (fertiges Foto der Fotobox). Koordinaten bleiben die des Layouts;
  // nur Schatten (shadowBlur/-Offset rechnen in echten Pixeln) werden mit SHS vergrößert.
  let SHS = 1;
  function drawCover(x, img, dx, dy, dw, dh) {
    const iw = img.naturalWidth || img.videoWidth || img.width, ih = img.naturalHeight || img.videoHeight || img.height;
    const s = Math.max(dw / iw, dh / ih), sw = dw / s, sh = dh / s, f = img.pmFocus;
    let sx = (iw - sw) / 2, sy = (ih - sh) / 2;
    // Fotos der Fotobox bringen die Lage der Gesichter mit (img.pmFocus, Anteile 0–1): so zuschneiden, dass alle Köpfe mit
    // Luft darüber im Feld bleiben. Ohne gefundenes Gesicht lieber unten als oben abschneiden. Logos und Designs: mittig.
    if (f && f.w) {
      const fx = f.x * iw, fy = f.y * ih, fw = f.w * iw, fh = f.h * ih;
      sx = Math.min(iw - sw, Math.max(0, fx + fw / 2 - sw / 2));
      sy = Math.min(ih - sh, Math.max(0, fh < sh ? fy - (sh - fh) * .35 : fy));
    } else if (f) sy = (ih - sh) * .3;
    hq(x).drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
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
        x.save(); x.shadowColor = '#00e5ff'; x.shadowBlur = (25 * s) * SHS; x.strokeStyle = '#00e5ff'; x.lineWidth = 5 * s;
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
      } },
    // Ohne Vorlage: nur das Foto, randlos über das ganze Blatt – kein Rahmen, kein Text (steht hinten, damit unbekannte Vorlagen weiter auf „Klassisch“ fallen)
    { id: 'plain', name: 'Ohne Vorlage (nur Foto)', cat: 'Ohne Vorlage', frame: '#ffffff', text: '#222222', accent: '#222222', font: 'modern', plain: true }
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
    const sc = o.scale || 1; SHS = sc;
    const c = document.createElement('canvas'); c.width = Math.round(L.w * sc); c.height = Math.round(L.h * sc);
    const x = hq(c.getContext('2d')); x.setTransform(sc, 0, 0, sc, 0, 0);
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
          x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = (24 * s) * SHS; x.shadowOffsetY = (8 * s) * SHS;
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
          if (t.slotBorder.glow) { x.shadowColor = t.slotBorder.glow; x.shadowBlur = (22 * s) * SHS; }
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
  // Papierformate (Zoll, kurze Seite zuerst), sortiert von klein nach groß. Je Format gibt es Hoch- und
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
  // Ausrichtung eines Layouts: 'portrait', 'landscape' oder '' (quadratisch – passt zu beiden). Bildschirm-Layouts tragen sie selbst.
  const layoutOrient = L => { if (!L) return ''; if (L.screen) return L.orient || '';
    const w = +L.w || 0, h = +L.h || 0; return h > w * 1.02 ? 'portrait' : w > h * 1.02 ? 'landscape' : ''; };
  // Layouts, die zur Ausrichtung der Fotobox passen (quadratische immer). Nie leer: ohne passendes Layout gelten alle.
  const pickForOrient = (list, o) => { const all = list || [], fit = all.filter(L => { const lo = layoutOrient(L); return !lo || lo === o; });
    return fit.length ? fit : all.slice(); };
  const uid = () => Math.random().toString(36).slice(2, 10);
  // Grundaufteilungen je Format: [Format, Anzahl Fotos, Fotofelder]
  function presetSlots(format, n, noBand = false) { // noBand: ohne Vorlage – kein Platz für Titel und Untertitel
    const F = FORMATS[format], W = F.w, H = F.h;
    const m = Math.round(Math.min(W, H) * .05), g = Math.round(m * .6);
    const tall = H / W >= 2, wide = W / H >= 2; // Streifen und Panoramen
    const bandH = noBand ? 0 : tall ? Math.round(W * .47) : Math.round(H * (W > H ? .17 : .15));
    const top = m, availH = H - bandH - m - (noBand ? m : m / 2), availW = W - 2 * m;
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
  // Auswahl beim Anlegen aus einer Vorlage: 4×6 Einzelbild und 3er-Collage (hoch und quer), Fotostreifen mit 2 (hoch) und 3 Fotos (quer)
  const PRESETS = [['4x6p', 1], ['4x6l', 1], ['4x6p', 3], ['4x6l', 3], ['2x6', 2], ['2x6l', 3]];
  // Neues Layout aus Format + Vorlage (Design) erzeugen
  function createLayout(format, n, tplId = 'classic', name) {
    const F = FORMATS[format], t = byId(tplId), W = F.w, H = F.h;
    if (t.plain) { // Ohne Vorlage: Einzelbild randlos über das ganze Blatt, mehrere Fotos mit schmalem weißem Rand – kein Text
      const ps = n === 1 ? [[0, 0, W, H]] : presetSlots(format, n, true);
      return { id: uid(), name: name || `${F.label} · ${n === 1 ? 'nur Foto' : `${n} Fotos ohne Vorlage`}`, format, w: W, h: H, bg: t.frame, tpl: t.id, twoPerPage: F.size === '2x6', secondary: false,
        elements: ps.map((s, i) => ({ id: uid(), type: 'photo', n: i + 1, x: Math.round(s[0]), y: Math.round(s[1]), w: Math.round(s[2]), h: Math.round(s[3]), rot: 0, radius: 0, stroke: '', strokeW: 0, shadow: false })) };
    }
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

  // Bilder (Logos, Designs) einmal laden und merken. Die Fotobox kann über setResolver eine lokal gespeicherte Fassung
  // (blob:-Adresse) unterschieben – dann gehen Vorlagen auch ohne Internet; Schlüssel bleibt die Original-Adresse.
  // Fehlgeschlagene Bilder werden nicht gemerkt, damit sie nach der Wiederverbindung neu geladen werden.
  const imgCache = new Map();
  let resolveSrc = null;
  const setResolver = fn => { resolveSrc = typeof fn === 'function' ? fn : null; };
  function loadImg(src) {
    if (!src) return Promise.resolve(null);
    if (imgCache.has(src)) { const i = imgCache.get(src); return i.complete ? Promise.resolve(i.naturalWidth ? i : null) : new Promise(r => { i.addEventListener('load', () => r(i)); i.addEventListener('error', () => r(null)); }); }
    const i = new Image(); i.crossOrigin = 'anonymous'; imgCache.set(src, i);
    return new Promise(r => { i.onload = () => r(i); i.onerror = () => { if (imgCache.get(src) === i) imgCache.delete(src); r(null); }; i.src = (resolveSrc && resolveSrc(src)) || src; });
  }
  const preloadLayout = L => Promise.all([L.bgImage, ...L.elements.filter(e => (e.type === 'image' || e.type === 'button') && e.src).map(e => e.src),
    ...L.elements.filter(e => e.type === 'sbtn').map(btnIconSrc)].filter(Boolean).map(loadImg));

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
  // Feste Schaltflächen der Fotobox über dem Startbildschirm: Galerie-Stapel (oben links) und Videonachricht-Karte. Im Editor sind sie
  // Ebenen wie alles andere (verschieben, Größe, ausblenden). Solange niemand sie verändert („auto“), stehen sie an der Standardstelle
  // der Fotobox und werden nicht gespeichert – dann gilt z. B. die Position aus „Videonachricht“ im Dashboard.
  // sys: { gallery: false = an dieser Fotobox ausgeschaltet, vmsg: { pos, size, title, sub } oder null }
  const VMSG_K = { s: .8, m: 1, l: 1.3 };
  const sysSig = e => [e.x, e.y, e.w, e.h, e.rot || 0, !!e.hidden, !!e.locked].join(',');
  function screenSys(L, sys = {}) {
    if (!L || !L.screen || L.kind === 'share') return L;
    const u = Math.min(L.w, L.h) / 100, R = Math.round;
    // unveränderte Standard-Schaltflächen neu setzen (Position aus den Einstellungen), veränderte bleiben, wo sie sind
    const els = L.elements.filter(e => !e.auto || sysSig(e) !== e._d).map(e => { if (e.auto) { delete e.auto; delete e._d; } return e; });
    const add = e => { Object.assign(e, { id: 'sys-' + e.type, rot: 0, auto: true }); e._d = sysSig(e); els.push(e); };
    let gal = els.find(e => e.type === 'gallery');
    if (!gal) add(gal = { type: 'gallery', x: R(2.4 * u), y: R(2.4 * u), w: R(15 * u), h: R(15 * u), hidden: sys.gallery === false });
    if (sys.vmsg && !els.some(e => e.type === 'vmsg')) {
      const v = sys.vmsg, w = R(28 * u * (VMSG_K[v.size] || 1)), h = R(w * 1.5), pos = ['tl', 'tr', 'bl', 'br'].includes(v.pos) ? v.pos : 'tl';
      const x = pos === 'tl' ? 2.4 * u : pos === 'bl' ? 3 * u : L.w - 3 * u - w;
      const y = pos === 'bl' || pos === 'br' ? L.h - 3 * u - h : pos === 'tl' && !gal.hidden ? 19.8 * u : 3 * u;
      add({ type: 'vmsg', x: R(x), y: R(y), w, h, hidden: false });
    }
    return { ...L, elements: els };
  }
  // Bildschirm zum Teilen: Foto, Filter-Leiste und Schaltflächen wie bisher „oben“ angeordnet (labels: Beschriftung unter den runden Symbolen)
  function createShare(orient, o = {}) {
    const F = SCREEN_SIZES[orient] || SCREEN_SIZES.portrait, land = F.w > F.h, u = Math.min(F.w, F.h) / 100, R = Math.round, els = [];
    const ph = F.h * (land ? .56 : .5), pw = Math.min(F.w * .9, land ? ph * 1.6 : F.w * .9);
    els.push({ id: uid(), type: 'spic', x: R((F.w - pw) / 2), y: R(F.h * (land ? .28 : .3)), w: R(pw), h: R(ph), rot: 0 });
    els.push({ id: uid(), type: 'sfil', x: R(F.w * .05), y: R(F.h * (land ? .165 : .19) - 3 * u), w: R(F.w * .9), h: R(6 * u), rot: 0 });
    const d = 9 * u, rh = o.labels ? d * 1.32 : d, cy = F.h * (land ? .085 : .07), row = ['bRetake', 'bDeco', 'bPrint', 'bQR', 'bDone'];
    const wOf = k => k === 'bRetake' ? 36 * u : k === 'bDone' ? 16 * u : d, gap = 2.4 * u;
    let x0 = (F.w - (row.reduce((a, k) => a + wOf(k), 0) + gap * (row.length - 1))) / 2;
    const btn = (key, x, y, w, h) => { const b = SHARE_DEF[key]; els.push({ id: uid(), type: 'sbtn', key, shape: b.shape, text: b.shape === 'pill' || o.labels ? b.text : '', fill: b.fill, color: b.color, font: 'modern', x: R(x), y: R(y), w: R(w), h: R(h), rot: 0 }); };
    for (const k of row) { const w = wOf(k), pill = SHARE_DEF[k].shape === 'pill', h = pill ? 6 * u : rh; btn(k, x0, cy - (pill ? h : d) / 2, w, h); x0 += w + gap; }
    btn('bMosaic', F.w - 3 * u - d, F.h * .5 - d / 2, d, rh); // erscheint nur, wenn Gäste selbst entscheiden, was ins Mosaik kommt
    return { id: uid(), screen: true, kind: 'share', orient: SCREEN_SIZES[orient] ? orient : 'portrait', w: F.w, h: F.h, theme: '', bg: '#222225', bgGrad: null, bgImage: '', bgFit: 'cover', live: false, elements: els };
  }
  // Ältere Gestaltung ohne eine der Schaltflächen (z. B. neue Funktion): fehlende an der Standardstelle ergänzen
  function shareSys(L) {
    if (!L || L.kind !== 'share') return L;
    const have = new Set(L.elements.map(e => e.type === 'sbtn' ? e.key : e.type)), def = createShare(L.orient);
    const miss = def.elements.filter(e => !have.has(e.type === 'sbtn' ? e.key : e.type));
    return miss.length ? { ...L, elements: [...L.elements, ...miss.map(e => ({ ...e, x: Math.round(e.x * L.w / def.w), y: Math.round(e.y * L.h / def.h) }))] } : L;
  }
  // Zum Speichern: unveränderte Standard-Schaltflächen weglassen, veränderte als normale Ebene behalten
  function screenStrip(L) {
    if (!L || !L.screen) return L;
    return { ...L, elements: L.elements.filter(e => !(e.auto && sysSig(e) === e._d)).map(e => { if (!e.auto) return e; const c = { ...e }; delete c.auto; delete c._d; return c; }) };
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
      x.save(); x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = (d * .12) * SHS; x.shadowOffsetY = (d * .04) * SHS;
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
  // Text: e.spacing = Buchstabenabstand in px, e.bg = { color, opacity, pad } Fläche hinter dem Text, e.grad = [Farben] Verlauf
  // von oben nach unten (z. B. Gold) – kommen aus übernommenen BoothDesigner-Designs, bleiben beim Bearbeiten erhalten
  function drawTextEl(x, e, vals) {
    const lines = fillText(e.text, vals).split('\n');
    const fam = FONTS[e.font] || FONTS.modern, w = e.w, h = e.h;
    let size = e.size === 'auto' || !e.size ? h / lines.length / 1.15 : +e.size;
    const setF = () => { x.font = `${e.italic ? 'italic ' : ''}${e.weight || 400} ${size}px ${fam}`; };
    const sp = +e.spacing || 0;
    if ('letterSpacing' in x) x.letterSpacing = sp ? sp + 'px' : '0px';
    setF();
    if (e.size === 'auto' || !e.size) while (size > 6 && Math.max(...lines.map(l => x.measureText(l).width)) > w) { size -= 1; setF(); }
    x.textBaseline = 'middle';
    x.textAlign = e.align || 'center';
    const ax = e.align === 'left' ? -w / 2 : e.align === 'right' ? w / 2 : 0;
    const lh = size * 1.15, y0 = -((lines.length - 1) * lh) / 2;
    if (e.bg && e.bg.color) {
      const tw = Math.max(...lines.map(l => x.measureText(l).width)), pad = +e.bg.pad || size * .3, bw = tw + pad * 2, bh = lines.length * lh + pad * 2;
      const bx = e.align === 'left' ? ax - pad : e.align === 'right' ? ax - tw - pad : -bw / 2;
      x.save(); x.shadowColor = 'transparent'; x.globalAlpha *= e.bg.opacity ?? 1; x.fillStyle = e.bg.color;
      rr(x, bx, y0 - lh / 2 - pad, bw, bh, Math.min(pad, bh / 2)); x.fill(); x.restore();
    }
    if (Array.isArray(e.grad) && e.grad.length > 1) {
      const g = x.createLinearGradient(0, y0 - lh / 2, 0, y0 + (lines.length - .5) * lh);
      e.grad.forEach((c, i) => g.addColorStop(i / (e.grad.length - 1), c)); x.fillStyle = g;
    } else x.fillStyle = e.color || '#222';
    lines.forEach((l, i) => x.fillText(l, ax, y0 + i * lh));
    if ('letterSpacing' in x) x.letterSpacing = '0px';
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
  // Schlagschatten: Farbe, Deckkraft, Winkel, Abstand, Weichheit (in Layout-Pixeln).
  // Ältere Layouts haben nur shadow = true – dann der bisherige weiche Schatten nach unten.
  function setShadow(x, e, w, h) {
    if (!e.shadow) return false;
    const m = Math.min(w, h), old = e.shDist == null, c = /^#[0-9a-f]{6}$/i.test(e.shColor || '') ? e.shColor : '#000000';
    const a = Math.max(0, Math.min(1, e.shOpacity ?? .35)), dist = old ? m * .015 : +e.shDist || 0, ang = (old ? 90 : +(e.shAngle ?? 90)) * Math.PI / 180;
    x.shadowColor = `rgba(${parseInt(c.slice(1, 3), 16)},${parseInt(c.slice(3, 5), 16)},${parseInt(c.slice(5, 7), 16)},${a})`;
    x.shadowBlur = (old ? m * .04 : Math.max(0, +e.shBlur || 0)) * SHS;
    x.shadowOffsetX = (Math.cos(ang) * dist) * SHS; x.shadowOffsetY = (Math.sin(ang) * dist) * SHS;
    return true;
  }
  function wrapLines(x, t, maxW, max) {
    const out = []; let line = '';
    for (const w of String(t || '').split(/\s+/).filter(Boolean)) {
      const tryL = line ? line + ' ' + w : w;
      if (x.measureText(tryL).width <= maxW || !line) line = tryL; else { out.push(line); line = w; }
    }
    if (line) out.push(line);
    if (out.length > max) { out.length = max; out[max - 1] += '…'; }
    return out;
  }
  // Galerie-Stapel der Fotobox (Editor-Vorschau): zwei schräge Fotokarten, oben ein Bild-Symbol
  function drawGalleryMock(x, w, h) {
    const s = Math.min(w, h), c = s * .41;
    for (const [deg, top] of [[-8, false], [4, true]]) {
      x.save(); x.rotate(deg * Math.PI / 180);
      x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = (s * .1) * SHS; x.shadowOffsetY = (s * .04) * SHS;
      x.fillStyle = '#ffffff'; rr(x, -c, -c, c * 2, c * 2, s * .025); x.fill(); x.restore();
      if (top) {
        const q = s * .17, cy = -s * .05; x.strokeStyle = '#8a8a8a'; x.lineWidth = s * .03; x.lineJoin = 'round'; x.lineCap = 'round';
        rr(x, -q * 1.25, cy - q, q * 2.5, q * 2, q * .25); x.stroke();
        x.beginPath(); x.arc(-q * .45, cy - q * .35, q * .25, 0, 7); x.stroke();
        x.beginPath(); x.moveTo(-q * 1.25, cy + q * .8); x.lineTo(-q * .15, cy - q * .05); x.lineTo(q * 1.25, cy + q * .7); x.stroke();
      }
      x.restore();
    }
  }
  // QR-Code-Muster für Vorschauen (kein echter Code)
  function qrPattern(x, x0, y0, size) {
    const n = 25, m = size / n; x.fillStyle = '#1D1D1B';
    const finder = (i, j) => (i < 7 && j < 7) || (i > n - 8 && j < 7) || (i < 7 && j > n - 8);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      let on;
      if (finder(i, j)) { const a = i > n - 8 ? i - (n - 7) : i, c = j > n - 8 ? j - (n - 7) : j; on = a === 0 || a === 6 || c === 0 || c === 6 || (a >= 2 && a <= 4 && c >= 2 && c <= 4); }
      else on = ((i * 7 + j * 13 + i * j * 3) % 7) < 3;
      if (on) x.fillRect(x0 + i * m, y0 + j * m, m + .5, m + .5);
    }
  }
  // QR-Code-Element (Teilen-Bildschirm, Fotolayout): weißes Feld mit dem echten Code (values.qr) bzw. einem Muster im Editor
  function drawQrEl(x, e, w, h, o) {
    const s = Math.min(w, h), pad = s * .06, img = o.values && o.values.qr;
    x.fillStyle = e.fill || '#ffffff'; rr(x, -s / 2, -s / 2, s, s, s * .06); x.fill();
    if (img && (img.naturalWidth || img.width)) { x.imageSmoothingEnabled = false; x.drawImage(img, -s / 2 + pad, -s / 2 + pad, s - 2 * pad, s - 2 * pad); x.imageSmoothingEnabled = true; }
    else if (o.placeholders) qrPattern(x, -s / 2 + pad, -s / 2 + pad, s - 2 * pad);
  }
  // ---------- Bildschirm zum Teilen (frei gestaltbar wie der Startbildschirm) ----------
  // Schaltflächen der Fotobox: [Schlüssel (id in der Fotobox), Name, Symbol, Form, Füllung, Text-/Symbolfarbe]
  const SHARE_BTNS = [
    ['bRetake', 'Löschen und wiederholen', 'refresh', 'pill', '', '#ffffff'],
    ['bDeco', 'Verzieren', 'sparkles', 'round', '#3a3a40', '#ffffff'],
    ['bPrint', 'Drucken', 'printer', 'round', '#e5484d', '#ffffff'],
    ['bQR', 'QR-Code', 'qr', 'round', '#8e3bd6', '#ffffff'],
    ['bMosaic', 'Mosaik', 'mosaic', 'round', '#0f9d76', '#ffffff'],
    ['bDone', 'Fertig', 'check', 'pill', '#ffffff', '#1D1D1B'],
  ];
  const SHARE_DEF = Object.fromEntries(SHARE_BTNS.map(([key, text, icon, shape, fill, color]) => [key, { key, text, icon, shape, fill, color }]));
  const icoUrl = (name, color) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="${color || '#ffffff'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${(G.ICONS || {})[name] || ''}</svg>`);
  const btnIconSrc = e => e.src || icoUrl(e.icon || (SHARE_DEF[e.key] || {}).icon || 'camera', e.color);
  function drawImgIn(x, src, X, Y, W, H) {
    const img = imgCache.get(src);
    if (!img || !img.complete || !img.naturalWidth) { if (!img) { const cb = onImg; loadImg(src).then(i => i && cb && cb()); } return; } // nach dem Laden neu zeichnen
    const k = Math.min(W / img.naturalWidth, H / img.naturalHeight), iw = img.naturalWidth * k, ih = img.naturalHeight * k;
    x.drawImage(img, X + (W - iw) / 2, Y + (H - ih) / 2, iw, ih);
  }
  // Eine Schaltfläche: rund (Symbol im Kreis, Beschriftung darunter) oder länglich (Symbol + Text in der Pille).
  // st: { sub: kleiner Text darunter (z. B. „Noch 3 Drucke“), disabled }
  function drawShareBtn(x, e, w, h, st) {
    const label = String(e.text || '').trim(), sub = st && st.sub ? String(st.sub) : '', fam = FONTS[e.font] || FONTS.modern, col = e.color || '#ffffff';
    if (st && st.disabled) x.globalAlpha *= .45;
    if (e.shape === 'pill') {
      x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = (h * .3) * SHS; x.shadowOffsetY = (h * .08) * SHS;
      rr(x, -w / 2, -h / 2, w, h, h / 2); if (e.fill) { x.fillStyle = e.fill; x.fill(); } x.restore();
      if (!e.fill) { x.strokeStyle = col; x.lineWidth = Math.max(2, h * .06); rr(x, -w / 2 + x.lineWidth / 2, -h / 2 + x.lineWidth / 2, w - x.lineWidth, h - x.lineWidth, h / 2); x.stroke(); }
      const ic = e.src ? h * .7 : h * .46, gap = h * .2; let size = h * .4;
      const setF = () => { x.font = `600 ${size}px ${fam}`; }; setF();
      while (label && size > 6 && ic + gap + x.measureText(label).width > w - h * .7) { size -= 1; setF(); }
      const tw = label ? x.measureText(label).width : 0, total = ic + (label ? gap + tw : 0), x0 = -total / 2;
      drawImgIn(x, btnIconSrc(e), x0, -ic / 2, ic, ic);
      if (label) { x.fillStyle = col; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(label, x0 + ic + gap, 0); }
      if (sub) { x.font = `600 ${h * .3}px ${fam}`; x.textAlign = 'center'; x.textBaseline = 'top'; x.fillStyle = '#ffffff'; x.fillText(sub, 0, h / 2 + h * .12); }
      return;
    }
    const d = Math.min(w, label ? h / 1.32 : h), cy = label ? -h / 2 + d / 2 : 0;
    if (e.src) drawImgIn(x, e.src, -d / 2, cy - d / 2, d, d);
    else {
      x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = (d * .2) * SHS; x.shadowOffsetY = (d * .06) * SHS;
      x.fillStyle = e.fill || '#3a3a40'; x.beginPath(); x.arc(0, cy, d / 2, 0, 7); x.fill(); x.restore();
      const ic = d * .46; drawImgIn(x, btnIconSrc(e), -ic / 2, cy - ic / 2, ic, ic);
    }
    let ty = cy + d / 2;
    if (label) {
      let size = d * .2; const setF = () => { x.font = `600 ${size}px ${fam}`; }; setF();
      while (size > 6 && x.measureText(label).width > Math.max(w, d * 1.8)) { size -= 1; setF(); }
      x.fillStyle = e.fill ? '#ffffff' : col; x.textAlign = 'center'; x.textBaseline = 'top'; x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = (size * .3) * SHS;
      x.fillText(label, 0, ty + d * .06); ty += d * .06 + size * 1.15; x.shadowColor = 'transparent';
    }
    if (sub) { x.font = `600 ${d * .17}px ${fam}`; x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'top'; x.fillText(sub, 0, ty + d * .05); }
  }
  // Editor-Vorschau: Foto der Gäste (Platzhalter) und Filter-Leiste
  function drawPhotoMock(x, w, h, par) { // par: Seitenverhältnis des Fotolayouts (Breite/Höhe), sonst nach dem Rahmen
    const ar = par > 0 ? par : h > w ? 2 / 3 : 3 / 2; let pw = w, ph = w / ar; if (ph > h) { ph = h; pw = h * ar; }
    x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = (Math.min(pw, ph) * .08) * SHS; x.shadowOffsetY = (Math.min(pw, ph) * .03) * SHS;
    x.fillStyle = '#ffffff'; x.fillRect(-pw / 2, -ph / 2, pw, ph); x.restore();
    const b = Math.min(pw, ph) * .025, iw = pw - 2 * b, ih = ph - 2 * b, g = x.createLinearGradient(-iw / 2, -ih / 2, iw / 2, ih / 2);
    g.addColorStop(0, '#4a4a52'); g.addColorStop(1, '#1b1b1f'); x.fillStyle = g; x.fillRect(-iw / 2, -ih / 2, iw, ih);
    x.save(); x.beginPath(); x.rect(-iw / 2, -ih / 2, iw, ih); x.clip();
    const r = Math.min(iw, ih) * .11;
    for (const [dx, c] of [[-.17, '#c9a98f'], [.17, '#b48a6e']]) {
      x.fillStyle = c; x.beginPath(); x.arc(dx * iw, -ih * .08, r, 0, 7); x.fill();
      x.fillStyle = dx < 0 ? '#2f3b52' : '#5a2f3e'; x.beginPath(); x.ellipse(dx * iw, ih * .42, r * 2.1, ih * .3, 0, Math.PI, 0); x.fill();
    }
    x.restore();
    x.fillStyle = 'rgba(255,255,255,.75)'; x.font = `700 ${Math.min(iw, ih) * .07}px system-ui,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'top';
    x.fillText(G.I18N_UI ? G.I18N_UI('Foto') : 'Foto', 0, -ih / 2 + ih * .05);
  }
  function drawChipsMock(x, w, h) {
    const names = ['Original', 'Schwarz-Weiß', 'Vintage', 'Warm'].map(n => G.I18N_UI ? G.I18N_UI(n) : n);
    let size = h * .42; x.font = `600 ${size}px system-ui,sans-serif`;
    const pad = h * .5, gap = h * .3, tot = () => names.reduce((a, n) => a + x.measureText(n).width + 2 * pad, 0) + gap * (names.length - 1);
    while (size > 6 && tot() > w) { size -= 1; x.font = `600 ${size}px system-ui,sans-serif`; }
    let cx = -tot() / 2;
    names.forEach((n, i) => {
      const cw = x.measureText(n).width + 2 * pad; rr(x, cx, -h / 2, cw, h, h / 2);
      x.fillStyle = i ? 'rgba(255,255,255,.12)' : '#F7C838'; x.fill();
      x.fillStyle = i ? '#ffffff' : '#1D1D1B'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(n, cx + cw / 2, 0); cx += cw + gap;
    });
  }
  // Videonachricht-Karte der Fotobox (Editor-Vorschau): Überschrift, QR-Code, Hinweis – Maße wie #vmCard in der Fotobox
  function drawVmsgMock(x, w, h, v) {
    const acc = /^#[0-9a-f]{3,8}$/i.test(v.accent || '') ? v.accent : '#F7C838', b = w * .0214, pad = w * .064, gap = w * .043, inner = w - 2 * (pad + b);
    x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = (w * .12) * SHS; x.shadowOffsetY = (w * .04) * SHS;
    x.fillStyle = '#ffffff'; rr(x, -w / 2, -h / 2, w, h, w * .093); x.fill(); x.restore();
    x.strokeStyle = acc; x.lineWidth = b; rr(x, -w / 2 + b / 2, -h / 2 + b / 2, w - b, h - b, w * .093 - b / 2); x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'top'; x.fillStyle = '#1D1D1B';
    const title = '🎥 ' + (v.title || 'Videonachricht hinterlassen');
    let fs = w * .11; x.font = `700 ${fs}px ${FONTS.modern}`;
    while (fs > w * .07 && wrapLines(x, title, inner, 9).length > 2) { fs *= .94; x.font = `700 ${fs}px ${FONTS.modern}`; } // lange Überschrift: kleiner statt abgeschnitten
    let y = -h / 2 + b + pad;
    for (const l of wrapLines(x, title, inner, 2)) { x.fillText(l, 0, y); y += fs * 1.12; }
    y += gap;
    qrPattern(x, -inner / 2, y, inner);
    y += inner + gap;
    const fs2 = w * .075; x.font = `400 ${fs2}px ${FONTS.modern}`; x.fillStyle = '#555555';
    for (const l of wrapLines(x, v.sub ?? 'Scanne den Code mit deinem Handy', inner, 2)) { x.fillText(l, 0, y); y += fs2 * 1.25; }
  }
  // Layout zeichnen. o: { photos, values, filter, placeholders (Editor-Vorschau) }
  let onImg = null; // o.redraw der laufenden Zeichnung: wird aufgerufen, sobald ein noch fehlendes Symbol geladen ist
  function renderLayout(L, o = {}, into) {
    onImg = o.redraw || null;
    const c = into || document.createElement('canvas');
    const sc = o.scale || 1, cw = Math.round(L.w * sc), ch = Math.round(L.h * sc); SHS = sc;
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    const x = hq(c.getContext('2d'));
    x.setTransform(sc, 0, 0, sc, 0, 0);
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
        if (e.shadow) { x.save(); setShadow(x, e, w, h); x.fillStyle = '#fff'; rr(x, -w / 2, -h / 2, w, h, rad); x.fill(); x.restore(); }
        x.save(); rr(x, -w / 2, -h / 2, w, h, rad); x.clip();
        const img = photos.length ? photos[((e.n || 1) - 1) % photos.length] : null;
        if (img) { if (o.filter && o.filter !== 'none') x.filter = o.filter; drawCover(x, img, -w / 2, -h / 2, w, h); }
        else placeholderPhoto(x, e, w, h);
        x.restore();
        if (e.stroke && e.strokeW) { x.strokeStyle = e.stroke; x.lineWidth = e.strokeW; rr(x, -w / 2, -h / 2, w, h, rad); x.stroke(); }
      } else if (e.type === 'image') {
        const img = imgCache.get(e.src);
        if (img && img.complete && img.naturalWidth) {
          setShadow(x, e, w, h);
          if (e.fit === 'cover') drawCover(x, img, -w / 2, -h / 2, w, h);
          else if (e.fit === 'contain') { const k = Math.min(w / img.naturalWidth, h / img.naturalHeight); x.drawImage(img, -img.naturalWidth * k / 2, -img.naturalHeight * k / 2, img.naturalWidth * k, img.naturalHeight * k); }
          else x.drawImage(img, -w / 2, -h / 2, w, h);
        } else if (o.placeholders) { x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(-w / 2, -h / 2, w, h); }
      } else if (e.type === 'button') {
        drawButtonEl(x, e);
      } else if (e.type === 'gallery') { // an der Fotobox echte Schaltflächen über dem Startbildschirm – gezeichnet nur im Editor
        if (o.placeholders) drawGalleryMock(x, w, h);
      } else if (e.type === 'vmsg') {
        if (o.placeholders && o.vmsg) drawVmsgMock(x, w, h, o.vmsg);
      } else if (e.type === 'sbtn') { // Teilen-Bildschirm: an der Fotobox liegt darüber die (unsichtbare) echte Schaltfläche
        if (o.faded && o.faded.has(e.key)) x.globalAlpha *= .35; // Editor: in den Einstellungen ausgeschaltet
        if (!(o.off && o.off.has(e.key))) drawShareBtn(x, e, w, h, o.state && o.state[e.key]);
      } else if (e.type === 'spic') {
        if (o.placeholders) drawPhotoMock(x, w, h, typeof o.photoAr === 'function' ? o.photoAr(L) : o.photoAr); // Zahl oder je Layout (Hoch/Quer)
      } else if (e.type === 'sfil') {
        if (o.placeholders) drawChipsMock(x, w, h);
      } else if (e.type === 'qr') {
        drawQrEl(x, e, w, h, o);
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
        setShadow(x, e, w, h); drawTextEl(x, e, o.values);
      } else if (e.type === 'shape') {
        setShadow(x, e, w, h); x.beginPath();
        if (e.shape === 'ellipse') x.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); else rr(x, -w / 2, -h / 2, w, h, e.radius || 0);
        if (e.fill) { x.fillStyle = e.fill; x.fill(); x.shadowColor = 'transparent'; }
        if (e.stroke && e.strokeW) { x.strokeStyle = e.stroke; x.lineWidth = e.strokeW; x.stroke(); }
      }
      x.restore();
    }
    return c;
  }
  // Druckbogen „2 pro Seite“: zwei Ausdrucke auf einem Blatt, entlang der kurzen Seite nebeneinander –
  // z. B. 2×6-Streifen auf 4×6, 4×6 auf 6×8, 5×7 auf 8×10. Der Drucker schneidet sie auseinander.
  const sheetOf = L => !L.twoPerPage ? { w: L.w, h: L.h } : L.w <= L.h ? { w: L.w * 2, h: L.h, dx: L.w, dy: 0 } : { w: L.w, h: L.h * 2, dx: 0, dy: L.h };
  function renderSheet(L, o = {}) {
    const one = renderLayout(L, o);
    if (!L.twoPerPage) return one;
    const S = sheetOf(L), c = document.createElement('canvas'); c.width = S.w; c.height = S.h;
    const x = c.getContext('2d'); x.drawImage(one, 0, 0); x.drawImage(one, S.dx, S.dy);
    return c;
  }

  G.FBR = { FONTS, FONT_NAMES, LAYOUTS, TEMPLATES, templateById: byId, render, drawBand, drawCover, placeholder, setResolver,
    FORMATS, SIZE_LIST, formatKey, layoutOrient, pickForOrient, sheetOf, PRESETS, presetSlots, createLayout, photoCount, renderLayout, renderSheet, loadImg, preloadLayout, fillText, uid,
    SCREEN_SIZES, SCREEN_THEMES, createScreen, adaptScreen, applyTheme, screenSys, screenStrip, createShare, shareSys, SHARE_BTNS };
})(window);
