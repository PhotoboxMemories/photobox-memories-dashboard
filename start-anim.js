// Live-Vorschau der Standard-Startanimation der Fotobox (app-desktop/app/media/start-hoch.mp4 / start-quer.mp4) im Dashboard.
// Gleiche Zeichnung wie werkzeuge/startvideo/startvideo.html, aus der die Videos entstanden sind – bei Änderungen beide anpassen.
// In der weißen Scheibe steht das gewählte Logo genau so, wie die Fotobox es über das Video legt (#stdBrand in app/index.html):
// weiße Fläche mit 95 % des Scheibendurchmessers, darin das Bild mit „Größe“ in Prozent, ganz gezeigt oder rund ausgefüllt.
(function (G) {
  'use strict';
  const T = 12, Y = '#F7C838', TAU = Math.PI * 2, A = {};
  let loading = null;
  const load = (k, src) => new Promise(r => { const i = new Image(); i.onload = () => { A[k] = i; r(); }; i.onerror = () => r(); i.src = src; });
  function assets() {
    return loading || (loading = Promise.all([load('photo', 'testfoto.jpg'), load('ki', 'bilder/ki-teppich.jpg'), load('cari', 'bilder/karikatur.jpg')]).then(() => {
      if (!A.photo) return; // vierte Karte: Testpaar in Schwarz-Weiß
      const c = document.createElement('canvas'); c.width = A.photo.width; c.height = A.photo.height;
      const g = c.getContext('2d'); g.filter = 'grayscale(1) contrast(1.1)'; g.drawImage(A.photo, 0, 0); A.photo2 = c;
    }));
  }
  const DOTS = {};
  function dots(quer) {
    if (DOTS[quer]) return DOTS[quer];
    let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    return (DOTS[quer] = Array.from({ length: quer ? 46 : 52 }, () => ({ x: rnd(), y: rnd(), r: 3 + rnd() * 14, k: rnd() < .7 ? 1 : 2, m: 1 + Math.floor(rnd() * 3), p: rnd(), a: .15 + rnd() * .45, sway: rnd() * 30 })));
  }
  function polaroid(x, img, cx, cy, w, rot, alpha) {
    const h = w * 1.18, pad = w * .06;
    x.save(); x.globalAlpha = alpha; x.translate(cx, cy); x.rotate(rot);
    x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = w * .12; x.shadowOffsetY = w * .04;
    x.fillStyle = '#fbfaf6'; x.fillRect(-w / 2, -h / 2, w, h); x.shadowColor = 'transparent';
    const iw = w - pad * 2, ih = iw;
    if (img) { const sc = Math.max(iw / img.width, ih / img.height), sw = iw / sc, sh = ih / sc; x.drawImage(img, (img.width - sw) / 2, (img.height - sh) * .25, sw, sh, -w / 2 + pad, -h / 2 + pad, iw, ih); }
    x.restore();
  }
  function camIcon(x, w) {
    const h = w * .62, top = -h / 2 + w * .05;
    x.save(); x.strokeStyle = '#cfc9bb'; x.lineWidth = w * .065; x.lineJoin = x.lineCap = 'round';
    x.beginPath(); x.roundRect(-w / 2, top, w, h, w * .12); x.stroke();
    x.beginPath(); x.moveTo(-w * .2, top); x.lineTo(-w * .12, top - w * .11); x.lineTo(w * .12, top - w * .11); x.lineTo(w * .2, top); x.stroke();
    x.beginPath(); x.arc(0, top + h / 2, h * .3, 0, TAU); x.stroke();
    x.restore();
  }
  // Logo in der Scheibe (wie die Fotobox): brand = { img, text, size: 0.3–1, fit: 'contain' | 'cover' }
  function brandIn(x, r, b) {
    const R = r * .95; x.save(); x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill(); x.clip();
    const box = 2 * R * b.size, im = b.img;
    if (im && im.naturalWidth) {
      const iw = im.naturalWidth, ih = im.naturalHeight;
      if (b.fit === 'cover') { x.beginPath(); x.arc(0, 0, box / 2, 0, TAU); x.clip(); const s = Math.max(box / iw, box / ih); x.drawImage(im, -iw * s / 2, -ih * s / 2, iw * s, ih * s); }
      else { const s = Math.min(box / iw, box / ih); x.drawImage(im, -iw * s / 2, -ih * s / 2, iw * s, ih * s); }
    } else if (b.text) {
      const fs = 2 * R * .13, maxW = 2 * R * .76; x.font = `700 ${fs}px Fredoka, system-ui, sans-serif`; x.fillStyle = '#1D1D1B'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const lines = []; for (const w of String(b.text).split(/\s+/)) { const l = lines.length ? lines[lines.length - 1] + ' ' + w : w; if (lines.length && x.measureText(l).width > maxW) lines.push(w); else lines[Math.max(0, lines.length - 1)] = l; }
      lines.slice(0, 4).forEach((l, i, a) => x.fillText(l, 0, (i - (a.length - 1) / 2) * fs * 1.15, maxW));
    }
    x.restore();
  }
  function sticker(x, cx, cy, size, u, brand) {
    const b = 1 + .025 * Math.sin(TAU * u * 2);
    x.save(); x.translate(cx, cy); x.scale(b, b);
    x.save(); x.rotate(TAU * u); x.strokeStyle = Y; x.lineWidth = size * .018; x.globalAlpha = .9;
    for (let i = 0; i < 8; i++) { const a0 = i * TAU / 8; x.beginPath(); x.arc(0, 0, size * .6, a0 + .08, a0 + TAU / 8 - .08); x.stroke(); }
    x.restore();
    x.save(); x.rotate(-TAU * u); x.strokeStyle = 'rgba(247,200,56,.35)'; x.lineWidth = size * .008; x.setLineDash([size * .03, size * .05]);
    x.beginPath(); x.arc(0, 0, size * .68, 0, TAU); x.stroke(); x.restore();
    x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = size * .1; x.shadowOffsetY = size * .03; x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, size * .465, 0, TAU); x.fill(); x.restore();
    x.strokeStyle = Y; x.lineWidth = size * .014; x.beginPath(); x.arc(0, 0, size * .465, 0, TAU); x.stroke();
    if (brand) brandIn(x, size * .465, brand); else camIcon(x, size * .36);
    x.restore();
  }
  function frame(x, quer, t, brand) {
    const [W, H] = quer ? [1920, 1080] : [1080, 1920], u = (t % T) / T;
    const g = x.createRadialGradient(W * (.5 + .18 * Math.sin(TAU * u)), H * (.35 + .1 * Math.cos(TAU * u)), 0, W / 2, H / 2, Math.hypot(W, H) * .7);
    g.addColorStop(0, '#3a3424'); g.addColorStop(.45, '#1d1d1b'); g.addColorStop(1, '#0b0b0a');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (const d of dots(quer)) {
      const yy = ((d.y - d.k * u) % 1 + 1) % 1, xx = d.x * W + Math.sin(TAU * (u * d.m + d.p)) * d.sway, tw = .55 + .45 * Math.sin(TAU * (u * d.m * 2 + d.p));
      const rg = x.createRadialGradient(xx, yy * H, 0, xx, yy * H, d.r); rg.addColorStop(0, `rgba(247,200,56,${d.a * tw})`); rg.addColorStop(1, 'rgba(247,200,56,0)');
      x.fillStyle = rg; x.beginPath(); x.arc(xx, yy * H, d.r, 0, TAU); x.fill();
    }
    const cx = W / 2, cy = quer ? H * .3 : H * .27, size = Math.min(W, H) * (quer ? .3 : .4), pics = [A.photo, A.ki, A.cari, A.photo2 || A.photo], orbit = [];
    pics.forEach((img, i) => {
      const a = TAU * (u + i / pics.length), rx = quer ? W * .3 : W * .36, sn = Math.sin(a), ry = sn > 0 ? (quer ? H * .28 : H * .17) : (quer ? H * .22 : H * .15);
      const depth = (sn + 1) / 2;
      orbit.push({ img, px: cx + Math.cos(a) * rx, py: cy + sn * ry, depth, rot: .14 * Math.sin(TAU * (u * 2 + i / 4)), w: Math.min(W, H) * (quer ? .16 + .11 * depth : .2 + .07 * depth) });
    });
    orbit.sort((p, q) => p.depth - q.depth).forEach(o => polaroid(x, o.img, o.px, o.py, o.w, o.rot, .55 + .45 * o.depth));
    sticker(x, cx, cy, size, u, brand);
    const f = Math.max(0, 1 - Math.abs(u - .8) / .03); if (f > 0) { x.fillStyle = `rgba(255,255,255,${.22 * f})`; x.fillRect(0, 0, W, H); }
  }
  // Animation in einer Leinwand abspielen (Querformat, wenn breiter als hoch). getBrand() liefert das aktuelle Logo oder null.
  // Hört von selbst auf, sobald die Leinwand nicht mehr auf der Seite ist.
  function play(cv, getBrand) {
    const quer = cv.width > cv.height, W = quer ? 1920 : 1080, H = quer ? 1080 : 1920, t0 = performance.now();
    let on = true, last = 0;
    assets().then(() => {
      const loop = now => {
        if (!on || !cv.isConnected) return;
        if (now - last > 30) { last = now; const x = cv.getContext('2d'); x.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); frame(x, quer, (now - t0) / 1000, getBrand ? getBrand() : null); }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    return { stop() { on = false; } };
  }
  G.StartAnim = { play, assets };
})(window);
