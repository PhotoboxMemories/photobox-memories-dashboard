// Live-Zeichnung („Strich für Strich“): Ein fertiges Karikaturbild wird mit einem wandernden Stift nachgezeichnet, danach
// malt ein Pinsel die Farbe hinein. Die Striche kommen aus dem Bild selbst (dunkle Linien gegenüber der Umgebung) –
// es braucht keine zweite KI-Anfrage. Läuft auf einer <canvas> (Fotobox-Bildschirm oder zweiter Bildschirm).
(function (G) {
  'use strict';
  const INK = [29, 29, 27];

  // Linien finden: Pixel, die deutlich dunkler sind als ihre Umgebung (wie eine Bleistiftskizze), in Strichen geordnet
  function strokes(img, maxSide = 720) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.min(1, maxSide / Math.max(iw, ih));
    const w = Math.round(iw * k), h = Math.round(ih * k), c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, n = w * h, L = new Float32Array(n);
    for (let i = 0; i < n; i++) L[i] = .299 * d[i * 4] + .587 * d[i * 4 + 1] + .114 * d[i * 4 + 2];
    // Mittelwert der Umgebung über ein Summenbild (schnell, egal wie groß der Radius ist)
    const S = new Float64Array((w + 1) * (h + 1));
    for (let yy = 0; yy < h; yy++) { let row = 0; for (let xx = 0; xx < w; xx++) { row += L[yy * w + xx]; S[(yy + 1) * (w + 1) + xx + 1] = S[yy * (w + 1) + xx + 1] + row; } }
    const r = Math.max(3, Math.round(Math.min(w, h) / 90)), mask = new Uint8Array(n);
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const x0 = Math.max(0, xx - r), x1 = Math.min(w, xx + r + 1), y0 = Math.max(0, yy - r), y1 = Math.min(h, yy + r + 1);
      const mean = (S[y1 * (w + 1) + x1] - S[y0 * (w + 1) + x1] - S[y1 * (w + 1) + x0] + S[y0 * (w + 1) + x0]) / ((x1 - x0) * (y1 - y0));
      const v = L[yy * w + xx];
      if (v < mean - 16 && v < 205 || v < 45) mask[yy * w + xx] = 1;
    }
    // zusammenhängende Linien (8 Nachbarn); jede Linie von ihrem obersten Punkt aus in Ausbreitungs-Reihenfolge
    const seen = new Uint8Array(n), comps = [], q = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      if (!mask[i] || seen[i]) continue;
      let head = 0, tail = 0; q[tail++] = i; seen[i] = 1;
      while (head < tail) {
        const p = q[head++], px = p % w, py = (p - px) / w;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx; if (mask[j] && !seen[j]) { seen[j] = 1; q[tail++] = j; }
        }
      }
      if (tail >= 6) comps.push(q.slice(0, tail)); // Fussel weglassen
    }
    // Reihenfolge wie beim Zeichnen: von oben nach unten, große Umrisse eines Bereichs vor den kleinen Details
    comps.sort((a, b) => (Math.floor(a[0] / w / (h / 8)) - Math.floor(b[0] / w / (h / 8))) || (b.length - a.length));
    let total = 0; for (const cp of comps) total += cp.length;
    const order = new Int32Array(total); let o = 0; for (const cp of comps) { order.set(cp, o); o += cp.length; }
    return { w, h, order, canvas: c };
  }

  // Bleistift mit der Spitze bei (x, y)
  function pencil(x, X, Y, s, color = '#1D1D1B') {
    x.save(); x.translate(X, Y); x.rotate(-0.62);
    x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(s * .25, -s * .08, s * 1.15, s * .2);
    x.fillStyle = '#e9c79a'; x.beginPath(); x.moveTo(0, 0); x.lineTo(s * .28, -s * .1); x.lineTo(s * .28, s * .1); x.closePath(); x.fill();
    x.fillStyle = color; x.beginPath(); x.moveTo(0, 0); x.lineTo(s * .09, -s * .032); x.lineTo(s * .09, s * .032); x.closePath(); x.fill();
    x.fillStyle = '#F7C838'; x.fillRect(s * .28, -s * .1, s * .9, s * .2); x.fillStyle = '#ffe08a'; x.fillRect(s * .28, -s * .1, s * .9, s * .06);
    x.fillStyle = '#c9c9d1'; x.fillRect(s * 1.18, -s * .1, s * .12, s * .2); x.fillStyle = '#ff8fb0'; x.fillRect(s * 1.3, -s * .1, s * .14, s * .2);
    x.restore();
  }

  // cv: Ziel-Leinwand · img: fertige Karikatur (heller Hintergrund) · box: {x,y,w,h} Zeichenfläche auf cv (sonst ganze Fläche)
  // Gibt ein Promise zurück, das nach der Animation erfüllt ist. stop() bricht ab.
  function play(cv, img, { box, lineSecs = 9, colorSecs = 3, background, foreground } = {}) {
    const S = strokes(img), ctx = cv.getContext('2d');
    const B = box || { x: 0, y: 0, w: cv.width, h: cv.height }, k = Math.min(B.w / S.w, B.h / S.h);
    const dw = S.w * k, dh = S.h * k, ox = B.x + (B.w - dw) / 2, oy = B.y + (B.h - dh) / 2;
    const ink = document.createElement('canvas'); ink.width = S.w; ink.height = S.h; const ix = ink.getContext('2d');
    const inkData = ix.createImageData(S.w, S.h), id = inkData.data;
    const color = document.createElement('canvas'); color.width = S.w; color.height = S.h; const cx = color.getContext('2d');
    const mask = document.createElement('canvas'); mask.width = S.w; mask.height = S.h; const mx = mask.getContext('2d');
    // Pinselweg für die Farbe: Zickzack von oben nach unten
    const R = Math.max(S.w, S.h) * .1, dabs = [];
    for (let row = 0, yy = R * .4; yy < S.h + R; yy += R * .8, row++) for (let i = 0; i <= 8; i++) { const t = i / 8; dabs.push([(row % 2 ? 1 - t : t) * S.w, yy + Math.sin(t * 6.3) * R * .15]); }
    let raf = 0, stopped = false, done = 0;
    const pen = Math.min(dw, dh) * .16;
    return Object.assign(new Promise(res => {
      const t0 = performance.now(), total = S.order.length;
      const frame = now => {
        if (stopped) return res(false);
        const t = (now - t0) / 1000;
        if (background) background(ctx); else { ctx.fillStyle = '#fff'; ctx.fillRect(B.x, B.y, B.w, B.h); }
        // Phase 1: Striche
        const want = Math.min(total, Math.floor(total * Math.min(1, t / lineSecs)));
        for (; done < want; done++) { const p = S.order[done] * 4; id[p] = INK[0]; id[p + 1] = INK[1]; id[p + 2] = INK[2]; id[p + 3] = 255; }
        ix.putImageData(inkData, 0, 0);
        // Phase 2: Farbe mit dem Pinsel
        const tc = Math.max(0, t - lineSecs) / colorSecs;
        if (tc > 0) {
          const nd = Math.min(dabs.length, Math.ceil(dabs.length * Math.min(1, tc)));
          mx.clearRect(0, 0, S.w, S.h);
          for (let i = 0; i < nd; i++) { const [X, Y] = dabs[i], g = mx.createRadialGradient(X, Y, 0, X, Y, R); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.7, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); mx.fillStyle = g; mx.beginPath(); mx.arc(X, Y, R, 0, 7); mx.fill(); }
          if (tc >= 1) { mx.fillStyle = '#000'; mx.fillRect(0, 0, S.w, S.h); }
          cx.clearRect(0, 0, S.w, S.h); cx.globalCompositeOperation = 'source-over'; cx.drawImage(S.canvas, 0, 0);
          cx.globalCompositeOperation = 'destination-in'; cx.drawImage(mask, 0, 0); cx.globalCompositeOperation = 'source-over';
          ctx.drawImage(color, ox, oy, dw, dh);
        }
        ctx.save(); ctx.imageSmoothingQuality = 'high'; if (tc > 0) ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = tc > 0 ? Math.max(.35, 1 - tc * .65) : 1;
        ctx.drawImage(ink, ox, oy, dw, dh); ctx.restore();
        if (foreground) foreground(ctx); // z. B. das Sofortbild des Gastes über der Zeichnung
        // Stift bzw. Pinsel
        if (t < lineSecs && done > 0) { const p = S.order[done - 1], px = p % S.w, py = (p - px) / S.w; pencil(ctx, ox + px * k, oy + py * k, pen); }
        else if (tc > 0 && tc < 1) { const i = Math.min(dabs.length - 1, Math.floor(dabs.length * tc)); pencil(ctx, ox + dabs[i][0] * k, oy + dabs[i][1] * k, pen, '#ff5d8f'); }
        if (tc >= 1.15) { ctx.drawImage(S.canvas, ox, oy, dw, dh); if (foreground) foreground(ctx); return res(true); } // zum Schluss genau das fertige Bild
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }), { stop() { stopped = true; cancelAnimationFrame(raf); } });
  }
  G.SketchDraw = { strokes, play };
})(window);
