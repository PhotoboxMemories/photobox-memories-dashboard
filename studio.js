// Dashboard → „Template-Studio“ (Zusatzfunktion 'studio'): Der Fotobox-Vermieter richtet sein Studio ein (Adresse, Logo, Farbe,
// Kategorien, Datenschutz-Link), kopiert Link bzw. Einbettungscode für seine Webseite und bearbeitet die Einsendungen seiner Kunden:
// Vorschau, Druckvorlage herunterladen, im Studio öffnen, als Fotolayout in ein Ereignis übernehmen, löschen.
// Daten: public.studio_sites / public.studio_submissions; Löschen über die Serverfunktion „studio“ (Dateien bei Hetzner).
// StudioPage.open(ctx) – ctx = { sb, me, toast, uploadFile, extra(k), tier(), reloadTier(), events(), reloadEvents(), admin, demo }
// standalone: true im eigenen Bereich auf boothdesigner.de/konto (ohne Fotobox-Software: kein „In Ereignis übernehmen“)
(function (G) {
  'use strict';
  // wie CATEGORIES im Template-Studio (template-studio/editor/template-studio.src.html)
  const STUDIO_CATS = ['Hochzeit', 'Geburtstag & Party', 'Sommerfest', 'Abschluss', 'JGA', 'Babyparty', 'Taufe', 'Kommunion & Konfirmation', 'Firmenfeier', 'Weihnachten', 'Feiertage'];
  const STATUS = [['neu', 'Neu'], ['in_arbeit', 'In Arbeit'], ['erledigt', 'Erledigt']];
  // Formate des Studios (Breite × Höhe) → Papierformat der Fotobox (FBR.FORMATS)
  const FORMAT_OF = { '600x1800': '2x6', '1200x1800': '4x6p', '1800x1200': '4x6l', '1500x1500': '5x5' };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
  const toSlug = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  const fmtDate = d => d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('de-DE') : '–';
  const CSS = `
  #studioRoot .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  #studioRoot .chips{display:flex;flex-wrap:wrap;gap:8px}
  #studioRoot .chips label{display:inline-flex;gap:6px;align-items:center;border:1px solid var(--line);border-radius:999px;padding:5px 11px;margin:0;font-weight:500;cursor:pointer}
  #studioRoot .code{background:#1d1d24;color:#f2f2f2;border-radius:10px;padding:12px 14px;font:12.5px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-all}
  #studioRoot .subs{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}
  #studioRoot .sub{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
  #studioRoot .sub .pv{background:#eceae4;aspect-ratio:4/3;display:grid;place-items:center}
  #studioRoot .sub .pv img{max-width:100%;max-height:100%;object-fit:contain}
  #studioRoot .sub .bd{padding:12px 14px;display:grid;gap:6px;font-size:13.5px}
  #studioRoot .sub .bd b{font-size:15px}
  #studioRoot .sub .acts{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 14px}
  #studioRoot .badge{display:inline-block;border-radius:999px;padding:1px 9px;font-size:12px;font-weight:700;background:#FFF3C4;color:#8a6400}
  #studioRoot .badge.erledigt{background:#e3f4e6;color:#1f7a35} #studioRoot .badge.in_arbeit{background:#e5eefc;color:#2456a6}
  #studioRoot .msg{background:#f6f4ee;border-radius:8px;padding:6px 9px;white-space:pre-wrap}
  @media (max-width:760px){#studioRoot .grid2{grid-template-columns:1fr}}`;

  let ctx = null, site = null, subs = [], plans = [], shopReady = false, abo = null, filter = 'offen', fixes = [];
  const $ = s => document.querySelector(s);
  const root = () => $('#studioRoot');
  const studioUrl = () => String(G.FOTOBOX_CONFIG?.studioUrl || '').replace(/\/+$/, '');
  const fileUrl = (s, f) => `${String(G.FOTOBOX_CONFIG?.photoStore || '').replace(/\/$/, '')}/${s.owner_id}/studio/${s.folder}/${f}`;
  const link = (extra = '') => studioUrl() && site ? `${studioUrl()}/studio/?b=${encodeURIComponent(site.slug)}${extra}` : '';

  async function open(c) {
    ctx = c;
    if (!$('#studioCss')) { const st = document.createElement('style'); st.id = 'studioCss'; st.textContent = CSS; document.head.appendChild(st); }
    root().innerHTML = '<p class="muted">Lädt …</p>';
    // Rückkehr von der Stripe-Bezahlseite (nur boothdesigner.de/konto, im Dashboard kehrt Stripe ins Dashboard zurück)
    const paid = ctx.standalone && new URLSearchParams(location.search).get('lizenz');
    if (paid) {
      const q = new URLSearchParams(location.search); q.delete('lizenz');
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
      if (paid === 'ok') { ctx.toast('Danke für deine Buchung! BoothDesigner wird freigeschaltet …', 8000); await waitAbo(); }
      else ctx.toast('Bezahlung abgebrochen – es wurde nichts gebucht.', 6000);
    }
    await loadShop();
    if (!ctx.extra('studio')) return locked();
    await load();
    render();
    // abgelaufene Einsendungen (Frist nach der Veranstaltung) im Hintergrund löschen
    if (!ctx.demo) call({ action: 'cleanup' }).then(r => { if (r?.deleted) { subs = subs.filter(s => new Date(s.delete_after) > new Date()); render(); } }).catch(() => {});
  }

  async function call(body) {
    const { data, error } = await ctx.sb.functions.invoke('studio', { body });
    if (error) { let m = error.message; try { m = (await error.context.json()).error || m; } catch {} throw new Error(m); }
    return data;
  }

  async function load() {
    const [a, b] = await Promise.all([
      ctx.sb.from('studio_sites').select('*').eq('owner_id', ctx.me.id).maybeSingle(),
      ctx.sb.from('studio_submissions').select('*').eq('owner_id', ctx.me.id).order('created_at', { ascending: false }).limit(500)]);
    site = (Array.isArray(a.data) ? a.data[0] : a.data) || null; subs = Array.isArray(b.data) ? b.data : []; // Vorführung: Listen statt Einzelzeile
    if (ctx.admin && !ctx.demo) fixes = (await ctx.sb.from('studio_design_fixes').select('design,layout,updated_at').order('updated_at', { ascending: false })).data || [];
  }

  // ---------- Abo über Stripe (Serverfunktion license-shop) ----------
  // Tarife studio-monat/-jahr; abo = bezahltes Abo des Kontos (license_addons mit Stripe-Abo). Auf boothdesigner.de/konto
  // schickt site: 'boothdesigner' Bezahlseite und Kundenportal dorthin zurück.
  async function loadShop() {
    if (ctx.demo) return;
    const [p, st, a] = await Promise.all([ctx.sb.from('plans').select('*').in('id', ['studio-monat', 'studio-jahr']).eq('active', true).order('sort'),
      ctx.sb.functions.invoke('license-shop', { body: { action: 'status' } }),
      ctx.sb.from('license_addons').select('valid_until,stripe_subscription').eq('owner_id', ctx.me.id).eq('extra', 'studio')
        .not('stripe_subscription', 'is', null).order('valid_until', { ascending: false }).limit(1)]);
    plans = p.data || []; shopReady = !!st.data?.ready; abo = (a.data || [])[0] || null;
  }
  const aboLive = () => !!abo && new Date(abo.valid_until) > new Date();
  // Stripe meldet die Zahlung ein paar Sekunden nach der Rückkehr (stripe-webhook) – so lange warten
  async function waitAbo() {
    for (let i = 0; i < 15; i++) {
      await loadShop(); if (aboLive()) { await ctx.reloadTier(); return ctx.toast('BoothDesigner-Abo ist aktiv – danke!', 6000); }
      await new Promise(r => setTimeout(r, 2000));
    }
    await ctx.reloadTier(); ctx.toast('Die Zahlung wird noch bearbeitet. Lade die Seite in einer Minute neu.', 8000);
  }
  async function shop(body) {
    const { data, error } = await ctx.sb.functions.invoke('license-shop', { body: ctx.standalone ? { ...body, site: 'boothdesigner' } : body });
    if (error || !data?.url) { let m = data?.error; try { m = m || (await error.context.json()).error; } catch {} throw new Error(m || 'Stripe ist momentan nicht erreichbar.'); }
    location.href = data.url;
  }
  const buyButtons = primary => plans.map(p => `<button class="btn${primary ? ' primary' : ''}" data-a="buy" data-plan="${esc(p.id)}" ${shopReady ? '' : 'disabled title="Der Kauf ist noch nicht freigeschaltet"'}>${esc(p.name)} · ${(p.cents / 100).toLocaleString('de-DE')} € / ${p.billing === 'year' ? 'Jahr' : 'Monat'}</button>`).join('');
  const agbNote = () => plans.length ? `<p class="small muted" style="margin-top:10px">Bezahlung über Stripe. Das Abo verlängert sich automatisch und ist jederzeit zum Ende der Laufzeit kündbar. Es gelten die <a href="${esc(studioUrl() || 'https://boothdesigner.de')}/agb.html" target="_blank" rel="noopener">AGB von BoothDesigner</a>.</p>` : '';
  async function onShop(b) {
    b.disabled = true;
    try { await shop(b.dataset.a === 'buy' ? { action: 'checkout', plan: b.dataset.plan, devices: 1 } : { action: 'portal' }); }
    catch (err) { ctx.toast(err.message || String(err), 6000); b.disabled = false; }
  }
  // Testzeitraum läuft bzw. Abo aktiv: Buchen bzw. „Abo & Rechnungen verwalten“ (nicht für Betreiber und dauerhaft freigeschaltete Konten)
  function aboCard() {
    const t = ctx.tier() || {}, until = t.studio_until ? new Date(t.studio_until) : null;
    if (ctx.admin || ctx.demo || !until || until.getFullYear() >= 2100) return '';
    // Neues Abo-Modell: BoothDesigner ist im bezahlten Fotobox-Abo enthalten (my_tier.studio_in_abo) – dann kein eigenes Abo anbieten
    if (t.studio_in_abo) return `<div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between;align-items:center;gap:12px">
        <span><b>Im Fotobox-Abo enthalten</b> <span class="small muted">· BoothDesigner läuft mit deinem Fotobox-Abo${t.studio_until ? ` bis ${fmtDate(t.studio_until)}` : ''} und verlängert sich mit ihm</span></span>
        ${aboLive() ? '<button class="btn small" data-a="portal">Abo &amp; Rechnungen verwalten</button>' : ''}</div>
        ${aboLive() ? '<p class="small" style="margin:8px 0 0">Du hast zusätzlich noch ein eigenes BoothDesigner-Abo. Das brauchst du nicht mehr – du kannst es unter „Abo &amp; Rechnungen verwalten“ kündigen.</p>' : ''}</div>`;
    if (aboLive()) return `<div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between;align-items:center;gap:12px">
        <span><b>BoothDesigner-Abo aktiv</b> <span class="small muted">· verlängert sich am ${fmtDate(abo.valid_until)} automatisch, solange du nicht kündigst</span></span>
        <button class="btn small" data-a="portal">Abo &amp; Rechnungen verwalten</button></div></div>`;
    if (!plans.length) return '';
    return `<div class="card" style="margin-top:14px"><b>Jetzt das BoothDesigner-Abo buchen</b> <span class="small muted">· freigeschaltet bis ${fmtDate(t.studio_until)}</span>
        <p class="small" style="margin:6px 0 10px">Damit deine Kunden das Studio danach weiter nutzen können, buche jetzt das Abo – deine Einstellungen und Einsendungen bleiben.</p>
        <div class="row">${buyButtons(true)}</div>${agbNote()}</div>`;
  }

  // ---------- Noch nicht freigeschaltet: testen oder buchen ----------
  async function locked() {
    const t = ctx.tier() || {};
    const ended = t.studio_until && new Date(t.studio_until) < new Date();
    root().innerHTML = `<div class="pagehead"><h1>BoothDesigner</h1></div>
      <div class="card" style="max-width:820px">
        <h2 style="margin-top:0">Deine Kunden gestalten ihr Fotolayout selbst</h2>
        <p>Über 100 Designs für Hochzeit, Geburtstag, Taufe, Firmenfeier und mehr – auf deiner eigenen Webseite, mit deinem Logo und deinen Farben.
          Deine Kunden tragen Namen und Datum ein, passen das Design an und schicken es ab. Du bekommst eine Mail und übernimmst das Design mit einem Klick als Fotolayout in dein Ereignis.</p>
        ${ended ? '<p class="small" style="background:#FFF3C4;border-radius:10px;padding:8px 12px">Dein Test bzw. Abo ist abgelaufen. Deine Einstellungen und Einsendungen bleiben erhalten, bis du weitermachst.</p>' : ''}
        <div class="row" style="margin-top:14px">
          ${!t.studio_trial_used ? '<button class="btn primary" data-a="trial">14 Tage kostenlos testen</button>' : ''}
          ${buyButtons(t.studio_trial_used)}
          ${abo ? '<button class="btn" data-a="portal">Rechnungen ansehen</button>' : ''}
        </div>
        ${agbNote()}
        ${!t.studio_trial_used ? '<p class="small muted" style="margin-top:10px">Ohne Zahlungsdaten. Der Test endet nach 14 Tagen von selbst.</p>' : ''}
        ${!plans.length && t.studio_trial_used ? '<p class="small muted" style="margin-top:10px">Zum Buchen melde dich bitte bei uns – der Online-Kauf wird gerade eingerichtet.</p>' : ''}
      </div>`;
    root().onclick = async e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'buy' || b.dataset.a === 'portal') return onShop(b);
      b.disabled = true;
      try {
        if (b.dataset.a === 'trial') {
          const { error } = await ctx.sb.rpc('studio_trial'); if (error) throw error;
          await ctx.reloadTier(); ctx.toast('BoothDesigner freigeschaltet – viel Spaß beim Testen!'); return open(ctx);
        }
      } catch (err) { ctx.toast(err.message || String(err), 6000); }
      b.disabled = false;
    };
  }

  // ---------- Seite ----------
  function render() {
    const t = ctx.tier() || {}, until = t.studio_until ? new Date(t.studio_until) : null;
    const shown = subs.filter(s => filter === 'alle' || (filter === 'offen' ? s.status !== 'erledigt' : s.status === 'erledigt'));
    const n = subs.filter(s => s.status === 'neu').length;
    root().innerHTML = `<div class="pagehead"><h1>BoothDesigner</h1>
        <span class="small muted">${ctx.admin ? 'Betreiber-Konto' : until && until.getFullYear() < 2100 ? `Freigeschaltet bis ${until.toLocaleDateString('de-DE')}` : ''}</span></div>
      ${aboCard()}
      ${site ? linkCard() : ''}
      ${ctx.admin && !ctx.demo ? fixCard() : ''}
      <h2 style="margin:26px 0 12px">Einsendungen ${n ? `<span class="badge">${n} neu</span>` : ''}</h2>
      ${site ? `<div class="row" style="margin-bottom:12px">${[['offen', 'Offen'], ['erledigt', 'Erledigt'], ['alle', 'Alle']].map(([k, l]) =>
        `<button class="btn small${filter === k ? ' primary' : ''}" data-a="filter" data-f="${k}">${l}</button>`).join('')}</div>
        <div class="subs">${shown.length ? shown.map(subCard).join('') : '<p class="muted">Noch keine Einsendungen. Schick deinen Kunden den Link oder baue das Studio auf deiner Webseite ein.</p>'}</div>`
        : '<p class="muted">Richte zuerst unten dein Studio ein – danach erscheinen hier die Designs deiner Kunden.</p>'}
      <h2 style="margin:30px 0 12px">Einstellungen</h2>
      ${settingsCard()}`;
    root().onclick = onClick; root().onchange = onChange;
  }

  // ---------- Nur Betreiber: Designs für alle Kunden korrigieren ----------
  // Öffnet das Studio mit einem Admin-Zugang (2 Stunden, Serverfunktion „studio“ → admin-ticket); dort unten „Für dieses Format speichern“.
  function fixCard() {
    return `<div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px">
      <div><b>Designs korrigieren</b> <span class="badge">nur Admin</span><p class="small muted" style="margin:4px 0 0">Öffnet das Studio im Admin-Modus: Design und Format wählen, im erweiterten Modus Texte, Deko und Fotofelder anpassen, unten „Für dieses Format speichern“. Alle Kunden sehen danach die korrigierte Fassung; eingetippte Texte bleiben.</p></div>
      <button class="btn primary" data-a="fixopen">Studio als Admin öffnen</button></div>
      ${fixes.length ? `<div style="margin-top:12px;display:grid;gap:6px">${fixes.map(f => `<div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding-top:6px">
        <span class="small"><b>${esc(f.design)}</b> · ${f.layout === '*' ? 'Schrift &amp; Farben für alle Formate' : f.layout.startsWith('size-') ? esc(fixSize(f.layout)) : esc(f.layout)} <span class="muted">· ${fmtDate(f.updated_at)}</span></span>
        <button class="btn small danger" data-a="fixdel" data-d="${esc(f.design)}" data-l="${esc(f.layout)}">Entfernen</button></div>`).join('')}</div>` : '<p class="small muted" style="margin:10px 0 0">Noch keine Korrekturen.</p>'}
    </div>`;
  }
  // „size-1200x1800“ → „alle 4×6-Formate (hoch)“ (Pixelmaße des Studios bei 300 dpi)
  const fixSize = k => { const [w, h] = k.slice(5).split('x').map(Number), a = Math.min(w, h) / 300, b = Math.max(w, h) / 300;
    return `alle ${a === b ? a + '×' + b : w < h ? a + '×' + b : b + '×' + a}-Formate${a === b ? '' : w < h ? ' (hoch)' : ' (quer)'}`; };
  async function adminTicket() { return (await call({ action: 'admin-ticket' })).ticket; }

  function linkCard() {
    const url = link();
    if (!url) return `<div class="card"><b>Link zu deinem Studio</b><p class="small muted" style="margin:6px 0 0">Die Adresse von BoothDesigner ist noch nicht eingetragen (config.js → studioUrl). Sobald die Domain eingerichtet ist, erscheinen hier Link und Einbettungscode.</p></div>`;
    const code = `<iframe src="${url}" style="width:100%;height:90vh;min-height:640px;border:0" title="Fotobox-Design gestalten" loading="lazy"></iframe>`;
    return `<div class="card"><div class="grid2">
      <div><b>Link für deine Kunden</b><p class="small muted" style="margin:4px 0 8px">Z. B. in die Buchungsbestätigung oder per WhatsApp.</p>
        <div class="code">${esc(url)}</div>
        <div class="row" style="margin-top:8px"><button class="btn small" data-a="copy" data-v="${esc(url)}">Link kopieren</button><a class="btn small" href="${esc(url)}" target="_blank" rel="noopener">${ctx.standalone ? 'Selbst gestalten' : 'Studio öffnen'}</a></div>
        ${ctx.standalone ? '<p class="small muted" style="margin:8px 0 0">„Selbst gestalten“: Angemeldet kannst du im Studio auch eigene Vorlagen erstellen und als PNG herunterladen – ohne Einsendung.</p>' : ''}</div>
      <div><b>Einbettungscode für deine Webseite</b><p class="small muted" style="margin:4px 0 8px">In WordPress, Wix, Jimdo, Shopware … als „HTML“-Block einfügen.</p>
        <div class="code">${esc(code)}</div>
        <div class="row" style="margin-top:8px"><button class="btn small" data-a="copy" data-v="${esc(code)}">Code kopieren</button></div></div>
    </div></div>`;
  }

  function subCard(s) {
    const fmt = FORMAT_OF[`${s.w}x${s.h}`];
    return `<div class="sub" data-id="${esc(s.id)}">
      <a class="pv" href="${esc(fileUrl(s, 'preview.jpg'))}" target="_blank" rel="noopener"><img loading="lazy" alt="Vorschau" src="${esc(fileUrl(s, 'preview.jpg'))}"></a>
      <div class="bd"><div class="row" style="justify-content:space-between"><b>${esc(s.customer_name)}</b><span class="badge ${esc(s.status)}">${esc((STATUS.find(x => x[0] === s.status) || [, s.status])[1])}</span></div>
        <a href="mailto:${esc(s.customer_email)}">${esc(s.customer_email)}</a>
        <span class="muted">${esc(s.design_name || s.design)} · ${esc(s.layout_name || s.layout)}${variantsOf(s).length ? ` · plus ${variantsOf(s).length} ${variantsOf(s).length === 1 ? 'Variante' : 'Varianten'}` : ''}</span>
        ${variantsOf(s).length ? `<span class="muted">Druckvorlagen der Varianten: ${variantsOf(s).map(v => `<a href="${esc(fileUrl(s, v.file))}" download target="_blank" rel="noopener">${esc(v.layout_name || v.layout)}</a>`).join(' · ')}</span>` : ''}
        <span class="muted">Veranstaltung: ${fmtDate(s.event_date)} · eingegangen ${fmtDate(s.created_at)}</span>
        ${s.event_id ? `<span class="muted">Ereignis: ${esc((ctx.events() || []).find(e => e.id === s.event_id)?.name || (ctx.standalone ? 'im Dashboard von Photobox Memories' : 'gelöscht'))}${s.event_created ? ' · automatisch angelegt' : s.auto_layout ? ' · als Fotolayout übernommen' : ''}</span>` : ''}
        ${s.start_kind ? `<span class="muted">Startbildschirm als ${s.start_kind === 'image' ? 'Bild' : 'Animation'}: ${['p', 'l'].map(o => `<a href="${esc(fileUrl(s, `start-${o}.${({ image: 'jpg', video: 'mp4', webm: 'webm' })[s.start_kind]}`))}" target="_blank" rel="noopener">${o === 'p' ? 'hoch' : 'quer'}</a>`).join(' · ')}</span>` : ''}
        ${s.message ? `<div class="msg">${esc(s.message)}</div>` : ''}
        <select data-a="status" style="margin-top:4px">${STATUS.map(([k, l]) => `<option value="${k}"${s.status === k ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="acts">
        <a class="btn small" href="${esc(fileUrl(s, 'print.png'))}" download target="_blank" rel="noopener">⬇ Druckvorlage</a>
        ${link() ? `<a class="btn small" href="${esc(link('&s=' + s.folder))}" target="_blank" rel="noopener">Im Studio öffnen</a>` : ''}
        ${!fmt ? '<span class="small muted" title="Startbildschirme werden als Bild heruntergeladen">Startbildschirm</span>' : ctx.standalone ? '' : '<button class="btn small primary" data-a="adopt">In Ereignis übernehmen</button>'}
        <button class="btn small danger" data-a="del">Löschen</button>
      </div></div>`;
  }

  function settingsCard() {
    const s = site || { slug: toSlug(ctx.me?.email?.split('@')[0] || ''), name: '', accent: '#b08d57', intro: '', cats: [], allow_download: false, keep_days: 180, active: true, auto_event: !ctx.standalone }; // ohne Fotobox-Software: keine Ereignisse
    return `<form class="card" id="studioForm" style="display:grid;gap:14px;max-width:900px">
      <div class="grid2">
        <div><label>Name deiner Firma</label><input name="name" maxlength="80" value="${esc(s.name)}" placeholder="z. B. Fotobox Müller" required></div>
        <div><label>Adresse deines Studios</label><input name="slug" maxlength="40" value="${esc(s.slug)}" placeholder="z. B. fotobox-mueller" pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]" required>
          <p class="small muted" style="margin:4px 0 0">Nur Kleinbuchstaben, Zahlen und Bindestriche. ${studioUrl() ? `Wird zu ${esc(studioUrl())}/studio/?b=…` : ''}</p></div>
      </div>
      <div class="grid2">
        <div><label>Logo</label><div class="row">${s.logo_url ? `<img src="${esc(s.logo_url)}" alt="" style="height:40px;max-width:140px;object-fit:contain;background:#f4f4f6;border-radius:8px;padding:4px">` : ''}
          <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="flex:1">${s.logo_url ? '<button class="btn small" type="button" data-a="nologo">Entfernen</button>' : ''}</div></div>
        <div><label>Farbe für Knöpfe</label><input type="color" name="accent" value="${esc(s.accent)}"></div>
      </div>
      <div><label>Hinweis für deine Kunden (freiwillig)</label><input name="intro" maxlength="300" value="${esc(s.intro)}" placeholder="z. B. Schick uns dein Design bis spätestens 2 Wochen vor der Feier."></div>
      <div><label>Angebotene Kategorien (keine ausgewählt = alle)</label><div class="chips">${STUDIO_CATS.map(c =>
        `<label><input type="checkbox" name="cats" value="${esc(c)}"${(s.cats || []).includes(c) ? ' checked' : ''}> ${esc(c)}</label>`).join('')}</div></div>
      <div class="grid2">
        <div><label>Benachrichtigung an (E-Mail)</label><input type="email" name="notify_email" maxlength="200" value="${esc(s.notify_email || '')}" placeholder="${esc(ctx.me?.email || '')}"></div>
        <div><label>Einsendungen löschen nach der Veranstaltung</label><select name="keep_days">${[30, 90, 180, 365, 730].map(d =>
          `<option value="${d}"${+s.keep_days === d ? ' selected' : ''}>nach ${d < 365 ? d + ' Tagen' : d === 365 ? '1 Jahr' : '2 Jahren'}</option>`).join('')}</select></div>
      </div>
      <div class="grid2">
        <div><label>Link zu deiner Datenschutzerklärung (Pflicht)</label><input type="url" name="privacy_url" maxlength="600" value="${esc(s.privacy_url || '')}" placeholder="https://deine-seite.de/datenschutz" required></div>
        <div><label>Link zu deinem Impressum</label><input type="url" name="imprint_url" maxlength="600" value="${esc(s.imprint_url || '')}" placeholder="https://deine-seite.de/impressum"></div>
      </div>
      <p class="small muted" style="margin:0">Datenschutz: Du bist für die Daten deiner Kunden verantwortlich, wir verarbeiten sie in deinem Auftrag (AVV). Ergänze in deiner
        Datenschutzerklärung einen Absatz zu BoothDesigner – eine Vorlage bekommst du von uns.</p>
      <label class="row" style="font-weight:500;margin:0"><input type="checkbox" name="auto_event"${s.auto_event !== false ? ' checked' : ''}> Für jede Einsendung gleich ein Ereignis anlegen – mit Fotolayout und Startbildschirm des Kunden (änderbar und löschbar)</label>
      <label class="row" style="font-weight:500;margin:0"><input type="checkbox" name="allow_download"${s.allow_download ? ' checked' : ''}> Kunden dürfen ihr Design auch selbst als PNG herunterladen</label>
      <label class="row" style="font-weight:500;margin:0"><input type="checkbox" name="active"${s.active ? ' checked' : ''}> Studio ist online (aus = Kunden sehen „nicht verfügbar“)</label>
      <div class="row"><button class="btn primary" type="submit">${site ? 'Speichern' : 'Studio einrichten'}</button><span class="small muted" id="studioSaveMsg"></span></div>
    </form>`;
  }

  // ---------- Bedienung ----------
  async function onClick(e) {
    const b = e.target.closest('[data-a]'); if (!b || b.tagName === 'SELECT') return;
    const card = b.closest('.sub'), s = card && subs.find(x => x.id === card.dataset.id);
    if (b.dataset.a === 'filter') { filter = b.dataset.f; return render(); }
    if (b.dataset.a === 'buy' || b.dataset.a === 'portal') return onShop(b);
    if (b.dataset.a === 'fixopen') {
      const w = window.open('', '_blank'); // sofort öffnen, sonst blockiert der Browser das Fenster nach dem Warten
      try { const t = await adminTicket(), url = `${studioUrl()}/studio/#admin=${encodeURIComponent(t)}`; if (w) w.location.href = url; else location.href = url; } // ohne Pop-up im selben Tab
      catch (err) { w?.close(); ctx.toast(err.message, 7000); }
      return;
    }
    if (b.dataset.a === 'fixdel') {
      if (!await (G.pmConfirm || (async t => confirm(t)))(`Korrektur für „${b.dataset.d}“ (${b.dataset.l === '*' ? 'alle Formate' : b.dataset.l}) entfernen? Danach gilt wieder das Original.`, 'Entfernen')) return;
      try { await call({ action: 'fix-delete', ticket: await adminTicket(), design: b.dataset.d, layout: b.dataset.l }); fixes = fixes.filter(f => !(f.design === b.dataset.d && f.layout === b.dataset.l)); render(); ctx.toast('Entfernt'); }
      catch (err) { ctx.toast(err.message, 7000); }
      return;
    }
    if (b.dataset.a === 'copy') { try { await navigator.clipboard.writeText(b.dataset.v); ctx.toast('Kopiert'); } catch { ctx.toast(b.dataset.v, 8000); } return; }
    if (b.dataset.a === 'nologo') { e.preventDefault(); await saveSite({ logo_url: null }); return; }
    if (b.dataset.a === 'del' && s) {
      if (!await (G.pmConfirm || (async t => confirm(t)))(`Einsendung von ${s.customer_name} endgültig löschen? Druckvorlage und Angaben werden entfernt – auch das daraus übernommene Fotolayout in den Ereignissen.`, 'Löschen')) return;
      b.disabled = true;
      try { await call({ action: 'delete', id: s.id }); subs = subs.filter(x => x.id !== s.id); render(); ctx.toast('Gelöscht'); }
      catch (err) { ctx.toast(err.message, 6000); b.disabled = false; }
      return;
    }
    if (b.dataset.a === 'adopt' && s) return adopt(s);
  }
  async function onChange(e) {
    const t = e.target;
    if (t.dataset.a === 'status') {
      const card = t.closest('.sub'), s = subs.find(x => x.id === card.dataset.id);
      const { error } = await ctx.sb.from('studio_submissions').update({ status: t.value }).eq('id', s.id);
      if (error) return ctx.toast('Speichern fehlgeschlagen: ' + error.message, 6000);
      s.status = t.value; render();
    }
  }
  document.addEventListener('submit', async e => {
    if (e.target.id !== 'studioForm') return;
    e.preventDefault();
    const f = new FormData(e.target), msg = $('#studioSaveMsg');
    const slug = toSlug(f.get('slug'));
    if (!SLUG.test(slug)) { msg.textContent = 'Bitte eine Adresse mit 3 bis 40 Zeichen wählen (a–z, 0–9, Bindestrich).'; return; }
    const priv = String(f.get('privacy_url') || '').trim(), imp = String(f.get('imprint_url') || '').trim();
    if (!/^https:\/\//.test(priv)) { msg.textContent = 'Bitte den Link zu deiner Datenschutzerklärung angeben (beginnt mit https://).'; return; }
    if (imp && !/^https:\/\//.test(imp)) { msg.textContent = 'Der Link zum Impressum muss mit https:// beginnen.'; return; }
    const row = {
      slug, name: String(f.get('name') || '').trim().slice(0, 80), accent: String(f.get('accent') || '#b08d57'), intro: String(f.get('intro') || '').trim().slice(0, 300),
      cats: f.getAll('cats').map(String), notify_email: String(f.get('notify_email') || '').trim() || null, keep_days: +f.get('keep_days') || 180,
      privacy_url: priv, imprint_url: imp || null, allow_download: !!f.get('allow_download'), active: !!f.get('active'), auto_event: !!f.get('auto_event')
    };
    const logo = f.get('logo');
    msg.textContent = 'Speichert …';
    try { if (logo && logo.size) row.logo_url = await ctx.uploadFile(logo); } catch (err) { msg.textContent = 'Logo konnte nicht hochgeladen werden: ' + (err.message || err); return; }
    await saveSite(row);
  });
  async function saveSite(patch) {
    const row = { ...(site || {}), ...patch, owner_id: ctx.me.id };
    delete row.created_at; delete row.updated_at;
    const { data, error } = await ctx.sb.from('studio_sites').upsert(row, { onConflict: 'owner_id' }).select().maybeSingle();
    if (error) {
      const m = /duplicate|unique/i.test(error.message) ? 'Diese Adresse ist schon vergeben – bitte eine andere wählen.' : 'Speichern fehlgeschlagen: ' + error.message;
      const el = $('#studioSaveMsg'); if (el) el.textContent = m; else ctx.toast(m, 6000);
      return;
    }
    site = data; render(); ctx.toast('Gespeichert');
  }

  // Varianten einer Einsendung: dasselbe Design in weiteren Druckformaten (print-<n>.png), nur mit Fotobox-Papierformat
  const variantsOf = s => (Array.isArray(s.variants) ? s.variants : []).filter(v => v && v.file && FORMAT_OF[`${v.w}x${v.h}`]);

  // ---------- In ein Ereignis übernehmen: Fotofelder unter der Druckvorlage (wie „Layout aus Bild“ im Layout-Editor) ----------
  async function adopt(s) {
    const evs = (ctx.events() || []).filter(e => !e.archived);
    if (!evs.length) return ctx.toast('Lege zuerst ein Ereignis an – dann kannst du das Design dort als Fotolayout übernehmen.', 6000);
    const dlg = document.createElement('div');
    dlg.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(20,20,26,.55);display:grid;place-items:center;padding:16px';
    dlg.innerHTML = `<div class="card" style="width:min(460px,100%);display:grid;gap:12px"><h3 style="margin:0">Design übernehmen</h3>
      <p class="small muted" style="margin:0">${esc(s.design_name)} · ${esc(s.layout_name)} von ${esc(s.customer_name)} wird als neues Fotolayout in das Ereignis gelegt. Die Fotos der Gäste erscheinen in den Fotofeldern.</p>
      ${variantsOf(s).length ? `<div><label>Formate</label><div style="display:grid;gap:4px">${[{ file: 'print.png', layout_name: s.layout_name || s.layout }, ...variantsOf(s)].map(v =>
        `<label class="small" style="display:flex;gap:8px;align-items:center;font-weight:500"><input type="checkbox" data-v="${esc(v.file)}" checked> ${esc(v.layout_name || v.layout)}</label>`).join('')}</div></div>` : ''}
      <div><label>Ereignis</label><select id="adEv">${evs.map(e => `<option value="${e.id}">${esc(e.name)}${e.event_date ? ' · ' + fmtDate(e.event_date) : ''}</option>`).join('')}</select></div>
      <div class="row" style="justify-content:flex-end"><button class="btn" data-x>Abbrechen</button><button class="btn primary" data-ok>Übernehmen</button></div></div>`;
    document.body.appendChild(dlg);
    const ok = await new Promise(r => { dlg.onclick = e => { if (e.target === dlg || e.target.closest('[data-x]')) r(false); if (e.target.closest('[data-ok]')) r(true); }; });
    const evId = dlg.querySelector('#adEv').value, pick = [...dlg.querySelectorAll('[data-v]')].filter(i => i.checked).map(i => i.dataset.v); dlg.remove();
    if (!ok) return;
    const parts = [{ file: 'print.png', w: s.w, h: s.h, slots: s.slots, layout_name: '' }, ...variantsOf(s).map(v => ({ ...v, layout_name: v.layout_name || v.layout }))]
      .filter(v => !pick.length && v.file === 'print.png' || pick.includes(v.file));
    if (!parts.length) return ctx.toast('Bitte mindestens ein Format wählen.');
    try {
      // Bearbeitbare Texte (neuere Einsendungen): Vorlage ohne Texte (base*.png) und Textebenen aus ebenen.json
      let eb = null;
      try { const r = await fetch(fileUrl(s, 'ebenen.json'), { cache: 'no-store' }); if (r.ok) eb = await r.json(); } catch { /* ältere Einsendung */ }
      const textsOf = file => !eb ? [] : file === 'print.png' ? (eb.texts || []) : ((eb.variants || []).find(v => v.file === file) || {}).texts || [];
      const Ls = parts.map(p => {
        const tx = textsOf(p.file), fmt = FORMAT_OF[`${p.w}x${p.h}`], F = G.FBR.FORMATS[fmt], kx = F.w / p.w, ky = F.h / p.h,
          src = fileUrl(s, tx.length ? p.file.replace('print', 'base') : p.file);
        // Foto etwas größer als die Öffnung, damit an den Kanten nie der Hintergrund durchscheint
        const boxes = (p.slots || []).map(b => [b[0] - 2, b[1] - 2, b[2] + 4, b[3] + 4]);
        const band = p.h * .06; boxes.sort((a, b) => Math.abs(a[1] - b[1]) > band ? a[1] - b[1] : a[0] - b[0]);
        const els = boxes.slice(0, 12).map((b, i) => ({ id: G.FBR.uid(), type: 'photo', n: i + 1, x: Math.round(b[0] * kx), y: Math.round(b[1] * ky),
          w: Math.round(b[2] * kx), h: Math.round(b[3] * ky), rot: 0, radius: 0, stroke: '', strokeW: 0, shadow: false }));
        els.push({ id: G.FBR.uid(), type: 'image', src, fit: 'stretch', opacity: 1, x: 0, y: 0, w: F.w, h: F.h, rot: 0, locked: true });
        // Texte über der Vorlage als eigene Ebenen – im Fotolayout-Editor änderbar (Tippfehler im Namen o. Ä.)
        els.push(...tx.filter(t => t && t.type === 'text').map(t => ({ ...t, id: G.FBR.uid(), x: Math.round(t.x * kx), y: Math.round(t.y * ky),
          w: Math.round(t.w * kx), h: Math.round(t.h * ky), size: t.size ? Math.round(t.size * ky * 10) / 10 : t.size,
          ...(t.bg ? { bg: { ...t.bg, pad: Math.round((t.bg.pad || 0) * ky) } } : {}), studioText: true })));
        return { id: G.FBR.uid(), name: `${s.design_name || 'BoothDesigner'} · ${s.customer_name}${p.layout_name ? ' · ' + p.layout_name : ''}`, format: fmt, w: F.w, h: F.h, bg: '#ffffff',
          twoPerPage: fmt === '2x6', secondary: false, elements: els, studio: s.folder };
      });
      const { data: cur, error: e1 } = await ctx.sb.from('events').select('settings').eq('id', evId).maybeSingle();
      if (e1 || !cur) throw e1 || new Error('Ereignis nicht gefunden.');
      const settings = { ...(cur.settings || {}) };
      // Wunsch des Betreibers: im Ereignis nur noch die BoothDesigner-Layouts – die eigenen werden einmalig unter layoutsVorBoothDesigner aufgehoben
      const own = (settings.layouts || []).filter(l => !l.studio);
      if (own.length && !Array.isArray(settings.layoutsVorBoothDesigner)) settings.layoutsVorBoothDesigner = own;
      settings.layouts = [...(settings.layouts || []).filter(l => l.studio && l.studio !== s.folder), ...Ls];
      if (Ls.length > 1) settings.guestLayouts = true; // mehrere Formate: die Gäste wählen an der Fotobox
      const { error } = await ctx.sb.from('events').update({ settings }).eq('id', evId);
      if (error) throw error;
      if (s.status === 'neu') { await ctx.sb.from('studio_submissions').update({ status: 'in_arbeit' }).eq('id', s.id); s.status = 'in_arbeit'; }
      await ctx.reloadEvents?.();
      render();
      ctx.toast(Ls.length > 1 ? `Übernommen – ${Ls.length} Layouts liegen im Ereignis unter „Fotolayout“.` : 'Übernommen – du findest das Layout im Ereignis unter „Fotolayout“.', 6000);
    } catch (err) { ctx.toast('Übernehmen fehlgeschlagen: ' + (err.message || err), 7000); }
  }

  // ---------- Im Ereignis (Fotolayout): BoothDesigner-Link nur für dieses Ereignis ----------
  // Was der Kunde über diesen Link abschickt, legt die Serverfunktion „studio“ sofort als erstes Fotolayout ins Ereignis.
  // eventLink(box, ev, c) – box = Platzhalter im Ereignis, ev = { id, name }, c = Kontext des Ereignisses (sb, me, extra, toast, demo)
  const evCache = {};
  async function eventLink(box, ev, c) {
    if (!box || !ev?.id) return;
    const card = inner => `<h2>BoothDesigner-Link</h2><div class="card">${inner}</div>`;
    if (!c.extra('studio')) {
      box.innerHTML = card(`<p style="margin:0">Lass deine Kunden ihr Fotolayout selbst gestalten: Sie bekommen einen Link, suchen ein Design aus und schicken es ab – es landet direkt hier im Ereignis.</p>
        <p style="margin:12px 0 0"><button class="ghost" data-sl="page">BoothDesigner ansehen</button></p>`);
    } else {
      let st = evCache[ev.id];
      if (!st || Date.now() - st.at > 60000) {
        if (c.demo) st = { slug: 'fotobox-mueller', code: null, last: null };
        else {
          const [a, b, d] = await Promise.all([c.sb.from('studio_sites').select('slug,active').eq('owner_id', c.me.id).maybeSingle(),
            c.sb.from('events').select('studio_code').eq('id', ev.id).maybeSingle(),
            c.sb.from('studio_submissions').select('customer_name,created_at,auto_layout').eq('event_id', ev.id).order('created_at', { ascending: false }).limit(1)]);
          st = { slug: a.data?.slug || null, active: a.data?.active, code: b.data?.studio_code || null, last: d.data?.[0] || null };
        }
        evCache[ev.id] = { ...st, at: Date.now() };
      }
      const url = st.slug && st.code && studioUrl() ? `${studioUrl()}/studio/?b=${encodeURIComponent(st.slug)}&e=${encodeURIComponent(st.code)}` : '';
      box.innerHTML = card(!st.slug
        ? `<p style="margin:0">Richte zuerst dein Studio ein – danach bekommst du hier einen Link nur für dieses Ereignis.</p>
          <p style="margin:12px 0 0"><button class="btn pri" data-sl="page">Studio einrichten</button></p>`
        : `<p style="margin:0 0 10px">Schick deinem Kunden diesen Link: Das Design, das er abschickt, liegt sofort als erstes Fotolayout in diesem Ereignis – ein neueres Design ersetzt das vorige.</p>
          ${st.active === false ? '<p class="small" style="background:#FFF3C4;border-radius:10px;padding:8px 12px;margin:0 0 10px">Dein Studio ist gerade ausgeschaltet – Kunden sehen „nicht verfügbar“.</p>' : ''}
          ${url ? `<div style="background:#f6f6f9;border:1px solid #eee;border-radius:10px;padding:10px 12px;word-break:break-all;font-size:13.5px">${esc(url)}</div>
            <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:8px"><button class="btn pri" data-sl="copy" data-v="${esc(url)}">Link kopieren</button>
              <a class="ghost" href="${esc(url)}" target="_blank" rel="noopener" style="text-decoration:none">Öffnen</a><button class="ghost" data-sl="renew">Neuer Link</button></div>`
            : '<button class="btn pri" data-sl="make">Link erstellen</button>'}
          ${st.last ? `<p class="small" style="margin:12px 0 0;color:#6b6b78">Zuletzt: Design von ${esc(st.last.customer_name)} am ${fmtDate(st.last.created_at)}${st.last.auto_layout ? ' – als Fotolayout übernommen' : ''}.</p>` : ''}`);
    }
    box.onclick = async e => {
      const b = e.target.closest('[data-sl]'); if (!b) return;
      const a = b.dataset.sl;
      if (a === 'page') return $('#nav [data-tab="studio"]')?.click();
      if (a === 'copy') { try { await navigator.clipboard.writeText(b.dataset.v); c.toast('Link kopiert'); } catch { c.toast(b.dataset.v, 8000); } return; }
      if (a === 'renew' && !await (G.pmConfirm || (async t => confirm(t)))('Neuen Link erzeugen? Der bisherige Link funktioniert danach nicht mehr.', 'Neuer Link')) return;
      if (c.demo) return c.toast('In der Vorführung nicht möglich.');
      b.disabled = true;
      const { data, error } = await c.sb.rpc('studio_event_code', { p_event: ev.id, p_new: a === 'renew' });
      if (error) { b.disabled = false; return c.toast(error.message, 6000); }
      evCache[ev.id] = { ...evCache[ev.id], code: data }; eventLink(box, ev, c);
      if (a === 'renew') c.toast('Neuer Link erstellt');
    };
  }

  G.StudioPage = { open, eventLink, CATS: STUDIO_CATS };
})(window);
