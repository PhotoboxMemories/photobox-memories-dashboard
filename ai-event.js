// Shared event settings and sequential portrait processing; no credentials in event data.
(function (root) {
  function normalize(value) {
    const prompts = Array.isArray(value?.prompts) ? value.prompts.slice(0, 30).map((p, i) => ({
      id: typeof p?.id === 'string' ? p.id : 'prompt-' + i,
      name: typeof p?.name === 'string' ? p.name.slice(0, 60) : 'Stil ' + (i + 1),
      prompt: typeof p?.prompt === 'string' ? p.prompt.slice(0, 1200) : '',
      // optionales Vorschaubild (öffentliche https-Adresse), im Dashboard beim Speichern eines getesteten Stils gesetzt
      ...(typeof p?.thumb === 'string' && /^https:\/\/[^\s"'<>]{1,500}$/.test(p.thumb) ? { thumb: p.thumb } : {})
    })) : typeof value?.prompt === 'string' && value.prompt.trim() ? [{ id: 'legacy', name: 'Mein Stil', prompt: value.prompt.slice(0, 1200) }] : [];
    const selected = prompts.find(p => p.id === value?.selectedId) || prompts[0];
    return { connection: value?.connection === 'central' ? 'central' : 'local', resolution: value?.resolution === '1k' ? '1k' : '2k', provider: value?.connection === 'central' ? 'grok' : ['openai','grok'].includes(value?.provider) ? value.provider : 'gemini', enabled: value?.enabled === true, prompts, guestChoice: value?.guestChoice !== false,
      selectedId: selected?.id || '', prompt: selected?.prompt || '' };
  }
  const forBooth = (settings, enabled = true) => ({ ...normalize(settings), enabled: enabled !== false && normalize(settings).enabled });
  const applicable = (settings, layout) => normalize(settings).enabled && !layout.video && !layout.anim && !layout.burst;
  async function processShots({ settings, layout, shots, consent, generate, toImage, fromImage, check = () => {}, progress = () => {} }) {
    const config = normalize(settings);
    if (!applicable(config, layout)) return shots;
    if (!config.prompt.trim()) throw new Error('Im Dashboard fehlt der KI-Prompt für dieses Event.');
    if (!consent) throw new Error('Die Zustimmung zur KI-Verarbeitung fehlt.');
    const results = [];
    for (let i = 0; i < shots.length; i++) {
      check(); progress(i + 1, shots.length);
      const output = await generate({ image: await toImage(shots[i]), style: 'custom', resolution: config.resolution, prompt: config.prompt, consent: true });
      check();
      results.push(await fromImage(output.image));
    }
    check();
    return results;
  }
  const api = { forBooth, normalize, applicable, processShots };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AIEvent = api;
})(typeof window === 'undefined' ? this : window);
