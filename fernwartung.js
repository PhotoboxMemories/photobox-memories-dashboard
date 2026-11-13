// Fernwartung (13.11.2026, Betreiber: „jeder Vermieter sieht nur die eigenen Boxen, ich als Admin nur, wenn gewünscht und akzeptiert“)
// - Fernsteuerung: Bild der Fotobox-Software sehen, hineinklicken, scrollen, tippen (SQL 202611130001: remote_start/_input/_view/_stop,
//   Fotobox ab 1.18.96 schickt das Bild nur während einer Sitzung und zeigt oben „Fernwartung aktiv“).
// - Freigabe: Der Betreiber fragt per E-Mail des Kunden an (support_request), der Kunde erlaubt oder lehnt ab (support_answer) – oder gibt
//   von sich aus frei (support_grant). Höchstens 72 Stunden, jederzeit beendbar (support_revoke), alles in admin_log.
// - RustDesk: Die Fotobox meldet ihre RustDesk-Nummer (status.rustdesk) für den Zugriff auf Windows selbst.
(function (G) {
  const $ = (r, s) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MIN_VER = '1.18.96';
  const verOk = v => { const a = String(v || '0').split('.').map(Number), b = MIN_VER.split('.').map(Number); for (let i = 0; i < 3; i++) { if ((a[i] || 0) !== b[i]) return (a[i] || 0) > b[i]; } return true; };
  const when = t => new Date(t).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
  const CSS = `
  .fw-card{margin-bottom:16px}.fw-card .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  .fw-card input{min-width:220px;flex:1}
  .fw-ask{background:#FFF3C4;color:#6b4e00;border-radius:12px;padding:12px 14px;margin:8px 0}
  .fw-ok{background:#e7f6ec;color:#185c2c;border-radius:12px;padding:12px 14px;margin:8px 0}
  .fw-list{display:grid;gap:8px;margin-top:10px}.fw-list>div{display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-top:1px solid rgba(128,128,128,.25);padding-top:8px}
  .fw-dlg{position:fixed;inset:0;z-index:400;background:rgba(10,10,14,.92);display:flex;flex-direction:column;color:#f2f2f2;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .fw-dlg .hd{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.12);flex-wrap:wrap}
  .fw-dlg .hd b{font-size:16px}.fw-dlg .hd .st{color:#bdbdc6;font-size:13px;flex:1;min-width:160px}
  .fw-dlg button{border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;padding:7px 14px;font:inherit;cursor:pointer}
  .fw-dlg button.p{background:#F7C838;border-color:#F7C838;color:#1D1D1B;font-weight:700}
  .fw-dlg .bd{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:10px;position:relative}
  .fw-dlg .bd img{display:block;max-width:100%;max-height:100%;cursor:crosshair;border-radius:6px;box-shadow:0 6px 30px rgba(0,0,0,.5);user-select:none;-webkit-user-drag:none}
  .fw-dlg .wait{color:#cfcfd6;text-align:center;max-width:420px}
  .fw-dlg .dot{position:fixed;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:3px solid #F7C838;pointer-events:none;animation:fwdot .6s ease-out forwards}
  @keyframes fwdot{from{transform:scale(.4);opacity:1}to{transform:scale(1.6);opacity:0}}
  .fw-dlg .ft{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 14px;border-top:1px solid rgba(255,255,255,.12)}
  .fw-dlg .ft input{flex:1;min-width:180px;background:#1c1c1f;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:10px;padding:8px 10px;font:inherit}`;
  const css = () => { if (!document.getElementById('fw-css')) { const s = document.createElement('style'); s.id = 'fw-css'; s.textContent = CSS; document.head.appendChild(s); } };

  // ---------- Karte auf der Seite „Geräte“ ----------
  let C = null, askedToast = false;
  async function card(ctx) {
    C = ctx; css(); const el = document.getElementById('fwCard'); if (!el) return;
    if (el.contains(document.activeElement) && document.activeElement !== document.body) return; // gerade wird dort getippt oder gewählt
    const { sb, me, profile } = ctx;
    if (profile?.is_admin) {
      const [{ data: devs, error }, { data: reqs }] = await Promise.all([sb.rpc('support_devices'), sb.from('support_access').select('owner_id,status,note,requested_at,until').neq('owner_id', me.id).order('requested_at', { ascending: false }).limit(8)]);
      if (error) { el.innerHTML = /support_devices|function/i.test(error.message) ? '<div class="card fw-card small muted">Fernwartung: Die Server-Einrichtung fehlt noch (SQL 202611130001_fernwartung.sql).</div>' : ''; return; }
      const list = (devs || []).map(d => { const on = d.last_seen && Date.now() - new Date(d.last_seen) < 18e4;
        return `<div><span class="dot ${on ? 'on' : ''}"></span><b>${esc(d.name || 'FotoBox')}</b><span class="small muted">${esc(d.customer || '')} · Version ${esc(d.app_version || '–')} · Freigabe bis ${when(d.until)}</span>
          <span style="flex:1"></span>${d.status?.rustdesk ? rustBtns(d.status.rustdesk) : ''}<button class="btn small primary" data-fw-open="${d.id}" data-fw-name="${esc(d.name || 'FotoBox')}" data-fw-ver="${esc(d.app_version || '')}">🖥 Fernsteuerung</button></div>`; }).join('');
      const st = { requested: 'wartet auf Antwort', granted: 'erlaubt', denied: 'abgelehnt', revoked: 'beendet', expired: 'abgelaufen' };
      for (const r of reqs || []) if (r.status === 'granted' && r.until && new Date(r.until) < new Date()) r.status = 'expired';
      el.innerHTML = `<div class="card fw-card"><h2 style="margin-top:0">Fernwartung bei Kunden</h2>
        <p class="small muted" style="margin:0 0 10px">Fotoboxen deiner Kunden siehst du nur, wenn der Kunde zustimmt. Er bekommt deine Anfrage im Dashboard und kann sie annehmen oder ablehnen. Jeder Zugriff wird protokolliert.</p>
        <div class="row"><input type="email" id="fwMail" placeholder="E-Mail des Kunden"><input id="fwNote" placeholder="Grund (sieht der Kunde), z. B. Drucker einrichten" maxlength="300"><button class="btn primary" id="fwAsk">Zugriff anfragen</button></div>
        ${list ? `<div class="fw-list">${list}</div>` : '<p class="small muted" style="margin:10px 0 0">Zurzeit hat kein Kunde den Zugriff freigegeben.</p>'}
        ${(reqs || []).length ? `<details style="margin-top:10px"><summary class="small">Letzte Anfragen</summary><div class="small muted" style="margin-top:6px">${reqs.map(r => `<div>${when(r.requested_at)} · ${esc(st[r.status] || r.status)}${r.status === 'granted' && r.until ? ' bis ' + when(r.until) : ''}${r.note ? ' · ' + esc(r.note) : ''}</div>`).join('')}</div></details>` : ''}</div>`;
      return;
    }
    const [{ data, error }, { data: log }] = await Promise.all([sb.from('support_access').select('id,status,note,requested_at,until').eq('owner_id', me.id).order('requested_at', { ascending: false }).limit(5), sb.rpc('support_log')]);
    if (error) { el.innerHTML = ''; return; }
    const LOGN = { 'fernwartung.anfrage': 'Anfrage von Photobox Memories', 'fernwartung.erlaubt': 'Zugriff erlaubt', 'fernwartung.abgelehnt': 'Anfrage abgelehnt', 'fernwartung.beendet': 'Zugriff beendet', 'fernwartung.sitzung': 'Photobox Memories hat eine Fotobox ferngesteuert' };
    const ask = (data || []).find(r => r.status === 'requested'), ok = (data || []).find(r => r.status === 'granted' && new Date(r.until) > new Date());
    el.innerHTML = `<div class="card fw-card"><h2 style="margin-top:0">Fernwartung durch Photobox Memories</h2>
      ${ask ? `<div class="fw-ask"><b>Photobox Memories bittet um Zugriff auf deine Fotoboxen.</b>${ask.note ? `<div style="margin-top:4px">Grund: ${esc(ask.note)}</div>` : ''}
        <div class="small" style="margin:6px 0 10px">Mit deiner Erlaubnis kann Photobox Memories den Bildschirm deiner Fotoboxen sehen und Einstellungen ändern – für die gewählte Zeit. An der Fotobox steht dann oben „Fernwartung durch Photobox Memories aktiv“.</div>
        <div class="row"><select id="fwHours"><option value="2">2 Stunden</option><option value="24" selected>24 Stunden</option><option value="72">3 Tage</option></select><button class="btn primary" data-fw-answer="${ask.id}" data-fw-yes="1">Erlauben</button><button class="btn" data-fw-answer="${ask.id}">Ablehnen</button></div></div>` : ''}
      ${ok ? `<div class="fw-ok"><b>Photobox Memories hat Zugriff bis ${when(ok.until)}.</b><div class="row" style="margin-top:8px"><button class="btn" id="fwRevoke">Zugriff jetzt beenden</button></div></div>`
        : ask ? '' : `<p class="small muted" style="margin:0 0 10px">Photobox Memories hat keinen Zugriff auf deine Fotoboxen. Brauchst du Hilfe, kannst du den Zugriff hier für eine begrenzte Zeit erlauben.</p><div class="row"><button class="btn" id="fwGrant">Photobox Memories 24 Stunden Zugriff geben</button></div>`}
      ${(log || []).length ? `<details style="margin-top:10px"><summary class="small">Protokoll</summary><div class="small muted" style="margin-top:6px">${log.map(r => `<div>${when(r.at)} · ${esc(LOGN[r.action] || r.action)}</div>`).join('')}</div></details>` : ''}
      <p class="small muted" style="margin:10px 0 0">Deine eigenen Fotoboxen kannst du jederzeit selbst fernsteuern: unten bei der Fotobox auf „Details“ und dann „Fernsteuerung“.</p></div>`;
    if (ask && !askedToast) { askedToast = true; ctx.toast('Photobox Memories bittet um Fernwartung deiner Fotoboxen – bitte unter „Geräte“ erlauben oder ablehnen.', 8000); }
  }
  document.addEventListener('click', async e => {
    const t = e.target.closest('#fwAsk,#fwGrant,#fwRevoke,[data-fw-answer],[data-fw-open],[data-fw-copy]'); if (!t || !C) return;
    const { sb, toast } = C;
    if (t.dataset.fwCopy !== undefined) { try { await navigator.clipboard.writeText(t.dataset.fwCopy); toast('RustDesk-Nummer kopiert', 2500); } catch {} return; }
    if (t.dataset.fwOpen) return open(C, { id: t.dataset.fwOpen, name: t.dataset.fwName, app_version: t.dataset.fwVer });
    let r;
    if (t.id === 'fwAsk') {
      const mail = $(document, '#fwMail').value.trim(); if (!mail) return toast('Bitte die E-Mail des Kunden eintragen.');
      r = await sb.rpc('support_request', { p_email: mail, p_note: $(document, '#fwNote').value.trim() || null });
      if (r.data?.ok) toast('Anfrage gesendet – der Kunde sieht sie in seinem Dashboard unter „Geräte“.', 6000);
    } else if (t.id === 'fwGrant') r = await sb.rpc('support_grant', { p_hours: 24 });
    else if (t.id === 'fwRevoke') r = await sb.rpc('support_revoke');
    else if (t.dataset.fwAnswer) r = await sb.rpc('support_answer', { p_id: t.dataset.fwAnswer, p_accept: !!t.dataset.fwYes, p_hours: +($(document, '#fwHours')?.value || 24) });
    if (r?.error || r?.data?.ok === false) return toast('Fehler: ' + (r.data?.error || r.error?.message || ''), 6000);
    if (t.id !== 'fwAsk') toast(t.id === 'fwRevoke' ? 'Zugriff beendet' : t.dataset.fwAnswer && !t.dataset.fwYes ? 'Anfrage abgelehnt' : 'Zugriff erlaubt', 3500);
    card(C);
  });
  const rustBtns = id => `<span class="small">RustDesk <b>${esc(id)}</b></span><button class="btn small" data-fw-copy="${esc(id)}">Kopieren</button><a class="btn small" href="rustdesk://connection/new/${encodeURIComponent(id)}">In RustDesk öffnen</a>`;

  // Zeile im Fernsteuerungs-Bereich eines Geräts (Dashboard → Geräte → Details)
  function deviceRow(d) {
    const ok = verOk(d.app_version), rd = d.status?.rustdesk;
    return `<div class="row" style="margin-bottom:12px;align-items:center"><button class="btn primary" data-fw-open="${d.id}" data-fw-name="${esc(d.name || 'FotoBox')}" data-fw-ver="${esc(d.app_version || '')}" ${ok ? '' : 'disabled'}>🖥 Bildschirm ansehen und steuern</button>
      ${ok ? '' : `<span class="small muted">Braucht die Fotobox-Version ${MIN_VER} oder neuer.</span>`}${rd ? rustBtns(rd) : ''}</div>`;
  }

  // ---------- Fernsteuerung ----------
  async function open(ctx, dev) {
    css(); const { sb, toast } = ctx;
    if (!verOk(dev.app_version) && !confirm(`Diese Fotobox hat die Version ${dev.app_version || '?'} – die Fernsteuerung braucht ${MIN_VER} oder neuer. Trotzdem versuchen?`)) return;
    const s = await sb.rpc('remote_start', { p_device: dev.id });
    if (s.error || !s.data?.ok) return toast('Fernsteuerung nicht möglich: ' + (s.data?.error || s.error?.message || ''), 6000);
    const d = document.createElement('div'); d.className = 'fw-dlg';
    d.innerHTML = `<div class="hd"><b>🖥 ${esc(dev.name || 'FotoBox')}</b><span class="st">Verbinde … die Fotobox meldet sich in bis zu 15 Sekunden.</span><button class="p" data-x>Beenden</button></div>
      <div class="bd"><div class="wait">Warte auf das Bild der Fotobox …</div><img alt="Bildschirm der Fotobox" hidden draggable="false"></div>
      <div class="ft"><input placeholder="Text eintippen (geht in das gerade gewählte Feld)" maxlength="200"><button data-send>Senden</button>
        <button data-k="Enter">⏎ Enter</button><button data-k="Backspace">⌫</button><button data-k="Tab">Tab</button><button data-k="Escape">Esc</button><button data-k="Up">↑</button><button data-k="Down">↓</button></div>`;
    document.body.appendChild(d);
    const img = $(d, 'img'), stEl = $(d, '.st'), wait = $(d, '.wait'), inp = $(d, '.ft input');
    let alive = true, lastAt = '', t0 = Date.now(), queue = [], sending = false, wheel = 0, wheelT = 0;
    const send = async evs => { queue.push(...evs); if (sending) return; sending = true;
      while (queue.length && alive) { const part = queue.splice(0, 20); const r = await sb.rpc('remote_input', { p_device: dev.id, p_events: part }); if (r.data?.ok === false) { stEl.textContent = 'Sitzung beendet.'; break; } }
      sending = false; };
    const tick = async () => {
      if (!alive) return;
      const { data } = await sb.rpc('remote_view', { p_device: dev.id, p_since: lastAt || null });
      if (!alive) return;
      if (data?.ok === false) { stEl.textContent = 'Kein Zugriff mehr auf diese Fotobox.'; return; }
      if (data?.ok && !data.active) { stEl.textContent = 'Die Sitzung ist beendet.'; return; }
      if (data?.screen && data.screen_at !== lastAt) { lastAt = data.screen_at; img.src = data.screen; img.hidden = false; wait.hidden = true;
        stEl.innerHTML = `<span>Verbunden</span> · ${new Date(data.screen_at).toLocaleTimeString('de-DE')} · <span>Klicken = tippen, Mausrad = scrollen</span>`; }
      else if (!lastAt && Date.now() - t0 > 45000) wait.textContent = 'Die Fotobox antwortet nicht. Ist sie eingeschaltet, mit dem Internet verbunden und auf Version 1.18.96 oder neuer?';
      setTimeout(tick, 1000);
    };
    tick();
    const keep = setInterval(() => { if (alive) sb.rpc('remote_input', { p_device: dev.id, p_events: [] }); }, 120000); // Sitzung verlängern, solange das Fenster offen ist
    const rel = e => { const r = img.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }; };
    img.addEventListener('click', e => { const p = rel(e); send([{ t: 'click', ...p }]);
      const dot = document.createElement('div'); dot.className = 'dot'; dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; d.appendChild(dot); setTimeout(() => dot.remove(), 700); });
    img.addEventListener('wheel', e => { e.preventDefault(); wheel += e.deltaY; const p = rel(e); clearTimeout(wheelT);
      wheelT = setTimeout(() => { const dy = Math.round(wheel); wheel = 0; if (dy) send([{ t: 'wheel', dy, ...p }]); }, 150); }, { passive: false });
    const close = async () => { if (!alive) return; alive = false; clearInterval(keep); d.remove(); await sb.rpc('remote_stop', { p_device: dev.id }); };
    d.addEventListener('click', e => {
      if (e.target.closest('[data-x]')) return close();
      const k = e.target.closest('[data-k]'); if (k) return send([{ t: 'key', k: k.dataset.k }]);
      if (e.target.closest('[data-send]') && inp.value) { send([{ t: 'text', v: inp.value }]); inp.value = ''; }
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && inp.value) { send([{ t: 'text', v: inp.value }]); inp.value = ''; } });
    addEventListener('beforeunload', () => { if (alive) sb.rpc('remote_stop', { p_device: dev.id }); }, { once: true });
  }
  G.Fernwartung = { card, open, deviceRow };
})(window);
