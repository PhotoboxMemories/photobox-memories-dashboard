// Kunde bearbeiten (Wunsch des Betreibers, 25.10.2026: „ich möchte als admin kunden auch rabatt geben kann oder alles machen für
// die das soll auch in admin dashboard sein nur bei mir“ – gewählt: Prozent-Rabatt, Test verlängern / Gratis-Monate, Komplett
// kostenlos (VIP), Einzelne Funktion schenken). Dialog aus Verwaltung → Übersicht → „Bearbeiten“ je Kunde, nur für den Betreiber:
// - Überblick: Lizenzen (ohne vollen Schlüssel), Fotoboxen, Speicher, KI-Guthaben, ob ein Stripe-Abo läuft
// - VIP: komplett kostenlos ohne Ablauf; Ausschalten stellt den Stand von vorher genau wieder her
// - Gratis-Zeitraum (alles wie im Test) um 1/3/12 Monate verlängern, auf ein Datum setzen oder beenden
// - Rabatt in Prozent (optional mit Ende und Notiz) – gilt beim nächsten Kauf; laufende Abos über license-shop 'admin-discount':
//   nach JEDER Rabatt- und VIP-Änderung automatisch, dazu der Knopf „Bei Stripe übernehmen“ zum Wiederholen
// - Zusatzfunktion einzeln schenken (dauerhaft oder bis Datum) oder das Geschenk entfernen
// - Anzahl Fotoboxen (set_max_devices) und Speicher-Grenze (set_storage_gb)
// Alles läuft über Server-Funktionen, die selbst prüfen, ob der Betreiber mit Zwei-Faktor angemeldet ist (is_admin() = aal2):
// admin_customer, admin_set_discount, admin_free_until, admin_set_vip, admin_gift_extra, admin_remove_gift, set_max_devices, set_storage_gb.
// Alle Daten (Anzeige, Datumsfelder, „bis Ende des Tages“) rechnen in deutscher Zeit (Europe/Berlin), egal wo das Gerät steht.
// Aufruf: if (await AdminKunde.open(kundenId, { sb, esc, toast })) { …Liste neu laden… } – true, wenn etwas geändert wurde.
//
// Erwartete Antwort von admin_customer(p_owner) (jsonb, 202610250011; kleine Abweichungen bei den Namen fängt das Lesen unten ab):
//   { profile: { id, email, name, created_at, is_admin },
//     deal: { discount_pct, discount_until, discount_active, vip, vip_since, note, updated_at },
//     licenses: [{ id, key_hint (letzte Zeichen), tier, kind, plan, active, trial, valid_until, max_devices, extras, stripe (bool), devices }],
//     extras: [{ extra, source: 'test'|'geschenk'|'vip'|'abo'|'freigabe', until (null = dauerhaft) }],
//     free_until (Ende der Test-Zeilen, auch vergangen), tier (Stufe jetzt), devices: { used, allowed },
//     storage: { bytes, quota_gb, updated_at }, credits: { balance, received, images, spent }, free_mode (bool),
//     stripe_active (nur Abos mit Laufzeit in der Zukunft – taugt nur für die Anzeige),
//     stripe: { customer, subscriptions: [{ sub, what, plan, until, running }] } (alle Abos aus der Datenbank, auch mit offener Zahlung) }
// Antwort von license-shop 'admin-discount': { ok, changed, unchanged, failed, subs: [{ id, plan, result: 'gesetzt'|'entfernt'|'unverändert'|'fehler', error }] }
// (ok = false, wenn bei einem Abo Stripe abgelehnt hat). Kennt der Server die Aktion noch nicht, wird das freundlich übergangen.
window.AdminKunde = (() => {
  const EXTRAS = [['mosaic', 'Fotomosaik'], ['caricature', 'Live-Karikatur'], ['videomsg', 'Videonachricht']];
  const NAME = { mosaic: 'Fotomosaik', caricature: 'Live-Karikatur', videomsg: 'Videonachricht', offline: 'Offline-Warteschlange', studio: 'BoothDesigner' };
  const SRC = { test: 'Gratis/Test', geschenk: 'Geschenk', vip: 'VIP', abo: 'Abo', freigabe: 'Freigabe' };
  const TIER = { free: 'Kostenlos', basis: 'Basis', pro: 'Fotobox' };
  // Wie der Schalter VIP_STRIPE_GRATIS in license-shop (stripe-rabatt.md, Teil C): VIP stellt laufende Stripe-Abos auf 100 % Rabatt,
  // der BoothDesigner bleibt kostenpflichtig. Wird der Schalter dort auf false gesetzt, hier auch – dann zahlt ein VIP-Kunde sein Abo weiter.
  const VIP_STRIPE_GRATIS = true;
  const VIP_STRIPE_TXT = VIP_STRIPE_GRATIS
    ? 'Laufende Abos bei Stripe kosten mit VIP ab der nächsten Rechnung 0 € (der BoothDesigner bleibt kostenpflichtig). Beim Ausschalten gilt dort wieder der normale Preis bzw. sein Rabatt.'
    : 'Laufende Abos bei Stripe ändert VIP nicht – sie werden weiter abgebucht. Soll der Kunde nichts mehr zahlen, das Abo bei Stripe kündigen.';
  const esc0 = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let sb, esc = esc0, toast = () => {}, o = null, d = null, id = '', changed = false, busy = false, asking = false, done = null;
  const $ = (s, r = o) => r ? r.querySelector(s) : null;
  const $$ = (s, r = o) => r ? [...r.querySelectorAll(s)] : [];
  const N = v => Math.max(0, Math.round(+v) || 0); // Zahlen aus der Datenbank nur als Zahl ausgeben
  const ts = v => { if (v == null || v === '') return null; const t = v instanceof Date ? v.getTime() : Date.parse(v); return isNaN(t) ? null : t; };
  const pad = n => String(n).padStart(2, '0');
  // Deutsche Zeit (Europe/Berlin) für alle Daten – ein Betreiber-Gerät in Istanbul oder New York rechnet sonst andere Tagesenden
  const TZ = 'Europe/Berlin';
  let wall = null;
  const berlin = t => { // Zeitpunkt (ms) → Uhrzeit in Berlin: [Jahr, Monat, Tag, Stunde, Minute, Sekunde]
    wall = wall || new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric' });
    const p = {}; for (const x of wall.formatToParts(new Date(t))) p[x.type] = +x.value;
    return [p.year, p.month, p.day, p.hour % 24, p.minute, p.second];
  };
  const shift = t => { const [y, mo, da, h, mi, s] = berlin(t); return Date.UTC(y, mo - 1, da, h, mi, s) - (t - t % 1000); }; // Berlin minus UTC in ms
  const fmtD = v => ts(v) ? new Date(ts(v)).toLocaleDateString('de-DE', { timeZone: TZ }) : '–';
  const future = v => (ts(v) || 0) > Date.now();
  const left = v => Math.max(0, Math.ceil((ts(v) - Date.now()) / 864e5));
  const toInput = v => { if (!ts(v)) return ''; const [y, mo, da] = berlin(ts(v)); return `${y}-${pad(mo)}-${pad(da)}`; };
  // Datum aus dem Feld (JJJJ-MM-TT) = bis Ende dieses Tages in deutscher Zeit (23:59:59 Berlin, auch an den Tagen der Zeitumstellung)
  const dayEnd = s => {
    const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(String(s || '')); if (!m) return null;
    const w = Date.UTC(+m[1], m[2] - 1, +m[3], 23, 59, 59); // gewünschte Uhrzeit, zunächst als UTC gelesen
    let t = w - shift(w); t = w - shift(t);                  // zweimal: der Abstand gilt für den richtigen Zeitpunkt
    const [y, mo, da] = berlin(t);
    return y === +m[1] && mo === +m[2] && da === +m[3] ? new Date(t) : null; // z. B. 31.02. = ungültig
  };
  // Tag in Berlin + n Monate (als JJJJ-MM-TT); der 31. wird im kürzeren Monat zum letzten Tag (31.01. + 1 Monat = 28./29.02.)
  const addMonths = (b, n) => {
    const [y, mo, da] = berlin(ts(b)), z = new Date(Date.UTC(y, mo - 1 + n, 1));
    const last = new Date(Date.UTC(z.getUTCFullYear(), z.getUTCMonth() + 1, 0)).getUTCDate();
    return `${z.getUTCFullYear()}-${pad(z.getUTCMonth() + 1)}-${pad(Math.min(da, last))}`;
  };
  const gbTxt = b => (b / 1e9).toLocaleString('de-DE', { maximumFractionDigits: b < 1e10 ? 1 : 0 });
  const days = n => n === 1 ? '1 Tag' : n + ' Tage';
  const badge = (t, c = '') => `<span class="badge ${c}">${esc(t)}</span>`;

  // Welche SQL-Datei fehlt? Name der Funktion aus der Fehlermeldung, sonst die aufgerufene Funktion; alles andere steht in 0011.
  const SQL = { set_max_devices: '202610250003_fotobox_anzahl.sql („Anzahl Fotoboxen“)', set_storage_gb: '202610240002_speicher_je_kunde.sql („Speicher je Kunde“)' };
  const sqlFile = e => { const f = /(?:public\.|function\s+)(\w+)\s*\(/i.exec(String(e?.message || ''))?.[1];
    return SQL[f] || SQL[e?.fn] || '202610250011_kunden_rabatte.sql („Kunden-Werkzeuge“)'; };
  // Fehler verständlich (der Betreiber ist kein Programmierer). Klartext vom Server (raise exception auf Deutsch) wird durchgereicht.
  const errText = e => {
    const m = String(e?.message || e || ''), c = String(e?.code || '');
    if (c === 'PGRST202' || c === '42883' || /schema cache|could not find the function|function .* does not exist/i.test(m))
      return `Diese Funktion ist auf dem Server noch nicht eingerichtet. Bitte in Supabase im „SQL Editor“ die Datei ${sqlFile(e)} ausführen.`;
    if (/Zwei-Faktor|Nur für den Betreiber|permission denied|not allowed|42501/i.test(m + c))
      return 'Das darf nur der Betreiber mit Zwei-Faktor-Anmeldung. Bitte die Seite neu laden und den Code aus der Authenticator-App eingeben.';
    if (/JWT|token.*expired|not authenticated/i.test(m)) return 'Die Anmeldung ist abgelaufen. Bitte die Seite neu laden und neu anmelden.';
    if (/Failed to fetch|NetworkError|Load failed|network/i.test(m)) return 'Keine Verbindung zum Server. Bitte das Internet prüfen und noch einmal versuchen.';
    if (/[äöüÄÖÜß]|^(Bitte|Dieser|Diese|Dieses|Das|Der|Die|Kein|Keine|Höchstens|Mindestens|Betreiber|Rabatt|Rabatte|Kunde|Nicht|Zu|Ungültige|Unbekannte)\b/.test(m)) return m;
    return 'Das hat nicht geklappt: ' + (m || 'unbekannter Fehler');
  };
  // Server-Funktion aufrufen; der Name hängt am Fehler (für den Hinweis, welche SQL-Datei fehlt)
  const rpc = async (fn, args) => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw Object.assign(new Error(String(error.message || '')), { code: error.code, fn });
    return data;
  };

  // Antwort von admin_customer lesen – tolerant gegenüber kleinen Abweichungen der Feldnamen
  const prof = () => d?.profile || d?.profil || {};
  const deal = () => d?.deal || d?.deals || {};
  const lics = () => [].concat(d?.licenses || d?.lizenzen || []).filter(x => x && typeof x === 'object');
  const extras = () => [].concat(d?.extras || d?.addons || []).filter(x => x && typeof x === 'object')
    .map(e => ({ extra: String(e.extra || e.key || ''), src: String(e.source || e.quelle || e.plan || ''), until: e.until !== undefined ? e.until : e.valid_until ?? null }));
  const freeUntil = () => d?.free_until ?? d?.trial_until ?? null;
  const stripeOn = () => d?.stripe_active != null ? !!d.stripe_active : lics().some(l => l.stripe === true || l.stripe_active === true);
  // Hat der Kunde Abos bei Stripe (auch mit offener Zahlung: past_due/unpaid haben valid_until in der Vergangenheit, stripe_active
  // ist dann falsch)? Steuert nur Hinweise und den Knopf „Bei Stripe übernehmen“ – der Abgleich selbst läuft immer.
  const hasStripe = () => stripeOn() || !!d?.stripe?.customer || [].concat(d?.stripe?.subscriptions || []).length > 0 || lics().some(l => l.stripe === true);
  const devUsed = () => N(d?.devices?.used ?? d?.devices_used ?? lics().reduce((n, l) => n + N(l.devices ?? l.dev_count), 0));
  const devAllowed = () => N(d?.devices?.allowed ?? d?.devices_allowed ?? lics().filter(l => l.active !== false).reduce((n, l) => n + N(l.max_devices), 0));
  const maxDev = () => lics().filter(l => l.active !== false).reduce((n, l) => Math.max(n, N(l.max_devices)), 0) || 1;
  const store = () => { const s = d?.storage && typeof d.storage === 'object' ? d.storage : {};
    return { bytes: +(s.bytes ?? d?.storage_bytes) || 0, quota: N(s.quota_gb ?? d?.quota_gb) || 5, at: s.updated_at || null }; };
  const credits = () => { const c = d?.credits ?? d?.ai_credits ?? d?.balance; return c && typeof c === 'object' ? N(c.balance) : N(c); };

  function licLine(l) {
    const end = l.kind === 'subscription' ? (l.valid_until ? (future(l.valid_until) ? 'Abo bis ' : 'Abo abgelaufen am ') + fmtD(l.valid_until) : 'Abo')
      : l.valid_until ? (future(l.valid_until) ? 'bis ' : 'abgelaufen am ') + fmtD(l.valid_until) : 'ohne Ablauf';
    const hint = l.key_hint ?? l.key_end ?? l.key_tail;
    return `<div class="small" style="padding:5px 0;border-top:1px solid var(--line)">${hint ? `<code translate="no">…${esc(hint)}</code> · ` : ''}<b>${esc(TIER[l.tier] || l.tier || '–')}</b>
      · ${esc(end)} · ${N(l.devices ?? l.dev_count)} von ${N(l.max_devices)} ${N(l.max_devices) === 1 ? 'Fotobox' : 'Fotoboxen'}
      ${l.active === false ? badge('gesperrt', 'bad') : ''} ${l.plan === 'vip' ? badge('VIP', 'ok') : ''} ${l.trial ? badge('Test') : ''} ${l.stripe === true ? badge('Stripe-Abo') : ''}</div>`;
  }
  const sec = (key, title, inner) => `<section data-sec="${key}" style="border:1px solid var(--line);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px">
    <h3 style="margin:0;font-size:16px">${title}</h3>${inner}</section>`;
  const today = () => toInput(new Date());

  function html() {
    const p = prof();
    if (p.is_admin) return `<div class="msg">Das ist ein Betreiber-Konto. Betreiber-Konten kann man hier nicht bearbeiten.</div>`;
    const dl = deal(), vip = !!dl.vip, pct = N(dl.discount_pct), dOn = pct > 0 && (!dl.discount_until || future(dl.discount_until));
    const fu = freeUntil(), fOn = future(fu), st = store(), str = stripeOn(), hs = hasStripe(), ex = extras(), ls = lics();
    const tags = [vip && badge('VIP – alles kostenlos', 'ok'), fOn && badge(`Gratis bis ${fmtD(fu)} (noch ${days(left(fu))})`, 'ok'),
      dOn && badge(`Rabatt ${pct} %${dl.discount_until ? ' bis ' + fmtD(dl.discount_until) : ''}`, 'warn'), str && badge('Stripe-Abo läuft'),
      d?.tier && badge('Stufe jetzt: ' + (TIER[d.tier] || d.tier))].filter(Boolean).join(' ');

    const over = sec('over', 'Überblick', `${tags ? `<div class="row" style="gap:6px">${tags}</div>` : ''}
      ${d?.free_mode ? '<p class="small muted" style="margin:0">Zurzeit ist die Fotobox für alle kostenlos. Gratis-Zeitraum, VIP und Geschenke schalten schon jetzt die Zusatzfunktionen frei; der Rabatt zählt erst, wenn es etwas zu bezahlen gibt.</p>' : ''}
      <div>${ls.map(licLine).join('') || '<div class="small muted">Noch keine Lizenz.</div>'}</div>
      <div class="grid3" style="gap:10px">
        <div class="small"><span class="muted">Fotoboxen</span><br><b>${devUsed()} von ${devAllowed() || '–'}</b></div>
        <div class="small"><span class="muted">Speicher</span><br><b>${st.at ? esc(gbTxt(st.bytes)) : '–'} / ${st.quota} GB</b></div>
        <div class="small"><span class="muted">KI-Guthaben</span><br><b>${credits()} Credits</b></div></div>
      <div class="small muted">Registriert am ${esc(fmtD(p.created_at))}</div>`);

    const stripeHint = hs ? `<p class="small" style="margin:0;color:var(--warn)">ⓘ ${VIP_STRIPE_TXT}</p>` : '';
    const vipSec = sec('vip', 'Komplett kostenlos (VIP)', vip
      ? `<div class="row">${badge('VIP ist an', 'ok')}<span class="small">Alles kostenlos und ohne Ablauf.</span></div>
         <p class="small muted" style="margin:0">Beim Ausschalten bekommt der Kunde genau seinen Stand von vorher zurück – auch die Zahl der Fotoboxen (eine während VIP geänderte Zahl gilt nur für die VIP-Zeit).</p>
         ${stripeHint}
         <div class="row"><button type="button" class="btn danger" data-k="vip-off">VIP ausschalten</button></div>`
      : `<p class="small" style="margin:0">Alles kostenlos und ohne Ablauf: Fotobox mit allen Funktionen, alle Zusatzfunktionen und die Offline-Warteschlange.</p>
         ${stripeHint}
         <div class="row"><button type="button" class="btn primary" data-k="vip-on">VIP einschalten</button></div>`);

    const freeSec = sec('free', 'Gratis-Zeitraum (Test verlängern)', `<p class="small" style="margin:0">${fOn
        ? `Gratis bis <b>${esc(fmtD(fu))}</b> (noch ${days(left(fu))}).`
        : ts(fu) ? `Kein Gratis-Zeitraum. Der letzte endete am ${esc(fmtD(fu))}.` : 'Kein Gratis-Zeitraum.'}</p>
      <div class="row" style="gap:6px"><span class="small muted">Verlängern um</span>
        <button type="button" class="btn small" data-k="free-add" data-n="1">+1 Monat</button>
        <button type="button" class="btn small" data-k="free-add" data-n="3">+3 Monate</button>
        <button type="button" class="btn small" data-k="free-add" data-n="12">+12 Monate</button></div>
      <div class="row" style="gap:6px"><input type="date" data-k="freedate" data-go="free-set" min="${today()}" value="${esc(fOn ? toInput(fu) : '')}" style="width:170px">
        <button type="button" class="btn small" data-k="free-set">Bis zu diesem Tag gratis</button>
        ${fOn ? '<button type="button" class="btn small danger" data-k="free-end">Jetzt beenden</button>' : ''}</div>
      <p class="small muted" style="margin:0">Gratis heißt: alles wie im Test – Fotobox ohne Wasserzeichen und alle drei Zusatzfunktionen. Danach fällt das Konto von selbst auf seinen normalen Stand zurück (kostenlos oder sein Abo).</p>`);

    const discSec = sec('disc', 'Rabatt', `<p class="small" style="margin:0">${pct > 0
        ? dOn ? `Aktuell: <b>${pct} %</b>${dl.discount_until ? ` bis ${esc(fmtD(dl.discount_until))}` : ' ohne Ende'}.` : `${pct} % – abgelaufen am ${esc(fmtD(dl.discount_until))}.`
        : 'Kein Rabatt.'}${dl.note ? ` <span class="muted">Notiz: ${esc(dl.note)}</span>` : ''}</p>
      <div class="grid3" style="gap:10px">
        <div><label>Rabatt in %</label><input type="number" min="0" max="100" step="1" inputmode="numeric" data-k="pct" data-go="disc-save" value="${pct || ''}" placeholder="z. B. 20"></div>
        <div><label>bis (leer = ohne Ende)</label><input type="date" data-k="until" data-go="disc-save" min="${today()}" value="${esc(dOn ? toInput(dl.discount_until) : '')}"></div>
        <div><label>Notiz (Grund)</label><input type="text" maxlength="200" data-k="note" data-go="disc-save" value="${esc(dl.note || '')}" placeholder="z. B. Messe-Angebot"></div></div>
      <div class="row"><button type="button" class="btn primary" data-k="disc-save">Rabatt speichern</button>${pct > 0 ? '<button type="button" class="btn danger" data-k="disc-off">Rabatt entfernen</button>' : ''}
        ${hs ? '<button type="button" class="btn" data-k="stripe-sync" title="Rabatt bzw. VIP noch einmal auf die laufenden Abos bei Stripe übertragen">Bei Stripe übernehmen</button>' : ''}</div>
      <p class="small muted" style="margin:0">Gilt für alle Käufe des Kunden (Fotobox und Zusatzfunktionen) über Stripe. 0 % = kein Rabatt. Soll er gar nichts zahlen, ist VIP einfacher.${vip ? ' Solange VIP an ist, zählt der Rabatt nur für den BoothDesigner.' : ''}${hs ? ' Laufende Abos bei Stripe werden beim Speichern von Rabatt und VIP automatisch angepasst (ab der nächsten Rechnung). „Bei Stripe übernehmen“ wiederholt das, falls es nicht geklappt hat.' : ''}</p>`);

    const giftRows = EXTRAS.map(([k, name]) => {
      const srcs = ex.filter(e => e.extra === k), gift = srcs.find(e => e.src === 'geschenk');
      const tg = srcs.map(e => { const on = !ts(e.until) || future(e.until);
        return badge(`${SRC[e.src] || e.src || 'frei'}${ts(e.until) ? (on ? ' bis ' : ' – abgelaufen am ') + fmtD(e.until) : ' · dauerhaft'}`, on ? 'ok' : ''); }).join(' ');
      return `<div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding-top:10px">
        <div style="min-width:170px;flex:1"><b>${name}</b><div class="row" style="gap:4px;margin-top:2px">${tg || '<span class="small muted">nicht frei</span>'}</div></div>
        <div class="row" style="gap:6px"><input type="date" data-k="giftdate" data-x="${k}" data-go="gift" min="${today()}" value="${esc(gift && future(gift.until) ? toInput(gift.until) : '')}" title="leer = dauerhaft" style="width:170px">
          <button type="button" class="btn small primary" data-k="gift" data-x="${k}">Dauerhaft schenken</button>
          ${gift ? `<button type="button" class="btn small danger" data-k="gift-del" data-x="${k}">Geschenk entfernen</button>` : ''}</div></div>`;
    }).join('');
    const other = ex.filter(e => !EXTRAS.some(([k]) => k === e.extra) && e.extra && (!ts(e.until) || future(e.until)));
    const giftSec = sec('gift', 'Zusatzfunktionen schenken', `${giftRows}
      ${other.length ? `<div class="small muted">Außerdem frei: ${other.map(e => esc(`${NAME[e.extra] || e.extra} (${SRC[e.src] || e.src || 'frei'}${ts(e.until) ? ' bis ' + fmtD(e.until) : ''})`)).join(', ')}</div>` : ''}
      <p class="small muted" style="margin:0">Datum leer lassen = dauerhaft geschenkt. Ein Geschenk gilt zusätzlich zu Test, Abo oder Freigabe.</p>`);

    const boxSec = sec('box', 'Fotoboxen und Speicher', `<div class="grid2" style="gap:12px">
      <div><label>Fotoboxen (PCs) für dieses Konto</label><div class="row" style="flex-wrap:nowrap;gap:6px">
        <input type="number" min="1" max="1000" step="1" inputmode="numeric" data-k="maxdev" data-go="dev-save" value="${maxDev()}" style="max-width:110px">
        <button type="button" class="btn small" data-k="dev-save">Speichern</button></div>
        <div class="small muted" style="margin-top:4px">Belegt: ${devUsed()}. Gilt für neu verbundene PCs – schon verbundene laufen weiter.</div></div>
      <div><label>Speicher-Grenze in GB</label><div class="row" style="flex-wrap:nowrap;gap:6px">
        <input type="number" min="1" max="100000" step="1" inputmode="numeric" data-k="quota" data-go="store-save" value="${st.quota}" style="max-width:110px">
        <button type="button" class="btn small" data-k="store-save">Speichern</button></div>
        <div class="small muted" style="margin-top:4px">Belegt: ${st.at ? esc(gbTxt(st.bytes)) + ' GB' : 'noch nicht berechnet'}. Nur ein Hinweis – es wird trotzdem weiter hochgeladen.</div></div></div>`);

    return over + vipSec + freeSec + discSec + giftSec + boxSec;
  }

  // Knopf „schenken“ zeigt, was passiert: leeres Datum = dauerhaft
  function giftLabels() {
    for (const i of $$('input[data-k="giftdate"]')) {
      const b = $(`button[data-k="gift"][data-x="${i.dataset.x}"]`), t = dayEnd(i.value);
      if (b) b.textContent = t ? `Bis ${fmtD(t)} schenken` : 'Dauerhaft schenken';
    }
  }

  function render(keep) {
    const body = $('[data-k="body"]'); if (!body) return;
    // Eingaben, die in anderen Abschnitten getippt, aber noch nicht gespeichert wurden, bleiben stehen
    const typed = {};
    for (const i of $$('input[data-k]', body)) if (i.value !== i.defaultValue && i.closest('[data-sec]') !== keep) typed[i.dataset.k + (i.dataset.x || '')] = i.value;
    const top = body.scrollTop, p = prof();
    $('[data-k="who"]').innerHTML = `<span translate="no">${esc(p.name || p.email || '')}${p.name && p.email ? ` · ${esc(p.email)}` : ''}</span>`;
    body.innerHTML = html();
    for (const i of $$('input[data-k]', body)) { const v = typed[i.dataset.k + (i.dataset.x || '')]; if (v != null) i.value = v; }
    giftLabels(); body.scrollTop = top;
  }

  function say(t, cls = '') {
    const m = $('[data-k="msg"]'); if (!m) return;
    m.className = 'msg' + (cls === 'err' || cls === 'ok' ? ' ' + cls : '') + (t ? '' : ' hidden');
    m.style.color = cls === 'warn' ? 'var(--warn,#c98a00)' : '';
    m.textContent = t || '';
  }

  // Daten eines Kunden holen – gibt sie zurück; übernommen werden sie nur, wenn derselbe Dialog noch offen ist (siehe load/run)
  async function fetchData(owner) {
    let data = await rpc('admin_customer', { p_owner: owner });
    if (typeof data === 'string') try { data = JSON.parse(data); } catch {}
    if (!data || typeof data !== 'object') throw new Error('Dieser Kunde wurde nicht gefunden.');
    return data;
  }
  async function load() {
    const body = $('[data-k="body"]'); if (!body) return;
    const me = o, owner = id;
    body.innerHTML = '<p class="muted">Lädt …</p>'; say('');
    let data;
    try { data = await fetchData(owner); }
    catch (e) {
      if (o === me && id === owner) body.innerHTML = `<div class="msg err">${esc(errText(e))}</div><div class="row"><button type="button" class="btn" data-k="retry">Noch einmal versuchen</button></div>`;
      return;
    }
    // Inzwischen geschlossen oder ein anderer Kunde geöffnet (Antworten können sich überholen): Antwort verwerfen
    if (o !== me || id !== owner) return;
    d = data; render(null);
  }

  // Speichern: alle Knöpfe kurz sperren, danach die Daten neu holen und anzeigen. Nur ein Vorgang gleichzeitig.
  async function run(keep, job, opt = {}) {
    if (busy || !o) return;
    const me = o, owner = id, here = () => o === me && id === owner;
    const lock = on => { if (here()) $$('button').forEach(b => { b.disabled = on; }); };
    busy = true; lock(true); say(opt.wait || 'Speichere …');
    let res;
    try { res = await job(); if (here() && !opt.noChange) changed = true; }
    catch (e) { if (here()) { busy = false; lock(false); say(errText(e), 'err'); } return; }
    let data = null;
    try { data = await fetchData(owner); } catch {}
    if (!here()) return; // Dialog inzwischen zu bzw. ein anderer Kunde offen: dort nichts anzeigen
    if (data) { d = data; render(keep); }
    busy = false; lock(false);
    const r = typeof res === 'string' ? { t: res } : res || { t: 'Gespeichert.' };
    say((r.t || 'Gespeichert.') + (data ? '' : ' (Die Anzeige konnte nicht neu geladen werden – bitte den Dialog schließen und neu öffnen.)'), r.cls || 'ok');
  }

  // Rabatt bzw. VIP bei laufenden Stripe-Abos übernehmen (license-shop, Aktion 'admin-discount'). Wirft nie – das Ergebnis sagt,
  // was passiert ist: ok, part (einzelne Abos abgelehnt), missing (Server kennt die Aktion noch nicht), timeout (Ergebnis offen),
  // net (keine Verbindung), stripe (Stripe-Fehler) oder server (Anmeldung, Zwei-Faktor, Server – nicht Stripes Schuld).
  async function stripeDiscount(owner) {
    let r = null, err = null, timeout = false, timer = null;
    try {
      const res = await Promise.race([sb.functions.invoke('license-shop', { body: { action: 'admin-discount', owner } }),
        new Promise((_, no) => { timer = setTimeout(() => { timeout = true; no(new Error('Zeitüberschreitung')); }, 20000); })]);
      r = res?.data; err = res?.error;
      if (err?.context?.json) { try { r = await err.context.json(); } catch {} }
    } catch (e) { err = e; } finally { clearTimeout(timer); }
    if (timeout) return { ok: false, kind: 'timeout' };
    if (r && typeof r === 'object' && (r.ok === true || N(r.failed) > 0)) {
      const subs = Array.isArray(r.subs) ? r.subs.filter(x => x && typeof x === 'object') : [], bad = subs.filter(x => x.result === 'fehler');
      const changedN = r.changed != null ? N(r.changed) : subs.filter(x => x.result === 'gesetzt' || x.result === 'entfernt').length;
      if (r.ok === true) return { ok: true, n: Array.isArray(r.subs) ? subs.length : N(r.changed) + N(r.unchanged), changed: changedN };
      return { ok: false, kind: 'part', failed: N(r.failed), total: subs.length || N(r.failed), m: String(bad[0]?.error || '') };
    }
    const status = N(err?.context?.status), m = String(r?.error || r?.message || err?.message || '');
    if (/Unbekannte Aktion|noch nicht freigeschaltet|Requested function was not found/i.test(m)) return { ok: false, kind: 'missing' };
    if (err?.name === 'FunctionsFetchError' || /Failed to send|Failed to fetch|NetworkError|Load failed/i.test(m)) return { ok: false, kind: 'net' };
    const why = !m ? 'Keine Antwort vom Server.' : /non-2xx/i.test(m) ? `Der Server meldet einen Fehler${status ? ' (' + status + ')' : ''}.` : m;
    const auth = status === 401 || status === 403;
    if (!auth && (status === 502 || /Stripe/i.test(m))) return { ok: false, kind: 'stripe', m: why };
    return { ok: false, kind: 'server', auth, m: why === m ? errText({ message: m }) : why };
  }
  // Nach JEDER Rabatt- und VIP-Änderung bei Stripe abgleichen (stripe-rabatt.md 4.2) – bewusst nicht von stripe_active abhängig:
  // Abos mit fehlgeschlagener Zahlung (past_due/unpaid) haben valid_until in der Vergangenheit, bekommen aber weiter Rechnungen.
  // Ohne Änderung schickt der Server nichts an Stripe; ohne Abo kommt subs: []. what: 'disc' | 'vip-on' | 'vip-off' | 'sync'.
  async function afterStripe(what, verb, owner, hs, pct = 0) {
    const r = await stripeDiscount(owner);
    const out = (t, cls) => { t = (verb + t).trim() || 'Erledigt.'; return cls ? { t, cls } : t; };
    const again = m => /noch einmal|Bei Stripe übernehmen/.test(m || '') ? '' : ' Bitte gleich „Bei Stripe übernehmen“ drücken.';
    if (r.ok) {
      if (!r.n) return out(what === 'sync' ? 'Bei Stripe läuft kein Abo dieses Kunden – es gibt nichts anzupassen.'
        : what === 'disc' && pct ? ' Er gilt beim nächsten Kauf (zurzeit läuft kein Abo bei Stripe).' : '');
      if (!r.changed) return out(what === 'sync' ? 'Bei Stripe war schon alles richtig.' : ' Die laufenden Abos bei Stripe stimmen schon.');
      return out(what === 'sync' ? 'Bei Stripe übernommen – gilt ab der nächsten Rechnung des Kunden.'
        : what === 'vip-on' && VIP_STRIPE_GRATIS ? ' Die laufenden Abos bei Stripe kosten ab der nächsten Rechnung 0 € (der BoothDesigner bleibt kostenpflichtig).'
        : what === 'vip-off' && VIP_STRIPE_GRATIS ? ' Die laufenden Abos bei Stripe kosten ab der nächsten Rechnung wieder den normalen Preis (bzw. mit seinem Rabatt).'
        : ' Die laufenden Abos bei Stripe sind auch angepasst (ab der nächsten Rechnung).');
    }
    if (r.kind === 'part') return out(` Bei ${r.failed} von ${r.total} laufenden Abos hat Stripe es nicht übernommen${r.m ? ': ' + r.m.replace(/\.$/, '') : ''}.` + again(), 'warn');
    if (r.kind === 'missing') {
      if (what === 'sync') return out('Das kann der Server noch nicht – es kommt mit dem nächsten Server-Update.', 'warn');
      if (hs && what === 'vip-on' && VIP_STRIPE_GRATIS) return out(' Achtung: Laufende Abos bei Stripe werden erst nach dem nächsten Server-Update auf 0 € gestellt – bis dahin wird weiter abgebucht.', 'warn');
      if (hs && what === 'disc') return out(' Das wirkt bei neuen Buchungen; laufende Abos bei Stripe erst nach dem nächsten Server-Update.', 'warn');
      return out(what === 'disc' && pct ? ' Er gilt beim nächsten Kauf des Kunden.' : '');
    }
    if (r.kind === 'timeout') return out(' Stripe antwortet gerade nicht – ob die laufenden Abos schon angepasst sind, ist offen.' + again(), 'warn');
    if (r.kind === 'net') return out(' Die laufenden Abos bei Stripe sind noch nicht angepasst (keine Verbindung zum Server).' + again(), 'warn');
    if (r.kind === 'stripe') return out(' Bei den laufenden Abos hat Stripe es nicht übernommen: ' + r.m + again(r.m), 'warn');
    // Anmeldung, Zwei-Faktor oder Server: Text des Servers, ohne Stripe die Schuld zu geben
    return out(' Die laufenden Abos bei Stripe sind noch nicht angepasst: ' + r.m + (r.auth ? ' Danach „Bei Stripe übernehmen“ drücken.' : again(r.m)), 'warn');
  }

  async function onClick(e) {
    const b = e.target.closest('button[data-k]'); if (!b || b.disabled) return;
    const k = b.dataset.k, x = b.dataset.x, keep = b.closest('[data-sec]');
    if (k === 'close') return close();
    if (k === 'retry') return load();
    if (busy || asking || !d) return;
    const me = o, owner = id, p = prof(), who = p.name || p.email || 'diesem Kunden';
    const val = s => String($(`input[data-k="${s}"]`, keep)?.value ?? '').trim();
    // Rückfrage: der Knopf gibt den Fokus ab (sonst klickt Enter ihn hinter der Rückfrage noch einmal), solange sie offen ist, nimmt
    // der Dialog keine Klicks an, und danach zählt das Ja nur, wenn nichts anderes läuft und noch derselbe Kunde offen ist.
    const ask = async (t, ok) => {
      b.blur?.(); asking = true;
      try { return !!(await (window.pmConfirm ? window.pmConfirm(t, ok) : Promise.resolve(confirm(t)))) && !busy && o === me && id === owner; }
      finally { asking = false; }
    };

    if (k === 'vip-on' || k === 'vip-off') {
      const on = k === 'vip-on', hs = hasStripe();
      if (!await ask(on ? `${who} auf VIP stellen? Dann ist alles kostenlos und ohne Ablauf: Fotobox mit allen Funktionen, alle Zusatzfunktionen und die Offline-Warteschlange.${hs ? (VIP_STRIPE_GRATIS
          ? ' Laufende Abos bei Stripe kosten ab der nächsten Rechnung 0 € (der BoothDesigner bleibt kostenpflichtig).'
          : ' Achtung: Laufende Abos bei Stripe werden weiter abgebucht – bei Bedarf bei Stripe kündigen.') : ''}`
        : `VIP bei ${who} ausschalten? Der Kunde bekommt genau seinen Stand von vorher zurück, auch die Zahl der Fotoboxen.${d?.free_mode === false ? ' Wurde das Preismodell seit dem Einschalten umgestellt, gilt dabei die neue Preisliste.' : ''}${hs && VIP_STRIPE_GRATIS
          ? ' Laufende Abos bei Stripe kosten ab der nächsten Rechnung wieder den normalen Preis (bzw. mit seinem Rabatt).' : ''}`, on ? 'VIP einschalten' : 'VIP ausschalten')) return;
      return run(keep, async () => {
        const v = await rpc('admin_set_vip', { p_owner: owner, p_on: on });
        const free = !on && N(v?.to_free) > 0 ? ' Nach der neuen Preisliste ist seine alte Lizenz jetzt kostenlos.' : '';
        return afterStripe(on ? 'vip-on' : 'vip-off', (on ? 'VIP ist an – alles kostenlos.' : 'VIP ist aus – der Stand von vorher ist wieder da.') + free, owner, hs);
      });
    }
    if (k === 'stripe-sync') return run(keep, () => afterStripe('sync', '', owner, true), { noChange: true, wait: 'Gleiche mit Stripe ab …' });
    if (k === 'free-add') {
      const n = N(b.dataset.n), cur = freeUntil(), t = dayEnd(addMonths(future(cur) ? cur : new Date(), n));
      if (!t) return say('Das Datum konnte nicht berechnet werden. Bitte ein Datum wählen.', 'err');
      return run(keep, async () => `Gratis bis ${fmtD(await rpc('admin_free_until', { p_owner: owner, p_until: t.toISOString() }) || t)}.`);
    }
    if (k === 'free-set') {
      const s = val('freedate'), t = dayEnd(s);
      if (!s) return say('Bitte zuerst ein Datum wählen.', 'err');
      if (!t) return say('Bitte ein gültiges Datum wählen.', 'err');
      if (t <= Date.now()) return say('Das Datum liegt in der Vergangenheit. Zum Beenden „Jetzt beenden“ drücken.', 'err');
      return run(keep, async () => `Gratis bis ${fmtD(await rpc('admin_free_until', { p_owner: owner, p_until: t.toISOString() }) || t)}.`);
    }
    if (k === 'free-end') {
      if (!await ask(`Gratis-Zeitraum von ${who} jetzt beenden? Das Konto fällt dann sofort auf seinen normalen Stand zurück (kostenlos oder sein Abo).`, 'Beenden')) return;
      return run(keep, async () => { await rpc('admin_free_until', { p_owner: owner, p_until: null }); return 'Gratis-Zeitraum beendet.'; });
    }
    if (k === 'disc-save' || k === 'disc-off') {
      let pct = 0, until = null;
      const note = val('note').slice(0, 200);
      if (k === 'disc-save') {
        const raw = val('pct').replace(',', '.');
        pct = Number(raw);
        if (raw === '' || !Number.isInteger(pct) || pct < 0 || pct > 100) return say('Bitte beim Rabatt eine ganze Zahl von 0 bis 100 eingeben (0 = kein Rabatt).', 'err');
        const s = val('until');
        if (s && pct) {
          const t = dayEnd(s);
          if (!t) return say('Bitte beim Rabatt ein gültiges Datum wählen.', 'err');
          if (t <= Date.now()) return say('Das Ende des Rabatts liegt in der Vergangenheit. Bitte ein späteres Datum wählen oder das Feld leer lassen.', 'err');
          until = t.toISOString();
        }
      } else if (!await ask(`Rabatt von ${who} entfernen?`, 'Entfernen')) return;
      // Bei VIP kostet ohnehin alles 0 € (Stripe: 100 %) – der Rabatt zählt dann nur für den BoothDesigner (nicht Teil von VIP)
      const hs = hasStripe(), vipNote = pct && deal().vip ? ' Solange VIP an ist, zählt er nur für den BoothDesigner; nach „VIP aus“ für alles.' : '';
      return run(keep, async () => {
        await rpc('admin_set_discount', { p_owner: owner, p_pct: pct, p_until: until, p_note: note || null });
        return afterStripe('disc', (pct ? `Rabatt ${pct} % gespeichert.` : 'Rabatt entfernt.') + vipNote, owner, hs, pct);
      });
    }
    if (k === 'gift' || k === 'gift-del') {
      if (!NAME[x] || !EXTRAS.some(([e]) => e === x)) return;
      if (k === 'gift-del') {
        if (!await ask(`Geschenk „${NAME[x]}“ bei ${who} entfernen? Test, Abo oder Freigabe bleiben davon unberührt.`, 'Entfernen')) return;
        return run(keep, async () => { await rpc('admin_remove_gift', { p_owner: owner, p_extra: x }); return `Geschenk „${NAME[x]}“ entfernt.`; });
      }
      const s = String($(`input[data-k="giftdate"][data-x="${x}"]`, keep)?.value || '').trim(), t = s ? dayEnd(s) : null;
      if (s && !t) return say('Bitte ein gültiges Datum wählen.', 'err');
      if (t && t <= Date.now()) return say('Das Datum liegt in der Vergangenheit. Für „dauerhaft“ das Datum leer lassen.', 'err');
      return run(keep, async () => { await rpc('admin_gift_extra', { p_owner: owner, p_extra: x, p_until: t ? t.toISOString() : null }); return `„${NAME[x]}“ geschenkt – ${t ? 'bis ' + fmtD(t) : 'dauerhaft'}.`; });
    }
    if (k === 'dev-save') {
      const n = Number(val('maxdev'));
      if (!Number.isInteger(n) || n < 1 || n > 1000) return say('Bitte bei den Fotoboxen eine ganze Zahl von 1 bis 1000 eingeben.', 'err');
      return run(keep, async () => { await rpc('set_max_devices', { p_owner: owner, p_n: n }); return `Bis zu ${n} ${n === 1 ? 'Fotobox' : 'Fotoboxen'} – gilt für neu verbundene PCs.`; });
    }
    if (k === 'store-save') {
      const gb = Number(val('quota').replace(',', '.'));
      if (!Number.isInteger(gb) || gb < 1 || gb > 100000) return say('Bitte beim Speicher eine ganze Zahl von 1 bis 100000 (GB) eingeben.', 'err');
      return run(keep, async () => { await rpc('set_storage_gb', { p_owner: owner, p_gb: gb }); return `Speicher-Grenze: ${gb} GB.`; });
    }
  }

  // Esc schließt – aber nicht, solange eine Rückfrage (pmConfirm) darüber liegt oder gerade gespeichert wird
  const onKey = e => { if (e.key === 'Escape' && o && !busy && document.body.lastElementChild === o) close(); };

  function close() {
    if (!o) return;
    o.remove(); o = null; document.removeEventListener('keydown', onKey);
    const r = done; done = null;
    if (changed) toast('Änderungen beim Kunden gespeichert.', 3000);
    if (r) r(changed);
  }

  // Dialog öffnen; das Versprechen erfüllt sich beim Schließen mit true, wenn etwas geändert wurde
  function open(ownerId, opt = {}) {
    if (o) close();
    sb = opt.sb; esc = typeof opt.esc === 'function' ? opt.esc : esc0; toast = typeof opt.toast === 'function' ? opt.toast : () => {};
    id = String(ownerId || ''); d = null; changed = false; busy = false; asking = false;
    o = document.createElement('div'); o.id = 'pmKunde';
    o.style.cssText = 'position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';
    o.innerHTML = `<div class="card" role="dialog" aria-modal="true" aria-label="Kunde bearbeiten" style="width:min(760px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;padding:0;overflow:hidden;margin:auto">
      <div style="padding:16px 18px 12px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div style="min-width:0"><h2 style="margin:0">Kunde bearbeiten</h2><div class="small muted" data-k="who" style="overflow-wrap:anywhere"></div></div>
        <button type="button" class="btn small" data-k="close" aria-label="Schließen" title="Schließen">✕</button></div>
      <div data-k="body" style="padding:14px 18px;overflow:auto;flex:1;display:flex;flex-direction:column;gap:12px"></div>
      <div style="padding:12px 18px;border-top:1px solid var(--line);display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <div class="msg hidden" data-k="msg" role="status" style="flex:1;min-width:200px"></div>
        <button type="button" class="btn primary" data-k="close" style="margin-left:auto">Fertig</button></div></div>`;
    document.body.appendChild(o);
    o.addEventListener('click', onClick);
    o.addEventListener('input', e => { if (e.target.matches?.('[data-k="giftdate"]')) giftLabels(); });
    // Enter im Feld = der passende Knopf dieses Abschnitts
    o.addEventListener('keydown', e => {
      const go = e.key === 'Enter' && e.target.dataset?.go; if (!go) return;
      e.preventDefault();
      const x = e.target.dataset.x, keep = e.target.closest('[data-sec]');
      $(`button[data-k="${go}"]${x ? `[data-x="${x}"]` : ''}`, keep)?.click();
    });
    document.addEventListener('keydown', onKey);
    if (!sb?.rpc) { $('[data-k="body"]').innerHTML = '<div class="msg err">Keine Verbindung zum Server (Dashboard nicht richtig geladen). Bitte die Seite neu laden.</div>'; }
    else load();
    return new Promise(res => { done = res; });
  }
  return { open };
})();
