// Shared event settings and sequential portrait processing; no credentials in event data.
(function (root) {
  function normalize(value) {
    // bis 500 Stile je Ereignis (Betreiber 08.11.2026: „alle KI-Stile für ein Event auswählen“), vorher 30
    const prompts = Array.isArray(value?.prompts) ? value.prompts.slice(0, 500).map((p, i) => ({
      id: typeof p?.id === 'string' ? p.id : 'prompt-' + i,
      name: typeof p?.name === 'string' ? p.name.slice(0, 60) : 'Stil ' + (i + 1),
      prompt: typeof p?.prompt === 'string' ? p.prompt.slice(0, 1200) : '',
      // optionales Vorschaubild (öffentliche https-Adresse), im Dashboard beim Speichern eines getesteten Stils gesetzt
      ...(typeof p?.thumb === 'string' && /^https:\/\/[^\s"'<>]{1,500}$/.test(p.thumb) ? { thumb: p.thumb } : {}),
      // Thema aus der Stil-Sammlung (z. B. „Berufe“) – die Fotobox zeigt viele Stile nach Themen sortiert
      ...(typeof p?.cat === 'string' && p.cat.trim() ? { cat: p.cat.trim().slice(0, 40) } : {})
    })) : typeof value?.prompt === 'string' && value.prompt.trim() ? [{ id: 'legacy', name: 'Mein Stil', prompt: value.prompt.slice(0, 1200) }] : [];
    const selected = prompts.find(p => p.id === value?.selectedId) || prompts[0];
    // Alle KI-Bilder laufen über die zentrale KI (Grok über Photobox Memories, Credits). Eigene API-Schlüssel (Gemini,
    // OpenAI, Grok auf der Fotobox) gibt es seit 19.10.2026 nicht mehr – auch alte Events mit „local“ nutzen Grok.
    const connection = 'central';
    return { connection, resolution: value?.resolution === '2k' ? '2k' : '1k', provider: 'grok', enabled: value?.enabled === true, prompts, guestChoice: value?.guestChoice !== false,
      selectedId: selected?.id || '', prompt: selected?.prompt || '' };
  }
  const forBooth = (settings, enabled = true) => ({ ...normalize(settings), enabled: enabled !== false && normalize(settings).enabled });
  const applicable = (settings, layout) => normalize(settings).enabled && !layout.video && !layout.anim && !layout.burst;
  // parallel: alle Fotos gleichzeitig an die KI (Collage/Streifen etwa so schnell wie ein Einzelbild, Betreiber 16.11.2026); progress(1, n, true).
  // Reihenfolge der Ergebnisse bleibt wie die der Fotos; fromImage(url, index).
  async function processShots({ settings, layout, shots, consent, generate, toImage, fromImage, check = () => {}, progress = () => {}, parallel = false }) {
    const config = normalize(settings);
    if (!applicable(config, layout)) return shots;
    if (!config.prompt.trim()) throw new Error('Im Dashboard fehlt der KI-Prompt für dieses Event.');
    if (!consent) throw new Error('Die Zustimmung zur KI-Verarbeitung fehlt.');
    const one = async i => generate({ image: await toImage(shots[i]), style: 'custom', resolution: config.resolution, prompt: config.prompt, consent: true });
    if (parallel && shots.length > 1) {
      check(); progress(1, shots.length, true);
      // Alle abwarten (kein Abbruch beim ersten Fehler – die anderen wären schon bezahlt); fehlgeschlagene einmal einzeln nachholen
      const tries = await Promise.allSettled(shots.map((_, i) => one(i))), outs = [];
      for (let i = 0; i < tries.length; i++) { check(); outs.push(tries[i].status === 'fulfilled' ? tries[i].value : await one(i)); }
      check();
      const done = [];
      for (let i = 0; i < outs.length; i++) done.push(await fromImage(outs[i].image, i));
      check();
      return done;
    }
    const results = [];
    for (let i = 0; i < shots.length; i++) {
      check(); progress(i + 1, shots.length);
      const output = await one(i);
      check();
      results.push(await fromImage(output.image, i));
    }
    check();
    return results;
  }
  // Logo in Originalfarben (Betreiber 16.11.2026: „die Logo-Farbe wird immer geändert“): Die KI malt das ganze Bild neu und passt das Logo
  // sonst an Licht und Stil an. Wird ein Logo mitgeschickt, kommt dieser Satz an den Stil-Text – nur wenn er unter 1200 Zeichen bleibt (Server-Grenze).
  const LOGO_KEEP = ' Das Logo behält exakt seine Originalfarben, Form und Schrift: nicht umfärben, nicht an Licht, Farbstimmung oder Stil anpassen.';
  const logoPrompt = p => { p = String(p || '').trim(); return p.length + LOGO_KEEP.length <= 1200 && !p.includes(LOGO_KEEP.trim()) ? p + LOGO_KEEP : p; };
  const api = { forBooth, normalize, applicable, processShots, logoPrompt, LOGO_KEEP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AIEvent = api;
})(typeof window === 'undefined' ? this : window);
