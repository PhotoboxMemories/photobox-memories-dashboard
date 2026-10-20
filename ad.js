// Photobox Memories – Werbung des Vermieters oben auf der Galerie- und Fotoseite der Gäste.
// Jeder Kunde (mit Lizenz) pflegt seine Angaben im Dashboard unter „Meine Lizenzen“; gespeichert als
// photos/<Konto>/werbung.json im öffentlichen Supabase-Speicher (eigener Ordner, siehe Zugriffsregeln „fotos …“).
// Die Galerie findet den Ordner über den Pfad der Fotos (hz/<Konto>/<Ereignis>/… bzw. <Konto>/<Ereignis>/…).
(function (G) {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cut = (s, n) => String(s ?? '').trim().slice(0, n);
  // Farbe des Knopfs (vom Vermieter gewählt): nur #rrggbb; Schrift darauf schwarz oder weiß – je nachdem, was besser lesbar ist
  const hex = c => /^#[0-9a-f]{6}$/i.test(String(c || '').trim()) ? String(c).trim().toLowerCase() : '';
  const onColor = c => { const n = parseInt(c.slice(1), 16), [r, g, b] = [n >> 16, n >> 8 & 255, n & 255]; return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1D1D1B' : '#fff'; };
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const httpUrl = u => {
    u = cut(u, 300); if (!u) return '';
    try { const x = new URL(/^https?:\/\//i.test(u) ? u : 'https://' + u); return /^https?:$/.test(x.protocol) && x.hostname.includes('.') ? x.href : ''; } catch { return ''; }
  };
  const mail = m => { m = cut(m, 120); return /^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(m) ? m : ''; };
  const phone = t => { t = cut(t, 40); return /^\+?[\d\s/().-]{5,}$/.test(t) ? t : ''; };
  const digits = t => String(t || '').replace(/^00/, '+').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  const insta = h => {
    h = cut(h, 120); if (!h) return '';
    const m = h.match(/instagram\.com\/([A-Za-z0-9._]{1,30})/i) || h.match(/^@?([A-Za-z0-9._]{1,30})$/);
    return m ? m[1] : '';
  };

  // gespeicherte Angaben in eine sichere, einheitliche Form bringen (alles Unbekannte fällt weg)
  function normalize(b, owner, cfg) {
    const o = b && typeof b === 'object' ? b : {};
    const logoBase = cfg && owner ? `${cfg.supabaseUrl}/storage/v1/object/public/logos/${owner}/` : '';
    const logo = typeof o.logo === 'string' && logoBase && o.logo.startsWith(logoBase) && !/["'<>\s]/.test(o.logo) ? o.logo : '';
    return {
      on: o.on !== false, name: cut(o.name, 60), text: cut(o.text, 160), logo,
      web: httpUrl(o.web), mail: mail(o.mail), tel: phone(o.tel), wa: phone(o.wa), insta: insta(o.insta), cta: cut(o.cta, 40),
      privacy: httpUrl(o.privacy), // eigene Datenschutzerklärung des Vermieters (für seine Gäste ist er selbst verantwortlich)
      color: hex(o.color) // eigene Farbe für Knopf und Linie unter dem Werbeband (leer = Gelb)
    };
  }
  const has = b => !!(b && b.on && (b.name || b.logo || b.text || b.web || b.mail || b.tel || b.wa || b.insta));

  const ICO = {
    web: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    tel: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.4-.3z"/></svg>',
    insta: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>'
  };
  const CSS = `.pmad{display:flex;gap:12px 16px;align-items:center;justify-content:center;flex-wrap:wrap;background:#1D1D1B;color:#fff;padding:14px 16px;border-bottom:3px solid #F9CB38;font:15px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.pmad .pmad-lg{height:52px;max-width:150px;object-fit:contain;border-radius:10px;background:#fff;padding:4px;flex:0 0 auto}
.pmad .pmad-tx{min-width:0;flex:1 1 220px;max-width:520px}
.pmad .pmad-tx b{display:block;font:600 18px/1.2 Fredoka,system-ui,sans-serif;overflow-wrap:anywhere}
.pmad .pmad-tx span{display:block;color:#d4d4d8;font-size:14px;margin-top:2px;overflow-wrap:anywhere}
.pmad .pmad-bt{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.pmad .pmad-bt a{display:inline-flex;align-items:center;gap:6px;padding:9px 13px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);color:#fff;text-decoration:none;font-weight:600;font-size:14px;white-space:nowrap}
.pmad .pmad-bt a.pmad-cta{background:#F9CB38;border-color:#F9CB38;color:#1D1D1B}
@media(max-width:600px){
.pmad{flex-direction:column;gap:10px;text-align:center;padding:18px 16px 16px}
.pmad .pmad-lg{height:64px;max-width:200px;padding:6px;border-radius:12px}
.pmad .pmad-tx{flex:none;width:100%;max-width:none}
.pmad .pmad-tx b{font-size:21px}
.pmad .pmad-bt{display:grid;grid-template-columns:repeat(auto-fit,minmax(58px,1fr));gap:12px 6px;width:100%;max-width:380px;margin-top:2px}
.pmad .pmad-bt a.pmad-cta{grid-column:1/-1;justify-content:center;padding:13px 16px;font-size:16px;margin-bottom:2px}
.pmad .pmad-bt a:not(.pmad-cta){flex-direction:column;gap:5px;padding:0;background:none;border:0;font-size:12px;font-weight:600;color:#e4e4e7;white-space:normal}
.pmad .pmad-bt a:not(.pmad-cta) svg{width:20px;height:20px;padding:12px;box-sizing:content-box;border-radius:50%;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);color:#fff}}`;
  let cssDone = false;
  function addCss(doc = document) { if (cssDone && doc === document) return; const s = doc.createElement('style'); s.textContent = CSS; doc.head.appendChild(s); if (doc === document) cssDone = true; }

  // Werbeband als HTML (b muss normalize() durchlaufen haben). Kundentexte werden nicht übersetzt (translate="no").
  function html(b) {
    if (!has(b)) return '';
    const link = (href, cls, ico, label, extra = '') => `<a href="${esc(href)}" class="${cls}" target="_blank" rel="noopener nofollow"${extra}>${ico}<span>${label}</span></a>`;
    const ctaHref = b.web || (b.mail ? 'mailto:' + b.mail : b.wa ? 'https://wa.me/' + digits(b.wa).replace('+', '') : b.tel ? 'tel:' + digits(b.tel) : '');
    const btn = [
      b.cta && ctaHref ? link(ctaHref, 'pmad-cta', '', esc(b.cta), ' translate="no"' + (b.color ? ` style="background:${b.color};border-color:${b.color};color:${onColor(b.color)}"` : '')) : '',
      b.web ? link(b.web, '', ICO.web, 'Webseite') : '',
      b.mail ? link('mailto:' + b.mail, '', ICO.mail, 'E-Mail') : '',
      b.tel ? link('tel:' + digits(b.tel), '', ICO.tel, 'Anrufen') : '',
      b.wa ? link('https://wa.me/' + digits(b.wa).replace('+', ''), '', ICO.wa, 'WhatsApp') : '',
      b.insta ? link('https://instagram.com/' + b.insta, '', ICO.insta, 'Instagram') : ''
    ].join('');
    return `<aside class="pmad" aria-label="Anbieter"${b.color ? ` style="border-bottom-color:${b.color}"` : ''}>${b.logo ? `<img class="pmad-lg" src="${esc(b.logo)}" alt="">` : ''}`
      + (b.name || b.text ? `<div class="pmad-tx" translate="no">${b.name ? `<b>${esc(b.name)}</b>` : ''}${b.text ? `<span>${esc(b.text)}</span>` : ''}</div>` : '')
      + (btn ? `<div class="pmad-bt">${btn}</div>` : '') + '</aside>';
  }
  const path = owner => `${owner}/werbung.json`;
  const publicUrl = (owner, cfg) => `${cfg.supabaseUrl}/storage/v1/object/public/photos/${path(owner)}`;
  // Konto aus dem Pfad eines Fotos (hz/<Konto>/… oder <Konto>/…)
  const ownerOf = p => { const m = String(p || '').match(/^(?:hz\/)?([0-9a-f-]{36})\//i); return m && UUID.test(m[1]) ? m[1].toLowerCase() : ''; };
  async function load(owner, cfg) {
    if (!UUID.test(owner || '') || !cfg?.supabaseUrl) return null;
    try {
      const r = await fetch(publicUrl(owner, cfg) + '?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' });
      if (!r.ok) return null;
      return normalize(await r.json(), owner, cfg);
    } catch { return null; }
  }
  G.PM_AD = { normalize, has, html, addCss, path, publicUrl, ownerOf, load };
})(typeof window !== 'undefined' ? window : globalThis);
