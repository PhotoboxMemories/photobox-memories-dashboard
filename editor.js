// FotoBox – Layout-Editor (Fotofelder, Bilder, Texte, Formen frei anordnen)
// Benutzt FBR (render.js) für die exakte Vorschau.
// LayoutEditor.open({ layout, values, onSave(layout), onClose(), uploadImage(file) → Promise<url> })
(function (G) {
  'use strict';
  const CSS = `
  #le{position:fixed;inset:0;z-index:100;background:#f1f1f4;display:flex;flex-direction:column;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1d1d24}
  #le *{box-sizing:border-box}
  #le .top{height:56px;background:#221b45;color:#fff;display:flex;align-items:center;gap:10px;padding:0 14px}
  #le .top input{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:6px 10px;font:inherit;width:220px}
  #le .tb{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:8px;padding:7px 12px;cursor:pointer;font:inherit;white-space:nowrap}
  #le .tb:hover{background:rgba(255,255,255,.22)} #le .tb:disabled{opacity:.35;cursor:default}
  #le .tb.pri{background:#ff3d7f;border-color:#ff3d7f}
  #le .sp{flex:1} #le .st{font-size:12px;opacity:.7}
  #le .body{flex:1;display:flex;min-height:0}
  #le .side{width:300px;background:#fff;border-right:1px solid #e3e3ea;display:flex;flex-direction:column;min-height:0}
  #le .rail{display:flex;flex-direction:column;align-items:center;gap:18px;padding:40px 0;width:100%}
  #le .tool{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;background:none;border:0;font:inherit;color:#333;font-size:12px}
  #le .tool i{width:46px;height:46px;border-radius:50%;background:#e83f78;color:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:20px;box-shadow:0 4px 12px rgba(232,63,120,.3)}
  #le .tool:hover i{transform:scale(1.07)}
  #le .ph{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px}
  #le .ph h3{margin:0;font-size:18px}
  #le .x{background:none;border:0;font-size:20px;cursor:pointer;color:#777}
  #le .tabs{display:flex;border-bottom:1px solid #eee}
  #le .tabs button{flex:1;background:none;border:0;padding:10px;cursor:pointer;font:inherit;color:#666;border-bottom:2px solid transparent}
  #le .tabs button.on{color:#e83f78;border-color:#e83f78;font-weight:600}
  #le .pb{padding:12px 16px;overflow:auto;flex:1}
  #le label.l{display:block;font-size:12px;color:#666;margin:10px 0 4px;text-transform:uppercase;letter-spacing:.04em}
  #le .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  #le input[type=text],#le input[type=number],#le select,#le textarea{width:100%;border:1px solid #d9d9e2;border-radius:8px;padding:7px 9px;font:inherit;background:#fff;color:#1d1d24}
  #le input[type=color]{width:100%;height:34px;border:1px solid #d9d9e2;border-radius:8px;padding:2px;background:#fff}
  #le .bt{border:1px solid #d9d9e2;background:#fff;border-radius:8px;padding:7px 8px;cursor:pointer;font:inherit;display:flex;align-items:center;gap:6px;justify-content:center}
  #le .bt:hover{border-color:#e83f78} #le .bt.on{background:#fde8f0;border-color:#e83f78;color:#c2185b}
  #le .chip{display:inline-block;border:1px solid #d9d9e2;border-radius:999px;padding:3px 9px;margin:3px 3px 0 0;font-size:12px;cursor:pointer;background:#fff}
  #le .chip:hover{border-color:#e83f78}
  #le .row{display:flex;gap:8px;align-items:center}
  #le .lay{display:flex;align-items:center;gap:8px;border:1px solid #e3e3ea;border-radius:8px;padding:7px 9px;margin-bottom:6px;cursor:pointer;background:#fff}
  #le .lay.on{border-color:#e83f78;background:#fde8f0}
  #le .lay .n{flex:1;font-size:13px} #le .lay button{background:none;border:0;cursor:pointer;font-size:14px;padding:2px 4px}
  #le .stage{flex:1;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}
  #le .page{position:relative;box-shadow:0 10px 40px rgba(0,0,0,.18);background:#fff}
  #le .page canvas{display:block;width:100%;height:100%}
  #le .ov{position:absolute;inset:0;touch-action:none;cursor:default}
  #le .sel{position:absolute;border:2px solid #1976d2;pointer-events:none;transform-origin:center}
  #le .h{position:absolute;width:13px;height:13px;border-radius:50%;background:#1976d2;border:2px solid #fff;pointer-events:auto;margin:-6.5px 0 0 -6.5px}
  #le .h.r{background:#fff;border-color:#1976d2;cursor:grab}
  #le .guide{position:absolute;background:#ff3d7f;pointer-events:none}
  #le .hint{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:12px;color:#888}
  #le .sw{width:18px;height:18px;border-radius:4px;border:1px solid #ccc;display:inline-block;vertical-align:middle}
  `;
  const $ = (r, s) => r.querySelector(s);
  const clone = o => JSON.parse(JSON.stringify(o));
  const PH = ['titel', 'untertitel', 'datum', 'uhrzeit', 'event', 'name'];
  const TYPE_NAME = { photo: 'Fotobox-Foto', image: 'Bild', text: 'Text', shape: 'Form', deco: 'Vorlagen-Deko' };
  const TYPE_ICON = { photo: '📷', image: '🖼', text: '𝐀', shape: '◼︎', deco: '✨' };

  function open(opts) {
    if (!document.getElementById('le-css')) { const st = document.createElement('style'); st.id = 'le-css'; st.textContent = CSS; document.head.appendChild(st); }
    let L = clone(opts.layout), sel = null, panel = 'tools', tab = 'style';
    const hist = [JSON.stringify(L)]; let hi = 0;
    const root = document.createElement('div'); root.id = 'le';
    root.innerHTML = `
      <div class="top">
        <button class="tb" data-a="close">‹ Zurück</button>
        <input data-a="name" title="Name des Layouts">
        <span class="st" data-a="fmt"></span>
        <span class="sp"></span>
        <span class="st" data-a="status"></span>
        <button class="tb" data-a="del" style="display:none">🗑 Löschen</button>
        <button class="tb" data-a="undo" title="Rückgängig (⌘Z)">↶</button>
        <button class="tb" data-a="redo" title="Wiederholen (⇧⌘Z)">↷</button>
        <button class="tb pri" data-a="done">✓ Fertig</button>
      </div>
      <div class="body">
        <div class="side"></div>
        <div class="stage"><div class="page"><canvas></canvas><div class="ov"></div></div>
          <div class="hint">Ziehen = verschieben · Punkte = Größe · ⟳ = drehen · Entf = löschen · Pfeiltasten = fein verschieben</div></div>
      </div>`;
    document.body.appendChild(root);
    const side = $(root, '.side'), stage = $(root, '.stage'), page = $(root, '.page'), cv = $(root, 'canvas'), ov = $(root, '.ov');
    $(root, '[data-a=name]').value = L.name || '';
    let scale = 1;

    // ---------- Zeichnen ----------
    let raf = 0;
    function draw() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; FBR.renderLayout(L, { values: opts.values, placeholders: true }, cv); drawSel(); }); }
    function fit() {
      const r = stage.getBoundingClientRect();
      scale = Math.min((r.width - 60) / L.w, (r.height - 70) / L.h);
      page.style.width = L.w * scale + 'px'; page.style.height = L.h * scale + 'px';
      drawSel();
    }
    new ResizeObserver(fit).observe(stage);
    function drawSel() {
      ov.querySelectorAll('.sel,.guide').forEach(n => n.remove());
      const e = L.elements.find(x => x.id === sel);
      $(root, '[data-a=del]').style.display = e ? '' : 'none';
      if (!e || e.hidden) return;
      const b = document.createElement('div'); b.className = 'sel';
      Object.assign(b.style, { left: e.x * scale + 'px', top: e.y * scale + 'px', width: e.w * scale + 'px', height: e.h * scale + 'px', transform: `rotate(${e.rot || 0}deg)` });
      if (!e.locked) {
        [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].forEach(([sx, sy]) => {
          const h = document.createElement('div'); h.className = 'h'; h.dataset.sx = sx; h.dataset.sy = sy;
          Object.assign(h.style, { left: (sx + 1) * 50 + '%', top: (sy + 1) * 50 + '%', cursor: sx && sy ? (sx === sy ? 'nwse-resize' : 'nesw-resize') : sx ? 'ew-resize' : 'ns-resize' });
          b.appendChild(h);
        });
        const r = document.createElement('div'); r.className = 'h r'; r.dataset.rot = 1; r.title = 'Drehen';
        Object.assign(r.style, { left: '50%', top: '-22px' }); b.appendChild(r);
      }
      ov.appendChild(b);
    }

    // ---------- Verlauf ----------
    function commit() {
      const s = JSON.stringify(L);
      if (s === hist[hi]) return;
      hist.splice(hi + 1); hist.push(s); if (hist.length > 80) hist.shift(); hi = hist.length - 1;
      updUndo(); autosave();
    }
    function updUndo() { $(root, '[data-a=undo]').disabled = hi <= 0; $(root, '[data-a=redo]').disabled = hi >= hist.length - 1; }
    function jump(d) { const n = hi + d; if (n < 0 || n >= hist.length) return; hi = n; L = JSON.parse(hist[hi]); if (!L.elements.some(e => e.id === sel)) sel = null; updUndo(); renderSide(); draw(); autosave(); }
    let saveT = 0;
    function autosave() {
      $(root, '[data-a=status]').textContent = 'Speichert …';
      clearTimeout(saveT);
      saveT = setTimeout(async () => { try { await opts.onSave?.(clone(L)); $(root, '[data-a=status]').textContent = '✓ Gespeichert'; } catch (e) { $(root, '[data-a=status]').textContent = '⚠️ ' + e.message; } }, 600);
    }
    updUndo();

    // ---------- Elemente ----------
    const selEl = () => L.elements.find(x => x.id === sel);
    const center = (w, h) => ({ x: Math.round((L.w - w) / 2), y: Math.round((L.h - h) / 2) });
    function add(e) {
      e.id = FBR.uid(); e.rot = e.rot || 0;
      const over = L.elements.findIndex(x => x.type === 'deco' && x.layer === 'over');
      if (over >= 0) L.elements.splice(over, 0, e); else L.elements.push(e);
      sel = e.id; panel = 'el'; tab = 'style'; commit(); renderSide(); draw();
    }
    function addPhoto() {
      const n = FBR.photoCount(L) + 1, w = Math.round(L.w * .6), h = Math.round(w * 2 / 3);
      add({ type: 'photo', n, ...center(w, h), w, h, radius: 0, stroke: '', strokeW: 0 });
    }
    function addText() {
      const w = Math.round(L.w * .7), h = Math.round(Math.min(L.w, L.h) * .09);
      add({ type: 'text', text: 'Dein Text', font: 'modern', size: 'auto', color: '#222222', weight: 700, align: 'center', ...center(w, h), w, h });
    }
    function addShape() { const w = Math.round(L.w * .4), h = Math.round(L.h * .12); add({ type: 'shape', shape: 'rect', fill: '#ff3d7f', stroke: '', strokeW: 0, radius: 0, opacity: 1, ...center(w, h), w, h }); }
    function pickFile(accept) {
      return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => res(i.files[0] || null); i.click(); });
    }
    async function addImage(replace) {
      const f = await pickFile('image/*'); if (!f) return;
      const local = URL.createObjectURL(f);
      const img = await FBR.loadImg(local);
      let src = local;
      $(root, '[data-a=status]').textContent = 'Lädt Bild hoch …';
      try { if (opts.uploadImage) src = await opts.uploadImage(f); await FBR.loadImg(src); }
      catch (e) { alert('Bild konnte nicht hochgeladen werden: ' + e.message); return; }
      if (replace) { const e = selEl(); e.src = src; commit(); draw(); renderSide(); return; }
      const ar = img ? img.naturalWidth / img.naturalHeight : 1;
      let w = Math.round(L.w * .5), h = Math.round(w / ar);
      if (h > L.h * .6) { h = Math.round(L.h * .6); w = Math.round(h * ar); }
      add({ type: 'image', src, fit: 'stretch', opacity: 1, ...center(w, h), w, h });
    }
    function remove() {
      const e = selEl(); if (!e) return;
      L.elements = L.elements.filter(x => x.id !== sel); sel = null; panel = 'tools'; commit(); renderSide(); draw();
    }
    function duplicate() {
      const e = selEl(); if (!e) return;
      const c = clone(e); c.id = FBR.uid(); c.x += 30; c.y += 30;
      L.elements.splice(L.elements.indexOf(e) + 1, 0, c); sel = c.id; commit(); renderSide(); draw();
    }
    function move(dir) { // Ebene: +1 nach oben, -1 nach unten, 'top', 'bottom'
      const e = selEl(); if (!e) return;
      const a = L.elements, i = a.indexOf(e); a.splice(i, 1);
      const j = dir === 'top' ? a.length : dir === 'bottom' ? 0 : Math.max(0, Math.min(a.length, i + dir));
      a.splice(j, 0, e); commit(); renderSide(); draw();
    }
    function align(k) {
      const e = selEl(); if (!e) return;
      if (k === 'top') e.y = 0; if (k === 'middle') e.y = Math.round((L.h - e.h) / 2); if (k === 'bottom') e.y = L.h - e.h;
      if (k === 'left') e.x = 0; if (k === 'center') e.x = Math.round((L.w - e.w) / 2); if (k === 'right') e.x = L.w - e.w;
      commit(); renderSide(); draw();
    }

    // ---------- Maus / Touch ----------
    const toPage = ev => { const r = ov.getBoundingClientRect(); return [(ev.clientX - r.left) / scale, (ev.clientY - r.top) / scale]; };
    function hit(px, py) {
      for (let i = L.elements.length - 1; i >= 0; i--) {
        const e = L.elements[i]; if (e.hidden || e.type === 'deco') continue;
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2, a = -(e.rot || 0) * Math.PI / 180;
        const dx = px - cx, dy = py - cy, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
        if (Math.abs(lx) <= e.w / 2 && Math.abs(ly) <= e.h / 2) return e;
      }
      return null;
    }
    let drag = null;
    ov.addEventListener('pointerdown', ev => {
      ov.setPointerCapture(ev.pointerId);
      const [px, py] = toPage(ev), t = ev.target;
      const e = selEl();
      if (e && t.dataset.rot) { drag = { mode: 'rot', e, cx: e.x + e.w / 2, cy: e.y + e.h / 2 }; return; }
      if (e && t.dataset.sx) { drag = { mode: 'res', e, sx: +t.dataset.sx, sy: +t.dataset.sy, px, py, o: { ...e } }; return; }
      const h = hit(px, py);
      if (!h) { sel = null; panel = panel === 'print' ? 'print' : 'tools'; renderSide(); draw(); return; }
      if (sel !== h.id) { sel = h.id; panel = 'el'; renderSide(); }
      drag = h.locked ? null : { mode: 'move', e: h, px, py, o: { ...h } };
      draw();
    });
    ov.addEventListener('pointermove', ev => {
      if (!drag) return;
      const [px, py] = toPage(ev), e = drag.e, snap = 8 / scale;
      ov.querySelectorAll('.guide').forEach(n => n.remove());
      if (drag.mode === 'move') {
        let nx = drag.o.x + px - drag.px, ny = drag.o.y + py - drag.py;
        // an Seitenmitte und -rändern einrasten
        const gx = [[0, 0], [L.w / 2, e.w / 2], [L.w, e.w]], gy = [[0, 0], [L.h / 2, e.h / 2], [L.h, e.h]];
        for (const [g, off] of gx) for (const k of [0, e.w / 2, e.w]) if (Math.abs(nx + k - g) < snap && (k === off || g !== L.w / 2 || k === e.w / 2)) { nx = g - k; guide('v', g); }
        for (const [g] of gy) for (const k of [0, e.h / 2, e.h]) if (Math.abs(ny + k - g) < snap) { ny = g - k; guide('h', g); }
        e.x = Math.round(nx); e.y = Math.round(ny);
      } else if (drag.mode === 'res') {
        const a = -(e.rot || 0) * Math.PI / 180, dx = px - drag.px, dy = py - drag.py;
        const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
        let w = Math.max(20, drag.o.w + drag.sx * lx), h = Math.max(20, drag.o.h + drag.sy * ly);
        if (drag.sx && drag.sy && (ev.shiftKey || e.type === 'image')) { const r = drag.o.w / drag.o.h; if (w / h > r) h = w / r; else w = h * r; }
        const dw = w - drag.o.w, dh = h - drag.o.h, ra = (e.rot || 0) * Math.PI / 180;
        const cx = drag.sx * dw / 2, cy = drag.sy * dh / 2;
        const gx = cx * Math.cos(ra) - cy * Math.sin(ra), gy = cx * Math.sin(ra) + cy * Math.cos(ra);
        const ocx = drag.o.x + drag.o.w / 2 + gx, ocy = drag.o.y + drag.o.h / 2 + gy;
        e.w = Math.round(w); e.h = Math.round(h); e.x = Math.round(ocx - w / 2); e.y = Math.round(ocy - h / 2);
      } else if (drag.mode === 'rot') {
        let deg = Math.atan2(py - drag.cy, px - drag.cx) * 180 / Math.PI + 90;
        deg = ((Math.round(deg) % 360) + 360) % 360;
        for (const s of [0, 90, 180, 270, 360]) if (Math.abs(deg - s) < 4) deg = s % 360;
        e.rot = deg;
      }
      draw(); syncPos();
    });
    ov.addEventListener('pointerup', () => { if (drag) { drag = null; ov.querySelectorAll('.guide').forEach(n => n.remove()); commit(); } });
    function guide(dir, v) {
      const g = document.createElement('div'); g.className = 'guide';
      Object.assign(g.style, dir === 'v' ? { left: v * scale + 'px', top: 0, bottom: 0, width: '1px' } : { top: v * scale + 'px', left: 0, right: 0, height: '1px' });
      ov.appendChild(g);
    }
    function onKey(ev) {
      if (ev.target.matches('input,textarea,select')) return;
      const e = selEl(), mod = ev.metaKey || ev.ctrlKey;
      if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); jump(ev.shiftKey ? 1 : -1); return; }
      if (mod && ev.key.toLowerCase() === 'd') { ev.preventDefault(); duplicate(); return; }
      if (!e) return;
      if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); if (!e.locked) remove(); }
      if (ev.key === 'Escape') { sel = null; panel = 'tools'; renderSide(); draw(); }
      const st = ev.shiftKey ? 10 : 1, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[ev.key];
      if (mv && !e.locked) { ev.preventDefault(); e.x += mv[0]; e.y += mv[1]; draw(); syncPos(); clearTimeout(onKey.t); onKey.t = setTimeout(commit, 400); }
    }
    document.addEventListener('keydown', onKey);

    // ---------- Seitenleiste ----------
    function renderSide() {
      const e = selEl();
      if (panel === 'el' && !e) panel = 'tools';
      if (panel === 'tools') {
        side.innerHTML = `<div class="rail">
          <button class="tool" data-t="photo"><i>📷</i>Foto von der Fotobox</button>
          <button class="tool" data-t="image"><i>🖼</i>Bild</button>
          <button class="tool" data-t="text"><i>A</i>Text</button>
          <button class="tool" data-t="shape"><i>◼︎</i>Form</button>
          <button class="tool" data-t="layers"><i>☰</i>Ebenen</button>
          <button class="tool" data-t="print"><i>🖨</i>Drucken</button></div>`;
        return;
      }
      if (panel === 'print') { side.innerHTML = printPanel(); return; }
      if (panel === 'layers') { side.innerHTML = head('Ebenen', false) + `<div class="pb">${layersList()}</div>`; return; }
      const tabs = [['style', 'Stil'], ['pos', 'Position'], ['layers', 'Ebenen']].filter(t => !(e.type === 'deco' && t[0] === 'pos'));
      if (!tabs.some(t => t[0] === tab)) tab = tabs[0][0];
      side.innerHTML = head(e.type === 'photo' ? `Fotobox-Foto ${e.n}` : TYPE_NAME[e.type], true) +
        `<div class="tabs">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="pb">${tab === 'style' ? stylePanel(e) : tab === 'pos' ? posPanel(e) : layersList()}</div>`;
    }
    const head = (t, close) => `<div class="ph"><h3>${t}</h3><button class="x" data-a="closeside">×</button></div>`;
    function stylePanel(e) {
      if (e.type === 'photo') {
        const max = Math.max(8, FBR.photoCount(L));
        return `<label class="l">Foto Nummer</label><select data-p="n">${Array.from({ length: max }, (_, i) => `<option value="${i + 1}" ${e.n == i + 1 ? 'selected' : ''}>Foto ${i + 1}</option>`).join('')}</select>
          <div class="g2"><div><label class="l">Ecken-Radius</label><input type="number" min="0" data-p="radius" value="${e.radius || 0}"></div>
          <div><label class="l">Schatten</label><select data-p="shadow"><option value="">Aus</option><option value="1" ${e.shadow ? 'selected' : ''}>Ein</option></select></div></div>
          <div class="g2"><div><label class="l">Rahmenfarbe</label><input type="color" data-p="stroke" value="${e.stroke || '#ffffff'}"></div>
          <div><label class="l">Rahmen (px)</label><input type="number" min="0" data-p="strokeW" value="${e.strokeW || 0}"></div></div>
          <p style="font-size:12px;color:#888;margin-top:14px">Tipp: Mehrere Felder mit derselben Nummer zeigen dasselbe Foto.</p>`;
      }
      if (e.type === 'text') {
        return `<label class="l">Text</label><textarea rows="2" data-p="text">${esc(e.text)}</textarea>
          <div>${PH.map(p => `<span class="chip" data-ph="${p}">{${p}}</span>`).join('')}</div>
          <div class="g2"><div><label class="l">Schriftart</label><select data-p="font">${Object.entries(FBR.FONT_NAMES).map(([k, n]) => `<option value="${k}" ${e.font === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <div><label class="l">Größe</label><input type="text" data-p="size" value="${e.size || 'auto'}" placeholder="auto"></div></div>
          <div class="g2"><div><label class="l">Farbe</label><input type="color" data-p="color" value="${e.color || '#222222'}"></div>
          <div><label class="l">Stil</label><div class="row"><button class="bt ${e.weight >= 700 ? 'on' : ''}" data-tog="weight"><b>F</b></button><button class="bt ${e.italic ? 'on' : ''}" data-tog="italic"><i>K</i></button></div></div></div>
          <label class="l">Ausrichtung</label><div class="row">${[['left', '⟸ Links'], ['center', 'Mitte'], ['right', 'Rechts ⟹']].map(([k, n]) => `<button class="bt ${(e.align || 'center') === k ? 'on' : ''}" data-set="align" data-v="${k}" style="flex:1">${n}</button>`).join('')}</div>
          <label class="l">Deckkraft</label><input type="range" min="0" max="1" step=".05" data-p="opacity" value="${e.opacity ?? 1}" style="width:100%">`;
      }
      if (e.type === 'image') {
        return `<button class="bt" data-a="replace" style="width:100%;margin-top:6px">🔄 Bild ersetzen</button>
          <label class="l">Einpassen</label><select data-p="fit"><option value="stretch">Genau in den Rahmen</option><option value="cover" ${e.fit === 'cover' ? 'selected' : ''}>Füllen (zuschneiden)</option></select>
          <label class="l">Deckkraft</label><input type="range" min="0" max="1" step=".05" data-p="opacity" value="${e.opacity ?? 1}" style="width:100%">
          <p style="font-size:12px;color:#888;margin-top:14px">Eigene Designs als PNG mit transparenten Stellen über die Fotos legen (Ebene nach oben).</p>`;
      }
      if (e.type === 'shape') {
        return `<label class="l">Form</label><div class="row"><button class="bt ${e.shape !== 'ellipse' ? 'on' : ''}" data-set="shape" data-v="rect" style="flex:1">▭ Rechteck</button><button class="bt ${e.shape === 'ellipse' ? 'on' : ''}" data-set="shape" data-v="ellipse" style="flex:1">◯ Ellipse</button></div>
          <div class="g2"><div><label class="l">Füllung</label><input type="color" data-p="fill" value="${e.fill || '#ffffff'}"></div><div><label class="l">Ohne Füllung</label><select data-p="nofill"><option value="">Nein</option><option value="1" ${!e.fill ? 'selected' : ''}>Ja</option></select></div></div>
          <div class="g2"><div><label class="l">Rahmenfarbe</label><input type="color" data-p="stroke" value="${e.stroke || '#000000'}"></div><div><label class="l">Rahmen (px)</label><input type="number" min="0" data-p="strokeW" value="${e.strokeW || 0}"></div></div>
          <div class="g2"><div><label class="l">Ecken-Radius</label><input type="number" min="0" data-p="radius" value="${e.radius || 0}"></div><div><label class="l">Deckkraft</label><input type="range" min="0" max="1" step=".05" data-p="opacity" value="${e.opacity ?? 1}" style="width:100%;margin-top:8px"></div></div>`;
      }
      if (e.type === 'deco') {
        const t = FBR.templateById(e.tpl);
        return `<p>Verzierung der Vorlage <b>${t.name}</b> (${e.layer === 'over' ? 'über' : 'unter'} den Fotos).</p>
          <button class="bt" data-a="togglehide" style="width:100%">${e.hidden ? '👁 Einblenden' : '🚫 Ausblenden'}</button>
          <button class="bt" data-a="remove" style="width:100%;margin-top:8px">🗑 Entfernen</button>`;
      }
      return '';
    }
    function posPanel(e) {
      const B = (k, i, n) => `<button class="bt" data-align="${k}">${i} ${n}</button>`;
      return `<label class="l">An Seite ausrichten</label><div class="g2">${B('top', '⤒', 'Oben')}${B('left', '⇤', 'Links')}${B('middle', '↕', 'Mitte')}${B('center', '↔', 'Zentriert')}${B('bottom', '⤓', 'Unten')}${B('right', '⇥', 'Rechts')}</div>
        <label class="l">Anordnen</label><div class="g2"><button class="bt" data-move="1">⬆ Ebene höher</button><button class="bt" data-move="-1">⬇ Ebene tiefer</button>
        <button class="bt" data-move="top">⏫ Ganz nach vorne</button><button class="bt" data-move="bottom">⏬ Ganz nach hinten</button></div>
        <label class="l">Größe und Position (px)</label>
        <div class="g2"><div><label class="l">X</label><input type="number" data-p="x" value="${e.x}"></div><div><label class="l">Y</label><input type="number" data-p="y" value="${e.y}"></div>
        <div><label class="l">Breite</label><input type="number" data-p="w" value="${e.w}"></div><div><label class="l">Höhe</label><input type="number" data-p="h" value="${e.h}"></div>
        <div><label class="l">Drehung °</label><input type="number" data-p="rot" value="${e.rot || 0}"></div><div></div></div>
        <div class="g2" style="margin-top:12px"><button class="bt" data-a="dup">⧉ Duplizieren</button><button class="bt" data-a="remove">🗑 Löschen</button></div>`;
    }
    function syncPos() {
      const e = selEl(); if (!e || panel !== 'el' || tab !== 'pos') return;
      for (const k of ['x', 'y', 'w', 'h', 'rot']) { const i = side.querySelector(`[data-p="${k}"]`); if (i && document.activeElement !== i) i.value = Math.round(e[k] || 0); }
    }
    function layersList() {
      return [...L.elements].reverse().map(e => `<div class="lay ${e.id === sel ? 'on' : ''}" data-id="${e.id}">
        <span>${TYPE_ICON[e.type]}</span><span class="n">${e.type === 'photo' ? 'Fotobox-Foto ' + e.n : e.type === 'text' ? esc(FBR.fillText(e.text, opts.values)).slice(0, 26) : e.type === 'deco' ? 'Deko ' + FBR.templateById(e.tpl).name + (e.layer === 'over' ? ' (oben)' : ' (unten)') : TYPE_NAME[e.type]}</span>
        <button data-hide="${e.id}" title="${e.hidden ? 'einblenden' : 'ausblenden'}">${e.hidden ? '🚫' : '👁'}</button></div>`).join('') +
        `<p style="font-size:12px;color:#888">Oben in der Liste = vorne im Bild.</p>`;
    }
    function printPanel() {
      const opt = Object.entries(FBR.FORMATS).map(([k, f]) => `<option value="${k}" ${L.format === k ? 'selected' : ''}>${f.label}</option>`).join('');
      return head('Drucken', true) + `<div class="pb">
        <label class="l">Papierformat</label><select data-L="format">${opt}</select>
        <div class="g2"><div><label class="l">Breite</label><input type="number" value="${L.w}" disabled></div><div><label class="l">Höhe</label><input type="number" value="${L.h}" disabled></div></div>
        <label class="l">Hintergrundfarbe</label><input type="color" data-L="bg" value="${L.bg || '#ffffff'}">
        <label class="l">Optionen</label>
        <label class="row" style="margin:6px 0"><input type="checkbox" data-L="twoPerPage" ${L.twoPerPage ? 'checked' : ''} ${L.format === '2x6' ? '' : 'disabled'}> 2 pro Seite drucken (2×6 auf 4×6)</label>
        <label class="row" style="margin:6px 0"><input type="checkbox" data-L="secondary" ${L.secondary ? 'checked' : ''}> Auf dem Zweitdrucker drucken</label>
        <p style="font-size:12px;color:#888;margin-top:12px">Maße in Pixel bei 300 dpi. Beim Formatwechsel werden alle Elemente mit angepasst.</p></div>`;
    }

    // ---------- Eingaben in der Seitenleiste ----------
    side.addEventListener('click', async ev => {
      const t = ev.target.closest('button,.lay,.chip'); if (!t) return;
      const e = selEl();
      if (t.dataset.t) {
        const k = t.dataset.t;
        if (k === 'photo') addPhoto(); else if (k === 'text') addText(); else if (k === 'shape') addShape(); else if (k === 'image') addImage();
        else { panel = k; renderSide(); }
        return;
      }
      if (t.dataset.a === 'closeside') { sel = null; panel = 'tools'; renderSide(); draw(); return; }
      if (t.dataset.tab) { tab = t.dataset.tab; renderSide(); return; }
      if (t.dataset.hide) { const x = L.elements.find(z => z.id === t.dataset.hide); x.hidden = !x.hidden; commit(); renderSide(); draw(); ev.stopPropagation(); return; }
      if (t.classList.contains('lay')) { sel = t.dataset.id; panel = 'el'; tab = 'style'; renderSide(); draw(); return; }
      if (!e) return;
      if (t.dataset.ph) { const ta = side.querySelector('[data-p=text]'); ta.value += `{${t.dataset.ph}}`; e.text = ta.value; commit(); draw(); return; }
      if (t.dataset.align) return align(t.dataset.align);
      if (t.dataset.move) return move(isNaN(+t.dataset.move) ? t.dataset.move : +t.dataset.move);
      if (t.dataset.tog === 'weight') { e.weight = e.weight >= 700 ? 400 : 700; }
      else if (t.dataset.tog === 'italic') { e.italic = !e.italic; }
      else if (t.dataset.set) { e[t.dataset.set] = t.dataset.v; }
      else if (t.dataset.a === 'dup') return duplicate();
      else if (t.dataset.a === 'remove') return remove();
      else if (t.dataset.a === 'replace') return addImage(true);
      else if (t.dataset.a === 'togglehide') { e.hidden = !e.hidden; }
      else return;
      commit(); renderSide(); draw();
    });
    side.addEventListener('input', ev => {
      const t = ev.target, e = selEl();
      if (t.dataset.L) return;
      if (!e || !t.dataset.p) return;
      const k = t.dataset.p, num = ['x', 'y', 'w', 'h', 'rot', 'radius', 'strokeW', 'opacity', 'n'];
      if (k === 'nofill') { e.fill = t.value ? '' : (e._fill || '#ffffff'); }
      else if (k === 'fill') { e.fill = t.value; e._fill = t.value; }
      else if (k === 'shadow') e.shadow = !!t.value;
      else if (k === 'size') e.size = /^\d+$/.test(t.value.trim()) ? +t.value : 'auto';
      else e[k] = num.includes(k) ? +t.value : t.value;
      if (k === 'w' || k === 'h') e[k] = Math.max(10, e[k]);
      draw(); clearTimeout(side.t); side.t = setTimeout(commit, 350);
    });
    side.addEventListener('change', ev => {
      const t = ev.target; if (!t.dataset.L) return;
      const k = t.dataset.L;
      if (k === 'format') changeFormat(t.value);
      else if (k === 'bg') L.bg = t.value;
      else L[k] = t.checked;
      commit(); renderSide(); draw();
    });
    function changeFormat(f) {
      const F = FBR.FORMATS[f], sx = F.w / L.w, sy = F.h / L.h, s = Math.min(sx, sy);
      for (const e of L.elements) {
        if (e.type === 'deco') { e.w = F.w; e.h = F.h; continue; }
        const cx = (e.x + e.w / 2) * sx, cy = (e.y + e.h / 2) * sy;
        e.w = Math.round(e.w * (e.type === 'photo' ? sx : s)); e.h = Math.round(e.h * (e.type === 'photo' ? sy : s));
        e.x = Math.round(cx - e.w / 2); e.y = Math.round(cy - e.h / 2);
      }
      L.format = f; L.w = F.w; L.h = F.h; if (f !== '2x6') L.twoPerPage = false; else L.twoPerPage = true;
      $(root, '[data-a=fmt]').textContent = `${F.label} · ${F.w}×${F.h}px`; fit();
    }

    // ---------- Kopfzeile ----------
    root.querySelector('.top').addEventListener('click', ev => {
      const a = ev.target.dataset.a;
      if (a === 'undo') jump(-1); else if (a === 'redo') jump(1); else if (a === 'del') remove();
      else if (a === 'close' || a === 'done') close();
    });
    $(root, '[data-a=name]').addEventListener('input', ev => { L.name = ev.target.value; clearTimeout(side.n); side.n = setTimeout(commit, 500); });
    async function close() {
      clearTimeout(saveT);
      try { await opts.onSave?.(clone(L)); } catch {}
      document.removeEventListener('keydown', onKey);
      root.remove(); opts.onClose?.(clone(L));
    }
    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    $(root, '[data-a=fmt]').textContent = `${FBR.FORMATS[L.format]?.label || ''} · ${L.w}×${L.h}px`;
    FBR.preloadLayout(L).then(draw);
    renderSide(); fit(); draw();
    return { close };
  }

  // Aus einem hochgeladenen Design (PNG mit transparenten Stellen) automatisch Fotofelder erkennen
  async function layoutFromImage(file, uploadImage) {
    const local = URL.createObjectURL(file);
    const img = await FBR.loadImg(local);
    if (!img) throw new Error('Bild konnte nicht gelesen werden');
    const ar = img.naturalWidth / img.naturalHeight;
    const fmt = Object.entries(FBR.FORMATS).sort((a, b) => Math.abs(a[1].w / a[1].h - ar) - Math.abs(b[1].w / b[1].h - ar))[0][0];
    const F = FBR.FORMATS[fmt];
    // transparente Bereiche suchen (auf 120 px verkleinert)
    const S = 120 / Math.max(img.naturalWidth, img.naturalHeight), gw = Math.round(img.naturalWidth * S), gh = Math.round(img.naturalHeight * S);
    const c = document.createElement('canvas'); c.width = gw; c.height = gh;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, gw, gh);
    const d = x.getImageData(0, 0, gw, gh).data, seen = new Uint8Array(gw * gh), boxes = [];
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
    boxes.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const kx = F.w / gw, ky = F.h / gh;
    const src = uploadImage ? await uploadImage(file) : local;
    await FBR.loadImg(src);
    const els = (boxes.length ? boxes : [[gw * .05, gh * .05, gw * .9, gh * .7]]).slice(0, 8).map((b, i) => ({
      id: FBR.uid(), type: 'photo', n: i + 1, x: Math.round(b[0] * kx), y: Math.round(b[1] * ky), w: Math.round(b[2] * kx), h: Math.round(b[3] * ky), rot: 0, radius: 0 }));
    els.push({ id: FBR.uid(), type: 'image', src, fit: 'stretch', opacity: 1, x: 0, y: 0, w: F.w, h: F.h, rot: 0 });
    return { id: FBR.uid(), name: 'Eigenes Design', format: fmt, w: F.w, h: F.h, bg: '#ffffff', twoPerPage: fmt === '2x6', secondary: false, elements: els, found: boxes.length };
  }

  G.LayoutEditor = { open, layoutFromImage };
})(window);
