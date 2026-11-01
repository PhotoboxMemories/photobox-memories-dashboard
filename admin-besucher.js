// Besucher von boothdesigner.de (Betreiber 01.11.2026: „wird viel besucht?“ → Zähler ohne Cookies). Karte in Verwaltung → Übersicht,
// nur für den Betreiber. Zahlen aus admin_studio_besuche (SQL 202611010001, prüft selbst Zwei-Faktor); gezählt wird auf der Webseite
// von template-studio/webseite/zaehler.js – nur Tagessummen je Seite und Herkunft, keine Personen.
// Aufruf aus loadOverview(): AdminBesucher.load(sb, element, esc)
window.AdminBesucher = (() => {
  'use strict';
  const QUELLEN = { werbung: 'Google-Werbung', google: 'Google-Suche', suche: 'Andere Suchmaschinen', social: 'Soziale Netzwerke',
    direkt: 'Direkt (Adresse/Lesezeichen)', andere: 'Andere Webseiten', intern: 'Innerhalb der Seite' };
  const SEITEN = { '/': 'Startseite', '/konto/': 'Mein BoothDesigner', '/agb.html': 'AGB', '/impressum.html': 'Impressum', '/datenschutz.html': 'Datenschutz' };
  const BAR = '#b8892f'; // BoothDesigner-Gold, 3:1 auf Weiß
  const berlin = (d) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(d); // JJJJ-MM-TT
  let tage = 30;

  async function load(sb, el, esc) {
    if (!el) return;
    if (!el.dataset.ready) {
      el.dataset.ready = '1';
      el.innerHTML = `<div class="pagehead" style="margin-bottom:10px"><h2 style="margin:0">boothdesigner.de – Besucher</h2>
        <select data-bv-tage style="width:auto" title="Zeitraum"><option value="7">Letzte 7 Tage</option><option value="30" selected>Letzte 30 Tage</option><option value="90">Letzte 90 Tage</option></select></div>
        <div data-bv-body class="small muted">Lädt …</div>`;
      el.querySelector('[data-bv-tage]').onchange = (e) => { tage = +e.target.value; load(sb, el, esc); };
    }
    const body = el.querySelector('[data-bv-body]');
    const { data, error } = await sb.rpc('admin_studio_besuche', { p_tage: tage });
    if (error) {
      body.innerHTML = /admin_studio_besuche|function|schema cache/i.test(error.message || '')
        ? 'Noch nicht eingerichtet: SQL <b>202611010001_boothdesigner_besucher.sql</b> im Supabase „SQL Editor“ ausführen.'
        : 'Konnte nicht geladen werden: ' + esc(error.message || error);
      return;
    }
    render(body, data || [], esc);
  }

  function render(body, rows, esc) {
    const sum = (a, f) => a.reduce((n, x) => n + (+f(x) || 0), 0);
    const days = [];
    for (let i = tage - 1; i >= 0; i--) days.push(berlin(new Date(Date.now() - i * 864e5)));
    const perDay = Object.fromEntries(days.map((d) => [d, 0]));
    for (const r of rows) if (r.tag in perDay) perDay[r.tag] += +r.besuche || 0;
    const by = (key) => { const o = {}; for (const r of rows) { const k = r[key]; o[k] = o[k] || { b: 0, a: 0 }; o[k].b += +r.besuche || 0; o[k].a += +r.aufrufe || 0; } return o; };
    const q = by('quelle'), s = by('seite');
    const besuche = sum(rows, (x) => x.besuche), aufrufe = sum(rows, (x) => x.aufrufe);
    const tile = (n, t, sub) => `<div class="card"><b>${n}</b><span>${t}</span><span class="small muted">${sub}</span></div>`;
    const heute = perDay[days[days.length - 1]] || 0;
    const max = Math.max(1, ...Object.values(perDay));
    const fmt = (d) => d.slice(8, 10) + '.' + d.slice(5, 7) + '.';
    const bars = days.map((d) => `<div title="${fmt(d)}: ${perDay[d]} ${perDay[d] === 1 ? 'Besuch' : 'Besuche'}" style="flex:1;display:flex;align-items:flex-end;height:100%;min-width:0">
        <div style="width:100%;height:${perDay[d] ? Math.max(3, Math.round(perDay[d] / max * 100)) : 0}%;background:${BAR};border-radius:4px 4px 0 0"></div></div>`).join('');
    const table = (o, names, head) => {
      const list = Object.entries(o).sort((a, b) => b[1].a - a[1].a);
      return `<table><thead><tr><th>${head}</th><th>Besuche</th><th>Seitenaufrufe</th></tr></thead><tbody>${list.length
        ? list.map(([k, v]) => `<tr><td>${esc(names[k] || k)}</td><td>${v.b}</td><td>${v.a}</td></tr>`).join('')
        : '<tr><td colspan="3" class="empty">Noch keine Zahlen</td></tr>'}</tbody></table>`;
    };
    body.className = '';
    body.innerHTML = `<div class="stats" style="margin-bottom:14px">
        ${tile(besuche, 'Besuche', `${heute} heute`)}
        ${tile(aufrufe, 'Seitenaufrufe', besuche ? `${(aufrufe / besuche).toFixed(1).replace('.', ',')} Seiten je Besuch` : '–')}
        ${tile(q.werbung?.b || 0, 'Über Google-Werbung', 'Besuche aus den Anzeigen')}
        ${tile(q.google?.b || 0, 'Über Google-Suche', 'ohne Werbung')}
      </div>
      <div class="small muted" style="margin-bottom:6px">Besuche je Tag</div>
      <div role="img" aria-label="Besuche je Tag, höchstens ${max === 1 && !besuche ? 0 : max} an einem Tag" style="display:flex;gap:2px;align-items:flex-end;height:110px;border-bottom:1px solid var(--line);padding-top:4px">${bars}</div>
      <div class="small muted" style="display:flex;justify-content:space-between;margin:4px 0 16px"><span>${fmt(days[0])}</span><span>höchstens ${besuche ? max : 0} an einem Tag</span><span>heute</span></div>
      <div class="grid2" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px">
        <div class="tablewrap">${table(q, QUELLEN, 'Woher')}</div>
        <div class="tablewrap">${table(s, SEITEN, 'Seite')}</div>
      </div>
      <p class="small muted" style="margin:12px 0 0">Gezählt ohne Cookies und ohne Daten über die Besucher. Ein Besuch = Aufruf von außen (nicht beim Neuladen oder Klicken innerhalb der Seite). Suchmaschinen-Roboter werden nicht mitgezählt.</p>`;
  }

  return { load };
})();
