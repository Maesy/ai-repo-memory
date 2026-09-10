# Érvényesség és karbantartás

- Egy dokumentum azonosítója maradjon állandó. A tárgya és alkalmazási területe legyen világos.
- `proposed`: még nem elfogadott. PRD-nél az `active`, döntésnél az `accepted`
  jelenti az alkalmazható állapotot. `superseded`: új dokumentum váltotta fel.
  `deprecated`: már nem alkalmazzuk, utód nélkül.
- Elfogadáskor rögzíts valódi jóváhagyót, dátumot és visszakereshető alapot
  (például PR, issue vagy a döntéshozó egyértelmű megerősítése). Ezeket ne találd ki.
- Új verzió nem örökli automatikusan az előző jóváhagyását. Nyitott változásnál
  őrizd meg az érvényes követelményt, és külön javaslatban írd le az utódot.
- Elfogadott ADR/PDR lényegi megváltoztatásához új döntésrekord kell.
  Kapcsold össze a két rekordot `supersedes` / `superseded_by` azonosítóval.
- A dokumentumverzió csapatkonvenció: PATCH = jelentés nélküli pontosítás,
  MINOR = kompatibilis bővítés, MAJOR = korábbi elvárást érvénytelenítő változás.
  Egy új követelmény is lehet MAJOR; a szoftver és a dokumentum verziója külön adat.
- `updated_at` csak tényleges módosításkor változzon. `reviewed_at` csak valódi
  felülvizsgálatot jelentsen, `reviewed_version` pedig annak pontos verzióját.
  Használj ISO 8601 dátumot/időt, időpontnál időzónával.
- A régi dátum felülvizsgálatot indokolhat, de nem bizonyítja az állítás hamisságát.
- Minden tudásváltozásnak legyen felelőse. A rendszeres review gyakoriságát a csapat
  a változás üteméhez igazítsa; elavult feladatátadás ne váljon tartós követelménnyé.

## Készre jelentés előtt

- Teljes forrásolvasás; nincs fel nem oldott ellentmondás vagy nem jelölt bizonytalanság.
- Helyes célmappa, egyedi ID, értelmes verzió és a tényleges állapotnak megfelelő státusz.
- Létező hivatkozások; az indexből elérhető forrás; az utódlási lánc nem körkörös.
- A jóváhagyási állítás visszakereshető, és a mostani verzióhoz tartozik.
- A teszt bizonyítékát külön kezeld az elvárástól. Strukturális helyességből nem
  következik üzleti helyesség vagy sikeres megvalósítás.
- Nézd át a teljes változási listát és diffet. Írást, commitot vagy törlést meghatározó
  fájllistát ne csonkíts; kimenetszűrőnél ellenőrizd a szűretlen eredményt is.

Ez az alap ellenőrzési eljárása. Nincs beépített gépi sémaellenőrző, tartalomhash,
írózár vagy megértést bizonyító nyugtázás.
