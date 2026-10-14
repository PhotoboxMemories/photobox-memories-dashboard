// Photobox Memories – Fotomosaik: viele kleine Gästefotos ergeben zusammen ein großes Bild.
// Wird von App UND Dashboard benutzt (gleiche Datei in beiden Ordnern). Einstellungen liegen im Ereignis unter settings.x.mosaic.
//   Bildschirm: Jedes Foto wird eine Kachel, darüber liegt das Hauptbild mit der eingestellten Deckkraft.
//   Klebewand:  Jede Kachel wird mit ihrer Feldnummer (z. B. „C7“) gedruckt; die Gäste kleben sie auf die vorher gedruckte Tafel.
(function (G) {
  'use strict';
  const DPI = 300, MM = 25.4, SHEET_CM = [15.24, 10.16]; // Fotopapier 6x4 Zoll = 10×15 cm
  // Feste Kachelgrößen in Zoll (passen genau aufs 6x4-Fotopapier); dazu „Eigene Größe“ in cm (tw × th)
  const FORMATS = {
    q2: { name: 'Quadrat 5 × 5 cm', w: 2, h: 2 },
    r32: { name: 'Quer 7,6 × 5 cm', w: 3, h: 2 },
    r23: { name: 'Hoch 5 × 7,6 cm', w: 2, h: 3 },
    q4: { name: 'Quadrat 10 × 10 cm', w: 4, h: 4 },
    l64: { name: 'Quer 15 × 10 cm (ganzes Foto)', w: 6, h: 4 },
    p46: { name: 'Hoch 10 × 15 cm (ganzes Foto)', w: 4, h: 6 }
  };
  const FORMAT_LIST = [...Object.entries(FORMATS).map(([k, f]) => [k, f.name]), ['custom', 'Eigene Größe (cm)']];
  const MODES = [['both', 'Bildschirm und Klebewand'], ['screen', 'Nur Bildschirm (Fernseher/Beamer)'], ['wall', 'Nur Klebewand (Druck)']];
  const WHO = [['all', 'Jedes Foto automatisch'], ['guest', 'Gast entscheidet (Mosaik-Symbol)']];
  const SHOTS = [['one', 'Ein Foto pro Sitzung'], ['all', 'Alle Fotos einer Sitzung']];
  const DEF = { on: false, mode: 'both', who: 'all', shots: 'one', image: '', overlay: 40, boardW: 100, boardH: 100, format: 'q2', tw: 5, th: 5, label: true, boardImage: false };
  const MAXN = 100; // höchstens 100 Spalten und 100 Reihen
  const choose = (list, v) => list.some(o => o[0] === v) ? v : list[0][0];
  const int = (v, a, b, d) => { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
  const num = (v, a, b, d) => { v = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(v) && v > 0 ? Math.min(b, Math.max(a, Math.round(v * 100) / 100)) : d; };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const n2 = v => +Number(v).toFixed(2);

  // Kachelmaß in Zoll – fest oder „Eigene Größe“ (cm). Akzeptiert den Schlüssel einer festen Größe oder die Einstellungen.
  function tileIn(c) {
    if (typeof c === 'string') return FORMATS[c] || FORMATS.q2;
    return c && c.format === 'custom' ? { w: c.tw / 2.54, h: c.th / 2.54 } : FORMATS[c && c.format] || FORMATS.q2;
  }
  // Breite des Nummern-Rands (oben Spaltennummern, links Reihenbuchstaben) und Mindestabstand zum Tafelrand, in mm
  const headMm = t => Math.round(Math.max(12, Math.min(26, Math.min(t.w, t.h) * MM * .4))), PAD = 8;
  // Rechner: Wie viele Felder passen auf die Tafel? (Tafel abzüglich Nummern-Rand und Abstand, geteilt durch die Kachelgröße)
  function fitGrid(boardW, boardH, t) {
    const free = 2 * PAD + headMm(t);
    return { cols: int(Math.floor((boardW * 10 - free) / (t.w * MM) + 1e-6), 2, MAXN, 2), rows: int(Math.floor((boardH * 10 - free) / (t.h * MM) + 1e-6), 2, MAXN, 2) };
  }

  function normalize(x) {
    const o = x && typeof x === 'object' ? x : {};
    const format = FORMATS[o.format] || o.format === 'custom' ? o.format : DEF.format;
    let tw = num(o.tw, 1, SHEET_CM[0], DEF.tw), th = num(o.th, 1, SHEET_CM[0], DEF.th);
    // eigene Kachel muss auf ein 10×15-Blatt passen (quer oder hoch)
    if (Math.min(tw, th) > SHEET_CM[1]) { if (tw >= th) th = SHEET_CM[1]; else tw = SHEET_CM[1]; }
    const c = {
      on: o.on === true, mode: choose(MODES, o.mode), who: choose(WHO, o.who), shots: choose(SHOTS, o.shots),
      // https = im Dashboard/an der Fotobox hochgeladen · local: = nur auf dieser Fotobox gespeichert (ohne Anmeldung)
      image: typeof o.image === 'string' && /^(https:\/\/|local:)/.test(o.image) ? o.image : '',
      overlay: int(o.overlay, 0, 90, DEF.overlay), boardW: num(o.boardW, 10, 1000, DEF.boardW), boardH: num(o.boardH, 10, 1000, DEF.boardH),
      format, tw, th, label: o.label !== false, boardImage: o.boardImage === true
    };
    return Object.assign(c, fitGrid(c.boardW, c.boardH, tileIn(c))); // Spalten und Reihen rechnet die Software aus
  }
  const screenOn = c => !!(c && c.on && c.mode !== 'wall');
  const wallOn = c => !!(c && c.on && c.mode !== 'screen');

  // Feldnummern wie beim Schiffe-Versenken: Reihe als Buchstabe (A … Z, AA …), Spalte als Zahl → „C7“
  function rowName(r) { let s = ''; for (r += 1; r > 0; r = Math.floor((r - 1) / 26)) s = String.fromCharCode(65 + (r - 1) % 26) + s; return s; }
  const cellName = (i, cols) => rowName(Math.floor(i / cols)) + (i % cols + 1);

  // Wie passen die Kacheln auf ein 6x4-Blatt? Quer oder hoch – je nachdem, wo mehr Kacheln Platz haben.
  function sheetPlan(c) {
    const f = tileIn(c), fit = (W, H) => ({ W, H, nx: Math.floor(W / f.w + 1e-3), ny: Math.floor(H / f.h + 1e-3) });
    const a = fit(6, 4), b = fit(4, 6), p = b.nx * b.ny > a.nx * a.ny ? b : a, per = Math.max(1, p.nx * p.ny);
    p.nx = Math.max(1, p.nx); p.ny = Math.max(1, p.ny);
    const restW = Math.max(0, p.W - p.nx * f.w), restH = Math.max(0, p.H - p.ny * f.h);
    // Der Fotodrucker kann ein 6x4-Blatt nach 2 Zoll durchschneiden – passt, wenn die Kacheln genau an dieser Linie enden
    const along = p.W > p.H ? f.h : f.w, cut = per > 1 && Math.abs(along - 2) < .02 && (p.W > p.H ? restH : restW) < .02 ? '2inch' : 'off';
    const panel = per === 1 && (restW >= 1.2 || restH >= 1.2)
      ? (restW >= restH ? { x: p.nx * f.w, y: 0, w: restW, h: p.H } : { x: 0, y: p.ny * f.h, w: p.W, h: restH }) : null;
    return { W: p.W, H: p.H, nx: p.nx, ny: p.ny, per, tw: f.w, th: f.h, cut, panel, marks: !panel && (restW > .02 || restH > .02),
      ox: panel ? 0 : restW / 2, oy: panel ? 0 : restH / 2 };
  }

  // Maße der Tafel in mm: so groß wie eingegeben, das Raster mittig darauf; oben die Spaltennummern, links die Reihenbuchstaben
  function board(c) {
    const t = tileIn(c), cw = t.w * MM, ch = t.h * MM, head = headMm(t), gw = c.cols * cw, gh = c.rows * ch;
    const W = Math.max(c.boardW * 10, gw + head + 2 * PAD), H = Math.max(c.boardH * 10, gh + head + 2 * PAD);
    const left = (W - gw - head) / 2, top = (H - gh - head) / 2;
    return { cw, ch, head, pad: PAD, left, top, x0: left + head, y0: top + head, gw, gh, W, H };
  }
  function info(c) {
    const b = board(c), t = tileIn(c), pl = sheetPlan(c), cells = c.cols * c.rows;
    return { cells, cols: c.cols, rows: c.rows, per: pl.per, sheets: Math.ceil(cells / pl.per), tileCm: [t.w * 2.54, t.h * 2.54],
      gridCm: [b.gw / 10, b.gh / 10], boardCm: [b.W / 10, b.H / 10], freeCm: [(b.W - b.gw - b.head) / 10, (b.H - b.gh - b.head) / 10],
      grown: b.W > c.boardW * 10 + .5 || b.H > c.boardH * 10 + .5 };
  }
  const cm = v => (Math.round(v * 10) / 10).toLocaleString('de-DE');
  // Ergebnis des Rechners in Worten (für Fotobox-Menü und Dashboard)
  function summaryHTML(c) {
    const i = info(c), pl = sheetPlan(c);
    return `<div class="big">${i.cols} × ${i.rows} Felder = ${i.cells} Fotos</div>`
      + `<div>Kachel ${cm(i.tileCm[0])} × ${cm(i.tileCm[1])} cm · Raster ${cm(i.gridCm[0])} × ${cm(i.gridCm[1])} cm auf der Tafel ${cm(i.boardCm[0])} × ${cm(i.boardCm[1])} cm (inkl. Nummern-Rand)</div>`
      + `<div>${i.per} Kachel${i.per > 1 ? 'n' : ''} pro 10×15-Fotoblatt → höchstens ${i.sheets} Blätter${pl.cut === '2inch' ? ' · der Drucker schneidet die Streifen automatisch' : pl.marks ? ' · mit Schnittmarken zum Zuschneiden' : ''}</div>`
      + (i.grown ? `<div>⚠️ Für diese Kachelgröße ist die Tafel zu klein – sie wird mindestens ${cm(i.boardCm[0])} × ${cm(i.boardCm[1])} cm groß.</div>` : '');
  }

  // Tafel als SVG-Inhalt (Einheit mm). img = Hauptbild (Adresse oder data-URL), wird nur mit „boardImage“ schwach gezeigt.
  function boardMarkup(c, img) {
    const b = board(c), o = [], fs = n2(Math.min(b.cw, b.ch) * .22), hs = n2(b.head * .5), L = n2(b.left), T0 = n2(b.top);
    o.push(`<rect width="${n2(b.W)}" height="${n2(b.H)}" fill="#fff"/>`);
    if (img && c.boardImage) o.push(`<image href="${esc(img)}" x="${n2(b.x0)}" y="${n2(b.y0)}" width="${n2(b.gw)}" height="${n2(b.gh)}" preserveAspectRatio="xMidYMid slice" opacity=".25"/>`);
    o.push(`<rect x="${n2(b.x0)}" y="${T0}" width="${n2(b.gw)}" height="${b.head}" fill="#F7C838"/><rect x="${L}" y="${n2(b.y0)}" width="${b.head}" height="${n2(b.gh)}" fill="#F7C838"/>`);
    o.push(`<rect x="${L}" y="${T0}" width="${b.head}" height="${b.head}" fill="#1D1D1B"/>`);
    const lines = [];
    for (let q = 0; q <= c.cols; q++) { const x = n2(b.x0 + q * b.cw); lines.push(`M${x} ${T0}V${n2(b.y0 + b.gh)}`); }
    for (let r = 0; r <= c.rows; r++) { const y = n2(b.y0 + r * b.ch); lines.push(`M${L} ${y}H${n2(b.x0 + b.gw)}`); }
    o.push(`<path d="${lines.join('')}" stroke="#9a9a9a" stroke-width=".35" fill="none"/>`);
    o.push(`<rect x="${n2(b.x0)}" y="${n2(b.y0)}" width="${n2(b.gw)}" height="${n2(b.gh)}" fill="none" stroke="#1D1D1B" stroke-width=".8"/>`);
    const T = (x, y, s, fill, w, t) => `<text x="${n2(x)}" y="${n2(y)}" font-size="${s}" fill="${fill}" font-weight="${w}" text-anchor="middle" dominant-baseline="central" font-family="Arial,Helvetica,sans-serif">${t}</text>`;
    for (let q = 0; q < c.cols; q++) o.push(T(b.x0 + (q + .5) * b.cw, b.top + b.head / 2, hs, '#1D1D1B', 700, q + 1));
    for (let r = 0; r < c.rows; r++) o.push(T(b.left + b.head / 2, b.y0 + (r + .5) * b.ch, hs, '#1D1D1B', 700, rowName(r)));
    for (let i = 0; i < c.cols * c.rows; i++) {
      const q = i % c.cols, r = Math.floor(i / c.cols);
      o.push(T(b.x0 + (q + .5) * b.cw, b.y0 + (r + .5) * b.ch, fs, '#8c8c8c', 400, cellName(i, c.cols)));
    }
    return o.join('');
  }
  function boardSVG(c, img) { const b = board(c); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n2(b.W)} ${n2(b.H)}">${boardMarkup(c, img)}</svg>`; }

  // Druckfertige Seite(n) der Tafel: kind 'full' = eine Seite in Originalgröße (für die Druckerei), 'a4' = auf A4-Blätter verteilt
  function printHTML(c, img, kind, title = 'Fotomosaik') {
    const b = board(c), t = esc(title);
    const defs = `<svg width="0" height="0" style="position:absolute"><defs><g id="mzb">${boardMarkup(c, img)}</g></defs></svg>`;
    const css = 'html,body{margin:0;padding:0;background:#fff}.pg{position:relative;overflow:hidden;break-after:page;page-break-after:always}.pg:last-child{break-after:auto;page-break-after:auto}svg{display:block}'
      + '.cap{position:absolute;left:10mm;right:10mm;bottom:3mm;font:2.8mm Arial,Helvetica,sans-serif;color:#555;text-align:center}';
    const doc = (page, body) => `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>${t}</title><style>@page{size:${page};margin:0}${css}</style></head><body>${defs}${body}</body></html>`;
    if (kind !== 'a4') return doc(`${n2(b.W)}mm ${n2(b.H)}mm`, `<div class="pg" style="width:${n2(b.W)}mm;height:${n2(b.H)}mm"><svg width="${n2(b.W)}mm" height="${n2(b.H)}mm" viewBox="0 0 ${n2(b.W)} ${n2(b.H)}"><use href="#mzb"/></svg></div>`);
    const M = 10, plans = [[210, 297], [297, 210]].map(([pw, ph]) => { const cw = pw - 2 * M, ch = ph - 2 * M; return { pw, ph, cw, ch, nx: Math.ceil(b.W / cw - 1e-6), ny: Math.ceil(b.H / ch - 1e-6) }; });
    const o = plans[0].nx * plans[0].ny <= plans[1].nx * plans[1].ny ? plans[0] : plans[1], N = o.nx * o.ny;
    let pages = '';
    for (let y = 0; y < o.ny; y++) for (let x = 0; x < o.nx; x++) {
      const k = y * o.nx + x + 1, w = n2(Math.min(o.cw, b.W - x * o.cw)), h = n2(Math.min(o.ch, b.H - y * o.ch)), pos = `position:absolute;left:${M}mm;top:${M}mm`;
      pages += `<div class="pg" style="width:${o.pw}mm;height:${o.ph}mm"><svg style="${pos}" width="${w}mm" height="${h}mm" viewBox="${n2(x * o.cw)} ${n2(y * o.ch)} ${w} ${h}"><use href="#mzb"/></svg>`
        + `<svg style="${pos};overflow:visible" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="none" stroke="#777" stroke-width=".25" stroke-dasharray="2 1.5"/></svg>`
        + `<div class="cap">${t} · Blatt ${k} von ${N} (${y + 1}. Reihe von oben, ${x + 1}. von links) · am gestrichelten Rand zuschneiden und lückenlos aneinanderkleben</div></div>`;
    }
    return doc(`${o.pw}mm ${o.ph}mm`, pages);
  }

  // ---------- Zeichnen (nur im Browser/in der App) ----------
  const mk = (w, h) => { const c = G.document ? G.document.createElement('canvas') : new G.OffscreenCanvas(w, h); c.width = w; c.height = h; return c; };
  const dims = s => [s.naturalWidth || s.videoWidth || s.width, s.naturalHeight || s.videoHeight || s.height];
  // Hauptbild für das Raster vorbereiten: passender Ausschnitt (wie „füllen“) und die Durchschnittsfarbe jedes Feldes
  function prepare(img, c) {
    const f = tileIn(c), A = c.cols * f.w / (c.rows * f.h), [iw, ih] = dims(img);
    let sw = iw, sh = iw / A; if (sh > ih) { sh = ih; sw = ih * A; }
    const K = 4, cv = mk(c.cols * K, c.rows * K), x = cv.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, cv.width, cv.height);
    const d = x.getImageData(0, 0, cv.width, cv.height).data, colors = new Float32Array(c.cols * c.rows * 3);
    for (let r = 0; r < c.rows; r++) for (let q = 0; q < c.cols; q++) {
      let R = 0, Gn = 0, B = 0;
      for (let yy = 0; yy < K; yy++) for (let xx = 0; xx < K; xx++) { const i = ((r * K + yy) * cv.width + q * K + xx) * 4; R += d[i]; Gn += d[i + 1]; B += d[i + 2]; }
      const j = (r * c.cols + q) * 3; colors[j] = R / K / K; colors[j + 1] = Gn / K / K; colors[j + 2] = B / K / K;
    }
    return { img, sx: (iw - sw) / 2, sy: (ih - sh) / 2, sw, sh, cols: c.cols, rows: c.rows, n: c.cols * c.rows, colors };
  }
  const cellSrc = (p, i) => { const w = p.sw / p.cols, h = p.sh / p.rows; return [p.sx + (i % p.cols) * w, p.sy + Math.floor(i / p.cols) * h, w, h]; };
  // Foto auf Kachelform zuschneiden (Gesichter sitzen meist etwas über der Mitte)
  function drawCover(ctx, src, x, y, w, h) {
    const [sw0, sh0] = dims(src), k = Math.max(w / sw0, h / sh0), cw = w / k, ch = h / k;
    ctx.drawImage(src, (sw0 - cw) / 2, Math.max(0, Math.min(sh0 - ch, sh0 * .42 - ch / 2)), cw, ch, x, y, w, h);
  }
  function tileCanvas(src, c, longSide = 240, filterCss = '') { // c = Einstellungen oder Schlüssel einer festen Größe
    const f = tileIn(c), k = longSide / Math.max(f.w, f.h), cv = mk(Math.round(f.w * k), Math.round(f.h * k)), x = cv.getContext('2d');
    if (filterCss && filterCss !== 'none') x.filter = filterCss;
    drawCover(x, src, 0, 0, cv.width, cv.height);
    return cv;
  }
  function avgColor(src) {
    const c = mk(6, 6), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, 6, 6);
    const d = x.getImageData(0, 0, 6, 6).data; let R = 0, Gn = 0, B = 0;
    for (let i = 0; i < d.length; i += 4) { R += d[i]; Gn += d[i + 1]; B += d[i + 2]; }
    return [R / 36, Gn / 36, B / 36];
  }
  // Freies Feld wählen, dessen Farbe im Hauptbild am besten zum Foto passt – unter den 6 besten zufällig, damit es sich schön verteilt
  function pickCell(colors, n, taken, rgb, rnd = Math.random) {
    const best = [];
    for (let i = 0; i < n; i++) {
      if (taken.has(i)) continue;
      const j = i * 3, dr = colors[j] - rgb[0], dg = colors[j + 1] - rgb[1], db = colors[j + 2] - rgb[2], d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (best.length < 6 || d < best[best.length - 1][0]) { best.push([d, i]); best.sort((a, b) => a[0] - b[0]); if (best.length > 6) best.pop(); }
    }
    return best.length ? best[Math.floor(rnd() * best.length)][1] : -1;
  }
  // Ein Feld: Gästefoto, darüber das Hauptbild mit der eingestellten Deckkraft. Leere Felder zeigen das Hauptbild schwach.
  function drawCell(ctx, p, i, tile, x, y, w, h, alpha, empty = .3) {
    const s = cellSrc(p, i);
    if (tile) { ctx.drawImage(tile, x, y, w, h); if (alpha <= 0) return; ctx.save(); ctx.globalAlpha = alpha; }
    else { if (!(empty > 0)) return; ctx.save(); ctx.globalAlpha = empty; }
    ctx.drawImage(p.img, s[0], s[1], s[2], s[3], x, y, w, h); ctx.restore();
  }
  const cellBox = (p, i, W, H) => { const q = i % p.cols, r = Math.floor(i / p.cols), x0 = Math.round(q * W / p.cols), y0 = Math.round(r * H / p.rows);
    return [x0, y0, Math.round((q + 1) * W / p.cols) - x0, Math.round((r + 1) * H / p.rows) - y0]; };
  function renderMosaic(ctx, p, tiles, W, H, opt = {}) {
    const alpha = (opt.overlay ?? DEF.overlay) / 100;
    ctx.fillStyle = opt.bg || '#000'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < p.n; i++) { const [x, y, w, h] = cellBox(p, i, W, H); drawCell(ctx, p, i, tiles.get(i), x, y, w, h, alpha, opt.empty ?? .3); }
    if (opt.grid) {
      ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let q = 1; q < p.cols; q++) { const x = Math.round(q * W / p.cols) + .5; ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let r = 1; r < p.rows; r++) { const y = Math.round(r * H / p.rows) + .5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke(); ctx.restore();
    }
  }
  function roundRect(x, l, t, w, h, r) { x.beginPath(); x.moveTo(l + r, t); x.arcTo(l + w, t, l + w, t + h, r); x.arcTo(l + w, t + h, l, t + h, r); x.arcTo(l, t + h, l, t, r); x.arcTo(l, t, l + w, t, r); x.closePath(); }
  function drawCode(x, code, tx, ty, tw, th) {
    const fs = Math.round(Math.max(30, Math.min(70, Math.min(tw, th) * .07)));
    x.save(); x.font = `700 ${fs}px Arial, Helvetica, sans-serif`;
    const w = x.measureText(code).width + fs * .9, h = fs * 1.35, m = fs * .35, bx = tx + tw - w - m, by = ty + th - h - m;
    x.globalAlpha = .9; x.fillStyle = '#fff'; roundRect(x, bx, by, w, h, h / 2); x.fill(); x.globalAlpha = 1;
    x.fillStyle = '#1D1D1B'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(code, bx + w / 2, by + h / 2 + fs * .05); x.restore();
  }
  // Freie Fläche neben einer großen Kachel: Feldnummer groß und eine kleine Karte, wo das Feld auf der Tafel liegt
  function drawPanel(x, pn, i, c, title) {
    const L = pn.x * DPI, T = pn.y * DPI, W = pn.w * DPI, H = pn.h * DPI, pad = W * .08, code = cellName(i, c.cols);
    x.save(); x.fillStyle = '#F7C838'; x.fillRect(L, T, W, H); x.fillStyle = '#1D1D1B'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `600 ${Math.round(W * .085)}px Arial, Helvetica, sans-serif`; x.fillText('Klebe mich auf Feld', L + W / 2, T + H * .1);
    let fs = Math.round(W * .42); x.font = `800 ${fs}px Arial, Helvetica, sans-serif`;
    while (x.measureText(code).width > W - 2 * pad && fs > 40) { fs -= 8; x.font = `800 ${fs}px Arial, Helvetica, sans-serif`; }
    x.fillText(code, L + W / 2, T + H * .27);
    const f = tileIn(c), ar = c.cols * f.w / (c.rows * f.h), mw = Math.min(W - 2 * pad, (H * .5) * ar), mh = mw / ar, mx = L + (W - mw) / 2, my = T + H * .42;
    x.fillStyle = '#fff'; x.fillRect(mx, my, mw, mh); x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1; x.beginPath();
    for (let q = 1; q < c.cols; q++) { const xx = mx + q * mw / c.cols; x.moveTo(xx, my); x.lineTo(xx, my + mh); }
    for (let r = 1; r < c.rows; r++) { const yy = my + r * mh / c.rows; x.moveTo(mx, yy); x.lineTo(mx + mw, yy); }
    x.stroke(); x.fillStyle = '#e5484d';
    x.fillRect(mx + (i % c.cols) * mw / c.cols, my + Math.floor(i / c.cols) * mh / c.rows, Math.max(4, mw / c.cols), Math.max(4, mh / c.rows));
    x.strokeStyle = '#1D1D1B'; x.lineWidth = 3; x.strokeRect(mx, my, mw, mh);
    if (title) { x.fillStyle = '#1D1D1B'; x.font = `600 ${Math.round(W * .065)}px Arial, Helvetica, sans-serif`; x.fillText(String(title).slice(0, 34), L + W / 2, T + H - pad * 1.2); }
    x.restore();
  }
  // Druckbogen (6x4 Zoll, 300 dpi) mit einer oder mehreren Kacheln samt Feldnummer.
  // items = [{ i: Feld, photo: Bild/Canvas }]; p = prepare(…) des Hauptbilds (ohne Hauptbild: nur das Foto)
  function renderSheet(items, p, c, title) {
    const pl = sheetPlan(c), cv = mk(Math.round(pl.W * DPI), Math.round(pl.H * DPI)), x = cv.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
    const tw = pl.tw * DPI, th = pl.th * DPI, alpha = c.overlay / 100;
    items.slice(0, pl.per).forEach((it, k) => {
      const tx = Math.round((pl.ox + (k % pl.nx) * pl.tw) * DPI), ty = Math.round((pl.oy + Math.floor(k / pl.nx) * pl.th) * DPI);
      x.save(); x.beginPath(); x.rect(tx, ty, tw, th); x.clip();
      drawCover(x, it.photo, tx, ty, tw, th);
      if (p && alpha > 0) { const s = cellSrc(p, it.i); x.globalAlpha = alpha; x.drawImage(p.img, s[0], s[1], s[2], s[3], tx, ty, tw, th); }
      x.restore();
      if (c.label) drawCode(x, cellName(it.i, c.cols), tx, ty, tw, th);
    });
    if (pl.panel && items[0]) drawPanel(x, pl.panel, items[0].i, c, title);
    if (pl.marks) { // eigene Kachelgröße mit Rand: kurze Schnittmarken an jeder Kachelkante
      x.save(); x.strokeStyle = '#999'; x.lineWidth = 2; x.beginPath();
      const L = pl.ox * DPI, T = pl.oy * DPI, R = L + pl.nx * tw, B = T + pl.ny * th;
      for (let q = 0; q <= pl.nx; q++) { const xx = Math.round(L + q * tw) + .5; if (T > 4) { x.moveTo(xx, 0); x.lineTo(xx, T - 3); } if (cv.height - B > 4) { x.moveTo(xx, B + 3); x.lineTo(xx, cv.height); } }
      for (let r = 0; r <= pl.ny; r++) { const yy = Math.round(T + r * th) + .5; if (L > 4) { x.moveTo(0, yy); x.lineTo(L - 3, yy); } if (cv.width - R > 4) { x.moveTo(R + 3, yy); x.lineTo(cv.width, yy); } }
      x.stroke(); x.restore();
    }
    return { canvas: cv, cut: pl.cut, per: pl.per };
  }

  const M = { DPI, FORMATS, FORMAT_LIST, MODES, WHO, SHOTS, DEF, MAXN, normalize, tileIn, fitGrid, screenOn, wallOn, rowName, cellName, sheetPlan, board, info, cm, summaryHTML,
    boardMarkup, boardSVG, printHTML, prepare, cellSrc, cellBox, drawCover, tileCanvas, avgColor, pickCell, drawCell, renderMosaic, renderSheet };
  G.Mosaic = M;
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
