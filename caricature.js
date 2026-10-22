// Live-Karikatur: Jedes Foto wird von der zentralen KI zur Karikatur und danach vor allen Gästen Strich für Strich
// gezeichnet und eingefärbt (sketch-draw.js). Einstellungen je Ereignis in settings.x.caricature (Dashboard und Fotobox).
// Dieselbe Datei läuft in der Fotobox, auf dem zweiten Bildschirm (mosaik.html) und im Dashboard (Vorschau).
(function (G) {
  'use strict';
  const PROMPT = 'Verwandle das Foto in eine handgezeichnete Karikatur: großer Kopf, kleiner Körper, freundlich und schmeichelhaft, ' +
    'alle Personen auf dem Foto, Gesichter gut wiedererkennbar, gleiche Kleidung und Frisur. Kräftige, saubere schwarze Konturlinien wie mit Tusche ' +
    'gezeichnet, flache helle Farben, ein großer goldener Kreis hinter den Personen, sonst reiner weißer Hintergrund. Kein Text, keine Schrift, kein Rahmen.';
  const TITLE = 'Strich für Strich – dein Porträt entsteht';
  const num = (v, a, b, d) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };
  // phone: Gäste schicken Selfies vom Handy (QR-Code auf der Wand) · needCode: zweistelliger Code vom Bildschirm nötig ·
  // approve: jede Einsendung erst im Dashboard freigeben · print: Karikaturen vom Handy ausdrucken · secret: für den Code
  function normalize(x) {
    const o = x && typeof x === 'object' ? x : {};
    return { on: o.on === true, prompt: typeof o.prompt === 'string' && o.prompt.trim() ? o.prompt.slice(0, 1200) : '', secs: num(o.secs, 8, 60, 20),
      title: typeof o.title === 'string' ? o.title.slice(0, 80) : '', phone: o.phone !== false, needCode: o.needCode !== false, approve: o.approve === true,
      print: o.print !== false, pos: ['br', 'bl', 'tr', 'tl'].includes(o.pos) ? o.pos : 'br', secret: typeof o.secret === 'string' && /^[0-9a-f]{16,64}$/.test(o.secret) ? o.secret : '' };
  }
  const newSecret = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
  // Zweistelliger Code für die Wand – wechselt alle 2 Minuten, gleiche Rechnung wie in der Funktion „cari“
  const SLOT = 120000;
  async function code(secret, slot = Math.floor(Date.now() / SLOT)) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const s = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('cari:' + slot)));
    return String((((s[0] << 24) | (s[1] << 16) | (s[2] << 8) | s[3]) >>> 0) % 90 + 10);
  }
  const HAND = '"Segoe Print", "Ink Free", "Comic Sans MS", "Snell Roundhand", "Chalkboard SE", cursive';
  // Fertiges Bild mit Gruß in einer Sprechblase (oben) und dem Namen als Unterschrift (unten). Beides wird später
  // Strich für Strich mitgezeichnet, weil es schwarz auf weiß steht.
  function compose(img, { name = '', message = '' } = {}) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.min(1, 1600 / Math.max(iw, ih));
    const W = Math.round(iw * k), H0 = Math.round(ih * k), top = message ? Math.round(W * .3) : 0, bottom = name ? Math.round(W * .14) : 0;
    const c = document.createElement('canvas'); c.width = W; c.height = H0 + top + bottom; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, c.height); x.drawImage(img, 0, top, W, H0);
    if (message) {
      const fs = Math.round(W * .046); x.font = `600 ${fs}px ${HAND}`;
      const lines = wrap(x, message, W * .62).slice(0, 4), tw = Math.max(...lines.map(l => x.measureText(l).width));
      const bw = Math.min(W * .78, tw + fs * 2.2), bh = lines.length * fs * 1.3 + fs * 1.4, bx = W - bw - W * .05, by = Math.max(W * .02, (top - bh) / 2);
      x.lineWidth = Math.max(3, W * .006); x.strokeStyle = '#1d1d1b'; x.fillStyle = '#fff';
      x.beginPath(); x.roundRect(bx, by, bw, bh, Math.min(bh / 2, fs * 1.4)); x.fill(); x.stroke();
      const tx = bx + bw * .3; x.beginPath(); x.moveTo(tx, by + bh - x.lineWidth); x.lineTo(tx - fs * .9, by + bh + fs * 1.3); x.lineTo(tx + fs * .9, by + bh - x.lineWidth); x.fill(); x.stroke();
      x.fillStyle = '#fff'; x.fillRect(tx - fs * .6, by + bh - x.lineWidth * 2.2, fs * 1.4, x.lineWidth * 1.6); // Übergang Blase → Spitze ohne Linie
      x.fillStyle = '#1d1d1b'; x.textAlign = 'center'; x.textBaseline = 'middle';
      lines.forEach((l, i) => x.fillText(l, bx + bw / 2, by + fs * .7 + fs * 1.3 * (i + .5)));
    }
    if (name) {
      const fs = Math.round(W * .07); x.font = `600 ${fs}px ${HAND}`; x.fillStyle = '#1d1d1b'; x.textAlign = 'right'; x.textBaseline = 'middle';
      x.save(); x.translate(W * .94, top + H0 + bottom / 2); x.rotate(-.04); x.fillText('\u2013 ' + name, 0, 0); x.restore();
    }
    return c;
  }
  const promptOf = c => (c && c.prompt) || PROMPT;
  // KI-Einstellungen für die Fotobox: immer die zentrale KI (1 Credit pro Bild) mit dem Prompt der Live-Karikatur
  const aiSettings = (ai, c) => ({ connection: 'central', resolution: ai && ai.resolution === '1k' ? '1k' : '2k', enabled: true, prompt: promptOf(c) });
  const tr = (s, lang) => (lang && lang !== 'de' && G.I18N ? G.I18N.t(s, lang) : s);

  function wrap(x, text, maxW) {
    const words = String(text).split(/\s+/), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  }
  function cover(x, img, X, Y, W, H) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, s = Math.max(W / iw, H / ih), sw = W / s, sh = H / s;
    x.drawImage(img, (iw - sw) / 2, Math.max(0, (ih - sh) * .3), sw, sh, X, Y, W, H);
  }
  // Bühne für eine Leinwand W × H: links bzw. oben die Überschrift, das weiße Blatt, das Foto des Gastes als Sofortbild.
  // Gibt die Zeichenfläche (box) und eine Funktion zurück, die den Hintergrund jedes Bild neu malt.
  function stage(W, H, { aspect = .78, photo = null, title = '', lang = '' } = {}) {
    const land = W >= H, u = Math.min(W, H) / 100;
    let cw, ch, cx, cy;
    if (land) { ch = H * .84; cw = Math.min(W * .48, ch * aspect); ch = cw / aspect; cx = W * .5; cy = (H - ch) / 2; }
    else { cw = W * .8; ch = Math.min(H * .6, cw / aspect); cw = ch * aspect; cx = (W - cw) / 2; cy = H * .2; }
    const pad = Math.min(cw, ch) * .035, box = { x: cx + pad, y: cy + pad, w: cw - 2 * pad, h: ch - 2 * pad };
    const pw = (land ? H * .22 : W * .26), ph = pw * 1.22, px = land ? cx - pw * .62 : cx - pw * .2, py = land ? H - ph - H * .06 : cy + ch - ph * .55;
    const head = tr(title || TITLE, lang), kick = tr('Live-Karikatur', lang).toUpperCase(), cap = tr('Dein Foto', lang);
    function background(x) {
      const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2b2924'); g.addColorStop(1, '#121211'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const r = x.createRadialGradient(cx + cw / 2, cy + ch / 2, 0, cx + cw / 2, cy + ch / 2, Math.max(cw, ch)); r.addColorStop(0, 'rgba(247,200,56,.16)'); r.addColorStop(1, 'rgba(247,200,56,0)');
      x.fillStyle = r; x.fillRect(0, 0, W, H);
      // Überschrift
      const fs = land ? H * .062 : W * .066, tx = land ? W * .07 : W * .5, maxW = land ? cx - W * .12 : W * .86;
      x.textAlign = land ? 'left' : 'center'; x.textBaseline = 'alphabetic';
      x.font = `700 ${fs * .36}px Fredoka, system-ui, sans-serif`; x.fillStyle = '#F7C838';
      x.font = `700 ${fs}px Fredoka, system-ui, sans-serif`; const lines = wrap(x, head, maxW);
      const blockH = fs * .6 + lines.length * fs * 1.12, ty = land ? H * .5 - blockH / 2 : H * .045;
      x.font = `700 ${fs * .36}px Fredoka, system-ui, sans-serif`; x.fillText(kick, tx, ty + fs * .36);
      x.fillStyle = '#fff'; x.font = `700 ${fs}px Fredoka, system-ui, sans-serif`;
      lines.forEach((l, i) => x.fillText(l, tx, ty + fs * .6 + (i + 1) * fs * 1.08));
      // Blatt
      x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = u * 4; x.shadowOffsetY = u * 1.2; x.fillStyle = '#fff'; x.fillRect(cx, cy, cw, ch); x.restore();
      x.fillStyle = '#fff'; x.fillRect(cx, cy, cw, ch);
    }
    // Sofortbild mit dem Foto des Gastes – liegt über der Zeichnung
    function front(x) {
      if (photo) {
        x.save(); x.translate(px + pw / 2, py + ph / 2); x.rotate(-.08); x.translate(-pw / 2, -ph / 2);
        x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = u * 2.5; x.shadowOffsetY = u * .8; x.fillStyle = '#fff'; x.fillRect(0, 0, pw, ph); x.shadowColor = 'transparent';
        const m = pw * .07; cover(x, photo, m, m, pw - 2 * m, ph - pw * .25 - m);
        x.fillStyle = '#333'; x.textAlign = 'center'; x.font = `600 ${pw * .085}px Fredoka, system-ui, sans-serif`; x.fillText(cap, pw / 2, ph - pw * .085);
        x.restore();
      }
    }
    return { box, background, front };
  }

  let layer = null, run = null;
  // Vollbild-Ebene: zeichnet die Karikatur live. result/photo: Bild oder Canvas. Gibt ein Promise zurück (true = fertig).
  async function show(result, photo, { secs = 10, title = '', lang = '', hold = 2500, z = 9100, closable = false } = {}) {
    hide(true);
    layer = document.createElement('div'); layer.id = 'cariLive';
    layer.style.cssText = `position:fixed;inset:0;z-index:${z};background:#121211;opacity:0;transition:opacity .4s`;
    const cv = document.createElement('canvas'), dpr = Math.min(2, G.devicePixelRatio || 1);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); cv.style.cssText = 'width:100%;height:100%;display:block';
    if (closable) { layer.style.cursor = 'pointer'; layer.title = 'Klicken zum Schließen'; layer.onclick = () => hide(); }
    layer.appendChild(cv); document.body.appendChild(layer); requestAnimationFrame(() => layer && (layer.style.opacity = '1'));
    const rw = result.naturalWidth || result.width, rh = result.naturalHeight || result.height;
    const st = stage(cv.width, cv.height, { aspect: rw / rh, photo, title, lang }), x = cv.getContext('2d');
    run = SketchDraw.play(cv, result, { box: st.box, lineSecs: secs * .72, colorSecs: secs * .28, background: st.background, foreground: st.front });
    const ok = await run; run = null;
    if (ok) await new Promise(r => setTimeout(r, hold));
    hide(); return ok;
  }
  function hide(now) {
    if (run) { run.stop(); run = null; }
    const l = layer; layer = null; if (!l) return;
    if (now) return l.remove();
    l.style.opacity = '0'; setTimeout(() => l.remove(), 450);
  }
  G.Caricature = { PROMPT, TITLE, SLOT, normalize, newSecret, code, compose, promptOf, aiSettings, stage, show, hide };
})(window);
