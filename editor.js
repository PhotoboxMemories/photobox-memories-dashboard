// FotoBox – Layout-Editor, Aufbau wie bei LumaBooth: links „Hinzufügen“ (und Layout- bzw. Video-Einstellungen), in der Mitte direkt
// auf der Seite verschieben, Größe ziehen, drehen; rechts „Ausgewähltes Objekt“ (X/Y/B/H, Seitenverhältnis, Drehen, Stil, Schlagschatten),
// Ausrichten, Ebene anheben/absenken und die Ebenen-Liste (Auge, Schloss, an ⋮⋮ ziehen = Reihenfolge).
// Benutzt FBR (render.js) für die exakte Vorschau. Gleiche Datei in der Fotobox und im Dashboard.
// LayoutEditor.open({ layout, values, onSave(layout), onClose(layout), uploadImage(file) → Promise<url>, questions }) – Vollbild
// LayoutEditor.mount({ stageEl, propsEl, dark, onSelect(el), onHistory(undo, redo), onStatus(text), onLayout(layout), … }) – eingebettet
//   (Bildschirm-Editor der Fotobox); gibt { add, undo, redo, reset, setOrient, load, update, orient, flush, destroy } zurück.
// Startbildschirm (layout.screen): video(orient) → {url,type}, uploadVideo(orient), removeVideo(orient); layoutFor(orient) → Gestaltung
// für Hoch-/Querformat (Umschalter); onReset(orient) → Promise<true, wenn verworfen>; sys = { gallery, vmsg, accent } → Galerie-Stapel und
// Videonachricht-Karte der Fotobox als verschiebbare Ebenen (FBR.screenSys).
(function (G) {
  'use strict';
  const P = ':is(#le,#leS,#leP)';
  const CSS = `
  ${P}{--bg:#f1f1f4;--pn:#fff;--fg:#1d1d24;--mu:#6b6b78;--ln:#e3e3ea;--in:#fff;--inl:#d9d9e2;--hi:#FFF3C4;--hit:#8a6400;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--fg)}
  ${P}.dark{--bg:#232326;--pn:#2b2b2f;--fg:#f2f2f2;--mu:#a9a9b0;--ln:#3d3d44;--in:#1c1c1f;--inl:#5a5a62;--hi:rgba(249,203,56,.16);--hit:#F9CB38}
  ${P} *{box-sizing:border-box}
  #le{position:fixed;inset:0;z-index:100;background:var(--bg);display:flex;flex-direction:column}
  #le .top{height:56px;flex:none;background:#1D1D1B;color:#fff;display:flex;align-items:center;gap:10px;padding:0 14px}
  #le .top input{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:6px 10px;font:inherit;width:220px}
  #le .tb{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);color:#fff;border-radius:8px;padding:7px 12px;cursor:pointer;font:inherit;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
  #le .tb:hover{background:rgba(255,255,255,.22)} #le .tb:disabled{opacity:.35;cursor:default}
  #le .tb.pri{background:#F7C838;border-color:#F7C838;color:#1D1D1B;font-weight:700}
  #le .seg{display:inline-flex;border:1px solid rgba(255,255,255,.25);border-radius:8px;overflow:hidden}
  #le .seg button{background:none;border:0;color:#fff;padding:7px 11px;cursor:pointer;font:inherit;font-size:13px}
  #le .seg button.on{background:#F7C838;color:#1D1D1B;font-weight:700}
  #le .sp{flex:1} #le .st{font-size:12px;opacity:.7;white-space:nowrap}
  #le .body{flex:1;display:flex;min-height:0}
  #le .side{width:250px;flex:none;background:var(--pn);border-right:1px solid var(--ln);overflow:auto}
  #le .props{width:310px;flex:none;background:var(--pn);border-left:1px solid var(--ln);overflow:auto}
  #le .props .nar{display:none}
  ${P} .ico-svg{vertical-align:-3px}
  ${P} .sec{padding:12px 16px 14px;border-bottom:1px solid var(--ln)}
  #leP .sec{padding:10px 0 14px}
  ${P} .sec>h4{margin:0 0 8px;padding:0;border:0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--mu);display:flex;align-items:center;justify-content:space-between;gap:8px}
  ${P} .sec>h4.big{font-size:16px;text-transform:none;letter-spacing:0;color:var(--fg)}
  ${P} .sec>h4.big>span{display:flex;align-items:center;gap:6px;min-width:0}
  ${P} .x{background:none;border:0;font-size:22px;line-height:1;cursor:pointer;color:var(--mu);padding:0 2px}
  ${P} .add{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 4px}
  ${P} .tool{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;background:none;border:0;font:inherit;color:var(--fg);font-size:11.5px;line-height:1.2;padding:2px 0;text-align:center}
  ${P} .tool i{width:42px;height:42px;border-radius:50%;background:#F7C838;color:#1D1D1B;display:flex;align-items:center;justify-content:center;font-style:normal;box-shadow:0 4px 12px rgba(247,200,56,.4);transition:transform .12s}
  ${P} .tool:hover i{transform:scale(1.07)}
  ${P} label.l{display:block;font-size:11.5px;color:var(--mu);margin:9px 0 4px;text-transform:none;letter-spacing:0}
  ${P} .g2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  ${P} .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  ${P} .g6{display:grid;grid-template-columns:repeat(6,1fr);gap:5px}
  ${P} input[type=text],${P} input[type=number],${P} select,${P} textarea{width:100%;border:1px solid var(--inl);border-radius:8px;padding:6px 8px;font:inherit;font-size:13.5px;background:var(--in);color:var(--fg);margin:0}
  ${P} input[type=color]{width:100%;height:32px;border:1px solid var(--inl);border-radius:8px;padding:2px;background:var(--in);margin:0}
  ${P} input[type=range]{width:100%;accent-color:#F7C838;margin:6px 0 0}
  #le input[type=checkbox]{width:18px;height:18px;accent-color:#F7C838;margin:0;flex:none} /* eingebettet: Schalter-Stil der Fotobox */
  ${P} .bt{border:1px solid var(--inl);background:var(--in);color:var(--fg);border-radius:8px;padding:6px 8px;cursor:pointer;font:inherit;font-size:13px;display:flex;align-items:center;gap:6px;justify-content:center;min-height:32px}
  ${P} .bt:hover{border-color:#F7C838} ${P} .bt.on{background:var(--hi);border-color:#F7C838;color:var(--hit)} ${P} .bt:disabled{opacity:.4;cursor:default;border-color:var(--inl)}
  ${P} .chip{display:inline-block;border:1px solid var(--inl);border-radius:999px;padding:2px 9px;margin:4px 4px 0 0;font-size:12px;cursor:pointer;background:var(--in);color:var(--fg)}
  ${P} .chip:hover{border-color:#F7C838}
  ${P} .row{display:flex;gap:8px;align-items:center}
  ${P} .chk{display:flex;align-items:center;gap:8px;margin:8px 0;cursor:pointer;font-size:13.5px}
  ${P} .chk.sw{justify-content:space-between;font-weight:600}
  ${P} .muted{font-size:12px;color:var(--mu);margin:8px 0 0;line-height:1.4}
  ${P} .note{font-size:12px;color:var(--hit);background:var(--hi);border-radius:8px;padding:6px 8px;margin:0 0 8px;display:flex;gap:6px;align-items:center}
  ${P} .xy{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px}
  ${P} .xy label,${P} .rot{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--mu);margin:0}
  ${P} .xy label b{width:12px;font-weight:700;color:var(--fg)}
  ${P} .rot{flex:none;width:92px} ${P} .rot input{min-width:0}
  ${P} .lay{display:flex;align-items:center;gap:6px;border:1px solid var(--ln);border-radius:8px;padding:4px 6px;margin-bottom:5px;cursor:pointer;background:var(--in);user-select:none;color:var(--fg)}
  ${P} .lay.on{border-color:#F7C838;background:var(--hi)}
  ${P} .lay.off .n{opacity:.45}
  ${P} .lay .n{flex:1;font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  ${P} .lay button{background:none;border:0;cursor:pointer;padding:4px;color:var(--mu);display:flex;border-radius:6px}
  ${P} .lay button:hover{background:rgba(127,127,127,.15)} ${P} .lay button.act{color:var(--hit)}
  ${P} .lay .grip{cursor:grab;color:var(--mu);touch-action:none;display:flex;padding:3px 0}
  ${P} .lay.drag{position:relative;z-index:2;opacity:.85;box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:grabbing}
  ${P} .lay.tgt{box-shadow:0 -3px 0 #F7C838}
  ${P} .lay.tgtE{box-shadow:0 3px 0 #F7C838}
  ${P} .themes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
  ${P} .themes button{border:2px solid transparent;border-radius:9px;padding:0;background:none;cursor:pointer;font:inherit;font-size:10.5px;line-height:1.15;color:var(--fg);text-align:center;min-width:0;overflow-wrap:anywhere;hyphens:auto}
  ${P} .themes button i{display:block;aspect-ratio:9/13;border-radius:7px;margin-bottom:3px;border:1px solid var(--ln)} ${P} .themes button.on{border-color:#F7C838}
  ${P} .stage{flex:1;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;min-width:0}
  #leS,#leS .stage{width:100%;height:100%}
  ${P} .page{position:relative;box-shadow:0 10px 40px rgba(0,0,0,.18);background:#fff;flex:none}
  #leS .page{box-shadow:none;background:#111}
  ${P} .page canvas{display:block;width:100%;height:100%}
  ${P} .ov{position:absolute;inset:0;touch-action:none;cursor:default}
  ${P} .sel{position:absolute;border:2px solid #1976d2;pointer-events:none;transform-origin:center}
  ${P} .sel.lk{border-style:dashed;border-color:#9a9aa0}
  ${P} .h{position:absolute;width:13px;height:13px;border-radius:50%;background:#1976d2;border:2px solid #fff;pointer-events:auto;margin:-6.5px 0 0 -6.5px}
  ${P} .h.r{background:#fff;border-color:#1976d2;cursor:grab}
  ${P} .guide{position:absolute;background:#F7C838;pointer-events:none}
  #le .hint{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:12px;color:#888;white-space:nowrap}
  /* Handy: Leinwand oben, darunter „Ausgewähltes Objekt“/Ebenen, ganz unten die Werkzeuge zum Wischen */
  @media(max-width:820px){
    #le .top{height:52px;padding:0 8px;gap:6px}
    #le .top .st,#le .top .lb{display:none}
    #le .top .tb{padding:7px 9px}
    #le .top input{width:auto;flex:1;min-width:60px}
    #le .seg button{padding:6px 8px}
    #le .body{flex-direction:column}
    #le .stage{flex:1;min-height:0}
    #le .props{width:100%;max-height:40%;border-left:0;border-top:1px solid var(--ln);order:2}
    #le .props .nar{display:block}
    #le .side{width:100%;border-right:0;border-top:1px solid var(--ln);order:3;overflow-x:auto;overflow-y:hidden}
    #le .side .sec{border:0;padding:8px 10px}
    #le .side .sec:not(.addsec){display:none}
    #le .side .sec>h4{display:none}
    #le .side .add{display:flex;gap:12px}
    #le .side .tool{flex:none;min-width:62px}
    #le .hint{display:none}
    ${P} .h{width:22px;height:22px;margin:-11px 0 0 -11px}
  }
  `;
  const $ = (r, s) => r.querySelector(s);
  const clone = o => JSON.parse(JSON.stringify(o));
  const tr = s => (G.I18N_UI ? G.I18N_UI(s) : s);
  const PH = ['titel', 'untertitel', 'datum', 'uhrzeit', 'event', 'name'];
  const TYPE_NAME = { photo: 'Fotobox-Foto', image: 'Bild', text: 'Text', shape: 'Form', deco: 'Vorlagen-Deko', button: 'Schaltfläche „Foto“', signature: 'Unterschrift', answer: 'Umfrage-Antwort', gallery: 'Galerie-Stapel', vmsg: 'Videonachricht (QR-Code)' };
  const TYPE_ICON = { photo: 'camera', image: 'image', text: 'type', shape: 'shapes', deco: 'sparkles', button: 'camera', signature: 'pen', answer: 'clipboard', gallery: 'gallery', vmsg: 'qr' };
  const FIXED = new Set(['button', 'gallery', 'vmsg']); // gibt es genau einmal: ausblenden statt löschen, nicht duplizieren
  const SHADOW = new Set(['photo', 'image', 'text', 'shape']);

  function css() { if (!document.getElementById('le-css')) { const st = document.createElement('style'); st.id = 'le-css'; st.textContent = CSS; document.head.appendChild(st); } }
  const open = opts => core(opts, false);
  const mount = opts => core(opts, true);

  function core(opts, inline) {
    css();
    let L = null, sel = null, hist = [], hi = 0, scale = 1, lastSaved = '', dirty = false;
    let root = null, side = null, stage, page, cv, ov, props;
    if (inline) {
      opts.stageEl.innerHTML = `<div id="leS" class="${opts.dark ? 'dark' : ''}"><div class="stage"><div class="page"><canvas></canvas><div class="ov"></div></div></div></div>`;
      opts.propsEl.innerHTML = `<div id="leP" class="${opts.dark ? 'dark' : ''}"><div class="props"></div></div>`;
      stage = $(opts.stageEl, '.stage'); props = $(opts.propsEl, '.props');
    } else {
      root = document.createElement('div'); root.id = 'le';
      root.innerHTML = `
        <div class="top">
          <button class="tb" data-a="close">${ICON('chevronLeft', 15)} <span class="lb">Zurück</span></button>
          <input data-a="name" title="Name des Layouts">
          <span class="st" data-a="fmt"></span>
          ${opts.layoutFor ? `<span class="seg" data-a="seg"><button data-o="portrait">Hochformat</button><button data-o="landscape">Querformat</button></span>` : ''}
          <span class="sp"></span>
          <span class="st" data-a="status"></span>
          <button class="tb" data-a="undo" title="Rückgängig (⌘Z)">${ICON('undo', 16)}</button>
          <button class="tb" data-a="redo" title="Wiederholen (⇧⌘Z)">${ICON('redo', 16)}</button>
          ${opts.onReset ? `<button class="tb" data-a="reset" title="Gestaltung verwerfen">${ICON('refresh', 15)} <span class="lb">Zurücksetzen</span></button>` : ''}
          <button class="tb pri" data-a="done">${ICON('check', 16)} <span class="lb">Fertig</span></button>
        </div>
        <div class="body">
          <div class="side"></div>
          <div class="stage"><div class="page"><canvas></canvas><div class="ov"></div></div>
            <div class="hint">Ziehen = verschieben · Punkte = Größe · ⟳ = drehen · Entf = löschen · Pfeiltasten = fein verschieben</div></div>
          <div class="props"></div>
        </div>`;
      document.body.appendChild(root);
      side = $(root, '.side'); stage = $(root, '.stage'); props = $(root, '.props');
    }
    page = $(stage, '.page'); cv = $(stage, 'canvas'); ov = $(stage, '.ov');
    const q = s => root ? $(root, s) : null;
    const setStatus = t => { const n = q('[data-a=status]'); if (n) n.textContent = t; opts.onStatus?.(t); };

    // ---------- Laden ----------
    // Startbildschirm: Galerie-Stapel und Videonachricht-Karte als Ebenen dazu (unverändert werden sie nicht gespeichert)
    function prep(lay) { const x = clone(lay); delete x.adapted; return x.screen && FBR.screenSys ? FBR.screenSys(x, opts.sys || {}) : x; }
    const out = () => { const c = clone(L); return c.screen && FBR.screenStrip ? FBR.screenStrip(c) : c; };
    function load(lay) {
      L = prep(lay); sel = null; hist = [JSON.stringify(L)]; hi = 0; lastSaved = JSON.stringify(out()); dirty = false;
      const nm = q('[data-a=name]'); if (nm) { nm.value = L.name || ''; nm.style.display = L.screen ? 'none' : ''; }
      root?.querySelectorAll('[data-a=seg] button').forEach(b => b.classList.toggle('on', b.dataset.o === L.orient));
      fmtLabel(); updUndo(); renderSide(); renderProps(); fit(); draw();
      FBR.preloadLayout(L).then(draw);
      opts.onLayout?.(L); opts.onSelect?.(null);
    }

    // ---------- Zeichnen ----------
    let raf = 0;
    const vmsgOn = () => !!(L.screen && opts.sys && opts.sys.vmsg);
    const listed = e => !(e.type === 'vmsg' && !vmsgOn()); // Videonachricht ausgeschaltet: Karte unsichtbar und nicht in den Ebenen
    function draw() {
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0; if (!L) return;
        FBR.renderLayout(L, { values: opts.values, placeholders: true, vmsg: vmsgOn() ? { accent: opts.sys.accent, ...opts.sys.vmsg } : null }, cv); drawSel();
      });
    }
    function fit() {
      if (!L) return;
      const r = stage.getBoundingClientRect(); if (!r.width || !r.height) return;
      const m = inline ? 0 : r.width < 600 ? 24 : 60; // auf dem Handy weniger Rand, damit die Leinwand möglichst groß ist
      scale = Math.min((r.width - m) / L.w, (r.height - m - (inline ? 0 : 10)) / L.h);
      page.style.width = L.w * scale + 'px'; page.style.height = L.h * scale + 'px';
      drawSel();
    }
    const ro = new ResizeObserver(fit); ro.observe(stage);
    function drawSel() {
      ov.querySelectorAll('.sel,.guide').forEach(n => n.remove());
      const e = selEl();
      if (!e || e.hidden || e.type === 'deco') return;
      const b = document.createElement('div'); b.className = 'sel' + (e.locked ? ' lk' : '');
      Object.assign(b.style, { left: e.x * scale + 'px', top: e.y * scale + 'px', width: e.w * scale + 'px', height: e.h * scale + 'px', transform: `rotate(${e.rot || 0}deg)` });
      if (!e.locked) {
        const pts = keepRatio(e) ? [[-1, -1], [1, -1], [1, 1], [-1, 1]] : [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
        pts.forEach(([sx, sy]) => {
          const h = document.createElement('div'); h.className = 'h'; h.dataset.sx = sx; h.dataset.sy = sy;
          Object.assign(h.style, { left: (sx + 1) * 50 + '%', top: (sy + 1) * 50 + '%', cursor: sx && sy ? (sx === sy ? 'nwse-resize' : 'nesw-resize') : sx ? 'ew-resize' : 'ns-resize' });
          b.appendChild(h);
        });
        const r = document.createElement('div'); r.className = 'h r'; r.dataset.rot = 1; r.title = 'Drehen';
        Object.assign(r.style, { left: '50%', top: '-22px' }); b.appendChild(r);
      }
      ov.appendChild(b);
    }

    // ---------- Verlauf und Speichern ----------
    function commit() {
      const s = JSON.stringify(L);
      if (s === hist[hi]) return;
      hist.splice(hi + 1); hist.push(s); if (hist.length > 80) hist.shift(); hi = hist.length - 1;
      updUndo(); autosave();
    }
    function updUndo() {
      const u = hi > 0, r = hi < hist.length - 1;
      const a = q('[data-a=undo]'), b = q('[data-a=redo]'); if (a) a.disabled = !u; if (b) b.disabled = !r;
      opts.onHistory?.(u, r);
    }
    function jump(d) { const n = hi + d; if (n < 0 || n >= hist.length) return; hi = n; L = JSON.parse(hist[hi]); if (!L.elements.some(e => e.id === sel)) sel = null; updUndo(); renderSide(); renderProps(); fit(); draw(); autosave(); }
    let saveT = 0;
    async function save() {
      clearTimeout(saveT); dirty = false;
      const o = out(), s = JSON.stringify(o); if (s === lastSaved) { setStatus('✓ Gespeichert'); return; }
      try { await opts.onSave?.(o); lastSaved = s; setStatus('✓ Gespeichert'); } catch (e) { setStatus('⚠️ ' + e.message); }
    }
    function autosave() { setStatus('Speichert …'); dirty = true; clearTimeout(saveT); saveT = setTimeout(save, 600); }
    async function flush() { if (dirty) await save(); }

    // ---------- Elemente ----------
    const selEl = () => L && L.elements.find(x => x.id === sel);
    const keepRatio = e => e.type === 'gallery' || e.type === 'vmsg' || (e.ratio ?? e.type === 'image');
    const center = (w, h) => ({ x: Math.round((L.w - w) / 2), y: Math.round((L.h - h) / 2) });
    function select(id) { sel = id; renderProps(true); draw(); opts.onSelect?.(selEl() || null); }
    function add(e) {
      e.id = FBR.uid(); e.rot = e.rot || 0;
      // unter die Deko „über den Fotos“ und unter die festen Schaltflächen der Fotobox (Galerie, Videonachricht)
      const i = L.elements.findIndex(x => (x.type === 'deco' && x.layer === 'over') || SYS(x));
      if (i >= 0) L.elements.splice(i, 0, e); else L.elements.push(e);
      sel = e.id; commit(); renderProps(true); draw(); opts.onSelect?.(e);
    }
    function addPhoto() {
      const n = FBR.photoCount(L) + 1, w = Math.round(L.w * .6), h = Math.round(w * 2 / 3);
      add({ type: 'photo', n, ...center(w, h), w, h, radius: 0, stroke: '', strokeW: 0 });
    }
    function addText() {
      const w = Math.round(L.w * .7), h = Math.round(Math.min(L.w, L.h) * .09);
      add({ type: 'text', text: 'Dein Text', font: 'modern', size: 'auto', color: L.screen ? (L.elements.find(x => x.type === 'text')?.color || '#ffffff') : '#222222', weight: 700, align: 'center', ...center(w, h), w, h });
    }
    function addSignature() { const w = Math.round(L.w * .5), h = Math.round(w * .32); add({ type: 'signature', color: '#000000', x: Math.round((L.w - w) / 2), y: Math.round(L.h - h * 1.6), w, h }); }
    function addAnswer() {
      const n = Math.max(0, ...L.elements.filter(x => x.type === 'answer').map(x => x.q || 1)) + 1, w = Math.round(L.w * .7), h = Math.round(Math.min(L.w, L.h) * .07);
      add({ type: 'answer', q: n, font: 'arial', size: 'auto', color: '#000000', weight: 400, align: 'center', ...center(w, h), w, h });
    }
    function addShape() { const w = Math.round(L.w * .4), h = Math.round(L.h * .12); add({ type: 'shape', shape: 'rect', fill: '#F7C838', stroke: '', strokeW: 0, radius: 0, opacity: 1, ...center(w, h), w, h }); }
    function pickFile(accept) {
      return new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => res(i.files[0] || null); i.click(); });
    }
    async function addImage(replace) {
      const f = await pickFile('image/*'); if (!f) return;
      const local = URL.createObjectURL(f);
      const img = await FBR.loadImg(local);
      let src = local;
      setStatus('Lädt Bild hoch …');
      try { if (opts.uploadImage) src = await opts.uploadImage(f); await FBR.loadImg(src); }
      catch (e) { alert(tr('Bild konnte nicht hochgeladen werden:') + ' ' + e.message); setStatus(''); return; }
      setStatus('');
      if (replace) { const e = selEl(); if (!e) return; e.src = src; commit(); draw(); renderProps(); return; }
      const ar = img ? img.naturalWidth / img.naturalHeight : 1;
      let w = Math.round(L.w * .5), h = Math.round(w / ar);
      if (h > L.h * .6) { h = Math.round(L.h * .6); w = Math.round(h * ar); }
      add({ type: 'image', src, fit: 'stretch', opacity: 1, ...center(w, h), w, h });
    }
    function addKind(k) {
      if (k === 'photo') addPhoto(); else if (k === 'signature') addSignature(); else if (k === 'answer') addAnswer();
      else if (k === 'text') addText(); else if (k === 'shape') addShape(); else if (k === 'image') addImage();
    }
    function remove() {
      const e = selEl(); if (!e || e.locked) return;
      if (FIXED.has(e.type)) e.hidden = true; else L.elements = L.elements.filter(x => x.id !== sel);
      sel = null; commit(); renderProps(true); draw(); opts.onSelect?.(null);
    }
    function duplicate() {
      const e = selEl(); if (!e || FIXED.has(e.type) || e.type === 'deco') return;
      const c = clone(e); c.id = FBR.uid(); c.x += 30; c.y += 30; delete c.locked;
      L.elements.splice(L.elements.indexOf(e) + 1, 0, c); sel = c.id; commit(); renderProps(true); draw();
    }
    // Galerie-Stapel und Videonachricht-Karte liegen an der Fotobox immer über dem Startbildschirm – im Editor deshalb immer ganz vorne
    const SYS = e => e.type === 'gallery' || e.type === 'vmsg';
    const pinSys = () => { L.elements = [...L.elements.filter(e => !SYS(e)), ...L.elements.filter(SYS)]; };
    function move(dir) { // Ebene: +1 nach vorne, -1 nach hinten, 'top', 'bottom'
      const e = selEl(); if (!e) return;
      const a = L.elements, i = a.indexOf(e); a.splice(i, 1);
      const j = dir === 'top' ? a.length : dir === 'bottom' ? 0 : Math.max(0, Math.min(a.length, i + dir));
      a.splice(j, 0, e); pinSys(); commit(); renderProps(); draw();
    }
    function align(k) {
      const e = selEl(); if (!e || e.locked) return;
      if (k === 'top') e.y = 0; if (k === 'middle') e.y = Math.round((L.h - e.h) / 2); if (k === 'bottom') e.y = L.h - e.h;
      if (k === 'left') e.x = 0; if (k === 'center') e.x = Math.round((L.w - e.w) / 2); if (k === 'right') e.x = L.w - e.w;
      commit(); syncPos(); draw();
    }
    // Themenfarben: Primärfarbe = Start-Schaltfläche, Text = alle Texte, Hintergrund = einfarbig
    function themeColor(k, v) {
      if (k === 'btn') L.elements.forEach(e => { if (e.type === 'button') e.fill = v; });
      if (k === 'text') L.elements.forEach(e => { if (e.type === 'text' || e.type === 'button') e.color = v; });
      if (k === 'bg') { L.bg = v; L.bgGrad = null; L.theme = ''; }
    }

    // ---------- Maus / Touch auf der Seite ----------
    const toPage = ev => { const r = ov.getBoundingClientRect(); return [(ev.clientX - r.left) / scale, (ev.clientY - r.top) / scale]; };
    function hit(px, py) { // gesperrte Ebenen lassen sich nur über die Ebenen-Liste wählen
      for (let i = L.elements.length - 1; i >= 0; i--) {
        const e = L.elements[i]; if (e.hidden || e.locked || e.type === 'deco' || !listed(e)) continue;
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2, a = -(e.rot || 0) * Math.PI / 180;
        const dx = px - cx, dy = py - cy, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
        if (Math.abs(lx) <= e.w / 2 && Math.abs(ly) <= e.h / 2) return e;
      }
      return null;
    }
    let drag = null;
    ov.addEventListener('pointerdown', ev => {
      if (!L) return;
      ov.setPointerCapture(ev.pointerId);
      const [px, py] = toPage(ev), t = ev.target, e = selEl();
      if (e && !e.locked && t.dataset.rot) { drag = { mode: 'rot', e, cx: e.x + e.w / 2, cy: e.y + e.h / 2 }; return; }
      if (e && !e.locked && t.dataset.sx) { drag = { mode: 'res', e, sx: +t.dataset.sx, sy: +t.dataset.sy, px, py, o: { ...e } }; return; }
      const h = hit(px, py);
      if (!h) { if (sel) select(null); return; }
      if (sel !== h.id) select(h.id);
      drag = { mode: 'move', e: h, px, py, o: { ...h } };
    });
    ov.addEventListener('dblclick', () => { const i = props.querySelector('[data-p=text]'); if (i) { i.focus(); i.select?.(); } });
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
        if (drag.sx && drag.sy && (ev.shiftKey || keepRatio(e))) { const r = drag.o.w / drag.o.h; if (w / h > r) h = w / r; else w = h * r; }
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
    const endDrag = () => { if (drag) { drag = null; ov.querySelectorAll('.guide').forEach(n => n.remove()); commit(); } };
    ov.addEventListener('pointerup', endDrag); ov.addEventListener('pointercancel', endDrag);
    function guide(dir, v) {
      const g = document.createElement('div'); g.className = 'guide';
      Object.assign(g.style, dir === 'v' ? { left: v * scale + 'px', top: 0, bottom: 0, width: '1px' } : { top: v * scale + 'px', left: 0, right: 0, height: '1px' });
      ov.appendChild(g);
    }
    function onKey(ev) {
      if (!L || ev.target.matches('input,textarea,select,[contenteditable]')) return;
      if (inline && !stage.offsetParent) return; // eingebettet: nur, solange der Editor zu sehen ist
      const e = selEl(), mod = ev.metaKey || ev.ctrlKey;
      if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); jump(ev.shiftKey ? 1 : -1); return; }
      if (mod && ev.key.toLowerCase() === 'y') { ev.preventDefault(); jump(1); return; }
      if (mod && ev.key.toLowerCase() === 'd') { ev.preventDefault(); duplicate(); return; }
      if (!e) return;
      if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); remove(); }
      if (ev.key === 'Escape') select(null);
      const st = ev.shiftKey ? 10 : 1, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[ev.key];
      if (mv && !e.locked) { ev.preventDefault(); e.x += mv[0]; e.y += mv[1]; draw(); syncPos(); clearTimeout(onKey.t); onKey.t = setTimeout(commit, 400); }
    }
    document.addEventListener('keydown', onKey);

    // ---------- Linke Spalte: Hinzufügen + Layout (Fotolayout) bzw. Startbildschirm-Video ----------
    function renderSide() {
      if (!side || !L) return;
      const T = (k, ic, n) => `<button class="tool" data-t="${k}"><i>${ICON(ic)}</i>${n}</button>`;
      const tools = L.screen ? T('text', 'type', 'Text') + T('image', 'image', 'Bild') + T('shape', 'shapes', 'Form')
        : T('photo', 'camera', 'Foto von der Fotobox') + T('image', 'image', 'Bild') + T('text', 'type', 'Text') + T('signature', 'pen', 'Unterschrift') + T('answer', 'clipboard', 'Umfrage-Antwort') + T('shape', 'shapes', 'Form');
      side.innerHTML = `<div class="sec addsec"><h4>Hinzufügen</h4><div class="add">${tools}</div></div>` + sideSecs();
    }
    const sideSecs = () => L.screen ? (opts.video ? videoSec() : '') : printSec();
    function videoSec() {
      const v = opts.video?.(L.orient) || {};
      return `<div class="sec"><h4>Startbildschirm-Video</h4>
        <p class="muted" style="margin-top:0">Das Video läuft als Startbildschirm und wird wiederholt. Ein Tipp auf das Video startet direkt die Aufnahme.</p>
        ${v.url ? `<div class="row" style="margin:10px 0"><span style="flex:1">${ICON(v.type === 'video' ? 'video' : 'image', 16)} ${v.type === 'video' ? 'Video' : 'Bild'} hinterlegt</span><button class="bt" data-a="delvideo">${ICON('trash', 14)} Entfernen</button></div>` : ''}
        <button class="bt" data-a="upvideo" style="width:100%;margin-top:8px">${ICON('upload', 15)} Video zum Hochladen auswählen</button>
        <p class="muted">Nur MP4-Dateien · max. 50 MB · empfohlen ${L.orient === 'landscape' ? '1463 × 914' : '914 × 1463'} px</p></div>`;
    }
    // Layout-Bereich wie bei LumaBooth: Papierformat (klein → groß), Ausrichtung, 2 pro Seite, Zweitdrucker, Maße
    function printSec() {
      const F = FBR.FORMATS[L.format] || {}, inch = n => String(n).replace('.', ',');
      const opt = FBR.SIZE_LIST.map(s => `<option value="${s.size}" ${F.size === s.size ? 'selected' : ''}>${s.label}${s.square && !/Quadrat/.test(s.label) ? ' (quadratisch)' : ''}</option>`).join('');
      const sheet = FBR.sheetOf({ ...L, twoPerPage: true }), sIn = [sheet.w / 300, sheet.h / 300].sort((a, b) => a - b).map(inch).join('×');
      return `<div class="sec"><h4>Layout</h4>
        <label class="l">Papierformat</label><select data-L="paperSize">${opt}</select>
        <label class="l">Ausrichtung</label><select data-L="paperOrient" ${F.orient ? '' : 'disabled'}>
          <option value="p" ${F.orient !== 'l' ? 'selected' : ''}>Hochformat</option><option value="l" ${F.orient === 'l' ? 'selected' : ''}>Querformat</option></select>
        <div class="g2"><div><label class="l">Breite</label><input type="text" value="${inch(F.in?.[0] ?? L.w / 300)} in · ${L.w} px" disabled></div><div><label class="l">Höhe</label><input type="text" value="${inch(F.in?.[1] ?? L.h / 300)} in · ${L.h} px" disabled></div></div>
        <label class="l">Auflösung</label><input type="text" value="300 dpi" disabled>
        <label class="l">Hintergrundfarbe</label><input type="color" data-L="bg" value="${L.bg || '#ffffff'}">
        <label class="chk"><input type="checkbox" data-L="twoPerPage" ${L.twoPerPage ? 'checked' : ''} ${F.pair === false ? 'disabled' : ''}> 2 pro Seite drucken${F.pair === false ? ' (bei Panoramen nicht möglich)' : ` (2 × ${(FBR.SIZE_LIST.find(s => s.size === F.size)?.label || '').replace(' Streifen', '')} auf ${sIn})`}</label>
        <label class="chk"><input type="checkbox" data-L="secondary" ${L.secondary ? 'checked' : ''}> Auf dem Zweitdrucker drucken</label>
        <p class="muted">Wähle dasselbe Papierformat wie im Druckertreiber („Druckeinstellungen“ → „Drucker konfigurieren“), dann wird randlos gedruckt. Beim Formatwechsel werden alle Elemente mit angepasst.</p></div>`;
    }

    // ---------- Rechte Spalte: Ausgewähltes Objekt bzw. Themenfarben, darunter immer die Ebenen ----------
    let propsFor = null;
    function renderProps(top) {
      if (!L) return;
      const e = selEl(), st = props.scrollTop;
      const lays = `<div class="sec"><h4><span>${ICON('layers', 14)} Ebenen</span></h4><div class="lays">${layersList()}</div><p class="muted">Oben in der Liste = vorne. Zum Sortieren an den Punkten ziehen.</p></div>`;
      props.innerHTML = e ? selPanel(e) + lays : nonePanel(lays);
      props.scrollTop = top || propsFor !== sel ? 0 : st;
      if (inline && top && propsFor !== sel && props.getBoundingClientRect().top < 0) props.scrollIntoView({ block: 'start', behavior: 'smooth' });
      propsFor = sel;
    }
    function nonePanel(lays) { // Reihenfolge: Hinweis, Themenfarben, Ebenen, Thema und Hintergrund (Ebenen ohne langes Scrollen)
      const [colors, rest] = L.screen ? themeSecs() : ['', ''];
      return `<div class="sec"><p class="muted" style="margin:0">${L.screen ? 'Tippe auf ein Element, um es zu bearbeiten – oder ziehe es direkt an eine neue Stelle.' : 'Klicke ein Element an, um es zu bearbeiten.'}</p></div>`
        + colors + lays + rest + (inline ? '' : `<div class="nar">${sideSecs()}</div>`); // Handy: Layout bzw. Video hier, links stehen dort nur die Werkzeuge
    }
    const hex = (v, d) => /^#[0-9a-f]{6}$/i.test(v || '') ? v : d;
    function themeSecs() {
      const btn = L.elements.find(x => x.type === 'button'), txt = L.elements.find(x => x.type === 'text');
      const th = FBR.SCREEN_THEMES.map(t => `<button data-theme="${t.id}" class="${L.theme === t.id && !L.bgImage ? 'on' : ''}" title="${t.cat}"><i style="background:linear-gradient(${t.grad[2]}deg,${t.grad[0]},${t.grad[1]})"></i>${t.name}</button>`).join('');
      return [`<div class="sec"><h4>Themenfarben</h4><div class="g3">
          <div><label class="l">Primärfarbe</label><input type="color" data-tc="btn" value="${hex(btn?.fill, '#F7C838')}"></div>
          <div><label class="l">Text</label><input type="color" data-tc="text" value="${hex(txt?.color, '#ffffff')}"></div>
          <div><label class="l">Hintergrund</label><input type="color" data-tc="bg" value="${hex(L.bgGrad ? L.bgGrad[0] : L.bg, '#1d1d1b')}"></div></div>
          <p class="muted">Primärfarbe = Farbe der Start-Schaltfläche. Ein Thema setzt alle Farben auf einmal.</p></div>`,
        `<div class="sec"><h4>Thema</h4><div class="themes">${th}</div></div>
        <div class="sec"><h4>Hintergrund</h4>
          ${L.bgImage ? `<div class="row" style="margin-bottom:8px"><img src="${esc(L.bgImage)}" style="height:54px;border-radius:6px"><button class="bt" data-a="delbg">${ICON('trash', 14)} Entfernen</button></div>` : ''}
          <button class="bt" data-a="upbg" style="width:100%">${ICON('upload', 15)} Hintergrundbild hochladen</button>
          <label class="l">Füllen/Anpassen</label><select data-L="bgFit"><option value="cover" ${L.bgFit !== 'contain' ? 'selected' : ''}>Füllen mit Zuschnitt</option><option value="contain" ${L.bgFit === 'contain' ? 'selected' : ''}>In den Bildschirm passen</option></select>
          <label class="chk"><input type="checkbox" data-L="live" ${L.live ? 'checked' : ''}> Live-Kamerabild als Hintergrund</label>
          ${opts.layoutFor ? '' : `<label class="l">Bildschirm</label><select data-L="orient">${Object.entries(FBR.SCREEN_SIZES).map(([k, f]) => `<option value="${k}" ${L.orient === k ? 'selected' : ''}>${f.label} (${f.w} × ${f.h})</option>`).join('')}</select>`}</div>`];
    }
    const nameOf = e => e.type === 'photo' ? `Fotobox-Foto ${e.n}` : TYPE_NAME[e.type];
    function selPanel(e) {
      const fixed = FIXED.has(e.type), deco = e.type === 'deco', forced = e.type === 'gallery' || e.type === 'vmsg';
      const num = (k, lab) => `<label><b>${lab}</b><input type="number" data-p="${k}" value="${Math.round(e[k] || 0)}"></label>`;
      const A = (k, ic, t) => `<button class="bt" data-align="${k}" title="${t}" ${e.locked ? 'disabled' : ''}>${ICON(ic, 17)}</button>`;
      const style = stylePanel(e);
      return `<div class="sec"><h4 class="big"><span>${ICON(TYPE_ICON[e.type], 16)} ${nameOf(e)}</span><button class="x" data-a="desel" title="Auswahl aufheben">×</button></h4>
          ${e.locked ? `<p class="note">${ICON('lock', 13)} Gesperrt – auf der Seite nicht verschiebbar. In den Ebenen entsperren.</p>` : ''}
          ${deco ? '' : `<div class="xy">${num('x', 'X')}${num('y', 'Y')}${num('w', 'B')}${num('h', 'H')}</div>
          <div class="row" style="margin-top:8px"><button class="bt ${keepRatio(e) ? 'on' : ''}" data-a="ratio" ${forced ? 'disabled' : ''} title="Seitenverhältnis beibehalten" style="flex:1">${ICON('link', 15)} Seitenverhältnis</button>
            <label class="rot" title="Drehen">${ICON('rotate', 15)}<input type="number" data-p="rot" value="${Math.round(e.rot || 0)}">°</label></div>`}</div>
        ${style ? `<div class="sec">${style}</div>` : ''}
        ${deco ? '' : `<div class="sec"><h4>Ausrichten</h4><div class="g6">${A('left', 'alignL', 'Links')}${A('center', 'alignC', 'Waagerecht zentrieren')}${A('right', 'alignR', 'Rechts')}${A('top', 'alignT', 'Oben')}${A('middle', 'alignM', 'Senkrecht zentrieren')}${A('bottom', 'alignB', 'Unten')}</div></div>`}
        <div class="sec"><h4>Ebene</h4><div class="g2"><button class="bt" data-move="1">${ICON('arrowUp', 15)} Ebene anheben</button><button class="bt" data-move="-1">${ICON('arrowDown', 15)} Ebene absenken</button>
          <button class="bt" data-move="top">${ICON('toTop', 15)} Ganz nach vorne</button><button class="bt" data-move="bottom">${ICON('toBottom', 15)} Ganz nach hinten</button></div>
          <div class="g2" style="margin-top:8px"><button class="bt" data-a="dup" ${fixed || deco ? 'disabled' : ''}>${ICON('copy', 15)} Duplizieren</button>
          <button class="bt" data-a="remove" ${e.locked ? 'disabled' : ''}>${ICON(fixed ? 'eyeOff' : 'trash', 15)} ${fixed ? 'Ausblenden' : 'Löschen'}</button></div></div>`;
    }
    const fontSel = e => `<select data-p="font">${Object.entries(FBR.FONT_NAMES).map(([k, n]) => `<option value="${k}" ${e.font === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
    const alignRow = e => `<label class="l">Ausrichtung</label><div class="row">${[['left', '⟸ Links'], ['center', 'Mitte'], ['right', 'Rechts ⟹']].map(([k, n]) => `<button class="bt ${(e.align || 'center') === k ? 'on' : ''}" data-set="align" data-v="${k}" style="flex:1">${n}</button>`).join('')}</div>`;
    function shadowSec(e) {
      return `<label class="chk sw" style="margin-top:14px"><span>Schlagschatten</span><input type="checkbox" data-p="shadow" ${e.shadow ? 'checked' : ''}></label>
        ${e.shadow ? `<div class="g2"><div><label class="l">Farbe</label><input type="color" data-p="shColor" value="${hex(e.shColor, '#000000')}"></div>
          <div><label class="l">Deckkraft</label><input type="range" min="0" max="1" step=".05" data-p="shOpacity" value="${e.shOpacity ?? .35}"></div></div>
          <div class="g3"><div><label class="l">Winkel °</label><input type="number" data-p="shAngle" value="${Math.round(e.shAngle ?? 90)}"></div>
          <div><label class="l">Abstand</label><input type="number" min="0" data-p="shDist" value="${Math.round(e.shDist ?? 0)}"></div>
          <div><label class="l">Weichheit</label><input type="number" min="0" data-p="shBlur" value="${Math.round(e.shBlur ?? 0)}"></div></div>` : ''}`;
    }
    function shadowDefaults(e) { // erstes Einschalten (auch bei alten Layouts mit shadow = true): sichtbare Werte zum Weiterstellen
      const u = Math.min(L.w, L.h) / 100; // gleich stark für alle Elemente der Seite
      if (e.shDist == null) { e.shDist = Math.max(3, Math.round(u * .8)); e.shBlur = Math.max(4, Math.round(u * 1.5)); e.shAngle = 90; e.shOpacity = .4; e.shColor = e.shColor || '#000000'; }
    }
    function stylePanel(e) {
      if (e.type === 'button') {
        return `<label class="chk sw"><span>Schaltflächen anzeigen</span><input type="checkbox" data-p="show" ${e.hidden ? '' : 'checked'}></label>
          <label class="l">Schaltflächentext</label><input type="text" maxlength="40" data-p="text" value="${esc(e.text || '')}" placeholder="leer = ohne Beschriftung">
          <label class="l">Schriftart</label>${fontSel(e)}
          <div class="g2"><div><label class="l">Primärfarbe</label><input type="color" data-p="fill" value="${hex(e.fill, '#ffffff')}"></div><div><label class="l">Textfarbe</label><input type="color" data-p="color" value="${hex(e.color, '#ffffff')}"></div></div>
          <label class="l">Symbol (eigenes Bild)</label>
          ${e.src ? `<div class="row" style="margin-bottom:8px"><img src="${esc(e.src)}" style="height:54px"><button class="bt" data-a="delbtnimg">${ICON('refresh', 14)} Zurücksetzen</button></div>` : ''}
          <button class="bt" data-a="replace" style="width:100%">${ICON('upload', 15)} Bild auswählen</button>
          <p class="muted">PNG · empfohlen 150 × 150 px. Auch ohne Schaltfläche startet ein Tipp auf den Bildschirm.</p>`;
      }
      if (e.type === 'gallery') {
        return `<label class="chk sw"><span>Schaltfläche „Galerie“ anzeigen</span><input type="checkbox" data-p="show" ${e.hidden ? '' : 'checked'}></label>
          <p class="muted">Der Fotostapel zeigt das neueste Foto. Gäste tippen darauf und sehen die Fotos dieses Ereignisses.</p>
          ${opts.sys?.gallery === false ? `<p class="note">${ICON('info', 13)} An dieser Fotobox ist „Galerie anzeigen“ in den Einstellungen ausgeschaltet.</p>` : ''}`;
      }
      if (e.type === 'vmsg') {
        return `<label class="chk sw"><span>Auf dem Startbildschirm zeigen</span><input type="checkbox" data-p="show" ${e.hidden ? '' : 'checked'}></label>
          <p class="muted">Gäste scannen den QR-Code und hinterlassen mit ihrem Handy eine Videonachricht. Überschrift und Hinweis stellst du unter „Videonachricht“ ein.</p>`;
      }
      if (e.type === 'signature') {
        return `<p class="muted" style="margin-top:0">Der Gast unterschreibt nach den Fotos mit dem Finger auf dem Bildschirm. Die Unterschrift erscheint an dieser Stelle auf dem Ausdruck.</p>
          <label class="l">Farbe der Unterschrift</label><input type="color" data-p="color" value="${hex(e.color, '#000000')}">`;
      }
      if (e.type === 'answer') {
        const qs = opts.questions || [], n = Math.max(8, qs.length, e.q || 1);
        return `<label class="l" style="margin-top:0">Umfrage-Antwort</label><select data-p="q">${Array.from({ length: n }, (_, i) => `<option value="${i + 1}" ${e.q == i + 1 ? 'selected' : ''}>Umfrageantwort ${i + 1}${qs[i] ? ' – ' + esc(String(qs[i]).slice(0, 30)) : ''}</option>`).join('')}</select>
          <div class="g2"><div><label class="l">Schriftart</label>${fontSel(e)}</div><div><label class="l">Größe</label><input type="text" data-p="size" value="${e.size || 'auto'}" placeholder="auto"></div></div>
          <label class="l">Farbe</label><input type="color" data-p="color" value="${hex(e.color, '#000000')}">
          ${alignRow(e)}<p class="muted">Die Fragen legst du unter „Umfrage & Haftungsausschluss“ an.</p>`;
      }
      if (e.type === 'photo') {
        const max = Math.max(8, FBR.photoCount(L));
        return `<label class="l" style="margin-top:0">Foto Nummer</label><select data-p="n">${Array.from({ length: max }, (_, i) => `<option value="${i + 1}" ${e.n == i + 1 ? 'selected' : ''}>Foto ${i + 1}</option>`).join('')}</select>
          <div class="g3"><div><label class="l">Ecken-Radius</label><input type="number" min="0" data-p="radius" value="${e.radius || 0}"></div>
          <div><label class="l">Rahmenfarbe</label><input type="color" data-p="stroke" value="${hex(e.stroke, '#ffffff')}"></div>
          <div><label class="l">Rahmen (px)</label><input type="number" min="0" data-p="strokeW" value="${e.strokeW || 0}"></div></div>
          ${shadowSec(e)}<p class="muted">Tipp: Mehrere Felder mit derselben Nummer zeigen dasselbe Foto.</p>`;
      }
      if (e.type === 'text') {
        return `<label class="l" style="margin-top:0">Text</label><textarea rows="2" data-p="text">${esc(e.text)}</textarea>
          <div>${PH.map(p => `<span class="chip" data-ph="${p}">{${p}}</span>`).join('')}</div>
          <div class="g2"><div><label class="l">Schriftart</label>${fontSel(e)}</div>
          <div><label class="l">Größe</label><input type="text" data-p="size" value="${e.size || 'auto'}" placeholder="auto"></div></div>
          <div class="g2"><div><label class="l">Farbe</label><input type="color" data-p="color" value="${hex(e.color, '#222222')}"></div>
          <div><label class="l">Stil</label><div class="row"><button class="bt ${e.weight >= 700 ? 'on' : ''}" data-tog="weight" style="flex:1"><b>F</b></button><button class="bt ${e.italic ? 'on' : ''}" data-tog="italic" style="flex:1"><i>K</i></button></div></div></div>
          ${alignRow(e)}
          <label class="l">Deckkraft</label><input type="range" min="0" max="1" step=".05" data-p="opacity" value="${e.opacity ?? 1}">${shadowSec(e)}`;
      }
      if (e.type === 'image') {
        return `<button class="bt" data-a="replace" style="width:100%">${ICON('refresh', 15)} Bild ersetzen</button>
          <label class="l">Einpassen</label><select data-p="fit"><option value="stretch">Genau in den Rahmen</option><option value="contain" ${e.fit === 'contain' ? 'selected' : ''}>Einpassen (ganzes Bild)</option><option value="cover" ${e.fit === 'cover' ? 'selected' : ''}>Füllen (zuschneiden)</option></select>
          <label class="l">Deckkraft</label><input type="range" min="0" max="1" step=".05" data-p="opacity" value="${e.opacity ?? 1}">${shadowSec(e)}
          <p class="muted">Eigene Designs als PNG mit transparenten Stellen über die Fotos legen (Ebene nach oben).</p>`;
      }
      if (e.type === 'shape') {
        return `<label class="l" style="margin-top:0">Form</label><div class="row"><button class="bt ${e.shape !== 'ellipse' ? 'on' : ''}" data-set="shape" data-v="rect" style="flex:1">▭ Rechteck</button><button class="bt ${e.shape === 'ellipse' ? 'on' : ''}" data-set="shape" data-v="ellipse" style="flex:1">◯ Ellipse</button></div>
          <div class="g2"><div><label class="l">Füllung</label><input type="color" data-p="fill" value="${hex(e.fill, '#ffffff')}"></div><div><label class="l">Ohne Füllung</label><select data-p="nofill"><option value="">Nein</option><option value="1" ${!e.fill ? 'selected' : ''}>Ja</option></select></div></div>
          <div class="g2"><div><label class="l">Rahmenfarbe</label><input type="color" data-p="stroke" value="${hex(e.stroke, '#000000')}"></div><div><label class="l">Rahmen (px)</label><input type="number" min="0" data-p="strokeW" value="${e.strokeW || 0}"></div></div>
          <div class="g2"><div><label class="l">Ecken-Radius</label><input type="number" min="0" data-p="radius" value="${e.radius || 0}"></div><div><label class="l">Deckkraft</label><input type="range" min="0" max="1" step=".05" data-p="opacity" value="${e.opacity ?? 1}" style="margin-top:12px"></div></div>${shadowSec(e)}`;
      }
      if (e.type === 'deco') {
        const t = FBR.templateById(e.tpl);
        return `<p style="margin-top:0">Verzierung der Vorlage <b>${t.name}</b> (${e.layer === 'over' ? 'über' : 'unter'} den Fotos).</p>
          <button class="bt" data-a="togglehide" style="width:100%">${ICON(e.hidden ? 'eye' : 'eyeOff', 15)} ${e.hidden ? 'Einblenden' : 'Ausblenden'}</button>
          <button class="bt" data-a="remove" style="width:100%;margin-top:8px">${ICON('trash', 15)} Entfernen</button>`;
      }
      return '';
    }
    function syncPos() {
      const e = selEl(); if (!e) return;
      for (const k of ['x', 'y', 'w', 'h', 'rot']) { const i = props.querySelector(`[data-p="${k}"]`); if (i && document.activeElement !== i) i.value = Math.round(e[k] || 0); }
    }
    function layName(e) {
      if (e.type === 'photo') return 'Fotobox-Foto ' + e.n;
      if (e.type === 'text') return FBR.fillText(e.text, opts.values).slice(0, 26) || TYPE_NAME.text;
      if (e.type === 'answer') return 'Umfrageantwort ' + (e.q || 1);
      if (e.type === 'deco') return 'Deko ' + FBR.templateById(e.tpl).name + (e.layer === 'over' ? ' (oben)' : ' (unten)');
      return TYPE_NAME[e.type];
    }
    function layersList() {
      return [...L.elements].reverse().filter(listed).map(e => `<div class="lay ${e.id === sel ? 'on' : ''} ${e.hidden ? 'off' : ''}" data-id="${e.id}">
        <span class="grip" data-grip title="Ziehen = Reihenfolge ändern">${ICON('grip', 15)}</span>${ICON(TYPE_ICON[e.type], 15)}<span class="n">${esc(layName(e))}</span>
        ${e.type === 'deco' ? '' : `<button data-lock="${e.id}" class="${e.locked ? 'act' : ''}" title="${e.locked ? 'Entsperren' : 'Sperren'}">${ICON(e.locked ? 'lock' : 'unlock', 14)}</button>`}
        <button data-hide="${e.id}" title="${e.hidden ? 'Einblenden' : 'Ausblenden'}">${ICON(e.hidden ? 'eyeOff' : 'eye', 14)}</button></div>`).join('');
    }
    // Ebenen per Ziehen sortieren (Maus und Touch)
    props.addEventListener('pointerdown', ev => {
      const g = ev.target.closest('[data-grip]'); if (!g) return;
      ev.preventDefault();
      const row = g.closest('.lay'), list = row.parentElement, rows = [...list.querySelectorAll('.lay')], others = rows.filter(r => r !== row);
      const y0 = ev.clientY; let to = rows.indexOf(row);
      row.classList.add('drag'); g.setPointerCapture(ev.pointerId);
      const mv = e2 => {
        row.style.transform = `translateY(${e2.clientY - y0}px)`;
        to = others.filter(r => { const b = r.getBoundingClientRect(); return b.top + b.height / 2 < e2.clientY; }).length;
        others.forEach((r, i) => { r.classList.toggle('tgt', i === to); r.classList.toggle('tgtE', to === others.length && i === others.length - 1); });
      };
      const up = () => {
        g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up);
        const ids = others.map(r => r.dataset.id); ids.splice(to, 0, row.dataset.id); // Anzeige: vorne zuerst
        const back = ids.reverse().map(id => L.elements.find(x => x.id === id)); let k = 0; // hinten zuerst, wie im Layout
        L.elements = L.elements.map(e => listed(e) ? back[k++] : e); pinSys();
        sel = row.dataset.id; commit(); renderProps(); draw(); opts.onSelect?.(selEl());
      };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    });

    // ---------- Eingaben in den Spalten ----------
    async function onClick(ev) {
      const t = ev.target.closest('button,.lay,.chip'); if (!t || t.disabled) return;
      const a = t.dataset.a;
      if (t.dataset.t) { addKind(t.dataset.t); return; }
      if (t.dataset.theme) { FBR.applyTheme(L, t.dataset.theme); commit(); renderProps(); draw(); return; }
      if (a === 'upvideo') { await opts.uploadVideo?.(L.orient); renderSide(); renderProps(); return; }
      if (a === 'delvideo') { await opts.removeVideo?.(L.orient); renderSide(); renderProps(); return; }
      if (a === 'delbg') { L.bgImage = ''; commit(); renderProps(); draw(); return; }
      if (a === 'upbg') {
        const f = await pickFile('image/*'); if (!f) return;
        setStatus('Lädt Bild hoch …');
        try { const src = opts.uploadImage ? await opts.uploadImage(f) : URL.createObjectURL(f); await FBR.loadImg(src); L.bgImage = src; L.live = false; commit(); renderProps(); draw(); setStatus(''); }
        catch (err) { alert(tr('Bild konnte nicht hochgeladen werden:') + ' ' + err.message); setStatus(''); }
        return;
      }
      if (a === 'desel') { select(null); return; }
      if (t.dataset.hide) { const x = L.elements.find(z => z.id === t.dataset.hide); x.hidden = !x.hidden; commit(); renderProps(); draw(); ev.stopPropagation(); return; }
      if (t.dataset.lock) { const x = L.elements.find(z => z.id === t.dataset.lock); x.locked = !x.locked; commit(); renderProps(); draw(); ev.stopPropagation(); return; }
      if (t.classList.contains('lay')) { if (sel !== t.dataset.id) select(t.dataset.id); return; }
      const e = selEl(); if (!e) return;
      if (t.dataset.ph) { const ta = props.querySelector('[data-p=text]'); ta.value += `{${t.dataset.ph}}`; e.text = ta.value; commit(); draw(); return; }
      if (t.dataset.align) return align(t.dataset.align);
      if (t.dataset.move) return move(isNaN(+t.dataset.move) ? t.dataset.move : +t.dataset.move);
      if (a === 'ratio') { e.ratio = !keepRatio(e); commit(); renderProps(); drawSel(); return; }
      if (t.dataset.tog === 'weight') { e.weight = e.weight >= 700 ? 400 : 700; }
      else if (t.dataset.tog === 'italic') { e.italic = !e.italic; }
      else if (t.dataset.set) { e[t.dataset.set] = t.dataset.v; }
      else if (a === 'dup') return duplicate();
      else if (a === 'remove') return remove();
      else if (a === 'replace') return addImage(true);
      else if (a === 'delbtnimg') { e.src = ''; }
      else if (a === 'togglehide') { e.hidden = !e.hidden; }
      else return;
      commit(); renderProps(); draw();
    }
    function onInput(ev) {
      const t = ev.target;
      if (t.dataset.tc) { themeColor(t.dataset.tc, t.value); draw(); clearTimeout(onInput.t); onInput.t = setTimeout(commit, 350); return; }
      const e = selEl();
      if (t.dataset.l || !e || !t.dataset.p) return;
      const k = t.dataset.p, num = ['x', 'y', 'w', 'h', 'rot', 'radius', 'strokeW', 'opacity', 'n', 'q', 'shOpacity', 'shAngle', 'shDist', 'shBlur'];
      if (k === 'show') { e.hidden = !t.checked; draw(); commit(); renderProps(); return; }
      if (k === 'shadow') { e.shadow = t.checked; if (e.shadow) shadowDefaults(e); draw(); commit(); renderProps(); return; }
      if (k === 'nofill') { e.fill = t.value ? '' : (e._fill || '#ffffff'); }
      else if (k === 'fill') { e.fill = t.value; e._fill = t.value; }
      else if (k === 'size') e.size = /^\d+$/.test(t.value.trim()) ? +t.value : 'auto';
      else if ((k === 'w' || k === 'h') && keepRatio(e)) {
        const r = e.w / e.h, v = Math.max(10, +t.value || 10);
        if (k === 'w') { e.w = v; e.h = Math.max(10, Math.round(v / r)); } else { e.h = v; e.w = Math.max(10, Math.round(v * r)); }
        syncPos();
      }
      else e[k] = num.includes(k) ? +t.value : t.value;
      if (k === 'w' || k === 'h') e[k] = Math.max(10, e[k]);
      draw(); clearTimeout(onInput.t); onInput.t = setTimeout(commit, 350);
    }
    function onChange(ev) {
      const t = ev.target; if (!t.dataset.l) return;
      const k = t.dataset.l;
      if (k === 'format') changeFormat(t.value);
      else if (k === 'paperSize' || k === 'paperOrient') {
        const F = FBR.FORMATS[L.format] || {}, size = k === 'paperSize' ? t.value : F.size, o = k === 'paperOrient' ? t.value : (F.orient || 'p');
        const f = FBR.formatKey(size, o); if (f && f !== L.format) changeFormat(f, k === 'paperSize');
      }
      else if (k === 'orient') changeOrient(t.value);
      else if (k === 'bgFit') L.bgFit = t.value;
      else if (k === 'bg') { L.bg = t.value; if (L.screen) { L.bgGrad = null; L.theme = ''; } }
      else L[k] = t.checked;
      commit(); renderSide(); renderProps(); draw();
    }
    for (const box of [side, props].filter(Boolean)) { box.addEventListener('click', onClick); box.addEventListener('input', onInput); box.addEventListener('change', onChange); }
    function changeOrient(o) { // ohne Umschalter (layoutFor): den Bildschirm selbst drehen
      const F = FBR.SCREEN_SIZES[o]; if (!F || o === L.orient) return;
      const sx = F.w / L.w, sy = F.h / L.h, s = Math.min(sx, sy);
      for (const e of L.elements) { const cx = (e.x + e.w / 2) * sx, cy = (e.y + e.h / 2) * sy; e.w = Math.round(e.w * s); e.h = Math.round(e.h * s); e.x = Math.round(cx - e.w / 2); e.y = Math.round(cy - e.h / 2); }
      L.orient = o; L.w = F.w; L.h = F.h; fmtLabel(); fit(); opts.onLayout?.(L);
    }
    function fmtLabel() {
      const n = q('[data-a=fmt]'); if (!n || !L) return;
      n.textContent = L.screen ? `${tr('Startbildschirm')} · ${L.w}×${L.h}px` : `${FBR.FORMATS[L.format]?.label || ''} · ${L.w}×${L.h}px`;
    }
    function changeFormat(f, newSize = true) {
      const F = FBR.FORMATS[f], sx = F.w / L.w, sy = F.h / L.h, s = Math.min(sx, sy);
      for (const e of L.elements) {
        if (e.type === 'deco') { e.w = F.w; e.h = F.h; continue; }
        const cx = (e.x + e.w / 2) * sx, cy = (e.y + e.h / 2) * sy;
        e.w = Math.round(e.w * (e.type === 'photo' ? sx : s)); e.h = Math.round(e.h * (e.type === 'photo' ? sy : s));
        e.x = Math.round(cx - e.w / 2); e.y = Math.round(cy - e.h / 2);
      }
      L.format = f; L.w = F.w; L.h = F.h;
      if (newSize) L.twoPerPage = F.size === '2x6'; // Streifen: 2 pro Seite ist üblich; beim Drehen bleibt die Wahl
      if (!F.pair) L.twoPerPage = false;
      fmtLabel(); fit();
    }

    // ---------- Hoch-/Querformat, Zurücksetzen ----------
    async function setOrient(o) {
      if (!L || !L.screen || !opts.layoutFor || o === L.orient) return;
      await flush(); load(opts.layoutFor(o));
    }
    async function reset() {
      if (!L || !opts.onReset) return;
      clearTimeout(saveT); dirty = false;
      const o = L.orient;
      if (await opts.onReset(o)) load(opts.layoutFor ? opts.layoutFor(o) : opts.layout);
    }

    // ---------- Kopfzeile (Vollbild) ----------
    root?.querySelector('.top').addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.o) return setOrient(b.dataset.o);
      const a = b.dataset.a;
      if (a === 'undo') jump(-1); else if (a === 'redo') jump(1); else if (a === 'reset') reset();
      else if (a === 'close' || a === 'done') close();
    });
    q('[data-a=name]')?.addEventListener('input', ev => { L.name = ev.target.value; clearTimeout(onInput.n); onInput.n = setTimeout(commit, 500); });
    let closed = false;
    function destroy() {
      if (closed) return; closed = true;
      clearTimeout(saveT); document.removeEventListener('keydown', onKey); ro.disconnect();
      if (inline) { opts.stageEl.innerHTML = ''; opts.propsEl.innerHTML = ''; } else root.remove();
    }
    async function close() {
      if (closed) return;
      const changed = JSON.stringify(out()) !== lastSaved;
      if (changed) { try { await opts.onSave?.(out()); } catch {} }
      const res = out(); destroy(); opts.onClose?.(res, changed);
    }
    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    load(opts.layout);
    return {
      close, destroy, flush, reset, setOrient, select,
      add: addKind, undo: () => jump(-1), redo: () => jump(1),
      load: lay => load(lay), orient: () => L && L.orient, layout: () => out(),
      // Platzhalter-Texte oder feste Schaltflächen (Galerie, Videonachricht) haben sich außerhalb geändert: neu zeichnen
      update(o = {}) {
        if (o.values) opts.values = o.values;
        if (o.sys) { const before = JSON.stringify(opts.sys || {}); opts.sys = o.sys; if (JSON.stringify(o.sys) !== before && L.screen) { L = FBR.screenSys(L, opts.sys); hist[hi] = JSON.stringify(L); renderProps(); } }
        draw();
      },
    };
  }

  // Aus einem hochgeladenen Design (PNG mit transparenten Stellen) automatisch Fotofelder erkennen
  async function layoutFromImage(file, uploadImage) {
    const local = URL.createObjectURL(file);
    const img = await FBR.loadImg(local);
    if (!img) throw new Error('Bild konnte nicht gelesen werden');
    const ar = img.naturalWidth / img.naturalHeight;
    const fmt = Object.entries(FBR.FORMATS).sort((a, b) => Math.abs(a[1].w / a[1].h - ar) - Math.abs(b[1].w / b[1].h - ar))[0][0];
    const F = FBR.FORMATS[fmt];
    // transparente Bereiche suchen (auf 360 px verkleinert: genau genug für saubere Kanten, schnell genug zum Durchsuchen)
    const S = 360 / Math.max(img.naturalWidth, img.naturalHeight), gw = Math.round(img.naturalWidth * S), gh = Math.round(img.naturalHeight * S);
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
    // Schmale Schlitze (Zierlinien) sind keine Fotofelder; ein Feld über die ganze Seite entfällt, wenn es daneben echte Felder gibt (durchsichtiger Rand).
    let good = boxes.filter(b => b[2] > gw * .08 && b[3] > gh * .08);
    if (good.length > 1) good = good.filter(b => !(b[2] > gw * .95 && b[3] > gh * .95));
    // Zierlinie in der Öffnung = zwei ineinander liegende Bereiche: das äußere Feld gilt, das innere entfällt
    const inside = (a, b) => a !== b && a[0] >= b[0] && a[1] >= b[1] && a[0] + a[2] <= b[0] + b[2] && a[1] + a[3] <= b[1] + b[3];
    good = good.filter(a => !good.some(b => inside(a, b)));
    boxes.length = 0; boxes.push(...good);
    // Reihenfolge wie beim Lesen: zeilenweise von oben nach unten, in der Zeile von links nach rechts
    const band = gh * .06; boxes.sort((a, b) => Math.abs(a[1] - b[1]) > band ? a[1] - b[1] : a[0] - b[0]);
    // Foto etwas größer als die Öffnung, damit an den Kanten nie der Hintergrund durchscheint
    for (const b of boxes) { const nx = Math.max(0, b[0] - 1), ny = Math.max(0, b[1] - 1); b[2] = Math.min(gw, b[0] + b[2] + 1) - nx; b[3] = Math.min(gh, b[1] + b[3] + 1) - ny; b[0] = nx; b[1] = ny; }
    const kx = F.w / gw, ky = F.h / gh;
    const src = uploadImage ? await uploadImage(file) : local;
    await FBR.loadImg(src);
    // Doppelstreifen (zwei gleiche Streifen nebeneinander auf einem Blatt): beide Hälften zeigen dieselben Fotos 1, 2, 3 …
    const near = (a, b, t) => Math.abs(a - b) <= t;
    const twin = boxes.length >= 4 && boxes.length % 2 === 0 && boxes.every((b, i) => { const o = boxes[i ^ 1];
      return near(b[1], o[1], gh * .02) && near(b[2], o[2], gw * .03) && near(b[3], o[3], gh * .02) && near(Math.abs(b[0] - o[0]), gw / 2, gw * .04); });
    const els = (boxes.length ? boxes : [[gw * .05, gh * .05, gw * .9, gh * .7]]).slice(0, 8).map((b, i) => ({
      id: FBR.uid(), type: 'photo', n: twin ? (i >> 1) + 1 : i + 1, x: Math.round(b[0] * kx), y: Math.round(b[1] * ky), w: Math.round(b[2] * kx), h: Math.round(b[3] * ky), rot: 0, radius: 0 }));
    els.push({ id: FBR.uid(), type: 'image', src, fit: 'stretch', opacity: 1, x: 0, y: 0, w: F.w, h: F.h, rot: 0 });
    return { id: FBR.uid(), name: 'Eigenes Design', format: fmt, w: F.w, h: F.h, bg: '#ffffff', twoPerPage: fmt === '2x6', secondary: false, elements: els, found: boxes.length };
  }

  G.LayoutEditor = { open, mount, layoutFromImage };
})(window);
