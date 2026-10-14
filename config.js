// Zugangsdaten aus Supabase (Projekt „photobox-memories“, Frankfurt)
// Der Publishable Key darf öffentlich sein – die Daten sind über Zugriffsregeln (RLS) geschützt.
window.FOTOBOX_CONFIG = {
  supabaseUrl: 'https://axagxuphhpgcanttiiuq.supabase.co',
  supabaseAnonKey: 'sb_publishable_ztqtUOzdJvwkwZ0a1Sy67w_tN5etwwm',
  // Foto-Speicher bei Hetzner (Bucket-Adresse, z. B. 'https://NAME.fsn1.your-objectstorage.com'); leer = Fotos bei Supabase
  photoStore: '',
  // GitHub-Repository mit den Update-Dateien, z.B. 'photobox-memories/fotobox-releases'
  releasesRepo: ''
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
