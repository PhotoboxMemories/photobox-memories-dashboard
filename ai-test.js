(function (G) {
  'use strict';
  const esc = text => String(text || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  G.AITest = { open(item) {
    const provider = ['openai','grok'].includes(item.provider) ? item.provider : 'gemini';
    const label = provider === 'grok' ? 'xAI (Grok)' : provider !== 'gemini' ? 'OpenAI' : 'Google Gemini';
    const prompt = item.prompt; // Snapshot of the prompt being tested.
    const app = G.fotobox;
    const central = typeof item.generate === 'function';
    const root = document.createElement('div');
    root.id = 'aiTest';
    root.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(15,16,20,.8);padding:24px;overflow:auto;font:14px/1.5 system-ui;color:#222';
    root.innerHTML = `<div style="max-width:980px;margin:auto;background:#fff;border-radius:18px;padding:25px"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">Testbild · ${esc(item.name)}</h2><button data-close>Schließen</button></div>
      <p>Teste deinen Prompt mit einem Foto. Der Test verändert keine Event-Aufnahme.</p><details><summary>Verwendeter Prompt</summary><p style="white-space:pre-wrap">${esc(prompt)}</p></details>
      <div data-keybox style="margin:16px 0"><label>${label}-API-Schlüssel für diesen Test<input data-key type="password" autocomplete="off" placeholder="${label}-API-Schlüssel" style="display:block;width:100%;padding:10px;margin-top:5px"></label><small>Bleibt nur in diesem geöffneten Testfenster. Wird direkt an ${label} gesendet und nicht im Event oder Browser gespeichert.</small></div>
      <p data-keyinfo></p><label>Testfoto (JPEG, PNG oder WebP, maximal 10 MB)<input data-file type="file" accept="image/jpeg,image/png,image/webp" style="display:block;margin:10px 0"></label>
      <div style="display:flex;gap:15px;flex-wrap:wrap;margin:18px 0"><div style="flex:1;min-width:240px"><b>Original</b><img data-original hidden alt="Testfoto" style="width:100%;max-height:350px;object-fit:contain"></div><div style="flex:1;min-width:240px"><b>KI-Ergebnis</b><img data-result hidden alt="KI-Testbild" style="width:100%;max-height:350px;object-fit:contain"><p data-empty>Das Ergebnis erscheint nach dem Test.</p></div></div>
      <label><input data-consent type="checkbox"> Ich darf dieses Foto verwenden und stimme zu, dass Foto und Prompt an ${label} übertragen werden.</label>
      <p><small>Der Test kann Kosten beim gewählten Anbieter verursachen. Es gibt keinen automatischen Neuversuch.</small></p>
      <button data-generate disabled style="background:#f7c838;border:0;border-radius:20px;padding:12px 22px;font-weight:700">Testbild generieren</button>
      <a data-download hidden style="margin-left:15px" download="KI-Testbild.png">Ergebnis herunterladen</a><p data-status role="status" aria-live="polite"></p></div>`;
    document.body.appendChild(root);
    const q = name => root.querySelector('[data-' + name + ']');
    let source = '', busy = false, storedKey = false, closed = false, revision = 0, timer;
    const controller = new AbortController();
    const status = text => { q('status').textContent = text; };
    function update() {
      q('generate').disabled = controller.signal.aborted || busy || !source || !q('consent').checked || (!central && (provider !== 'gemini' ? !storedKey : (!storedKey && !q('key').value.trim())));
      q('close').disabled = busy; q('file').disabled = busy; q('key').disabled = busy; q('consent').disabled = busy;
      q('generate').textContent = busy ? 'Testbild wird erstellt …' : 'Testbild generieren';
    }
    q('key').oninput = update; q('consent').onchange = update;
    q('close').onclick = () => { closed = true; clearInterval(timer); controller.abort(); q('key').value = ''; source = ''; root.remove(); };
    q('file').onchange = async () => {
      const current = ++revision; source = ''; q('consent').checked = false; q('original').hidden = true; q('result').hidden = true; q('empty').hidden = false; q('download').hidden = true; update();
      const f = q('file').files[0]; if (!f) return;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 10 * 1024 * 1024) return status('Bitte ein JPEG-, PNG- oder WebP-Foto mit maximal 10 MB auswählen.');
      try {
        const data = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(f); });
        const img = new Image(); img.src = data; await img.decode(); if (closed || current !== revision) return;
        const scale = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight)), canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale); canvas.height = Math.round(img.naturalHeight * scale); canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        source = canvas.toDataURL('image/jpeg', .92); q('original').src = source; q('original').hidden = false; status('Foto geladen. Noch nicht an den Anbieter gesendet.'); update();
      } catch { status('Das Foto konnte nicht geöffnet werden.'); }
    };
    // Testfoto aus dem Event-Editor (Standard- oder eigenes Foto) gleich übernehmen; über das Dateifeld lässt es sich ändern
    if (item.photo) { source = item.photo; q('original').src = source; q('original').hidden = false; status('Testfoto geladen. Noch nicht an den Anbieter gesendet.'); update(); }
    if (!central && app?.[provider + 'EventStatus']) app[provider + 'EventStatus']().then(s => {
      if (closed) return; storedKey = s.configured && s.secure;
      q('keybox').hidden = storedKey || provider !== 'gemini';
      q('keyinfo').textContent = storedKey ? 'Verwendet den verschlüsselt gespeicherten Schlüssel dieser Fotobox.' : provider !== 'gemini' ? 'Bitte im KI-Kreativstudio den Anbieter auswählen und deinen Schlüssel speichern.' : 'Du kannst hier einen Schlüssel nur für diesen Test eingeben oder ihn im KI-Kreativstudio dauerhaft einrichten.';
      update();
    }).catch(() => { status('KI-Zugang konnte nicht geprüft werden. Bitte die aktuelle Desktop-App verwenden.'); });
    if (provider !== 'gemini') { q('keybox').hidden = true; q('keyinfo').textContent = 'KI-Tests starten in der Fotobox-App. Dort im KI-Kreativstudio den Anbieter auswählen und den Schlüssel speichern.'; }
    if (central) { q('keybox').hidden = true; q('keyinfo').textContent = 'Zentraler Grok-Zugang · Ein erfolgreicher Test kostet 1 Photobox Credit. Kein API-Schlüssel im Browser erforderlich.'; }
    q('generate').onclick = async () => {
      if (q('generate').disabled) return;
      busy = true; update(); q('result').hidden = true; q('download').hidden = true; q('empty').hidden = false;
      const started = Date.now(); const tick = () => status(`Testbild wird erstellt · ${Math.floor((Date.now() - started) / 1000)} Sekunden`); tick(); timer = setInterval(tick, 1000);
      let timeout;
      try {
        let output;
        if (central) output = await item.generate({ image: source, prompt, consent: true });
        else if (storedKey) output = await app[provider + 'EventGenerate']({ image: source, style: 'custom', resolution: item.resolution, prompt, consent: true });
        else {
          if (provider !== 'gemini') throw new Error('Bitte den Anbieter in der Desktop-App einrichten.');
          const key = q('key').value.trim();
          if (!/^[A-Za-z0-9_.-]{20,300}$/.test(key)) throw new Error(`Bitte einen gültigen ${label}-API-Schlüssel eingeben.`);
          timeout = setTimeout(() => controller.abort(), 120000);
          const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent', {
            method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `Bearbeite das bereitgestellte Gästefoto. Behalte die Anzahl der Personen, ihre erkennbaren Gesichter und ihre Identität bei. Keine zusätzliche Person, kein Schriftzug.  ${prompt}` }, { inlineData: { mimeType: 'image/jpeg', data: source.split(',')[1] } }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } })
          });
          if (!response.ok) throw new Error(({ 400: 'Google hat die Anfrage abgelehnt. Bitte Foto und Prompt prüfen.', 401: 'API-Schlüssel ungültig.', 403: 'Kein Zugriff auf Gemini. Bitte Schlüssel und Freischaltung prüfen.', 404: 'Das Bildmodell ist für dieses Projekt nicht verfügbar.', 429: 'Google-Kontingent erreicht. Bitte Abrechnung prüfen oder später erneut versuchen.' })[response.status] || 'Google ist momentan nicht verfügbar.');
          const data = await response.json();
          const image = data.candidates?.[0]?.content?.parts?.find(p => !p.thought && /^image\/(png|jpeg|webp)$/.test(p.inlineData?.mimeType) && p.inlineData?.data);
          if (!image) throw new Error('Google hat kein Bild geliefert. Bitte ein anderes Foto oder einen anderen Prompt versuchen.');
          if (image.inlineData.data.length > 20 * 1024 * 1024) throw new Error('Das Ergebnis ist zu groß für diese Vorschau.');
          output = { image: `data:${image.inlineData.mimeType};base64,${image.inlineData.data}` };
        }
        if (closed) return;
        q('result').src = output.image; await q('result').decode();
        q('result').hidden = false; q('empty').hidden = true;
        q('download').href = output.image; q('download').download = 'KI-Testbild.' + (output.image.startsWith('data:image/jpeg') ? 'jpg' : output.image.startsWith('data:image/webp') ? 'webp' : 'png'); q('download').hidden = false;
        status(`Fertig nach ${((Date.now() - started) / 1000).toFixed(1)} Sekunden. Du kannst den Prompt anpassen und erneut testen.`);
      } catch (e) {
        if (!closed) status(e.name === 'AbortError' ? 'Zeitlimit erreicht. Es wurde kein neuer Versuch gestartet. Bitte das Testfenster erneut öffnen.' : e instanceof TypeError ? 'KI-Dienst ist nicht erreichbar. Bitte Internet und Verbindung prüfen.' : e.message);
      } finally { clearTimeout(timeout); clearInterval(timer); busy = false; if (!closed) update(); }
    };
  } };
})(window);
