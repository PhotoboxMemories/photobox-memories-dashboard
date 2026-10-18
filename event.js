// Photobox Memories – Event-Arbeitsbereich (Aufbau wie bei LumaBooth: Seitenleiste mit allen Bereichen)
// EventWS.open(eventRow, { sb, me, admin, toast, uploadFile(file) → url, devices, leadsCount, onClose, onDelete })
(function (G) {
  'use strict';
  // KI-Stil-Bibliothek (Aufbau wie bei LumaBooth): ein Stil = Motiv („Porträtstil“) und/oder Kunststil.
  // Beispielbilder liegen optional unter ai-styles/<key>.jpg; ohne Bild erscheint die farbige Kachel.
  const AI_KEEP = 'Bearbeite das Gästefoto. Behalte die Anzahl der Personen, ihre erkennbaren Gesichter, Frisuren und ihre Pose bei. Keine zusätzliche Person, kein Schriftzug. ';
  const aiGroup = (kind, list) => list.flatMap(([cat, colors, items]) => items.map(([key, name, icon, text]) => ({ kind, cat, colors, key, name, icon, text })));
  const AI_MOTIFS = aiGroup('p', [
    ['Film & Bühne', '#2b1055,#d53369', [
      ['hollywood', 'Roter Teppich', '🎬', 'Motiv: elegante Abendgarderobe wie bei einer Filmpremiere. Szene: roter Teppich mit Scheinwerfern und goldenem Licht.'],
      ['noir', 'Detektiv', '🕵️', 'Motiv: Trenchcoat und Hut wie in einem Detektivfilm der 1940er. Szene: verrauchtes Büro mit Jalousien-Schatten.'],
      ['action', 'Actionheld', '💥', 'Motiv: taktische Einsatzkleidung wie Actionfilm-Helden. Szene: Großstadt mit Explosion im Hintergrund.'],
      ['agent', 'Geheimagent', '🕶️', 'Motiv: maßgeschneiderter Smoking beziehungsweise elegantes Abendkleid wie Geheimagenten. Szene: nächtliches Casino an der Küste.'],
      ['western', 'Wilder Westen', '🤠', 'Motiv: Cowboyhut, Weste und Stiefel. Szene: staubige Hauptstraße einer Westernstadt bei Sonnenuntergang.'],
      ['musical', 'Musicalstar', '🎤', 'Motiv: glitzernde Bühnenkostüme. Szene: große Showbühne mit buntem Scheinwerferlicht.']]],
    ['Helden & Fantasy', '#1e3c72,#e63946', [
      ['hero', 'Superheld', '🦸', 'Motiv: originelle Superhelden-Kostüme mit Umhang. Szene: Dach über einer nächtlichen Großstadt, dramatisches Gegenlicht.'],
      ['fantasy', 'Fantasyreich', '🧝', 'Motiv: edle Gewänder und Rüstungen eines Fantasyreichs. Szene: verzauberter Wald mit leuchtenden Lichtern.'],
      ['pirate', 'Pirat', '🏴‍☠️', 'Motiv: Piratenkleidung mit Dreispitz. Szene: Deck eines Segelschiffs auf stürmischer See.'],
      ['viking', 'Wikinger', '🪓', 'Motiv: Wikingerkleidung mit Fell und Leder. Szene: Langschiff in einem nebligen Fjord.'],
      ['dragon', 'Drachenreiter', '🐉', 'Motiv: Lederrüstung eines Drachenreiters, ein freundlicher Drache im Hintergrund. Szene: Berggipfel über den Wolken.'],
      ['steampunk', 'Steampunk', '⚙️', 'Motiv: viktorianische Kleidung mit Messingbrillen und Zahnrädern. Szene: Werkstatt voller Dampfmaschinen.'],
      ['cyber', 'Cyberpunk', '🌃', 'Motiv: futuristische Kleidung mit leuchtenden Details. Szene: regennasse Straße mit Neonreklamen bei Nacht.'],
      ['scifi', 'Science-Fiction', '🚀', 'Motiv: schimmernde Raumfahrer-Uniformen. Szene: Brücke eines Raumschiffs mit Blick auf eine Galaxie.']]],
    ['Zeitreise', '#5b3a1e,#c79a4b', [
      ['egypt', 'Altes Ägypten', '🏺', 'Motiv: Gewänder und Goldschmuck des alten Ägypten. Szene: Tempel mit Hieroglyphen und Fackellicht.'],
      ['greek', 'Antikes Griechenland', '🏛️', 'Motiv: weiße Gewänder mit Lorbeerkranz. Szene: Marmortempel über dem Meer.'],
      ['rome', 'Römisches Reich', '🛡️', 'Motiv: römische Toga beziehungsweise Legionärsrüstung. Szene: Forum mit Säulen im warmen Abendlicht.'],
      ['knight', 'Ritter', '⚔️', 'Motiv: glänzende Ritterrüstung beziehungsweise mittelalterliches Kleid. Szene: Burghof mit Bannern.'],
      ['samurai', 'Samurai', '🎎', 'Motiv: traditionelle Samurai-Rüstung beziehungsweise Kimono. Szene: Garten mit Kirschblüten und Pagode.'],
      ['royal', 'Königshof', '👑', 'Motiv: prunkvolle königliche Gewänder und Kronen. Szene: Thronsaal eines Schlosses.'],
      ['twenties', 'Goldene Zwanziger', '🎩', 'Motiv: elegante Abendmode der 1920er-Jahre. Szene: Art-déco-Ballsaal mit goldenem Licht.'],
      ['disco', '70er-Disco', '🪩', 'Motiv: Schlaghosen und Glitzeroutfits der 1970er. Szene: Tanzfläche unter einer Discokugel.'],
      ['eighties', '80er-Jahre', '📼', 'Motiv: bunte Mode der 1980er mit Neonfarben. Szene: Spielhalle mit Neonlicht.']]],
    ['Reise', '#0f9b8e,#f9d423', [
      ['paris', 'Paris', '🗼', 'Motiv: schicke Stadtkleidung. Szene: Pariser Straße mit Blick auf den Eiffelturm am Abend.'],
      ['newyork', 'New York', '🗽', 'Motiv: moderne Stadtkleidung. Szene: Dachterrasse mit Skyline von New York bei Sonnenuntergang.'],
      ['venice', 'Venedig', '🛶', 'Motiv: elegante Sommerkleidung. Szene: Gondel auf einem Kanal in Venedig.'],
      ['hawaii', 'Südsee', '🌺', 'Motiv: Blumenhemden und Blumenketten. Szene: Palmenstrand mit türkisfarbenem Wasser.'],
      ['safari', 'Safari', '🦁', 'Motiv: Safarikleidung mit Hut. Szene: Savanne mit Elefanten und Akazien im Abendlicht.'],
      ['alps', 'Alpen', '🏔️', 'Motiv: Wanderkleidung. Szene: Berggipfel mit Alpenpanorama und blauem Himmel.'],
      ['santorini', 'Santorin', '🏖️', 'Motiv: helle Leinenkleidung. Szene: weiße Häuser mit blauen Kuppeln über dem Meer.'],
      ['tokyo', 'Tokio', '🏮', 'Motiv: moderne Streetwear. Szene: belebte Straße in Tokio mit Leuchtreklamen.']]],
    ['Sport', '#11998e,#38ef7d', [
      ['soccer', 'Fußball', '⚽', 'Motiv: Fußballtrikots ohne Vereinslogo. Szene: Stadion mit Flutlicht und jubelndem Publikum.'],
      ['basketball', 'Basketball', '🏀', 'Motiv: Basketballtrikots ohne Vereinslogo. Szene: Halle mit Scheinwerfern.'],
      ['boxing', 'Boxen', '🥊', 'Motiv: Boxkleidung mit Handschuhen. Szene: Boxring im Scheinwerferlicht.'],
      ['tennis', 'Tennis', '🎾', 'Motiv: weiße Tenniskleidung mit Schläger. Szene: Rasenplatz in einem großen Stadion.'],
      ['ski', 'Wintersport', '⛷️', 'Motiv: bunte Skikleidung mit Skibrille. Szene: verschneite Piste bei Sonnenschein.'],
      ['racing', 'Rennfahrer', '🏎️', 'Motiv: Rennoveralls ohne Markenlogo. Szene: Boxengasse einer Rennstrecke.']]],
    ['Feste', '#c31432,#f7b733', [
      ['winter', 'Winterzauber', '❄️', 'Motiv: warme, festliche Winterkleidung. Szene: verschneiter Tannenwald mit Lichterketten und sanftem Schneefall.'],
      ['christmas', 'Weihnachten', '🎄', 'Motiv: gemütliche Weihnachtspullover. Szene: Wohnzimmer mit geschmücktem Baum und Kaminfeuer.'],
      ['halloween', 'Halloween', '🎃', 'Motiv: fantasievolle Halloween-Kostüme. Szene: nebliger Garten mit Kürbislaternen.'],
      ['newyear', 'Silvester', '🎆', 'Motiv: glitzernde Partykleidung. Szene: Dachterrasse mit Feuerwerk über der Stadt.'],
      ['carnival', 'Karneval', '🎭', 'Motiv: bunte Karnevalskostüme mit Masken. Szene: Straßenumzug mit Konfetti.'],
      ['oktoberfest', 'Oktoberfest', '🥨', 'Motiv: Dirndl und Lederhose. Szene: festlich geschmücktes Bierzelt.'],
      ['summer', 'Sommerparty', '🍹', 'Motiv: leichte Sommerkleidung. Szene: Strandbar mit Lichterketten bei Sonnenuntergang.']]],
    ['Berufe', '#0b1026,#3a6ea5', [
      ['astronaut', 'Astronaut', '🧑‍🚀', 'Motiv: realistische weiße Raumanzüge, Helm unter dem Arm. Szene: Raumstation mit Blick auf die Erde.'],
      ['chef', 'Sternekoch', '👨‍🍳', 'Motiv: weiße Kochjacken und Kochmützen. Szene: moderne Restaurantküche.'],
      ['pilot', 'Pilot', '✈️', 'Motiv: Pilotenuniformen. Szene: Cockpit mit Blick über die Wolken.'],
      ['firefighter', 'Feuerwehr', '🚒', 'Motiv: Feuerwehr-Einsatzkleidung mit Helm. Szene: Feuerwache mit Löschfahrzeug.'],
      ['scientist', 'Wissenschaft', '🔬', 'Motiv: weiße Laborkittel und Schutzbrillen. Szene: modernes Labor mit bunten Flüssigkeiten.'],
      ['dj', 'DJ', '🎧', 'Motiv: lässige Clubkleidung mit Kopfhörern. Szene: DJ-Pult vor einer feiernden Menge.']]]
  ]);
  const AI_ARTS = aiGroup('a', [
    ['Alte Meister', '#3e2723,#bf8f4a', [
      ['oil', 'Ölgemälde', '🖼️', 'elegantes klassisches Ölgemälde mit sichtbaren Pinselstrichen und warmem Licht.'],
      ['renaissance', 'Renaissance', '🏰', 'Gemälde im Stil der italienischen Renaissance mit feinen Details und sanftem Licht.'],
      ['impression', 'Impressionismus', '🌼', 'impressionistisches Gemälde mit lockeren, leuchtenden Farbtupfern.'],
      ['swirl', 'Wirbelnder Pinselstrich', '🌌', 'postimpressionistisches Gemälde mit wirbelnden, kräftigen Pinselstrichen.'],
      ['artdeco', 'Art déco', '💎', 'Art-déco-Plakat mit geometrischen Ornamenten, Gold und Schwarz.'],
      ['ukiyo', 'Japanischer Holzschnitt', '🌊', 'japanischer Farbholzschnitt mit klaren Linien und flächigen Farben.']]],
    ['Comic & Trickfilm', '#ffd400,#ff5a36', [
      ['comic', 'Comic', '💬', 'farbiger Comic mit klaren schwarzen Konturen, kräftigen Farben und Rasterpunkten.'],
      ['popart', 'Pop-Art', '🟡', 'Pop-Art-Siebdruck mit knalligen Kontrastfarben.'],
      ['anime', 'Anime', '🌸', 'detailreiche Anime-Illustration mit großen ausdrucksstarken Augen und weichen Farbverläufen.'],
      ['toon3d', '3D-Trickfilm', '🎞️', 'liebevoll gestaltete 3D-Animationsfilm-Figuren mit weicher Beleuchtung.'],
      ['pulp', 'Retro-Comic', '📰', 'Retro-Comic der 1950er auf vergilbtem Papier mit grobem Druckraster.'],
      ['chibi', 'Chibi-Figur', '🧸', 'niedliche Chibi-Figuren mit großen Köpfen und kleinen Körpern.']]],
    ['Zeichnen & Malen', '#a1c4fd,#fbc2eb', [
      ['watercolor', 'Aquarell', '🎨', 'zartes Aquarell auf strukturiertem Papier mit fließenden Farbrändern.'],
      ['sketch', 'Bleistift', '✏️', 'feine Bleistiftzeichnung mit detaillierter Schraffur, schwarz-weiß.'],
      ['charcoal', 'Kohle', '🖤', 'ausdrucksstarke Kohlezeichnung mit weichen Schatten, schwarz-weiß.'],
      ['lineart', 'Strichzeichnung', '〰️', 'minimalistische schwarze Strichzeichnung auf weißem Grund.'],
      ['glass', 'Buntglas', '🪟', 'leuchtendes Buntglasfenster mit dunklen Bleistegen.'],
      ['mosaic', 'Mosaik', '🧩', 'Mosaik aus kleinen farbigen Steinchen.']]],
    ['Trend', '#12002b,#ff2bd6', [
      ['graffiti', 'Graffiti', '🧱', 'Street-Art-Graffiti auf einer Ziegelwand mit Sprühfarben.'],
      ['neon', 'Neon', '💡', 'leuchtende Neonlinien auf dunklem Hintergrund.'],
      ['vaporwave', 'Vaporwave', '🌴', 'Vaporwave-Ästhetik mit Pastell-Pink, Türkis und Sonnenuntergangsraster.'],
      ['lowpoly', 'Low Poly', '🔺', 'Low-Poly-Grafik aus kantigen farbigen Flächen.'],
      ['brick', 'Klötzchenfigur', '🧱', 'Spielzeugfiguren aus Kunststoff-Bausteinen in einer Bausteinwelt, ohne Markenlogo.'],
      ['bobble', 'Wackelkopf', '🙂', 'Wackelkopf-Sammelfiguren mit übergroßen Köpfen auf einem Sockel.'],
      ['pastel', 'Pastell-Kawaii', '🍬', 'niedlicher Kawaii-Stil in zarten Pastellfarben mit Sternchen und Herzen.']]]
  ]);
  const aiFind = (list, key) => list.find(x => x.key === key) || null;
  // Stil-ID „lib-<motiv>--<kunst>“ hält fest, aus welchen Bausteinen ein Stil stammt (für Kachelbild und Bearbeiten).
  const aiParts = id => { const m = /^lib-([a-z0-9]*)--([a-z0-9]*)$/.exec(id || ''); return m ? { p: aiFind(AI_MOTIFS, m[1]), a: aiFind(AI_ARTS, m[2]) } : { p: null, a: null }; };
  const aiCompose = (pp, aa) => ({ id: 'lib-' + (pp?.key || '') + '--' + (aa?.key || ''), name: [pp?.name, aa?.name].filter(Boolean).join(' · '),
    prompt: AI_KEEP + (pp ? pp.text + ' ' : '') + 'Bildstil: ' + (aa ? aa.text : 'fotorealistisches, hochwertiges Porträtfoto.') });
  // Beispiele für den benutzerdefinierten Prompt: fertige Kombinationen aus der Bibliothek als Startpunkt
  let aiExamplesCache; const aiExamples = () => aiExamplesCache ||= [[0, 0], [5, 3], [12, 7], [20, 11], [31, 16], [44, 21]].map(([m, a]) => aiCompose(AI_MOTIFS[m], AI_ARTS[a]));
  const aiTile = x => x ? `<span class="pic" style="background:linear-gradient(135deg,${x.colors})">${x.icon}<img src="ai-styles/${x.key}.jpg" alt="" loading="lazy" onerror="this.remove()"></span>`
    : '<span class="pic" style="background:linear-gradient(135deg,#F7C838,#ff9f43)">✨</span>';
  const aiPic = (id, thumb) => { const { p, a } = aiParts(id), x = p || a;
    if (!thumb) return aiTile(x);
    return `<span class="pic" style="background:linear-gradient(135deg,${x ? x.colors : '#F7C838,#ff9f43'})">${x ? x.icon : '✨'}<img src="${thumb.replace(/"/g, '&quot;')}" alt="" loading="lazy" onerror="this.remove()"></span>`; };
  const CSS = `
  #ws{--y:#F7C838;--ink:#1D1D1B;--line:#e7e7ee;--muted:#6b6b78;--soft:#f6f6f9;--shadow:0 1px 2px rgba(16,16,24,.04);position:fixed;inset:0;z-index:40;background:#f5f5f7;color:#1d1d24;display:flex;flex-direction:column;font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  #ws *{box-sizing:border-box}
  #ws .wtop{height:58px;background:#1D1D1B;color:#fff;display:flex;align-items:center;gap:14px;padding:0 18px;flex:none}
  #ws .wtop .logo{font-weight:800;font-size:19px}#ws .wtop .logo span{color:#F7C838}
  #ws .wtop .en{font-weight:600;opacity:.9}
  #ws .wtop .st{font-size:12px;opacity:.7}
  #ws .tb{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:8px;padding:7px 12px;cursor:pointer;font:inherit}
  #ws .sp{flex:1}
  #ws .wbody{flex:1;display:flex;min-height:0}
  #ws nav.side{display:block;width:250px;background:#fff;border-right:1px solid #e6e6ec;overflow:auto;padding:12px 0;flex:none}
  #ws nav.side .back{display:flex;align-items:center;gap:4px;margin:0 10px 6px;padding:8px 10px;border-radius:10px;color:#555;cursor:pointer;font-size:13px}
  #ws nav.side .back:hover{background:var(--soft);color:var(--ink)}
  #ws nav.side h6{margin:20px 20px 6px;font-size:11px;font-weight:700;letter-spacing:.09em;color:#9a9aa6;text-transform:uppercase}
  #ws nav.side a{display:flex;gap:10px;align-items:center;margin:1px 10px;padding:9px 10px;border-radius:10px;color:#3a3a44;cursor:pointer;text-decoration:none}
  #ws nav.side a:hover{background:#FFFAEA;color:var(--ink)}
  #ws nav.side a.on{background:#FFF3C4;color:var(--ink);font-weight:600;box-shadow:inset 3px 0 0 var(--y)}
  #ws main.wm{flex:1;overflow:auto;padding:28px 36px 80px}
  /* Inhalt mittig: Seiten mit Vorschau oder Übersicht breit, reine Einstellungsseiten als eine ruhige Spalte */
  #ws .wpage{max-width:1100px;margin:0 auto}
  #ws .wpage:not(:has(.cols,.aigrid,.dcards,.charts,table.shares)){max-width:720px}
  #ws h1,#ws h2,#wsModal h3,#ws .wtop .en{font-family:Fredoka,system-ui,sans-serif}
  #ws .ico-svg{vertical-align:-4px;flex:none}
  #ws h1{font-size:26px;margin:0 0 18px;display:flex;align-items:center;gap:12px;letter-spacing:.01em}
  #ws h2{font-size:16px;margin:28px 0 10px;display:flex;align-items:center;gap:10px}
  #ws .wpage>h1:not(:first-child){font-size:20px;margin-top:34px} /* weitere Abschnitte einer Seite (z. B. E-Mail, SMS) */
  #ws .card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 22px;box-shadow:var(--shadow);margin-bottom:16px}
  #ws .cols{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap}
  #ws .cols>.left{flex:1;min-width:340px}
  #ws .pv{width:360px;flex:none;position:sticky;top:0}
  #ws .pv .frame{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:var(--shadow)}
  #ws .pv canvas{width:100%;display:block;border-radius:8px;background:#eee}
  #ws .tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:18px}
  #ws .tabs button{background:none;border:0;padding:10px 14px;cursor:pointer;font:inherit;font-weight:500;color:#5a5a66;border-bottom:3px solid transparent;margin-bottom:-1px}
  #ws .tabs button:hover{color:var(--ink)}
  #ws .tabs button.on{color:var(--ink);border-color:var(--y);font-weight:700}
  #ws label.l{display:block;font-size:12.5px;font-weight:600;color:#4b4b57;margin:14px 0 6px}
  #ws input[type=text],#ws input[type=number],#ws input[type=date],#ws input[type=email],#ws input[type=password],#ws select,#ws textarea{width:100%;border:1px solid #dfdfe7;border-radius:10px;padding:9px 12px;font:inherit;background:#fff;color:#1d1d24;transition:border-color .15s,box-shadow .15s}
  #ws input[type=text],#ws input[type=number],#ws input[type=date],#ws input[type=email],#ws input[type=password],#ws select{min-height:40px}
  #ws input:focus,#ws select:focus,#ws textarea:focus{outline:0;border-color:var(--y);box-shadow:0 0 0 3px rgba(247,200,56,.28)}
  #ws input[type=color]{width:52px;height:38px;border:1px solid #dfdfe7;border-radius:10px;padding:3px;background:#fff}
  #ws .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  #ws .between{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:12px 0}
  #ws .between>div:first-child{font-weight:500}
  #ws .between small{display:block;color:var(--muted);font-size:12.5px;font-weight:400;margin-top:2px}
  #ws .card .between+.between{border-top:1px solid #f0f0f4}
  #ws .card>.between:first-child{padding-top:2px}
  #ws .sw{position:relative;width:42px;height:24px;flex:none;cursor:pointer}
  #ws .sw input{display:none}
  #ws .sw i{position:absolute;inset:0;background:#cfcfd8;border-radius:12px;transition:.15s}
  #ws .sw i:after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.15s}
  #ws .sw input:checked+i{background:#F7C838}#ws .sw input:checked+i:after{left:21px}
  #ws .swl{font-size:12px;color:#666;min-width:22px}
  #ws .slider{display:grid;grid-template-columns:1fr 64px 26px;gap:10px;align-items:center}
  #ws .slider input[type=range]{accent-color:#F7C838;width:100%}
  #ws .btn{border:2px solid var(--y);color:var(--ink);background:#fff;border-radius:999px;padding:8px 18px;cursor:pointer;font:inherit;font-weight:600;display:inline-flex;align-items:center;gap:6px;transition:background .15s,filter .15s}
  #ws .btn:hover{background:#FFF8DD}
  #ws .btn.pri{background:var(--y);color:var(--ink)}#ws .btn.pri:hover{filter:brightness(.97)}
  #ws .btn.sm{padding:5px 12px;font-size:13px}
  #ws .ghost{border:1px solid #dfdfe7;background:#fff;border-radius:10px;padding:8px 14px;cursor:pointer;font:inherit;font-weight:500;display:inline-flex;align-items:center;gap:6px;transition:border-color .15s}
  #ws .ghost:hover{border-color:var(--y)}
  #ws .lays{display:flex;gap:12px;flex-wrap:wrap;margin:14px 0}
  #ws .lay{width:150px;border:2px solid #eee;border-radius:10px;padding:8px;background:#fafafc;cursor:pointer;position:relative}
  #ws .lay:hover{border-color:#F7C838}
  #ws .lay img{width:100%;height:150px;object-fit:contain;display:block}
  #ws .lay .nm{font-size:12px;margin-top:6px;color:#444;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ws .lay .acts{position:absolute;top:4px;right:4px;display:flex;gap:2px}
  #ws .lay.on{border-color:#F7C838;background:#FFF8DD} #ws .lay.drop{outline:2px dashed #F7C838}
  #ws .lay .grip{position:absolute;top:4px;left:6px;cursor:grab;color:#777;font-size:14px;letter-spacing:-2px;background:#fff;border-radius:6px;padding:0 5px;border:1px solid #ddd}
  #ws .lay .acts button{background:#fff;border:1px solid #ddd;border-radius:6px;cursor:pointer;padding:2px 6px;font-size:12px}
  #ws .empty{border:1px dashed #d0d0da;border-radius:10px;padding:26px;text-align:center;color:#888;background:#fafafc}
  #ws .dd{position:relative;display:inline-block}
  #ws .dd .menu{position:absolute;top:110%;left:0;background:#fff;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.15);padding:6px;min-width:190px;z-index:5}
  #ws .dd .menu button{display:block;width:100%;text-align:left;background:none;border:0;padding:9px 12px;border-radius:6px;cursor:pointer;font:inherit}
  #ws .dd .menu button:hover{background:#FFF3C4}
  #ws .modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:10px;margin-bottom:18px}
  #ws .mode{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px 8px 12px;border-radius:14px;background:#fff;border:1px solid var(--line);cursor:pointer;box-shadow:var(--shadow);font-weight:600;font-size:13px;text-align:center;line-height:1.25;transition:border-color .15s}
  #ws .mode:hover{border-color:var(--y)}
  #ws .mode.on{background:var(--ink);color:var(--y);border-color:var(--ink)}
  #ws .mode .ic{font-size:22px;line-height:0}#ws .mode .dot{position:absolute;top:10px;right:10px;width:9px;height:9px;border-radius:50%;background:#ccc}
  #ws .mode .dot.a{background:#30c46b}
  #ws .filters{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  #ws .flt{position:relative;border-radius:10px;overflow:hidden;cursor:pointer;border:3px solid transparent}
  #ws .flt.on{border-color:#F7C838}
  #ws .flt img{width:100%;display:block;aspect-ratio:1}
  #ws .flt span{position:absolute;left:0;right:0;bottom:0;padding:4px 6px;color:#fff;font-size:12px;background:linear-gradient(transparent,rgba(0,0,0,.6))}
  #ws .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;max-width:900px}
  #ws .gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin-top:14px}
  #ws .gal figure{margin:0;position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#ececf1;cursor:zoom-in}
  #ws .gal img{width:100%;height:100%;object-fit:cover;display:block}
  #ws .gal .tag{position:absolute;left:6px;bottom:6px;background:rgba(0,0,0,.65);color:#fff;font-size:11px;border-radius:6px;padding:2px 6px}
  #ws .linkbox{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}
  #ws .linkbox input{flex:1;min-width:220px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px}
  #wsLight{position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px}
  #wsLight img,#wsLight video{max-width:94vw;max-height:78vh;border-radius:8px;background:#000}
  #wsLight .bar{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
  #wsLight button{background:#fff;border:0;border-radius:999px;padding:10px 18px;font:600 14px system-ui,sans-serif;cursor:pointer}
  #wsLight .nav{position:absolute;top:50%;transform:translateY(-50%);width:52px;height:52px;border-radius:50%;padding:0;font-size:24px}
  #wsLight .nav.l{left:14px}#wsLight .nav.r{right:14px}
  #ws .stat{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;text-align:center;box-shadow:var(--shadow)}
  /* Übersicht eines Ereignisses im LumaBooth-Aufbau: Name und Datum, drei Karten, Symbolleiste, Galerie */
  #ws .evhead{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:-4px 0 14px}
  #ws .evhead input{border:0;background:transparent;font:600 18px system-ui,sans-serif;padding:4px 6px;border-radius:8px;min-width:0;width:auto;color:#1D1D1B}
  #ws .evhead input:hover,#ws .evhead input:focus{background:#fff;outline:0;box-shadow:0 0 0 2px #F9CB38}
  #ws .evhead .sep{width:1px;height:26px;background:#bbb}
  #ws .dcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;max-width:1120px}
  #ws .dcard{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px;box-shadow:var(--shadow);min-width:0}
  #ws .dcard .nums{display:flex;justify-content:space-around;gap:10px;text-align:center}
  #ws .dcard .nums span{font-size:13px;color:#333}#ws .dcard .nums b{display:block;font-size:24px;font-weight:600;margin-top:4px}
  #ws .dcard .foot{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:13px;color:#555}
  #ws .dcard .more{background:none;border:0;padding:0;font:600 13px system-ui,sans-serif;color:#1D1D1B;cursor:pointer;border-bottom:2px solid #F9CB38}
  #ws .dcard .between{padding:2px 0 6px}
  #ws .dcards.split{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:auto auto 1fr;align-items:start} /* links Zahlen und Fotoboxen untereinander, rechts die Galerie */
  #ws .between>.row{flex-wrap:nowrap;flex:none}
  #ws .dcard.share{grid-column:2;grid-row:1 / span 3}
  #ws .dcard.boxes .between{padding:9px 0;border-top:1px solid #f0f0f4}#ws .dcard.boxes .dt+.between{border-top:0}
  #ws .dcard.boxes p{font-size:13px;margin:4px 0 0}
  #ws .dcard .dt{display:block;font:600 17px Fredoka,system-ui,sans-serif;margin-bottom:4px}
  #ws .dcard.share .between{padding:11px 0;border-top:1px solid #f0f0f4}
  #ws .dcard.share .dt+.between{border-top:0;padding-top:6px}
  #ws .dcard.share .linkbox{margin:0 0 10px}
  #ws .dcard.share .pw{border-top:1px solid #f0f0f4;padding-top:2px}
  #ws .dcard.share .pw label.l{margin-top:12px}
  #ws .dcard.share .pw small{display:block;color:var(--muted);font-size:12.5px;margin-top:6px}
  #ws .dcard .linkbox{margin-top:4px;flex-wrap:nowrap}#ws .dcard .linkbox input{min-width:0;background:#f4f4f6;border:0;font-size:12px}
  #ws .dacts{display:flex;gap:8px 30px;flex-wrap:wrap;margin:18px 0 6px;max-width:1120px;justify-content:center;border-bottom:1px solid #cfcfd6;padding-bottom:14px}
  #ws .dacts button{background:none;border:0;display:flex;flex-direction:column;align-items:center;gap:6px;font:500 13px system-ui,sans-serif;cursor:pointer;color:#1D1D1B;padding:6px 4px;border-radius:10px;min-width:74px}
  #ws .dacts button:hover{background:#fff}#ws .dacts button:disabled{opacity:.35;cursor:default;background:none}
  #ws .dempty{text-align:center;color:#8a8a92;font-size:20px;line-height:1.5;padding:26px 10px;max-width:1120px}
  #ws .gal.wide{max-width:1120px}
  #ws .embed{max-width:1120px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 18px;margin-top:12px;box-shadow:var(--shadow)}
  #ws .embed textarea{width:100%;font:12px ui-monospace,Menlo,Consolas,monospace;margin-top:8px}
  #ws .backl{background:none;border:0;padding:0;font:500 14px system-ui,sans-serif;cursor:pointer;color:#1D1D1B;display:inline-flex;align-items:center;gap:4px;margin-bottom:10px}
  #ws .charts{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;max-width:1120px}
  #ws .chart{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px;box-shadow:var(--shadow)}
  #ws .chart h3{margin:0 0 12px;font-size:15px}
  #ws .bars{display:flex;align-items:flex-end;gap:3px;height:150px}
  #ws .bars i{flex:1;background:#F9CB38;border-radius:3px 3px 0 0;min-height:2px;position:relative}
  #ws .bars i[title]:hover{background:#1D1D1B}
  #ws .axis{display:flex;justify-content:space-between;font-size:11px;color:#777;margin-top:4px}
  #ws .hbar{display:grid;grid-template-columns:90px 1fr 46px;gap:8px;align-items:center;font-size:13px;margin:7px 0}
  #ws .hbar i{display:block;height:14px;background:#F9CB38;border-radius:7px;min-width:2px}
  #ws table.shares{width:100%;max-width:1120px;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow)}
  #ws table.shares th,#ws table.shares td{text-align:left;padding:9px 14px;font-size:13px;border-bottom:1px solid #eee}
  #ws table.shares th{background:#fafafa;font-weight:600}
  #ws .stat b{display:block;font-size:26px}
  #ws .grid3x{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:6px}
  #ws .soon{display:inline-block;font-size:11px;background:#FFF3C4;color:#8a6400;border-radius:999px;padding:2px 8px;margin-left:6px;font-weight:600}
  #ws .thumbs{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  #ws .pic{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;border-radius:12px;font-size:44px;aspect-ratio:3/4;width:100%}
  #ws .pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  #ws .aitiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px;margin-top:12px}
  #ws .aitiles button{position:relative;border:2px solid transparent;background:none;border-radius:14px;padding:0;cursor:pointer;font:inherit;display:flex;flex-direction:column;gap:6px;align-items:center;color:inherit}
  #ws .aitiles button b{font-size:13px;padding:0 4px 6px;text-align:center}
  #ws .aitiles button.on{border-color:#F7C838;background:#fffbea}
  #ws .aitiles button:hover .pic{filter:brightness(1.08)}
  #ws .aitiles .fav{position:absolute;top:6px;right:38px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.6);color:#F7C838;display:flex;align-items:center;justify-content:center;font-size:14px}
  #ws .aitiles .fav.on{background:#F7C838;color:#1D1D1B}
  #ws .aitiles .del{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px}
  #ws .aislots{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0}
  @media(max-width:700px){#ws .aislots{grid-template-columns:1fr}}
  #ws .aislot{border:2px dashed #cfcfd8;background:#fafafc;border-radius:12px;padding:10px;min-height:76px;cursor:pointer;font:inherit;display:flex;align-items:center;gap:10px;text-align:left;color:inherit}
  #ws .aislot.set{border-style:solid;border-color:#F7C838;background:#fffbea}
  #ws .aislot .pic{width:46px;font-size:22px;flex:none;border-radius:8px}
  #ws .aislot small{display:block;color:#6b6b78;font-size:12px}
  #ws .aislot .x{margin-left:auto;color:#6b6b78;padding:4px 8px}
  #ws .aimodal{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}
  #ws .aimodal>div{background:#fff;border-radius:16px;width:min(900px,100%);max-height:92vh;display:flex;flex-direction:column;overflow:hidden}
  #ws .aimodal .mh{display:flex;gap:12px;align-items:center;padding:16px 18px;border-bottom:1px solid #eeeef2}
  #ws .aimodal .mh b{font-size:18px;flex:1}
  #ws .aimodal .mh input{width:200px}
  #ws .aichips{display:flex;gap:6px;flex-wrap:wrap;padding:12px 18px 0}
  #ws .aichips button{border:1px solid #dcdce4;background:#fff;border-radius:999px;padding:5px 12px;cursor:pointer;font:inherit;font-size:13px;color:inherit}
  #ws .aichips button.on{background:#F7C838;border-color:#F7C838;color:#1D1D1B;font-weight:700}
  #ws .aimodal .body{overflow:auto;padding:4px 18px 18px}
  #ws .aimodal h4{margin:16px 0 0;font-size:15px}
  #ws .card button:disabled{opacity:.45;cursor:default}
  #ws .aigrid{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}
  #ws .aigrid>.left{flex:1;min-width:340px}
  #ws .aigrid>.right{flex:1;min-width:280px;max-width:420px;position:sticky;top:0}
  #ws .aiphoto{background:#f4f4f7;border-radius:12px;min-height:220px;display:flex;align-items:center;justify-content:center;overflow:hidden;text-align:center;color:#6b6b78;padding:0}
  #ws .aiphoto img{max-width:100%;max-height:420px;display:block}
  #ws .aiphoto .ph{padding:28px 16px;cursor:pointer}
  #ws .aipair{display:flex;align-items:center;gap:10px;width:100%}
  #ws .aipair figure{margin:0;text-align:center;font-size:12px;color:#6b6b78}
  #ws .aipair .src{flex:none;width:30%}#ws .aipair .src img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:50%;display:block;margin-bottom:4px;max-height:none}
  #ws .aipair .arrow{flex:none;color:#9a9aa8;font-size:18px}
  #ws .aipair .out{flex:1;min-width:0}#ws .aipair .out img{width:100%;border-radius:12px;display:block;margin-bottom:4px;max-height:none}
  #ws .aitiles .num{position:absolute;top:6px;left:6px;min-width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center}
  #ws .aitiles .edit{position:absolute;right:6px;top:38px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px}
  #ws .airecent{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
  #ws .airecent img{height:64px;border-radius:6px;cursor:pointer}
  #ws .aiwait{padding:40px 16px;font-weight:600}
  #ws .aibar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  #ws .aibar .bal{font-weight:700;font-size:16px}
  #ws details.adv summary{cursor:pointer;font-weight:600}
  #ws .thumbs div{position:relative}#ws .thumbs img{height:70px;border-radius:6px;display:block}
  #ws .thumbs button{position:absolute;top:2px;right:2px;border:0;background:rgba(0,0,0,.6);color:#fff;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:11px}
  #wsModal{position:fixed;inset:0;background:rgba(20,16,40,.55);z-index:60;display:flex;align-items:center;justify-content:center;font:14px system-ui,sans-serif;color:#1d1d24}
  #wsModal .box{background:#fff;border-radius:16px;width:min(1000px,94vw);height:min(720px,92vh);display:flex;flex-direction:column;overflow:hidden}
  #wsModal .mh{padding:16px 20px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:12px}
  #wsModal .mh h3{margin:0;font-size:20px;flex:1}
  #wsModal .mh input{border:1px solid #ddd;border-radius:8px;padding:7px 10px;width:220px;font:inherit}
  #wsModal .x{background:none;border:0;font-size:22px;cursor:pointer;color:#666}
  #wsModal .cats{display:flex;gap:6px;padding:10px 20px;flex-wrap:wrap}
  #wsModal .cats button{border:1px solid #ddd;background:#fff;border-radius:999px;padding:5px 12px;cursor:pointer;font:inherit;font-size:13px}
  #wsModal .cats button.on{background:#F7C838;border-color:#F7C838;color:#1D1D1B}
  #wsModal .grid{flex:1;overflow:auto;padding:10px 20px 20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
  #wsModal .tp{cursor:pointer;text-align:center;font-size:13px}
  #wsModal .tp img{width:100%;aspect-ratio:1;object-fit:contain;background:#f6f6f8;border-radius:10px;border:2px solid transparent}
  #wsModal .tp:hover img{border-color:#F7C838}
  #wsModal .two{flex:1;display:flex;min-height:0}
  #wsModal .fl{width:280px;overflow:auto;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;align-content:start;border-right:1px solid #eee}
  #wsModal .fl .sec{grid-column:1/-1;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b6b78;margin:4px 0 -2px}
  #wsModal .fi{border:2px solid #eee;border-radius:10px;padding:6px;cursor:pointer;font-size:11px;text-align:center}
  #wsModal .fi.on{border-color:#F7C838}
  #wsModal .fi img{width:100%;height:90px;object-fit:contain}
  #wsModal .bigpv{flex:1;display:flex;flex-direction:column;padding:16px;background:#f6f6f8}
  #wsModal .bigpv img{flex:1;min-height:0;object-fit:contain;width:100%}
  #wsModal .ft{display:flex;align-items:center;justify-content:space-between;padding-top:12px}
  #wsModal .et{display:flex;align-items:center;gap:14px;border:1px solid #e3e3ea;border-radius:12px;padding:12px 14px;margin:0 20px 8px;cursor:pointer;background:#fff;text-align:left;font:inherit;width:calc(100% - 40px)}
  #wsModal .et:hover{border-color:#F7C838;background:#FFFAEA}
  #wsModal .et .ei{width:46px;height:46px;border-radius:10px;background:#FFF3C4;display:flex;align-items:center;justify-content:center;color:#1D1D1B;flex:none}
  #wsModal .et b{display:block;font-family:Fredoka,system-ui,sans-serif;letter-spacing:.02em}#wsModal .et small{color:#777}
  #wsModal .et[disabled]{opacity:.5;cursor:default}
  #wsModal .sec{margin:14px 20px 8px;font-size:12px;letter-spacing:.06em;color:#555}
  #ws #wsMzBoard svg{width:100%;height:auto;max-height:46vh;display:block;border:1px solid #e3e3ea;border-radius:8px;background:#fff}
  #ws .mzRes{background:#FFF8E1;border-left:4px solid #F7C838;border-radius:8px;padding:10px 14px;margin:10px 0;font-size:13px;line-height:1.55;color:#333}
  #ws .mzRes .big{font:600 20px/1.25 Fredoka,system-ui,sans-serif;color:#1D1D1B;margin-bottom:2px}
  #ws #wsMz{display:block;max-width:100%;max-height:52vh;margin:0 auto;border-radius:8px;background:#111}
  #wsModal .btn{border:1px solid #F7C838;background:#F7C838;color:#1D1D1B;border-radius:999px;padding:9px 20px;cursor:pointer;font:inherit;font-weight:600}
  #ws .mnav,#ws .navshade{display:none}
  /* Handy und kleine Tablets: Menü als ausklappbare Leiste, Inhalt über die volle Breite, Vorschau unter den Einstellungen */
  @media(max-width:820px){
    #ws .wtop{gap:8px;padding:0 10px;height:52px}
    #ws .mnav{display:flex;align-items:center;justify-content:center;font-size:20px;line-height:1;padding:5px 11px}
    #ws .wtop .logo .pm-logo>span{display:none!important}
    #ws .wtop .en{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
    #ws .wtop .sp,#ws .wtop .st,#ws .tb .tl{display:none}
    #ws .tb{padding:7px 9px}
    #ws nav.side{position:fixed;left:0;top:52px;bottom:0;z-index:60;width:min(300px,84vw);transform:translateX(-102%);transition:transform .25s ease;box-shadow:4px 0 24px rgba(0,0,0,.18)}
    #ws.navopen nav.side{transform:none}
    #ws .navshade{position:fixed;inset:52px 0 0 0;background:rgba(0,0,0,.35);z-index:55}
    #ws.navopen .navshade{display:block}
    #ws main.wm{padding:14px 12px 90px}
    #ws h1{font-size:20px;flex-wrap:wrap}
    #ws .cols{flex-direction:column;gap:14px}
    #ws .cols>.left{min-width:0;max-width:none;width:100%}
    #ws .pv{width:100%;position:static}
    #ws .card{padding:14px;max-width:none}
    #ws .tabs{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;max-width:none}
    #ws .tabs button{white-space:nowrap;padding:10px}
    #ws .between{flex-wrap:wrap}
    #ws .dcards,#ws .charts{grid-template-columns:1fr}
    #ws .dcards.split{grid-template-columns:1fr;grid-template-rows:none}
    #ws .dcard.share{grid-column:auto;grid-row:auto}
    #ws .dacts{gap:4px 12px}
    #ws table.shares{display:block;overflow-x:auto}
    #ws .gal{grid-template-columns:repeat(auto-fill,minmax(100px,1fr))}
    #ws .evhead input{font-size:16px}
    #wsModal .box{width:100vw;max-width:100vw;height:100vh;max-height:100vh;border-radius:0}
  }
  `;
  const $ = (r, s) => r.querySelector(s), $$ = (r, s) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const getP = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
  const setP = (o, p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((a, k) => (a[k] ??= {}), o)[last] = v; };
  const FILTERS = [['normal', 'Original', 'none'], ['bw', 'Schwarz-Weiß', 'grayscale(1) contrast(1.15)'], ['vintage', 'Vintage', 'sepia(.35) contrast(1.1) saturate(1.2) brightness(1.05)'],
    ['warm', 'Warm', 'sepia(.18) saturate(1.3) brightness(1.04)'], ['cool', 'Kühl', 'saturate(.9) hue-rotate(12deg) brightness(1.05)'], ['glam', 'Glamour', 'brightness(1.12) contrast(1.08) saturate(1.1)']];
  const DEF = {
    ai: { enabled: false, prompt: '' },
    title: '', subtitle: '', startText: 'Tippen zum Starten', startScreen: null, startScreen2: null, attractP: null, attractL: null, accent: '#F7C838', attractUrl: '', attractType: '', attractFit: 'cover', startDisplay: 'live', font: 'modern', frame: '#ffffff', textColor: '#222222', template: 'classic',
    layouts: [], guestLayouts: false, gifFromPhotos: false,
    countdown: 3, countdownNext: 3, between: 2, autoReturn: 30, sound: true, mirror: true, mirrorPhoto: false, cropLive: true,
    modes: { single: true, strip: true, grid: true, gif: true, boomerang: true, video: true }, gifFrames: 4, boomerangLen: 'mittel', videoSecs: 10, videoAudio: true,
    voice: false, beauty: false, beautyStrength: 40, filtersOn: true, filters: FILTERS.map(f => f[0]), stickers: true,
    bgMode: 'off', keyStrength: 50, bgUrls: [], bgGuestChoice: true,
    form: { enabled: false, name: true, email: true, phone: false, newsletter: false, text: 'Ich bin einverstanden, dass meine Fotos gespeichert und für dieses Event verwendet werden.' },
    share: true, autoPrint: false, printButton: true, askCopies: false, maxCopies: 3, printLimit: 0, showPrintsLeft: false, copies: 1
  };
  // Erweiterte Einstellungen nach LumaBooth-Vorbild. Liegen unter settings.x, damit ältere Fotobox-Versionen sie einfach ignorieren.
  const X_DEF = {
    gif: { size: '720p-16:9', reverse: false, overlays: [], delay: 300 },
    slowmo: { enabled: false, countdown: 5, quality: 4, motion: false, flash: true, saveOriginal: true, preTextOn: false, preText: 'Bereit machen', length: 1, reverse: true, clipLen: 2, speed: '0.5x', soundtracks: [], overlays: [], size: '720p-16:9', intro: '', outro: '' },
    video: { countdown: 5, quality: 4, saveOriginal: true, preTextOn: false, preText: 'Bereit machen', overlays: [], size: '720p-16:9', intro: '', outro: '' },
    voice: { style: 'de-frau', randombefore: false, randomafter: false, files: { start: '', effect: '', countdown: '', before: [], after: [], signature: '', processing: '', done: '' } },
    fx: { mode: 'guest', lut: '', stickerStyle: 'standard', stickers: [] },
    bg: { smooth: 11 },
    survey: { questions: [], prev: 'Vorherige', next: 'Weiter', done: 'Fertig' },
    disc: { title: 'Sind Sie mit den Bedingungen einverstanden?', warn: 'Ihre Sitzung wird abgebrochen', agree: 'Ich stimme zu', cancel: 'Session abbrechen' },
    share: { email: { on: false, from: '', subject: 'Hier ist Ihr Foto', body: '<h2>Hier ist Ihr Foto</h2>{image}<br>', inputText: 'E-Mail eingeben', sendText: 'E-Mail senden' },
      sms: { on: false, message: 'Hier ist Ihr Foto', cc: '49', inputText: 'Telefonnummer eingeben', sendText: 'SMS senden' },
      wa: { on: false, message: 'Hier ist Ihr Foto', cc: '49', inputText: 'Telefonnummer eingeben', scanText: 'Mit dem Handy scannen' },
      originals: true, deleteBtn: true, deleteText: 'Wiederholen', cloud: true, uploadOriginals: true, origUp: false },
    print: { btnText: 'Drucken', printingText: 'Drucken...', copiesText: 'Wie viele Kopien?' },
    gallery: { link: false, guests: false, downloadAll: false, password: '' },
    lang: { guest: '', pick: false, list: [] }, // Gästesprache: '' = wie das Menü der Fotobox
    mosaic: { on: false, mode: 'both', who: 'all', shots: 'one', image: '', overlay: 40, boardW: 150, boardH: 100, tileW: 50.8, tileH: 50.8, numbering: 'xy', paper: 'photo', label: true, codeSize: 100, codeAlpha: 100, boardImage: false, preview: true, source: 'original' },
    ai: { skip: false, texts: { choose: 'Stil auswählen', chooseBtn: 'Stil auswählen', createBtn: 'KI-Porträt erstellen', creating: 'Ich erstelle das Porträt mit KI', retrying: 'Ich versuche es erneut', retryBtn: 'Erneut versuchen', skipBtn: 'Überspringen', failed: 'Ich konnte das Porträt mit KI nicht erstellen.' } }
  };
  const deepMerge = (def, val) => { const out = structuredClone(def); if (val && typeof val === 'object' && !Array.isArray(val)) for (const [k, v] of Object.entries(val)) out[k] = out[k] && typeof out[k] === 'object' && !Array.isArray(out[k]) ? deepMerge(out[k], v) : v; return out; };
  const NEWAPP = '<span class="soon" title="Die Einstellung wird gespeichert. Die Fotobox setzt sie ab der nächsten Version um.">ab nächster Fotobox-Version</span>';
  const NEEDSRV_S = '<span class="soon" title="Braucht zusätzlich einen Online-Dienst, der noch nicht eingerichtet ist.">Dienst folgt</span>';
  const NEEDSRV = '<p style="background:#FFF3C4;color:#8a6400;border-radius:8px;padding:8px 10px;font-size:13px;margin-bottom:8px">Die Einstellungen werden gespeichert. Damit es an der Fotobox funktioniert, muss noch ein Online-Dienst angebunden und die Fotobox aktualisiert werden.</p>';
  const NAV = [
    ['dash', 'dashboard', 'Dashboard'],
    ['h', 'Grundlagen'], ['layout', 'aperture', 'Photo booth experience'], ['capture', 'sliders', 'Aufnahmeeinstellungen'], ['voice', 'mic', 'Virtueller Berater'], ['lang', 'globe', 'Sprache'],
    ['h', 'Erweiterte Einstellungen'], ['start', 'monitor', 'Startbildschirm'], ['fx', 'sparkles', 'Filter & Effekte'], ['bg', 'wand', 'Hintergrundentfernung'],
    ['ai', 'user', 'KI-Porträts'], ['survey', 'clipboard', 'Umfrage & Haftungsausschluss'],
    ['h', 'Drucken & Teilen'], ['share', 'share', 'Einstellungen für Teilen'], ['print', 'printer', 'Druckeinstellungen'], ['mosaic', 'mosaic', 'Fotomosaik'], ['cari', 'pen', 'Live-Karikatur']
  ];

  function open(ev, ctx) {
    if (!document.getElementById('ws-css')) { const s = document.createElement('style'); s.id = 'ws-css'; s.textContent = CSS; document.head.appendChild(s); }
    const S = { ...structuredClone(DEF), ...(ev.settings || {}) };
    S.modes = { ...DEF.modes, ...(ev.settings?.modes || {}) }; S.form = { ...DEF.form, ...(ev.settings?.form || {}) };
    S.ai = AIEvent.normalize(ev.settings?.ai);
    S.x = deepMerge(X_DEF, ev.settings?.x);
    S.layouts = S.layouts || [];
    let E = { name: ev.name, event_date: ev.event_date, logo_url: ev.logo_url, share_token: ev.share_token }; // share_token = Kennung im Freigabe-Link der Galerie
    let page = 'dash', sub = {};
    const root = document.createElement('div'); root.id = 'ws';
    root.innerHTML = `<div class="wtop"><button class="tb mnav" data-a="mnav" title="Menü" aria-label="Menü">☰</button><div class="logo">${LOGO(28)}</div><span class="en"></span><span class="sp"></span>
      <span class="st"></span><button class="tb" data-a="sharelink" title="Teilen">${ICON('share', 16)}<span class="tl"> Teilen</span></button><button class="tb" data-a="preview" title="Vorschau">${ICON('eye', 16)}<span class="tl"> Vorschau</span></button></div>
      <div class="wbody"><nav class="side"></nav><div class="navshade"></div><main class="wm"></main></div>`;
    document.body.appendChild(root);
    const side = $(root, 'nav.side'), main = $(root, 'main.wm');

    // ---------- Speichern (automatisch) ----------
    let saveT = 0;
    // Baukasten-Zustand der KI-Seite. Das Testfoto bleibt nur in diesem Browser (localStorage), nie im Event.
    const ai = { p: '', a: '', pick: '', cat: '', custom: false, edit: -1, photo: '', result: '', busy: false, recent: [], lib: null };
    // „Meine KI-Stile“: getestete Stile (Name, Prompt, Vorschaubild) gehören zum Konto und lassen sich in jedes Event
    // übernehmen, ohne neu zu generieren (Tabelle ai_styles). Der Betreiber kann einzelne Stile für alle Kunden freigeben
    // („Stile von Photobox Memories“); die sehen und übernehmen sie, ändern können sie sie nicht.
    const aiLibLoad = async () => {
      ai.lib = 'loading';
      try {
        const { data, error } = await ctx.sb.from('ai_styles').select('id,name,prompt,thumb,shared,owner').order('created_at', { ascending: false }).limit(300);
        if (error) ai.lib = { error: /relation|does not exist|schema cache|column/i.test(error.message) ? 'setup' : error.message };
        else { ai.lib = (data || []).filter(x => x.owner === ctx.me.id); ai.common = (data || []).filter(x => x.owner !== ctx.me.id && x.shared); }
      } catch (error) { ai.lib = { error: error.message }; }
      if (page === 'ai') render();
    };
    const aiInLib = p => Array.isArray(ai.lib) && ai.lib.some(x => x.prompt === p.prompt);
    async function aiLibSave(item) {
      if (!Array.isArray(ai.lib)) return ctx.toast('„Meine KI-Stile“ ist noch nicht bereit.', 5000);
      if (aiInLib(item)) return ctx.toast('Dieser Stil ist schon in „Meine KI-Stile“.');
      const { data, error } = await ctx.sb.from('ai_styles').insert({ name: String(item.name || 'Mein Stil').slice(0, 60), prompt: String(item.prompt).slice(0, 1200), thumb: item.thumb || null }).select('id,name,prompt,thumb').single();
      if (error) return ctx.toast('Speichern fehlgeschlagen: ' + error.message, 6000);
      ai.lib = [data, ...ai.lib]; render(); ctx.toast('In „Meine KI-Stile“ gespeichert');
    }
    try { ai.photo = localStorage.getItem('pm-ai-testphoto') || ''; } catch {}
    // Live-Karikatur: Testergebnis und Abspielen (Vollbild, Klick schließt)
    const cariT = { busy: false, result: '', consent: false, list: null, loaded: false };
    // Einsendungen vom Handy (Tabelle cari_queue) mit Vorschau der Selfies (privater Speicher, Links 10 Minuten gültig)
    async function cariLoad() {
      try {
        const { data, error } = await ctx.sb.from('cari_queue').select('id,name,message,status,selfie,error,created_at').eq('event_id', ev.id).order('created_at', { ascending: false }).limit(60);
        if (error) { cariT.list = []; if (!/cari_queue/.test(error.message)) ctx.toast(error.message, 5000); return; }
        const paths = (data || []).filter(r => r.selfie).map(r => r.selfie), urls = {};
        if (paths.length && ctx.sb.storage.from('cari').createSignedUrls) { const { data: su } = await ctx.sb.storage.from('cari').createSignedUrls(paths, 600); (su || []).forEach(x => { if (x.signedUrl) urls[x.path] = x.signedUrl; }); }
        cariT.list = (data || []).map(r => ({ ...r, url: urls[r.selfie] || '' }));
      } catch (error) { console.warn('Einsendungen:', error); cariT.list = cariT.list || []; }
      if (page === 'cari') render();
    }
    setInterval(() => { if (page === 'cari' && document.visibilityState === 'visible' && !ctx.demo) cariLoad(); }, 10000);
    const imgOf = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    async function cariShow() {
      try {
        const c = Caricature.normalize(S.x?.caricature), [img, photo] = await Promise.all([imgOf(cariT.result), ai.photo ? imgOf(ai.photo) : null]);
        Caricature.show(img, photo, { secs: c.secs, title: c.title, closable: true, hold: 6000 });
      } catch (error) { ctx.toast('Zeichnung konnte nicht abgespielt werden: ' + error.message); }
    }
    ai.own = !!ai.photo;
    const aiThumbFile = dataUrl => new Promise((res, rej) => { const img = new Image(); img.onload = () => { const k = Math.min(1, 480 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => b ? res(new File([b], 'ki-stil.jpg', { type: 'image/jpeg' })) : rej(new Error('Bild nicht lesbar')), 'image/jpeg', .85); }; img.onerror = () => rej(new Error('Bild nicht lesbar')); img.src = dataUrl; });
    // Aktuellen Entwurf aus dem Baukasten lesen (Bibliothek oder eigener Text).
    const aiDraft = () => {
      const before = ai.edit >= 0 ? S.ai.prompts[ai.edit] : null;
      return ai.custom
        ? { id: before && !before.id.startsWith('lib-') ? before.id : (ai.draftId ||= crypto.randomUUID()), name: ($(main, '[data-ai-cname]').value.trim() || 'Eigener Stil').slice(0, 60), prompt: $(main, '[data-ai-ctext]').value.trim().slice(0, 1200) }
        : aiCompose(aiFind(AI_MOTIFS, ai.p), aiFind(AI_ARTS, ai.a));
    };
    // Stil anlegen oder ersetzen; mit resultImage wird dieses Bild verkleinert als Vorschaubild hochgeladen.
    // Gibt die Position des Stils zurück oder -1, wenn nicht gespeichert wurde.
    async function aiCommit(item, resultImage) {
      let at = ai.edit >= 0 ? ai.edit : S.ai.prompts.findIndex(x => x.id === item.id);
      const prev = at >= 0 ? S.ai.prompts[at] : null;
      if (!prev && S.ai.prompts.length >= 15) { ctx.toast('Maximal 15 Stile pro Event.'); return -1; }
      if (resultImage) {
        status('Lädt Vorschaubild hoch …');
        try { item.thumb = await ctx.uploadFile(await aiThumbFile(resultImage)); }
        catch (error) { ctx.toast('Vorschaubild konnte nicht hochgeladen werden: ' + error.message, 5000); }
      }
      if (!item.thumb && prev?.thumb && prev.prompt === item.prompt) item.thumb = prev.thumb;
      if (prev) { if (S.ai.selectedId === prev.id) S.ai.selectedId = item.id; S.ai.prompts[at] = item; } else { S.ai.prompts.push(item); at = S.ai.prompts.length - 1; }
      S.ai = AIEvent.normalize(S.ai); save();
      return at;
    }
    const aiEmptyText = text => !text.trim() || text.trim() === AI_KEEP.trim(); // nur der Standard-Vorspann ist noch kein Stil
    const aiShrink = file => new Promise((res, rej) => { const img = new Image(); img.onload = () => { const k = Math.min(1, 1536 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src); res(c.toDataURL('image/jpeg', .9)); }; img.onerror = () => rej(new Error('Bild nicht lesbar')); img.src = URL.createObjectURL(file); });
    // Standard-Testfoto für KI-Tests und Filter-Vorschau (testfoto.jpg neben dem Dashboard); ein eigenes Foto ersetzt es nur in diesem Browser.
    const aiDefaultPhoto = () => new Promise(res => { const img = new Image(); img.onload = () => { try { const k = Math.min(1, 1536 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .9)); } catch { res(''); } }; img.onerror = () => res(''); img.src = 'testfoto.jpg?v=1'; });
    if (!ai.own) aiDefaultPhoto().then(u => { if (u && !ai.own && !ai.photo) { ai.photo = u; if (page === 'ai' || page === 'fx' || page === 'cari') render(); } });
    const status = t => { $(root, '.st').textContent = t; };
    function save() {
      status('Speichert …'); clearTimeout(saveT);
      saveT = setTimeout(async () => {
        const { error } = await ctx.sb.from('events').update({ name: E.name, event_date: E.event_date || null, logo_url: E.logo_url || null, settings: S }).eq('id', ev.id);
        status(error ? '⚠️ ' + error.message : '✓ Alle Änderungen gespeichert');
      }, 600);
    }
    function renderNav() {
      side.innerHTML = `<span class="back" data-a="back">${ICON('chevronLeft', 14)} Zurück zu den Ereignissen</span>` + NAV.map(n => n[0] === 'h'
        ? `<h6>${n[1]}</h6>` : `<a data-p="${n[0]}" class="${n[0] === page ? 'on' : ''}">${ICON(n[1], 18)}${n[2]}</a>`).join('');
      $(root, '.en').textContent = E.name;
    }
    side.addEventListener('click', e => {
      const a = e.target.closest('a[data-p]'); if (a) { page = a.dataset.p; root.classList.remove('navopen'); renderNav(); render(); main.scrollTop = 0; }
      if (e.target.closest('[data-a="back"]')) close();
    });
    $(root, '.navshade').addEventListener('click', () => root.classList.remove('navopen'));
    $(root, '.wtop').addEventListener('click', async e => {
      if (e.target.closest('[data-a="mnav"]')) return root.classList.toggle('navopen'); // Handy: Menü ein-/ausklappen
      if (e.target.closest('[data-a="preview"]')) previewAll();
      if (e.target.closest('[data-a="sharelink"]')) { // Link zur Online-Galerie kopieren
        const link = shareLink();
        if (!link) return ctx.toast('Der Freigabe-Link ist noch nicht eingerichtet.', 4000);
        try { await navigator.clipboard.writeText(link); ctx.toast(S.x.gallery.link ? 'Link zur Galerie kopiert' : 'Link kopiert – er funktioniert erst, wenn „Freigabe von Links“ eingeschaltet ist', 5000); } catch { ctx.toast(link, 8000); }
      }
    });

    // ---------- Bausteine ----------
    const sw = (p, label, hint = '') => `<div class="between"><div>${label}${hint ? `<small>${hint}</small>` : ''}</div>
      <div class="row"><label class="sw"><input type="checkbox" data-s="${p}" ${getP(S, p) ? 'checked' : ''}><i></i></label><span class="swl">${getP(S, p) ? 'Ein' : 'Aus'}</span></div></div>`;
    const slider = (p, label, min, max, step = 1, unit = 'sec') => `<label class="l">${label}</label><div class="slider"><input type="range" min="${min}" max="${max}" step="${step}" data-s="${p}" data-num="1" value="${getP(S, p)}">
      <input type="number" min="${min}" max="${max}" step="${step}" data-s="${p}" data-num="1" value="${getP(S, p)}"><span class="swl">${unit}</span></div>`;
    const text = (p, label, ph = '') => `<div><label class="l">${label}</label><input type="text" data-s="${p}" value="${esc(getP(S, p) ?? '')}" placeholder="${esc(ph)}"></div>`;
    const sel = (p, label, opts) => `<label class="l">${label}</label><select data-s="${p}">${opts.map(([k, n]) => `<option value="${esc(k)}" ${String(getP(S, p)) === String(k) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
    const fileName = u => decodeURIComponent(String(u).split('/').pop().split('?')[0]).replace(/^\d+-[a-z0-9]+\./, 'Datei.');
    const up = (p, label, accept, hint = '') => { const u = getP(S, p); return `${label ? `<label class="l">${label}</label>` : ''}<div class="row">${u ? `<span>${ICON('image', 16)} ${esc(fileName(u))}</span><button class="ghost" data-a="x-del" data-p="${p}">${ICON('trash', 14)} Entfernen</button>` : ''}
      <button class="ghost" data-a="x-up" data-p="${p}" data-accept="${accept}">${ICON('upload', 15)} Datei hochladen</button>${hint ? `<small style="color:#777">${hint}</small>` : ''}</div>`; };
    const upList = (p, accept, label) => { const list = getP(S, p) || []; return `<div>${list.map((u, i) => `<div class="row" style="margin-bottom:6px"><span>${ICON('image', 16)} ${esc(fileName(u))}</span><button class="ghost" data-a="x-del" data-p="${p}" data-i="${i}">${ICON('trash', 14)}</button></div>`).join('')}
      <button class="ghost" data-a="x-up" data-p="${p}" data-accept="${accept}" data-list="1">${ICON('upload', 15)} ${label}</button></div>`; };
    const tabLists = {};
    const allTabs = (key, body) => { const cur = sub[key]; const html = tabLists[key].map(([k]) => { sub[key] = k; return `<section id="sec-${key}-${k}">${body()}</section>`; }).join(''); sub[key] = cur; return html; };
    const tabs = (key, list) => { tabLists[key] = list; sub[key] ||= list[0][0]; return `<div class="tabs">${list.map(([k, n]) => `<button data-tab="${key}:${k}" class="${sub[key] === k ? 'on' : ''}">${n}</button>`).join('')}</div>`; };
    const titleSw = (t, p) => `<h1>${t}${p ? ` <label class="sw"><input type="checkbox" data-s="${p}" ${getP(S, p) ? 'checked' : ''}><i></i></label><span class="swl">${getP(S, p) ? 'Ein' : 'Aus'}</span>` : ''}</h1>`;

    main.addEventListener('input', e => {
      const t = e.target, p = t.dataset.s;
      if (t.dataset.langl) { // angebotene Gästesprachen (mindestens die Standardsprache)
        const list = $$(main, '[data-langl]').filter(x => x.checked).map(x => x.dataset.langl), g = S.x.lang.guest;
        if (g && !list.includes(g)) list.unshift(g);
        S.x.lang.list = list.length === I18N.CODES.length ? [] : list; save(); return;
      }
      if (t.dataset.aiConsent !== undefined) { ai.consentOk = t.checked; return; }
      if (t.dataset.cariConsent !== undefined) { cariT.consent = t.checked; return; }
      if (t.dataset.aiCname !== undefined) { ai.cname = t.value; return; }
      if (t.dataset.aiCtext !== undefined) { ai.ctext = t.value; return; }
      if (t.dataset.aiSearch !== undefined) { const q = t.value.trim().toLowerCase(); $$(main, '.aimodal [data-n]').forEach(b => { b.style.display = !q || b.dataset.n.includes(q) ? '' : 'none'; }); return; }
      if (!p) return;
      const v = t.type === 'checkbox' ? t.checked : t.dataset.num ? +t.value : t.value;
      setP(S, p, v);
      if (p.startsWith('ai.prompts.')) {
        const select = main.querySelector('[data-s="ai.selectedId"]');
        if (select) { const selected = select.value; select.innerHTML = '<option value="">Erster Stil</option>' + S.ai.prompts.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join(''); select.value = selected; }
      }
      if (t.type === 'checkbox') { const l = t.closest('.row,h1')?.querySelector('.swl'); if (l) l.textContent = v ? 'Ein' : 'Aus'; }
      if (t.dataset.num) $$(main, `[data-s="${p}"]`).forEach(x => { if (x !== t) x.value = v; });
      save(); drawPreview();
      if (t.type === 'radio' || p === 'startDisplay' || p === 'x.caricature.on' || t.dataset.rerender) render();
    });
    main.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.e) { E[t.dataset.e] = t.value; renderNav(); save(); }
      if (t.dataset.sub) { sub[t.dataset.sub] = t.value; render(); }
      // Schalter auf der Übersicht ändern auch den Link-Text und den Hinweis in der Galerie
      if (page === 'dash' && (t.dataset.s === 'x.gallery.link' || t.dataset.s === 'x.share.cloud')) render();
    });
    let dragLay = '';
    main.addEventListener('dragstart', e => { const l = e.target.closest?.('.lay[data-id]'); if (l) { dragLay = l.dataset.id; e.dataTransfer.effectAllowed = 'move'; } });
    main.addEventListener('dragover', e => { const l = e.target.closest?.('.lay[data-id]'); if (dragLay && l) { e.preventDefault(); main.querySelectorAll('.lay.drop').forEach(n => n.classList.remove('drop')); if (l.dataset.id !== dragLay) l.classList.add('drop'); } });
    main.addEventListener('drop', e => {
      const l = e.target.closest?.('.lay[data-id]'); if (!dragLay || !l) return; e.preventDefault();
      const from = S.layouts.findIndex(x => x.id === dragLay), to = S.layouts.findIndex(x => x.id === l.dataset.id); dragLay = '';
      if (from < 0 || to < 0 || from === to) return render();
      S.layouts.splice(to, 0, S.layouts.splice(from, 1)[0]); save(); render();
    });
    main.addEventListener('dragend', () => { dragLay = ''; main.querySelectorAll('.lay.drop').forEach(n => n.classList.remove('drop')); });
    main.addEventListener('click', async e => {
      const t = e.target.closest('[data-tab],[data-a],[data-mode],[data-flt],[data-lay]'); if (!t) return;
      if (t.dataset.tab) { const [k, v] = t.dataset.tab.split(':'); sub[k] = v; render(); main.querySelector(`#sec-${k}-${v}`)?.scrollIntoView({ block: 'start' }); return; }
      if (t.dataset.mode) { sub.mode = t.dataset.mode; render(); return; }
      if (t.dataset.flt) { const id = t.dataset.flt; S.filters = S.filters.includes(id) ? S.filters.filter(x => x !== id) : [...S.filters, id]; save(); render(); return; }
      const a = t.dataset.a;
      if (a === 'ai-balance') {
        try { const {data,error} = await ctx.sb.from('ai_wallets').select('balance').eq('owner_id', ctx.me.id).maybeSingle(); if(error) throw error; ctx.toast('Dein KI-Guthaben: ' + (data?.balance || 0) + ' Credits', 5000); }
        catch { ctx.toast('Guthaben nicht erreichbar. Zentrale KI muss zuerst freigeschaltet werden.', 5000); }
        return;
      }
      if (a === 'ai-clear') { ai[t.dataset.k] = ''; render(); return; }
      if (a === 'ai-pick') { ai.pick = t.dataset.k; ai.cat = ''; render(); return; }
      if (a === 'ai-close') { ai.pick = ''; render(); return; }
      if (a === 'ai-cat') { ai.cat = t.dataset.c; render(); return; }
      if (a === 'ai-choose') { ai[ai.pick] = t.dataset.k; ai.pick = ''; ai.custom = false; render(); return; }
      if (a === 'ai-example') { const x = aiExamples()[+t.dataset.i]; if (x) { ai.cname = x.name; ai.ctext = x.prompt; render(); } return; }
      if (a === 'ai-custom') { // vorhandene Auswahl oder den bearbeiteten Stil als Text übernehmen
        ai.seed = ai.edit >= 0 && !(ai.p || ai.a) ? S.ai.prompts[ai.edit] : (ai.p || ai.a) ? aiCompose(aiFind(AI_MOTIFS, ai.p), aiFind(AI_ARTS, ai.a)) : null;
        ai.p = ai.a = ''; ai.custom = true; ai.cname = ai.ctext = undefined; render(); return;
      }
      if (a === 'ai-new') { e.preventDefault(); ai.p = ai.a = ''; ai.custom = false; ai.edit = -1; ai.libEdit = ''; ai.seed = null; ai.draftId = ''; ai.cname = ai.ctext = undefined; render(); return; }
      if (a === 'ai-save') {
        if (!ai.custom && !ai.p && !ai.a) return;
        const item = aiDraft();
        if (aiEmptyText(item.prompt)) return ctx.toast('Bitte beschreibe zuerst, wie das Bild aussehen soll.');
        if (ai.edit < 0 && S.ai.prompts.some(x => x.id === item.id)) return ctx.toast('Dieser Stil ist bereits gespeichert.');
        t.disabled = true;
        const at = await aiCommit(item, ai.result && (ai.resultId === item.id || ai.resultPrompt === item.prompt) ? ai.result : '');
        t.disabled = false;
        if (at < 0) return;
        const saved = S.ai.prompts[at];
        if (ai.custom) { ai.edit = at; ai.seed = null; ai.draftId = ''; ai.resultId = ''; ai.cname = ai.ctext = undefined; } // eigener Text bleibt offen: weiter ändern und neu generieren
        else { ai.p = ai.a = ''; ai.edit = -1; ai.seed = null; ai.draftId = ''; ai.resultId = ''; ai.cname = ai.ctext = undefined; }
        render(); ctx.toast(saved?.thumb ? 'Stil mit Vorschaubild gespeichert' : 'Stil gespeichert'); return;
      }
      if (a === 'ai-open') { // gespeicherten Stil immer mit seinem vollständigen Text öffnen: ändern, neu generieren, speichern
        ai.edit = +t.dataset.i; ai.libEdit = ''; ai.seed = null; ai.draftId = ''; ai.cname = ai.ctext = undefined; ai.custom = true; ai.p = ai.a = '';
        render(); main.querySelector('[data-ai-builder]')?.scrollIntoView({ block: 'center' }); return;
      }
      if (a === 'ai-lib-edit' || a === 'ai-common-edit') { // Stil aus „Meine KI-Stile“ bearbeiten bzw. einen fertigen Stil als Vorlage für einen eigenen nehmen
        const x = (a === 'ai-common-edit' ? ai.common || [] : Array.isArray(ai.lib) ? ai.lib : [])[+t.dataset.i]; if (!x) return;
        ai.libEdit = a === 'ai-lib-edit' ? x.id : ''; ai.edit = -1; ai.custom = true; ai.p = ai.a = ''; ai.seed = { name: x.name, prompt: x.prompt }; ai.draftId = ''; ai.cname = ai.ctext = undefined;
        render(); main.querySelector('[data-ai-builder]')?.scrollIntoView({ block: 'center' }); return;
      }
      if (a === 'cari-refresh') { await cariLoad(); return; }
      if (a === 'cari-copy') { const i = $(main, '[data-cari-link]'); try { await navigator.clipboard.writeText(i.value); ctx.toast('Link kopiert'); } catch { i.select(); } return; }
      if (a === 'cari-qr') { // QR-Code für Tischkarten (Bibliothek erst bei Bedarf laden)
        const box = $(main, '[data-cari-qr]'), url = $(main, '[data-cari-link]').value;
        if (!window.qrcode) await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }).catch(() => {});
        if (!window.qrcode) return ctx.toast('QR-Code konnte nicht geladen werden.');
        const q = qrcode(0, 'M'); q.addData(url); q.make();
        box.innerHTML = `<div style="display:inline-block;background:#fff;padding:10px;border-radius:12px;border:1px solid #eee">${q.createSvgTag({ cellSize: 6, margin: 2 })}</div><p style="margin:6px 0 0;color:#6b6b78;font-size:13px">Rechtsklick → „Bild speichern“ oder Bildschirmfoto für Tischkarten. Mit Code-Pflicht brauchen Gäste zusätzlich den Code vom Bildschirm.</p>`;
        return;
      }
      if (a === 'cari-ok' || a === 'cari-no' || a === 'cari-del') {
        const r = (cariT.list || []).find(x => x.id === t.dataset.id); if (!r) return;
        if (a === 'cari-del' && !await (G.pmConfirm || (async q => confirm(q)))('Einsendung und Selfie löschen?')) return;
        if (r.selfie && a !== 'cari-ok') await ctx.sb.storage.from('cari').remove([r.selfie]).catch(() => {});
        const q = a === 'cari-del' ? ctx.sb.from('cari_queue').delete().eq('id', r.id)
          : ctx.sb.from('cari_queue').update(a === 'cari-ok' ? { status: 'new', updated_at: new Date().toISOString() } : { status: 'rejected', selfie: null, updated_at: new Date().toISOString() }).eq('id', r.id);
        const { error } = await q; if (error) return ctx.toast(error.message, 6000);
        await cariLoad(); return;
      }
      if (a === 'cari-reset') { e.preventDefault(); S.x.caricature = { ...(S.x.caricature || {}), prompt: '' }; save(); render(); return; }
      if (a === 'cari-play') { e.preventDefault?.(); if (cariT.result) cariShow(); return; }
      if (a === 'cari-test') {
        const c = Caricature.normalize(S.x?.caricature);
        if (cariT.busy || !c.on) return;
        if (!ai.photo) return ctx.toast('Kein Testfoto vorhanden.');
        if (!$(main, '[data-cari-consent]')?.checked) return ctx.toast('Bitte bestätigen, dass das Testfoto an den KI-Dienst übertragen werden darf.');
        cariT.consent = true; clearTimeout(saveT);
        const { error: se } = await ctx.sb.from('events').update({ name: E.name, event_date: E.event_date || null, logo_url: E.logo_url || null, settings: S }).eq('id', ev.id); // Server muss die Live-Karikatur sehen
        if (se) return ctx.toast('Event konnte nicht gespeichert werden: ' + se.message);
        cariT.busy = true; render();
        try {
          const { data, error } = await ctx.sb.functions.invoke('ai-generate', { body: { image: ai.photo, prompt: Caricature.promptOf(c), consent: true, eventId: ev.id, requestId: crypto.randomUUID() } });
          let result = data;
          if (error?.context?.json) { try { result = await error.context.json(); } catch {} }
          if (error || result?.error) throw new Error(result?.error || error.message);
          if (!result?.image) throw new Error('Der KI-Dienst hat kein Bild geliefert.');
          cariT.result = result.image;
        } catch (error) { ctx.toast(error instanceof TypeError ? 'KI-Dienst ist nicht erreichbar. Bitte Internet prüfen.' : error.message, 9000); }
        cariT.busy = false; render();
        if (cariT.result) cariShow();
        return;
      }
      if (a === 'ai-set-thumb') { // aktuelles Testbild (auch aus „Letzte Generierungen“) als Bild des bearbeiteten Stils – der Text bleibt, wie er gespeichert ist
        const ev = ai.edit >= 0 ? S.ai.prompts[ai.edit] : null, lx = !ev && ai.libEdit && Array.isArray(ai.lib) ? ai.lib.find(y => y.id === ai.libEdit) : null;
        if (!ai.result || (!ev && !lx)) return;
        t.disabled = true; status('Lädt Vorschaubild hoch …');
        let url = '';
        try { url = await ctx.uploadFile(await aiThumbFile(ai.result)); } catch (error) { ctx.toast('Vorschaubild konnte nicht hochgeladen werden: ' + error.message, 6000); }
        t.disabled = false; status('');
        if (!url) return;
        if (ev) { ev.thumb = url; S.ai = AIEvent.normalize(S.ai); save(); }
        else {
          const { error } = await ctx.sb.from('ai_styles').update({ thumb: url }).eq('id', lx.id);
          if (error) return ctx.toast('Speichern fehlgeschlagen: ' + error.message, 6000);
          lx.thumb = url;
        }
        render(); ctx.toast('Neues Bild für „' + (ev || lx).name + '“ gespeichert'); return;
      }
      if (a === 'ai-lib-update') { // bearbeiteten Stil in „Meine KI-Stile“ zurückschreiben – mit neuem Bild, wenn eins zu genau diesem Text erzeugt wurde
        const x = Array.isArray(ai.lib) && ai.lib.find(y => y.id === ai.libEdit); if (!x) return;
        const item = aiDraft();
        if (aiEmptyText(item.prompt)) return ctx.toast('Bitte beschreibe zuerst, wie das Bild aussehen soll.');
        const patch = { name: item.name, prompt: item.prompt };
        t.disabled = true;
        if (ai.result && ai.resultPrompt === item.prompt) {
          status('Lädt Vorschaubild hoch …');
          try { patch.thumb = await ctx.uploadFile(await aiThumbFile(ai.result)); } catch (error) { ctx.toast('Vorschaubild konnte nicht hochgeladen werden: ' + error.message, 5000); }
          status('');
        }
        const { error } = await ctx.sb.from('ai_styles').update(patch).eq('id', x.id);
        t.disabled = false;
        if (error) return ctx.toast('Speichern fehlgeschlagen: ' + error.message, 6000);
        Object.assign(x, patch); ai.seed = { name: x.name, prompt: x.prompt }; ai.cname = ai.ctext = undefined; ai.resultId = ''; render();
        ctx.toast(patch.thumb ? '„Meine KI-Stile“ gespeichert – mit neuem Bild' : '„Meine KI-Stile“ gespeichert'); return;
      }
      if (a === 'ai-lib-result') { // aktuelles Testbild samt Prompt in die Sammlung
        const prompt = ai.resultPrompt || aiDraft().prompt;
        if (!ai.result || aiEmptyText(prompt || '')) return ctx.toast('Bitte zuerst ein Testbild generieren.');
        t.disabled = true; status('Lädt Vorschaubild hoch …');
        try { await aiLibSave({ name: ai.resultName || aiDraft().name, prompt, thumb: await ctx.uploadFile(await aiThumbFile(ai.result)) }); }
        catch (error) { ctx.toast('Vorschaubild konnte nicht hochgeladen werden: ' + error.message, 5000); }
        status(''); t.disabled = false; return;
      }
      if (a === 'ai-lib-add') { const p = S.ai.prompts[+t.dataset.i]; if (p) await aiLibSave(p); return; }
      if (a === 'ai-lib-share') { // nur Betreiber: Stil für alle Kunden freigeben oder zurücknehmen
        const x = Array.isArray(ai.lib) && ai.lib[+t.dataset.i]; if (!x || !ctx.admin) return;
        const { error } = await ctx.sb.from('ai_styles').update({ shared: !x.shared }).eq('id', x.id);
        if (error) return ctx.toast(error.message, 5000);
        x.shared = !x.shared; render(); ctx.toast(x.shared ? 'Für alle Kunden freigegeben' : 'Freigabe zurückgenommen'); return;
      }
      if (a === 'ai-lib-use') {
        const x = (t.dataset.common ? ai.common : Array.isArray(ai.lib) ? ai.lib : [])[+t.dataset.i]; if (!x) return;
        if (S.ai.prompts.some(p => p.prompt === x.prompt)) return ctx.toast('Dieser Stil ist schon in diesem Event.');
        if (S.ai.prompts.length >= 15) return ctx.toast('Maximal 15 Stile pro Event.');
        S.ai.prompts.push({ id: crypto.randomUUID(), name: x.name, prompt: x.prompt, ...(x.thumb ? { thumb: x.thumb } : {}) });
        S.ai = AIEvent.normalize(S.ai); save(); render(); ctx.toast('Stil übernommen – ohne Credits'); return;
      }
      if (a === 'ai-lib-del') {
        const x = Array.isArray(ai.lib) && ai.lib[+t.dataset.i]; if (!x) return;
        if (!await (G.pmConfirm || (async text => confirm(text)))(`„${x.name}“ aus „Meine KI-Stile“ löschen? In Events bleibt der Stil erhalten.`)) return;
        const { error } = await ctx.sb.from('ai_styles').delete().eq('id', x.id);
        if (error) return ctx.toast(error.message, 5000);
        ai.lib = ai.lib.filter(y => y.id !== x.id); if (ai.libEdit === x.id) { ai.libEdit = ''; ai.custom = false; ai.seed = null; ai.cname = ai.ctext = undefined; } render(); return;
      }
      if (a === 'ai-delete') { S.ai.prompts.splice(+t.dataset.i, 1); ai.edit = -1; ai.libEdit = ''; ai.custom = false; ai.p = ai.a = ''; ai.seed = null; ai.draftId = ''; ai.cname = ai.ctext = undefined; S.ai = AIEvent.normalize(S.ai); save(); render(); return; }
      if (a === 'ai-status') {
        t.disabled = true;
        try {
          const {data,error} = await ctx.sb.functions.invoke('ai-status');
          let result = data;
          if (error?.context?.json) { try { result = await error.context.json(); } catch {} }
          ctx.toast(result?.error || (error ? 'KI-Verbindung konnte nicht geprüft werden: ' + error.message : result?.message || 'Verbindung geprüft.'), 12000);
        } catch (error) { ctx.toast('KI-Verbindung nicht erreichbar: ' + error.message, 8000); }
        finally { t.disabled = false; }
        return;
      }
      if (a === 'ai-photo') {
        const f = await pick('image/jpeg,image/png,image/webp'); if (!f) return;
        try { ai.photo = await aiShrink(f); ai.own = true; ai.result = ''; try { localStorage.setItem('pm-ai-testphoto', ai.photo); } catch {} render(); }
        catch (error) { ctx.toast(error.message); }
        return;
      }
      if (a === 'ai-photo-reset') {
        try { localStorage.removeItem('pm-ai-testphoto'); } catch {}
        ai.own = false; ai.result = ''; ai.photo = await aiDefaultPhoto(); render();
        return;
      }
      if (a === 'ai-zoom') { // erzeugtes Bild groß ansehen; Klick oder Esc schließt
        const o = document.createElement('div');
        o.style.cssText = 'position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out';
        o.innerHTML = `<img src="${t.getAttribute('src')}" alt="" style="max-width:100%;max-height:100%;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.5)"><span style="position:absolute;top:14px;right:20px;color:#fff;font-size:30px;line-height:1">✕</span>`;
        const close = () => { o.remove(); document.removeEventListener('keydown', key); };
        const key = ev => { if (ev.key === 'Escape') close(); };
        o.onclick = close; document.addEventListener('keydown', key); document.body.appendChild(o);
        return;
      }
      if (a === 'ai-recent') { const r = ai.recent[+t.dataset.i]; ai.result = r?.image || ''; ai.resultPrompt = r?.prompt || ''; ai.resultName = r?.name || ''; ai.resultId = ''; render(); return; }
      if (a === 'ai-test') {
        if (!ai.custom && !ai.p && !ai.a) return ctx.toast('Bitte zuerst einen Porträtstil oder einen Kunststil wählen.');
        const item = aiDraft();
        if (aiEmptyText(item.prompt)) return ctx.toast('Bitte beschreibe zuerst, wie das Bild aussehen soll.');
        const central = S.ai.connection === 'central';
        if (central && !S.ai.enabled) return ctx.toast('Bitte zuerst KI-Porträts für dieses Event einschalten.');
        if (central) {
          clearTimeout(saveT);
          const {error} = await ctx.sb.from('events').update({name: E.name, event_date: E.event_date || null, logo_url: E.logo_url || null, settings: S}).eq('id', ev.id);
          if (error) return ctx.toast('Event konnte nicht gespeichert werden: ' + error.message);
          status('✓ Alle Änderungen gespeichert');
        }
        if (!central) { AITest.open({ ...item, provider: S.ai.provider, resolution: S.ai.resolution, photo: ai.photo }); return; }
        // Zentrale KI: direkt mit dem Testfoto generieren, Ergebnis erscheint rechts neben dem Original.
        if (ai.busy) return;
        if (!ai.photo) return ctx.toast('Bitte zuerst rechts ein Testfoto hochladen.');
        if (!$(main, '[data-ai-consent]')?.checked) return ctx.toast('Bitte bestätigen, dass das Testfoto an den KI-Dienst übertragen werden darf.');
        ai.busy = true; ai.result = ''; render();
        try {
          const {data,error} = await ctx.sb.functions.invoke('ai-generate', {body: {image: ai.photo, prompt: item.prompt.trim(), consent: true, eventId: ev.id, requestId: crypto.randomUUID()}});
          let result = data;
          if (error?.context?.json) { try { result = await error.context.json(); } catch {} }
          if (error || result?.error) throw new Error(result?.error || error.message);
          if (!result?.image) throw new Error('Der KI-Dienst hat kein Bild geliefert.');
          ai.result = result.image; ai.resultPrompt = item.prompt.trim(); ai.resultName = item.name || ''; ai.recent.unshift({ image: result.image, name: item.name || 'Test', prompt: item.prompt.trim() }); ai.recent.length = Math.min(ai.recent.length, 8);
          ai.resultId = item.id; // beim Speichern dieses Entwurfs wird das Bild zum Kachelbild
        } catch (error) { ctx.toast(error instanceof TypeError ? 'KI-Dienst ist nicht erreichbar. Bitte Internet prüfen.' : error.message, 9000); }
        ai.busy = false; ai.consentOk = true; render();
        return;
      }

      if (a === 'newlay') { $(main, '.dd .menu').classList.toggle('hidden-m'); $(main, '.dd .menu').style.display = $(main, '.dd .menu').style.display === 'block' ? 'none' : 'block'; }
      if (a === 'fromtpl') pickTemplate(vals(), addLayout);
      if (a === 'fromplain') pickFormat(modal(''), 'plain', vals(), addLayout);
      if (a === 'fromimg') fromImage();
      if (a === 'editlay') editLayout(t.dataset.id);
      if (a === 'sellay') { sub.laySel = sub.laySel === t.dataset.id ? '' : t.dataset.id; render(); }
      if (a === 'sharelay') { // Vorschau als Bild speichern, zum Weitergeben an den Kunden
        const L = S.layouts.find(l => l.id === t.dataset.id); if (!L) return;
        await FBR.preloadLayout(L); const c = FBR.renderSheet(L, { placeholders: true, values: vals() });
        const link = document.createElement('a'); link.download = (L.name || 'Layout').replace(/[^\wäöüÄÖÜß -]/g, '') + '-Vorschau.jpg'; link.href = c.toDataURL('image/jpeg', .9); link.click();
      }
      if (a === 'dellay') { if (await (G.pmConfirm || (async text => confirm(text)))('Layout löschen?')) { S.layouts = S.layouts.filter(l => l.id !== t.dataset.id); if (sub.laySel === t.dataset.id) sub.laySel = ''; save(); render(); } }
      if (a === 'duplay') { const l = structuredClone(S.layouts.find(x => x.id === t.dataset.id)); l.id = FBR.uid(); l.name += ' (Kopie)'; S.layouts.push(l); save(); render(); }
      if (a === 'uplogo') { const f = await pick('image/*'); if (f) { status('Lädt Logo hoch …'); E.logo_url = await ctx.uploadFile(f); save(); render(); } }
      if (a === 'dellogo') { E.logo_url = null; save(); render(); }
      if (a === 'editscreen') { editScreen(t.dataset.o === 'landscape' ? 'landscape' : 'portrait'); return; }
      if (a === 'resetscreen') { if (await (G.pmConfirm || (async t => confirm(t)))('Gestaltung des Startbildschirms (Hoch- und Querformat) verwerfen?', 'Zurücksetzen')) { S.startScreen = null; S.startScreen2 = null; save(); render(); } return; }
      if (a === 'upattract') { await uploadAttract(t.dataset.o === 'landscape' ? 'landscape' : 'portrait'); render(); return; }
      if (a === 'delattract') { removeAttract(t.dataset.o === 'landscape' ? 'landscape' : 'portrait'); render(); return; }
      if (a === 'x-up') {
        const f = await pick(t.dataset.accept || '*/*'); if (!f) return;
        if (f.size > 50 * 1024 * 1024) return ctx.toast('Die Datei ist größer als 50 MB.');
        status('Lädt Datei hoch …');
        try { const url = await ctx.uploadFile(f); if (t.dataset.list) setP(S, t.dataset.p, [...(getP(S, t.dataset.p) || []), url]); else setP(S, t.dataset.p, url); save(); render(); }
        catch (error) { ctx.toast('Hochladen fehlgeschlagen: ' + error.message, 6000); status('⚠️ Hochladen fehlgeschlagen'); }
        return;
      }
      if (a === 'x-del') { if (t.dataset.i !== undefined) setP(S, t.dataset.p, (getP(S, t.dataset.p) || []).filter((_, i) => i !== +t.dataset.i)); else setP(S, t.dataset.p, ''); save(); render(); return; }
      if (a === 'q-add') { if (S.x.survey.questions.length >= 20) return ctx.toast('Maximal 20 Fragen.'); S.x.survey.questions.push({ id: crypto.randomUUID(), text: '', type: 'short', required: false, options: '' }); save(); render(); return; }
      if (a === 'q-del') { S.x.survey.questions.splice(+t.dataset.i, 1); save(); render(); return; }
      if (a === 'q-up' || a === 'q-down') { const i = +t.dataset.i, j = a === 'q-up' ? i - 1 : i + 1, Q = S.x.survey.questions; if (j < 0 || j >= Q.length) return; [Q[i], Q[j]] = [Q[j], Q[i]]; save(); render(); return; }
      if (a === 'bgon') { S.bgMode = t.checked ? 'ai' : 'off'; save(); render(); return; }
      if (a === 'bgchoice') { S.bgGuestChoice = t.dataset.v === '1'; save(); return; }
      if (a === 'upbg') { const f = await pick('image/*'); if (f) { status('Lädt Hintergrund hoch …'); S.bgUrls = [...(S.bgUrls || []), await ctx.uploadFile(f)]; save(); render(); } }
      if (a === 'delbg') { S.bgUrls = S.bgUrls.filter((_, i) => i !== +t.dataset.i); save(); render(); }
      if (a === 'delev') ctx.onDelete?.(ev, close);
      if (a === 'go') { page = t.dataset.pg; renderNav(); render(); return; }
      if (a === 'gal-embed') { sub.embed = !sub.embed; render(); return; }
      if (a === 'gal-slide') { const link = shareLink(); if (!link) return ctx.toast('Der Freigabe-Link ist noch nicht eingerichtet.', 4000);
        if (!S.x.gallery.link) return ctx.toast('Für die Slideshow bitte zuerst „Freigabe von Links“ einschalten.', 5000); window.open(link + '&show=1', '_blank', 'noopener'); return; }
      if (a === 'gal-upload') return uploadToGallery();
      if (a === 'shares-csv') return sharesCsv();
      if (a === 'gal-open') return openLightbox(+t.dataset.i);
      if (a === 'gal-reload') { gal.list = null; render(); return loadGallery(true); }
      if (a === 'gal-zip') return downloadAll();
      if (a === 'gal-copy') { const link = shareLink(); try { await navigator.clipboard.writeText(link); ctx.toast('Link kopiert'); } catch { ctx.toast(link, 8000); } return; }
      if (a === 'mz-fit') {
        const c = Mosaic.normalize(S.x.mosaic); if (!mzv.img) return ctx.toast('Das Hauptbild lädt noch – bitte gleich noch einmal.');
        S.x.mosaic.boardH = Math.round(c.boardW / (mzv.img.naturalWidth / mzv.img.naturalHeight)); save(); render(); return; // Seitenverhältnis des Hauptbilds
      }
      if (a === 'mz-pdf') return mzPrintBoard(t.dataset.k);
      if (a === 'mz-reset') { // Fotobox leert beim nächsten Abgleich alle Felder (neuer Zeitpunkt = neues Mosaik)
        if (!await (G.pmConfirm || (async x => confirm(x)))('Mosaik neu starten? Alle belegten Felder werden geleert, neue Kacheln bekommen die aktuellen Einstellungen. Die Fotos bleiben in der Galerie.', 'Neu starten')) return;
        S.x.mosaic.round = Date.now(); save();
        // zugewiesene Fotoboxen gleich abgleichen lassen (nach dem Speichern)
        setTimeout(() => ctx.sb.from('devices').update({ command: { id: crypto.randomUUID(), at: new Date().toISOString(), type: 'sync' } }).eq('event_id', ev.id).then(() => {}, () => {}), 2500);
        return ctx.toast('Mosaik wird neu gestartet – die Fotobox übernimmt es in etwa 15 Sekunden, sobald keine Aufnahme läuft. Danach die Tafel neu drucken.', 7000);
      }
      if (a === 'edit1') { const l = S.layouts[0]; if (l) editLayout(l.id); else pickTemplate(vals(), addLayout); }
    });
    const pick = accept => new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.onchange = () => res(i.files[0] || null); i.click(); });

    // ---------- Seiten ----------
    const addLayout = L => { S.layouts.push(L); sub.laySel = L.id; save(); render(); editLayout(L.id); };
    const layoutThumb = (L, px = 300) => thumbOf(L, px, vals());
    const vals = () => ({ titel: S.title || E.name, untertitel: S.subtitle || (E.event_date ? new Date(E.event_date).toLocaleDateString('de-DE') : ''), datum: new Date().toLocaleDateString('de-DE'), uhrzeit: '20:15', event: E.name, name: 'Lisa' });
    function layoutCards() {
      return `<div class="dd"><button class="btn" data-a="newlay">${ICON('plus', 16)} Neues Layout ${ICON('chevronDown', 16)}</button><div class="menu" style="display:none">
          <button data-a="fromtpl">${ICON('gallery', 16)} Vorlage wählen</button><button data-a="fromplain">${ICON('image', 16)} Ohne Vorlage (nur Foto)</button><button data-a="fromimg">${ICON('upload', 16)} Bild hochladen</button></div></div>
        <div class="lays">${S.layouts.length ? S.layouts.map(L => `<div class="lay ${sub.laySel === L.id ? 'on' : ''}" data-a="sellay" data-id="${L.id}" draggable="true" title="Anklicken zum Auswählen · am Griff ziehen zum Umsortieren">
            <span class="grip" title="Ziehen zum Umsortieren">⋮⋮</span>
            <div class="acts"><button data-a="dellay" data-id="${L.id}" title="Löschen">${ICON('trash', 13)}</button></div>
            <img src="${layoutThumb(L)}" alt=""><div class="nm">${esc(L.name)} · ${FBR.photoCount(L)} Foto(s)</div></div>`).join('')
          : `<div class="empty" style="flex:1">Noch keine Layouts hinzugefügt</div>`}</div>`;
    }
    // ---------- Online-Galerie: Fotos dieses Ereignisses aus dem Speicher ----------
    const gal = { list: null, error: '', loading: false, at: 0 };
    const galUrl = path => G.FOTOBOX_PHOTOS ? G.FOTOBOX_PHOTOS.url(path) : ctx.sb.storage.from('photos').getPublicUrl(path).data?.publicUrl || '';
    const sbToken = async () => (await ctx.sb.auth.getSession()).data.session?.access_token || '';
    const shareLink = () => E.share_token ? location.origin + location.pathname.replace(/[^/]*$/, '') + 'galerie.html?g=' + E.share_token : '';
    async function loadGallery(force) {
      if (gal.loading || (!force && gal.list && Date.now() - gal.at < 30000)) return;
      gal.loading = true;
      try {
        const { data, error } = await ctx.sb.from('photos').select('id,path,thumb,kind,name,bytes,created_at').eq('event_id', ev.id).order('created_at', { ascending: false }).limit(2000);
        gal.error = error ? (/relation|does not exist|schema cache/i.test(error.message) ? 'Die Online-Galerie ist auf dem Server noch nicht eingerichtet.' : error.message) : '';
        gal.list = error ? [] : [].concat(data || []);
      } catch (e) { gal.error = e.message; gal.list = []; }
      gal.loading = false; gal.at = Date.now();
      if (['dash', 'analytics', 'shares'].includes(page)) render();
    }
    const fetchBlob = async path => { const r = await fetch(galUrl(path)); if (!r.ok) throw new Error('Datei nicht abrufbar'); return r.blob(); };
    const saveBlob = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 20000); };
    const galName = x => (x.name || x.path.split('/').pop()).replace(/[^\w.\-äöüÄÖÜß ]/g, '_');
    function openLightbox(i) {
      const L = gal.list || []; let n = i;
      const o = document.createElement('div'); o.id = 'wsLight';
      const draw = () => { const x = L[n]; if (!x) return o.remove();
        o.innerHTML = `${x.kind === 'video' ? `<video src="${esc(galUrl(x.path))}" controls autoplay loop playsinline></video>` : `<img src="${esc(galUrl(x.path))}" alt="">`}
          <div class="bar"><button data-k="dl">${ICON('download', 15)} Herunterladen</button><button data-k="del" style="color:#d23b3b">${ICON('trash', 15)} Löschen</button><button data-k="x">Schließen</button></div>
          <div style="color:#bbb;font:13px system-ui,sans-serif">${n + 1} von ${L.length} · ${esc(new Date(x.created_at).toLocaleString('de-DE'))}</div>
          ${L.length > 1 ? '<button class="nav l" data-k="prev">‹</button><button class="nav r" data-k="next">›</button>' : ''}`; };
      const key = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') { n = (n + L.length - 1) % L.length; draw(); } if (e.key === 'ArrowRight') { n = (n + 1) % L.length; draw(); } };
      const close = () => { o.remove(); document.removeEventListener('keydown', key); };
      o.addEventListener('click', async e => {
        const k = e.target.closest('[data-k]')?.dataset.k; if (!k) { if (e.target === o) close(); return; }
        const x = L[n];
        if (k === 'x') return close();
        if (k === 'prev') { n = (n + L.length - 1) % L.length; return draw(); }
        if (k === 'next') { n = (n + 1) % L.length; return draw(); }
        if (k === 'dl') { try { saveBlob(await fetchBlob(x.path), galName(x)); } catch (err) { ctx.toast('Herunterladen fehlgeschlagen: ' + err.message, 4000); } return; }
        if (k === 'del') {
          if (!await (G.pmConfirm || (async t => confirm(t)))('Dieses Foto endgültig aus der Online-Galerie löschen? Auf der Fotobox bleibt es gespeichert.')) return;
          const files = [x.path, x.thumb].filter(Boolean), ext = files.filter(f => f.startsWith(G.FOTOBOX_PHOTOS?.prefix || '\u0000')), sbf = files.filter(f => !ext.includes(f));
          let r1 = null;
          try { if (ext.length) { const t = await sbToken(); for (const f of ext) await G.FOTOBOX_PHOTOS.del(f, t); } } catch (err) { r1 = { error: err }; }
          if (!r1 && sbf.length) r1 = await ctx.sb.storage.from('photos').remove(sbf);
          const r2 = r1?.error ? null : await ctx.sb.from('photos').delete().eq('id', x.id);
          if (r1?.error || r2?.error) return ctx.toast('Löschen fehlgeschlagen: ' + (r1?.error || r2?.error).message, 5000);
          L.splice(n, 1); if (!L.length) close(); else { n = Math.min(n, L.length - 1); draw(); } render();
        }
      });
      document.addEventListener('keydown', key); draw(); document.body.appendChild(o);
    }
    async function downloadAll() {
      const L = gal.list || []; if (!L.length) return;
      if (L.length > 400 && !await (G.pmConfirm || (async t => confirm(t)))(`${L.length} Dateien in eine ZIP-Datei packen? Das kann einige Minuten dauern und braucht viel Arbeitsspeicher.`, 'Herunterladen')) return;
      try {
        if (!G.JSZip) await new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'; sc.onload = ok; sc.onerror = () => no(new Error('ZIP-Baustein nicht ladbar')); document.head.appendChild(sc); });
        const zip = new G.JSZip(); let done = 0;
        for (const x of L) { status(`Lade ${++done} von ${L.length} …`); try { zip.file(String(done).padStart(4, '0') + '_' + galName(x), await fetchBlob(x.path)); } catch {} }
        status('Packe ZIP-Datei …');
        saveBlob(await zip.generateAsync({ type: 'blob', compression: 'STORE' }), (E.name || 'Ereignis').replace(/[^\w\-äöüÄÖÜß ]/g, '_') + '-Fotos.zip'); status('');
      } catch (e) { status(''); ctx.toast('Herunterladen fehlgeschlagen: ' + e.message, 5000); }
    }
    // Fotos von Hand in die Online-Galerie laden (z. B. Bilder vom Fotografen)
    async function uploadToGallery() {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,video/mp4,video/webm'; inp.multiple = true;
      inp.onchange = async () => {
        const files = [...inp.files].slice(0, 100); if (!files.length) return;
        const uid = ctx.me?.id; if (!uid) return ctx.toast('Bitte neu anmelden.', 4000);
        let ok = 0, n = 0;
        for (const f of files) {
          status(`Lädt ${++n} von ${files.length} hoch …`);
          if (f.size > 25 * 1024 * 1024) continue;
          try {
            const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, ''), id = crypto.randomUUID(), base = `${uid}/${ev.id}/${id}`;
            const video = f.type.startsWith('video'); let thumb = null;
            if (!video) try { const bmp = await createImageBitmap(f), k = Math.min(1, 480 / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
              c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
              thumb = await new Promise(r => c.toBlob(r, 'image/jpeg', .8)); } catch {}
            const hz = !!G.FOTOBOX_PHOTOS?.external, pre = hz ? G.FOTOBOX_PHOTOS.prefix : '';
            if (hz) { const t = await sbToken(); await G.FOTOBOX_PHOTOS.put(`${base}.${ext}`, f, t); if (thumb) await G.FOTOBOX_PHOTOS.put(`${base}_t.jpg`, thumb, t); }
            else {
              const r1 = await ctx.sb.storage.from('photos').upload(`${base}.${ext}`, f, { contentType: f.type, cacheControl: '31536000' }); if (r1.error) throw r1.error;
              if (thumb) await ctx.sb.storage.from('photos').upload(`${base}_t.jpg`, thumb, { contentType: 'image/jpeg', cacheControl: '31536000' });
            }
            const r2 = await ctx.sb.from('photos').insert({ event_id: ev.id, path: `${pre}${base}.${ext}`, thumb: thumb ? `${pre}${base}_t.jpg` : null, kind: ext === 'gif' ? 'gif' : video ? 'video' : 'photo', bytes: f.size, name: f.name.slice(0, 120) });
            if (r2.error) throw r2.error; ok++;
          } catch (e) { ctx.toast('Hochladen fehlgeschlagen: ' + (e.message || e), 5000); break; }
        }
        status(''); if (ok) ctx.toast(`${ok} Datei(en) hochgeladen`); gal.list = null; render(); loadGallery(true);
      };
      inp.click();
    }
    const isExtra = x => /_original\d*\.|_fotos\.gif$/i.test(x.name || ''); // Einzelaufnahmen und Zusatz-GIF zählen nicht als eigene Sitzung
    const kindName = x => x.kind === 'video' ? 'Video' : x.kind === 'gif' ? 'GIF' : isExtra(x) ? 'Originalfoto' : 'Foto';
    function sharesCsv() {
      const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = (gal.list || []).map(x => [new Date(x.created_at).toLocaleString('de-DE'), kindName(x), x.name || '', Math.round((x.bytes || 0) / 1024) + ' KB', galUrl(x.path)].map(q).join(';'));
      saveBlob(new Blob(['\ufeff' + ['Datum;Art;Datei;Größe;Adresse', ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' }), (E.name || 'Ereignis').replace(/[^\w\-äöüÄÖÜß ]/g, '_') + '-Shares.csv');
    }
    const PAGES = {
      // Analysen: Auswertung der Aufnahmen dieses Ereignisses
      analytics() {
        loadGallery(); const P = gal.list || [], S0 = P.filter(x => !isExtra(x));
        const days = [...Array(30)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (29 - i)); return d; });
        const perDay = days.map(d => S0.filter(x => { const t = new Date(x.created_at); return t >= d && t < new Date(+d + 864e5); }).length), maxD = Math.max(1, ...perDay);
        const perHour = [...Array(24)].map((_, h) => S0.filter(x => new Date(x.created_at).getHours() === h).length), maxH = Math.max(1, ...perHour);
        const kinds = [['Fotos', P.filter(x => x.kind === 'photo' && !isExtra(x)).length], ['Originalfotos', P.filter(x => x.kind === 'photo' && isExtra(x)).length], ['GIFs', P.filter(x => x.kind === 'gif').length], ['Videos', P.filter(x => x.kind === 'video').length]], maxK = Math.max(1, ...kinds.map(k => k[1]));
        const devs = (ctx.devices || []).filter(d => d.event_id === ev.id), prints = devs.reduce((n, d) => n + (d.status?.prints || 0), 0), limit = +S.printLimit || 0;
        const hb = (n, v, max) => `<div class="hbar"><span>${n}</span><span><i style="width:${Math.round(v / max * 100)}%"></i></span><b>${v}</b></div>`;
        return `<button class="backl" data-a="go" data-pg="dash">${ICON('chevronLeft', 14)} Zurück zum Dashboard</button>
          <h1>${esc(E.name)}</h1><p style="margin:-8px 0 14px;color:#555">${E.event_date ? new Date(E.event_date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} · Letzte 30 Tage</p>
          ${gal.error ? `<div class="dempty">${esc(gal.error)}</div>` : `<div class="charts">
            <div class="chart"><h3>Sitzungen pro Tag</h3><div class="bars">${perDay.map((v, i) => `<i style="height:${Math.round(v / maxD * 100)}%" title="${days[i].toLocaleDateString('de-DE')}: ${v}"></i>`).join('')}</div>
              <div class="axis"><span>${days[0].toLocaleDateString('de-DE')}</span><span>heute</span></div></div>
            <div class="chart"><h3>Sitzungen nach Uhrzeit</h3><div class="bars">${perHour.map((v, h) => `<i style="height:${Math.round(v / maxH * 100)}%" title="${h} Uhr: ${v}"></i>`).join('')}</div>
              <div class="axis"><span>0 Uhr</span><span>12 Uhr</span><span>23 Uhr</span></div></div>
            <div class="chart"><h3>Art der Aufnahmen</h3>${kinds.map(([n, v]) => hb(n, v, maxK)).join('')}</div>
            <div class="chart"><h3>Ausdrucke</h3>${hb('Gedruckt', prints, Math.max(1, limit || prints))}${limit ? hb('Drucklimit', limit, limit) + `<p style="font-size:13px;color:#555;margin:8px 0 0">Noch ${Math.max(0, limit - prints)} von ${limit} Ausdrucken übrig.</p>` : '<p style="font-size:13px;color:#555;margin:8px 0 0">Kein Drucklimit eingestellt.</p>'}</div>
          </div>`}`;
      },
      // Shares: alle hochgeladenen Dateien als Liste (mit CSV-Export)
      shares() {
        loadGallery(); const f = sub.shareKind || 'all', P = (gal.list || []).filter(x => f === 'all' || (f === 'video' ? x.kind === 'video' : f === 'gif' ? x.kind === 'gif' : x.kind === 'photo'));
        return `<button class="backl" data-a="go" data-pg="dash">${ICON('chevronLeft', 14)} Zurück zum Dashboard</button>
          <div class="between" style="max-width:1120px;padding:0 0 12px"><div class="row"><h1 style="margin:0">Shares</h1>
            <select data-sub="shareKind" style="width:auto"><option value="all" ${f === 'all' ? 'selected' : ''}>Alle Shares</option><option value="photo" ${f === 'photo' ? 'selected' : ''}>Fotos</option><option value="gif" ${f === 'gif' ? 'selected' : ''}>GIFs</option><option value="video" ${f === 'video' ? 'selected' : ''}>Videos</option></select></div>
            <button class="ghost" data-a="shares-csv" ${P.length ? '' : 'disabled'}>${ICON('download', 15)} CSV</button></div>
          ${gal.error ? `<div class="dempty">${esc(gal.error)}</div>` : !gal.list ? '<div class="dempty">Lädt …</div>'
            : P.length ? `<table class="shares"><thead><tr><th>Datum</th><th>Art</th><th>Datei</th><th>Größe</th><th></th></tr></thead><tbody>${P.slice(0, 500).map(x => `<tr><td>${esc(new Date(x.created_at).toLocaleString('de-DE'))}</td><td>${kindName(x)}</td><td>${esc(x.name || '')}</td><td>${Math.round((x.bytes || 0) / 1024)} KB</td><td><a href="${esc(galUrl(x.path))}" target="_blank" rel="noopener">Öffnen</a></td></tr>`).join('')}</tbody></table>`
            : '<div class="dcard" style="max-width:1120px;text-align:center;color:#555">Für dieses Ereignis wurden keine Shares gefunden.</div>'}`;
      },
      dash() {
        const devs = (ctx.devices || []).filter(d => d.event_id === ev.id);
        const prints = devs.reduce((n, d) => n + (d.status?.prints || 0), 0), P = gal.list || [];
        loadGallery();
        const link = shareLink(), n = v => gal.list ? v : '…', sessions = P.filter(x => !isExtra(x)).length;
        const act = (a, ic, label, extra = '') => `<button data-a="${a}" ${extra}>${ICON(ic, 26)}<span>${label}</span></button>`;
        return `<h1>Dashboard</h1>
          <div class="evhead"><input type="text" data-e="name" value="${esc(E.name)}" size="${Math.max(8, Math.min(40, (E.name || '').length + 1))}" title="Name des Ereignisses ändern"><span class="sep"></span><input type="date" data-e="event_date" value="${E.event_date || ''}" title="Datum ändern"></div>
          <div class="dcards split">
            <div class="dcard"><div class="nums"><span>Sitzungen<b>${n(sessions)}</b></span><span>Bilder<b>${n(P.filter(x => x.kind !== 'video').length)}</b></span><span>Videos<b>${n(P.filter(x => x.kind === 'video').length)}</b></span></div>
              <div class="foot"><span></span><button class="more" data-a="go" data-pg="analytics">Analysen →</button></div></div>
            <div class="dcard"><div class="nums"><span>Uploads<b>${n(P.length)}</b></span><span>Ausdrucke<b>${prints}</b></span><span>Gäste-Daten<b>${ctx.leadsCount?.(ev.id) ?? '–'}</b></span><span>Fotoboxen<b>${devs.length}</b></span></div>
              <div class="foot"><span>${n(P.length)} Shares insgesamt</span><button class="more" data-a="go" data-pg="shares">Shares →</button></div></div>
            <div class="dcard boxes"><b class="dt">Zugewiesene Fotoboxen</b>${devs.length ? devs.map(d => `<div class="between"><span>📸 ${esc(d.name || 'FotoBox')}${d.status?.uploads ? ` <small style="display:inline">· ${d.status.uploads} Foto(s) warten auf den Upload</small>` : ''}</span><small>${d.last_seen && Date.now() - new Date(d.last_seen) < 18e4 ? '🟢 online' : 'offline'}</small></div>`).join('')
            : '<p style="color:#777">Noch keine. In der FotoBox anmelden und dieses Event auswählen – oder oben unter „Geräte“ zuweisen.</p>'}</div>
            <div class="dcard share"><b class="dt">Online-Galerie</b>
              ${sw('x.gallery.link', 'Freigabe von Links', 'Jeder mit dem Link zum Ereignis darf dieses Ereignis sehen')}
              ${!link ? '<p style="color:#b26a00;font-size:13px;margin:4px 0 0">Der Freigabe-Link ist auf dem Server noch nicht eingerichtet.</p>'
                : `<div class="linkbox"><input type="text" readonly value="${S.x.gallery.link ? esc(link) : 'Der Ereignis-Link ist deaktiviert.'}" onclick="this.select()"><button class="ghost" data-a="gal-copy" title="Link kopieren">${ICON('copy', 15)}</button>${S.x.gallery.link ? `<a class="ghost" href="${esc(link)}" target="_blank" rel="noopener" title="Galerie öffnen" style="text-decoration:none">${ICON('share', 15)}</a>` : ''}</div>`}
              ${sw('x.share.cloud', 'Fotos hochladen', 'Die Fotobox lädt jedes fertige Foto in diese Galerie')}
              ${sw('x.gallery.downloadAll', 'Alle herunterladen', 'Ermöglichen Sie Besuchern, alle Inhalte des Ereignisses herunterzuladen')}
              ${sw('x.gallery.guests', 'Gastzugriff ' + NEEDSRV_S, 'Erlauben Sie Gästen, Bilder und Videos anderer Gäste zu sehen')}
              <div class="pw">${text('x.gallery.password', 'Passwort', 'leer = kein Passwort')}<small>Gäste müssen dieses Passwort eingeben, um das Ereignis anzusehen. Lassen Sie das Feld leer, um das Passwort zu deaktivieren.</small></div></div>
          </div>
          <div class="dacts">
            ${act('gal-zip', 'download', 'Alle herunterladen', P.length ? '' : 'disabled')}${act('gal-upload', 'upload', 'Hochladen')}${act('gal-embed', 'copy', 'Einbetten', link ? '' : 'disabled')}
            <button data-a="go" data-pg="analytics">${ICON('sliders', 26)}<span>Analysen</span></button>${act('gal-slide', 'play', 'Slideshow')}
            <button data-a="go" data-pg="shares">${ICON('share', 26)}<span>Shares</span></button>${act('gal-reload', 'refresh', 'Aktualisieren')}${act('delev', 'trash', 'Ereignis löschen')}
          </div>
          ${sub.embed && link ? `<div class="embed"><b>Einbetten</b><div style="font-size:13px;color:#555;margin-top:4px">Diesen Baustein auf deiner Internetseite einfügen, dann erscheint dort die Galerie dieses Ereignisses (nur wenn „Freigabe von Links“ eingeschaltet ist).</div>
            <textarea rows="3" readonly onclick="this.select()">&lt;iframe src="${esc(link)}" style="width:100%;height:900px;border:0" loading="lazy"&gt;&lt;/iframe&gt;</textarea></div>` : ''}
          ${gal.error ? `<div class="dempty">${esc(gal.error)}</div>`
            : !gal.list ? '<div class="dempty">Lädt …</div>'
            : P.length ? `<div class="gal wide">${P.map((x, i) => `<figure data-a="gal-open" data-i="${i}" title="${esc(new Date(x.created_at).toLocaleString('de-DE'))}"><img loading="lazy" src="${esc(galUrl(x.thumb || x.path))}" alt="">${x.kind !== 'photo' ? `<span class="tag">${x.kind === 'video' ? 'Video' : 'GIF'}</span>` : ''}</figure>`).join('')}</div>`
            : `<div class="dempty">Noch keine Fotos oder Videos.<br><small style="font-size:15px">${S.x.share.cloud ? 'Die Galerie füllt sich, sobald an der Fotobox Sitzungen durchgeführt werden.' : 'Schalte rechts oben „Fotos hochladen“ ein – dann füllt sich die Galerie, sobald an der Fotobox Sitzungen durchgeführt werden.'}</small></div>`}`;
      },
      layout() {
        const sel = S.layouts.find(l => l.id === sub.laySel), F = sel && FBR.FORMATS[sel.format];
        const inch = F ? (F.in || [sel.w / 300, sel.h / 300]).map(n => String(n).replace('.', ',') + ' in').join(' x ') : '';
        return `<h1>Photo booth experience</h1>${tabs('layout', [['layouts', 'Photo layout'], ['countdown', 'Countdown']])}<div class="cols"><div class="left">
          <section id="sec-layout-layouts"></section><h2>Fotolayout</h2><div class="card"><div style="margin-bottom:12px">Wird für Foto- oder Drucksitzungen verwendet</div>
            ${layoutCards()}${S.layouts.length > 1 ? sw('guestLayouts', 'Gäste wählen das Layout', 'Bei mehreren Layouts wählen die Gäste vor der Aufnahme') : ''}
            ${sw('gifFromPhotos', 'Auch ein GIF aus den Fotos erstellen')}</div>
          <section id="sec-layout-countdown"></section><h2>Countdown</h2><div class="card">${slider('countdown', 'Countdown vor Foto 1', 1, 10)}${slider('countdownNext', 'Countdown vor weiteren Fotos', 1, 10)}${slider('between', 'Anzeigedauer des Fotos', 0, 10, .5)}</div></div>
          ${sel ? `<div class="pv"><div class="frame"><div style="position:relative;text-align:center;background:#f6f6f9;border:1px solid #eee;border-radius:8px"><img id="wsLayImg" src="${layoutThumb(sel, 760)}" alt="" style="max-width:100%;max-height:58vh;display:inline-block;vertical-align:top">
            <small style="position:absolute;right:8px;bottom:8px;background:rgba(255,255,255,.92);border-radius:6px;padding:3px 8px;color:#333">${inch} | ${sel.w}px x ${sel.h}px</small></div>
            <div class="row" style="margin-top:12px"><button class="btn pri" style="flex:1" data-a="editlay" data-id="${sel.id}">${ICON('pen', 15)} Bearbeiten</button><button class="ghost" style="flex:1" data-a="sharelay" data-id="${sel.id}">${ICON('share', 15)} Vorschau teilen</button></div></div></div>` : ''}</div>`;
      },
      capture() {
        sub.mode ||= 'photo';
        const M = [['photo', 'camera', 'Foto', 'single'], ['gif', 'film', 'GIF', 'gif'], ['boom', 'repeat', 'Boomerang', 'boomerang'], ['slowmo', 'repeat', '360/Video in Zeitlupe', ''], ['video', 'video', 'Video', 'video']];
        const photoOn = S.modes.single || S.modes.strip || S.modes.grid || S.layouts.length;
        const isOn = (k, key) => k === 'photo' ? photoOn : k === 'slowmo' ? S.x.slowmo.enabled : S.modes[key];
        const sizes = [['720p-16:9', 'Rechteck 720p 16:9'], ['1080p-16:9', 'Rechteck 1080p 16:9'], ['720p-9:16', 'Hochformat 720p 9:16'], ['1080p-9:16', 'Hochformat 1080p 9:16'], ['square-720', 'Quadrat 720 1:1'], ['square-1080', 'Quadrat 1080 1:1']];
        const body = sub.mode === 'photo' ? `<div class="card">${sw('modes.single', 'Fotomodus aktivieren', 'Nehmen Sie Fotos für den Druck oder die digitale Weitergabe auf')}
              <p style="color:#777;font-size:13px">Das Aussehen der Ausdrucke legst du unter „Photo booth experience → Fotolayout“ fest.</p>
              ${!S.layouts.length ? `${sw('modes.strip', 'Standard-Fotostreifen anbieten')}${sw('modes.grid', 'Standard-Collage anbieten')}` : ''}</div>
            <h2>Countdown</h2><div class="card">${slider('countdown', 'Countdown vor Foto 1', 0, 30)}${slider('countdownNext', 'Countdown vor weiteren Fotos', 0, 30)}${slider('between', 'Anzeigedauer des Fotos', 0, 30)}</div>`
          : sub.mode === 'gif' ? `<div class="card">${sw('modes.gif', 'GIF-Modus aktivieren', 'Nehmen Sie Fotos auf, um ein GIF zu erstellen')}</div>
            <h2>Allgemein ${NEWAPP}</h2><div class="card">${sel('x.gif.size', 'Ausgabegröße', sizes)}${sw('x.gif.reverse', 'Umgekehrt', 'GIF in einer Schleife vorwärts und rückwärts abspielen')}</div>
            <h2>Bilder zum Überlagern ${NEWAPP}</h2><div class="card">${upList('x.gif.overlays', 'image/png', 'Overlay hinzufügen (PNG mit Transparenz)')}</div>
            <h2>Anzahl der Fotos</h2><div class="card">${slider('gifFrames', 'Anzahl der aufzunehmenden Fotos', 2, 20, 1, 'Fotos')}${slider('x.gif.delay', 'Abstand zwischen den Aufnahmen', 50, 500, 10, 'ms')} ${NEWAPP}
              <p style="color:#777;font-size:13px">Startet ein Gast eine Fotosession, entspricht die Anzahl der Fotos stattdessen dem Drucklayout.</p></div>`
          : sub.mode === 'boom' ? `<div class="card">${sw('modes.boomerang', 'Boomerang aktivieren', 'Kurzer Clip, der vor und zurück läuft')}<label class="l">Länge</label><select data-s="boomerangLen">${['kurz', 'mittel', 'lang'].map(n => `<option ${S.boomerangLen === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`
          : sub.mode === 'slowmo' ? `<div class="card">${sw('x.slowmo.enabled', '360/Slow-mo-Modus aktivieren', 'Nehmen Sie 360-Grad- oder Zeitlupenaufnahmen auf')} ${NEWAPP}</div>
            <h2>Allgemein</h2><div class="card">${slider('x.slowmo.countdown', 'Countdown', 0, 30)}${slider('x.slowmo.quality', 'Ausgabequalität', 1, 8, 1, 'mbps')}
              ${sw('x.slowmo.motion', 'Bei Bewegungserkennung aufnehmen', 'Aufnahme starten, wenn sich das Gerät bewegt')}${sw('x.slowmo.flash', 'Blitz während der Aufnahme blinken lassen')}${sw('x.slowmo.saveOriginal', 'Originalvideo speichern')}
              ${sw('x.slowmo.preTextOn', 'Text vor der Aufnahme anzeigen')}${text('x.slowmo.preText', 'Text', 'Bereit machen')}</div>
            <h2>Video-Timeline</h2><div class="card">${slider('x.slowmo.length', 'Aufnahmelänge', 1, 15)}${sw('x.slowmo.reverse', 'Video umkehren', 'Erst vorwärts, dann rückwärts abspielen')}
              ${slider('x.slowmo.clipLen', 'Länge der Clip-Aufnahme', .5, 2, .5, 's')}${sel('x.slowmo.speed', 'Clip-Geschwindigkeit', [['0.25x', '0,25x'], ['0.5x', '0,5x'], ['1x', '1x'], ['2x', '2x']])}</div>
            <h2>Soundtracks</h2><div class="card">${upList('x.slowmo.soundtracks', 'audio/mpeg', 'Soundtrack hinzufügen (MP3, max. 3 MB)')}</div>
            <h2>Overlays</h2><div class="card">${sel('x.slowmo.size', 'Ausgabegröße', sizes)}${upList('x.slowmo.overlays', 'image/png', 'Overlay hinzufügen (PNG)')}</div>
            <h2>Intro/Outro</h2><div class="card">${up('x.slowmo.intro', 'Intro-Video', 'video/mp4', 'MP4, max. 15 MB, 1280×720')}${up('x.slowmo.outro', 'Outro-Video', 'video/mp4', 'MP4, max. 15 MB, 1280×720')}</div>`
          : `<div class="card">${sw('modes.video', 'Videomodus aktivieren', 'Nehmen Sie ein Video mit Ton auf')}</div>
            <h2>Allgemein</h2><div class="card">${slider('x.video.countdown', 'Countdown', 0, 30)}${slider('x.video.quality', 'Ausgabequalität', 1, 8, 1, 'mbps')}${slider('videoSecs', 'Aufnahmedauer', 1, 60, 1)}
              ${sw('videoAudio', 'Ton aufnehmen')}${sw('x.video.saveOriginal', 'Originalvideo speichern')}${sw('x.video.preTextOn', 'Text vor der Aufnahme anzeigen')}${text('x.video.preText', 'Text', 'Bereit machen')}</div>
            <h2>Bild zum Überlagern ${NEWAPP}</h2><div class="card">${sel('x.video.size', 'Ausgabegröße', sizes)}${upList('x.video.overlays', 'image/png', 'Overlay hinzufügen (PNG)')}</div>
            <h2>Intro/Outro ${NEWAPP}</h2><div class="card">${up('x.video.intro', 'Intro-Video', 'video/mp4', 'MP4, max. 15 MB, 1280×720')}${up('x.video.outro', 'Outro-Video', 'video/mp4', 'MP4, max. 15 MB, 1280×720')}</div>`;
        return `<h1>Aufnahmeeinstellungen</h1><div class="cols"><div class="left">
          <div class="modes">${M.map(([k, ic, n, key]) => `<div class="mode ${sub.mode === k ? 'on' : ''}" data-mode="${k}"><span class="ic">${ICON(ic, 22)}</span>${n}<span class="dot ${isOn(k, key) ? 'a' : ''}"></span></div>`).join('')}</div>
          ${body}
          <h2>Spiegeln</h2><div class="card">${sw('mirror', 'Gespiegelte Live-Ansicht')}${sw('mirrorPhoto', 'Aufgenommene Fotos und Videos spiegeln', 'Spiegelt das gespeicherte und gedruckte Ergebnis')}${sw('cropLive', 'Live-Ansicht auf das Fotofeld zuschneiden')}</div>
        </div>${previewBox()}</div>`;
      },
      voice() {
        const step = (k, label, accept, hint, list) => `<h2>${label}</h2><div class="card">${list ? `${sw('x.voice.random' + k, 'Randomisieren', 'Bei mehreren Dateien zufällig eine abspielen')}${upList('x.voice.files.' + k, accept, 'Datei hinzufügen (' + hint + ')')}` : up('x.voice.files.' + k, '', accept, hint)}</div>`;
        return `${titleSw('Virtueller Berater', 'voice')}<p style="margin:-6px 0 14px;color:#6b6b78">Leiten Sie Ihre Gäste mit Videoanimationen und Audioansagen an</p>
          <div class="card">${sel('x.voice.style', 'Stil', [['de-frau', 'Audio – Deutsche Stimme (Frau)'], ['de-mann', 'Audio – Deutsche Stimme (Mann)'], ['en-frau', 'Audio – Englische Stimme (Frau)'], ['custom', 'Eigene Dateien']])}
            <p style="color:#777;font-size:13px">Eigene Dateien pro Schritt ersetzen die Standardansage. ${NEWAPP}</p></div>
          ${step('start', 'Startbildschirm', 'video/mp4', 'nur MP4, max. 50 MB')}${step('effect', 'Wählen Sie einen Effekt aus', 'video/mp4,audio/mpeg', 'MP4 oder MP3, max. 50 MB')}
          ${step('countdown', 'Countdown', 'video/mp4', 'nur MP4, max. 50 MB')}${step('before', 'Vor dem Countdown', 'video/mp4,audio/mpeg', 'MP4 oder MP3', true)}
          ${step('after', 'Nach der Aufnahme', 'video/mp4,audio/mpeg', 'MP4 oder MP3', true)}${step('signature', 'Vor der Unterschrift', 'video/mp4,audio/mpeg', 'MP4 oder MP3')}
          ${step('processing', 'Während der Verarbeitung', 'video/mp4,audio/mpeg', 'MP4 oder MP3')}${step('done', 'Nach der Verarbeitung', 'video/mp4,audio/mpeg', 'MP4 oder MP3')}`;
      },
      start() {
        // Je Ausrichtung ein eigenes Video oder Bild; ein älterer einzelner Upload (attractUrl) gilt für beide
        const slot = o => {
          const m = o === 'landscape' ? S.attractL : S.attractP, legacy = !m?.url && !!S.attractUrl, cur = m?.url ? m : legacy ? { url: S.attractUrl, type: S.attractType } : null, F = FBR.SCREEN_SIZES[o];
          return `<div class="between" style="padding:9px 0;border-bottom:1px solid #eee;gap:10px"><div><b>${F.label}</b> <small style="display:inline;color:#888">${F.w} × ${F.h}</small><br>
            <small style="color:#555">${cur ? (cur.type === 'image' ? '🖼 Bild' : '🎬 Video') + ' · ' + esc(fileName(cur.url)) + (legacy ? ' – gilt für beide Ausrichtungen' : '') : 'noch nichts hochgeladen'}</small></div>
            <div class="row">${cur ? `<a class="ghost" href="${esc(cur.url)}" target="_blank" rel="noopener" style="text-decoration:none">Ansehen</a><button class="ghost" data-a="delattract" data-o="${o}" title="Entfernen">${ICON('trash', 14)}</button>` : ''}
            <button class="${cur ? 'ghost' : 'btn pri'}" data-a="upattract" data-o="${o}">${ICON('upload', 15)} ${cur ? 'Ersetzen' : 'Hochladen'}</button></div></div>`;
        };
        const has = !!(S.attractP?.url || S.attractL?.url || S.attractUrl);
        return `<h1>Startbildschirm</h1><div class="cols"><div class="left">
          <h2>1 · Eigenes Video oder Bild</h2><div class="card">
          <p style="color:#6b6b78;margin:0 0 6px">Läuft auf dem Startbildschirm in Endlosschleife – ein Tipp darauf startet die Fotobox. Die Fotobox erkennt selbst, ob ihr Bildschirm hoch oder quer steht, und nimmt das passende. Ist nur eins hochgeladen, gilt es für beide.</p>
          ${slot('portrait')}${slot('landscape')}
          <p style="color:#777;font-size:12.5px;margin:8px 0 0">MP4-Video oder JPG/PNG-Bild · höchstens 50 MB · Tipp: In Canva oder CapCut gibt es fertige Vorlagen für Hochzeit, Geburtstag und Firmenfeier.</p>
          ${has ? `<label class="l">Auf dem Startbildschirm zeigen</label><select data-s="startDisplay"><option value="media" ${S.startDisplay === 'media' ? 'selected' : ''}>Mein Video bzw. Bild</option><option value="live" ${S.startDisplay !== 'media' ? 'selected' : ''}>Live-Bild der Kamera</option></select>` : ''}</div>
          <h2>2 · Texte und Logo darüberlegen <span style="font-weight:400;color:#888;font-size:14px">(freiwillig)</span></h2><div class="card">
          <p style="color:#6b6b78;margin:0 0 12px">Name, Datum, Logo und Start-Knopf frei anordnen – wie beim Fotolayout. Gestaltest du nur eine Ausrichtung, passt die Fotobox sie für die andere automatisch an; du kannst beide aber auch einzeln gestalten.</p>
          <div class="row" style="flex-wrap:wrap"><button class="btn pri" data-a="editscreen" data-o="portrait">${ICON('pen', 16)} Hochformat gestalten</button><button class="btn pri" data-a="editscreen" data-o="landscape">${ICON('pen', 16)} Querformat gestalten</button>${S.startScreen ? `<button class="ghost" data-a="resetscreen">Zurücksetzen</button>` : ''}</div>
          ${S.startScreen ? '' : '<p style="color:#6b6b78;font-size:13px;margin-top:10px">Noch nicht gestaltet – die Fotobox zeigt bis dahin den einfachen Standard-Startbildschirm.</p>'}
          <p style="font-size:13px;margin-top:10px">${NEWAPP}</p></div>
          <h2>Angaben zum Ereignis</h2><div class="card"><p style="color:#6b6b78;font-size:13px;margin-bottom:6px">Diese Angaben erscheinen überall, wo {titel} und {untertitel} stehen – auf dem Startbildschirm und auf den Ausdrucken.</p>
          ${text('title', 'Titel', E.name)}${text('subtitle', 'Untertitel / Datum')}
          <label class="l">Logo</label><div class="row">${E.logo_url ? `<img src="${esc(E.logo_url)}" style="height:50px;border-radius:6px"><button class="ghost" data-a="dellogo">Entfernen</button>` : ''}<button class="ghost" data-a="uplogo">${ICON('upload', 15)} Logo hochladen</button></div></div>
          </div>${startPreview()}</div>`;
      },
      fx() {
        return `<h1>Filter & Effekte</h1>${tabs('fx', [['beauty', 'Schönheitsfilter'], ['color', 'Farbfilter'], ['sticker', 'Aufkleber']])}
          ${allTabs('fx', () => sub.fx === 'beauty' ? `${titleSw('Schönheitsfilter', 'beauty')}<div class="card">Tragen Sie einen Schönheitsfilter auf, um die Haut zu glätten und Schönheitsfehler zu entfernen.${slider('beautyStrength', 'Stärke', 0, 100, 5, '%')}</div>`
          : sub.fx === 'color' ? `${titleSw('Farbfilter', 'filtersOn')}<div class="card">Wenden Sie einen Farbfilter an, um Töne zu verändern und Farben anzupassen.
              <label class="l">Filter</label><div class="row">${[['auto', 'Automatisch durchwechseln'], ['guest', 'Gäste wählen den Filter']].map(([k, n]) => `<label class="row" style="gap:6px"><input type="radio" name="fxm" data-s="x.fx.mode" value="${k}" ${S.x.fx.mode === k ? 'checked' : ''}> ${n}</label>`).join('')}</div>
              <div class="filters" style="margin-top:12px">${FILTERS.map(([id, n, css]) => `<div class="flt ${S.filters.includes(id) ? 'on' : ''}" data-flt="${id}"><img src="${filterThumb(css)}"><span>${n}</span></div>`).join('')}</div>
              <div class="between" style="margin-top:8px"><small style="color:#6b6b78">${ai.own ? 'Vorschau mit deinem eigenen Testfoto' : 'Vorschau mit dem Standard-Testfoto'}</small><span>${ai.own ? '<a href="#" data-a="ai-photo-reset">Standardbild</a> · ' : ''}<a href="#" data-a="ai-photo">Bild ändern</a></span></div>
              <div style="margin-top:14px">${up('x.fx.lut', 'Eigener Farb-Look (LUT) ' + NEWAPP, '.cube', 'nur .cube-Dateien')}</div></div>`
          : `${titleSw('Aufkleber', 'stickers')}<div class="card">Lassen Sie Ihre Gäste ihre Fotos mit lustigen Aufklebern verzieren.
              <label class="l">Aufkleberstil</label><div class="row">${[['standard', 'Standard'], ['custom', 'Benutzerdefinierte']].map(([k, n]) => `<label class="row" style="gap:6px"><input type="radio" name="stm" data-s="x.fx.stickerStyle" value="${k}" ${S.x.fx.stickerStyle === k ? 'checked' : ''}> ${n}</label>`).join('')}</div>
              ${S.x.fx.stickerStyle === 'custom' ? upList('x.fx.stickers', 'image/png', 'Aufkleber hinzufügen (PNG mit Transparenz)') + ' ' + NEWAPP : ''}</div>`)}`;
      },
      bg() {
        return `<h1>Hintergrundentfernung <label class="sw"><input type="checkbox" data-a="bgon" ${S.bgMode !== 'off' ? 'checked' : ''}><i></i></label><span class="swl">${S.bgMode !== 'off' ? 'Ein' : 'Aus'}</span></h1><div class="card"><b>Ersetzen Sie den Hintergrund Ihrer Fotos</b>
          <label class="l">Modus</label><div class="row">${[['ai', 'KI-Hintergrundentfernung'], ['green', 'Greenscreen']].map(([k, n]) => `<label class="row" style="gap:6px"><input type="radio" name="bgm" data-rerender="1" data-s="bgMode" value="${k}" ${S.bgMode === k ? 'checked' : ''}> ${n}</label>`).join('')}</div>
          ${S.bgMode === 'green' ? slider('x.bg.smooth', 'Glättung ' + NEWAPP, 1, 15, 1, '') + slider('keyStrength', 'Empfindlichkeit', 0, 100, 1, '') : ''}
          <label class="l">Hintergründe</label><div class="row">${[[false, 'Automatisch durchwechseln'], [true, 'Gäste wählen das Hintergrundbild']].map(([k, n]) => `<label class="row" style="gap:6px"><input type="radio" name="bgc" data-a="bgchoice" data-v="${k ? 1 : 0}" ${!!S.bgGuestChoice === k ? 'checked' : ''}> ${n}</label>`).join('')}</div>
          <div class="thumbs">${(S.bgUrls || []).map((u, i) => `<div><img src="${esc(u)}"><button data-a="delbg" data-i="${i}">✕</button></div>`).join('')}</div>
          <button class="ghost" data-a="upbg" style="margin-top:10px">${ICON('upload', 15)} Bild hochladen (JPG/PNG, max. 10 MB, empfohlen 1800×1200)</button></div>`;
      },
      ai() {
        const central = S.ai.connection === 'central';
        if (ai.lib === null) aiLibLoad();
        if (central) Promise.resolve(ctx.sb.from('ai_wallets').select('balance').eq('owner_id', ctx.me.id).maybeSingle()).then(({ data, error }) => {
          const el = main.querySelector('[data-ai-bal]'); if (el) el.textContent = error ? 'Guthaben nicht abrufbar' : (data?.balance || 0) + ' Credits';
        });
        const pp = aiFind(AI_MOTIFS, ai.p), aa = aiFind(AI_ARTS, ai.a), editing = ai.edit >= 0 ? S.ai.prompts[ai.edit] : null;
        const libEditing = ai.libEdit && Array.isArray(ai.lib) ? ai.lib.find(x => x.id === ai.libEdit) || null : null; // Stil aus „Meine KI-Stile“ wird bearbeitet
        // Eigener Text: bei zentraler KI erst speichern, wenn dafür ein Bild erzeugt wurde – so hat jede eigene Kachel ein Bild.
        const hasResult = !!(ai.result && !ai.busy && ai.resultId && ai.resultId === (ai.custom ? (ai.edit >= 0 && !S.ai.prompts[ai.edit].id.startsWith('lib-') ? S.ai.prompts[ai.edit].id : ai.draftId) : (pp || aa) ? aiCompose(pp, aa).id : ''));
        const canSave = !ai.busy && (ai.custom ? (!central || hasResult || !!editing) : !!(pp || aa));
        const curId = ai.custom ? (editing && !editing.id.startsWith('lib-') ? editing.id : ai.draftId) : (pp || aa) ? aiCompose(pp, aa).id : ''; // Entwurf, zu dem ein Testbild gehören kann
        const slot = (k, x, label) => x
          ? `<div class="aislot set" data-a="ai-pick" data-k="${k}">${aiTile(x)}<div><small>${label}</small><b>${esc(x.name)}</b></div><span class="x" data-a="ai-clear" data-k="${k}">✕</span></div>`
          : `<button class="aislot" data-a="ai-pick" data-k="${k}"><span style="font-size:22px">+</span><div><b>${label}</b><small>aus der Bibliothek wählen</small></div></button>`;
        const list = ai.pick === 'a' ? AI_ARTS : AI_MOTIFS, cats = [...new Set(list.map(x => x.cat))];
        const modal = !ai.pick ? '' : `<div class="aimodal"><div><div class="mh"><b>${ai.pick === 'a' ? 'Kunststil' : 'Porträtstil'} auswählen</b><input type="search" placeholder="Stile suchen …" data-ai-search><button class="ghost" data-a="ai-close">✕</button></div>
          <div class="aichips"><button data-a="ai-cat" data-c="" class="${ai.cat ? '' : 'on'}">Alle</button>${cats.map(c => `<button data-a="ai-cat" data-c="${esc(c)}" class="${ai.cat === c ? 'on' : ''}">${esc(c)}</button>`).join('')}</div>
          <div class="body">${cats.filter(c => !ai.cat || ai.cat === c).map(c => `<h4>${esc(c)}</h4><div class="aitiles">${list.filter(x => x.cat === c).map(x => `<button data-a="ai-choose" data-k="${x.key}" data-n="${esc(x.name.toLowerCase())}" class="${ai[ai.pick] === x.key ? 'on' : ''}">${aiTile(x)}<b>${esc(x.name)}</b></button>`).join('')}</div>`).join('')}</div></div></div>`;
        const right = `<div class="card"><div class="aiphoto">${ai.busy ? '<div class="aiwait">KI-Porträt wird erstellt …<br><small>Das dauert meist 10–40 Sekunden.</small></div>'
            : ai.result ? `<div class="aipair" style="padding:10px"><figure class="src"><img src="${ai.photo}" alt="">Testfoto</figure><span class="arrow">→</span><figure class="out"><img src="${ai.result}" alt="" data-a="ai-zoom" title="Anklicken zum Vergrößern" style="cursor:zoom-in">Ergebnis · zum Vergrößern anklicken</figure></div>`
            : ai.photo ? `<img src="${ai.photo}" alt="Testfoto">` : '<div class="ph" data-a="ai-photo"><div style="font-size:34px">📷</div><b>Testfoto hochladen</b><br><small>Ein eigenes Foto, um Stile auszuprobieren. Es bleibt in diesem Browser.</small></div>'}</div>
          <div class="between" style="margin-top:10px"><small>${ai.own ? 'Eigenes Testfoto' : 'Standard-Testfoto'}</small><span>${ai.own ? '<a href="#" data-a="ai-photo-reset">Standardbild</a> · ' : ''}<a href="#" data-a="ai-photo">${ai.photo ? 'Bild ändern' : 'Bild wählen'}</a></span></div>
          <button class="ghost" style="width:100%;margin-top:10px" data-a="ai-test" ${(ai.custom || pp || aa) && !ai.busy ? '' : 'disabled'}>${ai.custom || pp || aa ? `✨ Generieren${central ? ` <small>(1 Credit)</small>` : ''}` : 'Wähle einen Stil aus oder füge einen hinzu, um zu generieren'}</button>
          ${central ? `<label style="display:flex;gap:8px;align-items:flex-start;margin-top:8px;font-size:13px"><input type="checkbox" data-ai-consent style="margin-top:3px" ${ai.consentOk ? 'checked' : ''}> Dieses Foto darf zum Testen an den KI-Dienst (xAI) übertragen werden.</label>` : ''}
          ${ai.result && !ai.busy && (editing || libEditing) ? `<button class="btn pri" style="width:100%;margin-top:8px" data-a="ai-set-thumb">🖼 Als Bild für „${esc((editing || libEditing).name)}“ übernehmen</button>` : ''}
          ${ai.result && !ai.busy && !libEditing ? '<button class="ghost" style="width:100%;margin-top:8px" data-a="ai-lib-result">☆ In „Meine KI-Stile“ speichern</button>' : ''}
          ${ai.recent.length ? `<small style="display:block;margin-top:10px">Letzte Generierungen</small><div class="airecent">${ai.recent.map((r, n) => `<img src="${r.image}" title="${esc(r.name)}" data-a="ai-recent" data-i="${n}">`).join('')}</div>` : ''}</div>
          <div class="card"><div class="aibar">${central
            ? `<span>KI-Guthaben:</span><span class="bal" data-ai-bal>…</span><small>1 Credit pro Bild</small><span class="sp" style="flex:1"></span><button class="ghost" data-a="ai-status">Verbindung prüfen</button>`
            : `<span>Eigener API-Schlüssel auf der Fotobox · ${({ grok: 'Grok (xAI)', openai: 'OpenAI', gemini: 'Google Gemini' })[S.ai.provider]}</span>`}</div></div>`;
        const lib = ai.lib;
        const libCard = `<div class="card"><b>Meine KI-Stile${Array.isArray(lib) ? ` (${lib.length})` : ''}</b><p style="margin:4px 0 0;color:#6b6b78;font-size:13px">Deine gesammelten Stile mit Bild – für jedes Event. Antippen übernimmt den Stil in dieses Event, ohne Credits. ✎ = Text ändern und neu generieren.</p>
          ${!lib || lib === 'loading' ? '<p style="color:#6b6b78;font-size:13px">Lädt …</p>' : lib.error ? `<p style="color:#c98a00;font-size:13px">${lib.error === 'setup' ? 'Noch nicht eingerichtet (supabase/migrations/202610170004_ki_stile.sql im SQL Editor ausführen).' : esc(lib.error)}</p>`
            : lib.length ? `<div class="aitiles">${lib.map((x, n) => `<button data-a="ai-lib-use" data-i="${n}" class="${ai.libEdit === x.id ? 'on' : ''}" title="In dieses Event übernehmen">${aiPic('', x.thumb)}${ctx.admin ? `<span class="fav ${x.shared ? 'on' : ''}" data-a="ai-lib-share" data-i="${n}" title="${x.shared ? 'Für alle Kunden freigegeben – antippen zum Zurücknehmen' : 'Für alle Kunden freigeben'}">👥</span>` : ''}<span class="del" data-a="ai-lib-del" data-i="${n}" title="Aus der Sammlung löschen">🗑</span><span class="edit" data-a="ai-lib-edit" data-i="${n}" title="Text ändern und neu generieren">✎</span><b>${esc(x.name)}</b></button>`).join('')}</div>`
            : '<p style="color:#6b6b78;font-size:13px">Noch leer. Speichere ein Testbild mit „In Meine KI-Stile speichern“ oder tippe oben bei einem Stil auf ★.</p>'}
          ${ctx.admin && Array.isArray(lib) && lib.length ? '<p style="color:#6b6b78;font-size:13px;margin-top:8px">👥 = für alle Software-Kunden freigeben. Freigegebene Stile sehen deine Kunden unter „Stile von Photobox Memories“.</p>' : ''}</div>
          ${(ai.common || []).length ? `<div class="card"><b>Stile von Photobox Memories (${ai.common.length})</b><p style="margin:4px 0 0;color:#6b6b78;font-size:13px">Fertige Stile mit Beispielbild. Antippen übernimmt den Stil in dieses Event, ohne Credits. ✎ = als Vorlage für einen eigenen Stil nehmen.</p>
            <div class="aitiles">${ai.common.map((x, n) => `<button data-a="ai-lib-use" data-common="1" data-i="${n}" title="In dieses Event übernehmen">${aiPic('', x.thumb)}<span class="edit" data-a="ai-common-edit" data-i="${n}" title="Als Vorlage für einen eigenen Stil nehmen">✎</span><b>${esc(x.name)}</b></button>`).join('')}</div></div>` : ''}`;
        return `${titleSw('KI-Porträts', 'ai.enabled')}<p class="sub" style="margin:-6px 0 14px;color:#6b6b78">Verwandle deine Gäste mit generativer KI</p><div class="aigrid"><div class="left">
          <div class="card" data-ai-builder>${ai.custom ? '<p style="margin:0 0 6px"><a href="#" data-a="ai-new">← Zurück zu den Vorgaben</a></p>' : ''}<b>${editing ? 'Vorgabe bearbeiten: ' + esc(editing.name) : libEditing ? 'Meinen KI-Stil bearbeiten: ' + esc(libEditing.name) : ai.custom ? 'Benutzerdefinierter Prompt' : 'Vorgabe erstellen'}</b>
          ${editing || libEditing ? '<p class="small" style="margin:6px 0 0;color:#6b6b78">Text ändern, rechts neu generieren und speichern. Der Text bleibt danach offen – so kannst du ihn Schritt für Schritt verbessern.</p>' : ''}
          ${ai.custom ? `<label class="l">Name (sehen die Gäste)</label><input type="text" maxlength="60" data-ai-cname value="${esc(ai.cname ?? (ai.seed || editing)?.name ?? '')}" placeholder="z. B. Unser Firmenlook">
            <label class="l">Beschreibung für die KI</label><textarea rows="5" maxlength="1200" data-ai-ctext placeholder="Motiv: was die Gäste werden · Szene: wo sie sind · Stil: wie das Bild aussieht">${esc(ai.ctext ?? ((ai.seed || editing)?.prompt || AI_KEEP))}</textarea>
            <small style="display:block;margin-top:10px"><b>Beispiel ausprobieren</b> · jedes lädt eine andere Kombination</small>
            <div class="aichips" style="margin-top:6px">${aiExamples().map((x, n) => `<button data-a="ai-example" data-i="${n}">${esc(x.name)}</button>`).join('')}</div>`
            : `<div class="aislots">${slot('p', pp, 'Porträtstil')}${slot('a', aa, 'Kunststil')}<button class="aislot" data-a="ai-custom"><span style="font-size:22px">+</span><div><b>Benutzerdefinierter Prompt</b><small>selbst beschreiben</small></div></button></div>
            <small>Wähle einen Porträtstil, einen Kunststil oder beides zusammen. ${pp || aa ? '<a href="#" data-a="ai-custom">Text selbst anpassen</a>' : ''}</small>`}
          ${central && !libEditing ? '<p class="small" style="margin-top:8px;color:#6b6b78">Erst rechts „Generieren“, dann „Vorgabe speichern“: Das erzeugte Bild wird das Bild auf der Kachel. Dieses Bild sieht jeder, der die Stile sieht – nimm ein Testfoto, das gezeigt werden darf.</p>' : ''}
          ${ai.result && !ai.busy && ai.resultId && ai.resultId === curId ? '<p style="margin-top:10px;font-weight:600">' + (editing ? '✓ Bild erstellt. Mit „Änderung speichern“ wird es das Bild auf der Kachel.' : libEditing ? '✓ Bild erstellt. Mit „In Meine KI-Stile speichern“ wird es das neue Bild dieses Stils.' : '✓ Bild erstellt. Mit „Vorgabe speichern“ wird es das Bild auf der Kachel.') + '</p>' : ''}
          <div class="row" style="margin-top:12px">${libEditing ? `<button class="btn pri" style="flex:1" data-a="ai-lib-update" ${ai.busy ? 'disabled' : ''}>In „Meine KI-Stile“ speichern</button><button class="ghost" data-a="ai-new">Fertig</button>`
            : `<button class="btn pri" style="flex:1" data-a="ai-save" ${canSave ? '' : 'disabled'} ${canSave ? '' : 'title="Erst ein Bild generieren, dann speichern"'}>${editing ? 'Änderung speichern' : 'Vorgabe speichern'}</button>${editing ? '<button class="ghost" data-a="ai-new">Fertig</button>' : ''}`}</div></div>
          <div class="card"><b>Vorgefertigte Stile (${S.ai.prompts.length}/15)</b>
          <div class="aitiles"><button data-a="ai-new"><span class="pic" style="background:#fafafc;border:2px dashed #cfcfd8;color:#6b6b78">+</span><b>Neue Vorgabe</b></button>
          ${S.ai.prompts.map((p, i) => `<button data-a="ai-open" data-i="${i}" class="${ai.edit === i ? 'on' : ''}" title="Antippen zum Bearbeiten">${aiPic(p.id, p.thumb)}<span class="num">${i + 1}</span><span class="fav ${aiInLib(p) ? 'on' : ''}" data-a="ai-lib-add" data-i="${i}" title="In „Meine KI-Stile“ speichern">★</span><span class="del" data-a="ai-delete" data-i="${i}" title="Entfernen">🗑</span><span class="edit">✎</span><b>${esc(p.name)}</b></button>`).join('')}</div></div>
          ${libCard}
          <div class="card"><b>An der Fotobox</b>
          ${sw('ai.guestChoice', 'Gäste wählen ihren Stil', 'Aus = alle Fotos bekommen automatisch den Standard-Stil.')}
          <label class="l">Standard-Stil</label><select data-s="ai.selectedId"><option value="">Erster Stil</option>${S.ai.prompts.map(p => `<option value="${esc(p.id)}" ${p.id === S.ai.selectedId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
          <div class="card">${sw('x.ai.skip', 'Option zum Überspringen der KI-Porträts hinzufügen ' + NEWAPP, 'Gäste können ihr Foto auch ohne KI-Stil behalten')}
          ${sw('x.ai.consent', 'Gäste vor dem KI-Porträt um Zustimmung bitten ' + NEWAPP, 'Aus = keine Abfrage an der Fotobox. Das Foto wird trotzdem an den KI-Dienst (xAI, USA) übertragen – die Einwilligung regelst du dann selbst, zum Beispiel im Vertrag mit deinem Kunden oder per Aushang an der Fotobox.')}</div>
          <div class="card"><details class="adv"><summary>Texte für die Gäste anpassen ${NEWAPP}</summary><p style="color:#6b6b78;font-size:13px;margin:8px 0">Diese Texte sehen deine Gäste an der Fotobox, wenn sie ein KI-Porträt erstellen. Du kannst jede Formulierung ändern, zum Beispiel in eine andere Sprache oder in euren Ton.</p><div class="grid3x">
            ${text('x.ai.texts.choose', 'Überschrift der Stilauswahl')}${text('x.ai.texts.chooseBtn', 'Knopf: Stil auswählen')}${text('x.ai.texts.createBtn', 'Knopf: KI-Porträt erstellen')}${text('x.ai.texts.creating', 'Hinweis während der Erstellung')}
            ${text('x.ai.texts.retrying', 'Hinweis beim zweiten Versuch')}${text('x.ai.texts.retryBtn', 'Knopf: erneut versuchen')}${text('x.ai.texts.skipBtn', 'Knopf: ohne KI weiter')}${text('x.ai.texts.failed', 'Meldung, wenn es nicht geklappt hat')}</div></details></div>
          <div class="card"><details class="adv"><summary>Erweitert: Verbindung und Bildqualität</summary>
          <label class="l">KI-Verbindung</label><select data-s="ai.connection" data-rerender="1"><option value="local" ${!central ? 'selected' : ''}>Eigener API-Schlüssel auf der Fotobox</option><option value="central" ${central ? 'selected' : ''}>Photobox Memories · zentrale KI (Credits)</option></select>
          <p>Zentrale KI nutzt das Guthaben des angemeldeten Kontos; auf der Fotobox ist kein eigener Schlüssel nötig.</p>
          ${central ? '' : `<label class="l">Bildanbieter (eigener Zugang)</label><select data-s="ai.provider" data-rerender="1"><option value="grok" ${S.ai.provider === 'grok' ? 'selected' : ''}>Grok (xAI)</option><option value="openai" ${S.ai.provider === 'openai' ? 'selected' : ''}>OpenAI</option><option value="gemini" ${S.ai.provider === 'gemini' ? 'selected' : ''}>Google Gemini</option></select>
          <p>Den passenden API-Schlüssel einmal pro Fotobox unter System hinterlegen. Schlüssel werden nie im Event gespeichert.</p>`}
          <label class="l">Auflösung</label><select data-s="ai.resolution" data-rerender="1"><option value="1k" ${S.ai.resolution === '1k' ? 'selected' : ''}>1K · schneller${central ? ' · 1 Credit' : ''}</option><option value="2k" ${S.ai.resolution === '2k' ? 'selected' : ''}>2K · hohe Auflösung${central ? ' · 1 Credit' : ''}</option></select>
          <p><small>Pro Foto eine KI-Anfrage, Internet erforderlich. Schlägt die KI fehl, erhalten die Gäste einen Hinweis und ihre Originalfotos. Videos, GIFs und Boomerangs bleiben unverändert. Testfotos werden nicht gespeichert.</small></p></details></div></div><div class="right">${right}</div></div>${modal}`;
      },
      survey() {
        const Q = S.x.survey.questions, types = [['short', 'Kurze Antwort'], ['long', 'Lange Antwort'], ['choice', 'Mehrfachauswahl'], ['email', 'E-Mail'], ['phone', 'Telefon']];
        return `<h1>Umfrage & Haftungsausschluss</h1>${tabs('sv', [['survey', 'Umfrage'], ['disc', 'Haftungsausschluss']])}
          ${allTabs('sv', () => sub.sv === 'survey' ? `${titleSw('Umfrage', 'form.enabled')}<div class="card"><b>Stellen Sie Ihren Gästen Fragen, die diese beantworten sollen</b>
              <p style="color:#777;font-size:13px">Umfrageantworten können auf dem Ausdruck angezeigt werden. Die Antworten findest du unter „Gäste-Daten“.</p>
              <p style="font-weight:600;margin-top:10px">Feste Felder</p>${sw('form.name', 'Name abfragen')}${sw('form.email', 'E-Mail abfragen')}${sw('form.phone', 'Telefon abfragen')}${sw('form.newsletter', 'Newsletter-Einwilligung anbieten')}
              <p style="font-weight:600;margin-top:14px">Eigene Fragen ${NEWAPP}</p>
              ${Q.length ? '' : '<p style="color:#777">Noch keine Fragen hinzugefügt. Klicken Sie auf „Frage hinzufügen“, um zu beginnen.</p>'}
              ${Q.map((q, i) => `<div style="border:1px solid #e3e3ea;border-radius:10px;padding:12px;margin-top:10px">
                <div class="between"><b>Frage ${i + 1}</b><div class="row"><label class="row" style="gap:6px;font-size:13px"><input type="checkbox" data-s="x.survey.questions.${i}.required" ${q.required ? 'checked' : ''}> Erforderlich</label>
                  <button class="ghost" data-a="q-up" data-i="${i}" ${i ? '' : 'disabled'}>↑</button><button class="ghost" data-a="q-down" data-i="${i}" ${i < Q.length - 1 ? '' : 'disabled'}>↓</button><button class="ghost" data-a="q-del" data-i="${i}">🗑</button></div></div>
                <input type="text" maxlength="200" data-s="x.survey.questions.${i}.text" value="${esc(q.text)}" placeholder="Fragetext eingeben">
                <label class="l">Antwort</label><select data-s="x.survey.questions.${i}.type" data-rerender="1">${types.map(([k, n]) => `<option value="${k}" ${q.type === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
                ${q.type === 'choice' ? `<label class="l">Antwortmöglichkeiten (eine pro Zeile)</label><textarea rows="3" data-s="x.survey.questions.${i}.options">${esc(q.options || '')}</textarea>` : ''}</div>`).join('')}
              <p style="margin-top:12px"><button class="ghost" data-a="q-add">+ Frage hinzufügen</button></p></div>
            <h2>Schaltflächenbeschriftungen ${NEWAPP}</h2><div class="card">Passen Sie den Text der Navigationsschaltflächen in Ihrer Umfrage an
              <div class="grid3x">${text('x.survey.prev', 'Vorherige')}${text('x.survey.next', 'Weiter')}${text('x.survey.done', 'Fertig')}</div></div>`
          : `${titleSw('Haftungsausschluss', 'form.enabled')}<div class="card">Bitten Sie Ihre Gäste, einen Haftungsausschluss zu akzeptieren
              ${text('x.disc.title', 'Titel für Haftungsausschluss ' + NEWAPP)}
              <label class="l">Text des Haftungsausschlusses</label><textarea rows="5" data-s="form.text">${esc(S.form.text)}</textarea>
              <p style="color:#777;font-size:13px">Wenn der Gast den Haftungsausschluss nicht akzeptiert, wird seine Sitzung abgebrochen und seine Fotos werden gelöscht.</p>
              <div class="grid3x">${text('x.disc.warn', 'Warnung ' + NEWAPP)}${text('x.disc.agree', 'Vereinbarung')}${text('x.disc.cancel', 'Abbrechen')}</div></div>`)}`;
      },
      share() {
        const X = S.x.share;
        return `<h1>Einstellungen für Teilen</h1>${tabs('sh', [['mail', 'E-Mail'], ['sms', 'SMS'], ['wa', 'WhatsApp'], ['screen', 'Bildschirm zum Teilen'], ['more', 'Weitere Optionen']])}
          ${allTabs('sh', () => sub.sh === 'mail' ? `${titleSw('E-Mail', 'x.share.email.on')}<div class="card">${NEEDSRV}
              <label class="l">Von (Antwort an)</label><input type="email" data-s="x.share.email.from" value="${esc(X.email.from)}" placeholder="name@deinefirma.de">
              ${text('x.share.email.subject', 'Betreff')}<label class="l">HTML-Text</label><textarea rows="6" data-s="x.share.email.body">${esc(X.email.body)}</textarea>
              <p style="color:#777;font-size:13px">Platzhalter: {image} Bild · {image_url} Bild-Adresse · {share_url} Freigabe-Link</p>
              <div class="grid3x">${text('x.share.email.inputText', 'Text für die Eingabe der E-Mail-Adresse')}${text('x.share.email.sendText', 'Text für „E-Mail senden“')}</div></div>`
          : sub.sh === 'sms' ? `${titleSw('SMS', 'x.share.sms.on')}<div class="card">${NEEDSRV}
              <label class="l">Nachricht (max. 128 Zeichen)</label><textarea rows="2" maxlength="128" data-s="x.share.sms.message">${esc(X.sms.message)}</textarea>
              <div class="grid3x">${text('x.share.sms.cc', 'Ländercode (+)')}${text('x.share.sms.inputText', 'Text für die Eingabe der Telefonnummer')}${text('x.share.sms.sendText', 'Text für „SMS senden“')}</div></div>`
          : sub.sh === 'wa' ? `${titleSw('WhatsApp', 'x.share.wa.on')}<div class="card">Erfordert eine Internetverbindung. ${NEEDSRV}
              <label class="l">Nachricht (max. 128 Zeichen)</label><textarea rows="2" maxlength="128" data-s="x.share.wa.message">${esc(X.wa.message)}</textarea>
              <div class="grid3x">${text('x.share.wa.cc', 'Ländercode (+)')}${text('x.share.wa.inputText', 'Text für die Eingabe der Telefonnummer')}${text('x.share.wa.scanText', 'Text für „Mit dem Handy scannen“')}</div></div>`
          : sub.sh === 'screen' ? `<h2>Bildschirm zum Teilen</h2><div class="card">${slider('autoReturn', 'Anzeigedauer des Bildschirms zum Teilen', 0, 120, 5)}
              ${sw('x.share.originals', 'Originalfotos anzeigen ' + NEWAPP, 'Gäste können die einzelnen Originalfotos ansehen und teilen')}
              ${sw('x.share.deleteBtn', 'Schaltfläche „Löschen“ anzeigen', 'Gäste können die Aufnahme verwerfen und wiederholen')}${text('x.share.deleteText', 'Text für die Schaltfläche „Löschen“')}</div>`
          : `<h2>Weitere Optionen</h2><div class="card">${sw('x.share.cloud', 'Cloud-Freigabe ' + NEWAPP, 'Fotos werden in die Online-Galerie hochgeladen und sind über einen Link abrufbar')}
              ${sw('x.share.origUp', 'Originalfotos hochladen ' + NEWAPP, 'Zusätzlich zum fertigen Ausdruck werden die einzelnen Aufnahmen in die Online-Galerie hochgeladen (braucht mehr Speicher)')}
              ${sw('share', 'QR Code', 'Teilen Sie Fotos über einen QR-Code, den Gäste scannen können. Aktuell muss das Handy im selben WLAN wie die Fotobox sein.')}</div>`)}`;
      },
      print() {
        return `<h1>Druckeinstellungen</h1>${tabs('pr', [['gen', 'Allgemein'], ['lim', 'Drucklimits']])}
          ${allTabs('pr', () => sub.pr === 'gen' ? `<div class="card">${sw('autoPrint', 'Automatisch drucken', 'Automatisches Drucken jeder Session')}${sw('printButton', 'Schaltfläche „Drucken“ anzeigen', 'Fügt dem Freigabebildschirm eine Schaltfläche zum Drucken einer oder mehrerer zusätzlicher Kopien hinzu')}
              ${sw('askCopies', '„Wie viele Kopien?“ fragen')}<label class="l">Kopien pro Druck (Standard)</label><input type="number" min="1" max="10" data-s="copies" data-num="1" value="${S.copies}">
              <p style="font-weight:600;margin-top:14px">Texte ${NEWAPP}</p><div class="grid3x">${text('x.print.btnText', 'Drucken')}${text('x.print.printingText', 'Drucken...')}${text('x.print.copiesText', 'Wie viele Kopien?')}</div></div>`
          : `${titleSw('Drucklimits', '')}<div class="card">Ein Limit für die erlaubten Ausdrucke festlegen.
              <div class="row"><div style="flex:1"><label class="l">Maximale Anzahl an Ausdrucken pro Ereignis (0 = kein Limit)</label><input type="number" min="0" data-s="printLimit" data-num="1" value="${S.printLimit}"></div>
              <div style="flex:1"><label class="l">Maximale Anzahl an Kopien pro Gast</label><input type="number" min="1" max="20" data-s="maxCopies" data-num="1" value="${S.maxCopies}"></div></div>
              ${sw('showPrintsLeft', 'Restlimit an der Fotobox anzeigen ' + NEWAPP, 'Unter dem Drucken-Symbol steht, wie viele Ausdrucke noch übrig sind, zum Beispiel „Noch 37 Drucke“. Nur wenn oben ein Limit eingetragen ist.')}</div>`)}`;
      },
      // Fotomosaik: viele Gästefotos ergeben ein großes Bild (Bildschirm und/oder Klebewand mit nummerierter Tafel)
      cari() { // Live-Karikatur: Foto → KI-Karikatur → live gezeichnet an der Fotobox und auf dem zweiten Bildschirm
        S.x ??= {}; const c0 = S.x.caricature ??= {}; c0.secs ??= 10; c0.phone ??= true; c0.needCode ??= true; c0.print ??= true; c0.approve ??= false;
        if (!/^[0-9a-f]{16,64}$/.test(c0.secret || '')) { c0.secret = Caricature.newSecret(); save(); } // für den wechselnden Code auf der Wand
        const c = Caricature.normalize(c0), link = (window.FOTOBOX_CONFIG?.dashboardUrl || location.origin + location.pathname.replace(/[^/]*$/, '')).replace(/\/?$/, '/') + 'karikatur.html?e=' + ev.id;
        if (!cariT.loaded && !ctx.demo) { cariT.loaded = true; cariLoad(); }
        const stTxt = { review: 'wartet auf Freigabe', new: 'in der Reihe', processing: 'wird gezeichnet', done: 'fertig', rejected: 'abgelehnt', failed: 'fehlgeschlagen' };
        const rows = (cariT.list || []).map(r => `<div class="between" style="gap:10px;padding:8px 0;border-top:1px solid #eee">
            ${r.url ? `<img src="${esc(r.url)}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex:none">` : '<span style="width:64px;flex:none"></span>'}
            <div style="flex:1;min-width:0"><b>${esc(r.name || 'Ohne Namen')}</b> <small style="color:#6b6b78">· ${new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · ${stTxt[r.status] || r.status}</small>
              ${r.message ? `<div style="font-size:13px;color:#444;overflow-wrap:anywhere">„${esc(r.message)}“</div>` : ''}${r.error ? `<div style="font-size:12px;color:#c0392b">${esc(r.error)}</div>` : ''}</div>
            <div class="row" style="gap:6px;flex:none">${r.status === 'review' ? `<button class="btn pri" data-a="cari-ok" data-id="${r.id}">Freigeben</button><button class="ghost" data-a="cari-no" data-id="${r.id}">Ablehnen</button>` : ''}
              <button class="ghost" data-a="cari-del" data-id="${r.id}" title="Einsendung und Selfie löschen">🗑</button></div></div>`).join('');
        return `${titleSw('Live-Karikatur', 'x.caricature.on')}<p class="sub" style="margin:-6px 0 14px;color:#6b6b78">Jedes Foto wird zur Karikatur – live gezeichnet vor allen Gästen</p>
          <div class="card"><b>So funktioniert es</b> ${NEWAPP}
            <ol style="margin:8px 0 6px;padding-left:20px;line-height:1.6"><li>Der Gast macht an der Fotobox ein Foto.</li><li>Die KI macht daraus eine Karikatur – 1 Credit pro Foto (zentrale KI).</li>
            <li>Auf dem Bildschirm der Fotobox und auf dem zweiten Bildschirm (Fernseher/Beamer) wird sie Strich für Strich gezeichnet und eingefärbt.</li><li>Danach wie gewohnt: Drucken, QR-Code, Galerie.</li></ol>
            <p style="margin:0;color:#6b6b78;font-size:13px">Ist die Live-Karikatur an, entfällt die Stilauswahl der KI-Porträts. Den zweiten Bildschirm öffnest du an der Fotobox unter Menü → Live-Karikatur.</p></div>
          <div class="card"><b>Selfies vom Handy</b> ${NEWAPP}
            <p style="margin:4px 0 10px;color:#6b6b78;font-size:13px">Auf der Karikaturen-Wand (zweiter Bildschirm der Fotobox) stehen ein QR-Code und ein Code. Gäste schicken damit vom eigenen Handy ein Selfie mit Gruß und Namen – ohne App. Die Fotobox zeichnet, zeigt und druckt jede Karikatur.</p>
            ${sw('x.caricature.phone', 'Gäste schicken Selfies vom Handy', 'Aus = nur Fotos direkt an der Fotobox.')}
            ${sw('x.caricature.needCode', 'Code vom Bildschirm verlangen', 'Zwei Ziffern, wechseln alle 2 Minuten – so machen nur Gäste im Saal mit.')}
            ${sw('x.caricature.approve', 'Jedes Foto vorher freigeben', 'Einsendungen werden erst gezeichnet, wenn du sie unten freigibst.')}
            ${sw('x.caricature.print', 'Karikaturen vom Handy ausdrucken', 'Die Fotobox druckt jede fertige Karikatur auf dem Hauptdrucker.')}
            <label class="l">Link für die Gäste (steht auch als QR-Code auf der Wand)</label>
            <div class="row" style="gap:8px"><input type="text" readonly value="${esc(link)}" style="flex:1" data-cari-link><button class="ghost" data-a="cari-copy">Kopieren</button><button class="ghost" data-a="cari-qr">QR-Code</button></div>
            <div data-cari-qr style="margin-top:10px"></div></div>
          <div class="card"><div class="between"><b>Einsendungen (${(cariT.list || []).length})</b><button class="ghost" data-a="cari-refresh">Aktualisieren</button></div>
            ${rows || '<p style="margin:8px 0 0;color:#6b6b78;font-size:13px">Noch keine Einsendungen vom Handy.</p>'}</div>
          <div class="card">${slider('x.caricature.secs', 'Dauer der Zeichnung', 6, 20, 1, 's')}
            ${text('x.caricature.title', 'Überschrift beim Zeichnen', Caricature.TITLE)}
            <label class="l">Beschreibung für die KI</label><textarea rows="6" maxlength="1200" data-s="x.caricature.prompt">${esc(Caricature.promptOf(c))}</textarea>
            <div class="between" style="margin-top:6px"><small style="color:#6b6b78">Wichtig für die Zeichnung: kräftige schwarze Linien und weißer Hintergrund.</small><a href="#" data-a="cari-reset">Standard-Text einsetzen</a></div></div>
          <div class="card"><b>Ausprobieren</b><p style="margin:4px 0 10px;color:#6b6b78;font-size:13px">Mit dem Testfoto eine Karikatur erstellen und die Live-Zeichnung ansehen. Das Testfoto änderst du unter KI-Porträts.</p>
            <div class="row" style="gap:10px;align-items:center">${ai.photo ? `<img src="${ai.photo}" alt="Testfoto" style="height:120px;border-radius:8px">` : ''}${cariT.result ? `<span style="font-size:22px">→</span><img src="${cariT.result}" alt="Karikatur" data-a="cari-play" title="Zeichnung ansehen" style="height:120px;border-radius:8px;cursor:pointer;box-shadow:0 0 0 1px #e5e5ec">` : ''}</div>
            <label style="display:flex;gap:8px;align-items:flex-start;margin:10px 0;font-size:13px"><input type="checkbox" data-cari-consent ${cariT.consent ? 'checked' : ''} style="margin-top:3px"> Dieses Foto darf zum Testen an den KI-Dienst (xAI) übertragen werden.</label>
            <div class="row" style="gap:8px"><button class="btn pri" data-a="cari-test" ${cariT.busy || !c.on ? 'disabled' : ''}>${cariT.busy ? 'KI zeichnet … (10–40 Sekunden)' : '✨ Karikatur erstellen und zeichnen <small>(1 Credit)</small>'}</button>${cariT.result && !cariT.busy ? '<button class="ghost" data-a="cari-play">▶ Zeichnung nochmal ansehen</button>' : ''}</div>
            ${c.on ? '' : '<p style="margin:8px 0 0;color:#c98a00;font-size:13px">Zum Ausprobieren oben die Live-Karikatur einschalten.</p>'}</div>`;
      },
      mosaic() {
        const c = Mosaic.normalize(S.x.mosaic);
        const cmIn = (p, v, min, max, step) => `<input type="number" data-s="x.mosaic.${p}" data-num="1" min="${min}" max="${max}" step="${step}" value="${v}" style="width:110px">`;
        return `${titleSw('Fotomosaik', 'x.mosaic.on')}<div class="cols"><div class="left">
          <div class="card"><p style="margin-top:0">Aus vielen kleinen Gästefotos entsteht ein großes Bild – live auf einem Fernseher oder Beamer und/oder als Klebewand: Jede Kachel wird mit ihrer Feldnummer (z. B. „C7“) gedruckt und auf die vorher gedruckte Tafel geklebt. ${NEWAPP}</p>
            ${sel('x.mosaic.mode', 'Art', Mosaic.MODES)}${sel('x.mosaic.who', 'Wann kommt ein Foto ins Mosaik?', Mosaic.WHO)}${sel('x.mosaic.shots', 'Fotos pro Sitzung', Mosaic.SHOTS)}${sel('x.mosaic.source', 'Foto fürs Mosaik', Mosaic.SOURCES)}
            <p style="color:#777;font-size:13px">„Gast entscheidet“: Neben QR-Code und Drucken erscheint an der Fotobox das grüne Mosaik-Symbol – nur wer darauf tippt, kommt ins Mosaik.</p>
            ${sw('x.mosaic.preview', 'Mosaik-Vorschau auf dem Startbildschirm', 'Kleines Mosaik mit Fortschritt unten links. Gäste können darauf tippen und das ganze Mosaik ansehen.')}</div>
          <h2>Hauptbild</h2><div class="card">${up('x.mosaic.image', '', 'image/*', 'Foto mit klaren Formen, z. B. das Brautpaar oder ein Logo')}
            ${slider('x.mosaic.overlay', 'Deckkraft des Hauptbilds über den Fotos', 0, 90, 5, '%')}
            <p style="color:#777;font-size:13px">0 % = nur die Gästefotos · 30–50 % = das große Bild ist gut zu erkennen und die Gesichter auch.</p>
            ${sw('x.mosaic.label', 'Feldnummer auf jede Kachel drucken')}
            ${slider('x.mosaic.codeSize', 'Größe der Feldnummer', 50, 300, 10, '%')}${slider('x.mosaic.codeAlpha', 'Stärke der Feldnummer', 10, 100, 5, '%')}
            <p style="color:#777;font-size:13px">100 % = normale Größe und tiefschwarz. Mit weniger Stärke wird die Nummer blasser und fällt auf der Wand weniger auf. Rechts siehst du sofort, wie eine gedruckte Kachel aussieht.</p></div>
          <h2>Tafel-Rechner</h2><div class="card"><p style="margin-top:0;color:#555;font-size:13px">Tafel (Höchstmaß) und Kachelgröße eingeben – die Software rechnet aus, wie viele Felder (Fotos) passen. Die Tafel wird genau so groß, dass die Kacheln aufgehen, also höchstens so groß wie eingegeben.</p>
            <label class="l">Tafelgröße (höchstens)</label><div class="row" style="gap:8px;flex-wrap:wrap">${cmIn('boardW', c.boardW, 10, 1000, 1)}<span>cm breit ×</span>${cmIn('boardH', c.boardH, 10, 1000, 1)}<span>cm hoch</span></div>
            <label class="l">Kachelgröße (Foto)</label><div class="row" style="gap:8px;flex-wrap:wrap">${cmIn('tileW', c.tileW, 10, 152.4, .1)}<span>mm breit ×</span>${cmIn('tileH', c.tileH, 10, 152.4, .1)}<span>mm hoch</span></div>
            ${sel('x.mosaic.paper', 'Papier für die Kacheln', Mosaic.PAPERS)}
            ${sel('x.mosaic.numbering', 'Feldnummern', Mosaic.NUMBERING)}
            <div class="mzRes" id="wsMzInfo"></div>
            <button class="ghost" data-a="mz-fit" ${c.image ? '' : 'disabled'} style="margin:4px 0 10px">Tafelhöhe passend zum Hauptbild</button>
            ${sw('x.mosaic.boardImage', 'Hauptbild schwach auf der Tafel zeigen')}
            <div class="row" style="flex-wrap:wrap;align-items:center;margin-bottom:6px"><button class="ghost" data-a="mz-reset" ${c.on && c.image ? '' : 'disabled'}>${ICON('repeat', 15)} Mosaik neu starten</button></div>
            <p style="color:#777;font-size:13px;margin-top:0">Nach Änderungen (z. B. Feldnummern oder Größe der Nummer) neu starten: Alle Felder werden leer und jede neue Kachel bekommt die aktuellen Einstellungen. Die Fotos bleiben in der Galerie. Danach die Tafel neu drucken.</p>
            <div class="row" style="flex-wrap:wrap"><button class="btn pri" data-a="mz-pdf" data-k="full">${ICON('printer', 15)} Tafel drucken – Originalgröße</button><button class="ghost" data-a="mz-pdf" data-k="a4">${ICON('printer', 15)} Tafel auf A4-Blättern</button></div>
            <p style="color:#777;font-size:13px">Im Druckfenster als Ziel „Als PDF speichern“ wählen – die Größe ist schon eingestellt. Die Originalgröße ist für eine Druckerei (z. B. Forex- oder Kapa-Platte), die A4-Blätter zum Zusammenkleben. Jedes Feld ist genau so groß wie eine Kachel.</p></div>
          <div class="card" style="background:#FFFAEA">Welcher Drucker die Kacheln druckt und auf welchem Fernseher/Beamer das Mosaik läuft, stellst du direkt an der Fotobox ein: Menü → <b>Fotomosaik</b>. Dort lässt sich die Tafel ebenfalls als PDF speichern.</div>
          </div><div class="pv"><div class="frame"><b style="display:block;margin-bottom:8px">So wird eine Kachel gedruckt</b>
            <canvas id="wsMzTile" width="10" height="10" style="display:block;margin:0 auto 4px;max-width:100%;background:#fff;box-shadow:0 0 0 1px #ddd,0 4px 12px rgba(0,0,0,.15)"></canvas>
            <small id="wsMzTileNote" style="display:block;text-align:center;color:#777;margin-bottom:14px"></small>
            <b style="display:block;margin-bottom:8px">Vorschau mit Beispielfotos</b><canvas id="wsMz" width="10" height="10"></canvas>
            <b style="display:block;margin:14px 0 8px">Tafel zum Bekleben</b><div id="wsMzBoard"></div></div></div></div>`;
      },
      lang() {
        const L = S.x.lang, list = L.list?.length ? L.list : I18N.CODES;
        const opt = (v, n, nt) => `<option value="${v}" ${(L.guest || '') === v ? 'selected' : ''}${nt ? ' translate="no"' : ''}>${n}</option>`;
        return `<h1>Sprache ${NEWAPP}</h1><p style="margin:-6px 0 14px;color:#6b6b78">In welcher Sprache Ihre Gäste die Fotobox und die Seite zum Herunterladen sehen</p>
          <div class="card"><label class="l">Standardsprache für die Gäste</label><select data-s="x.lang.guest" data-rerender="1">${opt('', 'Wie das Menü der Fotobox')}${I18N.LANGS.map(l => opt(l.code, l.name, 1)).join('')}</select>
            <small style="color:#777;display:block;margin-top:8px">Gilt für alles, was Gäste sehen: Startbildschirm, Auswahl, Countdown, Teilen, Drucken, Formular und die Seite zum Herunterladen hinter dem QR-Code. Texte, die Sie selbst geändert haben, bleiben so, wie Sie sie geschrieben haben.</small></div>
          <div class="card">${sw('x.lang.pick', 'Flaggen auf dem Startbildschirm', 'Gäste tippen auf eine Flagge und sehen alles in ihrer Sprache. Nach jeder Sitzung springt die Fotobox zurück zur Standardsprache.')}
            <label class="l" style="margin-top:14px">Angebotene Sprachen</label>
            <div style="display:flex;flex-wrap:wrap;gap:10px 22px">${I18N.LANGS.map(l => `<label translate="no" style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" data-langl="${l.code}" ${list.includes(l.code) ? 'checked' : ''}>${I18N.flag(l.code, 16)} ${l.name}</label>`).join('')}</div></div>`;
      },
    };
    function previewBox() {
      return `<div class="pv"><div class="frame"><canvas id="wsPv"></canvas><div class="row" style="justify-content:space-between;margin-top:12px">
        <button class="btn pri" data-a="edit1">${ICON('pen', 15)} Bearbeiten</button><small style="color:#777">${S.layouts[0] ? esc(S.layouts[0].name) : 'Standard-Vorlage'}</small></div></div></div>`;
    }
    // Startbildschirm als frei gestaltbares „Layout“ in Bildschirmgröße (wie LumaBooth). Ohne Gestaltung: Vorschlag aus den bisherigen Angaben.
    // Startbildschirm je Ausrichtung: gestaltet (startScreen bzw. startScreen2), sonst aus der anderen umgerechnet, sonst Standard-Vorschlag
    const screenOf = o => [S.startScreen, S.startScreen2].find(L => L && L.screen && L.orient === o) || null;
    const screenFor = o => screenOf(o) || (S.startScreen ? FBR.adaptScreen(S.startScreen, o) : FBR.createScreen(o, { logo: E.logo_url, startText: S.startText, theme: 'night' }));
    const mediaFor = o => { const m = o === 'landscape' ? S.attractL : S.attractP; return m?.url ? m : S.attractUrl ? { url: S.attractUrl, type: S.attractType || 'video' } : null; };
    function startPreview() {
      const cv = (o, flex) => `<div style="flex:${flex};min-width:0"><small style="color:#555">${FBR.SCREEN_SIZES[o].label}</small><canvas id="wsStart${o === 'landscape' ? 'L' : 'P'}" data-a="editscreen" data-o="${o}" title="Anklicken zum Gestalten" style="width:100%;border-radius:8px;display:block;cursor:pointer;margin-top:4px"></canvas><small id="wsStartNote${o === 'landscape' ? 'L' : 'P'}" style="color:#888"></small></div>`;
      return `<div class="pv"><div class="frame"><div class="row" style="align-items:flex-start;gap:12px">${cv('portrait', 9)}${cv('landscape', 16)}</div></div></div>`;
    }
    function drawStart() {
      for (const o of ['portrait', 'landscape']) {
        const c = $(root, o === 'landscape' ? '#wsStartL' : '#wsStartP'), note = $(root, o === 'landscape' ? '#wsStartNoteL' : '#wsStartNoteP'); if (!c) continue;
        const gl = S.x.lang?.guest || window.PM_LANG || 'de', L = I18N.layout(screenFor(o), gl); // Vorschau in der Sprache der Gäste
        if (!I18N.has(gl)) { I18N.load(gl).then(() => I18N.has(gl) && drawStart()); }
        if (note) note.textContent = screenOf(o) ? 'gestaltet' : S.startScreen ? 'automatisch angepasst' : 'Standard-Vorschlag';
        FBR.preloadLayout(L).then(() => { const big = FBR.renderLayout(L, { values: vals(), placeholders: true }); c.width = Math.round(big.width / 4); c.height = Math.round(big.height / 4); c.getContext('2d').drawImage(big, 0, 0, c.width, c.height); });
      }
    }
    async function uploadAttract(o) {
      const f = await pick('video/mp4,video/*,image/*'); if (!f) return;
      if (f.size > 50 * 1024 * 1024) { ctx.toast('Datei ist zu groß (max. 50 MB). Bitte das Video kürzer oder kleiner exportieren.', 5000); return; }
      status('Lädt ' + (f.type.startsWith('video') ? 'Video' : 'Bild') + ' hoch …');
      try {
        const url = await ctx.uploadFile(f), type = f.type.startsWith('video') ? 'video' : 'image';
        S[o === 'landscape' ? 'attractL' : 'attractP'] = { url, type };
        S.attractUrl = url; S.attractType = type; // ältere Fotobox-Versionen kennen nur ein Video
        S.startDisplay = 'media'; save();
      } catch (e) { ctx.toast('Hochladen fehlgeschlagen: ' + e.message, 5000); status(''); }
    }
    function removeAttract(o) {
      const k = o === 'landscape' ? 'attractL' : 'attractP', other = S[o === 'landscape' ? 'attractP' : 'attractL'];
      if (!S[k]?.url || S[k].url === S.attractUrl) { S.attractUrl = other?.url || ''; S.attractType = other?.type || ''; }
      S[k] = null; if (!S.attractUrl && !S.attractP?.url && !S.attractL?.url) S.startDisplay = 'live';
      save();
    }
    // Gestaltung speichern: in den Platz der passenden Ausrichtung (die zuerst gestaltete bleibt startScreen)
    function storeScreen(nl) {
      if (!S.startScreen || S.startScreen.orient === nl.orient) S.startScreen = nl; else S.startScreen2 = nl;
      const b = nl.elements.find(e => e.type === 'button'); S.startText = b && !b.hidden ? String(b.text || '') : ''; save();
    }
    function editScreen(o) {
      const L = structuredClone(screenFor(o)); delete L.adapted;
      LayoutEditor.open({
        layout: L, values: vals(), uploadImage: ctx.uploadFile,
        video: () => mediaFor(L.orient) || { url: '', type: '' }, uploadVideo: () => uploadAttract(L.orient),
        removeVideo: () => removeAttract(L.orient),
        onSave: async nl => storeScreen(nl),
        onClose: () => render()
      });
    }
    // Farbfilter-Vorschau: mit dem Testfoto der KI-Seite (Standard- oder eigenes Foto), bis es geladen ist mit Platzhalter
    let fThumbCache = {}; const fxPhoto = { src: '', img: null };
    function fxTestImage() {
      if (!ai.photo) return null;
      if (fxPhoto.src !== ai.photo) {
        const src = fxPhoto.src = ai.photo; fxPhoto.img = null; fThumbCache = {};
        const im = new Image(); im.onload = () => { if (fxPhoto.src !== src) return; fxPhoto.img = im; fThumbCache = {}; if (page === 'fx') render(); }; im.src = src;
      }
      return fxPhoto.img;
    }
    function filterThumb(css) {
      const im = fxTestImage();
      if (fThumbCache[css]) return fThumbCache[css];
      const c = document.createElement('canvas'); c.width = c.height = 160; const x = c.getContext('2d');
      if (css !== 'none') x.filter = css;
      if (im) { const s = Math.min(im.width, im.height), sy = Math.min(im.height - s, Math.round(im.height * .06)); x.drawImage(im, (im.width - s) / 2, sy, s, s, 0, 0, 160, 160); } // oben ausschneiden, damit die Gesichter zu sehen sind
      else x.drawImage(FBR.placeholder(1, 400, 400), 0, 0, 160, 160);
      return fThumbCache[css] = c.toDataURL('image/jpeg', .8);
    }
    // Fotomosaik: Vorschau mit Beispielfotos, Tafel und Maße (ändert sich sofort beim Schieben der Regler)
    const mzv = { url: '', img: null, ph: {}, smp: null, smpKind: '' };
    // Beispiel für die Kachel-Vorschau: das neueste Foto dieses Ereignisses, sonst ein Platzhalter
    function mzSample() {
      if (mzv.smp) return;
      if (!gal.list) { if (!gal.loading) loadGallery().then(() => { if (gal.list) drawMosaic(); }).catch(() => {}); return; }
      mzv.smp = FBR.placeholder(1, 900, 900); mzv.smpKind = 'demo';
      const it = gal.list.find(x => /_original\d*\.(jpe?g|png)$/i.test(x.name || x.path || '')) || gal.list.find(x => /\.(jpe?g|png)$/i.test(x.name || x.path || '') && !/\.gif$/i.test(x.path || ''));
      if (it) { const im = new Image(); im.onload = () => { mzv.smp = im; mzv.smpKind = 'event'; drawMosaic(); }; im.src = galUrl(it.thumb || it.path); }
    }
    function drawMosaicTile(c, p) {
      const cv = $(root, '#wsMzTile'), note = $(root, '#wsMzTileNote'); if (!cv) return;
      mzSample(); const photo = mzv.smp || FBR.placeholder(1, 900, 900);
      const i = Math.floor(c.rows / 2) * c.cols + Math.floor(c.cols / 2);
      try { Mosaic.drawTilePreview(cv, photo, p, i, c, 260); } catch { return; }
      if (note) note.textContent = (mzv.smpKind === 'event' ? 'Mit dem neuesten Foto dieses Ereignisses' : 'Mit einem Beispielfoto') + (p ? '' : ' · ohne Hauptbild');
    }
    function drawMosaic() {
      const cv = $(root, '#wsMz'), box = $(root, '#wsMzBoard'), infoEl = $(root, '#wsMzInfo'); if (!cv) return;
      const c = Mosaic.normalize(S.x.mosaic);
      if (infoEl) infoEl.innerHTML = Mosaic.summaryHTML(c); // Ergebnis des Tafel-Rechners
      if (c.image !== mzv.url) {
        mzv.url = c.image; mzv.img = null;
        if (c.image.startsWith('https://')) { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { if (mzv.url === c.image) { mzv.img = im; drawMosaic(); } }; im.src = c.image; }
      }
      box.innerHTML = Mosaic.boardSVG(c, c.boardImage && mzv.img ? c.image : '');
      const f = Mosaic.tileIn(c), ar = c.cols * f.w / (c.rows * f.h), x = cv.getContext('2d');
      cv.width = ar >= 1 ? 640 : Math.round(640 * ar); cv.height = Math.round(cv.width / ar);
      const note = t => { x.fillStyle = '#111'; x.fillRect(0, 0, cv.width, cv.height); x.fillStyle = '#aaa'; x.font = '16px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(t, cv.width / 2, cv.height / 2); };
      if (!mzv.img) { drawMosaicTile(c, null); return note(c.image ? 'Hauptbild lädt …' : 'Bitte ein Hauptbild hochladen'); }
      try {
        const key = f.w.toFixed(3) + 'x' + f.h.toFixed(3), ph = mzv.ph[key] ||= [...Array(8)].map((_, k) => Mosaic.tileCanvas(FBR.placeholder(k, 400, 400), c, 120));
        const p = Mosaic.prepare(mzv.img, c), tiles = new Map();
        drawMosaicTile(c, p);
        for (let i = 0; i < p.n; i++) tiles.set(i, ph[(i * 7 + (i >> 3)) % 8]);
        Mosaic.renderMosaic(x, p, tiles, cv.width, cv.height, { overlay: c.overlay, bg: '#111' });
      } catch { note('Vorschau nicht möglich'); }
    }
    async function mzPrintBoard(kind) {
      const c = Mosaic.normalize(S.x.mosaic), b = Mosaic.board(c);
      if (kind !== 'a4' && Math.max(b.W, b.H) > 5000) return ctx.toast('Die Tafel ist größer als 5 m – das passt auf keine PDF-Seite. Bitte die A4-Variante nehmen oder das Raster verkleinern.', 6000);
      let img = '';
      if (c.boardImage && mzv.img) try {
        const k = Math.min(1, 2400 / Math.max(mzv.img.naturalWidth, mzv.img.naturalHeight)), cv = document.createElement('canvas');
        cv.width = Math.round(mzv.img.naturalWidth * k); cv.height = Math.round(mzv.img.naturalHeight * k); cv.getContext('2d').drawImage(mzv.img, 0, 0, cv.width, cv.height); img = cv.toDataURL('image/jpeg', .85);
      } catch {}
      const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
      document.body.appendChild(fr);
      const d = fr.contentDocument; d.open(); d.write(Mosaic.printHTML(c, img, kind, E.name || 'Fotomosaik')); d.close();
      await new Promise(r => setTimeout(r, 500));
      fr.contentWindow.focus(); fr.contentWindow.print();
      setTimeout(() => fr.remove(), 120000);
      ctx.toast('Im Druckfenster als Ziel „Als PDF speichern“ wählen – die Größe ist schon eingestellt.', 7000);
    }
    function drawPreview(fromRender) {
      const c = $(root, '#wsPv');
      if (c) {
        const L = S.layouts[0];
        const img = L ? FBR.renderSheet(L, { placeholders: true, values: vals() })
          : FBR.render(FBR.LAYOUTS.single, [0, 1, 2, 3].map(i => FBR.placeholder(i)), { template: S.template, title: S.title || E.name, subtitle: S.subtitle });
        c.width = img.width / 3; c.height = img.height / 3; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      }
      if (page === 'start') { clearTimeout(drawPreview.t); drawPreview.t = setTimeout(drawStart, fromRender ? 0 : 400); }
      if (page === 'mosaic') { clearTimeout(drawPreview.m); drawPreview.m = setTimeout(drawMosaic, fromRender ? 0 : 120); }
    }
    function render() {
      main.innerHTML = '<div class="wpage">' + PAGES[page]() + '</div>';
      drawPreview(true);
      if (page === 'layout') S.layouts.forEach(L => FBR.preloadLayout(L).then(() => { const img = main.querySelector(`.lay[data-id="${L.id}"] img`); if (img) img.src = layoutThumb(L);
        const big = L.id === sub.laySel && main.querySelector('#wsLayImg'); if (big) big.src = layoutThumb(L, 760); }));
    }

    // ---------- Layouts ----------
    function editLayout(id) {
      const L = S.layouts.find(x => x.id === id); if (!L) return;
      LayoutEditor.open({
        layout: L, values: vals(), uploadImage: ctx.uploadFile, questions: (S.x.survey.questions || []).map(q => q.text),
        onSave: async nl => { const i = S.layouts.findIndex(x => x.id === nl.id); if (i >= 0) S.layouts[i] = nl; save(); },
        onClose: () => render()
      });
    }
    async function fromImage() {
      const f = await pick('image/png,image/*'); if (!f) return;
      status('Analysiere Design …');
      try {
        const L = await LayoutEditor.layoutFromImage(f, ctx.uploadFile);
        ctx.toast(L.found ? `${L.found} Fotofeld(er) im Design erkannt` : 'Keine transparenten Stellen gefunden – Fotofeld bitte selbst platzieren', 3500);
        delete L.found; S.layouts.push(L); save(); render(); editLayout(L.id);
      } catch (e) { ctx.toast('Fehler: ' + e.message, 4000); status(''); }
    }
    function previewAll() {
      const L = S.layouts[0];
      const img = L ? FBR.renderSheet(L, { placeholders: true, values: vals() }) : null;
      const m = modal(`<div class="mh"><h3>Vorschau</h3><button class="x" data-x="1">×</button></div><div class="bigpv" style="flex:1"><img src="${img ? img.toDataURL('image/jpeg', .85) : ''}"></div>`);
      if (!img) $(m, '.bigpv').innerHTML = '<p style="padding:30px">Noch kein Layout angelegt.</p>';
    }
    async function close() {
      clearTimeout(saveT);
      await ctx.sb.from('events').update({ name: E.name, event_date: E.event_date || null, logo_url: E.logo_url || null, settings: S }).eq('id', ev.id);
      root.remove(); ctx.onClose?.();
    }

    renderNav(); render(); status('✓ Alle Änderungen gespeichert');
    return { close };
  }
  // ---------- Gemeinsam für Dashboard und FotoBox-Software ----------
  function ensureCss() { if (!document.getElementById('ws-css')) { const s = document.createElement('style'); s.id = 'ws-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function thumbOf(L, px, values) {
    const c = FBR.renderLayout(L, { placeholders: true, values });
    const s = px / Math.max(c.width, c.height), t = document.createElement('canvas');
    t.width = Math.round(c.width * s); t.height = Math.round(c.height * s); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
    return t.toDataURL('image/jpeg', .85);
  }
  function modal(html) {
    ensureCss();
    const m = document.createElement('div'); m.id = 'wsModal'; m.innerHTML = `<div class="box">${html}</div>`;
    m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-x]')) m.remove(); });
    document.body.appendChild(m); return m;
  }
  // Vorlagen-Galerie → Format wählen → onPick(neues Layout)
  function pickTemplate(values, onPick) {
    const tpls = [...FBR.TEMPLATES].sort((a, b) => !!b.plain - !!a.plain); // „Ohne Vorlage“ zuerst
    const cats = ['Alle', ...new Set(tpls.map(t => t.cat))];
    let cat = 'Alle', q = '';
    const m = modal(`<div class="mh"><h3>Vorlage wählen</h3><input placeholder="Vorlagen suchen …" data-q><button class="x" data-x="1">${ICON('x', 20)}</button></div>
      <div class="cats">${cats.map(c => `<button data-c="${c}" class="${c === cat ? 'on' : ''}">${c}</button>`).join('')}</div><div class="grid"></div>`);
    const thumbs = {};
    const grid = () => {
      $(m, '.grid').innerHTML = tpls.filter(t => (cat === 'Alle' || t.cat === cat) && t.name.toLowerCase().includes(q)).map(t => {
        thumbs[t.id] ||= thumbOf(FBR.createLayout('4x6p', 3, t.id), 260, values);
        return `<div class="tp" data-t="${t.id}"><img src="${thumbs[t.id]}"><div>${esc(t.name)}</div></div>`;
      }).join('');
    };
    grid();
    m.addEventListener('click', e => {
      const c = e.target.closest('[data-c]'); if (c) { cat = c.dataset.c; $$(m, '[data-c]').forEach(b => b.classList.toggle('on', b === c)); grid(); }
      const t = e.target.closest('[data-t]'); if (t) pickFormat(m, t.dataset.t, values, onPick);
    });
    $(m, '[data-q]').oninput = e => { q = e.target.value.toLowerCase(); grid(); };
  }
  function pickFormat(m, tplId, values, onPick) {
    const t = FBR.templateById(tplId);
    // Einzelbild, 3er-Collage und Fotostreifen – je Vorlage, auch „Ohne Vorlage“
    const items = FBR.PRESETS.map(([f, n]) => ({ f, n, L: FBR.createLayout(f, n, tplId), sec: FBR.FORMATS[f].size === '2x6' ? 'Fotostreifen' : n === 1 ? 'Einzelbild' : 'Collage' }));
    let cur = 0;
    $(m, '.box').innerHTML = `<div class="mh"><button class="x" data-back="1">${ICON('chevronLeft', 20)}</button><h3>${esc(t.name)}</h3><button class="x" data-x="1">${ICON('x', 20)}</button></div>
      <div class="two"><div class="fl">${items.map((it, i) => `${!i || items[i - 1].sec !== it.sec ? `<div class="sec">${it.sec}</div>` : ''}<div class="fi ${i === cur ? 'on' : ''}" data-i="${i}"><img data-th="${i}" alt=""><div>${FBR.FORMATS[it.f].label.replace(' Streifen', '')} · ${it.n} Foto${it.n > 1 ? 's' : ''}</div></div>`).join('')}</div>
      <div class="bigpv"><img><div class="ft"><div><b class="fn"></b><br><small class="fs"></small></div><button class="btn" data-go="1">Layout auswählen</button></div></div></div>`;
    const show = () => { const it = items[cur]; $(m, '.bigpv img').src = thumbOf(it.L, 700, values); $(m, '.fn').textContent = `${FBR.FORMATS[it.f].label} (${it.n} Foto${it.n > 1 ? 's' : ''})`; $(m, '.fs').textContent = `${it.L.w} × ${it.L.h} px`; $$(m, '.fi').forEach((e, i) => e.classList.toggle('on', i === cur)); };
    show();
    { const fl = $(m, '.fl'), on = $(m, '.fi.on'); if (fl && on) fl.scrollTop += on.getBoundingClientRect().top - fl.getBoundingClientRect().top - (fl.clientHeight - on.offsetHeight) / 2; } // gewähltes Format (4×6) sichtbar
    // Vorschaubilder in kleinen Portionen zeichnen, damit das Fenster sofort aufgeht
    let k = 0;
    const fill = () => { if (!m.isConnected || !$(m, '[data-th]')) return; for (const end = Math.min(items.length, k + 4); k < end; k++) { const im = $(m, `[data-th="${k}"]`); if (im) im.src = thumbOf(items[k].L, 160, values); } if (k < items.length) setTimeout(fill, 0); };
    fill();
    m.onclick = e => {
      if (e.target === m || e.target.closest('[data-x]')) return m.remove();
      if (e.target.closest('[data-back]')) { m.remove(); return pickTemplate(values, onPick); }
      const fi = e.target.closest('[data-i]'); if (fi) { cur = +fi.dataset.i; show(); }
      if (e.target.closest('[data-go]')) { m.remove(); onPick(items[cur].L); }
    };
  }

  // „Erstellen Sie ein neues Ereignis“ – Ereignisart wählen
  const TYPES = [
    ['FOTO', 'photo', 'camera', 'PHOTO BOOTH', 'Fotos für den Druck oder die digitale Weitergabe', {}],
    ['FOTO', 'glam', 'sparkles', 'GLAM BOOTH', 'Fotos mit Hautglättung und Farbfiltern', { beauty: true, beautyStrength: 55, filtersOn: true, filters: ['normal', 'bw', 'glam', 'warm'], template: 'elegant', frame: '#111111', textColor: '#f3efe6', font: 'elegant' }],
    ['FOTO', 'bgremoval', 'wand', 'BACKGROUND REMOVAL', 'Hintergrund per KI durch ein digitales Bild ersetzen', { bgMode: 'ai', bgGuestChoice: true }],
    ['FOTO', 'mirror', 'smartphone', 'MIRROR BOOTH', 'Interaktive Sprachansagen und Animationen während der Aufnahme', { voice: true }],
    ['VIDEO', 'slowmo', 'film', '360 / SLOW-MO', 'Zeitlupen-Videos mit Tempo-Rampen', null],
    ['VIDEO', 'video', 'video', 'VIDEO BOOTH', 'Videos mit Ton aufnehmen – für ein Video-Gästebuch', { modes: { single: false, strip: false, grid: false, gif: false, boomerang: false, video: true }, videoSecs: 15, videoAudio: true }]
  ];
  function newEventDialog(events, onPick) {
    if (!document.getElementById('ws-css')) { const s = document.createElement('style'); s.id = 'ws-css'; s.textContent = CSS; document.head.appendChild(s); }
    const m = document.createElement('div'); m.id = 'wsModal';
    let sec = '';
    const rows = TYPES.map(([g, id, ic, t, d, preset]) => (g !== sec ? `<div class="sec">${sec = g}</div>` : '') +
      `<button class="et" data-type="${id}" ${preset ? '' : 'disabled'}><span class="ei">${ICON(ic, 24)}</span><span><b>${t}${preset ? '' : ' <span class="soon">bald</span>'}</b><small>${d}</small></span></button>`).join('');
    m.innerHTML = `<div class="box" style="width:min(460px,94vw);height:auto;max-height:92vh"><div class="mh"><div style="flex:1"><h3>Erstellen Sie ein neues Ereignis</h3><small>Wählen Sie die Ereignisart für Ihre Fotobox</small></div><button class="x" data-x="1">${ICON('x', 20)}</button></div>
      <div style="overflow:auto;padding-bottom:16px">${rows}<div class="sec">KOPIEREN</div>
      <button class="et" data-type="dup" ${events.length ? '' : 'disabled'}><span class="ei">${ICON('copy', 24)}</span><span><b>VORHERIGES EREIGNIS DUPLIZIEREN</b><small>Einstellungen eines früheren Ereignisses übernehmen</small></span></button>
      <div class="dupList" style="display:none;margin:0 20px">${events.map(e => `<button class="et" data-dup="${e.id}" style="width:100%;margin:0 0 6px"><span class="ei">${ICON('calendar', 20)}</span><span><b style="font-family:inherit">${esc(e.name)}</b><small>${e.event_date ? new Date(e.event_date).toLocaleDateString('de-DE') : ''}</small></span></button>`).join('')}</div></div></div>`;
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('[data-x]')) return m.remove();
      const b = e.target.closest('[data-type],[data-dup]'); if (!b || b.disabled) return;
      if (b.dataset.type === 'dup') { const l = $(m, '.dupList'); l.style.display = l.style.display === 'none' ? 'block' : 'none'; return; }
      if (b.dataset.dup) { const src = events.find(x => x.id === b.dataset.dup); m.remove(); return onPick(structuredClone(src.settings || {}), src.logo_url, src.name + ' (Kopie)'); }
      const t = TYPES.find(x => x[1] === b.dataset.type); m.remove(); onPick(structuredClone(t[5]), null, null, t[3]);
    });
    document.body.appendChild(m);
  }
  G.EventWS = { open, newEventDialog, pickTemplate, thumbOf, modal };
})(window);
