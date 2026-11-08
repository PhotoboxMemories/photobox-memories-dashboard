// Foto-Aufgaben für Gäste (Betreiber 08.11.2026): Vor dem Foto zeigt die Fotobox eine zufällige Aufgabe, z. B. „Zeigt euren besten
// Tanzschritt“. Jede Aufgabe ist eine Pose für das Foto (Betreiber: „nur Aufgaben, die mit Foto machen zu tun haben“). Dieselbe Datei liegt in der Fotobox (app-desktop/app) und im Dashboard. Die Texte werden über die Wörterbücher
// (lang/*.js) übersetzt – der deutsche Text ist der Schlüssel. Wer einen Text ändert, macht seine Übersetzung ungültig.
// Einstellungen im Ereignis unter x.tasks: on, cats (Kennungen unten), off (abgewählte fertige Aufgaben, deutscher Text),
// own (eigene Aufgaben, eine pro Zeile), every ('shot' = je Foto neu, 'session' = eine je Sitzung), read (Lesezeit in s), reroll, title.
(function (G) {
  'use strict';
  const CATS = [
    { id: 'hochzeit', name: 'Hochzeit', list: [
      'Mache ein Foto mit der Braut.',
      'Mache ein Foto mit dem Bräutigam.',
      'Fotografiere dich mit dem Brautpaar.',
      'Mache ein Foto mit jemandem, den du heute kennengelernt hast.',
      'Mache ein Foto mit drei Generationen.',
      'Fotografiere die lustigste Grimasse des Abends.',
      'Mache ein Foto mit mindestens fünf Gästen.',
      'Stelle mit jemandem eine romantische Filmszene nach.',
      'Mache ein Foto mit dem größten Lächeln.',
      'Fotografiere dich mit jemandem, der die gleiche Farbe trägt.',
      'Mache ein Foto mit den Trauzeugen.',
      'Stelle einen Heiratsantrag nach.',
      'Mache ein Foto mit einer lustigen Fotobox-Requisite.',
      'Fotografiere dich mit dem ältesten Hochzeitsgast.',
      'Mache ein Foto mit dem jüngsten Hochzeitsgast.',
      'Mache ein Foto mit jemandem, der besonders gut tanzt.',
      'Stelle mit Freunden eine Boyband oder Girlgroup nach.',
      'Mache ein Foto, auf dem alle überrascht schauen.',
      'Mache ein Foto mit einem Herz aus euren Händen.',
      'Fotografiere dich mit jemandem aus der Familie des Brautpaares.',
      'Mache ein Foto mit drei Personen, die du vorher nicht kanntest.',
      'Mache ein Foto wie auf dem roten Teppich.',
      'Mache ein Foto, auf dem alle gleichzeitig springen.',
      'Stelle eine verrückte Hochzeitspose nach.',
      'Mache ein Foto mit jemandem, der schon verheiratet ist.',
      'Mache ein Foto mit deinem Lieblingsmenschen.',
      'Fotografiere die eleganteste Pose des Abends.',
      'Mache ein Foto, auf dem alle einen Kussmund machen.',
      'Mache ein Foto mit möglichst vielen Requisiten.',
      'Mache ein Gruppenfoto, das das Brautpaar niemals vergessen wird.'
    ] },
    { id: 'geburtstag', name: 'Geburtstag', list: [
      'Posiert, als würdet ihr gemeinsam die Kerzen auspusten',
      'Zeigt mit den Fingern das Alter des Geburtstagskindes',
      'Posiert, als würdet ihr laut „Happy Birthday“ singen',
      'Tut so, als würdet ihr ein riesiges Geschenk auspacken',
      'Zeigt, wie das Geburtstagskind als Baby aussah',
      'Macht euer verrücktestes Partygesicht',
      'Posiert, als wärt ihr wieder 18',
      'Zeigt, wie ihr in 30 Jahren aussehen werdet',
      'Macht ein Foto wie auf einer Geburtstagskarte',
      'Jubelt mit erhobenen Armen in die Kamera'
    ] },
    { id: 'firma', name: 'Firmenfeier', list: [
      'Jubelt, als hättet ihr gerade das beste Quartal geschafft',
      'Stellt ein langweiliges Meeting nach',
      'Macht ein Foto wie auf dem Titelblatt eines Wirtschaftsmagazins',
      'Zeigt euer bestes Teamwork',
      'Tut so, als hättet ihr gerade eine Gehaltserhöhung bekommen',
      'Macht ein Foto mit jemandem aus einer anderen Abteilung',
      'Zeigt, wie ihr montagmorgens ins Büro kommt',
      'Zeigt, wie ihr freitagnachmittags aus dem Büro geht',
      'Posiert, als würdet ihr gerade eure beste Idee präsentieren',
      'Posiert wie der Vorstand auf dem Firmenfoto'
    ] },
    { id: 'party', name: 'Party & Allgemein', list: [
      'Macht das lustigste Gesicht',
      'Posiert so cool wie Rockstars',
      'Posiert wie Superhelden',
      'Stellt eine berühmte Filmszene nach',
      'Schaut erschrocken, als stünde ein Geist hinter euch',
      'Macht ein Foto wie auf einem Albumcover',
      'Zeigt eure Muskeln',
      'Lacht herzhaft in die Kamera',
      'Posiert wie euer Lieblingstier',
      'Posiert, als würdet ihr gerade fliegen',
      'Posiert wie Statuen im Museum',
      'Tauscht für das Foto Brille, Hut oder Jacke'
    ] }
  ];
  // Alle Aufgaben, aus denen die Fotobox zieht: angehakte Gruppen ohne abgewählte Aufgaben, dazu die eigenen (eine pro Zeile).
  // own: true kennzeichnet eigene Aufgaben – die werden nicht übersetzt.
  function pool(t) {
    t = t || {};
    const cats = Array.isArray(t.cats) ? t.cats : ['hochzeit'], off = new Set(Array.isArray(t.off) ? t.off : []);
    const list = [];
    for (const c of CATS) if (cats.includes(c.id)) for (const s of c.list) if (!off.has(s)) list.push({ text: s, own: false });
    for (const line of String(t.own || '').split('\n')) { const s = line.trim().slice(0, 160); if (s) list.push({ text: s, own: true }); }
    return list;
  }
  G.FOTO_AUFGABEN = { CATS, pool };
})(typeof window !== 'undefined' ? window : globalThis);
