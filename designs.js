// Design-Katalog: alle BoothDesigner-Designs als Vorschau in Dashboard und Fotobox, mit einem Klick als Fotolayout installieren (Betreiber 04.11.2026).
// Gleiche Datei in der Fotobox und im Dashboard. Die Designs liegen nicht im Programm (rund 270 MB, jeden Tag mehr), nur das gewählte kommt ins Ereignis.
// Die Druckvorlage zeichnet das Studio von boothdesigner.de selbst (unsichtbar im iframe, ?install=1): So sieht sie genau aus wie dort und neue Designs
// sind sofort da. Vorlage mit transparenten Fotofeldern über den Fotos, Texte als eigene Ebenen, wie beim Übernehmen einer Einsendung (studio.js).
// DesignKatalog.open({ upload(file) → url, canUse, lockedText, onInstall(layouts) })
window.DesignKatalog = (() => {
  const BASE = () => (window.BD_BASE || 'https://boothdesigner.de').replace(/\/$/, '');
  const FORMAT_OF = { '600x1800': '2x6', '1200x1800': '4x6p', '1800x1200': '4x6l', '1500x1500': '5x5' };
  // Druckformate des Studios mit Bezeichnung; Vorschaubilder: 4x6-04 und 6x4-01 liegen an eigener Stelle
  const FORMATS = [
    ['4x6-04', '4×6 hoch', '1 Foto hoch'], ['4x6-01', '4×6 hoch', '1 Foto quadratisch'], ['4x6-02', '4×6 hoch', '5 Fotos quadratisch'], ['4x6-03', '4×6 hoch', '7 Fotos quer'],
    ['6x4-04', '4×6 quer', '1 Foto quer'], ['6x4-01', '4×6 quer', '3 Fotos quer'], ['6x4-02', '4×6 quer', '3 Fotos hoch'], ['6x4-03', '4×6 quer', '6 Fotos hoch'],
    ['2x6-01', '2×6 Streifen', '2 Fotos quadratisch'], ['2x6-02', '2×6 Streifen', '3 Fotos quadratisch'], ['2x6-03', '2×6 Streifen', '3 Fotos quer'], ['2x6-04', '2×6 Streifen', '4 Fotos quer'], ['2x6-05', '2×6 Streifen', '2 Fotos hoch'],
    ['5x5-01', '5×5 Quadrat', '1 Foto quadratisch'],
  ];
  const MAX = 6;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (key, v) => `${BASE()}/beispiele/${v === '4x6-04' ? '' : v === '6x4-01' ? 'quer/' : v + '/'}${encodeURIComponent(key)}.jpg`;
  const CSS = `#dkWrap{position:fixed;inset:0;z-index:100000;background:rgba(15,15,20,.6);display:grid;place-items:center;padding:2vmin;color:#1d1d1b;font-size:16px}
  #dkWrap .dkBox{background:#fff;border-radius:16px;width:min(1100px,100%);height:min(92vh,1100px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.45)}
  #dkWrap .dkHead{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #e8e6dc;flex-wrap:wrap}#dkWrap h3{margin:0;font-size:20px;color:#1d1d1b;flex:1;min-width:120px}
  #dkWrap input[type=search],#dkWrap input[type=text]{padding:10px 12px;border:1px solid #cfcdc4;border-radius:10px;font-size:16px;background:#fff;color:#1d1d1b;min-width:0;width:100%;box-sizing:border-box}#dkWrap .dkSearch{flex:1;min-width:150px;max-width:320px}
  #dkWrap button{font:inherit;cursor:pointer}#dkWrap .dkX{border:0;background:#f2f0e8;border-radius:50%;width:42px;height:42px;font-size:22px;line-height:1;color:#1d1d1b}
  #dkWrap .dkCats{display:flex;gap:6px;padding:10px 16px;overflow-x:auto;flex:none;border-bottom:1px solid #f0eee6;scrollbar-width:none}#dkWrap .dkCats button{white-space:nowrap;border:1px solid #d8d6cc;background:#fff;border-radius:999px;padding:7px 14px;color:#1d1d1b}#dkWrap .dkCats button.on{background:#1d1d1b;color:#fff;border-color:#1d1d1b}
  #dkWrap .dkBody{flex:1;overflow-y:auto;padding:14px 16px;-webkit-overflow-scrolling:touch}#dkWrap .dkGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
  #dkWrap .dkItem{border:1px solid #e8e6dc;background:#fff;border-radius:12px;padding:8px;text-align:left;display:flex;flex-direction:column;gap:6px;color:#1d1d1b}#dkWrap .dkItem:hover{border-color:#1d1d1b}#dkWrap .dkItem img{width:100%;aspect-ratio:2/3;object-fit:contain;background:#f6f5f0;border-radius:8px}#dkWrap .dkItem b{font-size:14px;font-weight:600}#dkWrap .dkItem small{color:#77756c;font-size:12px}
  #dkWrap .dkFmt{cursor:pointer;position:relative}#dkWrap .dkFmt input{position:absolute;top:14px;left:14px;width:22px;height:22px}#dkWrap .dkFmt.on{border-color:#1d1d1b;box-shadow:0 0 0 2px #1d1d1b}
  #dkWrap .dkFoot{display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid #e8e6dc;flex-wrap:wrap}#dkWrap .dkMsg{flex:1;min-width:160px;font-size:14px;color:#5f5d55}
  #dkWrap .dkGo{background:#f7c838;border:0;border-radius:12px;padding:12px 22px;font-weight:700;color:#1d1d1b}#dkWrap .dkGo:disabled{opacity:.5;cursor:default}#dkWrap .dkBack{background:#fff;border:1px solid #cfcdc4;border-radius:12px;padding:12px 18px;color:#1d1d1b}
  #dkWrap .dkTexts{display:grid;gap:12px;max-width:560px}#dkWrap .dkTexts label{display:grid;gap:4px;font-size:14px;color:#5f5d55}`;

  // Unsichtbares Studio: lädt beim ersten Installieren und bleibt für weitere Designs geladen
  let frame = null, ready = null;
  function studio() {
    if (ready) return ready;
    ready = new Promise((res, rej) => {
      frame = document.createElement('iframe'); frame.title = 'BoothDesigner'; frame.tabIndex = -1; frame.setAttribute('aria-hidden', 'true');
      frame.style.cssText = 'position:fixed;left:-20000px;top:0;width:1400px;height:1000px;border:0;opacity:0;pointer-events:none';
      const t = setTimeout(() => { removeEventListener('message', on); rej(new Error('Das Studio antwortet nicht. Bitte die Internetverbindung prüfen.')); }, 60000);
      const on = e => { if (e.source === frame.contentWindow && e.data?.type === 'bd-install-ready') { clearTimeout(t); removeEventListener('message', on); res(frame.contentWindow); } };
      addEventListener('message', on);
      frame.src = `${BASE()}/studio/?install=1`; document.body.appendChild(frame);
    }).catch(e => { frame?.remove(); frame = null; ready = null; throw e; });
    return ready;
  }
  async function render(design, layouts, onStep) {
    const win = await studio(), id = Math.random().toString(36).slice(2);
    return new Promise((res, rej) => {
      const t = setTimeout(() => { removeEventListener('message', on); rej(new Error('Das Design konnte nicht erstellt werden. Bitte noch einmal versuchen.')); }, 180000);
      const on = e => {
        if (e.source !== win || e.data?.id !== id) return;
        if (e.data.type === 'bd-install-step') return onStep?.(e.data.i, e.data.n);
        clearTimeout(t); removeEventListener('message', on);
        if (e.data.type === 'bd-install-done') res(e.data.parts); else rej(new Error(e.data.error || 'Das Design konnte nicht erstellt werden.'));
      };
      addEventListener('message', on);
      win.postMessage({ type: 'bd-install', id, design, layouts }, '*');
    });
  }
  // Teil aus dem Studio → Fotolayout (Fotofelder unter der Vorlage, Texte als eigene Ebenen)
  function toLayout(d, p, src, keep) {
    const FBR = window.FBR, fmt = FORMAT_OF[`${p.w}x${p.h}`], F = FBR.FORMATS[fmt]; if (!F) return null;
    const kx = F.w / p.w, ky = F.h / p.h;
    // Foto etwas größer als die Öffnung, damit an den Kanten nie der Hintergrund durchscheint
    const boxes = (p.slots || []).map(b => [b[0] - 2, b[1] - 2, b[2] + 4, b[3] + 4]), band = p.h * .06;
    boxes.sort((a, b) => Math.abs(a[1] - b[1]) > band ? a[1] - b[1] : a[0] - b[0]);
    const els = boxes.slice(0, 12).map((b, i) => ({ id: FBR.uid(), type: 'photo', n: i + 1, x: Math.round(b[0] * kx), y: Math.round(b[1] * ky), w: Math.round(b[2] * kx), h: Math.round(b[3] * ky), rot: 0, radius: 0, stroke: '', strokeW: 0, shadow: false }));
    els.push({ id: FBR.uid(), type: 'image', src, fit: 'stretch', opacity: 1, x: 0, y: 0, w: F.w, h: F.h, rot: 0, locked: true });
    for (const t of p.texts || []) {
      if (!t || t.type !== 'text') continue;
      const text = keep(t.text); if (!text) continue;
      els.push({ ...t, text, id: FBR.uid(), x: Math.round(t.x * kx), y: Math.round(t.y * ky), w: Math.round(t.w * kx), h: Math.round(t.h * ky), size: t.size ? Math.round(t.size * ky * 10) / 10 : t.size,
        ...(t.bg ? { bg: { ...t.bg, pad: Math.round((t.bg.pad || 0) * ky) } } : {}), studioText: true });
    }
    return { id: FBR.uid(), name: `${d.name} · ${p.name}`, format: fmt, w: F.w, h: F.h, bg: '#ffffff', twoPerPage: fmt === '2x6', secondary: false, elements: els, katalog: d.key };
  }

  async function open({ upload, canUse = true, lockedText = '', onInstall }) {
    if (!document.getElementById('dkCss')) { const st = document.createElement('style'); st.id = 'dkCss'; st.textContent = CSS; document.head.appendChild(st); }
    const w = document.createElement('div'); w.id = 'dkWrap'; w.innerHTML = '<div class="dkBox"></div>'; document.body.appendChild(w);
    const box = w.firstChild, close = () => { w.remove(); removeEventListener('keydown', esc1); };
    const esc1 = e => { if (e.key === 'Escape') close(); }; addEventListener('keydown', esc1);
    w.addEventListener('pointerdown', e => { if (e.target === w) close(); });
    const head = (title, back) => `<div class="dkHead">${back ? '<button class="dkBack" data-back>‹ Zurück</button>' : ''}<h3>${esc(title)}</h3>${back ? '' : '<input class="dkSearch" type="search" placeholder="Design suchen …" data-q>'}<button class="dkX" data-x aria-label="Schließen">×</button></div>`;
    box.innerHTML = head('Designs') + '<div class="dkBody"><p>Designs werden geladen …</p></div>';
    box.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); });
    let list;
    try {
      const r = await fetch(`${BASE()}/studio/katalog.json`, { cache: 'no-cache' }); if (!r.ok) throw new Error(String(r.status));
      list = await r.json();
    } catch { box.querySelector('.dkBody').innerHTML = '<p>Die Designs sind gerade nicht erreichbar. Bitte die Internetverbindung prüfen.</p>'; return; }
    let cat = 'Alle', q = '', top = 0;
    const cats = ['Alle', ...new Set(list.map(d => d.cat).filter(Boolean))];
    function showList() {
      box.innerHTML = head('Designs') + `<div class="dkCats">${cats.map(c => `<button data-c="${esc(c)}" class="${c === cat ? 'on' : ''}">${esc(c)}</button>`).join('')}</div><div class="dkBody"><div class="dkGrid"></div></div>`;
      const grid = () => {
        const hit = list.filter(d => (cat === 'Alle' || d.cat === cat) && (`${d.name} ${d.occasion} ${d.cat}`).toLowerCase().includes(q));
        box.querySelector('.dkGrid').innerHTML = hit.map(d => `<button class="dkItem" data-d="${esc(d.key)}"><img loading="lazy" src="${img(d.key, '4x6-04')}" alt=""><b translate="no">${esc(d.name)}</b><small>${esc(d.occasion || d.cat || '')}</small></button>`).join('') || '<p>Kein Design gefunden.</p>';
      };
      grid();
      const body = box.querySelector('.dkBody'); body.scrollTop = top;
      const s = box.querySelector('[data-q]'); s.value = q; s.oninput = () => { q = s.value.toLowerCase().trim(); grid(); };
      box.querySelector('.dkCats').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; cat = b.dataset.c; box.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); grid(); body.scrollTop = 0; };
      box.querySelector('.dkGrid').onclick = e => { const b = e.target.closest('[data-d]'); if (b) { top = body.scrollTop; showDesign(list.find(d => d.key === b.dataset.d)); } };
    }
    function showDesign(d) {
      const have = FORMATS.filter(([k]) => (d.v || []).includes(k)), pick = new Set(have.filter(([k]) => k === '4x6-04' || k === '6x4-01').map(([k]) => k));
      box.innerHTML = head(d.name, true) + `<div class="dkBody"><div class="dkGrid">${have.map(([k, a, b]) => `<label class="dkItem dkFmt ${pick.has(k) ? 'on' : ''}"><input type="checkbox" data-f="${k}" ${pick.has(k) ? 'checked' : ''}><img loading="lazy" src="${img(d.key, k)}" alt=""><b>${esc(a)}</b><small>${esc(b)}</small></label>`).join('')}</div></div>
        <div class="dkFoot"><div class="dkMsg"></div><button class="dkGo">Installieren</button></div>`;
      const msg = box.querySelector('.dkMsg'), go = box.querySelector('.dkGo');
      const sync = () => { msg.textContent = !canUse ? lockedText : pick.size ? `${pick.size} von höchstens ${MAX} Formaten gewählt` : 'Bitte mindestens ein Format wählen.'; go.disabled = !canUse || !pick.size; };
      sync();
      box.querySelector('[data-back]').onclick = showList;
      box.querySelector('.dkGrid').onchange = e => { const k = e.target.dataset.f; if (!k) return; if (e.target.checked && pick.size >= MAX) { e.target.checked = false; return; } e.target.checked ? pick.add(k) : pick.delete(k); e.target.closest('.dkFmt').classList.toggle('on', e.target.checked); sync(); };
      go.onclick = async () => {
        go.disabled = true; msg.textContent = 'Design wird vorbereitet …';
        try {
          const parts = await render(d.key, [...pick], (i, n) => { msg.textContent = `Format ${i} von ${n} wird erstellt …`; });
          if (w.isConnected) showTexts(d, parts);
        } catch (e) { msg.textContent = '⚠️ ' + e.message; go.disabled = false; }
      };
    }
    // Die Texte stehen auf jedem Format: einmal ändern, gilt überall. Leer = Text weglassen.
    function showTexts(d, parts) {
      const texts = [...new Set(parts.flatMap(p => (p.texts || []).filter(t => t?.type === 'text').map(t => t.text)).filter(Boolean))];
      const finish = async map => {
        const msg = box.querySelector('.dkMsg'), go = box.querySelector('.dkGo'); go.disabled = true;
        try {
          const Ls = [];
          for (const [i, p] of parts.entries()) {
            if (msg) msg.textContent = `Format ${i + 1} von ${parts.length} wird gespeichert …`;
            const url = await upload(new File([p.base], `${d.key}-${p.key}.png`, { type: 'image/png' }));
            const L = toLayout(d, p, url, t => map.has(t) ? map.get(t) : t); if (L) Ls.push(L);
          }
          if (!Ls.length) throw new Error('Dieses Format passt nicht zur Fotobox.');
          close(); onInstall(Ls);
        } catch (e) { if (msg) msg.textContent = '⚠️ ' + e.message; go.disabled = false; }
      };
      box.innerHTML = head('Texte auf dem Foto', true) + `<div class="dkBody"><div class="dkTexts">${texts.length ? '<p style="margin:0">Name, Datum und Anlass eintragen. Das gilt für alle gewählten Formate, später lässt es sich im Fotolayout noch ändern. Leeres Feld = Text weglassen.</p>' : '<p style="margin:0">Dieses Design hat keine Texte.</p>'}
        ${texts.map((t, i) => `<label>${esc(t)}<input type="text" maxlength="120" data-t="${i}" value="${esc(t)}"></label>`).join('')}</div></div><div class="dkFoot"><div class="dkMsg"></div><button class="dkGo">Fertig installieren</button></div>`;
      box.querySelector('[data-back]').onclick = () => showDesign(d);
      box.querySelector('.dkGo').onclick = () => { const map = new Map(); box.querySelectorAll('[data-t]').forEach(i => map.set(texts[+i.dataset.t], i.value.trim())); finish(map); };
    }
    showList();
  }
  return { open };
})();
