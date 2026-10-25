// Admin-Schutz (Wunsch des Betreibers, 25.10.2026: „ich möchte dass admin bereich richtig sicher ist“ – gewählt: Zwei-Faktor mit
// Handy-App). Für das Betreiber-Konto:
// - Zwei-Faktor-Anmeldung: nach dem Passwort zusätzlich der 6-stellige Code aus einer Authenticator-App (Google/Microsoft
//   Authenticator …). Beim ersten Mal wird die App hier eingerichtet (QR-Code). Ohne Code lädt das Dashboard nichts.
//   Der Server verlangt die Stufe „aal2“ selbst (is_admin() und die Betreiber-Funktionen) – das hier ist nur die Oberfläche dazu.
// - Nach jeder Admin-Anmeldung eine Hinweis-Mail an den Betreiber (license-mail, action 'admin-login').
// - Abmelden nach 30 Minuten ohne Bedienung (über alle offenen Tabs des Dashboards gezählt).
// - Verwaltung → Sicherheit: Handys der Zwei-Faktor-Anmeldung, weitere Betreiber-Konten, Protokoll aller Admin-Aktionen.
// Aufruf aus boot(): if (profile.is_admin && !await AdminSchutz.ensure({ sb, esc, toast })) return;
window.AdminSchutz = (() => {
  const IDLE_MIN = 30, ACTIVE_KEY = 'pm.adminActive';
  let sb, esc, toast, idleOn = false, armed = false;
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = d => new Date(d).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });
  // QR-Code von Supabase: SVG als data-Adresse – den SVG-Teil sauber kodieren (ein „#“ darin würde die Adresse sonst abschneiden)
  const svgSrc = q => { const m = q.match(/^data:image\/svg\+xml;utf-8,([\s\S]*)$/), raw = m ? m[1] : q.startsWith('data:') ? null : q;
    return raw == null ? q : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(raw); };

  const factors = async () => {
    const { data, error } = await sb.auth.mfa.listFactors();
    if (error) throw error;
    return { verified: (data?.totp || []).filter(f => f.status === 'verified'), all: data?.all || [] };
  };
  // Anmeldung abgelaufen oder in einem anderen Tab abgemeldet – dann keine Fehlermeldung, sondern die normale Anmeldeseite
  const noSession = e => e?.name === 'AuthSessionMissingError' || /session missing|refresh token|jwt expired|not authenticated/i.test(String(e?.message || ''));
  const errText = e => {
    const m = String(e?.message || e || '');
    if (noSession(e)) return 'Deine Anmeldung ist abgelaufen. Bitte melde dich neu an.';
    if (/invalid|expired|code/i.test(m) && !/disabled|enroll/i.test(m)) return 'Der Code stimmt nicht. Bitte den aktuellen Code aus der App eingeben – er wechselt alle 30 Sekunden.';
    if (/disabled|not enabled/i.test(m)) return 'Die Zwei-Faktor-Anmeldung ist in Supabase ausgeschaltet: Supabase → Authentication → Multi-Factor → „TOTP (App Authenticator)“ einschalten.';
    if (/rate|too many/i.test(m)) return 'Zu viele Versuche. Bitte eine Minute warten.';
    return 'Das hat nicht geklappt: ' + m;
  };
  // Hinweis-Mail „Neue Admin-Anmeldung“ – höchstens 4 Sekunden warten, die Anmeldung hängt nicht davon ab
  const notifyLogin = () => Promise.race([sb.functions.invoke('license-mail', { body: { action: 'admin-login' } }), new Promise(r => setTimeout(r, 4000))]).catch(() => {});

  function overlay(html) {
    $('#pmMfa')?.remove();
    const o = document.createElement('div'); o.id = 'pmMfa';
    o.style.cssText = 'position:fixed;inset:0;z-index:160;background:var(--brand-dark,#1D1D1B);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto';
    o.innerHTML = `<div class="card" style="width:min(460px,100%);display:flex;flex-direction:column;gap:14px;margin:auto">${html}</div>`;
    document.body.appendChild(o);
    o.addEventListener('click', e => { if (e.target.closest('[data-mfa="out"]')) { o.remove(); sb.auth.signOut({ scope: 'local' }); } });
    return o;
  }
  // Code-Feld: nur Ziffern, bei 6 Ziffern gleich bestätigen
  function codeField(o, go) {
    const inp = $('[data-mfa="code"]', o), m = $('[data-mfa="msg"]', o), btn = $('[data-mfa="ok"]', o);
    const err = t => { m.textContent = t; m.classList.toggle('hidden', !t); };
    const run = async () => {
      const code = inp.value.replace(/\D/g, '');
      if (code.length !== 6) return err('Bitte den 6-stelligen Code aus der App eingeben.');
      if (btn.disabled) return;
      btn.disabled = true; err('');
      try { await go(code); } catch (e) { err(errText(e)); inp.select(); } finally { btn.disabled = false; }
    };
    inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 6); if (inp.value.length === 6) run(); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    btn.addEventListener('click', run);
    setTimeout(() => inp.focus(), 50);
  }
  const CODE_HTML = `<input data-mfa="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" style="font-size:26px;letter-spacing:8px;text-align:center">
    <div class="msg err hidden" data-mfa="msg"></div>`;

  // Code eingeben (App schon eingerichtet)
  function verifyOverlay(list) {
    const o = overlay(`<h2 style="margin:0">Admin-Anmeldung bestätigen</h2>
      <p class="small muted" style="margin:0">Gib den 6-stelligen Code aus deiner Authenticator-App ein (Eintrag „Photobox Memories“).</p>
      ${list.length > 1 ? `<div><label>Handy</label><select data-mfa="factor">${list.map(f => `<option value="${esc(f.id)}">${esc(f.friendly_name || 'Handy')}</option>`).join('')}</select></div>` : ''}
      ${CODE_HTML}
      <div class="row" style="justify-content:space-between"><button type="button" class="btn" data-mfa="out">Abmelden</button><button type="button" class="btn primary" data-mfa="ok">Bestätigen</button></div>
      <details class="small muted"><summary style="cursor:pointer">Handy verloren oder neu?</summary>
        <p style="margin:8px 0 0">Mit dem Schlüssel, den du beim Einrichten aufgeschrieben hast, richtest du die App auf dem neuen Handy wieder ein (in der App „+“ → Schlüssel eingeben).
        Ohne Schlüssel: in Supabase unter Authentication → Users dein Konto öffnen und den Faktor bei „Multi-Factor Authentication“ löschen – danach richtest du die App hier neu ein.</p></details>`);
    codeField(o, async code => {
      const factorId = $('[data-mfa="factor"]', o)?.value || list[0].id;
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      await notifyLogin(); location.reload();
    });
  }

  // App einrichten (erstes Mal, oder weiteres Handy aus Verwaltung → Sicherheit)
  async function enrollOverlay(add) {
    const o = overlay(`<p class="muted">Bereite vor …</p>`);
    let en;
    try {
      // Halb fertige Einrichtungen (QR-Code nie bestätigt) zuerst wegräumen – sonst lehnt Supabase eine neue ab
      for (const f of (await factors()).all.filter(f => f.factor_type === 'totp' && f.status !== 'verified')) await sb.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', issuer: 'Photobox Memories', friendlyName: 'Handy ' + new Date().toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' }) });
      if (error) throw error;
      en = data;
    } catch (e) {
      if (noSession(e)) { o.remove(); sb.auth.signOut({ scope: 'local' }).catch(() => {}); return; }
      $('.card', o).innerHTML = `<h2 style="margin:0">Zwei-Faktor-Anmeldung</h2><div class="msg err">${esc(errText(e))}</div>
        <div class="row" style="justify-content:space-between"><button type="button" class="btn" data-mfa="out">Abmelden</button>${add ? '<button type="button" class="btn" data-mfa="close">Schließen</button>' : ''}</div>`;
      $('[data-mfa="close"]', o)?.addEventListener('click', () => o.remove());
      return;
    }
    const qr = String(en.totp?.qr_code || ''), secret = String(en.totp?.secret || '');
    $('.card', o).innerHTML = `<h2 style="margin:0">${add ? 'Weiteres Handy einrichten' : 'Zwei-Faktor-Anmeldung einrichten'}</h2>
      ${add ? '' : `<p class="small" style="margin:0">Dein Konto ist das Betreiber-Konto. Damit niemand allein mit deinem Passwort an die Daten deiner Kunden kommt, brauchst du für den Admin-Bereich ab jetzt zusätzlich einen Code von deinem Handy.</p>`}
      <p class="small" style="margin:0"><b>1.</b> Installiere auf dem Handy eine Authenticator-App, z. B. „Google Authenticator“ oder „Microsoft Authenticator“ (kostenlos im App Store bzw. Play Store).</p>
      <p class="small" style="margin:0"><b>2.</b> Öffne die App, tippe auf „+“ und scanne diesen QR-Code:</p>
      <div style="background:#fff;border-radius:12px;padding:12px;align-self:center"><img alt="QR-Code" width="190" height="190" style="display:block" src="${esc(svgSrc(qr))}"></div>
      <p class="small muted" style="margin:0">Scannen geht nicht? In der App „Schlüssel eingeben“ wählen und diesen Schlüssel abtippen:</p>
      <code style="display:block;text-align:center;font-size:15px;letter-spacing:1px;word-break:break-all;user-select:all">${esc(secret.replace(/(.{4})/g, '$1 ').trim())}</code>
      <p class="small" style="margin:0;color:#b8860b">⚠️ Schreib diesen Schlüssel auf Papier und bewahre ihn sicher auf (nicht auf dem PC). Damit richtest du die App auf einem neuen Handy wieder ein, falls dein Handy verloren geht.</p>
      <p class="small" style="margin:0"><b>3.</b> Gib den 6-stelligen Code ein, den die App jetzt anzeigt:</p>
      ${CODE_HTML}
      <div class="row" style="justify-content:space-between">${add ? '<button type="button" class="btn" data-mfa="close">Abbrechen</button>' : '<button type="button" class="btn" data-mfa="out">Abmelden</button>'}<button type="button" class="btn primary" data-mfa="ok">Bestätigen</button></div>`;
    $('[data-mfa="close"]', o)?.addEventListener('click', () => { o.remove(); sb.auth.mfa.unenroll({ factorId: en.id }).catch(() => {}); });
    codeField(o, async code => {
      const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: en.id, code });
      if (error) throw error;
      if (add) { o.remove(); toast('Das weitere Handy ist eingerichtet.', 5000); loadPage(); return; }
      await notifyLogin(); location.reload();
    });
  }

  // Abmelden nach 30 Minuten ohne Bedienung. Die letzte Bedienung teilen sich alle Tabs (localStorage): wer in einem anderen Tab
  // arbeitet, wird nicht von einem vergessenen Tab abgemeldet (Abmelden gilt für alle Tabs dieses Browsers).
  function startIdle() {
    armed = true;
    if (idleOn) return; idleOn = true;
    let last = Date.now(), saved = 0;
    const touch = () => { last = Date.now(); if (last - saved > 15e3) { saved = last; try { localStorage.setItem(ACTIVE_KEY, String(last)); } catch {} } };
    touch();
    ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, touch, { passive: true, capture: true }));
    setInterval(async () => {
      if (!armed) return;
      let shared = 0; try { shared = +localStorage.getItem(ACTIVE_KEY) || 0; } catch {}
      if (Date.now() - Math.max(last, shared) < IDLE_MIN * 60e3) return;
      armed = false;
      await sb.auth.signOut({ scope: 'local' }).catch(() => {});
      toast(`Aus Sicherheitsgründen abgemeldet: ${IDLE_MIN} Minuten ohne Bedienung. Bitte neu anmelden.`, 15000);
    }, 30e3);
  }

  // ---------- Verwaltung → Sicherheit ----------
  const ACT = {
    'licenses.insert': 'Lizenz erstellt', 'licenses.update': 'Lizenz geändert', 'licenses.delete': 'Lizenz gelöscht',
    'license_addons.insert': 'Zusatzfunktion freigeschaltet', 'license_addons.update': 'Zusatzfunktion geändert', 'license_addons.delete': 'Zusatzfunktion entfernt',
    'plans.insert': 'Tarif angelegt', 'plans.update': 'Tarif geändert', 'plans.delete': 'Tarif gelöscht',
    'devices.insert': 'Fotobox angelegt', 'devices.update': 'Fotobox geändert', 'devices.delete': 'Fotobox entfernt',
    'events.insert': 'Event angelegt', 'events.update': 'Event geändert', 'events.delete': 'Event gelöscht',
    'storage_usage.insert': 'Speicher-Grenze gesetzt', 'storage_usage.update': 'Speicher-Grenze geändert', 'storage_usage.delete': 'Speicher-Eintrag gelöscht',
    'ai_wallets.insert': 'KI-Guthaben angelegt', 'ai_wallets.update': 'KI-Guthaben geändert', 'ai_wallets.delete': 'KI-Guthaben gelöscht',
    'temp-password': 'Einmal-Passwort vergeben', 'password-link': 'Passwort-Link geschickt', 'credits-mail': 'Guthaben-Mail geschickt',
    'license-mail': 'Lizenz-Mail geschickt', 'admin-login': 'Admin-Anmeldung',
    'customer_deals.insert': 'Rabatt/VIP angelegt', 'customer_deals.update': 'Rabatt/VIP geändert', 'customer_deals.delete': 'Rabatt/VIP gelöscht',
    'stripe-discount': 'Rabatt bei Stripe übernommen'
  };
  const FIELD = { max_devices: 'Fotoboxen', valid_until: 'gültig bis', tier: 'Tarif', kind: 'Art', active: 'aktiv', extras: 'Zusatzfunktionen', extra: 'Zusatzfunktion',
    quota_gb: 'Speicher (GB)', balance: 'Guthaben', notes: 'Notiz', customer_email: 'E-Mail', customer_name: 'Name', cents: 'Preis (Cent)', name: 'Name',
    event_id: 'Event', updates_until: 'Updates bis', plan: 'Art', discount_pct: 'Rabatt %', discount_until: 'Rabatt bis', vip: 'VIP', felder: 'geänderte Felder', email: 'E-Mail', amount: 'Menge', confirmed: 'E-Mail bestätigt', browser: 'Browser', ip: 'IP-Adresse' };
  const SKIP = new Set(['id', 'owner_id', 'license_id', 'created_at', 'updated_at', 'key', 'stripe_customer', 'stripe_subscription', 'stripe_ref', 'command', 'status', 'settings', 'license']);
  const WORD = { mosaic: 'Fotomosaik', caricature: 'Live-Karikatur', videomsg: 'Videonachricht', offline: 'Offline-Warteschlange', studio: 'BoothDesigner',
    test: 'Test', geschenk: 'Geschenk', vip: 'VIP', kostenlos: 'kostenlos', free: 'Kostenlos', pro: 'Fotobox', basis: 'Basis', lifetime: 'unbefristet', subscription: 'Abo' };
  const val = v => { const s = v == null ? '–' : v === true ? 'ja' : v === false ? 'nein' : Array.isArray(v) ? v.map(x => WORD[x] || x).join(', ') || '–'
    : typeof v === 'object' ? JSON.stringify(v) : /^\d{4}-\d\d-\d\dT/.test(String(v)) ? fmt(v) : WORD[v] || String(v); return s.length > 80 ? s.slice(0, 79) + '…' : s; };
  function details(x) {
    const d = x.details || {}, upd = /\.update$/.test(x.action);
    return Object.entries(d).filter(([k]) => !SKIP.has(k) || (upd && k === 'settings')).slice(0, 8)
      .map(([k, v]) => `${esc(FIELD[k] || k)}: ${upd && Array.isArray(v) && v.length === 2 ? `${esc(val(v[0]))} → <b>${esc(val(v[1]))}</b>` : `<b>${esc(val(v))}</b>`}`).join(' · ');
  }

  function addPage() {
    const nav = $('#admNav'); if (!nav || $('[data-adm="security"]', nav)) return;
    const b = document.createElement('button'); b.type = 'button'; b.dataset.adm = 'security'; b.textContent = 'Sicherheit';
    if (typeof ICON === 'function') b.insertAdjacentHTML('afterbegin', ICON('lock', 17));
    nav.appendChild(b);
    const p = document.createElement('div'); p.dataset.admp = 'security'; p.className = 'hidden';
    p.innerHTML = `<div class="card" style="margin-bottom:20px"><h2>Zwei-Faktor-Anmeldung</h2>
        <p class="small" style="margin:0 0 10px">✅ Eingeschaltet. Für den Admin-Bereich brauchst du nach dem Passwort den Code aus der Authenticator-App – das prüft auch der Server, nicht nur diese Seite.
        Deine eigene Fotobox meldet sich weiter nur mit dem Passwort an: Sie hat damit keine Admin-Rechte, nur deine eigenen Events.</p>
        <div id="secFactors" class="small muted">Lädt …</div>
        <div class="row" style="margin-top:10px"><button type="button" class="btn small" id="secAdd">+ Weiteres Handy einrichten</button><span class="small muted">Empfehlung: ein zweites Gerät (z. B. Tablet) als Ersatz.</span></div></div>
      <div class="card" style="margin-bottom:20px"><h2>Betreiber-Konten</h2><div id="secAdmins" class="small muted">Lädt …</div></div>
      <div class="card" style="margin-bottom:20px"><h2>Automatisch abmelden</h2>
        <p class="small" style="margin:0">Nach ${IDLE_MIN} Minuten ohne Bedienung meldet das Dashboard dein Betreiber-Konto ab. Nach jeder Admin-Anmeldung bekommst du eine Mail – warst du es nicht, steht darin, was zu tun ist.</p></div>
      <div class="card" style="margin-bottom:20px"><div class="pagehead" style="margin-bottom:10px"><h2 style="margin:0">Protokoll</h2><button type="button" class="btn small" id="secReload">Neu laden</button></div>
        <p class="small muted" style="margin:0 0 10px">Jede Änderung, die du als Betreiber an Daten deiner Kunden machst (Lizenzen, Zusatzfunktionen, Fotoboxen, Speicher, Guthaben, Tarife, Passwörter, Mails), und jede Admin-Anmeldung. Die letzten 200 Einträge.</p>
        <div class="tablewrap"><table><thead><tr><th>Zeit</th><th>Aktion</th><th>Kunde</th><th>Details</th></tr></thead><tbody id="secLog"><tr><td colspan="4" class="empty">Lädt …</td></tr></tbody></table></div></div>
      <div class="card" style="margin-bottom:20px"><h2>Das machst du selbst (einmal)</h2>
        <ul class="small" style="margin:0;padding-left:18px;line-height:1.7">
          <li>Zwei-Faktor auch bei GitHub, Hetzner, Supabase, Stripe, Brevo, Dropbox, Lovable, RustDesk und deinem E-Mail-Postfach einschalten (jeweils unter „Sicherheit“).</li>
          <li>Supabase → Authentication → Sign In / Providers → Email: Passwort-Mindestlänge auf 10 Zeichen und „Letters and digits“ stellen.</li>
          <li>Den Schlüssel der Authenticator-App auf Papier sicher aufbewahren.</li></ul></div>`;
    nav.parentElement.appendChild(p);
    nav.addEventListener('click', e => { if (e.target.closest('[data-adm="security"]')) loadPage(); });
    $('#secAdd').onclick = () => enrollOverlay(true);
    $('#secReload').onclick = loadPage;
    $('#secFactors').addEventListener('click', async e => {
      const id = e.target.closest('[data-unenroll]')?.dataset.unenroll; if (!id) return;
      if (!await window.pmConfirm('Dieses Handy aus der Zwei-Faktor-Anmeldung entfernen? Seine Codes gelten danach nicht mehr.', 'Entfernen')) return;
      const { error } = await sb.auth.mfa.unenroll({ factorId: id });
      if (error) return toast(errText(error), 7000);
      toast('Handy entfernt.', 4000); loadPage();
    });
    try { if (localStorage.getItem('pm.adm') === 'security') { b.click(); } } catch {}
  }

  async function loadPage() {
    const fEl = $('#secFactors'), aEl = $('#secAdmins'), lEl = $('#secLog'); if (!fEl) return;
    factors().then(f => {
      fEl.innerHTML = f.verified.map(x => `<div class="row" style="justify-content:space-between;padding:6px 0;border-top:1px solid rgba(127,127,127,.2)"><span>📱 <b>${esc(x.friendly_name || 'Handy')}</b> · eingerichtet ${esc(fmt(x.created_at))}</span>
        ${f.verified.length > 1 ? `<button type="button" class="btn small danger" data-unenroll="${esc(x.id)}">Entfernen</button>` : '<span class="small muted">(mindestens ein Handy bleibt)</span>'}</div>`).join('') || 'Noch kein Handy eingerichtet.';
    }, e => { fEl.textContent = errText(e); });
    const [ad, lg] = await Promise.all([
      sb.from('profiles').select('id,email,name').eq('is_admin', true),
      sb.from('admin_log').select('*').order('at', { ascending: false }).limit(200)]);
    const me = (await sb.auth.getUser()).data.user;
    const admins = ad.data || [];
    aEl.innerHTML = admins.length > 1
      ? `<p style="margin:0 0 6px;color:var(--bad,#e5484d)">⚠️ Diese ${admins.length} Konten haben Betreiber-Rechte. Ist eins davon nicht deins, sag Bescheid – dann nehmen wir ihm die Rechte weg:</p>${admins.map(x => `<div>• ${esc(x.name ? x.name + ' – ' : '')}${esc(x.email)}${x.id === me?.id ? ' (du)' : ''}</div>`).join('')}`
      : `<p style="margin:0">✅ Nur dein Konto (${esc(me?.email || '')}) hat Betreiber-Rechte.</p>`;
    if (lg.error) { lEl.innerHTML = `<tr><td colspan="4" class="empty">${/admin_log|relation|schema/i.test(lg.error.message) ? 'Das Protokoll ist auf dem Server noch nicht eingerichtet (SQL „Admin-Sicherheit“ ausführen).' : esc(lg.error.message)}</td></tr>`; return; }
    const rows = lg.data || [], ids = [...new Set(rows.flatMap(x => [x.target, x.actor]).filter(Boolean))];
    const ppl = ids.length ? (await sb.from('profiles').select('id,email,name').in('id', ids)).data || [] : [];
    const who = id => { const p = ppl.find(x => x.id === id); return p ? (p.name ? p.name + ' · ' : '') + p.email : id ? 'gelöschtes Konto' : '–'; };
    lEl.innerHTML = rows.map(x => `<tr><td class="small" style="white-space:nowrap">${esc(fmt(x.at))}</td>
        <td>${esc(ACT[x.action] || x.action)}${x.actor && x.actor !== me?.id ? `<br><span class="small" style="color:var(--bad,#e5484d)">von ${esc(who(x.actor))}</span>` : ''}</td>
        <td class="small">${x.target ? esc(who(x.target)) : '–'}</td><td class="small" style="overflow-wrap:anywhere">${details(x)}</td></tr>`).join('')
      || '<tr><td colspan="4" class="empty">Noch keine Einträge.</td></tr>';
  }

  // true: Betreiber ist mit Zwei-Faktor angemeldet (Dashboard darf laden). Sonst kommt die Code-Abfrage bzw. die Einrichtung.
  let watching = false;
  async function ensure(o) {
    ({ sb, esc, toast } = o);
    // Abgemeldet (auch in einem anderen Tab oder weil die Anmeldung abgelaufen ist): Code-Fenster weg, Abmelde-Uhr aus
    if (!watching) { watching = true; sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT') { $('#pmMfa')?.remove(); armed = false; } }); }
    const out = () => { sb.auth.signOut({ scope: 'local' }).catch(() => {}); return false; };
    let lv = null;
    try {
      const { data, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error && noSession(error)) return out();
      lv = data?.currentLevel;
      if (!lv) return out(); // keine gültige Sitzung mehr – die Anmeldeseite kommt von selbst
    } catch (e) { if (noSession(e)) return out(); }
    if (lv === 'aal2') { startIdle(); addPage(); return true; }
    try { const f = await factors(); f.verified.length ? verifyOverlay(f.verified) : enrollOverlay(false); }
    catch (e) {
      if (noSession(e)) return out();
      overlay(`<h2 style="margin:0">Admin-Anmeldung</h2><div class="msg err">${esc(errText(e))}</div><div class="row"><button type="button" class="btn" data-mfa="out">Neu anmelden</button></div>`);
    }
    return false;
  }
  return { ensure };
})();
