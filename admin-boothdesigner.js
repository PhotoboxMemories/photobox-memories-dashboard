// Verwaltung → BoothDesigner (Betreiber 01.11.2026: „diesen Bereich übersichtlicher machen … für BoothDesigner eigene unter Menü“).
// Alles zum BoothDesigner auf einer Seite: neue Konten von boothdesigner.de, laufende Testversionen, Abos, Besucher (admin-besucher.js)
// und die Liste dieser Kunden. Kennzeichen aus admin_customer_marks (SQL 202610280010): bd = Konto auf boothdesigner.de erstellt,
// studio = Stand des BoothDesigners. „freigabe“ (über eine Fotobox-Lizenz freigeschaltet) zählt hier nicht als BoothDesigner-Kunde.
// Aufruf aus loadOverview(): AdminBD.load(sb, element, esc, fmtDate)
window.AdminBD = (() => {
  'use strict';
  const STAND = { vip: 'VIP', abo: 'Abo (bezahlt)', geschenk: 'Geschenk', test: 'Testversion', abgelaufen: 'abgelaufen', frei: 'frei', freigabe: 'über Fotobox-Lizenz' };
  const KUNDE = ['vip', 'abo', 'geschenk', 'test'];
  const day = 864e5;

  async function load(sb, el, esc, fmtDate) {
    if (!el) return;
    if (!el.dataset.ready) {
      el.dataset.ready = '1';
      el.innerHTML = `<div class="stats" data-bd-stats></div>
        <div class="card" style="margin-bottom:20px">
          <h2 style="margin:0 0 10px">Kunden mit BoothDesigner</h2>
          <div class="tablewrap"><table>
            <thead><tr><th>Kunde</th><th>Registriert</th><th>Woher</th><th>Stand</th><th>Endet</th></tr></thead>
            <tbody data-bd-rows><tr><td colspan="5" class="empty">Lädt …</td></tr></tbody>
          </table></div>
          <p class="small muted" data-bd-note style="margin:10px 0 0"></p>
        </div>
        <div class="card" data-bd-visits style="margin-bottom:20px"></div>`;
    }
    window.AdminBesucher?.load(sb, el.querySelector('[data-bd-visits]'), esc);
    const [p, m] = await Promise.all([
      sb.from('profiles').select('id,email,name,created_at').order('created_at', { ascending: false }),
      sb.rpc('admin_customer_marks')
    ]);
    if (p.error || m.error) {
      el.querySelector('[data-bd-rows]').innerHTML = `<tr><td colspan="5" class="empty">Konnte nicht geladen werden: ${esc((p.error || m.error).message || '')}</td></tr>`;
      return;
    }
    render(el, p.data || [], Object.fromEntries((m.data || []).filter((x) => x && x.id).map((x) => [x.id, x])), esc, fmtDate);
  }

  function render(el, profiles, marks, esc, fmtDate) {
    const now = Date.now(), dated = (u) => u && new Date(u).getFullYear() < 2100; // ab 2100 = dauerhaft
    const since = (x, n) => now - new Date(x.created_at) < n * day;
    const bdKonten = profiles.filter((x) => marks[x.id]?.bd);
    const kunden = profiles.filter((x) => marks[x.id]?.bd || KUNDE.includes(marks[x.id]?.studio));
    const tests = kunden.filter((x) => marks[x.id].studio === 'test').sort((a, b) => new Date(marks[a.id].until || 0) - new Date(marks[b.id].until || 0));
    const abos = kunden.filter((x) => marks[x.id].studio === 'abo');
    const next = tests.find((x) => dated(marks[x.id].until));
    const tile = (n, t, sub) => `<div class="card"><b>${n}</b><span>${t}</span><span class="small muted">${sub}</span></div>`;
    el.querySelector('[data-bd-stats]').innerHTML =
      tile(bdKonten.filter((x) => since(x, 7)).length, 'Neue Konten (7 Tage)',
        `über boothdesigner.de · heute ${bdKonten.filter((x) => since(x, 1)).length} · gesamt ${bdKonten.length}`) +
      tile(tests.length, 'Testversionen laufen', next ? `nächste endet am ${fmtDate(marks[next.id].until)}` : 'keine') +
      tile(abos.length, 'Bezahlte Abos', '10 € im Monat oder 100 € im Jahr') +
      tile(profiles.filter((x) => since(x, 7)).length, 'Alle neuen Konten (7 Tage)', `Fotobox und BoothDesigner · gesamt ${profiles.length}`);
    // Zuerst, was bald Aufmerksamkeit braucht: Tests nach Ablauf, dann Abos/VIP/Geschenk, dann der Rest nach Datum
    const rank = (x) => ({ test: 0, abo: 1, vip: 2, geschenk: 3 })[marks[x.id].studio] ?? 4;
    const rows = kunden.slice().sort((a, b) => rank(a) - rank(b) || (rank(a) === 0
      ? new Date(marks[a.id].until || 0) - new Date(marks[b.id].until || 0) : new Date(b.created_at) - new Date(a.created_at)));
    el.querySelector('[data-bd-rows]').innerHTML = rows.length ? rows.map((x) => {
      const k = marks[x.id], end = dated(k.until) ? new Date(k.until) : null, soon = k.studio === 'test' && end && end - now < 3 * day;
      return `<tr><td><b>${esc(x.name || x.email)}</b>${x.name ? `<br><span class="small muted">${esc(x.email)}</span>` : ''}</td>
        <td>${fmtDate(x.created_at)}</td>
        <td>${k.bd ? 'boothdesigner.de' : '<span class="small muted">Dashboard</span>'}</td>
        <td><span class="badge${['abo', 'vip'].includes(k.studio) ? ' ok' : ''}">${esc(STAND[k.studio] || 'noch nicht genutzt')}</span></td>
        <td${soon ? ' style="color:var(--bad,#e5484d);font-weight:700"' : ''}>${end && k.studio !== 'abgelaufen' ? fmtDate(k.until) : '<span class="small muted">–</span>'}</td></tr>`;
    }).join('') : '<tr><td colspan="5" class="empty">Noch keine BoothDesigner-Kunden</td></tr>';
    const frei = profiles.filter((x) => marks[x.id]?.studio === 'freigabe').length;
    el.querySelector('[data-bd-note]').textContent = frei
      ? `Nicht in der Liste: ${frei} Fotobox-Kunden, bei denen der BoothDesigner über ihre Fotobox-Lizenz freigeschaltet ist. Rot = Testversion endet in weniger als 3 Tagen.`
      : 'Rot = Testversion endet in weniger als 3 Tagen.';
  }

  return { load };
})();
