// Photobox Memories – Event-Arbeitsbereich (Aufbau wie bei LumaBooth: Seitenleiste mit allen Bereichen)
// EventWS.open(eventRow, { sb, me, toast, uploadFile(file) → url, devices, leadsCount, onClose, onDelete })
(function (G) {
  'use strict';
  const CSS = `
  #ws{position:fixed;inset:0;z-index:40;background:#f4f4f7;color:#1d1d24;display:flex;flex-direction:column;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  #ws *{box-sizing:border-box}
  #ws .wtop{height:58px;background:#1D1D1B;color:#fff;display:flex;align-items:center;gap:14px;padding:0 18px;flex:none}
  #ws .wtop .logo{font-weight:800;font-size:19px}#ws .wtop .logo span{color:#F7C838}
  #ws .wtop .en{font-weight:600;opacity:.9}
  #ws .wtop .st{font-size:12px;opacity:.7}
  #ws .tb{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:7px 12px;cursor:pointer;font:inherit}
  #ws .sp{flex:1}
  #ws .wbody{flex:1;display:flex;min-height:0}
  #ws nav.side{width:250px;background:#fff;border-right:1px solid #e6e6ec;overflow:auto;padding:12px 0;flex:none}
  #ws nav.side .back{display:block;padding:8px 18px 14px;color:#444;cursor:pointer;font-size:13px}
  #ws nav.side h6{margin:16px 18px 6px;font-size:12px;letter-spacing:.06em;color:#222;text-transform:uppercase}
  #ws nav.side a{display:flex;gap:10px;align-items:center;padding:9px 18px;color:#333;cursor:pointer;border-left:3px solid transparent;text-decoration:none}
  #ws nav.side a:hover{background:#FFFAEA}
  #ws nav.side a.on{background:#FFF3C4;border-left-color:#F7C838;font-weight:600}
  #ws main.wm{flex:1;overflow:auto;padding:22px 28px 80px}
  #ws h1,#ws h2,#wsModal h3,#ws .wtop .en{font-family:Fredoka,system-ui,sans-serif}
  #ws .ico-svg{vertical-align:-4px;flex:none}
  #ws h1{font-size:22px;margin:0 0 14px;display:flex;align-items:center;gap:12px}
  #ws h2{font-size:17px;margin:22px 0 10px;display:flex;align-items:center;gap:10px}
  #ws .card{background:#fff;border:0;border-radius:14px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.06);max-width:620px;margin-bottom:14px}
  #ws .cols{display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap}
  #ws .cols>.left{flex:1;min-width:340px;max-width:620px}
  #ws .pv{width:380px;flex:none;position:sticky;top:0}
  #ws .pv .frame{background:#fff;border-radius:14px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  #ws .pv canvas{width:100%;display:block;border-radius:6px;background:#eee}
  #ws .tabs{display:flex;gap:6px;border-bottom:1px solid #e3e3ea;margin-bottom:14px;max-width:620px}
  #ws .tabs button{background:none;border:0;padding:10px 14px;cursor:pointer;font:inherit;color:#555;border-bottom:3px solid transparent}
  #ws .tabs button.on{color:#1D1D1B;border-color:#F7C838;font-weight:700}
  #ws label.l{display:block;font-size:13px;color:#555;margin:12px 0 5px}
  #ws input[type=text],#ws input[type=number],#ws input[type=date],#ws select,#ws textarea{width:100%;border:1px solid #dcdce4;border-radius:8px;padding:8px 10px;font:inherit;background:#fff;color:#1d1d24}
  #ws input[type=color]{width:52px;height:36px;border:1px solid #dcdce4;border-radius:8px;padding:2px;background:#fff}
  #ws .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  #ws .between{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0}
  #ws .between small{display:block;color:#777;font-size:12px}
  #ws .sw{position:relative;width:42px;height:24px;flex:none;cursor:pointer}
  #ws .sw input{display:none}
  #ws .sw i{position:absolute;inset:0;background:#cfcfd8;border-radius:12px;transition:.15s}
  #ws .sw i:after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.15s}
  #ws .sw input:checked+i{background:#F7C838}#ws .sw input:checked+i:after{left:21px}
  #ws .swl{font-size:12px;color:#666;min-width:22px}
  #ws .slider{display:grid;grid-template-columns:1fr 64px 26px;gap:10px;align-items:center}
  #ws .slider input[type=range]{accent-color:#F7C838;width:100%}
  #ws .btn{border:2px solid #F7C838;color:#1D1D1B;background:#fff;border-radius:999px;padding:8px 18px;cursor:pointer;font:inherit;font-weight:600}
  #ws .btn.pri{background:#F7C838;color:#1D1D1B}
  #ws .btn.sm{padding:5px 12px;font-size:13px}
  #ws .ghost{border:1px solid #dcdce4;background:#fff;border-radius:8px;padding:7px 12px;cursor:pointer;font:inherit}
  #ws .lays{display:flex;gap:12px;flex-wrap:wrap;margin:14px 0}
  #ws .lay{width:150px;border:2px solid #eee;border-radius:10px;padding:8px;background:#fafafc;cursor:pointer;position:relative}
  #ws .lay:hover{border-color:#F7C838}
  #ws .lay img{width:100%;height:150px;object-fit:contain;display:block}
  #ws .lay .nm{font-size:12px;margin-top:6px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ws .lay .acts{position:absolute;top:4px;right:4px;display:flex;gap:2px}
  #ws .lay .acts button{background:#fff;border:1px solid #ddd;border-radius:6px;cursor:pointer;padding:2px 6px;font-size:12px}
  #ws .empty{border:1px dashed #d0d0da;border-radius:10px;padding:26px;text-align:center;color:#888;background:#fafafc}
  #ws .dd{position:relative;display:inline-block}
  #ws .dd .menu{position:absolute;top:110%;left:0;background:#fff;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.15);padding:6px;min-width:190px;z-index:5}
  #ws .dd .menu button{display:block;width:100%;text-align:left;background:none;border:0;padding:9px 12px;border-radius:6px;cursor:pointer;font:inherit}
  #ws .dd .menu button:hover{background:#FFF3C4}
  #ws .modes{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;max-width:620px;margin-bottom:14px}
  #ws .mode{display:flex;align-items:center;gap:12px;padding:14px;border-radius:12px;background:#fff;border:2px solid transparent;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  #ws .mode.on{background:#1D1D1B;color:#F7C838}
  #ws .mode .ic{font-size:22px}#ws .mode .dot{margin-left:auto;width:10px;height:10px;border-radius:50%;background:#ccc}
  #ws .mode .dot.a{background:#30c46b}
  #ws .filters{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  #ws .flt{position:relative;border-radius:10px;overflow:hidden;cursor:pointer;border:3px solid transparent}
  #ws .flt.on{border-color:#F7C838}
  #ws .flt img{width:100%;display:block;aspect-ratio:1}
  #ws .flt span{position:absolute;left:0;right:0;bottom:0;padding:4px 6px;color:#fff;font-size:12px;background:linear-gradient(transparent,rgba(0,0,0,.6))}
  #ws .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:900px}
  #ws .stat{background:#fff;border-radius:12px;padding:14px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  #ws .stat b{display:block;font-size:26px}
  #ws .soon{display:inline-block;font-size:11px;background:#FFF3C4;color:#8a6400;border-radius:999px;padding:2px 8px;margin-left:6px;font-weight:600}
  #ws .thumbs{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  #ws .thumbs div{position:relative}#ws .thumbs img{height:70px;border-radius:6px;display:block}
  #ws .thumbs button{position:absolute;top:2px;right:2px;border:0;background:rgba(0,0,0,.6);color:#fff;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:11px}
  #wsModal{position:fixed;inset:0;background:rgba(20,16,40,.55);z-index:60;display:flex;align-items:center;justify-content:center;font:14px system-ui,sans-serif;color:#1d1d24}
  #wsModal .box{background:#fff;border-radius:16px;width:min(1000px,94vw);height:min(720px,92vh);display:flex;flex-direction:column;overflow:hidden}
  #wsModal .mh{padding:16px 20px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:12px}
  #wsModal .mh h3{margin:0;font-size:20px;flex:1}
  #wsModal .mh input{border:1px solid #ddd;border-radius:8px;padding:7px 10px;width:220px;font:inherit}
  #wsModal .x{background:none;border:0;font-size:22px;cursor:pointer;color:#666}
  #wsModal .cats{display:flex;gap:6px;padding:10px 20px;flex-wrap:wrap}
  #wsModal .cats button{border:1px solid #ddd;background:#fff;border-radius:999px;padding:5px 12px;cursor:pointer;font:inherit;font-size:13px}
  #wsModal .cats button.on{background:#F7C838;border-color:#F7C838;color:#1D1D1B}
  #wsModal .grid{flex:1;overflow:auto;padding:10px 20px 20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
  #wsModal .tp{cursor:pointer;text-align:center;font-size:13px}
  #wsModal .tp img{width:100%;aspect-ratio:1;object-fit:contain;background:#f6f6f8;border-radius:10px;border:2px solid transparent}
  #wsModal .tp:hover img{border-color:#F7C838}
  #wsModal .two{flex:1;display:flex;min-height:0}
  #wsModal .fl{width:280px;overflow:auto;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;align-content:start;border-right:1px solid #eee}
  #wsModal .fi{border:2px solid #eee;border-radius:10px;padding:6px;cursor:pointer;font-size:11px;text-align:center}
  #wsModal .fi.on{border-color:#F7C838}
  #wsModal .fi img{width:100%;height:90px;object-fit:contain}
  #wsModal .bigpv{flex:1;display:flex;flex-direction:column;padding:16px;background:#f6f6f8}
  #wsModal .bigpv img{flex:1;min-height:0;object-fit:contain;width:100%}
  #wsModal .ft{display:flex;align-items:center;justify-content:space-between;padding-top:12px}
  #wsModal .et{display:flex;align-items:center;gap:14px;border:1px solid #e3e3ea;border-radius:12px;padding:12px 14px;margin:0 20px 8px;cursor:pointer;background:#fff;text-align:left;font:inherit;width:calc(100% - 40px)}
  #wsModal .et:hover{border-color:#F7C838;background:#FFFAEA}
  #wsModal .et .ei{width:46px;height:46px;border-radius:10px;background:#FFF3C4;display:flex;align-items:center;justify-content:center;color:#1D1D1B;flex:none}
  #wsModal .et b{display:block;font-family:Fredoka,system-ui,sans-serif;letter-spacing:.02em}#wsModal .et small{color:#777}
  #wsModal .et[disabled]{opacity:.5;cursor:default}
  #wsModal .sec{margin:14px 20px 8px;font-size:12px;letter-spacing:.06em;color:#555}
  #wsModal .btn{border:1px solid #F7C838;background:#F7C838;color:#1D1D1B;border-radius:999px;padding:9px 20px;cursor:pointer;font:inherit;font-weight:600}
  `;
  const $ = (r, s) => r.querySelector(s), $$ = (r, s) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const getP = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
  const setP = (o, p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((a, k) => (a[k] ??= {}), o)[last] = v; };
  const FILTERS = [['normal', 'Original', 'none'], ['bw', 'Schwarz-Weiß', 'grayscale(1) contrast(1.15)'], ['vintage', 'Vintage', 'sepia(.35) contrast(1.1) saturate(1.2) brightness(1.05)'],
    ['warm', 'Warm', 'sepia(.18) saturate(1.3) brightness(1.04)'], ['cool', 'Kühl', 'saturate(.9) hue-rotate(12deg) brightness(1.05)'], ['glam', 'Glamour', 'brightness(1.12) contrast(1.08) saturate(1.1)']];
  const DEF = {
    title: '', subtitle: '', startText: 'Tippen zum Starten', accent: '#F7C838', attractUrl: '', attractType: '', attractFit: 'cover', font: 'modern', frame: '#ffffff', textColor: '#222222', template: 'classic',
    layouts: [], guestLayouts: false, gifFromPhotos: false,
    countdown: 3, countdownNext: 3, between: 2, autoReturn: 30, sound: true, mirror: true, mirrorPhoto: false, cropLive: true,
    modes: { single: true, strip: true, grid: true, gif: true, boomerang: true, video: true }, gifFrames: 4, boomerangLen: 'mittel', videoSecs: 10, videoAudio: true,
    voice: false, beauty: false, beautyStrength: 40, filtersOn: true, filters: FILTERS.map(f => f[0]), stickers: true,
    bgMode: 'off', keyStrength: 50, bgUrls: [], bgGuestChoice: true,
    form: { enabled: false, name: true, email: true, phone: false, newsletter: false, text: 'Ich bin einverstanden, dass meine Fotos gespeichert und für dieses Event verwendet werden.' },
    share: true, autoPrint: false, printButton: true, askCopies: false, maxCopies: 3, printLimit: 0, copies: 1
  };
  const NAV = [
    ['dash', 'dashboard', 'Dashboard'],
    ['h', 'Grundlagen'], ['layout', 'aperture', 'Photo booth experience'], ['capture', 'sliders', 'Aufnahmeeinstellungen'], ['voice', 'mic', 'Virtueller Berater'],
    ['h', 'Erweiterte Einstellungen'], ['start', 'monitor', 'Startbildschirm'], ['fx', 'sparkles', 'Filter & Effekte'], ['bg', 'wand', 'Hintergrundentfernung'],
    ['ai', 'user', 'KI-Porträts'], ['survey', 'clipboard', 'Umfrage & Haftungsausschluss'],
    ['h', 'Drucken & Teilen'], ['share', 'share', 'Einstellungen für Teilen'], ['print', 'printer', 'Druckeinstellungen'], ['gallery', 'gallery', 'Online-Galerie']
  ];

  function open(ev, ctx) {
    if (!document.getElementById('ws-css')) { const s = document.createElement('style'); s.id = 'ws-css'; s.textContent = CSS; document.head.appendChild(s); }
    const S = { ...structuredClone(DEF), ...(ev.settings || {}) };
    S.modes = { ...DEF.modes, ...(ev.settings?.modes || {}) }; S.form = { ...DEF.form, ...(ev.settings?.form || {}) };
    S.layouts = S.layouts || [];
    let E = { name: ev.name, event_date: ev.event_date, logo_url: ev.logo_url };
    let page = 'layout', sub = {};
    const root = document.createElement('div'); root.id = 'ws';
    root.innerHTML = `<div class="wtop"><div class="logo">${LOGO(28)}</div><span class="en"></span><span class="sp"></span>
      <span class="st"></span><button class="tb" data-a="preview">${ICON('eye', 16)} Vorschau</button></div>
      <div class="wbody"><nav class="side"></nav><main class="wm"></main></div>`;
    document.body.appendChild(root);
    const side = $(root, 'nav.side'), main = $(root, 'main.wm');

    // ---------- Speichern (automatisch) ----------
    let saveT = 0;
    const status = t => { $(root, '.st').textContent = t; };
    function save() {
      status('Speichert …'); clearTimeout(saveT);
      saveT = setTimeout(async () => {
        const { error } = await ctx.sb.from('events').update({ name: E.name, event_date: E.event_date || null, logo_url: E.logo_url || null, settings: S }).eq('id', ev.id);
        status(error ? '⚠️ ' + error.message : '✓ Alle Änderungen gespeichert');
      }, 600);
    }
    function renderNav() {
      side.innerHTML = `<span class="back" data-a="back">${ICON('chevronLeft', 14)} Zurück zu den Ereignissen</span>` + NAV.map(n => n[0] === 'h'
        ? `<h6>${n[1]}</h6>` : `<a data-p="${n[0]}" class="${n[0] === page ? 'on' : ''}">${ICON(n[1], 18)}${n[2]}</a>`).join('');
      $(root, '.en').textContent = E.name;
    }
    side.addEventListener('click', e => {
      const a = e.target.closest('a[data-p]'); if (a) { page = a.dataset.p; renderNav(); render(); }
      if (e.target.closest('[data-a="back"]')) close();
    });
    $(root, '.wtop').addEventListener('click', e => { if (e.target.closest('[data-a="preview"]')) previewAll(); });

    // ---------- Bausteine ----------
    const sw = (p, label, hint = '') => `<div class="between"><div>${label}${hint ? `<small>${hint}</small>` : ''}</div>
      <div class="row"><label class="sw"><input type="checkbox" data-s="${p}" ${getP(S, p) ? 'checked' : ''}><i></i></label><span class="swl">${getP(S, p) ? 'Ein' : 'Aus'}</span></div></div>`;
    const slider = (p, label, min, max, step = 1, unit = 'sec') => `<label class="l">${label}</label><div class="slider"><input type="range" min="${min}" max="${max}" step="${step}" data-s="${p}" data-num="1" value="${getP(S, p)}">
      <input type="number" min="${min}" max="${max}" step="${step}" data-s="${p}" data-num="1" value="${getP(S, p)}"><span class="swl">${unit}</span></div>`;
    const text = (p, label, ph = '') => `<label class="l">${label}</label><input type="text" data-s="${p}" value="${esc(getP(S, p))}" placeholder="${esc(ph)}">`;
    const tabs = (key, list) => { sub[key] ||= list[0][0]; return `<div class="tabs">${list.map(([k, n]) => `<button data-tab="${key}:${k}" class="${sub[key] === k ? 'on' : ''}">${n}</button>`).join('')}</div>`; };
    const titleSw = (t, p) => `<h1>${t}${p ? ` <label class="sw"><input type="checkbox" data-s="${p}" ${getP(S, p) ? 'checked' : ''}><i></i></label><span class="swl">${getP(S, p) ? 'Ein' : 'Aus'}</span>` : ''}</h1>`;

    main.addEventListener('input', e => {
      const t = e.target, p = t.dataset.s; if (!p) return;
      const v = t.type === 'checkbox' ? t.checked : t.dataset.num ? +t.value : t.value;
      setP(S, p, v);
      if (t.type === 'checkbox') { const l = t.closest('.row,h1')?.querySelector('.swl'); if (l) l.textContent = v ? 'Ein' : 'Aus'; }
      if (t.dataset.num) $$(main, `[data-s="${p}"]`).forEach(x => { if (x !== t) x.value = v; });
      save(); drawPreview();
      if (t.type === 'radio') render();
    });
    main.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.e) { E[t.dataset.e] = t.value; renderNav(); save(); }
    });
    main.addEventListener('click', async e => {
      const t = e.target.closest('[data-tab],[data-a],[data-mode],[data-flt],[data-lay]'); if (!t) return;
      if (t.dataset.tab) { const [k, v] = t.dataset.tab.split(':'); sub[k] = v; render(); return; }
      if (t.dataset.mode) { sub.mode = t.dataset.mode; render(); return; }
      if (t.dataset.flt) { const id = t.dataset.flt; S.filters = S.filters.includes(id) ? S.filters.filter(x => x !== id) : [...S.filters, id]; save(); render(); return; }
      const a = t.dataset.a;
      if (a === 'newlay') { $(main, '.dd .menu').classList.toggle('hidden-m'); $(main, '.dd .menu').style.display = $(main, '.dd .menu').style.display === 'block' ? 'none' : 'block'; }
      if (a === 'fromtpl') pickTemplate();
      if (a === 'fromimg') fromImage();
      if (a === 'editlay') editLayout(t.dataset.id);
      if (a === 'dellay') { if (confirm('Layout löschen?')) { S.layouts = S.layouts.filter(l => l.id !== t.dataset.id); save(); render(); } }
      if (a === 'duplay') { const l = structuredClone(S.layouts.find(x => x.id === t.dataset.id)); l.id = FBR.uid(); l.name += ' (Kopie)'; S.layouts.push(l); save(); render(); }
      if (a === 'uplogo') { const f = await pick('image/*'); if (f) { status('Lädt Logo hoch …'); E.logo_url = await ctx.uploadFile(f); save(); render(); } }
      if (a === 'dellogo') { E.logo_url = null; save(); render(); }
      if (a === 'upattract') {
        const f = await pick('video/mp4,video/*,image/*'); if (!f) return;
        if (f.size > 50 * 1024 * 1024) { ctx.toast('Datei ist zu groß (max. 50 MB). Bitte das Video kürzer oder kleiner exportieren.', 5000); return; }
        status('Lädt ' + (f.type.startsWith('video') ? 'Video' : 'Bild') + ' hoch …');
        try { S.attractUrl = await ctx.uploadFile(f); S.attractType = f.type.startsWith('video') ? 'video' : 'image'; save(); render(); }
        catch (e) { ctx.toast('Hochladen fehlgeschlagen: ' + e.message, 5000); status(''); }
      }
      if (a === 'delattract') { S.attractUrl = ''; S.attractType = ''; save(); render(); }
      if (a === 'upbg') { const f = await pick('image/*'); if (f) { status('Lädt Hintergrund hoch …'); S.bgUrls = [...(S.bgUrls || []), await ctx.uploadFile(f)]; save(); render(); } }
      if (a === 'delbg') { S.bgUrls = S.bgUrls.filter((_, i) => i !== +t.dataset.i); save(); render(); }
      if (a === 'delev') ctx.onDelete?.(ev, close);
      if (a === 'edit1') { const l = S.layouts[0]; if (l) editLayout(l.id); else pickTemplate(); }
    });
    const pick = accept => new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => res(i.files[0] || null); i.click(); });

    // ---------- Seiten ----------
    function layoutThumb(L, px = 300) {
      const c = FBR.renderLayout(L, { placeholders: true, values: vals() });
      const s = px / Math.max(c.width, c.height), t = document.createElement('canvas');
      t.width = Math.round(c.width * s); t.height = Math.round(c.height * s); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
      return t.toDataURL('image/jpeg', .85);
    }
    const vals = () => ({ titel: S.title || E.name, untertitel: S.subtitle || (E.event_date ? new Date(E.event_date).toLocaleDateString('de-DE') : ''), datum: new Date().toLocaleDateString('de-DE'), uhrzeit: '20:15', event: E.name, name: 'Lisa' });
    function layoutCards() {
      return `<div class="dd"><button class="btn" data-a="newlay">${ICON('plus', 16)} Neues Layout ${ICON('chevronDown', 16)}</button><div class="menu" style="display:none">
          <button data-a="fromtpl">${ICON('gallery', 16)} Vorlage wählen</button><button data-a="fromimg">${ICON('upload', 16)} Bild hochladen</button></div></div>
        <div class="lays">${S.layouts.length ? S.layouts.map(L => `<div class="lay" data-a="editlay" data-id="${L.id}">
            <div class="acts"><button data-a="duplay" data-id="${L.id}" title="Duplizieren">${ICON('copy', 13)}</button><button data-a="dellay" data-id="${L.id}" title="Löschen">${ICON('trash', 13)}</button></div>
            <img src="${layoutThumb(L)}" alt=""><div class="nm">${esc(L.name)} · ${FBR.photoCount(L)} Foto(s)</div></div>`).join('')
          : `<div class="empty" style="flex:1">Noch keine Layouts hinzugefügt</div>`}</div>`;
    }
    const PAGES = {
      dash() {
        const devs = (ctx.devices || []).filter(d => d.event_id === ev.id);
        const photos = devs.reduce((a, d) => a + (d.photos_total || 0), 0);
        return `<h1>Dashboard</h1>
          <div class="stats"><div class="stat"><b>${devs.length}</b>Fotoboxen</div><div class="stat"><b>${photos}</b>Fotos (Geräte gesamt)</div><div class="stat"><b>${ctx.leadsCount?.(ev.id) ?? '–'}</b>Gäste-Daten</div></div>
          <div class="card" style="margin-top:16px"><label class="l">Name des Ereignisses</label><input type="text" data-e="name" value="${esc(E.name)}">
            <label class="l">Datum</label><input type="date" data-e="event_date" value="${E.event_date || ''}"></div>
          <div class="card"><b>Zugewiesene Fotoboxen</b>${devs.length ? devs.map(d => `<div class="between"><span>📸 ${esc(d.name || 'FotoBox')}</span><small>${d.last_seen && Date.now() - new Date(d.last_seen) < 18e4 ? '🟢 online' : 'offline'}</small></div>`).join('')
            : '<p style="color:#777">Noch keine. In der FotoBox anmelden und dieses Event auswählen – oder oben unter „Geräte“ zuweisen.</p>'}</div>
          <button class="ghost" data-a="delev" style="color:#d23b3b">${ICON('trash', 15)} Ereignis löschen</button>`;
      },
      layout() {
        return `<h1>Photo booth experience</h1>${tabs('layout', [['layouts', 'Photo layout'], ['countdown', 'Countdown']])}
          ${sub.layout === 'layouts' ? `<h2>Fotolayout</h2><div class="card">Wird für Foto- oder Drucksitzungen verwendet
            ${layoutCards()}${S.layouts.length > 1 ? sw('guestLayouts', 'Gäste wählen das Layout', 'Bei mehreren Layouts wählen die Gäste vor der Aufnahme') : ''}
            ${sw('gifFromPhotos', 'Auch ein GIF aus den Fotos erstellen')}</div>` : ''}
          <h2>Countdown</h2><div class="card">${slider('countdown', 'Countdown vor Foto 1', 1, 10)}${slider('countdownNext', 'Countdown vor weiteren Fotos', 1, 10)}${slider('between', 'Anzeigedauer des Fotos', 0, 10, .5)}</div>`;
      },
      capture() {
        sub.mode ||= 'photo';
        const M = [['photo', 'camera', 'Foto', 'single'], ['gif', 'film', 'GIF', 'gif'], ['boom', 'repeat', 'Boomerang', 'boomerang'], ['video', 'video', 'Video', 'video']];
        const photoOn = S.modes.single || S.modes.strip || S.modes.grid || S.layouts.length;
        return `<h1>Aufnahmeeinstellungen</h1><div class="cols"><div class="left">
          <div class="modes">${M.map(([k, ic, n, key]) => `<div class="mode ${sub.mode === k ? 'on' : ''}" data-mode="${k}"><span class="ic">${ICON(ic, 22)}</span>${n}<span class="dot ${(k === 'photo' ? photoOn : S.modes[key]) ? 'a' : ''}"></span></div>`).join('')}</div>
          <div class="card">${sub.mode === 'photo' ? `${sw('modes.single', 'Fotomodus aktivieren', 'Nehmen Sie Fotos für den Druck oder die digitale Weitergabe auf')}
              <p style="color:#777;font-size:13px">Das Aussehen der Ausdrucke legst du unter „Photo booth experience → Fotolayout“ fest.</p>
              ${!S.layouts.length ? `${sw('modes.strip', 'Standard-Fotostreifen anbieten')}${sw('modes.grid', 'Standard-Collage anbieten')}` : ''}`
            : sub.mode === 'gif' ? `${sw('modes.gif', 'GIF-Modus aktivieren', 'Mehrere Fotos als Animation')}<label class="l">Anzahl Fotos</label><select data-s="gifFrames" data-num="1">${[2, 3, 4, 5, 6].map(n => `<option ${S.gifFrames == n ? 'selected' : ''}>${n}</option>`).join('')}</select>`
            : sub.mode === 'boom' ? `${sw('modes.boomerang', 'Boomerang aktivieren', 'Kurzer Clip, der vor und zurück läuft')}<label class="l">Länge</label><select data-s="boomerangLen">${['kurz', 'mittel', 'lang'].map(n => `<option ${S.boomerangLen === n ? 'selected' : ''}>${n}</option>`).join('')}</select>`
            : `${sw('modes.video', 'Videomodus aktivieren', 'Videobotschaft mit Ton')}${slider('videoSecs', 'Video-Länge', 3, 60, 1)}${sw('videoAudio', 'Ton aufnehmen')}`}</div>
          <h2>Spiegeln</h2><div class="card">${sw('mirror', 'Gespiegelte Live-Ansicht')}${sw('mirrorPhoto', 'Aufgenommene Fotos und Videos spiegeln', 'Spiegelt das gespeicherte und gedruckte Ergebnis')}${sw('cropLive', 'Live-Ansicht auf das Fotofeld zuschneiden')}</div>
        </div>${previewBox()}</div>`;
      },
      voice() {
        return `${titleSw('Virtueller Berater', 'voice')}<div class="card"><p>Leitet deine Gäste mit Sprachansagen: „Wähle dein Format“, „Bereit machen“, „Lächeln!“, „Scanne den Code …“.</p>
          <label class="l">Stil</label><select disabled><option>Audio – Deutsche Stimme</option></select>
          <p style="color:#888;font-size:12px">Eigene Audio- und Videodateien pro Schritt <span class="soon">bald</span></p></div>`;
      },
      start() {
        return `<h1>Startbildschirm</h1><div class="cols"><div class="left"><div class="card">
          ${text('title', 'Titel', E.name)}${text('subtitle', 'Untertitel / Datum')}${text('startText', 'Text auf dem Start-Knopf')}
          <label class="l">Logo</label><div class="row">${E.logo_url ? `<img src="${esc(E.logo_url)}" style="height:50px;border-radius:6px"><button class="ghost" data-a="dellogo">Entfernen</button>` : ''}<button class="ghost" data-a="uplogo">${ICON('upload', 15)} Logo hochladen</button></div>
          <div class="row" style="margin-top:12px"><div><label class="l">Akzentfarbe</label><input type="color" data-s="accent" value="${S.accent}"></div></div></div>
          <h2>Startbildschirm-Video</h2><div class="card">Das Video läuft in Dauerschleife, bis ein Gast den Bildschirm berührt. Hoch- oder Querformat, MP4 (max. 50 MB) – oder ein Bild.
            <div class="row" style="margin-top:12px">${S.attractUrl ? `<span>${ICON(S.attractType === 'video' ? 'video' : 'image', 18)} ${S.attractType === 'video' ? 'Video' : 'Bild'} hinterlegt</span><button class="ghost" data-a="delattract">${ICON('trash', 14)} Entfernen</button>` : ''}
              <button class="ghost" data-a="upattract">${ICON('upload', 15)} Video oder Bild hochladen</button></div>
            <label class="l">Anpassen an den Bildschirm</label><select data-s="attractFit"><option value="cover" ${S.attractFit !== 'contain' ? 'selected' : ''}>Füllen (Ränder werden abgeschnitten)</option><option value="contain" ${S.attractFit === 'contain' ? 'selected' : ''}>Einpassen (ganzes Video sichtbar)</option></select></div>
          </div>${startPreview()}</div>`;
      },
      fx() {
        return `<h1>Filter & Effekte</h1>${tabs('fx', [['beauty', 'Schönheitsfilter'], ['color', 'Farbfilter'], ['sticker', 'Aufkleber']])}
          ${sub.fx === 'beauty' ? `${titleSw('Schönheitsfilter', 'beauty')}<div class="card">Tragen Sie einen Schönheitsfilter auf, um die Haut zu glätten.${slider('beautyStrength', 'Stärke', 0, 100, 5, '%')}</div>`
          : sub.fx === 'color' ? `${titleSw('Farbfilter', 'filtersOn')}<div class="card">Gäste wählen nach der Aufnahme aus den markierten Filtern.
              <div class="filters" style="margin-top:12px">${FILTERS.map(([id, n, css]) => `<div class="flt ${S.filters.includes(id) ? 'on' : ''}" data-flt="${id}"><img src="${filterThumb(css)}"><span>${n}</span></div>`).join('')}</div></div>`
          : `${titleSw('Aufkleber', 'stickers')}<div class="card">Gäste können ihr Foto nach der Aufnahme mit Emoji-Aufklebern und Stift verzieren („✨ Verzieren“).</div>`}`;
      },
      bg() {
        return `${titleSw('Hintergrundentfernung', '')}<div class="card"><b>Ersetzen Sie den Hintergrund Ihrer Fotos</b>
          <label class="l">Modus</label><div class="row">${[['off', 'Aus'], ['ai', 'KI-Hintergrundentfernung'], ['green', 'Greenscreen']].map(([k, n]) => `<label class="row" style="gap:6px"><input type="radio" name="bgm" data-s="bgMode" value="${k}" ${S.bgMode === k ? 'checked' : ''}> ${n}</label>`).join('')}</div>
          ${S.bgMode === 'green' ? slider('keyStrength', 'Empfindlichkeit', 0, 100, 1, '') : ''}
          ${sw('bgGuestChoice', 'Gäste wählen das Hintergrundbild', 'Aus = das erste Bild wird verwendet')}
          <label class="l">Hintergründe</label><div class="thumbs">${(S.bgUrls || []).map((u, i) => `<div><img src="${esc(u)}"><button data-a="delbg" data-i="${i}">✕</button></div>`).join('')}</div>
          <button class="ghost" data-a="upbg" style="margin-top:10px">${ICON('upload', 15)} Bild hochladen (JPG/PNG, empfohlen 1800×1200)</button></div>`;
      },
      ai() { return `<h1>KI-Porträts <span class="soon">bald</span></h1><div class="card">Verwandelt Gästefotos per KI in Stile wie Superheld, Gemälde oder Comic. Kommt in einem der nächsten Updates.</div>`; },
      survey() {
        return `<h1>Umfrage & Haftungsausschluss</h1>${tabs('sv', [['survey', 'Umfrage'], ['disc', 'Haftungsausschluss']])}
          ${sub.sv === 'survey' ? `${titleSw('Umfrage', 'form.enabled')}<div class="card">Stellen Sie Ihren Gästen Fragen vor der Aufnahme. Die Antworten findest du unter „Gäste-Daten“.
              ${sw('form.name', 'Name abfragen')}${sw('form.email', 'E-Mail abfragen')}${sw('form.phone', 'Telefon abfragen')}${sw('form.newsletter', 'Newsletter-Einwilligung anbieten')}</div>`
          : `${titleSw('Haftungsausschluss', 'form.enabled')}<div class="card">Gäste müssen den Text bestätigen, bevor die Aufnahme startet.
              <label class="l">Text des Haftungsausschlusses</label><textarea rows="5" data-s="form.text">${esc(S.form.text)}</textarea></div>`}`;
      },
      share() {
        return `<h1>Einstellungen für Teilen</h1>${tabs('sh', [['qr', 'QR-Code'], ['mail', 'E-Mail'], ['sms', 'SMS'], ['wa', 'WhatsApp'], ['screen', 'Bildschirm zum Teilen']])}
          ${sub.sh === 'qr' ? `${titleSw('QR-Code', 'share')}<div class="card">Nach der Aufnahme erscheint ein QR-Code. Gäste scannen ihn und laden Foto, GIF oder Video direkt aufs Handy (Handy im selben WLAN wie die Fotobox).</div>`
          : sub.sh === 'screen' ? `<div class="card">${slider('autoReturn', 'Anzeigedauer des Bildschirms zum Teilen', 5, 120, 5)}</div>`
          : `<div class="card">Versand per ${sub.sh === 'mail' ? 'E-Mail' : sub.sh === 'sms' ? 'SMS' : 'WhatsApp'} <span class="soon">bald</span><p style="color:#777">Dafür wird ein Versanddienst angebunden.</p></div>`}`;
      },
      print() {
        return `<h1>Druckeinstellungen</h1>${tabs('pr', [['gen', 'Allgemein'], ['lim', 'Drucklimits']])}
          ${sub.pr === 'gen' ? `<div class="card">${sw('autoPrint', 'Automatisch drucken', 'Automatisches Drucken jeder Session')}${sw('printButton', 'Schaltfläche „Drucken“ anzeigen', 'Fügt dem Freigabebildschirm eine Schaltfläche zum Drucken hinzu')}
              ${sw('askCopies', '„Wie viele Kopien?“ fragen')}<label class="l">Kopien pro Druck (Standard)</label><input type="number" min="1" max="10" data-s="copies" data-num="1" value="${S.copies}"></div>`
          : `${titleSw('Drucklimits', '')}<div class="card">Ein Limit für die erlaubten Ausdrucke festlegen.
              <div class="row"><div style="flex:1"><label class="l">Maximale Anzahl an Ausdrucken pro Ereignis (0 = kein Limit)</label><input type="number" min="0" data-s="printLimit" data-num="1" value="${S.printLimit}"></div>
              <div style="flex:1"><label class="l">Maximale Anzahl an Kopien pro Gast</label><input type="number" min="1" max="10" data-s="maxCopies" data-num="1" value="${S.maxCopies}"></div></div></div>`}`;
      },
      gallery() { return `<h1>Online-Galerie <span class="soon">bald</span></h1><div class="card">Eine passwortgeschützte Online-Galerie mit allen Fotos des Ereignisses – zum Teilen mit dem Brautpaar oder Kunden. Kommt in einem der nächsten Updates.</div>`; }
    };
    function previewBox() {
      return `<div class="pv"><div class="frame"><canvas id="wsPv"></canvas><div class="row" style="justify-content:space-between;margin-top:12px">
        <button class="btn pri" data-a="edit1">${ICON('pen', 15)} Bearbeiten</button><small style="color:#777">${S.layouts[0] ? esc(S.layouts[0].name) : 'Standard-Vorlage'}</small></div></div></div>`;
    }
    function startPreview() {
      const media = S.attractUrl ? (S.attractType === 'video' ? `<video src="${esc(S.attractUrl)}" autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:${S.attractFit === 'contain' ? 'contain' : 'cover'};background:#000"></video>`
        : `<img src="${esc(S.attractUrl)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:${S.attractFit === 'contain' ? 'contain' : 'cover'};background:#000">`) : '';
      return `<div class="pv"><div class="frame"><div id="wsStart" style="position:relative;overflow:hidden;aspect-ratio:3/4;border-radius:10px;background:linear-gradient(160deg,#1D1D1B,#4a4a45);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:20px">${media}<div style="position:relative;display:flex;flex-direction:column;align-items:center">
        ${E.logo_url ? `<img src="${esc(E.logo_url)}" style="max-height:70px;margin-bottom:14px">` : ''}<div style="font-size:30px;font-weight:800">${esc(S.title || E.name)}</div>
        <div style="opacity:.85">${esc(S.subtitle)}</div><div style="margin-top:30px;background:${S.accent};color:#1D1D1B;padding:10px 22px;border-radius:999px;font-weight:700">${esc(S.startText)}</div></div></div></div></div>`;
    }
    const fThumbCache = {};
    function filterThumb(css) {
      if (fThumbCache[css]) return fThumbCache[css];
      const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d');
      if (css !== 'none') x.filter = css; x.drawImage(FBR.placeholder(1, 400, 400), 0, 0, 160, 160);
      return fThumbCache[css] = c.toDataURL('image/jpeg', .8);
    }
    function drawPreview() {
      const c = $(root, '#wsPv');
      if (c) {
        const L = S.layouts[0];
        const img = L ? FBR.renderSheet(L, { placeholders: true, values: vals() })
          : FBR.render(FBR.LAYOUTS.single, [0, 1, 2, 3].map(i => FBR.placeholder(i)), { template: S.template, title: S.title || E.name, subtitle: S.subtitle });
        c.width = img.width / 3; c.height = img.height / 3; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      }
      if ($(root, '#wsStart') && page === 'start') { clearTimeout(drawPreview.t); drawPreview.t = setTimeout(() => { const s = main.scrollTop; render(); main.scrollTop = s; }, 400); }
    }
    function render() {
      main.innerHTML = PAGES[page]();
      drawPreview();
      if (page === 'layout') S.layouts.forEach(L => FBR.preloadLayout(L).then(() => { const img = main.querySelector(`.lay[data-id="${L.id}"] img`); if (img) img.src = layoutThumb(L); }));
    }

    // ---------- Layouts ----------
    function editLayout(id) {
      const L = S.layouts.find(x => x.id === id); if (!L) return;
      LayoutEditor.open({
        layout: L, values: vals(), uploadImage: ctx.uploadFile,
        onSave: async nl => { const i = S.layouts.findIndex(x => x.id === nl.id); if (i >= 0) S.layouts[i] = nl; save(); },
        onClose: () => render()
      });
    }
    function modal(html) {
      const m = document.createElement('div'); m.id = 'wsModal'; m.innerHTML = `<div class="box">${html}</div>`;
      m.addEventListener('click', e => { if (e.target === m || e.target.dataset.x) m.remove(); });
      document.body.appendChild(m); return m;
    }
    function pickTemplate() {
      const cats = ['Alle', ...new Set(FBR.TEMPLATES.map(t => t.cat))];
      let cat = 'Alle', q = '';
      const m = modal(`<div class="mh"><h3>Vorlage wählen</h3><input placeholder="Vorlagen suchen …" data-q><button class="x" data-x="1">×</button></div>
        <div class="cats">${cats.map(c => `<button data-c="${c}" class="${c === cat ? 'on' : ''}">${c}</button>`).join('')}</div><div class="grid"></div>`);
      const thumbs = {};
      const grid = () => {
        $(m, '.grid').innerHTML = FBR.TEMPLATES.filter(t => (cat === 'Alle' || t.cat === cat) && t.name.toLowerCase().includes(q)).map(t => {
          thumbs[t.id] ||= layoutThumb(FBR.createLayout('4x6p', 3, t.id), 260);
          return `<div class="tp" data-t="${t.id}"><img src="${thumbs[t.id]}"><div>${esc(t.name)}</div></div>`;
        }).join('');
      };
      grid();
      m.addEventListener('click', e => {
        const c = e.target.closest('[data-c]'); if (c) { cat = c.dataset.c; $$(m, '[data-c]').forEach(b => b.classList.toggle('on', b === c)); grid(); }
        const t = e.target.closest('[data-t]'); if (t) pickFormat(m, t.dataset.t);
      });
      $(m, '[data-q]').oninput = e => { q = e.target.value.toLowerCase(); grid(); };
    }
    function pickFormat(m, tplId) {
      const t = FBR.templateById(tplId);
      const items = FBR.PRESETS.map(([f, n]) => ({ f, n, L: FBR.createLayout(f, n, tplId) }));
      let cur = 0;
      $(m, '.box').innerHTML = `<div class="mh"><button class="x" data-back="1">‹</button><h3>${esc(t.name)}</h3><button class="x" data-x="1">×</button></div>
        <div class="two"><div class="fl">${items.map((it, i) => `<div class="fi ${i === cur ? 'on' : ''}" data-i="${i}"><img src="${layoutThumb(it.L, 160)}"><div>${FBR.FORMATS[it.f].label.replace(' Streifen', '')} · 📷 ${it.n}</div></div>`).join('')}</div>
        <div class="bigpv"><img><div class="ft"><div><b class="fn"></b><br><small class="fs"></small></div><button class="btn" data-go="1">Layout auswählen</button></div></div></div>`;
      const show = () => { const it = items[cur]; $(m, '.bigpv img').src = layoutThumb(it.L, 700); $(m, '.fn').textContent = `${FBR.FORMATS[it.f].label} (${it.n} Foto${it.n > 1 ? 's' : ''})`; $(m, '.fs').textContent = `${it.L.w} × ${it.L.h} px`; $$(m, '.fi').forEach((e, i) => e.classList.toggle('on', i === cur)); };
      show();
      m.onclick = e => {
        if (e.target === m || e.target.dataset.x) return m.remove();
        if (e.target.dataset.back) { m.remove(); return pickTemplate(); }
        const fi = e.target.closest('[data-i]'); if (fi) { cur = +fi.dataset.i; show(); }
        if (e.target.dataset.go) { const L = items[cur].L; S.layouts.push(L); save(); m.remove(); render(); editLayout(L.id); }
      };
    }
    async function fromImage() {
      const f = await pick('image/png,image/*'); if (!f) return;
      status('Analysiere Design …');
      try {
        const L = await LayoutEditor.layoutFromImage(f, ctx.uploadFile);
        ctx.toast(L.found ? `${L.found} Fotofeld(er) im Design erkannt` : 'Keine transparenten Stellen gefunden – Fotofeld bitte selbst platzieren', 3500);
        delete L.found; S.layouts.push(L); save(); render(); editLayout(L.id);
      } catch (e) { ctx.toast('Fehler: ' + e.message, 4000); status(''); }
    }
    function previewAll() {
      const L = S.layouts[0];
      const img = L ? FBR.renderSheet(L, { placeholders: true, values: vals() }) : null;
      const m = modal(`<div class="mh"><h3>Vorschau</h3><button class="x" data-x="1">×</button></div><div class="bigpv" style="flex:1"><img src="${img ? img.toDataURL('image/jpeg', .85) : ''}"></div>`);
      if (!img) $(m, '.bigpv').innerHTML = '<p style="padding:30px">Noch kein Layout angelegt.</p>';
    }
    async function close() {
      clearTimeout(saveT);
      await ctx.sb.from('events').update({ name: E.name, event_date: E.event_date || null, logo_url: E.logo_url || null, settings: S }).eq('id', ev.id);
      root.remove(); ctx.onClose?.();
    }

    renderNav(); render(); status('✓ Alle Änderungen gespeichert');
    return { close };
  }
  // „Erstellen Sie ein neues Ereignis“ – Ereignisart wählen
  const TYPES = [
    ['FOTO', 'photo', 'camera', 'PHOTO BOOTH', 'Fotos für den Druck oder die digitale Weitergabe', {}],
    ['FOTO', 'glam', 'sparkles', 'GLAM BOOTH', 'Fotos mit Hautglättung und Farbfiltern', { beauty: true, beautyStrength: 55, filtersOn: true, filters: ['normal', 'bw', 'glam', 'warm'], template: 'elegant', frame: '#111111', textColor: '#f3efe6', font: 'elegant' }],
    ['FOTO', 'bgremoval', 'wand', 'BACKGROUND REMOVAL', 'Hintergrund per KI durch ein digitales Bild ersetzen', { bgMode: 'ai', bgGuestChoice: true }],
    ['FOTO', 'mirror', 'smartphone', 'MIRROR BOOTH', 'Interaktive Sprachansagen und Animationen während der Aufnahme', { voice: true }],
    ['VIDEO', 'slowmo', 'film', '360 / SLOW-MO', 'Zeitlupen-Videos mit Tempo-Rampen', null],
    ['VIDEO', 'video', 'video', 'VIDEO BOOTH', 'Videos mit Ton aufnehmen – für ein Video-Gästebuch', { modes: { single: false, strip: false, grid: false, gif: false, boomerang: false, video: true }, videoSecs: 15, videoAudio: true }]
  ];
  function newEventDialog(events, onPick) {
    if (!document.getElementById('ws-css')) { const s = document.createElement('style'); s.id = 'ws-css'; s.textContent = CSS; document.head.appendChild(s); }
    const m = document.createElement('div'); m.id = 'wsModal';
    let sec = '';
    const rows = TYPES.map(([g, id, ic, t, d, preset]) => (g !== sec ? `<div class="sec">${sec = g}</div>` : '') +
      `<button class="et" data-type="${id}" ${preset ? '' : 'disabled'}><span class="ei">${ICON(ic, 24)}</span><span><b>${t}${preset ? '' : ' <span class="soon">bald</span>'}</b><small>${d}</small></span></button>`).join('');
    m.innerHTML = `<div class="box" style="width:min(460px,94vw);height:auto;max-height:92vh"><div class="mh"><div style="flex:1"><h3>Erstellen Sie ein neues Ereignis</h3><small>Wählen Sie die Ereignisart für Ihre Fotobox</small></div><button class="x" data-x="1">${ICON('x', 20)}</button></div>
      <div style="overflow:auto;padding-bottom:16px">${rows}<div class="sec">KOPIEREN</div>
      <button class="et" data-type="dup" ${events.length ? '' : 'disabled'}><span class="ei">${ICON('copy', 24)}</span><span><b>VORHERIGES EREIGNIS DUPLIZIEREN</b><small>Einstellungen eines früheren Ereignisses übernehmen</small></span></button>
      <div class="dupList" style="display:none;margin:0 20px">${events.map(e => `<button class="et" data-dup="${e.id}" style="width:100%;margin:0 0 6px"><span class="ei">${ICON('calendar', 20)}</span><span><b style="font-family:inherit">${esc(e.name)}</b><small>${e.event_date ? new Date(e.event_date).toLocaleDateString('de-DE') : ''}</small></span></button>`).join('')}</div></div></div>`;
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('[data-x]')) return m.remove();
      const b = e.target.closest('[data-type],[data-dup]'); if (!b || b.disabled) return;
      if (b.dataset.type === 'dup') { const l = $(m, '.dupList'); l.style.display = l.style.display === 'none' ? 'block' : 'none'; return; }
      if (b.dataset.dup) { const src = events.find(x => x.id === b.dataset.dup); m.remove(); return onPick(structuredClone(src.settings || {}), src.logo_url, src.name + ' (Kopie)'); }
      const t = TYPES.find(x => x[1] === b.dataset.type); m.remove(); onPick(structuredClone(t[5]), null, null, t[3]);
    });
    document.body.appendChild(m);
  }
  G.EventWS = { open, newEventDialog };
})(window);
