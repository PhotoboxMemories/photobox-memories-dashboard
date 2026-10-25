// Zugangsdaten aus Supabase (Projekt „photobox-memories“, Frankfurt)
// Der Publishable Key darf öffentlich sein – die Daten sind über Zugriffsregeln (RLS) geschützt.
window.FOTOBOX_CONFIG = {
  supabaseUrl: 'https://axagxuphhpgcanttiiuq.supabase.co',
  supabaseAnonKey: 'sb_publishable_ztqtUOzdJvwkwZ0a1Sy67w_tN5etwwm',
  // Foto-Speicher bei Hetzner (Bucket-Adresse + /p, dort liegen die Fotos; software/ ist privat); leer = Fotos bei Supabase
  photoStore: 'https://photobox-memories-fotos.fsn1.your-objectstorage.com/p',
  // GitHub-Repository mit den Update-Dateien, z.B. 'photobox-memories/fotobox-releases'
  releasesRepo: '',
  // Adresse der BoothDesigner-Webseite (template-studio/public auf dem eigenen Server);
  // leer = im Dashboard erscheinen noch kein Link und kein Einbettungscode
  studioUrl: 'https://boothdesigner.de'
};

// Fotos im Online-Speicher: Pfade mit „hz/“ liegen bei Hetzner (photoStore), alle anderen bei Supabase.
// Hochladen und Löschen bei Hetzner läuft über die Supabase-Funktion „photo-store“ (prüft die Anmeldung, nur eigener
// Ordner); die Hetzner-Zugangsdaten liegen nur dort.
window.FOTOBOX_PHOTOS = {
  prefix: 'hz/',
  get external() { return !!window.FOTOBOX_CONFIG.photoStore; },
  enc: p => String(p).split('/').map(encodeURIComponent).join('/'),
  url(path) {
    const C = window.FOTOBOX_CONFIG, p = String(path || '');
    return p.startsWith(this.prefix) ? String(C.photoStore || '').replace(/\/$/, '') + '/' + this.enc(p.slice(this.prefix.length)) : C.supabaseUrl + '/storage/v1/object/public/photos/' + this.enc(p);
  },
  // Notfall-Kopie bei Supabase (gleicher Pfad ohne „hz/“): legt die Fotobox an, wenn Hetzner beim Hochladen nicht erreichbar ist.
  // alt(Pfad) bzw. altSrc(Hetzner-Adresse) liefern die Ersatzadresse – Galerie und Fotoseite nehmen sie, wenn Hetzner nicht antwortet.
  alt(path) { const p = String(path || ''); return p.startsWith(this.prefix) ? window.FOTOBOX_CONFIG.supabaseUrl + '/storage/v1/object/public/photos/' + this.enc(p.slice(this.prefix.length)) : ''; },
  altSrc(src) {
    const C = window.FOTOBOX_CONFIG, base = String(C.photoStore || '').replace(/\/$/, '') + '/', s = String(src || '').split('?')[0];
    return C.photoStore && s.startsWith(base) ? C.supabaseUrl + '/storage/v1/object/public/photos/' + s.slice(base.length) : '';
  },
  // Bild bzw. Video nicht geladen (Fehler-Ereignis der Seite): Lädt eine Galerie sehr viele Bilder auf einmal, antwortet der
  // Foto-Speicher manchmal kurz nicht. Dann erst zweimal beim Foto-Speicher nachfassen, danach die Notfall-Kopie, dann noch zweimal
  // den Foto-Speicher. Vorher sprang die Seite sofort auf die Notfall-Kopie – die gibt es meist nicht mehr, und das Bild fehlte.
  // true = neuer Versuch läuft (Aufrufer macht nichts weiter); false = aufgegeben bzw. nicht zuständig.
  retry(el) {
    const d = el.dataset, n = +d.tries || 0, src = String(el.currentSrc || el.src || '');
    if (!src || /^(blob|data):/.test(src)) return false;
    const orig = d.orig || (d.orig = src.replace(/[?&]r=\d+(?=#|$)/, '')), alt = this.altSrc(orig);
    const plan = d.big ? (alt ? [[alt, 0]] : []) // Shop-Vorschau mit Ersatzbild: nicht lange warten
      : alt ? [[orig, 700], [orig, 2000], [alt, 0], [orig, 4000], [orig, 8000]] : [[orig, 1000], [orig, 3000]];
    if (n >= plan.length) return false;
    const [u, wait] = plan[n]; d.tries = n + 1; if (u === alt) d.alt = '1';
    const [base, hash] = u.split('#'), again = u === alt ? u : base + (base.includes('?') ? '&' : '?') + 'r=' + (n + 1) + (hash ? '#' + hash : '');
    setTimeout(() => { el.src = again; }, wait);
    return true;
  },
  async call(body, token) {
    const C = window.FOTOBOX_CONFIG;
    const r = await fetch(C.supabaseUrl + '/functions/v1/photo-store', { method: 'POST', body: JSON.stringify(body),
      headers: { apikey: C.supabaseAnonKey, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Foto-Speicher HTTP ' + r.status);
    return j;
  },
  async put(path, blob, token) { // path ohne „hz/“
    const { url } = await this.call({ action: 'put', path }, token);
    const r = await fetch(url, { method: 'PUT', body: blob, headers: { 'Content-Type': blob.type || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' } });
    if (!r.ok) throw new Error('Upload HTTP ' + r.status);
  },
  async del(path, token) { // path mit „hz/“
    await this.call({ action: 'delete', path: String(path).slice(this.prefix.length) }, token);
  }
};
