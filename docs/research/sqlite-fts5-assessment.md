# SQLite FTS5 a közös projekttudás kereséséhez

**Állapot: kutatási javaslat.** Ez a dokumentum a bevezetés feltételeit értékeli;
nem állítja, hogy a starter már szállít FTS5-keresőt. A dokumentált képességeket,
a helyi mérési eredményt és a javasolt alkalmazásműködést külön kezeli.

**A jelenlegi kiadás hatóköre:** a felhasználóval egyeztetve a generált index és
a célzott fájlos keresés marad. Az FTS5 bevezetését elhalasztjuk; a következő
értékeléshez konkrét keresési hiány vagy méretezési igény kell. Az alábbi ajánlás
egy későbbi bővítés lehetőségét őrzi meg, nem a mostani kiadás követelménye.

## Ajánlás

**Az FTS5 jó első keresőmotor ehhez a feladathoz.** A releváns dokumentumok
kiválasztását érdemes vele megoldani, a tudás tartalmát továbbra is Markdownban
tartva. Az ajánlott felosztás:

- **Markdown-források:** verziókezelt követelmények és döntések; ezeket írja és
  ellenőrzi a feladaton dolgozó agent, az elfogadást a tényleges jóváhagyás alapján.
- **Generált `INDEX.md`:** ugyanebből a forráskészletből készülő, ember és agent
  számára olvasható tartalomjegyzék. Az agent felel a forrásmetaadatokért és a
  generátor futtatásáért; a fejlesztőnek nem kell indexsorokat másolgatnia.
- **Helyi SQLite-cache:** eldobható, újraépíthető keresési segédlet az adott
  checkouthoz. Ne kerüljön verziókezelésbe, ZIP-be vagy másik agent gépére.

