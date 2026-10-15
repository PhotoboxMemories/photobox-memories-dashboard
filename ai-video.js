// Photobox Memories – KI-Video für den Startbildschirm (gleiche Datei in Dashboard und Fotobox).
// AIVideo.open({ call(body) → Promise<Antwort der Funktion „ai-video“>, eventId, logo, orient: 'portrait'|'landscape', onUse(url) })
//   Hintergrund: die KI macht ein bewegtes Video nach Beschreibung – ohne Text, Namen und Logo legt der Startbildschirm scharf darüber.
//   Logo animieren: das Logo (mittig auf einer Farbe) wird bewegt und kehrt zum Startbild zurück (nahtlose Schleife).
(function (G) {
  'use strict';
  const COST = 5;
  const PRESETS = [
    ['Hochzeit', 'Sanft fallende Rosenblätter und funkelnde goldene Lichtpunkte vor einem cremefarbenen Hintergrund, romantisch und elegant'],
    ['Geburtstag', 'Bunte Konfetti und schwebende Luftballons in fröhlichen Farben, leichtes Glitzern'],
    ['Firmenfeier', 'Elegante, langsam fließende Lichtlinien in Dunkelblau und Gold, modern und hochwertig'],
    ['Party', 'Bunte Neonlichter und Discokugel-Reflexe, die langsam über einen dunklen Hintergrund gleiten'],
    ['Weihnachten', 'Leise fallender Schnee und warme Lichterketten in Gold und Rot, gemütlich'],
    ['Natur', 'Sanftes Sonnenlicht durch grüne Blätter, leichte Bewegung im Wind, warme Farben']
  ];
  const BGS = [['#ffffff', 'Weiß'], ['#f6efe4', 'Creme'], ['#1D1D1B', 'Schwarz'], ['#0d1b2a', 'Dunkelblau']];
  const PENDING = 'pm-aivideo-pending'; // läuft noch ein Video, wenn der Dialog geschlossen wurde: beim nächsten Öffnen weiter abfragen
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CSS = `
  #aivModal{position:fixed;inset:0;z-index:200;background:rgba(15,15,14,.6);display:flex;align-items:center;justify-content:center;padding:16px;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1D1D1B}
  #aivModal .box{background:#fff;border-radius:16px;width:min(560px,100%);max-height:92vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.35)}
  #aivModal .hd{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #eee}
  #aivModal .hd h3{margin:0;flex:1;font:600 18px Fredoka,system-ui,sans-serif}
  #aivModal .x{border:0;background:#f3f3f5;border-radius:50%;width:34px;height:34px;font-size:18px;cursor:pointer}
  #aivModal .bd{padding:16px 18px;display:flex;flex-direction:column;gap:12px}
  #aivModal .seg{display:flex;gap:6px;flex-wrap:wrap}
  #aivModal .seg button{border:1.5px solid #e3e3ea;background:#fff;border-radius:999px;padding:7px 14px;cursor:pointer;font:inherit}
  #aivModal .seg button.on{border-color:#F7C838;background:#FFF3C4;font-weight:600}
  #aivModal label{font-weight:600;font-size:13px;color:#444}
  #aivModal textarea{width:100%;box-sizing:border-box;min-height:84px;border:1px solid #ddd;border-radius:10px;padding:10px;font:inherit;resize:vertical}
  #aivModal .note{font-size:12.5px;color:#666;background:#f7f7f9;border-radius:10px;padding:9px 11px}
  #aivModal .logo{display:flex;align-items:center;gap:12px}
  #aivModal .logo canvas{width:90px;border-radius:8px;border:1px solid #eee;background:#fafafa}
  #aivModal .go{border:0;background:#F7C838;color:#1D1D1B;border-radius:999px;padding:12px 20px;font:600 15px system-ui,sans-serif;cursor:pointer}
  #aivModal .go:disabled{opacity:.55;cursor:default}
  #aivModal .ghost{border:1.5px solid #ddd;background:#fff;border-radius:999px;padding:9px 16px;cursor:pointer;font:inherit}
  #aivModal .bar{height:10px;background:#eee;border-radius:9px;overflow:hidden}#aivModal .bar i{display:block;height:100%;width:3%;background:#F7C838;transition:width .6s}
  #aivModal video{width:100%;max-height:52vh;border-radius:12px;background:#000;display:block}
  #aivModal .err{color:#b42318;font-size:13px}`;

  function open(o) {
    if (!document.getElementById('aiv-css')) { const s = document.createElement('style'); s.id = 'aiv-css'; s.textContent = CSS; document.head.appendChild(s); }
    document.getElementById('aivModal')?.remove();
    const st = { kind: 'background', orient: o.orient === 'landscape' ? 'landscape' : 'portrait', preset: 0, prompt: PRESETS[0][1], logoPrompt: '',
      logo: o.logo || '', logoImg: null, bg: '#ffffff', phase: 'form', progress: 0, started: 0, url: '', error: '' };
    const m = document.createElement('div'); m.id = 'aivModal'; document.body.appendChild(m);
    let timer = 0, alive = true;
    const close = () => { alive = false; clearTimeout(timer); m.remove(); };
    const loadLogo = src => new Promise((res, rej) => { const i = new Image(); if (!/^data:/.test(src)) i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = () => rej(new Error('Logo konnte nicht geladen werden')); i.src = src; });
    // Startbild fürs Logo-Video: Logo mittig auf der gewählten Farbe, im Format des Bildschirms (720p)
    const startImage = () => {
      const W = st.orient === 'landscape' ? 1280 : 720, H = st.orient === 'landscape' ? 720 : 1280, c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.fillStyle = st.bg; x.fillRect(0, 0, W, H);
      if (st.logoImg) { const l = st.logoImg, k = Math.min(W * .62 / l.width, H * .42 / l.height); x.drawImage(l, (W - l.width * k) / 2, (H - l.height * k) / 2, l.width * k, l.height * k); }
      return c;
    };
    const render = () => {
      if (!alive) return;
      const busy = st.phase === 'busy', mins = st.started ? Math.floor((Date.now() - st.started) / 1000) : 0;
      m.innerHTML = `<div class="box"><div class="hd"><h3>✨ KI-Video für den Startbildschirm</h3><button class="x" data-k="x" title="Schließen">×</button></div><div class="bd">
        ${st.phase === 'form' ? `
          <div class="seg"><button data-kind="background" class="${st.kind === 'background' ? 'on' : ''}">Hintergrund nach Beschreibung</button><button data-kind="logo" class="${st.kind === 'logo' ? 'on' : ''}">Logo animieren</button></div>
          <div><label>Format</label><div class="seg" style="margin-top:6px"><button data-or="portrait" class="${st.orient === 'portrait' ? 'on' : ''}">Hochformat</button><button data-or="landscape" class="${st.orient === 'landscape' ? 'on' : ''}">Querformat</button></div></div>
          ${st.kind === 'background' ? `
            <div><label>Vorschläge</label><div class="seg" style="margin-top:6px">${PRESETS.map((p, i) => `<button data-p="${i}" class="${st.preset === i ? 'on' : ''}">${p[0]}</button>`).join('')}</div></div>
            <div><label for="aivPrompt">Was soll im Video zu sehen sein?</label><textarea id="aivPrompt" maxlength="900">${esc(st.prompt)}</textarea></div>
            <div class="note">Namen, Datum und Logo kommen nicht ins Video – die legst du im Startbildschirm-Editor gestochen scharf darüber. So stimmt die Schreibweise immer.</div>`
          : `
            <div class="logo"><canvas id="aivLogoPv" width="10" height="10"></canvas><div style="display:flex;flex-direction:column;gap:6px">
              <span>${st.logo ? 'Logo des Ereignisses' : 'Noch kein Logo gewählt'}</span><button class="ghost" data-k="logo">Anderes Logo wählen …</button></div></div>
            <div><label>Hintergrundfarbe</label><div class="seg" style="margin-top:6px">${BGS.map(([c, n]) => `<button data-bg="${c}" class="${st.bg === c ? 'on' : ''}"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${c};border:1px solid #ccc;vertical-align:-1px"></span> ${n}</button>`).join('')}</div></div>
            <div><label for="aivLogoPrompt">Wie soll sich das Logo bewegen? (frei lassen = sanfter Glanz und Funkeln)</label><textarea id="aivLogoPrompt" maxlength="500" style="min-height:60px">${esc(st.logoPrompt)}</textarea></div>
            <div class="note">Das Video startet und endet mit genau diesem Bild – so läuft es als nahtlose Schleife. Selten verändert die KI ein Logo leicht; dann einfach nicht übernehmen.</div>`}
          ${st.error ? `<div class="err">⚠️ ${esc(st.error)}</div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span class="note" style="background:none;padding:0">ca. 8 Sekunden · dauert 1–3 Minuten</span><button class="go" data-k="go">Video erstellen · ${COST} Credits</button></div>`
        : busy ? `
          <div style="font-weight:600">Die KI erstellt dein Video …</div><div class="bar"><i style="width:${Math.max(3, st.progress)}%"></i></div>
          <div class="note">${st.progress ? st.progress + ' % · ' : ''}${mins} s – das dauert meist 1–3 Minuten. Du kannst das Fenster schließen; beim nächsten Öffnen geht es hier weiter.</div>`
        : st.phase === 'done' ? `
          <video src="${esc(st.url)}" autoplay loop muted playsinline></video>${st.error ? `<div class="err">⚠️ ${esc(st.error)}</div>` : ''}
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><button class="ghost" data-k="again">Noch eins erstellen</button><button class="go" data-k="use">Als Startbildschirm-Video übernehmen</button></div>`
        : `<div class="err">⚠️ ${esc(st.error)}</div><div><button class="ghost" data-k="again">Zurück</button></div>`}
      </div></div>`;
      if (st.phase === 'form' && st.kind === 'logo') drawLogoPv();
    };
    const drawLogoPv = () => { const pv = m.querySelector('#aivLogoPv'); if (!pv) return; const c = startImage(); pv.width = c.width / 8; pv.height = c.height / 8; pv.getContext('2d').drawImage(c, 0, 0, pv.width, pv.height); };
    const poll = async job => {
      if (!alive) return;
      try {
        const r = await o.call({ action: 'status', requestId: job.requestId, job: job.job, sig: job.sig });
        if (r.status === 'done') { try { localStorage.removeItem(PENDING); } catch {} st.url = r.url; st.phase = 'done'; return render(); }
        if (r.status === 'failed') { try { localStorage.removeItem(PENDING); } catch {} st.error = r.error || 'Das Video ist fehlgeschlagen.'; st.phase = 'error'; return render(); }
        st.progress = r.progress || st.progress;
      } catch (e) { console.warn('KI-Video:', e.message); } // kurzer Aussetzer: einfach weiter abfragen
      render(); timer = setTimeout(() => poll(job), 5000);
    };
    const start = async () => {
      st.error = '';
      if (st.kind === 'background') { st.prompt = (m.querySelector('#aivPrompt')?.value || '').trim(); if (!st.prompt) { st.error = 'Bitte beschreiben, was im Video zu sehen sein soll.'; return render(); } }
      else { st.logoPrompt = (m.querySelector('#aivLogoPrompt')?.value || '').trim(); if (!st.logoImg) { st.error = 'Bitte zuerst ein Logo wählen.'; return render(); } }
      const btn = m.querySelector('[data-k="go"]'); if (btn) btn.disabled = true;
      try {
        const body = { action: 'start', requestId: crypto.randomUUID(), eventId: o.eventId, kind: st.kind, aspect: st.orient === 'landscape' ? '16:9' : '9:16',
          prompt: st.kind === 'background' ? st.prompt : st.logoPrompt };
        if (st.kind === 'logo') body.image = startImage().toDataURL('image/jpeg', .92);
        const job = await o.call(body);
        try { localStorage.setItem(PENDING, JSON.stringify({ requestId: job.requestId, job: job.job, sig: job.sig, eventId: o.eventId })); } catch {}
        st.phase = 'busy'; st.started = Date.now(); st.progress = 0; render(); timer = setTimeout(() => poll(job), 5000);
      } catch (e) { st.error = e.message; render(); }
    };
    m.addEventListener('click', async e => {
      if (e.target === m) return close();
      const t = e.target.closest('[data-k],[data-kind],[data-or],[data-p],[data-bg]'); if (!t) return;
      const keep = () => { const a = m.querySelector('#aivPrompt'), b = m.querySelector('#aivLogoPrompt'); if (a) st.prompt = a.value; if (b) st.logoPrompt = b.value; };
      if (t.dataset.k === 'x') return close();
      keep();
      if (t.dataset.kind) { st.kind = t.dataset.kind; if (st.kind === 'logo' && st.logo && !st.logoImg) { try { st.logoImg = await loadLogo(st.logo); } catch (err) { st.error = err.message; } } return render(); }
      if (t.dataset.or) { st.orient = t.dataset.or; return render(); }
      if (t.dataset.p) { st.preset = +t.dataset.p; st.prompt = PRESETS[st.preset][1]; return render(); }
      if (t.dataset.bg) { st.bg = t.dataset.bg; return render(); }
      if (t.dataset.k === 'logo') {
        const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/png,image/jpeg';
        i.onchange = () => { const f = i.files[0]; if (!f) return; const fr = new FileReader(); fr.onload = async () => { try { st.logo = fr.result; st.logoImg = await loadLogo(fr.result); st.error = ''; } catch (err) { st.error = err.message; } render(); }; fr.readAsDataURL(f); };
        return i.click();
      }
      if (t.dataset.k === 'go') return start();
      if (t.dataset.k === 'again') { st.phase = 'form'; st.url = ''; st.error = ''; return render(); }
      if (t.dataset.k === 'use') { t.disabled = true; try { await o.onUse(st.url); close(); } catch (err) { st.error = err.message; render(); } }
    });
    // Läuft von vorhin noch ein Video für dieses Ereignis? Dann gleich weiter abfragen.
    let pending = null; try { pending = JSON.parse(localStorage.getItem(PENDING) || 'null'); } catch {}
    if (pending && pending.eventId === o.eventId) { st.phase = 'busy'; st.started = Date.now(); render(); poll(pending); } else render();
    return { close };
  }
  G.AIVideo = { open, COST };
})(window);
