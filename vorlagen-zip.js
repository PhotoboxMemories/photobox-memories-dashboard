// Vorlagen als ZIP (Betreiber 15.11.2026): eigene Fotolayouts mit allen Bildern sichern und weitergeben, und Vorlagen-Pakete aus anderen
// Fotobox-Programmen übernehmen (z. B. PNG-Rahmen mit durchsichtigen Fotofeldern, Namen wie „2x6 01.png“, „Single Strip/…-single.png“,
// dazu manchmal Hintergrundbilder und Einstellungsdateien). Gleiche Datei in Fotobox (app-desktop/app) und Dashboard, wird von designs.js und
// editor.js erst bei Bedarf geladen. Keine Fremdbibliothek, kein CDN: ZIP schreiben ohne Kompression (PNG/JPG sind schon gepackt),
// ZIP lesen mit dem eingebauten DecompressionStream('deflate-raw').
//   VorlagenZip.exportZip(layouts, { name, onStep, download = true }) → { blob, missing }
//   VorlagenZip.read(file, { onStep }) → { kind, summary, items: [{ layout, preview, info, skip }], finish(indexes, { upload, onStep }) → layouts, dispose() }
window.VorlagenZip = (() => {
  const FBR = () => window.FBR;
  const enc = new TextEncoder();
  const TYP = 'photobox-memories-vorlagen';
  const IMG_KEYS = new Set(['src', 'bgImage']); // hier stehen in Layouts die Bild-Adressen (render.js preloadLayout)

  // ---------- ZIP schreiben ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function dosTime(d = new Date()) {
    return { time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date: ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() };
  }
  // files: [{ name, data: Uint8Array | string }] → Blob (application/zip)
  function writeZip(files) {
    const parts = [], central = [], { time, date } = dosTime(); let off = 0;
    for (const f of files) {
      const name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(h.buffer, name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(c.buffer, name);
      off += 30 + name.length + data.length;
    }
    const cdSize = central.reduce((a, b) => a + b.byteLength, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, e.buffer], { type: 'application/zip' });
  }

  // ---------- ZIP lesen ----------
  // Alte Windows-/Mac-ZIPs ohne UTF-8-Kennung: Namen in DOS-Zeichensatz (Umlaute ä=0x84 …)
  const CP437 = 'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
  function decodeName(u, utf8) {
    if (utf8) return new TextDecoder().decode(u);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(u); } catch { return Array.from(u, b => b < 128 ? String.fromCharCode(b) : CP437[b - 128]).join(''); }
  }
  async function inflate(u) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Dieser Browser kann ZIP-Dateien nicht entpacken. Bitte einen aktuellen Browser verwenden.');
    return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  }
  // → [{ name, size, get() → Promise<Uint8Array> }]
  async function readZip(blob) {
    if (blob.size > 600 * 1024 * 1024) throw new Error('Die ZIP-Datei ist zu groß (höchstens 600 MB).');
    const buf = new Uint8Array(await blob.arrayBuffer()), dv = new DataView(buf.buffer);
    let e = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('Das ist keine gültige ZIP-Datei.');
    let count = dv.getUint16(e + 10, true), cd = dv.getUint32(e + 16, true);
    if ((count === 0xFFFF || cd === 0xFFFFFFFF) && e >= 20 && dv.getUint32(e - 20, true) === 0x07064b50) { // ZIP64
      const z = Number(dv.getBigUint64(e - 12, true));
      if (dv.getUint32(z, true) === 0x06064b50) { count = Number(dv.getBigUint64(z + 32, true)); cd = Number(dv.getBigUint64(z + 48, true)); }
    }
    const out = [];
    for (let i = 0, p = cd; i < count; i++) {
      if (p + 46 > buf.length || dv.getUint32(p, true) !== 0x02014b50) throw new Error('Die ZIP-Datei ist beschädigt.');
      const flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true);
      let csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true), lho = dv.getUint32(p + 42, true);
      const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
      const name = decodeName(buf.subarray(p + 46, p + 46 + nl), flags & 0x0800).replace(/\\/g, '/'); // ältere Windows-ZIPs trennen Ordner mit „\“
      for (let x = p + 46 + nl, xe = x + xl; x + 4 <= xe;) { // ZIP64-Zusatzfeld: große Werte stehen dort
        const id = dv.getUint16(x, true), sz = dv.getUint16(x + 2, true);
        if (id === 1) { let q = x + 4; if (usize === 0xFFFFFFFF) { usize = Number(dv.getBigUint64(q, true)); q += 8; } if (csize === 0xFFFFFFFF) { csize = Number(dv.getBigUint64(q, true)); q += 8; } if (lho === 0xFFFFFFFF) lho = Number(dv.getBigUint64(q, true)); }
        x += 4 + sz;
      }
      p += 46 + nl + xl + cl;
      if (name.endsWith('/')) continue;
      out.push({ name, size: usize, enc: !!(flags & 1), get: async () => {
        if (flags & 1) throw new Error(`„${name}“ ist mit Passwort geschützt.`);
        if (dv.getUint32(lho, true) !== 0x04034b50) throw new Error('Die ZIP-Datei ist beschädigt.');
        const start = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true), raw = buf.subarray(start, start + csize);
        if (method === 0) return raw;
        if (method === 8) return inflate(raw);
        throw new Error(`„${name}“ ist mit einem unbekannten Verfahren gepackt.`);
      } });
    }
    return out;
  }

  // ---------- Hilfen ----------
  const base = p => p.split('/').pop();
  const stem = p => base(p).replace(/\.[^.]+$/, '');
  const dir = p => p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
  const junk = p => p.split('/').some(s => s === '__MACOSX' || s.startsWith('.')) || /^(thumbs\.db|desktop\.ini)$/i.test(base(p));
  const safe = s => String(s || 'Vorlage').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Vorlage';
  const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
  const EXT = Object.fromEntries(Object.entries(MIME).map(([k, v]) => [v, k === 'jpeg' ? 'jpg' : k]));
  const extOf = p => (base(p).match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase() || '';
  const walk = (o, fn) => { if (Array.isArray(o)) o.forEach(x => walk(x, fn)); else if (o && typeof o === 'object') for (const k of Object.keys(o)) { if (IMG_KEYS.has(k) && typeof o[k] === 'string' && o[k]) fn(o, k); else walk(o[k], fn); } };
  const canvasBlob = (c, type = 'image/png', q) => new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('Bild konnte nicht erstellt werden.')), type, q));
  const loadLocal = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

  // Vorschaubild (klein, JPEG) mit Platzhalter-Fotos – wie der Testdruck
  async function preview(L, max = 360) {
    try {
      await FBR().preloadLayout(L);
      const c = FBR().renderSheet(L, { placeholders: true, values: {} }), k = Math.min(1, max / Math.max(c.width, c.height));
      const t = document.createElement('canvas'); t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
      const x = t.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, t.width, t.height); x.drawImage(c, 0, 0, t.width, t.height);
      return t;
    } catch { return null; }
  }

  // Bild einer Vorlage als Datei holen: Daten-Adresse, Internet-Adresse, sonst die (evtl. offline gespeicherte) Fassung aus render.js nachzeichnen
  async function fetchImage(src) {
    try { const r = await fetch(src, { mode: 'cors', cache: 'force-cache' }); if (r.ok) { const b = await r.blob(); if (/^image\//.test(b.type) || src.startsWith('data:image/')) return b; } } catch { /* weiter unten */ }
    const img = await FBR().loadImg(src); if (!img) return null;
    try { const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0); return await canvasBlob(c); } catch { return null; }
  }

  // ---------- Export ----------
  async function exportZip(layouts, { name = 'Fotolayouts', onStep, download = true } = {}) {
    const Ls = layouts.filter(L => L && Array.isArray(L.elements) && !L.screen).map(L => JSON.parse(JSON.stringify(L)));
    if (!Ls.length) throw new Error('Keine Vorlage zum Exportieren.');
    const files = [], paths = new Map(); let missing = 0, n = 0;
    const srcs = []; Ls.forEach(L => walk(L, (o, k) => srcs.push(o[k])));
    const uniq = [...new Set(srcs)];
    for (const [i, src] of uniq.entries()) {
      onStep?.(`Bild ${i + 1} von ${uniq.length} wird eingepackt …`);
      const b = await fetchImage(src);
      if (!b) { missing++; continue; } // Adresse bleibt stehen, dann lädt der Import das Bild aus dem Internet
      const p = `bilder/${String(++n).padStart(3, '0')}.${EXT[b.type] || 'png'}`;
      paths.set(src, p); files.push({ name: p, data: new Uint8Array(await b.arrayBuffer()) });
    }
    Ls.forEach(L => walk(L, (o, k) => { if (paths.has(o[k])) o[k] = paths.get(o[k]); }));
    for (const [i, L] of Ls.entries()) { // Vorschaubilder nur für Menschen, der Import braucht sie nicht
      onStep?.(`Vorschau ${i + 1} von ${Ls.length} …`);
      const back = JSON.parse(JSON.stringify(L)), loc = new Map();
      walk(back, (o, k) => { const f = files.find(x => x.name === o[k]); if (f) { if (!loc.has(o[k])) loc.set(o[k], URL.createObjectURL(new Blob([f.data], { type: MIME[extOf(f.name)] }))); o[k] = loc.get(o[k]); } });
      const c = await preview(back, 900); loc.forEach(u => URL.revokeObjectURL(u));
      if (c) files.push({ name: `vorschau/${String(i + 1).padStart(2, '0')} ${safe(L.name)}.jpg`, data: new Uint8Array(await (await canvasBlob(c, 'image/jpeg', .85)).arrayBuffer()) });
    }
    const doc = { typ: TYP, version: 1, programm: 'Photobox Memories', erstellt: new Date().toISOString(), vorlagen: Ls };
    files.unshift({ name: 'vorlagen.json', data: JSON.stringify(doc, null, 1) },
      { name: 'LIESMICH.txt', data: 'Photobox Memories – Fotolayouts\r\n\r\nDiese ZIP-Datei enthält ' + (Ls.length === 1 ? '1 Fotolayout' : Ls.length + ' Fotolayouts') + ' mit allen Bildern.\r\n'
        + 'Importieren: Fotobox oder Dashboard → Fotolayout → Importieren (oder Design installieren → ZIP importieren) und diese Datei wählen.\r\n'
        + 'Im Ordner „vorschau“ liegt zu jedem Layout ein Vorschaubild.\r\n' });
    const blob = writeZip(files);
    if (download) {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = safe(name) + '.zip';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    }
    return { blob, missing, count: Ls.length };
  }

  // ---------- Fotofelder in einem Rahmen-Bild erkennen (wie LayoutEditor.layoutFromImage) ----------
  // → { boxes: [[x, y, w, h] in 0…1], twin, opaque }
  function holes(img) {
    const S = 360 / Math.max(img.naturalWidth, img.naturalHeight), gw = Math.max(1, Math.round(img.naturalWidth * S)), gh = Math.max(1, Math.round(img.naturalHeight * S));
    const c = document.createElement('canvas'); c.width = gw; c.height = gh;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, gw, gh);
    const d = x.getImageData(0, 0, gw, gh).data, seen = new Uint8Array(gw * gh); let boxes = [], clear = 0;
    for (let i = 0; i < gw * gh; i++) if (d[i * 4 + 3] <= 40) clear++;
    for (let i = 0; i < gw * gh; i++) {
      if (seen[i] || d[i * 4 + 3] > 40) continue;
      let x0 = gw, y0 = gh, x1 = 0, y1 = 0, n = 0; const st = [i]; seen[i] = 1;
      while (st.length) {
        const p = st.pop(), px = p % gw, py = (p - px) / gw; n++;
        x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py);
        for (const q of [p - 1, p + 1, p - gw, p + gw]) if (q >= 0 && q < gw * gh && !seen[q] && Math.abs((q % gw) - px) <= 1 && d[q * 4 + 3] <= 40) { seen[q] = 1; st.push(q); }
      }
      if (n > gw * gh * .015) boxes.push([x0, y0, x1 - x0 + 1, y1 - y0 + 1]);
    }
    boxes = boxes.filter(b => b[2] > gw * .08 && b[3] > gh * .08);
    if (boxes.length > 1) boxes = boxes.filter(b => !(b[2] > gw * .95 && b[3] > gh * .95));
    const inside = (a, b) => a !== b && a[0] >= b[0] && a[1] >= b[1] && a[0] + a[2] <= b[0] + b[2] && a[1] + a[3] <= b[1] + b[3];
    boxes = boxes.filter(a => !boxes.some(b => inside(a, b)));
    const band = gh * .06; boxes.sort((a, b) => Math.abs(a[1] - b[1]) > band ? a[1] - b[1] : a[0] - b[0]);
    for (const b of boxes) { const nx = Math.max(0, b[0] - 1), ny = Math.max(0, b[1] - 1); b[2] = Math.min(gw, b[0] + b[2] + 1) - nx; b[3] = Math.min(gh, b[1] + b[3] + 1) - ny; b[0] = nx; b[1] = ny; }
    const near = (a, b, t) => Math.abs(a - b) <= t;
    // Doppelstreifen erst ab 2 Fotos je Streifen: zwei Fotos nebeneinander sind kein Doppelstreifen
    const twin = boxes.length >= 4 && boxes.length % 2 === 0 && boxes.every((b, i) => { const o = boxes[i ^ 1];
      return near(b[1], o[1], gh * .02) && near(b[2], o[2], gw * .03) && near(b[3], o[3], gh * .02) && near(Math.abs(b[0] - o[0]), gw / 2, gw * .04); });
    // Zwei gleiche Querstreifen übereinander (6×4-Blatt): obere Hälfte = untere Hälfte
    const top = boxes.filter(b => b[1] + b[3] / 2 < gh / 2), bot = boxes.filter(b => b[1] + b[3] / 2 >= gh / 2);
    const twinV = !twin && top.length >= 2 && top.length === bot.length && top.every(b => bot.some(o => near(o[0], b[0], gw * .02) && near(o[2], b[2], gw * .02) && near(o[3], b[3], gh * .03) && near(o[1] - b[1], gh / 2, gh * .04)));
    return { boxes: boxes.map(b => [b[0] / gw, b[1] / gh, b[2] / gw, b[3] / gh]), twin, twinV, opaque: clear < gw * gh * .005 };
  }

  // Papierformat zum Bild: genaue Pixelgröße (300 dpi), dann Name („2x6“, „6x4“ …), dann Seitenverhältnis
  const CODE = /(?:^|[^0-9])([2-8])\s*[x×]\s*([2-8])(?:[^0-9]|$)/i;
  const NUM = /(?:^|[^0-9])([2-8])\s*[x×]\s*([2-8])\s*[-_ ]*\s*(\d{1,2})(?:[^0-9]|$)/i;
  function pickFormat(w, h, name) {
    const Fs = FBR().FORMATS, all = Object.entries(Fs);
    const exact = all.find(([, F]) => F.w === w && F.h === h) || all.find(([, F]) => F.w * 2 === w && F.h * 2 === h); // 300 oder 600 dpi
    if (exact) return exact[0];
    const ar = w / h, m = String(name).match(CODE);
    if (m) { const a = +m[1], b = +m[2], s = Math.min(a, b) + 'x' + Math.max(a, b), o = a === b ? '' : ar >= 1 ? 'l' : 'p';
      const k = FBR().formatKey(s, o === 'l' ? 'l' : 'p'); if (k && Math.abs(Fs[k].w / Fs[k].h - ar) < .08) return k; }
    const common = ['2x6', '2x6l', '4x6p', '4x6l', '5x5', '6x8p', '6x8l', '5x7p', '5x7l'].filter(k => Fs[k]);
    const best = list => list.sort((a, b) => Math.abs(Fs[a].w / Fs[a].h - ar) - Math.abs(Fs[b].w / Fs[b].h - ar))[0];
    const k = best([...common]); return Math.abs(Fs[k].w / Fs[k].h - ar) < .05 ? k : best(Object.keys(Fs));
  }
  // Fotoanzahl der üblichen Vorlagen-Nummern (wie die Formate im BoothDesigner-Katalog), für Hintergründe ohne durchsichtige Felder
  const COUNT = { '4x6-01': 1, '4x6-02': 5, '4x6-03': 7, '4x6-04': 1, '6x4-01': 3, '6x4-02': 3, '6x4-03': 6, '6x4-04': 1, '2x6-01': 2, '2x6-02': 3, '2x6-03': 3, '2x6-04': 4, '2x6-05': 2, '5x5-01': 1 };
  const codeOf = name => { const m = String(name).match(NUM); return m ? `${m[1]}x${m[2]}-${m[3].padStart(2, '0')}` : ''; };
  const ROLE_BG = /(^|[\s_\-.(])(background|hintergrund|bg|back|hinten)([\s_\-.)]|$)/i, ROLE_FG = /(^|[\s_\-.(])(overlay|foreground|vordergrund|fg|front|rahmen|frame)([\s_\-.)]|$)/i;
  const groupKey = p => (dir(p) + stem(p)).toLowerCase().replace(ROLE_BG, ' ').replace(ROLE_FG, ' ').replace(/[\s_\-.]+/g, ' ').trim();
  const pretty = p => stem(p).replace(/[_]+/g, ' ').replace(/(\d)\s*x\s*(\d)/gi, '$1×$2').replace(/\s+/g, ' ').trim();

  // Fotofelder aus einer Einstellungsdatei (JSON) – nur wenn das Bild selbst keine durchsichtigen Felder hat. Sucht Listen von Rechtecken
  // {x, y, w|width, h|height}; Werte ≤ 1 gelten als Anteil, sonst als Pixel bezogen auf die Blattgröße der Datei bzw. des Bildes.
  function rectsFromConfig(json, iw, ih) {
    let best = null;
    const num = v => typeof v === 'number' && isFinite(v);
    const rect = o => o && typeof o === 'object' && num(o.x ?? o.left) && num(o.y ?? o.top) && num(o.w ?? o.width) && num(o.h ?? o.height);
    const size = o => { const w = o?.canvasWidth ?? o?.pageWidth ?? o?.width, h = o?.canvasHeight ?? o?.pageHeight ?? o?.height; return num(w) && num(h) && w > 50 && h > 50 ? [w, h] : null; };
    (function go(o, sz) {
      if (Array.isArray(o)) {
        const r = o.filter(rect);
        if (r.length && r.length <= 12 && r.length === o.length && (!best || r.length > best.r.length)) best = { r, sz };
        o.forEach(x => go(x, sz)); return;
      }
      if (o && typeof o === 'object') { // Blattgröße am Objekt selbst oder in einem Unterobjekt wie {canvas: {width, height}}
        const sizeOf = v => v && typeof v === 'object' && !Array.isArray(v) && !rect(v) ? size(v) : null;
        const s = rect(o) ? sz : sizeOf(o) || Object.values(o).map(sizeOf).find(Boolean) || sz;
        for (const k of Object.keys(o)) go(o[k], s);
      }
    })(json, null);
    if (!best) return null;
    const [W, H] = best.sz || [iw, ih];
    const out = best.r.map(o => { const x = o.x ?? o.left, y = o.y ?? o.top, w = o.w ?? o.width, h = o.h ?? o.height, frac = [x, y, w, h].every(v => v <= 1.001);
      return frac ? [x, y, w, h] : [x / W, y / H, w / W, h / H]; }).filter(b => b[2] > .03 && b[3] > .03 && b[0] > -.05 && b[1] > -.05 && b[0] + b[2] < 1.05 && b[1] + b[3] < 1.05);
    return out.length ? out : null;
  }

  // ---------- Import ----------
  async function read(file, { onStep } = {}) {
    onStep?.('ZIP-Datei wird gelesen …');
    const entries = (await readZip(file)).filter(e => !junk(e.name));
    if (entries.some(e => e.enc)) throw new Error('Die ZIP-Datei ist mit Passwort geschützt. Bitte ohne Passwort neu packen.');
    const urls = [], blobUrl = b => { const u = URL.createObjectURL(b); urls.push(u); return u; };
    const pack = stem(file.name || 'Vorlagen').replace(/[_]+/g, ' ').trim() || 'Vorlagen';
    const dispose = () => { urls.splice(0).forEach(u => URL.revokeObjectURL(u)); };
    const items = [], configs = []; // configs: Einstellungsdateien im Paket (für build)
    try {
      // 1) Eigene Sicherung (vorlagen.json) oder einzelne .fotolayout.json-Dateien
      const own = [];
      for (const e of entries.filter(e => /\.json$/i.test(e.name) && e.size < 20e6)) {
        let j; try { j = JSON.parse(new TextDecoder().decode(await e.get())); } catch { continue; }
        const list = j?.typ === TYP && Array.isArray(j.vorlagen) ? j.vorlagen : /\.fotolayout\.json$/i.test(e.name) ? [j] : [];
        for (const L of list) if (L && Array.isArray(L.elements) && L.w && L.h && !L.screen) own.push({ L, at: dir(e.name) });
      }
      if (own.length) {
        const assets = new Map(); // Pfad in der ZIP → { blob, url }
        for (const [i, { L, at }] of own.entries()) {
          onStep?.(`Vorlage ${i + 1} von ${own.length} wird gelesen …`);
          const show = JSON.parse(JSON.stringify(L)); let lost = 0;
          const refs = []; walk(show, (o, k) => refs.push([o, k]));
          for (const [o, k] of refs) {
            const v = o[k]; if (/^(https?:|data:|blob:)/i.test(v)) continue;
            const p = (at + v).replace(/^\.\//, ''), e = entries.find(x => x.name === p) || entries.find(x => x.name === v);
            if (!e) { lost++; continue; }
            if (!assets.has(e.name)) { const b = new Blob([await e.get()], { type: MIME[extOf(e.name)] || 'image/png' }); assets.set(e.name, { blob: b, url: blobUrl(b), name: base(e.name) }); }
            o[k] = assets.get(e.name).url;
          }
          const c = await preview(show), F = FBR().FORMATS[show.format];
          items.push({ layout: show, preview: c ? c.toDataURL('image/jpeg', .8) : '', info: `${F?.label || `${show.w}×${show.h}`} · ${photoInfo(show)}${lost ? ` · ${lost} Bild(er) fehlen` : ''}`, skip: false, assets });
        }
        return done('eigene', `${items.length === 1 ? '1 Vorlage' : `${items.length} Vorlagen`} aus einer Photobox-Memories-Sicherung gefunden.`);
      }

      // 2) Vorlagen-Paket aus einem anderen Programm: Bilder (PNG-Rahmen, Hintergründe), evtl. Einstellungsdateien
      const imgs = entries.filter(e => ['png', 'jpg', 'jpeg', 'webp'].includes(extOf(e.name)) && e.size > 0 && e.size < 60e6 && !/(^|\/)(vorschau|preview|thumbs?|thumbnails?)\//i.test(e.name));
      if (!imgs.length) return done('leer', entries.some(e => /\.(psd|ai|pdf|eps)$/i.test(e.name))
        ? 'In der ZIP-Datei sind nur PSD-, PDF- oder AI-Dateien. Bitte die Vorlagen vorher als PNG mit durchsichtigen Fotofeldern speichern.'
        : 'In dieser ZIP-Datei wurde keine Vorlage gefunden (keine PNG- oder JPG-Bilder).');
      for (const e of entries.filter(e => /\.json$/i.test(e.name) && e.size < 5e6)) { try { configs.push({ name: e.name, j: JSON.parse(new TextDecoder().decode(await e.get())) }); } catch { /* keine Einstellungen */ } }
      const found = [];
      for (const [i, e] of imgs.entries()) {
        onStep?.(`Bild ${i + 1} von ${imgs.length} wird geprüft …`);
        const blob = new Blob([await e.get()], { type: MIME[extOf(e.name)] }), url = blobUrl(blob), img = await loadLocal(url);
        if (!img || !img.naturalWidth) continue;
        const h = extOf(e.name) === 'png' || extOf(e.name) === 'webp' ? holes(img) : { boxes: [], twin: false, opaque: true };
        found.push({ e, blob, url, img, ...h, role: h.boxes.length ? 'fg' : ROLE_BG.test(stem(e.name)) || h.opaque ? 'bg' : ROLE_FG.test(stem(e.name)) ? 'fg' : 'bg' });
      }
      // Rahmen und Hintergrund mit gleichem Namen (z. B. „Hochzeit overlay.png“ + „Hochzeit background.jpg“) werden eine Vorlage
      const groups = new Map(); for (const f of found) { const k = groupKey(f.e.name); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); }
      for (const [, g] of groups) {
        const fgs = g.filter(f => f.role === 'fg'), bgs = g.filter(f => f.role === 'bg');
        if (fgs.length === 1 && bgs.length === 1) { items.push(await build(fgs[0], bgs[0])); continue; }
        for (const f of g) items.push(await build(f.role === 'fg' ? f : null, f.role === 'bg' ? f : null));
      }
      // Doppelstreifen (zwei gleiche 2×6-Streifen auf einem 4×6-Blatt): ist dieselbe Nummer auch als Einzelstreifen dabei, nicht doppelt anbieten
      for (const it of items) if (it.fromTwin && items.some(o => o !== it && !o.fromTwin && o.code && o.code === it.code && o.layout.format === it.layout.format && o.folder === it.folder)) {
        it.skip = true; it.info += ' · doppelt (der Einzelstreifen ist schon dabei)';
      }
      items.sort((a, b) => a.layout.name.localeCompare(b.layout.name, 'de', { numeric: true }));
      const nTake = items.filter(i => !i.skip).length, nCheck = items.filter(i => i.check && !i.skip).length;
      return done('paket', `${items.length === 1 ? '1 Vorlage' : `${items.length} Vorlagen`} gefunden${nTake < items.length ? `, ${nTake} davon vorgewählt` : ''}.`
        + (nCheck ? ` Bei ${nCheck === 1 ? 'einer Vorlage' : nCheck + ' Vorlagen'} bitte danach die Fotofelder im Editor prüfen.` : ''));
    } catch (e) { dispose(); throw e; }

    function photoInfo(L) { const n = FBR().photoCount(L); return n === 1 ? '1 Foto' : `${n} Fotos`; }
    function done(kind, summary) { return { kind, summary, items, dispose, finish: (idx, o) => finish(items, idx, o) }; }

    // Eine Vorlage aus Rahmen (fg, mit durchsichtigen Fotofeldern) und/oder Hintergrund (bg) bauen
    async function build(fg, bg) {
      const main = fg || bg, nm = main.e.name, code = codeOf(nm) || codeOf(dir(nm)), U = FBR().uid;
      let fmt = pickFormat(main.img.naturalWidth, main.img.naturalHeight, base(nm) + ' ' + dir(nm));
      let boxes = fg ? fg.boxes : [], fgSrc = fg?.url, fromTwin = false, check = false, how = fg ? 'Rahmen mit Fotofeldern' : 'Hintergrund';
      // Zwei gleiche Streifen nebeneinander auf 4×6 → ein 2×6-Streifen (druckt die Fotobox selbst doppelt)
      if (fg && fg.twin && fmt === '4x6p' && FBR().FORMATS['2x6']) {
        const c = document.createElement('canvas'), iw = fg.img.naturalWidth, ih = fg.img.naturalHeight; c.width = Math.round(iw / 2); c.height = ih;
        c.getContext('2d').drawImage(fg.img, 0, 0, c.width, ih, 0, 0, c.width, ih);
        const b = await canvasBlob(c); fgSrc = blobUrl(b); fg = { ...fg, blob: b, url: fgSrc };
        boxes = boxes.filter(x => x[0] < .5).map(x => [x[0] * 2, x[1], Math.min(1, x[2] * 2), x[3]]); fmt = '2x6'; fromTwin = true; how = 'Doppelstreifen → Einzelstreifen';
      } else if (fg && fg.twinV && fmt === '4x6l' && FBR().FORMATS['2x6l']) { // zwei Querstreifen übereinander → ein Querstreifen
        const c = document.createElement('canvas'), iw = fg.img.naturalWidth, ih = fg.img.naturalHeight; c.width = iw; c.height = Math.round(ih / 2);
        c.getContext('2d').drawImage(fg.img, 0, 0, iw, c.height, 0, 0, iw, c.height);
        const b = await canvasBlob(c); fgSrc = blobUrl(b); fg = { ...fg, blob: b, url: fgSrc };
        boxes = boxes.filter(x => x[1] + x[3] / 2 < .5).map(x => [x[0], x[1] * 2, x[2], Math.min(1, x[3] * 2)]); fmt = '2x6l'; fromTwin = true; how = 'Doppelstreifen → Einzelstreifen';
      }
      const F = FBR().FORMATS[fmt];
      if (!boxes.length) { // keine durchsichtigen Felder: aus Einstellungsdatei, sonst Grundaufteilung nach Vorlagen-Nummer
        const cfg = configs.find(c => groupKey(c.name) === groupKey(nm)) || configs.find(c => dir(c.name) === dir(nm)) || (configs.length === 1 ? configs[0] : null);
        const r = cfg && rectsFromConfig(cfg.j, main.img.naturalWidth, main.img.naturalHeight);
        if (r) { boxes = r; how += ' · Fotofelder aus Einstellungsdatei'; check = true; }
        else { const n = COUNT[code] || 1; boxes = FBR().presetSlots(fmt, n, true).map(s => [s[0] / F.w, s[1] / F.h, s[2] / F.w, s[3] / F.h]); check = true; how += ' · Fotofelder bitte prüfen'; }
      }
      const twinN = !fromTwin && fg?.twin;
      const els = [];
      if (bg) els.push({ id: U(), type: 'image', src: bg.url, fit: 'stretch', opacity: 1, x: 0, y: 0, w: F.w, h: F.h, rot: 0, locked: true });
      boxes.slice(0, 12).forEach((b, i) => els.push({ id: U(), type: 'photo', n: twinN ? (i >> 1) + 1 : i + 1, x: Math.round(b[0] * F.w), y: Math.round(b[1] * F.h), w: Math.round(b[2] * F.w), h: Math.round(b[3] * F.h),
        rot: 0, radius: 0, stroke: '', strokeW: 0, shadow: false }));
      if (fg) els.push({ id: U(), type: 'image', src: fgSrc, fit: 'stretch', opacity: 1, x: 0, y: 0, w: F.w, h: F.h, rot: 0, locked: true });
      const title = fg && bg ? pretty(nm).replace(ROLE_FG, ' ').replace(/\s+/g, ' ').trim() || pretty(nm) : pretty(nm); // Paar: „Party“ statt „Party overlay“
      const L = { id: U(), name: `${pack} · ${title}`.slice(0, 120), format: fmt, w: F.w, h: F.h, bg: '#ffffff', twoPerPage: F.size === '2x6', secondary: false, elements: els, importiert: 'zip' };
      const assets = new Map(); for (const f of [fg, bg]) if (f) assets.set(f.url, { blob: f.blob, url: f.url, name: base(f.e.name) });
      const c = await preview(L);
      // folder: Ordner des Designs ohne einen Unterordner „Single Strip“ o. Ä. – Einzel- und Doppelstreifen eines Designs liegen so im selben
      const folder = dir(nm).replace(/(^|\/)[^/]*single[^/]*\/$/i, '$1');
      return { layout: L, preview: c ? c.toDataURL('image/jpeg', .8) : '', info: `${F.label} · ${photoInfo(L)} · ${how}`, skip: false, check, fromTwin, code, folder, assets };
    }
  }

  // Gewählte Vorlagen übernehmen: Bilder hochladen (upload(file) → Adresse), neue Kennungen
  async function finish(items, idx, { upload, onStep } = {}) {
    const chosen = idx.map(i => items[i]).filter(Boolean), done = new Map(), out = [];
    const total = new Set(chosen.flatMap(it => [...it.assets.keys()])).size; let n = 0;
    for (const it of chosen) {
      const L = JSON.parse(JSON.stringify(it.layout)), refs = []; walk(L, (o, k) => refs.push([o, k]));
      for (const [o, k] of refs) {
        const a = [...it.assets.values()].find(x => x.url === o[k]); if (!a) continue;
        if (!done.has(a.url)) {
          onStep?.(`Bild ${++n} von ${total} wird gespeichert …`);
          let b = a.blob, nm = a.name || 'vorlage.png';
          if (/webp/i.test(b.type)) { const im = await loadLocal(a.url), c = document.createElement('canvas'); if (im) { c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext('2d').drawImage(im, 0, 0); b = await canvasBlob(c); nm = nm.replace(/\.webp$/i, '') + '.png'; } } // Hochladen macht aus Nicht-PNG ein JPEG – die Durchsicht bliebe sonst nicht erhalten
          const f = new File([b], nm, { type: b.type || 'image/png' });
          done.set(a.url, upload ? await upload(f) : await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); }));
        }
        o[k] = done.get(a.url);
      }
      L.id = FBR().uid(); L.elements.forEach(e => { e.id = FBR().uid(); }); delete L.importiert;
      out.push(L);
    }
    return out;
  }

  return { exportZip, read, _zip: { writeZip, readZip, crc32 }, _intern: { pickFormat, codeOf, groupKey, rectsFromConfig } };
})();