Ez saját architekturális ajánlás. A telepítési egyszerűséget az támogatja, hogy
az SQLite az alkalmazás folyamatában működik, külön adatbázis-szerver nélkül.
[SQLite: serverless működés](https://sqlite.org/serverless.html).

Az `INDEX.md` és az FTS5 ugyanannak a tudástárnak két különböző feladatú,
generált nézete lehet. A katalógus áttekintést és tartalék navigációt ad;
a kereső a feladathoz rangsorol. Az agent a kiválasztott teljes dokumentumból
állapítja meg, mi alkalmazható.

## Hogyan illeszkedne a skillekhez?

Az FTS5-integráció után a `find-repo-knowledge` alapértelmezett útvonala a
feladatból képzett keresés lenne. **Nem kell előbb az egész INDEX.md-t a modell
kontextusába tölteni.** Elsőre legfeljebb öt találati útvonal, cím és rövid részlet
érkezzen; ebből válassza ki az agent a teljesen elolvasandó dokumentumokat.
A megadott pontos fájlútvonalat közvetlenül is olvashatja. Sikertelen keresésnél
más kifejezések, majd a katalógus és a közvetlen fájlkeresés segít.

| Skill | Javasolt felelősség az FTS5 bevezetése után |
| --- | --- |
| `find-repo-knowledge` | Ellenőrzött cache → rangsorolt keresés → releváns teljes források és státuszuk olvasása. |
| `record-decision` | Forrás szerkesztése → a közös indexelő futtatása → tartalomjegyzék és helyi keresési állapot frissítése. |
| `refresh-repo-knowledge` | Változásjelzés után az aktuális feladat keresésének és forrásolvasásának megismétlése. |
| `validate-knowledge` | Az indexek és források egyezésének ellenőrzése, külön a tartalmi és jóváhagyási review-tól. |

A program a kereső skill saját `scripts/` mappájában legyen, a többi skill ezt
az egy megvalósítást használja. A mostani INDEX-generátor forrásbejárását ide
lehet összevonni; ne legyen két eltérő forráslista és két párhuzamos indexelő.
A CLI kérdéseket és útvonalakat kapjon, vendornevet vagy sessionjogosultságot nem
kell ismernie. Ez a következő implementáció terve, nem a jelenlegi skillek állítása.

## Mit jelentett eddig a „kézzel karbantartott” index?

A korábbi `record-decision` skill már az író agent feladatává tette az index
frissítését, de ezt csak szöveges utasítás támogatta. A félrevezető megfogalmazást
javítottuk. A starter most a skill saját `scripts/update-index.mjs` programjával
generálja a tartalomjegyzéket, `--check` módban pedig írás nélkül jelzi az eltérést.
A generátor a dokumentumok H1-címéből és útvonalából dolgozik, nem kér új kötelező
metaadatmezőket. Külön automatizált tesztek fedik le a működését.

Az FTS5 önmagában ezt nem javítja ki: a fájlok és a keresési állapot
összehangolását az alkalmazásnak kell megszerveznie. Az alábbi folyamat ezért
egyszerre rendezi a források, a katalógus és a kereső frissítésének felelősségét.

## Node.js: a „Node 22+” nem elég pontos követelmény

| Dokumentált tény | Következmény a csomagra |
| --- | --- |
| A `node:sqlite` a 22.5.0 verzióban jelent meg. A külön kísérleti flag a 22.13.0/23.4.0 verzióktól nem szükséges. | A 22.0–22.4 kiadásokra nem építhetünk. A flag elhagyhatósága még nem FTS5-garancia. |
| A 22.13.0 dokumentáció státusza `1.1 – Active development`. Az aktuálisan kiszolgált 26.8.2 dokumentáció `1.2 – Release candidate`; ezt a történet szerint 25.7.0-ban kapta. | Ne nevezzük a Node-kötést minden támogatott kiadásban stabil API-nak. A régebbi LTS és az aktuális dokumentáció státusza különbözik. |

Forrás: [aktuális Node SQLite API és verziótörténet](https://nodejs.org/api/sqlite.html),
[Node 22.13.0 SQLite API](https://nodejs.org/download/release/v22.13.0/docs/api/sqlite.html).

**Az FTS5 fordítási kapcsolója a 22.15.0 címkézett forrásában még hiányzik,
a 22.16.0 forrásában már szerepel.** A 22.16.0 kiadási jegyzete a kapcsolók
bekapcsolását is felsorolja. A 24.0.0 és 24.13.0 forrása szintén bekapcsolja,
külön operációsrendszer-feltétel nélkül.
[22.15.0 buildbeállítás](https://raw.githubusercontent.com/nodejs/node/v22.15.0/deps/sqlite/sqlite.gyp),
[22.16.0 buildbeállítás](https://raw.githubusercontent.com/nodejs/node/v22.16.0/deps/sqlite/sqlite.gyp),
[22.16.0 kiadás](https://nodejs.org/en/blog/release/v22.16.0),
[24.0.0 buildbeállítás](https://raw.githubusercontent.com/nodejs/node/v24.0.0/deps/sqlite/sqlite.gyp),
[24.13.0 buildbeállítás](https://raw.githubusercontent.com/nodejs/node/v24.13.0/deps/sqlite/sqlite.gyp).

**Javasolt támogatási feltétel:** támogatott LTS kiadás, legalább a 22.16.0
képességszintjével, és induláskori tényleges FTS5-próba. Egyedi vagy
disztribúciós Node-buildre ne pusztán a verziószám alapján mondjunk igent.
A képességteszt memória-adatbázisban hozzon létre FTS5-táblát, írjon bele és
keressen vissza; a fordítási kapcsoló lekérdezése hasznos diagnosztika, nem
helyettesíti ezt. Hiányzó támogatásnál a fájlos keresés maradjon használható.

A `DatabaseSync` műveletei szinkronok; a régi API már biztosít előkészített,
paraméterezhető lekérdezéseket.
[Node 22.13.0: DatabaseSync és StatementSync](https://nodejs.org/download/release/v22.13.0/docs/api/sqlite.html).
Ezért elsőre rövid életű CLI-t javaslok a skill `scripts/` mappájába; nincs ok
állandó háttérszolgáltatásra. Ha később egy tartós folyamatba kerül, külön kell
mérni a blokkolás hatását.

## Linux, macOS és Windows

A Node 24.13.0 hivatalos platformtáblája támogatott GNU/Linux x64/arm64,
Windows x64/arm64 és macOS x64/arm64 környezeteket sorol fel. A pontos
OS-/libc-minimum kiadásfüggő: például ennél a kiadásnál a glibc-alapú Linuxhoz
2.28+, macOS-hez 13.5+, Windows x64-hez Windows 10/Server 2016+ szerepel.
[Node 24.13.0 platformfeltételek és hivatalos binárisok](https://raw.githubusercontent.com/nodejs/node/v24.13.0/BUILDING.md).

**Következtetés:** megfelelő Node-binárissal a JavaScript + beépített SQLite
útvonal nem kér külön npm-es natív csomagot vagy SQLite CLI-t. A támogatást
azonban saját Windows/Linux/macOS tesztmátrixszal kell lezárni; a platformlista
nem a mi csomagunk tesztjegyzőkönyve. A WSL-es mérés sem helyettesít macOS-tesztet.

## Milyen keresést ad, és hol vannak a korlátai?

Az alábbi FTS5-képességek dokumentáltak; a saját tudástár találati minőségét
külön kell mérni.

| Képesség | Jelentés |
| --- | --- |
| Token és kifejezés | Szavakra, illetve rendezett szósorozatokra keres; ez nem bájtpontos fájlszöveg-egyezés. |
| Prefix, például `feladat*` | Szókezdetet keres. Külön prefixindex gyorsíthatja; a szótövezést nem helyettesíti. |
| Trigram | Részszöveget talál; három karakternél rövidebb FTS-lekérdezés nem ad találatot. |
| BM25 és oszlopsúly | Rangsorolás, például a cím találatának nagyobb súllyal; FTS5-ben a kisebb pontszám jobb. |
| `snippet()` | Rövid találati környezetet ad a forrás kiválasztásához. |

[SQLite FTS5: lekérdezések, tokenizálók és rangsorolás](https://sqlite.org/fts5.html).

A `unicode61` kis-/nagybetűt normalizál, a latin ékezeteket is tudja eltávolítani;
a `remove_diacritics 2` teljesebb mód. A Porter angol szótövező. A `unicode61`
nem oldja meg a magyar ragozást. A hagyományos FTS5-tábla `INSERT`, `UPDATE`,
`DELETE` műveleteket támogat, a tartalmat is tárolja.
[SQLite FTS5: unicode61, Porter és táblaműveletek](https://sqlite.org/fts5.html).

**Javasolt kezdőbeállítás:** `unicode61 remove_diacritics 2`; magasabb címsúly;
egy dokumentum egy találat. Azonosítót és relatív útvonalat pontos mezőként is
tartsunk meg, hogy egy megadott ADR-ID ne csak a szöveges rangsoron múljon.
Trigramot és prefixindexet csak konkrét, mért igényhez adjunk.

Magyar anyagnál a „feladat” és „feladatot” jellegű esetet prefixszel lehet
vizsgálni, de a tőváltozás és a más szóval megfogalmazott azonos jelentés
külön probléma. A címet író agent adjon jó keresési kifejezéseket a
forrásmetaadatokhoz. Sikertelen keresésnél próbáljon kapcsolódó magyar/angol
kifejezést és közvetlen fájlkeresést; az üres találat ne váljon „nincs ilyen
követelmény” állítássá. Az ékezet nélküli keresés találatai között az eredeti
szöveg és cím mindig maradjon látható.

Az embedding-alapú keresés más elven, modell által képzett vektorok
hasonlóságából közelít szemantikai egyezéshez; ezt például a Sentence-BERT
eredeti tanulmánya írja le.
[Sentence-BERT, Reimers és Gurevych](https://arxiv.org/abs/1908.10084).
**Saját döntési javaslat:** elsőre ne vezessünk be embeddingmodellt, API-kulcsot,
vektoradatbázist vagy hibrid rangsorolást. Előbb mérjük meg, mely fontos kérdések
maradnak megválaszolatlanok a lexikai kereséssel. A magyar szinonimák és
parafrázisok kezelése nyitott minőségi kérdés, nem automatikus FTS5-képesség.

## Javasolt frissítési folyamat

Az alábbiak alkalmazásszintű tervezési döntések, nem SQLite által automatikusan
nyújtott fájlszinkronizálási szolgáltatások.

1. **Az író agent a forrást szerkeszti.** A dokumentumnak legyen informatív címe;
   a döntésrekordban az azonosító, státusz és verzió is a forrásban maradjon.
   Az index a címből és útvonalból, a kereső a címből és teljes szövegből dolgozzon.
   Ne lehessen az indexből javaslatot elfogadott döntéssé emelni.
2. **Egy közös indexelő összegyűjti az engedélyezett Markdown-forrásokat.**
   A generált `INDEX.md` és a runtime-könyvtár maradjon ki a bemeneti halmazból.
   Így az index nem indexeli önmagát, és nem lesz önmagát újraindító frissítési kör.
3. **A generátor ugyanabból a pillanatképből állítja elő a katalógust és a
   keresési változáslistát.** Stabil rendezés, állandó formázás; futási időbélyeg
   ne okozzon diffet. Változatlan bemenetnél sem fájlátírás, sem SQL-adatmódosítás
   nem szükséges. A `--check` eltérést jelezzen, módosítás nélkül.
4. **Keresés előtt a program ellenőrzi a forráshalmazt.** A lokális állapot
   tartalmazza a kanonikus repoazonosságot, a sémaverziót, a tokenizáló beállítását,
   a relatív útvonalakat és tartalomhasheket. Hozzáadás bekerül; módosítás frissül;
   törlés kikerül. Átnevezés elsőre törlés és hozzáadás lehet.
5. **Az SQL-frissítés egy tranzakcióban történik.** A dokumentum-adatok, az FTS
   és a pillanatkép-jelölő együtt váltsanak. Hibánál ne jelöljük frissnek a cache-t.
   Kezdetben egyszerű, saját tartalmát tároló FTS-táblát javaslok; a kevésbé
   átlátható, külső tartalomra mutató konstrukció nem szükséges.
6. **Az agent csak néhány találatot kap.** Útvonal, cím és rövid részlet;
   döntésrekordnál a megbízhatóan kiolvasott ID, verzió és státusz is szerepelhet.
   A hiányzó mezőket ne találjuk ki. Utána az agent a szükséges teljes dokumentumot olvassa.
   A státuszok legyenek jól láthatók, a javaslat ne rejtse el az érvényes elődjét.
   A keresési eredmény nem döntés, jóváhagyás vagy a forrás elolvasásának bizonyítéka.

A fájlrendszer ellenőrzése és az SQL-tranzakció nem egyetlen közös atomikus
művelet. Az implementáció kezelje a közben változó forrást: ellenőrizze újra a
pillanatképet, korlátozottan próbálkozzon újra, és tartós változásnál jelezze,
hogy a keresési állapot nem igazoltan friss. Ezt nem oldja meg az, hogy
„tranzakcióban indexelünk”. A keresés után a teljes forrás olvasása továbbra is kell.

**A tokenköltség és a lemezolvasás két külön kérdés.** A program helyben
végigellenőrizheti a forrásokat anélkül, hogy mindet a modell kontextusába töltené.
Elsőre a tartalomhashes ellenőrzést javaslom a helyesség miatt. Méret és
módosítási idő alapján gyorsítani csak külön helyességi és branchváltási
tesztekkel érdemes; önmagukban nem bizonyítják az azonos tartalmat.

## Branchek, több agent és hookok

- A cache **checkoutonként** tartozzon a forráshalmazhoz. A branch neve vagy a
  commitazonosító önmagában nem írja le a munkamappa nem commitolt tartalmát.
  A program az aktuális fájlokat vizsgálja, így Git és Plastic mellett is
  ugyanaz az elv alkalmazható.
- Azonos munkamappában dolgozó Claude és Codex ugyanazokat a fájlokat találja;
  a keresőnek nem kell vendort felismernie. Külön checkoutban minden agent a
  saját fájljait indexeli. A másik branch változásának átvitele normál review/
  verziókezelési folyamat; az SQLite nem szinkronizálja a csapat repóit.
- A `record-decision` végén fusson a generálás és ellenőrzés. A kereső indítása
  biztosítsa a cache frissítését akkor is, ha az író folyamat korábban megszakadt.
  A hook a forrásváltozást észlelve a meglévő újraolvasási workflow-t kérje.
- A hook ne váljon minden toolhívás után teljes újraindexelővé. A generált
  katalógus tényleges változása része lehet az értesítésnek, a SQLite-cache
  átírása viszont ne legyen új tudásesemény. A keresés sem indítja el önmagától
  egy másik, tétlen session munkáját.

## Egyidejű hozzáférés, WAL és hálózati fájlok

SQLite-ban több olvasó mellett egyszerre egy írási tranzakció dolgozhat.
A `BEGIN IMMEDIATE` már az elején írónak jelentkezik; foglalt adatbázisnál
hibázhat. A tranzakció elszigetelt SQL-pillantképet ad, nem a Markdown-fájlok
lezárását.
[SQLite tranzakciók](https://sqlite.org/lang_transaction.html).
A `PRAGMA busy_timeout` várakozási korlátot adhat a zárolási ütközésekre.
[SQLite busy timeout](https://sqlite.org/pragma.html#pragma_busy_timeout).

**Javasolt első implementáció:** rövid tranzakciók, korlátozott várakozás és
újrapróbálás, alapértelmezett rollback journal. A zárolás megszerzése után
újra kell olvasni a cache állapotát: két agent ne írjon vissza egy korábban
összeállított, már elavult frissítési tervet. Az adatbázis sérülése vagy hiánya
újraépítést jelentsen. Érvényességi hiba esetén a program kínáljon fájlos
keresést; régi találatot ne adjon ki frissként.

WAL-ban az olvasás és írás együtt futhat, de továbbra is egy író van;
`-wal` és `-shm` kísérőfájlok jelenhetnek meg. A megoldás azonos gépet igényel,
hálózati fájlrendszeren nem használható. Az SQLite dokumentál egy ritka
WAL-reset versenyhelyzetet is: a javítás 3.51.3-ban, illetve a 3.50.7/3.44.6
visszaportokban szerepel; több kapcsolat egyidejű írása/checkpointja érintett.
[SQLite WAL, konkurencia és WAL-reset javítás](https://sqlite.org/wal.html).

**Következtetés:** WAL-t csak mért szükség és javított, ténylegesen ellenőrzött
SQLite-runtime mellett kapcsoljunk be. A helyben jelzett 3.50.4-et nem ajánlom
ehhez az opcionális módhoz. A normál helyi cache-hez a rollback journal
egyszerűbb kezdés. A csapat ne közös hálózati DB-fájlt használjon; hálózati
checkoutnál a cache kerüljön a gép saját helyi cache-könyvtárába. Windows és WSL
folyamatok között se osszunk meg élő DB-fájlt külön fájlrendszer-teszt nélkül.

## Helyi próba: 21 viselkedési ellenőrzés

Reprodukálható program: [fts5-probe.mjs](fts5-probe.mjs).
Rögzített eredmény: [fts5-probe-results.json](fts5-probe-results.json).
A repo gyökerében `node docs/research/fts5-probe.mjs` futtatja; a benchmarkhoz
`rg` is szükséges. A program ideiglenes korpuszt és adatbázist készít, majd törli
őket. Csak a kutatási JSON-eredményt írja vissza. A kutatási fájlok nem kerülnek
a letölthető starterbe.

**Környezet:** Windows, Node 24.13.0, SQLite 3.50.4, tényleges FTS5-tábla,
`journal_mode=DELETE`. A Node kísérleti figyelmeztetést adott. **21/21 ellenőrzés
sikeres**, beleértve az ismert korlátokat igazoló próbákat is:

- Ékezet nélküli `hitelesites` megtalálja a `Hitelesítés` címet.
- `feladat` nem találja a csak `feladatok` szót tartalmazó dokumentumot;
  a kifejezetten kért `feladat*` prefix igen. `reopen` nem találja automatikusan
  a magyar `újranyitása` megfelelőjét.
- `Prompt` nem találja a `UserPromptSubmit` tokent; trigrammal igen.
  A trigram kétkarakteres `UI` keresése viszont nem ad találatot.
- Működik a címsúlyozás, a rövid találati részlet és a lekérdezési szintaxisnak
  látszó bemenet egyszerű keresőszövegként kezelése.
- A módosítás, átnevezés és törlés bekerül a frissített keresőbe.
  Szinkronizálás nélkül a korábbi találat megmarad: a cache valóban el tud avulni.
- Változatlan forrásnál az adatbázis bájtjai sem módosulnak. Azonos méretű,
  visszaállított módosítási idejű fájlváltozást a tartalomhash felismer.
- A megszakított SQL-tranzakció visszaáll, a második kapcsolat a commitolt
  állapotot látja; az íróütközés hibát ad, majd feloldás után újrapróbálható.

Az utolsó próba **egy folyamat két kapcsolatát** méri, nem két külön agentet.
A prototípus a változáslistát a tranzakció előtt készíti; ez kutatási egyszerűsítés,
amely éles többírós működéshez nem elegendő. Az ajánlott zárolás utáni újraolvasás,
sérült cache helyreállítása és a források közbeni módosításának kezelése még
termékimplementációs feladat.

## Mérés: a frissesség ára nagyobb a lekérdezésénél

Szintetikus, ismétlődő angol döntésdokumentumokon, meleg fájlrendszer-cache mellett:

| Dokumentum | Forrás / SQLite méret | Első feltöltés | FTS: első 5 találat | Összes fájl hash-e + FTS | `rg -l`: minden találó fájl |
| --- | --- | --- | --- | --- | --- |
| 100 | 115 190 / 192 512 bájt | 92,88 ms | 0,58 ms | 76,19 ms | 84,10 ms; 20 fájl |
| 1000 | 1 152 890 / 1 638 400 bájt | 777,00 ms | 0,72 ms | 701,34 ms | 302,85 ms; 200 fájl |

A keresési értékek mediánok: 30 FTS-lekérdezés, 5 teljes ellenőrzés és 5 `rg`
futtatás. Az első feltöltés egyetlen mérés; a fájlokat közvetlenül előtte írtuk,
ez nem hideg lemezes benchmark. A tiszta FTS-időből hiányzik a folyamatindítás és
a frissességvizsgálat. Az `rg` idejében benne van a külön folyamat indítása,
és más a kimenete: rangsor és részlet nélkül minden találó fájlt visszaad.

**Ebből nem következik általános gyorsulási arány.** Ezen a gépen 1000 fájlnál
a teljes újraellenőrzéses FTS-folyamat lassabb volt a fájlos keresésnél. Az FTS
közvetlen előnye a rangsorolt, rövid találati lista: a modellnek kevesebb jelölt
közül kell forrást választania. A tényleges tokenmegtakarítást és találati
minőséget ez a próba nem méri.

**Megvalósítási következmény:** egy keresési kör elején ellenőrizzük a forrásokat,
majd az így azonosított pillanatképen több kapcsolódó lekérdezés futhat. Az író
agent mentés után frissítsen; az olvasó akkor se bízzon vakon a cache-ben, ha az
író megszakadt. Ne indexeljünk újra minden hookeseménynél. Az egyfájlos frissítés,
a teljes folyamatindítás és a valós kérdések találati minősége a következő mérés.

## Mi bizonyított, és mi szükséges a bevezetéshez?

**Dokumentált:** a fenti FTS5-funkciók, a Node-verziók API-/buildadatai és az
SQLite konkurenciakorlátai. Ezek alapján az irány megvalósítható.

**Helyben mért:** a fenti 21 viselkedési próba és két korpuszméret benchmarkja.
Az INDEX.md-generátor külön elkészült; a keresési prototípus nem része a
szállított skilleknek, és még nem készült el a termék FTS5-integrációja.

**A bevezetés előtt mérendő:**

- Valós magyar/angol kérdéssor: helyes dokumentum az első öt találat között;
  pontos ID, ékezet, rag, tőváltozat, szinonima, elavult és javasolt döntés.
- Hideg indexépítés, változatlan keresés, egyetlen forrás módosítása, teljes
  branchváltás; külön a fájlellenőrzés, SQL-keresés és teljes folyamat ideje.
- A végleges implementációban is igazolt idempotencia, hozzáadás/átnevezés/törlés;
  hiányzó és sérült cache, megszakított generálás, két külön folyamatban futó agent,
  olvasás közbeni forrásváltozás.
- Windows/Linux/macOS és ékezetes/szóközös útvonalak; a támogatott minimum
  Node-verzió valódi binárisa; FTS5 nélküli runtime érthető fallbackje.
- A keresési találatból valódi teljesforrás-olvasás és helyes státuszkezelés
  legalább egy agenttel, utána mindkét kliensben.

Egy kis szintetikus korpuszon mért gyorsabb SQL-lekérdezés nem bizonyítja, hogy
a teljes workflow gyorsabb vagy a találati minőség elég jó. Ha a fenti próbák
megfelelő eredményt adnak, az ajánlott szállítási egység egy skillhez tartozó
helyi indexelő/kereső program és a hozzá kapcsolódó workflow-frissítés. Új
szerver, MCP-réteg vagy A2A-csatorna ehhez az első lépéshez nem indokolt.
