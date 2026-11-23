// Design-Katalog: alle BoothDesigner-Designs als Vorschau in Dashboard und Fotobox, mit einem Klick als Fotolayout installieren (Betreiber 04.11.2026).
// Gleiche Datei in der Fotobox und im Dashboard. Die Designs liegen nicht im Programm (rund 270 MB, jeden Tag mehr), nur das gewählte kommt ins Ereignis.
// Die Druckvorlage zeichnet das Studio von boothdesigner.de selbst (unsichtbar im iframe, ?install=1): So sieht sie genau aus wie dort und neue Designs
// sind sofort da. Vorlage mit transparenten Fotofeldern über den Fotos, Texte als eigene Ebenen, wie beim Übernehmen einer Einsendung (studio.js).
// DesignKatalog.open({ upload(file) → url, canUse, lockedText, onInstall(layouts, { zip }), design, onBack }) – zip: true = Vorlagen aus einer ZIP-Datei (keine Formate eines Designs);
//   design: Schlüssel – gleich dieses Design öffnen, onBack: „Zurück“ schließt dann den Katalog und ruft onBack (zurück zu „Vorlage wählen“ in event.js)
// DesignKatalog.list() → Promise<Katalog>, DesignKatalog.thumb(key) → Vorschaubild (für „Vorlage wählen“)
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
  // Filter in der Liste (Betreiber 15.11.2026): Papierformat, Ausrichtung, Fotos je Bild, Sortierung. 4×6 Zoll = 10×15 cm, 2×6 = 5×15 cm, 5×5 = 13×13 cm.
  // 6x4-… ist 10×15 quer, der 2×6-Streifen steht hoch, das Quadrat passt zu hoch und quer.
  const META = Object.fromEntries(FORMATS.map(([k, , b]) => [k, { size: k.startsWith('6x4') ? '4x6' : k.slice(0, 3), orient: k.startsWith('6x4') ? 'quer' : k.startsWith('5x5') ? '' : 'hoch', n: parseInt(b, 10) || 1 }]));
  const PREF = ['4x6-04', '6x4-01', '2x6-01', ...FORMATS.map(f => f[0]).filter(k => !['4x6-04', '6x4-01', '2x6-01'].includes(k))]; // Vorschaubild: das übliche Format zuerst
  const SIZES = [['', 'Alle Formate'], ['4x6', '10×15 cm (4×6)'], ['2x6', 'Streifen 5×15 cm (2×6)'], ['5x5', 'Quadrat 13×13 cm (5×5)']];
  const ORIENTS = [['', 'Hoch und quer'], ['hoch', 'Hochformat'], ['quer', 'Querformat']];
  const COUNTS = [['', 'Alle Fotoanzahlen'], ['1', '1 Foto'], ['2', '2 Fotos'], ['3', '3 Fotos'], ['4', '4 und mehr Fotos']];
  const SORTS = [['', 'Empfohlen'], ['name', 'Name A–Z'], ['anlass', 'Anlass A–Z'], ['format', 'Meiste passende Formate']];
  const FKEY = 'fotoboxDesignFilter'; // Fotobox-Einstellungen immer unter fotobox…-Schlüsseln (bleiben nach Updates erhalten)
  const loadFilter = () => { try { const f = JSON.parse(localStorage.getItem(FKEY) || '{}'); return { size: f.size || '', orient: f.orient || '', n: f.n || '', sort: f.sort || '' }; } catch { return { size: '', orient: '', n: '', sort: '' }; } };
  const saveFilter = f => { try { localStorage.setItem(FKEY, JSON.stringify(f)); } catch { /* ohne Speicher: Filter gilt nur jetzt */ } };
  const fits = (f, k) => { const m = META[k]; if (!m) return false;
    return (!f.size || m.size === f.size) && (!f.orient || !m.orient || m.orient === f.orient) && (!f.n || (f.n === '4' ? m.n >= 4 : m.n === +f.n)); };
  const filtered = f => !!(f.size || f.orient || f.n);
  const fitsOf = (f, d) => PREF.filter(k => (d.v || []).includes(k) && fits(f, k));
  // ZIP-Funktion (vorlagen-zip.js) erst laden, wenn sie gebraucht wird – liegt neben dieser Datei, in Fotobox und Dashboard
  const ME = document.currentScript?.src || '';
  let zipP = null;
  const zipLib = () => window.VorlagenZip ? Promise.resolve(window.VorlagenZip) : zipP || (zipP = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = new URL('vorlagen-zip.js?v=20261115-1', ME || location.href).href;
    s.onload = () => window.VorlagenZip ? res(window.VorlagenZip) : rej(new Error('Die ZIP-Funktion fehlt.'));
    s.onerror = () => { zipP = null; s.remove(); rej(new Error('Die ZIP-Funktion konnte nicht geladen werden.')); };
    document.head.appendChild(s);
  }));
  const esc =s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (key, v) => `${BASE()}/beispiele/${v === '4x6-04' ? '' : v === '6x4-01' ? 'quer/' : v + '/'}${encodeURIComponent(key)}.jpg`;
  // Katalog einmal laden und merken (auch für „Vorlage wählen“ in event.js); nach einem Fehler beim nächsten Mal neu versuchen
  // Prüfung 16.11.2026: höchstens 10 Minuten merken (jeden Tag kommen Designs dazu, die Fotobox läuft tagelang); „Design installieren“ lädt immer frisch
  let catP = null, catT = 0;
  const catalog = (fresh = false) => {
    if (!catP || fresh || Date.now() - catT > 600000) { catT = Date.now(); catP = fetch(`${BASE()}/studio/katalog.json`, { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).catch(e => { catP = null; throw e; }); }
    return catP;
  };
  // Anlass-Knöpfe (.dkCats): brechen in mehrere Zeilen um, damit am Laptop ohne Touch alle erreichbar sind (Kundenhinweis November 2026:
  // „Balken zum Blättern nach rechts fehlt“ – die Zeile war seitlich rollbar, der Rollbalken aber versteckt). Mehr als drei Zeilen rollen
  // nach unten (Mausrad). Nur am schmalen Handy bleibt es eine Zeile zum Wischen, jetzt mit sichtbarem schmalem Rollbalken.
  const CSS = `#dkWrap{position:fixed;inset:0;z-index:100000;background:rgba(15,15,20,.6);display:grid;place-items:center;padding:2vmin;color:#1d1d1b;font-size:16px}
  #dkWrap .dkBox{background:#fff;border-radius:16px;width:min(1100px,100%);height:min(92vh,1100px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.45)}
  #dkWrap .dkHead{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #e8e6dc;flex-wrap:wrap}#dkWrap h3{margin:0;font-size:20px;color:#1d1d1b;flex:1;min-width:120px}
  #dkWrap input[type=search],#dkWrap input[type=text]{padding:10px 12px;border:1px solid #cfcdc4;border-radius:10px;font-size:16px;background:#fff;color:#1d1d1b;min-width:0;width:100%;box-sizing:border-box}#dkWrap .dkSearch{flex:1;min-width:150px;max-width:320px}
  #dkWrap button{font:inherit;cursor:pointer}#dkWrap .dkX{border:0;background:#f2f0e8;border-radius:50%;width:42px;height:42px;font-size:22px;line-height:1;color:#1d1d1b}
  #dkWrap .dkCats{display:flex;flex-wrap:wrap;gap:6px;padding:10px 16px;max-height:152px;overflow-y:auto;flex:none;border-bottom:1px solid #f0eee6}#dkWrap .dkCats button{white-space:nowrap;border:1px solid #d8d6cc;background:#fff;border-radius:999px;padding:7px 14px;color:#1d1d1b}#dkWrap .dkCats button.on{background:#1d1d1b;color:#fff;border-color:#1d1d1b}
  #dkWrap .dkBody{flex:1;overflow-y:auto;padding:14px 16px;-webkit-overflow-scrolling:touch}#dkWrap .dkGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
  #dkWrap .dkItem{border:1px solid #e8e6dc;background:#fff;border-radius:12px;padding:8px;text-align:left;display:flex;flex-direction:column;gap:6px;color:#1d1d1b}#dkWrap .dkItem:hover{border-color:#1d1d1b}#dkWrap .dkItem img{width:100%;aspect-ratio:2/3;object-fit:contain;background:#f6f5f0;border-radius:8px}#dkWrap .dkItem b{font-size:14px;font-weight:600}#dkWrap .dkItem small{color:#77756c;font-size:12px}
  #dkWrap .dkFmt{cursor:pointer;position:relative}#dkWrap .dkFmt input{position:absolute;top:14px;left:14px;width:22px;height:22px}#dkWrap .dkFmt.on{border-color:#1d1d1b;box-shadow:0 0 0 2px #1d1d1b}
  #dkWrap .dkFoot{display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid #e8e6dc;flex-wrap:wrap}#dkWrap .dkMsg{flex:1;min-width:160px;font-size:14px;color:#5f5d55}
  #dkWrap .dkGo{background:#f7c838;border:0;border-radius:12px;padding:12px 22px;font-weight:700;color:#1d1d1b}#dkWrap .dkGo:disabled{opacity:.5;cursor:default}#dkWrap .dkBack{background:#fff;border:1px solid #cfcdc4;border-radius:12px;padding:12px 18px;color:#1d1d1b}
  #dkWrap .dkTexts{display:grid;gap:12px;max-width:560px}#dkWrap .dkTexts label{display:grid;gap:4px;font-size:14px;color:#5f5d55}
  #dkWrap .dkFilt{display:flex;gap:8px;padding:10px 16px;flex-wrap:wrap;align-items:center;border-bottom:1px solid #f0eee6;flex:none}#dkWrap .dkFilt select{font:inherit;font-size:15px;padding:8px 10px;border:1px solid #cfcdc4;border-radius:10px;background:#fff;color:#1d1d1b;max-width:100%}#dkWrap .dkFilt select.on{border-color:#1d1d1b;box-shadow:0 0 0 1px #1d1d1b}
  #dkWrap .dkCount{font-size:14px;color:#77756c;margin-left:auto}#dkWrap .dkReset,#dkWrap .dkAll,#dkWrap .dkZip{background:#fff;border:1px solid #cfcdc4;border-radius:10px;padding:8px 12px;color:#1d1d1b;font-size:14px}
  #dkWrap .dkAll{margin:0 0 12px}#dkWrap .dkFmtLbl{font-size:12px;color:#77756c}
  @media(max-width:600px){#dkWrap .dkCats{flex-wrap:nowrap;max-height:none;overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;-webkit-overflow-scrolling:touch}}`;

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

  async function open({ upload, canUse = true, lockedText = '', onInstall, design = '', onBack = null }) {
    if (!document.getElementById('dkCss')) { const st = document.createElement('style'); st.id = 'dkCss'; st.textContent = CSS; document.head.appendChild(st); }
    const w = document.createElement('div'); w.id = 'dkWrap'; w.innerHTML = '<div class="dkBox"></div>'; document.body.appendChild(w);
    let zipRun = 0, zipPk = null; // laufendes Einlesen einer ZIP-Datei (Prüfung 16.11.2026: „Zurück“/Schließen während des Lesens)
    const zipStop = () => { zipRun++; zipPk?.dispose(); zipPk = null; };
    const box = w.firstChild, close = () => { zipStop(); w.remove(); removeEventListener('keydown', esc1); };
    const esc1 = e => { if (e.key === 'Escape') close(); }; addEventListener('keydown', esc1);
    const t0 = performance.now(); // Doppelklick auf eine Kachel in „Vorlage wählen“: der zweite Klick trifft sonst den Hintergrund und schließt gleich wieder
    w.addEventListener('pointerdown', e => { if (e.target === w && performance.now() - t0 > 400) close(); });
    const head = (title, back) => `<div class="dkHead">${back ? '<button class="dkBack" data-back>‹ Zurück</button>' : ''}<h3>${esc(title)}</h3>${back ? '' : '<input class="dkSearch" type="search" placeholder="Design suchen …" data-q><button class="dkZip" data-zip title="Vorlagen aus einer ZIP-Datei übernehmen, z. B. aus einem anderen Fotobox-Programm">ZIP importieren</button>'}<button class="dkX" data-x aria-label="Schließen">×</button></div>`;
    box.innerHTML = head('Designs') + '<div class="dkBody"><p>Designs werden geladen …</p></div>';
    box.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); else if (e.target.closest('[data-zip]')) pickZip(); });
    let list = null;
    try { list = await catalog(!design); } catch { box.querySelector('.dkBody').innerHTML = '<p>Die Designs sind gerade nicht erreichbar. Bitte die Internetverbindung prüfen.</p><p>Vorlagen aus einer ZIP-Datei lassen sich trotzdem übernehmen (Knopf „ZIP importieren“).</p>'; return; }
    let cat = 'Alle', q = '', top = 0;
    const F = loadFilter();
    const cats = ['Alle', ...new Set(list.map(d => d.cat).filter(Boolean))];
    const start = design ? list.find(x => x.key === design) : null;
    const opt = (k, arr) => `<select data-k="${k}" class="${F[k] ? 'on' : ''}" aria-label="${esc(arr[0][1])}">${arr.map(([v, n]) => `<option value="${v}" ${F[k] === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
    function sorted(hit) {
      const by = (a, b) => String(a).localeCompare(String(b), 'de', { sensitivity: 'base' });
      if (F.sort === 'name') return [...hit].sort((a, b) => by(a.name, b.name));
      if (F.sort === 'anlass') return [...hit].sort((a, b) => by(a.occasion || a.cat || '', b.occasion || b.cat || '') || by(a.name, b.name));
      if (F.sort === 'format') return [...hit].sort((a, b) => fitsOf(F, b).length - fitsOf(F, a).length);
      return hit;
    }
    function showList() {
      box.innerHTML = head('Designs') + `<div class="dkCats">${cats.map(c => `<button data-c="${esc(c)}" class="${c === cat ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
        <div class="dkFilt">${opt('size', SIZES)}${opt('orient', ORIENTS)}${opt('n', COUNTS)}${opt('sort', SORTS)}<button class="dkReset" data-reset ${filtered(F) || F.sort ? '' : 'hidden'}>Filter zurücksetzen</button><span class="dkCount"></span></div>
        <div class="dkBody"><div class="dkGrid"></div></div>`;
      const grid = () => {
        const hit = sorted(list.filter(d => (cat === 'Alle' || d.cat === cat) && (`${d.name} ${d.occasion} ${d.cat}`).toLowerCase().includes(q) && fitsOf(F, d).length));
        box.querySelector('.dkCount').textContent = hit.length === 1 ? '1 Design' : `${hit.length} Designs`;
        box.querySelector('.dkGrid').innerHTML = hit.map(d => { const fk = fitsOf(F, d), v = fk[0] || '4x6-04', n = fk.length;
          return `<button class="dkItem" data-d="${esc(d.key)}"><img loading="lazy" src="${img(d.key, v)}" alt=""><b translate="no">${esc(d.name)}</b><small>${esc(d.occasion || d.cat || '')}${filtered(F) ? ` · ${n === 1 ? '1 passendes Format' : `${n} passende Formate`}` : ''}</small></button>`; }).join('')
          || '<p>Kein Design gefunden. Bitte einen anderen Filter wählen.</p>';
      };
      grid();
      const body = box.querySelector('.dkBody'); body.scrollTop = top;
      box.querySelector('.dkCats .on')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }); // gewählter Anlass bleibt sichtbar (Handy: eine Zeile zum Wischen)
      const s = box.querySelector('[data-q]'); s.value = q; s.oninput = () => { q = s.value.toLowerCase().trim(); grid(); };
      box.querySelector('.dkCats').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; cat = b.dataset.c; box.querySelectorAll('[data-c]').forEach(x => x.classList.toggle('on', x === b)); grid(); body.scrollTop = 0; };
      const filt = box.querySelector('.dkFilt');
      filt.onchange = e => { const k = e.target.dataset.k; if (!k) return; F[k] = e.target.value; e.target.classList.toggle('on', !!F[k]); saveFilter(F);
        filt.querySelector('[data-reset]').hidden = !(filtered(F) || F.sort); grid(); body.scrollTop = 0; };
      filt.querySelector('[data-reset]').onclick = () => { Object.assign(F, { size: '', orient: '', n: '', sort: '' }); saveFilter(F); top = 0; showList(); };
      box.querySelector('.dkGrid').onclick = e => { const b = e.target.closest('[data-d]'); if (b) { top = body.scrollTop; showDesign(list.find(d => d.key === b.dataset.d)); } };
    }
    function showDesign(d, all = false, pick = null) {
      const avail = FORMATS.filter(([k]) => (d.v || []).includes(k)), fitK = new Set(fitsOf(F, d)), only = filtered(F) && !all;
      const have = only ? avail.filter(([k]) => fitK.has(k)) : avail;
      if (only && pick) { for (const k of [...pick]) if (!fitK.has(k)) pick.delete(k); if (!pick.size) pick = null; } // ausgeblendete Formate nicht mitinstallieren
      // Vorauswahl: ohne Filter 4×6 hoch + quer wie bisher, mit Filter das erste passende Format
      pick = pick || new Set(filtered(F) ? [...fitK].slice(0, 1) : avail.filter(([k]) => k === '4x6-04' || k === '6x4-01').map(([k]) => k));
      const rest = avail.length - have.length;
      box.innerHTML = head(d.name, true) + `<div class="dkBody">${filtered(F) ? `<button class="dkAll" data-all>${only ? `Alle Formate zeigen (${rest} weitere)` : 'Nur passende Formate zeigen'}</button>` : ''}<div class="dkGrid">${have.map(([k, a, b]) => `<label class="dkItem dkFmt ${pick.has(k) ? 'on' : ''}"><input type="checkbox" data-f="${k}" ${pick.has(k) ? 'checked' : ''}><img loading="lazy" src="${img(d.key, k)}" alt=""><b>${esc(a)}</b><small>${esc(b)}</small></label>`).join('')}</div></div>
        <div class="dkFoot"><div class="dkMsg"></div><button class="dkGo">Installieren</button></div>`;
      const msg = box.querySelector('.dkMsg'), go = box.querySelector('.dkGo');
      const sync = () => { msg.textContent = !canUse ? lockedText : pick.size ? `${pick.size} von höchstens ${MAX} Formaten gewählt` : 'Bitte mindestens ein Format wählen.'; go.disabled = !canUse || !pick.size; };
      sync();
      box.querySelector('[data-back]').onclick = start && onBack ? () => { close(); onBack(); } : showList;
      const allB = box.querySelector('[data-all]'); if (allB) allB.onclick = () => showDesign(d, only, pick);
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
    // Vorlagen aus einer ZIP-Datei: eigene Sicherung (Exportieren im Fotolayout) oder Vorlagen-Paket aus einem anderen Programm (PNG-Rahmen mit
    // durchsichtigen Fotofeldern). Erst Vorschau zum Auswählen, hochgeladen wird nur, was übernommen wird.
    function pickZip() {
      const i = document.createElement('input'); i.type = 'file'; i.accept = '.zip,application/zip,application/x-zip-compressed';
      i.onchange = () => { const f = i.files[0]; if (f) showZip(f); }; i.click();
    }
    async function showZip(file) {
      box.innerHTML = head('Vorlagen aus ZIP', true) + `<div class="dkBody"><p data-st style="margin-top:0">ZIP-Datei wird gelesen …</p><div class="dkGrid"></div></div>
        <div class="dkFoot"><div class="dkMsg"></div><button class="dkGo" disabled>Übernehmen</button></div>`;
      zipStop(); const run = zipRun, alive = () => run === zipRun && w.isConnected; let pk = null;
      const back = () => { zipStop(); list ? showList() : close(); };
      box.querySelector('[data-back]').onclick = back;
      const st = box.querySelector('[data-st]'), msg = box.querySelector('.dkMsg'), go = box.querySelector('.dkGo');
      try { pk = await (await zipLib()).read(file, { onStep: t => { st.textContent = t; } }); }
      catch (e) { st.textContent = '⚠️ ' + e.message; return; }
      if (!alive()) { pk.dispose(); return; } // inzwischen „Zurück“ oder geschlossen: nichts mehr in die Liste schreiben
      zipPk = pk;
      if (!pk.items.length) { st.textContent = '⚠️ ' + pk.summary; return; }
      st.textContent = pk.summary;
      const pick = new Set(pk.items.map((it, i) => it.skip ? -1 : i).filter(i => i >= 0));
      box.querySelector('.dkGrid').innerHTML = pk.items.map((it, i) => `<label class="dkItem dkFmt ${pick.has(i) ? 'on' : ''}"><input type="checkbox" data-i="${i}" ${pick.has(i) ? 'checked' : ''}>
        <img src="${esc(it.preview)}" alt=""><b translate="no">${esc(it.layout.name)}</b><small>${esc(it.info)}</small></label>`).join('');
      const sync = () => { msg.textContent = pick.size ? `${pick.size} von ${pk.items.length} Vorlagen gewählt` : 'Bitte mindestens eine Vorlage wählen.'; go.disabled = !pick.size; };
      sync();
      box.querySelector('.dkGrid').onchange = e => { const i = +e.target.dataset.i; if (e.target.dataset.i == null) return; e.target.checked ? pick.add(i) : pick.delete(i); e.target.closest('.dkFmt').classList.toggle('on', e.target.checked); sync(); };
      go.onclick = async () => {
        go.disabled = true;
        try {
          const Ls = await pk.finish([...pick].sort((a, b) => a - b), { upload, onStep: t => { if (alive()) msg.textContent = t; } });
          if (!alive()) return; // während des Hochladens „Zurück“ oder geschlossen: nicht übernehmen
          close(); onInstall(Ls, { zip: true });
        } catch (e) { if (alive()) { msg.textContent = '⚠️ ' + e.message; go.disabled = false; } }
      };
    }
    if (start) showDesign(start, true); else showList(); // direkt geöffnet: alle Formate, der gespeicherte Filter gilt nur in der Liste
  }
  // thumb(d): Vorschau im ersten vorhandenen Format (ein reines Streifen-Design hat kein 4×6-Bild)
  return { open, list: () => catalog(), thumb: d => typeof d === 'string' ? img(d, '4x6-04') : img(d.key, PREF.find(k => (d.v || []).includes(k)) || '4x6-04') };
})();
