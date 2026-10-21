// Photobox Memories – Virtueller Berater: Animationsbibliothek (wie die „Shop-Medien“ bei LumaBooth).
// Die Animationen werden live gezeichnet statt als Video abgespielt: Sie passen sich jedem Bildschirm an (Hoch- und Querformat),
// sprechen die Sprache der Gäste und brauchen keine Dateien. Gleiche Datei in der Fotobox und im Dashboard (Vorschau).
// AdvisorAnim.play(canvas, id, { style, text, loop, preview, solid }) → { done: Promise<boolean>, stop() }
// AdvisorAnim.frame(ctx, w, h, sekunden, id, style, text) zeichnet ein Einzelbild (Vorschau-Kacheln).
(function (G) {
  'use strict';
  // Animationen: Schritt = wofür sie gedacht ist (Vorschlag in der Bibliothek), loop = läuft, bis der nächste Schritt kommt
  const LIB = [
    { id: 'touch', name: 'Tippen zum Starten', text: 'Tippen zum Starten!', icon: 'pointer', step: 'touch', loop: true, soft: true },
    { id: 'ready', name: 'Mach dich bereit', text: 'Mach dich bereit!', icon: 'camera', step: 'pre' },
    { id: 'pose', name: 'Lustige Pose', text: 'Und jetzt eine lustige Pose!', icon: 'smile', step: 'pre' },
    { id: 'together', name: 'Alle zusammen', text: 'Alle schön zusammenrücken!', icon: 'users', step: 'pre' },
    { id: 'last', name: 'Letztes Foto', text: 'Letztes Foto!', icon: 'camera', step: 'pre' },
    { id: 'cheese', name: 'Cheese', text: 'Cheese!', icon: 'smile', step: 'countdown' },
    { id: 'smile', name: 'Bitte lächeln', text: 'Bitte lächeln!', icon: 'smile', step: 'countdown' },
    { id: 'looking', name: 'Sieht super aus', text: 'Sieht super aus!', icon: 'star', step: 'post' },
    { id: 'bestsmile', name: 'Schönstes Lächeln', text: 'Du hast das schönste Lächeln!', icon: 'heart', step: 'post' },
    { id: 'lightup', name: 'Du strahlst', text: 'Du bringst alle zum Strahlen!', icon: 'sun', step: 'post' },
    { id: 'model', name: 'Wie ein Model', text: 'Bist du etwa ein Model?', icon: 'star', step: 'post' },
    { id: 'wow', name: 'Wow', text: 'Wow!', icon: 'sparkles', step: 'post' },
    { id: 'effect', name: 'Effekt wählen', text: 'Wähle einen Effekt!', icon: 'wand', step: 'effect' },
    { id: 'sign', name: 'Unterschreiben', text: 'Unterschreib hier!', icon: 'pen', step: 'sign' },
    { id: 'processing', name: 'Einen Moment', text: 'Einen Moment …', icon: 'hourglass', step: 'proc', loop: true },
    { id: 'done', name: 'Fertig', text: 'Fertig! Schau dir dein Foto an', icon: 'check', step: 'done' },
    { id: 'thanks', name: 'Danke', text: 'Danke – bis gleich!', icon: 'party', step: 'end' },
  ];
  const STYLES = [
    { id: 'neon', name: 'Neon-Party' }, { id: 'gold', name: 'Elegant Gold' }, { id: 'pop', name: 'Pop-Art' },
    { id: 'clean', name: 'Modern' }, { id: 'confetti', name: 'Konfetti' },
  ];
  // Schritte wie bei LumaBooth: [Schlüssel, Name, mehrere Dateien/Animationen erlaubt (Randomisieren)]
  const STEPS = [['touch', 'Startbildschirm', 0], ['countdown', 'Countdown', 0], ['effect', 'Wähle einen Effekt aus', 0], ['sign', 'Vor der Unterschrift', 0],
    ['pre', 'Vor dem Countdown', 1], ['post', 'Nach der Aufnahme', 1], ['proc', 'Während der Verarbeitung', 0], ['done', 'Nach der Verarbeitung', 0], ['end', 'Ende der Session', 0]];
  // Vorschlag, solange im Ereignis nichts gewählt ist
  const DEFAULT_STEPS = { touch: ['touch'], countdown: [], effect: ['effect'], sign: ['sign'], pre: ['ready', 'pose', 'together'],
    post: ['looking', 'bestsmile', 'lightup', 'model', 'wow'], proc: ['processing'], done: ['done'], end: ['thanks'] };
  const byId = id => LIB.find(x => x.id === id) || null;

  // ---------- Hilfen ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const outCubic = t => 1 - Math.pow(1 - t, 3);
  const outBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const rnd = s => { const v = Math.sin(s * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }; // feste Zufallswerte
  const font = (w, size, fam) => `${w} ${size}px ${fam || ((G.FBR && G.FBR.FONTS && G.FBR.FONTS.modern) || 'system-ui,sans-serif')}`;
  // Symbole aus icons.js als Pfade (Linien-Icons, 24 × 24) – lassen sich in jeder Farbe und mit Leuchten zeichnen
  const pathCache = {};
  function iconPaths(name) {
    if (pathCache[name]) return pathCache[name];
    const src = (G.ICONS || {})[name] || '', out = [];
    const attr = (t, a) => { const m = t.match(new RegExp('(?:^|\\s)' + a + '="([^"]*)"')); return m ? m[1] : null; };
    for (const m of src.matchAll(/<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*)>/g)) {
      const tag = m[1], t = m[2], p = new Path2D(), n = a => +attr(t, a) || 0;
      if (tag === 'path') p.addPath(new Path2D(attr(t, 'd') || ''));
      else if (tag === 'circle') p.arc(n('cx'), n('cy'), n('r'), 0, Math.PI * 2);
      else if (tag === 'ellipse') p.ellipse(n('cx'), n('cy'), n('rx'), n('ry'), 0, 0, Math.PI * 2);
      else if (tag === 'rect') { if (p.roundRect) p.roundRect(n('x'), n('y'), n('width'), n('height'), n('rx')); else p.rect(n('x'), n('y'), n('width'), n('height')); }
      else if (tag === 'line') { p.moveTo(n('x1'), n('y1')); p.lineTo(n('x2'), n('y2')); }
      else { const pts = (attr(t, 'points') || '').trim().split(/[\s,]+/).map(Number); for (let i = 0; i + 1 < pts.length; i += 2) i ? p.lineTo(pts[i], pts[i + 1]) : p.moveTo(pts[i], pts[i + 1]); if (tag === 'polygon') p.closePath(); }
      out.push(p);
    }
    return (pathCache[name] = out);
  }
  function drawIcon(x, name, cx, cy, size, color, lw = 2) {
    x.save(); x.translate(cx - size / 2, cy - size / 2); x.scale(size / 24, size / 24);
    x.strokeStyle = color; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const p of iconPaths(name)) x.stroke(p);
    x.restore();
  }
  // Text auf höchstens zwei Zeilen umbrechen und so groß wie möglich einpassen
  function fitText(x, txt, maxW, fs, weight, fam) {
    const words = String(txt).split(/\s+/).filter(Boolean);
    const min = Math.max(4, fs * .3);
    for (let s = fs; s > min; s *= .93) {
      x.font = font(weight, s, fam);
      if (x.measureText(txt).width <= maxW) return { lines: [txt], fs: s };
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
        if (x.measureText(a).width <= maxW && x.measureText(b).width <= maxW) return { lines: [a, b], fs: s };
      }
    }
    x.font = font(weight, min, fam); const half = Math.ceil(words.length / 2);
    return { lines: words.length > 1 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : [txt], fs: min };
  }
  // Symbol-Bewegung je Animation (Tippen, Sanduhr, Herzschlag, Blitz …)
  function iconMotion(it, sec, a) {
    if (it.id === 'touch') { const p = (sec % 1.6) / 1.6; return { s: 1 - .12 * Math.sin(clamp(p / .25) * Math.PI), r: 0, tap: p }; }
    if (it.id === 'processing') { const p = (sec % 1.6) / 1.6; return { s: 1, r: outCubic(clamp((p - .55) / .35)) * Math.PI, tap: -1 }; }
    if (it.icon === 'heart') return { s: outBack(a) * (1 + .08 * Math.max(0, Math.sin(sec * 7))), r: 0, tap: -1 };
    return { s: outBack(a), r: Math.sin(sec * 3) * .06 * a, tap: -1 };
  }
  // Tipp-Wellen unter dem Finger (Startbildschirm)
  function ripples(x, cx, cy, size, p, color) {
    if (p < 0) return;
    for (let k = 0; k < 2; k++) {
      const q = clamp((p - k * .18) / .7); if (q <= 0 || q >= 1) continue;
      x.save(); x.globalAlpha *= (1 - q) * .9; x.strokeStyle = color; x.lineWidth = size * .04;
      x.beginPath(); x.arc(cx, cy, size * (.15 + q * .6), 0, Math.PI * 2); x.stroke(); x.restore();
    }
  }
  // dunkler Schleier hinter der Animation (auf dem Startbildschirm nur ganz leicht – dort soll man den Bildschirm noch sehen)
  const veil = (x, it, fill, W, H) => { x.save(); x.globalAlpha *= it.soft ? .25 : 1; x.fillStyle = fill; x.fillRect(0, 0, W, H); x.restore(); };
  const dots = (sec, txt) => /…$/.test(txt) ? txt.replace(/…$/, '') + '.'.repeat(1 + Math.floor(sec * 2.5) % 3) : txt; // „Einen Moment …“ mit laufenden Punkten

  // ---------- Stile ----------
  const DRAW = {
    // Neon: dunkler Schleier, leuchtende Schrift in Pink/Türkis, flackert beim Einschalten
    neon(x, W, H, sec, it, txt, fs, a) {
      const m = Math.min(W, H), cx = W / 2, cy = H / 2, flick = sec < .5 ? (Math.sin(sec * 90) > -.2 ? 1 : .35) : 1;
      const g = x.createRadialGradient(cx, cy, m * .1, cx, cy, Math.max(W, H) * .75);
      g.addColorStop(0, 'rgba(25,0,45,.55)'); g.addColorStop(1, 'rgba(5,0,15,.75)'); veil(x, it, g, W, H);
      x.globalAlpha *= flick;
      const mo = iconMotion(it, sec, a), is = fs * 1.9, iy = cy - fs * 1.35;
      x.save(); x.translate(cx, iy); x.rotate(mo.r); x.scale(mo.s, mo.s);
      x.shadowColor = '#29e7ff'; x.shadowBlur = fs * .6; drawIcon(x, it.icon, 0, 0, is, '#bff8ff', 1.7); drawIcon(x, it.icon, 0, 0, is, '#29e7ff', 1); x.restore();
      ripples(x, cx, iy + is * .35, is, mo.tap, '#29e7ff');
      const t = fitText(x, dots(sec, txt), W * .86, fs, 800); let y = cy + fs * .55;
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font(800, t.fs);
      for (const l of t.lines) {
        x.save(); x.shadowColor = '#ff2bd6'; x.shadowBlur = t.fs * .55; x.strokeStyle = '#ff2bd6'; x.lineWidth = t.fs * .09; x.strokeText(l, cx, y);
        x.shadowBlur = t.fs * .2; x.fillStyle = '#ffe6fb'; x.fillText(l, cx, y); x.restore(); y += t.fs * 1.12;
      }
      const bw = W * .5 * outCubic(clamp((sec - .2) / .6)); // Leuchtstreifen
      x.save(); x.shadowColor = '#29e7ff'; x.shadowBlur = fs * .4; x.fillStyle = '#29e7ff'; x.fillRect(cx - bw / 2, y - t.fs * .25, bw, Math.max(2, fs * .05)); x.restore();
    },
    // Elegant Gold: weiche Vignette, goldene Schrift, funkelnde Sterne
    gold(x, W, H, sec, it, txt, fs, a) {
      const m = Math.min(W, H), cx = W / 2, cy = H / 2;
      const g = x.createRadialGradient(cx, cy, m * .15, cx, cy, Math.max(W, H) * .7);
      g.addColorStop(0, 'rgba(20,14,4,.35)'); g.addColorStop(1, 'rgba(10,7,2,.7)'); veil(x, it, g, W, H);
      const lift = (1 - outCubic(a)) * fs * .6, mo = iconMotion(it, sec, a), is = fs * 1.6, iy = cy - fs * 1.3 + lift;
      for (let i = 0; i < 18; i++) { // Funkeln
        const px = cx + (rnd(i) - .5) * W * .8, py = cy + (rnd(i + 40) - .5) * H * .55, tw = .5 + .5 * Math.sin(sec * (2 + rnd(i + 9) * 3) + i), s = fs * (.08 + rnd(i + 5) * .12) * tw;
        x.save(); x.globalAlpha *= tw * .9; x.fillStyle = '#ffe9a8'; x.translate(px, py); x.beginPath();
        for (let k = 0; k < 8; k++) { const r = k % 2 ? s * .25 : s; x.lineTo(Math.cos(k * Math.PI / 4) * r, Math.sin(k * Math.PI / 4) * r); } x.fill(); x.restore();
      }
      const gold = y0 => { const gr = x.createLinearGradient(0, y0 - fs, 0, y0 + fs); gr.addColorStop(0, '#fff3c4'); gr.addColorStop(.5, '#e9c46a'); gr.addColorStop(1, '#b8862f'); return gr; };
      x.save(); x.translate(cx, iy); x.rotate(mo.r); x.scale(mo.s, mo.s); x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = fs * .2; drawIcon(x, it.icon, 0, 0, is, gold(0), 1.4); x.restore();
      ripples(x, cx, iy + is * .35, is, mo.tap, '#e9c46a');
      const lw = W * .14 * outCubic(clamp((sec - .15) / .6)); x.fillStyle = '#e9c46a'; // feine Linien links und rechts
      x.fillRect(cx - is * .75 - lw, iy, lw, Math.max(1.5, fs * .03)); x.fillRect(cx + is * .75, iy, lw, Math.max(1.5, fs * .03));
      const fam = (G.FBR && G.FBR.FONTS && G.FBR.FONTS.elegant) || 'Georgia,serif';
      const t = fitText(x, dots(sec, txt), W * .84, fs * 1.05, 600, fam); let y = cy + fs * .5 + lift;
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font(600, t.fs, fam);
      for (const l of t.lines) { x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = t.fs * .18; x.shadowOffsetY = t.fs * .05; x.fillStyle = gold(y); x.fillText(l, cx, y); x.restore(); y += t.fs * 1.15; }
    },
    // Pop-Art: gelbe Comic-Explosion mit Raster, dicke schwarze Kontur, federt herein
    pop(x, W, H, sec, it, txt, fs, a) {
      const cx = W / 2, cy = H / 2, sc = outBack(a), rot = (-7 + Math.sin(sec * 2.2) * 2) * Math.PI / 180;
      const t = fitText(x, dots(sec, txt).toUpperCase(), W * .72, fs * 1.05, 900);
      const bw = Math.min(W * .94, Math.max(...t.lines.map(l => { x.font = font(900, t.fs); return x.measureText(l).width; })) + fs * 3), bh = Math.min(H * .7, fs * (3.6 + t.lines.length * 1.15));
      x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sc, sc);
      const burst = () => { x.beginPath(); for (let k = 0; k < 32; k++) { const ang = k * Math.PI / 16, r = k % 2 ? .78 : 1; x.lineTo(Math.cos(ang) * bw / 2 * r, Math.sin(ang) * bh / 2 * r); } x.closePath(); };
      x.fillStyle = '#111'; x.save(); x.translate(fs * .18, fs * .22); burst(); x.fill(); x.restore();
      burst(); x.fillStyle = '#ffd60a'; x.fill(); x.save(); x.clip();
      x.fillStyle = 'rgba(255,77,109,.35)'; const d = fs * .32; for (let yy = -bh / 2; yy < bh / 2; yy += d) for (let xx = -bw / 2 + ((yy / d) % 2 ? d / 2 : 0); xx < bw / 2; xx += d) { x.beginPath(); x.arc(xx, yy, d * .18, 0, 7); x.fill(); }
      x.restore(); x.lineWidth = fs * .12; x.strokeStyle = '#111'; x.lineJoin = 'round'; burst(); x.stroke();
      const mo = iconMotion(it, sec, a), is = fs * 1.35, iy = -fs * (t.lines.length * .55 + .55);
      x.save(); x.translate(0, iy); x.rotate(mo.r); x.scale(mo.s, mo.s); x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, is * .72, 0, 7); x.fill(); x.lineWidth = fs * .08; x.strokeStyle = '#111'; x.stroke();
      drawIcon(x, it.icon, 0, 0, is * .82, '#111', 2.4); x.restore();
      let y = iy + is * .9 + t.fs * .55; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font(900, t.fs);
      for (const l of t.lines) { x.lineWidth = t.fs * .16; x.strokeStyle = '#111'; x.strokeText(l, 0, y); x.fillStyle = '#fff'; x.fillText(l, 0, y); y += t.fs * 1.1; }
      x.restore();
    },
    // Modern: weiße Karte gleitet von unten herein, gelber Kreis mit Symbol (Photobox-Farben)
    clean(x, W, H, sec, it, txt, fs, a, loop) {
      const m = Math.min(W, H), land = W > H, cardW = Math.min(W * .9, m * (land ? 1.15 : .92)), slide = (1 - outCubic(a)) * H * .25;
      const t = fitText(x, dots(sec, txt), Math.max(cardW * .5, cardW - fs * 3.6), fs * .82, 700), cardH = Math.max(fs * 2.7, t.lines.length * t.fs * 1.2 + fs * 1.4);
      const x0 = (W - cardW) / 2, y0 = H * (land ? .7 : .72) - cardH / 2 + slide;
      x.save(); x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = fs * .8; x.shadowOffsetY = fs * .2; x.fillStyle = '#ffffff';
      x.beginPath(); if (x.roundRect) x.roundRect(x0, y0, cardW, cardH, fs * .5); else x.rect(x0, y0, cardW, cardH); x.fill(); x.restore();
      const mo = iconMotion(it, sec, a), r = fs * 1.05, icx = x0 + fs * .5 + r, icy = y0 + cardH / 2;
      x.save(); x.translate(icx, icy); x.scale(mo.s, mo.s); x.rotate(mo.r); x.fillStyle = '#F7C838'; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); drawIcon(x, it.icon, 0, 0, r * 1.15, '#1D1D1B', 2.2); x.restore();
      ripples(x, icx, icy, r * 2.2, mo.tap, '#F7C838');
      let y = icy - (t.lines.length - 1) * t.fs * .6; x.textAlign = 'left'; x.textBaseline = 'middle'; x.font = font(700, t.fs); x.fillStyle = '#1D1D1B';
      for (const l of t.lines) { x.fillText(l, icx + r + fs * .55, y); y += t.fs * 1.2; }
      if (loop) { const p = (sec % 1.6) / 1.6; x.fillStyle = '#F7C838'; x.fillRect(x0 + fs * .5, y0 + cardH - fs * .22, (cardW - fs) * p, Math.max(2, fs * .07)); }
    },
    // Konfetti: bunter Regen, große Schrift mit farbigem Schatten
    confetti(x, W, H, sec, it, txt, fs, a) {
      veil(x, it, 'rgba(0,0,0,.35)', W, H);
      const cols = ['#F7C838', '#ff7b54', '#4cc9f0', '#f72585', '#b5e48c', '#ffffff'];
      for (let i = 0; i < 90; i++) {
        const sp = .35 + rnd(i) * .5, ph = ((sec * sp + rnd(i + 3)) % 1.2) - .1, px = rnd(i + 7) * W + Math.sin(sec * 2 + i) * W * .02, py = ph * H;
        x.save(); x.translate(px, py); x.rotate(sec * (2 + rnd(i + 2) * 4) + i); x.fillStyle = cols[i % cols.length]; x.fillRect(-fs * .09, -fs * .04, fs * .18, fs * .08); x.restore();
      }
      const cx = W / 2, cy = H / 2, sc = outBack(a), mo = iconMotion(it, sec, a), is = fs * 1.7, iy = cy - fs * 1.3;
      x.save(); x.translate(cx, iy); x.rotate(mo.r); x.scale(mo.s, mo.s); x.shadowColor = '#f72585'; x.shadowBlur = fs * .25; drawIcon(x, it.icon, 0, 0, is, '#ffffff', 2); x.restore();
      ripples(x, cx, iy + is * .35, is, mo.tap, '#ffffff');
      const t = fitText(x, dots(sec, txt), W * .86, fs * 1.05, 900); let y = cy + fs * .55;
      x.save(); x.translate(cx, y); x.scale(sc, sc); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font(900, t.fs); let yy = 0;
      for (const l of t.lines) { x.fillStyle = '#f72585'; x.fillText(l, t.fs * .06, yy + t.fs * .08); x.fillStyle = '#ffffff'; x.fillText(l, 0, yy); yy += t.fs * 1.1; }
      x.restore();
    },
  };

  // Deckender Hintergrund je Stil (Standard): Video bzw. Livebild darunter scheinen nicht durch. Durchsichtig nur auf Wunsch
  // (Einstellung „Hintergrund der Animationen“), dann liegt nur der leichte Schleier des Stils über dem Bildschirm.
  const BG = { neon: '#0b0014', gold: '#100b04', pop: '#3ec1d3', clean: '#1D1D1B', confetti: '#15121f' };
  // Ein Einzelbild: sec = Sekunden seit dem Start, D = Dauer (endlos bei Schleifen), solid = deckender Hintergrund
  function frame(x, W, H, sec, id, style, text, D = 2.6, solid = false) {
    const it = byId(id) || LIB[0], st = DRAW[style] ? style : 'neon', loop = !!it.loop || !isFinite(D);
    const a = outCubic(clamp(sec / .45)), out = loop ? 0 : clamp((sec - (D - .4)) / .4);
    x.save(); x.globalAlpha = clamp(a * 1.6) * (1 - out);
    if (solid) { x.fillStyle = BG[st]; x.fillRect(0, 0, W, H); }
    DRAW[st](x, W, H, sec, it, text || it.text, Math.min(W, H) * (W > H ? .095 : .11), a, loop);
    x.restore();
  }
  // Abspielen auf einer Leinwand (passt sich ihrer Größe an). preview: endlos wiederholen (Kacheln im Editor)
  function play(cv, id, o = {}) {
    const it = byId(id); if (!it || !cv) return { done: Promise.resolve(false), stop() {} };
    const x = cv.getContext('2d'), loop = o.loop ?? !!it.loop, D = o.duration || 2.6;
    // Sparsam zeichnen: höchstens 30 Bilder pro Sekunde und höchstens 1440 Pixel an der langen Seite (die Leinwand wird per CSS
    // auf Bildschirmgröße gezogen). Sonst bremst die Schleife auf dem Startbildschirm einen schwachen Fotobox-PC aus, wenn
    // darunter noch Video oder Livebild laufen (Leuchteffekte mit shadowBlur sind teuer).
    const FPS = o.fps || 30, MAXPX = o.maxPx || 1440;
    let raf = 0, t0 = 0, last = 0, stopped = false, resolve;
    const done = new Promise(r => { resolve = r; });
    const finish = ok => { if (stopped) return; stopped = true; cancelAnimationFrame(raf); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); resolve(ok); };
    const tick = ts => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      if (last && ts - last < 1000 / FPS - 2) return;
      last = ts; if (!t0) t0 = ts;
      const sec = (ts - t0) / 1000, W = cv.clientWidth || cv.width, H = cv.clientHeight || cv.height;
      const k = Math.min(Math.min(2, G.devicePixelRatio || 1), MAXPX / Math.max(W, H, 1)), cw = Math.round(W * k), ch = Math.round(H * k);
      if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
      x.setTransform(k, 0, 0, k, 0, 0); x.clearRect(0, 0, W, H);
      if (o.preview && !loop) frame(x, W, H, sec % (D + .7), id, o.style, o.text, D, !!o.solid);
      else frame(x, W, H, sec, id, o.style, o.text, loop ? Infinity : D, !!o.solid);
      if (!loop && !o.preview && sec >= D) finish(true);
    };
    raf = requestAnimationFrame(tick);
    return { done, stop: () => finish(false) };
  }
  // ---------- Bibliothek zum Auswählen (Fotobox und Dashboard) ----------
  const tr = s => (G.I18N_UI ? G.I18N_UI(s) : s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Vorschau-Kachel: Leinwand in el, Animation läuft in Schleife; gibt stop() zurück
  function tile(el, id, style, text) {
    const cv = document.createElement('canvas'); cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; el.appendChild(cv);
    return play(cv, id, { style, preview: true, text, solid: true }).stop;
  }
  const CSS = `
  .aa-dlg{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .aa-dlg>div{background:#232326;color:#f2f2f2;border-radius:14px;width:min(1100px,96vw);max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 70px rgba(0,0,0,.6)}
  .aa-dlg .hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 18px;border-bottom:1px solid #3d3d44}
  .aa-dlg .hd b{font-size:17px;flex:1;min-width:200px}
  .aa-dlg select{background:#1c1c1f;color:#f2f2f2;border:1px solid #5a5a62;border-radius:8px;padding:6px 8px;font:inherit}
  .aa-dlg .seg{display:inline-flex;border:1px solid #5a5a62;border-radius:8px;overflow:hidden}.aa-dlg .seg button{background:none;border:0;color:#f2f2f2;padding:6px 10px;font:inherit;cursor:pointer}
  .aa-dlg .seg button.on{background:#F7C838;color:#1D1D1B;font-weight:700}
  .aa-dlg .gr{overflow:auto;padding:16px 18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
  .aa-dlg .gr.land{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
  .aa-dlg .it{cursor:pointer;border:2px solid transparent;border-radius:12px;padding:4px;background:none;color:inherit;font:inherit;text-align:center}
  .aa-dlg .it.on{border-color:#F7C838;background:rgba(249,203,56,.12)}
  .aa-dlg .pv{position:relative;aspect-ratio:9/16;border-radius:9px;overflow:hidden;background:linear-gradient(160deg,#5a6070,#262a33)}
  .aa-dlg .land .pv{aspect-ratio:16/9}
  .aa-dlg .nm{font-size:12px;margin-top:5px} .aa-dlg .nm small{display:block;color:#a9a9b0;font-size:11px}
  .aa-dlg .ft{display:flex;justify-content:flex-end;gap:10px;padding:12px 18px;border-top:1px solid #3d3d44}
  .aa-dlg .ft button{border-radius:999px;padding:8px 18px;font:inherit;cursor:pointer;border:1px solid #8e8e94;background:none;color:#f2f2f2}
  .aa-dlg .ft button.p{background:#F7C838;border-color:#F7C838;color:#1D1D1B;font-weight:700}`;
  // o: { style, selected: [ids], multi, step } → Promise<{ ids, style } | null>
  function pick(o = {}) {
    if (!document.getElementById('aa-css')) { const st = document.createElement('style'); st.id = 'aa-css'; st.textContent = CSS; document.head.appendChild(st); }
    let style = DRAW[o.style] ? o.style : 'neon', land = false; const sel = new Set(o.selected || []), stops = [];
    const stepName = (STEPS.find(s => s[0] === o.step) || [])[1];
    const d = document.createElement('div'); d.className = 'aa-dlg';
    const order = [...LIB].sort((a, b) => (b.step === o.step) - (a.step === o.step)); // passende zuerst
    const fill = () => {
      stops.splice(0).forEach(f => f());
      const gr = d.querySelector('.gr'); gr.classList.toggle('land', land);
      gr.innerHTML = order.map(it => `<button class="it ${sel.has(it.id) ? 'on' : ''}" data-id="${it.id}"><div class="pv"></div><div class="nm">${esc(tr(it.name))}${it.step === o.step ? `<small>${esc(tr('passt zu diesem Schritt'))}</small>` : ''}</div></button>`).join('');
      gr.querySelectorAll('.it').forEach(b => stops.push(tile(b.querySelector('.pv'), b.dataset.id, style, tr(byId(b.dataset.id).text))));
    };
    d.innerHTML = `<div><div class="hd"><b>${esc(tr('Animationen für den Virtuellen Berater'))}${stepName ? ' · ' + esc(tr(stepName)) : ''}</b>
      <select data-st>${STYLES.map(s => `<option value="${s.id}" ${s.id === style ? 'selected' : ''}>${esc(tr(s.name))}</option>`).join('')}</select>
      <span class="seg"><button data-o="p" class="on">${esc(tr('Hochformat'))}</button><button data-o="l">${esc(tr('Querformat'))}</button></span></div>
      <div class="gr"></div>
      <div class="ft"><button data-x>${esc(tr('Schließen'))}</button><button class="p" data-ok>${esc(tr('Auswählen'))}</button></div></div>`;
    document.body.appendChild(d); fill();
    return new Promise(res => {
      const done = v => { stops.splice(0).forEach(f => f()); d.remove(); res(v); };
      d.onclick = e => {
        if (e.target === d || e.target.closest('[data-x]')) return done(null);
        if (e.target.closest('[data-ok]')) return done({ ids: order.filter(it => sel.has(it.id)).map(it => it.id), style });
        const ob = e.target.closest('[data-o]'); if (ob) { land = ob.dataset.o === 'l'; d.querySelectorAll('[data-o]').forEach(b => b.classList.toggle('on', b === ob)); fill(); return; }
        const it = e.target.closest('.it'); if (!it) return;
        if (!o.multi) sel.clear(); if (sel.has(it.dataset.id)) sel.delete(it.dataset.id); else sel.add(it.dataset.id);
        d.querySelectorAll('.it').forEach(b => b.classList.toggle('on', sel.has(b.dataset.id)));
      };
      d.querySelector('[data-st]').onchange = e => { style = e.target.value; fill(); };
    });
  }
  G.AdvisorAnim = { LIB, STYLES, STEPS, DEFAULT_STEPS, byId, play, frame, tile, pick };
})(window);
