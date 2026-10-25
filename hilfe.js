// Hilfe-Suche (Fotobox und Dashboard – die Datei ist in app-desktop/app und dashboard gleich): Stichwort eintippen → kurze
// Erklärung, wie man es einstellt, wo es steht und ein Knopf, der direkt dorthin springt. Tippfehler und Wörter ohne
// Umlaute werden auch gefunden („standart animation“, „orginal bilder“, „grosse“).
// Eintrag: t = Titel, k = Stichwörter (ohne Umlaute, mit _ verbunden – damit sie nicht übersetzt werden), x = Erklärung,
//   a = Ziel in der Fotobox: 'seite[:unterseite[:bereich]][#element]' oder '@aktion' (Startmenü), '' = nur im Dashboard
//   d = Ziel im Dashboard: 'seite[#einstellung]' im Ereignis oder 'tab:reiter' (Hauptseite), '' = nur an der Fotobox
(function (G) {
  const TOPICS = [
    { t: 'Logo in der Startanimation', k: 'logo_scheibe_mitte_standard_standardanimation_animation_startanimation_standardvideo_startvideo_firmenlogo_eigenes_kamerasymbol',
      x: 'Ohne eigenes Startvideo zeigt die Fotobox die Standard-Animation mit einer weißen Scheibe in der Mitte. Dort wählst du dein Firmenlogo, das Logo des Ereignisses, ein eigenes Bild oder nichts – dazu Größe und Darstellung.',
      a: 'design:start:set#slHead', d: 'start#x.startLogo.src' },
    { t: 'Eigenes Startvideo oder Bild', k: 'startbildschirm_video_bild_hintergrund_schleife_endlos_attract_hochladen_eigenes_startvideo_film',
      x: 'Ein eigenes Video oder Bild läuft in Endlosschleife auf dem Startbildschirm, ein Tipp darauf startet die Fotobox. Im Dashboard lädst du es je Hoch- und Querformat hoch.',
      a: 'design:start:set#scrVidBox', d: 'start' },
    { t: 'Startbildschirm gestalten', k: 'startbildschirm_gestalten_design_text_titel_datum_knopf_startknopf_schaltflaeche_editor_verschieben_schrift_name',
      x: 'Texte, Bilder, Formen und den Start-Knopf frei verschieben, in der Größe ändern und drehen – getrennt für Hoch- und Querformat.',
      a: 'design:start:design', d: 'start' },
    { t: 'Live-Ansicht auf dem Startbildschirm', k: 'livebild_live_ansicht_liveansicht_spiegel_mirror_kamerabild_startbildschirm',
      x: 'Statt eines Videos zeigt der Startbildschirm das Livebild der Kamera – zum Beispiel beim Spiegel.',
      a: 'design:start:set#scrLive', d: 'start#startDisplay' },
    { t: 'Galerie auf dem Startbildschirm', k: 'galerie_fotostapel_stapel_oben_links_nachdrucken_nachdruck_fotos_ansehen_gaeste',
      x: 'Oben links zeigt die Fotobox einen Fotostapel. Darüber sehen Gäste die Fotos dieses Ereignisses und können sie erneut drucken.',
      a: 'design:start:set#uiGallery', d: '' },
    { t: 'Farben der Fotobox', k: 'farbe_farben_primaerfarbe_akzent_akzentfarbe_knoepfe_gelb_rahmenfarbe_textfarbe',
      x: 'Primärfarbe für Knöpfe und Ränder sowie Rahmen- und Textfarbe für den Ausdruck.',
      a: 'design:start:design#sAccent', d: '' },
    { t: 'Aufnahmebildschirm und Live-Ansicht in der Vorlage', k: 'aufnahmebildschirm_aufnahme_live_ansicht_vorlage_rahmen_zuschneiden_flash_blitz_weiss_countdown_bildschirm',
      x: 'Ob sich die Gäste beim Countdown schon im fertigen Fotolayout sehen, ob das Livebild zugeschnitten wird und ob ein weißer Blitz kommt.',
      a: 'design:cap', d: 'capture' },
    { t: 'Bildschirm zum Teilen gestalten', k: 'teilen_bildschirm_teilenbildschirm_nach_foto_knoepfe_drucken_qr_wiederholen_fertig_symbole_anordnen_design',
      x: 'Nach dem Foto: Drucken, QR-Code, Wiederholen und Fertig frei anordnen, mit eigenen Symbolen und Farben – je Hoch- und Querformat.',
      a: 'design:share', d: 'share' },
    { t: 'Fotolayout und Vorlagen', k: 'fotolayout_vorlage_vorlagen_rahmen_layout_druck_collage_streifen_fotostreifen_einzelbild_template_png_design_testdruck',
      x: 'Vorlage für den Ausdruck wählen oder selbst gestalten: Fotos, Text, Logo, QR-Code und Sessiondaten – mit Testdruck, Import und Export.',
      a: 'templates', d: 'layout' },
    { t: 'Countdown', k: 'countdown_zaehlen_sekunden_vor_foto_zeit_pieps_ton_anzeigedauer',
      x: 'Sekunden vor dem ersten und vor weiteren Fotos, Countdown-Pieps und wie lange das Foto danach zu sehen ist.',
      a: 'modes', d: 'capture' },
    { t: 'Aufnahmearten: Foto, GIF, Boomerang, Video', k: 'modus_modi_fotomodus_gif_boomerang_video_aufnahmearten_fotostreifen_collage_auswahl_anzahl_fotos',
      x: 'Welche Aufnahmearten die Gäste wählen können und wie viele Fotos je Sitzung aufgenommen werden.',
      a: 'modes', d: 'capture' },
    { t: 'Video: Länge und Ton', k: 'video_laenge_sekunden_ton_audio_mikrofon_videobotschaft_aufnahmedauer',
      x: 'Wie lange ein Video dauert und ob der Ton mit aufgenommen wird.',
      a: 'modes', d: 'capture' },
    { t: 'Auch ein GIF aus den Fotos erstellen', k: 'gif_aus_fotos_animiert_zusaetzlich',
      x: 'Aus den Fotos einer Sitzung entsteht zusätzlich ein GIF – es landet auch in der Galerie.',
      a: 'modes#mAlsoGif', d: 'layout#gifFromPhotos' },
    { t: 'Spiegeln', k: 'spiegeln_gespiegelt_seitenverkehrt_mirror_umgedreht_schrift_falsch_herum',
      x: '„Gespiegelte Live-Ansicht“ wirkt wie ein Spiegel. „Aufgenommene Fotos und Videos spiegeln“ dreht auch das fertige Foto.',
      a: 'camera#sMirror', d: 'capture' },
    { t: 'Kamera auswählen (Webcam oder Canon)', k: 'kamera_webcam_canon_spiegelreflex_dslr_usb_verbinden_r100_1300d_digicamcontrol_nikon_kameraart',
      x: 'Webcam oder Canon direkt per USB. Die Canon erkennt die Fotobox von selbst – Modus-Rad auf M, EOS Utility vorher schließen.',
      a: 'camera#sCamType', d: '' },
    { t: 'Kamera drehen (Hochformat)', k: 'drehen_drehung_hochformat_querformat_grad_gedreht_kamera_quer_hoch',
      x: 'Steht die Kamera hochkant, hier 90 oder 270 Grad einstellen. Das Druckformat richtet sich danach.',
      a: 'camera#sRot', d: '' },
    { t: 'Scharfstellen (Autofokus)', k: 'scharf_scharfstellen_autofokus_fokus_unscharf_af_verschwommen',
      x: 'Wann und wie die Canon scharfstellt. Am schärfsten: „Direkt beim Auslösen, wie LumaBooth“ – die Kamera stellt beim Auslösen noch einmal scharf.',
      a: 'camera#sAfMode', d: '' },
    { t: 'Belichtung: ISO, Blende, Verschlusszeit', k: 'iso_blende_verschlusszeit_belichtung_hell_dunkel_zu_weissabgleich_kamerawerte_werte_blitz',
      x: 'Bei der Canon in den Kameraeinstellungen. Für das Livebild kannst du eigene, hellere Werte setzen. „Testfoto aufnehmen“ zeigt das Ergebnis.',
      a: 'camera', d: '' },
    { t: 'Livebild heller oder dunkler', k: 'livebild_hell_heller_dunkel_dunkler_helligkeit',
      x: 'Macht nur das Livebild auf dem Bildschirm heller oder dunkler – das Foto bleibt so, wie die Kamera es aufnimmt.',
      a: 'camera', d: '' },
    { t: 'Fotogröße der Kamera', k: 'fotogroesse_aufloesung_klein_mittel_gross_qualitaet_megapixel_schnell',
      x: '„Mittel“ (etwa 4000 Pixel) ergibt die beste Qualität. „Klein“ ist etwas schneller, „Groß“ nur langsamer, aber nicht schärfer.',
      a: 'camera#sCamSize', d: '' },
    { t: 'Drucker einstellen', k: 'drucker_druck_drucken_dnp_selphy_zweitdrucker_hauptdrucker_druckdialog',
      x: 'Hauptdrucker, Drucker je Format und Zweitdrucker wählen, Testdruck machen.',
      a: 'print', d: 'print' },
    { t: 'Automatisch drucken', k: 'automatisch_drucken_autodruck_auto_sofort_druckknopf_schaltflaeche',
      x: 'Druckt jedes Foto sofort – oder die Gäste drücken selbst auf „Drucken“.',
      a: 'print#sAutoPrint', d: 'print' },
    { t: 'Anzahl der Kopien', k: 'kopien_anzahl_wie_viele_ausdrucke_abfragen_mehrere_nachdruck',
      x: 'Mit „Anzahl der Kopien abfragen“ wählen die Gäste selbst, wie oft gedruckt wird – auch beim Nachdruck aus der Galerie. Die Höchstzahl pro Gast stellst du darunter ein.',
      a: 'print#sAskCopies', d: 'print' },
    { t: 'Drucklimit', k: 'drucklimit_limit_maximal_ausdrucke_begrenzen_restlimit_maximum',
      x: 'Höchstzahl an Ausdrucken für das ganze Ereignis und pro Gast. Das Restlimit kann unter dem Drucken-Knopf stehen.',
      a: 'print#sPrintLimit', d: 'print' },
    { t: 'Druck verschoben oder abgeschnitten', k: 'druck_verschoben_rand_abgeschnitten_skalierung_position_raender_weisser_rand',
      x: 'Skalierung sowie horizontale und vertikale Position je Drucker anpassen.',
      a: 'print', d: '' },
    { t: 'QR-Code zum Foto', k: 'qr_qrcode_handy_download_herunterladen_scannen_foto_aufs_handy_wlan_selbes_wlan_online_ereignis',
      x: 'Gäste scannen den QR-Code und haben das Foto sofort auf dem Handy. Dafür muss die Fotobox angemeldet, ein Ereignis aus dem Dashboard gewählt und das Hochladen in die Online-Galerie eingeschaltet sein – sonst funktioniert der QR-Code nur im selben WLAN (gelber Hinweis auf dem Startbildschirm).',
      a: 'share', d: 'share' },
    { t: 'Fotos in die Online-Galerie hochladen', k: 'cloud_online_galerie_hochladen_upload_freigabe_erweiterte_internet',
      x: 'Die Fotobox lädt jedes fertige Foto in die Online-Galerie des Ereignisses. Braucht die Anmeldung mit deinem Konto.',
      a: 'share#shCloud', d: 'dash#x.share.cloud' },
    { t: 'Originalfotos hochladen', k: 'original_originale_originalbilder_originalfotos_einzelbilder_einzelne_aufnahmen_ohne_rahmen',
      x: 'Lädt zusätzlich zum fertigen Foto die einzelnen Aufnahmen ohne Rahmen in die Online-Galerie.',
      a: 'share#shOrig', d: 'share#x.share.origUp' },
    { t: 'Hoch- und Querformat (automatisch)', k: 'hochformat_querformat_hochkant_quer_ausrichtung_drehen_bildschirm_monitor_spiegel_layout_vorlage_kamera_drehung_automatisch',
      x: 'Die Fotobox erkennt selbst, ob ihr Bildschirm hochkant oder quer steht – beim Start und wenn er im Betrieb gedreht wird. Danach richtet sie Fotolayout, Startvideo und Startbildschirm aus: hochkant das erste Hochformat-Layout, quer das erste Querformat-Layout (gibt es keins, das erste Layout). Wählen die Gäste das Layout selbst, sehen sie alle. Die Canon-Kamera meldet mit jedem Foto, wie sie hängt („Autom. Drehen: Ein“) – mit „Drehung: Automatisch“ dreht die Fotobox Livebild und Fotos selbst; vor dem Ereignis ein Testfoto machen. Irrt sie sich, unter Einstellungen → Allgemein „Hochformat“ oder „Querformat“ fest einstellen.',
      a: 'general#sScreenOrient', d: '' },
    { t: 'Alte Druckaufträge löschen (Warteschlange)', k: 'druck_warteschlange_auftraege_loeschen_alt_drucker_papier_leer_spaeter_gedruckt_naechstes_ereignis_reste',
      x: 'Fotos, die nach einem Ereignis noch in der Windows-Warteschlange des Druckers hängen (z. B. Papier leer oder Drucker aus), würden sonst beim nächsten Einschalten gedruckt. Die Fotobox fragt deshalb beim Beenden, ob sie gelöscht werden sollen, und löscht Reste beim Wechsel zum nächsten Ereignis und beim Start (älter als 3 Stunden). Andere Dokumente bleiben. Von Hand: Einstellungen → Drucker → „Jetzt alle wartenden Fotos löschen“. Fotos im Speicher des Druckers selbst: Drucker aus- und einschalten.',
      a: 'print#sClearPrints', d: '' },
    { t: 'Alle 14 Tage einmal online (Online-Pflicht)', k: 'online_pflicht_14_tage_internet_verbinden_gesperrt_sperre_gaeste_betrieb_offline_lizenz_pruefen',
      x: 'Eine angemeldete Fotobox muss mindestens alle 14 Tage einmal mit dem Internet verbunden sein. 3 Tage vorher warnt die Startseite; danach ist der Gäste-Betrieb gesperrt, bis sie wieder verbunden war – Einstellungen bleiben bedienbar. Ein Ereignis ohne Internet (z. B. übers Wochenende) ist kein Problem. Tipp: vor jedem Ereignis kurz verbinden.',
      a: '', d: '' },
    { t: 'Ohne Internet (offline)', k: 'offline_internet_wlan_ohne_verbindung_vorlagen_weg_fehlen_warteschlange_hochladen_nachladen_hotspot',
      x: 'Die Fotobox speichert alle Bilder der Vorlagen und Bildschirme des Ereignisses auf dem PC – auf der Startseite steht dann „Ereignis offline bereit ✓“. Ohne Internet laufen Vorlagen, Druck und Galerie weiter; mit Freischaltung der Offline-Warteschlange (bei jeder freigeschalteten Zusatzfunktion und im 1-Monats-Test dabei) warten die Fotos und kommen automatisch in die Online-Galerie des Ereignisses, sobald wieder Internet da ist – ohne Freischaltung werden Fotos ohne Internet nur gedruckt. Nur KI, Live-Karikatur und Videonachricht brauchen Internet.',
      a: '', d: '' },
    { t: 'Online-Galerie teilen (Link und Passwort)', k: 'galerie_link_teilen_passwort_online_alle_herunterladen_einbetten_webseite_gastzugriff',
      x: 'Link zur Galerie freigeben, mit Passwort schützen, „Alle herunterladen“ erlauben oder die Galerie auf der eigenen Webseite einbetten.',
      a: '', d: 'dash#x.gallery.link' },
    { t: 'Schönheitsfilter', k: 'schoenheitsfilter_haut_glaetten_beauty_weichzeichner_falten',
      x: 'Glättet die Haut – die Stärke ist einstellbar.',
      a: 'effects#sBeauty', d: 'fx' },
    { t: 'Filter (Schwarz-Weiß, Vintage …)', k: 'filter_schwarz_weiss_sw_vintage_farbe_effekte_filterleiste',
      x: 'Welche Filter die Gäste nach dem Foto wählen können.',
      a: 'effects', d: 'fx' },
    { t: 'Aufkleber und Verzieren', k: 'aufkleber_sticker_verzieren_malen_zeichnen_emoji_emojis_deko',
      x: 'Gäste verzieren ihr Foto mit Aufklebern oder malen darauf.',
      a: 'effects#eStickers', d: 'fx' },
    { t: 'Hintergrund entfernen (Greenscreen)', k: 'hintergrund_entfernen_greenscreen_green_screen_gruen_austauschen_hintergruende_freistellen',
      x: 'Neuer Hintergrund per KI ohne grüne Wand oder klassisch mit Greenscreen. Eigene Hintergründe hochladen – die Gäste suchen sich einen aus.',
      a: 'bg', d: 'bg' },
    { t: 'KI-Porträts', k: 'ki_kuenstliche_intelligenz_portraet_portraets_stil_stile_superheld_grok_ai',
      x: 'Gäste werden zu Filmstars, Superhelden oder Kunstwerken. Stile auswählen, Zustimmung und Texte einstellen.',
      a: 'ai', d: 'ai' },
    { t: 'Kosten und Lizenz', k: 'tarif_tarife_preis_preise_kosten_kostenlos_gratis_basis_pro_abo_lizenz_kaufen_buchen_upgrade_werbung_schloss_gesperrt_test_testen_probe',
      x: 'Die Fotobox-Software ist zurzeit komplett kostenlos – alle Funktionen, mit deinem eigenen Logo. Geld kosten nur KI-Bilder: Credits kaufst du im Online-Dashboard unter „Meine Lizenzen“ → KI-Guthaben. Fotomosaik, Live-Karikatur und Videonachricht kannst du 1 Monat kostenlos testen (mit 20 KI-Credits) oder bei Photobox Memories freischalten lassen.',
      a: '', d: 'tab:licenses' },
    { t: 'KI-Guthaben (Credits)', k: 'credits_credit_guthaben_ki_kaufen_aufladen_kosten',
      x: 'Jedes KI-Bild braucht Credits. Den Stand siehst du auf der KI-Seite, aufladen kannst du im Dashboard unter „Meine Lizenzen“.',
      a: 'ai', d: 'tab:licenses' },
    { t: 'Virtueller Berater', k: 'berater_virtueller_animation_animationen_ansage_ansagen_stimme_sprachansage_anleitung_spiegel',
      x: 'Animationen und Ansagen führen die Gäste durch die Aufnahme – je Schritt wählbar, auch gemischt.',
      a: 'voice', d: 'voice' },
    { t: 'Umfrage und Gäste-Daten', k: 'umfrage_formular_name_email_mail_telefon_newsletter_gaeste_daten_fragen_leads_kontakt',
      x: 'Name, E-Mail, Telefon und eigene Fragen abfragen. Die Antworten lädst du im Dashboard unter „Gäste-Daten“ herunter.',
      a: 'guests', d: 'survey' },
    { t: 'Haftungsausschluss', k: 'haftungsausschluss_einverstaendnis_zustimmung_datenschutz_bedingungen_agb_dsgvo',
      x: 'Gäste bestätigen vor der Aufnahme einen Text – sonst wird die Sitzung abgebrochen.',
      a: 'disc', d: 'survey' },
    { t: 'Sprache', k: 'sprache_sprachen_englisch_tuerkisch_deutsch_franzoesisch_flaggen_uebersetzung_language',
      x: 'Sprache des Menüs und der Gäste, Flaggen auf dem Startbildschirm und welche Sprachen angeboten werden.',
      a: 'lang', d: 'lang' },
    { t: 'Sicherheitspin und Sperren', k: 'pin_sicherheitspin_sperren_sperre_passwort_schuetzen_code_menue_gesperrt',
      x: 'Mit einem PIN kommen Gäste nicht ins Menü. „Sperren“ auf der Startseite sperrt die Fotobox sofort.',
      a: 'general#sPin', d: '' },
    { t: 'Bildschirmtastatur', k: 'tastatur_bildschirmtastatur_touch_keyboard_eingeben_tippen_schreiben_osk_buchstaben',
      x: 'Beim Antippen eines Textfelds blendet die Fotobox die Windows-Tastatur ein. Kommt sie nicht, hilft der Knopf „⌨ Tastatur“ unten rechts.',
      a: 'general#gOsk', d: '' },
    { t: 'Automatisch starten', k: 'autostart_automatisch_starten_windows_vollbild_letztes_ereignis_hochfahren',
      x: 'Beim Windows-Start automatisch öffnen, im Vollbild starten und gleich das letzte Ereignis starten.',
      a: 'general#gAutoEvent', d: '' },
    { t: 'Ereignis wechseln oder anlegen', k: 'ereignis_event_wechseln_anlegen_neues_neu_feier_hochzeit_auswaehlen',
      x: 'Jede Feier ist ein eigenes Ereignis mit eigenen Einstellungen und eigener Galerie.',
      a: '@switch', d: 'tab:events' },
    { t: 'Anmelden und Lizenz', k: 'anmelden_konto_login_lizenz_lizenzschluessel_registrieren_email_passwort_abmelden',
      x: 'Mit deinem Konto anmelden und den Lizenzschlüssel eintragen – nötig für Online-Galerie, QR-Code und KI.',
      a: 'general#sKey', d: 'tab:licenses' },
    { t: 'Neue Version (Update)', k: 'update_updates_aktualisieren_neue_version_herunterladen_installieren',
      x: 'Die Fotobox sucht selbst nach Updates. Die neueste Version gibt es auch im Dashboard unter „Geräte“.',
      a: '@update', d: 'tab:devices' },
    { t: 'Fotomosaik', k: 'mosaik_fotomosaik_klebewand_tafel_kacheln_grosses_bild',
      x: 'Aus vielen Gästefotos entsteht ein großes Bild – live auf dem Fernseher oder als Klebewand mit nummerierter Tafel.',
      a: 'mosaic', d: 'mosaic' },
    { t: 'Live-Karikatur', k: 'karikatur_karikaturen_zeichnung_zeichnen_live_selfie',
      x: 'Jedes Foto wird zur Karikatur und live Strich für Strich gezeichnet – auch per Selfie vom Handy.',
      a: 'cari', d: 'cari' },
    { t: 'Videonachricht und Begrüßungsvideo', k: 'videonachricht_nachricht_videobotschaft_begruessung_begruessungsvideo_handy_gaestebuch_brautpaar',
      x: 'Gäste scannen einen QR-Code und hinterlassen mit dem eigenen Handy eine Videonachricht. Vorher sehen sie auf Wunsch dein Begrüßungsvideo.',
      a: 'videomsg', d: 'videomsg' },
    { t: 'Slideshow auf dem Fernseher', k: 'slideshow_diashow_fernseher_beamer_zweiter_bildschirm_tv_praesentation',
      x: 'Zeigt alle Fotos des Ereignisses nacheinander – neue kommen von selbst dazu.',
      a: '@slideshow', d: 'dash' },
    { t: 'Fernsteuerung und Geräte', k: 'fernsteuerung_geraete_status_fernbedienung_testdruck_ferne_online_offline',
      x: 'Im Dashboard unter „Geräte“ siehst du jede Fotobox mit Kamera, Drucker und Ausdrucken – mit Testdruck aus der Ferne.',
      a: 'remote', d: 'tab:devices' },
    { t: 'Dein Logo auf den Gäste-Seiten', k: 'logo_werbung_download_seite_downloadseite_white_label_firmenname_link_mein_logo_galerie',
      x: 'Auf der Download-Seite und in der Galerie sehen die Gäste dein Logo, deinen Text und deinen Link.',
      a: '', d: 'tab:licenses' },
    { t: 'Speicherordner auf dem PC', k: 'ordner_speicherort_datenverzeichnis_fotos_pc_festplatte_speichern',
      x: 'In welchem Ordner auf dem PC die Fotos gespeichert werden.',
      a: 'general#sDirName', d: '' },
    { t: 'Fotos exportieren', k: 'export_exportieren_usb_stick_kopieren_alle_fotos_sichern_zip',
      x: 'An der Fotobox: Ereignis auf einen USB-Stick oder in einen Ordner exportieren. Im Dashboard: „Alle herunterladen“ in der Galerie.',
      a: '@export', d: 'dash' },
    { t: 'Hochladen hängt (Status zum Teilen)', k: 'status_warteschlange_upload_haengt_nicht_hochgeladen_offline_wartet',
      x: 'Zeigt, wie viele Fotos noch auf Internet warten. „Jetzt senden“ versucht es sofort.',
      a: 'status', d: '' },
    { t: 'Statistik', k: 'statistik_analysen_auswertung_anzahl_fotos_zahlen',
      x: 'Wie viele Fotos, GIFs und Videos an welchem Tag entstanden sind.',
      a: '', d: 'analytics' },
  ];
  const APP_PAGES = { design: 'Bildschirm-Editor', templates: 'Fotolayout', general: 'Allgemein', modes: 'Aufnahmeeinstellungen', camera: 'Kameraeinstellungen',
    voice: 'Virtueller Berater', effects: 'Effekte', ai: 'KI-Porträts', bg: 'Hintergrundentfernung', guests: 'Umfrage', disc: 'Haftungsausschluss',
    share: 'Einstellungen für Teilen', print: 'Druckeinstellungen', mosaic: 'Fotomosaik', cari: 'Live-Karikatur', videomsg: 'Videonachricht',
    status: 'Status zum Teilen', remote: 'Fernsteuerung', lang: 'Sprache' };
  const APP_SUBS = { start: 'Startbildschirm', cap: 'Aufnahmebildschirm', share: 'Bildschirm zum Teilen' }, APP_PANELS = { design: 'Design', set: 'Einstellungen' };
  const APP_ACTS = { switch: 'Ereignis wechseln', update: 'Nach Updates suchen', slideshow: 'Slideshow', export: 'Exportereignis' };
  const DASH_PAGES = { dash: 'Dashboard', analytics: 'Analysen', layout: 'Photo booth experience', capture: 'Aufnahmeeinstellungen', voice: 'Virtueller Berater', lang: 'Sprache',
    start: 'Startbildschirm', fx: 'Filter & Effekte', bg: 'Hintergrundentfernung', ai: 'KI-Porträts', survey: 'Umfrage & Haftungsausschluss',
    share: 'Einstellungen für Teilen', print: 'Druckeinstellungen', mosaic: 'Fotomosaik', cari: 'Live-Karikatur', videomsg: 'Videonachricht' };
  const DASH_TABS = { events: 'Ereignisse', devices: 'Geräte', leads: 'Gäste-Daten', licenses: 'Meine Lizenzen' };

  // Ziel zerlegen: Fotobox 'seite:unter:bereich#element' bzw. '@aktion', Dashboard 'seite#einstellung' bzw. 'tab:reiter'
  function appTarget(a) {
    if (!a) return null;
    if (a[0] === '@') return { act: a.slice(1) };
    const [path, focus] = a.split('#'), [page, sub, panel] = path.split(':');
    return { page, sub, panel, focus };
  }
  function dashTarget(d) {
    if (!d) return null;
    if (d.startsWith('tab:')) return { tab: d.slice(4) };
    const [page, focus] = d.split('#');
    return { page, focus };
  }
  // Weg dorthin als Stationen (jede Station ist ein Text der Oberfläche und wird mit übersetzt)
  function appPath(a) {
    const g = appTarget(a); if (!g) return [];
    if (g.act) return ['Startseite', 'Menü', APP_ACTS[g.act] || g.act];
    return ['Menü', APP_PAGES[g.page] || g.page, g.sub && APP_SUBS[g.sub], g.panel && APP_PANELS[g.panel]].filter(Boolean);
  }
  function dashPath(d) {
    const g = dashTarget(d); if (!g) return [];
    return g.tab ? [DASH_TABS[g.tab] || g.tab] : ['Ereignis', DASH_PAGES[g.page] || g.page];
  }

  // Suche: Umlaute wie „ae“, Tippfehler (ein bis zwei Buchstaben) und Wortanfänge zählen auch
  const norm = s => String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let low = i;
      for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); low = Math.min(low, cur[j]); }
      if (low > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  function wordScore(w, x) {
    if (x === w) return 1;
    if (x.startsWith(w)) return .85;
    if (w.length >= 4 && x.includes(w)) return .6;
    const max = w.length >= 8 ? 2 : 1;
    if (w.length >= 4 && lev(x, w, max) <= max) return .55;
    if (w.length >= 5 && x.length > w.length && lev(x.slice(0, w.length), w, 1) <= 1) return .45; // Tippfehler am Wortanfang
    return 0;
  }
  // tr: Übersetzung in die Sprache der Oberfläche – dann findet man Themen auch mit Wörtern dieser Sprache
  function search(q, tr = s => s) {
    const qs = norm(q).split(' ').filter(w => w.length >= 2);
    if (!qs.length) return [];
    const res = [];
    for (const t of TOPICS) {
      const fields = [[t.t + ' ' + tr(t.t), 3], [t.k, 2.5], [t.x + ' ' + tr(t.x), 1]].map(([s, wt]) => [norm(s).split(' '), wt]);
      let score = 0, hit = 0;
      for (const w of qs) {
        let best = 0;
        for (const [words, wt] of fields) for (const x of words) { const s = wordScore(w, x) * wt; if (s > best) best = s; }
        if (best) { hit++; score += best; }
      }
      if (hit) res.push({ t, score: score + hit * 4 - (qs.length - hit) * 3 });
    }
    res.sort((a, b) => b.score - a.score);
    return res.filter(r => r.score >= res[0].score * .5).slice(0, 8).map(r => r.t);
  }
  // Häufig gesucht (bei leerem Suchfeld)
  const POPULAR = ['Logo in der Startanimation', 'Fotolayout und Vorlagen', 'Drucker einstellen', 'Anzahl der Kopien', 'QR-Code zum Foto', 'Originalfotos hochladen', 'Kamera auswählen (Webcam oder Canon)', 'Virtueller Berater'];
  const popular = () => POPULAR.map(n => TOPICS.find(t => t.t === n)).filter(Boolean);

  G.FotoboxHelp = { TOPICS, search, popular, appTarget, dashTarget, appPath, dashPath };
})(typeof window !== 'undefined' ? window : globalThis);
