// FotoBox – eigene Farbauswahl für Touch-Bildschirme (gleiche Datei in app-desktop/app/farbwahl.js und dashboard/farbwahl.js)
// Anlass 17.11.2026: Kunde an einer Touch-Fotobox (Windows) – die eingebaute Auswahl von <input type="color"> ist klein,
// liegt über anderen Feldern und will die Werte R/G/B per Tastatur. Diese Datei fängt JEDES Farbfeld der Seite ab (auch
// später per Skript erzeugte, z. B. im Layout-Editor) und öffnet stattdessen ein großes Fenster: Vorschlagsfarben,
// zuletzt benutzte Farben, große Regler für Farbton, Helligkeit und Farbkraft (mit − / +), Vorschau alt/neu,
// „Abbrechen“ und „Übernehmen“. Bedienbar nur mit dem Finger. Übernehmen setzt value und löst „input“ und „change“ aus –
// genau wie die eingebaute Auswahl, die vorhandenen Programmteile brauchen also keine Änderung.
// Ausnahme: data-native-color am Feld behält die eingebaute Auswahl.
//   Farbwahl.open(input)   – Fenster für ein Farbfeld öffnen (sonst geschieht das beim Antippen von selbst)
//   Farbwahl.close(apply)  – offenes Fenster schließen (apply = übernehmen)
(function (G) {
  'use strict';
  if (G.Farbwahl) return;
  const D = G.document;
  // Vorschläge: Farben der Bildschirm-Themen (render.js SCREEN_THEMES) und Grundfarben, hell → dunkel je Farbfamilie
  const VORSCHLAG = ['#ffffff', '#eef0f3', '#d8dee8', '#a3a39b', '#4a4a45', '#1d1d1b', '#000000',
    '#f7c838', '#ffd60a', '#e0b64a', '#c9a45c', '#f1dfae', '#f3e7d3', '#d9c2a0', '#4a3b28',
    '#ffd56b', '#ff7b54', '#d23b3b', '#c1121f', '#7f1d1d', '#fbe9ec', '#e8b7c0', '#f72585', '#7a3b4a',
    '#7b2ff7', '#3a0ca3', '#4cc9f0', '#5b8fa8', '#1b4b7a', '#0d1b2a',
    '#b5e48c', '#8fb56a', '#a9c0a2', '#33452f', '#14532d', '#0b3d2e'];
  const KEY = 'fotobox_farben_zuletzt', MAXZ = 12;
  const css = `
#fwDlg{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);
  font-family:inherit;color:#fff;-webkit-user-select:none;user-select:none;touch-action:manipulation;padding:max(8px,2vmin)}
#fwDlg *{box-sizing:border-box}
#fwDlg .fwBox{width:min(760px,100%);max-height:100%;overflow:auto;background:#1c1c1a;border:1px solid #33332f;border-radius:22px;
  padding:clamp(14px,2.6vmin,26px);box-shadow:0 20px 60px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:clamp(12px,2vmin,18px)}
#fwDlg h3{margin:0;font-size:clamp(20px,2.6vmin,28px);font-weight:700;line-height:1.2}
#fwDlg h3 span{color:#F7C838}
#fwDlg .fwTop{display:flex;gap:14px;align-items:stretch}
#fwDlg .fwPrev{flex:1;display:flex;height:clamp(64px,10vmin,96px);border-radius:16px;overflow:hidden;border:2px solid #33332f}
#fwDlg .fwPrev div{flex:1;display:flex;align-items:flex-end;padding:6px 10px;font-size:13px;font-weight:600}
#fwDlg .fwPrev .fwOld{flex:.45}
#fwDlg .fwHex{min-width:120px;display:flex;flex-direction:column;justify-content:center;gap:4px;font-size:13px;color:#a3a39b}
#fwDlg .fwHex input{width:130px;height:48px;border-radius:12px;border:1px solid #33332f;background:#111110;color:#fff;font:600 18px/1 monospace;
  padding:0 10px;text-transform:lowercase;-webkit-user-select:text;user-select:text}
#fwDlg .fwLab{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:#a3a39b;font-weight:700;margin:0 0 8px}
#fwDlg .fwGrid{display:grid;grid-template-columns:repeat(12,1fr);gap:10px}
#fwDlg .fwGrid button{aspect-ratio:1;min-height:48px;border-radius:14px;border:2px solid rgba(255,255,255,.18);cursor:pointer;padding:0;position:relative}
#fwDlg .fwGrid button.on{border-color:#F7C838;box-shadow:0 0 0 3px #F7C838}
#fwDlg .fwGrid button.on::after{content:'✓';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 24px/1 sans-serif;
  color:var(--fwc,#fff);text-shadow:0 0 4px rgba(0,0,0,.35)}
#fwDlg .fwRow{display:flex;align-items:center;gap:10px}
#fwDlg .fwStep{flex:none;width:60px;height:60px;border-radius:16px;border:1px solid #33332f;background:#2a2a27;color:#fff;font:700 30px/1 sans-serif;cursor:pointer}
#fwDlg .fwStep:active{background:#3a3a36}
#fwDlg .fwTrack{flex:1;position:relative;height:60px;border-radius:30px;cursor:pointer;touch-action:none;border:2px solid rgba(255,255,255,.18);outline:none}
#fwDlg .fwTrack:focus-visible{box-shadow:0 0 0 3px #F7C838}
#fwDlg .fwKnob{position:absolute;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:5px solid #fff;
  box-shadow:0 2px 10px rgba(0,0,0,.6);pointer-events:none}
#fwDlg .fwBtns{display:flex;gap:14px;margin-top:4px}
#fwDlg .fwBtns button{flex:1;min-height:68px;border-radius:18px;font-family:inherit;font-weight:700;font-size:clamp(18px,2.4vmin,24px);line-height:1.1;cursor:pointer;border:1px solid #33332f}
#fwDlg .fwNo{background:#2a2a27;color:#fff}
#fwDlg .fwOk{background:#F7C838;border-color:#F7C838!important;color:#1D1D1B}
@media(max-width:800px){#fwDlg .fwGrid{grid-template-columns:repeat(9,1fr)}}
@media(max-width:520px){#fwDlg .fwTop{flex-direction:column}#fwDlg .fwPrev{flex:none}#fwDlg .fwHex{flex-direction:row;align-items:center}#fwDlg .fwStep{width:48px;height:48px}
  #fwDlg .fwGrid{grid-template-columns:repeat(6,1fr);gap:8px}#fwDlg .fwGrid button{min-height:44px}}
input[type=color]:not([data-native-color]){cursor:pointer}
@media(any-pointer:coarse){input[type=color]:not([data-native-color]){min-height:44px}}`;

  // ---------- Farbrechnung (HSL: Farbton 0–360, Farbkraft und Helligkeit 0–100) ----------
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  function norm(v) {
    let s = String(v || '').trim().toLowerCase();
    if (/^#?[0-9a-f]{3}$/.test(s)) s = s.replace(/^#?(.)(.)(.)$/, '#$1$1$2$2$3$3');
    if (/^[0-9a-f]{6}$/.test(s)) s = '#' + s;
    return /^#[0-9a-f]{6}$/.test(s) ? s : '';
  }
  function toHsl(hex) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
    }
    return { h, s: s * 100, l: l * 100 };
  }
  function toHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
    return '#' + [f(0), f(8), f(4)].map(x => clamp(x, 0, 255).toString(16).padStart(2, '0')).join('');
  }
  const ink = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16 & 255) * 299 + (n >> 8 & 255) * 587 + (n & 255) * 114) / 1000 > 150 ? '#1D1D1B' : '#ffffff'; };
  function recent() { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a.map(norm).filter(Boolean).slice(0, MAXZ) : []; } catch { return []; } }
  function remember(hex) { try { localStorage.setItem(KEY, JSON.stringify([hex, ...recent().filter(x => x !== hex)].slice(0, MAXZ))); } catch {} }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function labelOf(inp) {
    const l = inp.labels?.[0] || (inp.previousElementSibling?.tagName === 'LABEL' ? inp.previousElementSibling : null)
      || inp.parentElement?.querySelector(':scope > label') || inp.closest('div')?.querySelector('label');
    return (l?.textContent || inp.getAttribute('aria-label') || inp.title || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  }

  // ---------- Fenster ----------
  let dlg = null, inp = null, old = '', cur = { h: 0, s: 0, l: 0 }, hex = '#000000', keyH = null, held = null, heldStep = false;
  const stopHold = () => { if (held) { clearTimeout(held.t1); clearInterval(held.t2); held = null; } };
  const SL = [ // Regler: Schlüssel, Name, Bereich, Schritt der − / + Knöpfe, Verlauf
    ['h', 'Farbton', 360, 4, () => 'linear-gradient(90deg,' + [0, 60, 120, 180, 240, 300, 360].map(h => toHex(h, Math.max(cur.s, 70), clamp(cur.l, 35, 65))).join(',') + ')'],
    ['l', 'Helligkeit', 100, 3, () => `linear-gradient(90deg,#000,${toHex(cur.h, cur.s, 50)},#fff)`],
    ['s', 'Farbkraft', 100, 4, () => `linear-gradient(90deg,${toHex(cur.h, 0, cur.l)},${toHex(cur.h, 100, cur.l)})`],
  ];
  function build() {
    const z = recent();
    dlg = D.createElement('div'); dlg.id = 'fwDlg'; dlg.setAttribute('data-ui', ''); dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true');
    const lab = labelOf(inp);
    dlg.innerHTML = `<div class="fwBox">
      <h3>Farbe wählen${lab ? `<span translate="no"> · ${esc(lab)}</span>` : ''}</h3>
      <div class="fwTop"><div class="fwPrev"><div class="fwOld"><span>Vorher</span></div><div class="fwNew"><span>Neu</span></div></div>
        <label class="fwHex"><span>Farbcode</span><input type="text" maxlength="7" spellcheck="false" autocomplete="off" translate="no"></label></div>
      <div><p class="fwLab">Vorschläge</p><div class="fwGrid" data-fw="sw">${VORSCHLAG.map(c => `<button type="button" data-c="${c}" style="background:${c};--fwc:${ink(c)}" aria-label="${c}"></button>`).join('')}</div></div>
      ${z.length ? `<div><p class="fwLab">Zuletzt benutzt</p><div class="fwGrid" data-fw="sw">${z.map(c => `<button type="button" data-c="${c}" style="background:${c};--fwc:${ink(c)}" aria-label="${c}"></button>`).join('')}</div></div>` : ''}
      ${SL.map(([k, name, max]) => `<div><p class="fwLab">${name}</p><div class="fwRow"><button type="button" class="fwStep" data-step="${k}" data-d="-1" aria-label="weniger">−</button>
        <div class="fwTrack" data-k="${k}" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="${max}"><div class="fwKnob"></div></div>
        <button type="button" class="fwStep" data-step="${k}" data-d="1" aria-label="mehr">+</button></div></div>`).join('')}
      <div class="fwBtns"><button type="button" class="fwNo" data-fw="no">Abbrechen</button><button type="button" class="fwOk" data-fw="ok">Farbe übernehmen</button></div></div>`;
    dlg.querySelector('.fwOld').style.cssText = `background:${old};color:${ink(old)}`;
    dlg.addEventListener('click', onClick);
    dlg.addEventListener('keydown', ev => ev.stopPropagation()); // Tasten nie an die Seite dahinter (Layout-Editor: Pfeile verschieben, Entf löscht, Strg+Z)
    dlg.addEventListener('contextmenu', ev => ev.preventDefault()); // lange Berührung: kein Menü
    dlg.querySelector('.fwHex input').addEventListener('input', ev => { const v = norm(ev.target.value); if (v) setHex(v, true); });
    dlg.querySelectorAll('.fwTrack').forEach(t => {
      t.addEventListener('pointerdown', ev => { ev.preventDefault(); t.setPointerCapture?.(ev.pointerId); t.focus({ preventScroll: true }); drag(t, ev); });
      t.addEventListener('pointermove', ev => { if (t.hasPointerCapture?.(ev.pointerId)) drag(t, ev); });
      t.addEventListener('keydown', ev => { const d = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[ev.key]; if (d) { ev.preventDefault(); step(t.dataset.k, d); } });
    });
    // − / + gedrückt halten = weiterzählen
    dlg.querySelectorAll('.fwStep').forEach(b => {
      b.addEventListener('pointerdown', () => { stopHold(); heldStep = false; const h = held = { t1: setTimeout(() => { h.t2 = setInterval(() => { heldStep = true; step(b.dataset.step, +b.dataset.d); }, 70); }, 450), t2: 0 }; });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => b.addEventListener(e, stopHold));
    });
    D.body.appendChild(dlg);
  }
  function drag(t, ev) {
    const r = t.getBoundingClientRect(), k = t.dataset.k, max = k === 'h' ? 360 : 100;
    cur[k] = clamp((ev.clientX - r.left - 4) / Math.max(1, r.width - 8), 0, 1) * max;
    if (k === 'h' && cur[k] >= 360) cur[k] = 359.9;
    if (k !== 'l') lift(k);
    fromCur();
  }
  function step(k, d) {
    if (!dlg) return stopHold();
    const s = SL.find(x => x[0] === k), max = s[2];
    lift(k);
    cur[k] = k === 'h' ? (cur[k] + d * s[3] + 360) % 360 : clamp(cur[k] + d * s[3], 0, max);
    fromCur();
  }
  // Bei Schwarz/Weiß/Grau zeigen Farbton und Farbkraft sonst keine Wirkung: dann erst Helligkeit bzw. Farbkraft in die Mitte holen
  function lift(k) {
    if (k === 'l') return;
    if (cur.l < 3 || cur.l > 97) cur.l = 50;
    if (k === 'h' && cur.s < 3) cur.s = 70;
  }
  function fromCur() { hex = toHex(cur.h, cur.s, cur.l); paint(false); }
  function setHex(v, keepField) {
    hex = v; const n = toHsl(v);
    cur = { h: n.s < 0.5 || n.l < 0.5 || n.l > 99.5 ? cur.h : n.h, s: n.s, l: n.l }; // bei Grau/Schwarz/Weiß den Farbton behalten
    paint(keepField);
  }
  function paint(keepField) {
    if (!dlg) return;
    const nw = dlg.querySelector('.fwNew'); nw.style.cssText = `background:${hex};color:${ink(hex)}`;
    const f = dlg.querySelector('.fwHex input'); if (!keepField) f.value = hex;
    for (const [k, , max, , grad] of SL) {
      const t = dlg.querySelector(`.fwTrack[data-k="${k}"]`), kn = t.firstElementChild;
      t.style.background = grad();
      kn.style.left = `calc(4px + (100% - 8px) * ${cur[k] / max})`;
      kn.style.background = k === 'h' ? toHex(cur.h, Math.max(cur.s, 70), clamp(cur.l, 35, 65)) : hex;
      t.setAttribute('aria-valuenow', Math.round(cur[k]));
    }
    dlg.querySelectorAll('[data-c]').forEach(b => b.classList.toggle('on', b.dataset.c === hex));
  }
  function onClick(ev) {
    const b = ev.target.closest('button');
    // daneben tippen schließt NICHT (an der Fotobox zu leicht aus Versehen) – nur „Abbrechen“/„Übernehmen“
    if (!b) return;
    if (b.dataset.c) return setHex(b.dataset.c);
    if (b.dataset.step) { if (heldStep) { heldStep = false; return; } return step(b.dataset.step, +b.dataset.d); }
    if (b.dataset.fw === 'ok') return close(true);
    if (b.dataset.fw === 'no') return close(false);
  }
  let inpSel = '';
  function selOf(el) { // eindeutiger Weg zum Feld, falls es neu gezeichnet wird
    if (el.id) return '#' + CSS.escape(el.id);
    for (const a of ['data-tc', 'data-p', 'data-L', 'data-s']) if (el.hasAttribute(a)) { const q = `input[type=color][${a}="${CSS.escape(el.getAttribute(a))}"]`; if (D.querySelectorAll(q).length === 1) return q; }
    return '';
  }
  function open(el) {
    if (!el || el.disabled || el.readOnly) return;
    if (dlg) close(false);
    inp = el; inpSel = selOf(el); old = norm(el.value) || '#000000'; hex = old; cur = toHsl(old);
    if (!D.getElementById('fwCss')) { const s = D.createElement('style'); s.id = 'fwCss'; s.textContent = css; D.head.appendChild(s); }
    build(); setHex(old);
    keyH = ev => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); close(false); } else if (ev.key === 'Enter' && ev.target.closest?.('.fwHex, .fwTrack')) { ev.preventDefault(); ev.stopPropagation(); close(true); } };
    D.addEventListener('keydown', keyH, true);
    dlg.querySelector('[data-fw=ok]').focus({ preventScroll: true });
  }
  function close(apply) {
    if (!dlg) return;
    let el = inp; const v = hex, changed = apply && v !== old, sel = inpSel;
    stopHold(); D.removeEventListener('keydown', keyH, true);
    if (el && !el.isConnected && sel) el = D.querySelector(sel) || el; // Feld wurde inzwischen neu gezeichnet (Editor, Abgleich)
    dlg.remove(); dlg = null; inp = null;
    if (apply) remember(v);
    if (changed && el) {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    try { el?.focus({ preventScroll: true }); } catch {}
  }
  // Jedes Farbfeld abfangen: der Klick (auch per Tastatur oder über das zugehörige <label>) öffnet sonst die eingebaute Auswahl
  D.addEventListener('click', ev => {
    const t = ev.target;
    if (!(t instanceof HTMLInputElement) || t.type !== 'color' || t.hasAttribute('data-native-color')) return;
    ev.preventDefault();
    open(t);
  }, true);
  if (!D.getElementById('fwCss')) { const s = D.createElement('style'); s.id = 'fwCss'; s.textContent = css; (D.head || D.documentElement).appendChild(s); }
  G.Farbwahl = { open, close, isOpen: () => !!dlg, _hex: { toHsl, toHex, norm } };
})(window);
