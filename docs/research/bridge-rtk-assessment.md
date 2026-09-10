# Codex bridge és RTK: bevezetési vizsgálat

**Történeti vizsgálat; a bridge bevezetési ajánlása visszavonva.** A desktop
integráció korlátai miatt a starter 1.1.0 a [helyi hookokra](../hooks.md) épül.
Ez a kutatási jegyzet nem része a letölthető előadásanyagnak.

Állapot: **kutatási jegyzet és javaslat**, nem elfogadott követelmény vagy bekapcsolt integráció.
Ellenőrzés: **2026-09-10**. A forrásokból igazolható működést külön kezeljük a helyben
kipróbált működéstől. Bridge-telepítés, MCP-regisztráció és élő agent–agent kérés nem történt.

## Összesített javaslat

**Az RTK hordozható használati szabályai jó kiegészítést jelentenének. A bridge-et
nem tennénk a mindenki számára kötelező alap részévé.** A kettő eltérő problémát old
meg: az RTK a shellkimenet méretét csökkenti, a bridge a feladat- és válaszátadást
segíti. Egyik sem bizonyítja a követelmények betöltését, helyes értelmezését vagy
betartását. Ezekhez a starter jelenlegi explicit olvasási és ellenőrzési folyamata
változatlanul szükséges.

| Szempont | Jelenlegi alap | RTK kiegészítéssel | Bridge hozzáadásával |
| --- | --- | --- | --- |
| Projektfüggetlenség | Nincs kötelező runtime vagy csomagkezelő | Megmaradhat; opcionális natív bináris | Node és kliensintegráció kell a használatához |
| Parancskimenet | A kliens és a parancs formázásától függ | Támogatott parancsoknál kisebb lehet | Közvetlenül nem javítja |
| Két agent közötti átadás | Ember vagy kliens kezdeményezi | Ezen nem változtat | Célzott küldés és válaszkezelés automatizálható |
| Tudás frissítése | Utasítás és explicit fájlolvasás | Ezen nem változtat | Értesítés szállítható, de a frissítés külön feladat |
| Nettó modellfelhasználás | Feladatfüggő | Kimenetaránytól és szűréstől függően csökkenhet | Második agent miatt nőhet is |
| Karbantartási teher | Alacsony | Verzió- és szűrőellenőrzés | További runtime, auth, jogosultság és klienskompatibilitás |

A reggeli tapasztalatok jelentős részét már tartalmazza az
[utasításbetöltési útmutató](../instruction-loading.md). Az RTK.md hozzáadása ezek
mellé a konkrét parancshasználatot pontosítaná; nem új memóriarendszert hozna létre.

## Bridge: megállapítások

### Kiindulópont és ellenőrzött változat

A vizsgálat idején az akkori kommunikációs útmutató opcionális
kommunikációs rétegként kezelte a bridge-et. A [tudáskezelési alap](../knowledge/README.md)
explicit forrásolvasást és frissítést kér; nem indít háttérfigyelőt.

Az upstream `main` ellenőrzött commitja továbbra is
`8cea74351c0a4d852cf1ba9f97775c4f33873d00`; a csomag verziója **1.15.0**,
Node-igénye **22+**. A futó csomag az MCP SDK-t és Zodot is használja.
Ez a Git-forrás állapota; npm-kiadást és helyi bridge-telepítést nem ellenőriztünk.
[Csomagdefiníció](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/package.json)

A dokumentált telepítés npm-alapú. Az app-server útvonalhoz bejelentkezett Codex CLI,
a Claude oldalon megfelelő MCP-kliens kell. A natív desktop útvonal további companiont
és kliensregisztrációt igényel. Ezek a fejlesztői környezet eszközei lehetnek:
egy Kotlin-alkalmazásnak ettől nem kell Node-alkalmazássá válnia, de a kötelező
bridge megszüntetné a starter jelenlegi futtatókörnyezet-mentességét.
[Telepítési útmutató](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/README.md#requirements)

### Miben ad többet?

| Feladat | Forrásból ellenőrzött képesség |
| --- | --- |
| Claude → Codex | Új feladat indítása vagy meglévő feladat folytatása, válasz megvárása, előzmények és állapot lekérdezése. |
| Codex → Claude | Futó Claude Code session felderítése, célzott üzenet, kézbesítési státusz és válasz követése. Nem indít helyettesítő Claude sessiont. |
| Késői válasz | A korrelált Claude-választ a bridge visszatovábbíthatja az eredeti Codex-feladatba; nem kell kézzel átmásolni. |
| Natív desktop feladat | Pontos helyi projekt-egyezés esetén a Codex app saját feladatán keresztül dolgozik; nem csatlakoztat második írót. |

Források: [Claude → Codex eszközök](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/index.mjs),
[Codex → Claude eszközök](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/claude-bridge.mjs),
[válasz-visszatovábbítás](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/reply-forwarder.mjs),
[desktop kézbesítés](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/thread-delivery.mjs).

A hívás indításáról továbbra is a felhasználó, az agent vagy egy külön megírt hook
dönt. A kézbesítés és a válaszkezelés automatizált; **a bridge önmagában nem
figyeli a PRD/ADR fájlokat, nem választ tudásváltozásra címzettet, és nem végzi el
a fogadó forrásfrissítését**. Ez a feladatfelszín és a kód áttekintéséből levont
következtetés. A kompatibilis bridge-worker automatikus újratöltése a bridge saját
forrásfrissítését kezeli, nem a projekt tudásanyagát.
[MCP-eszközök](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/index.mjs),
[worker-felügyelet](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/mcp-supervisor.mjs)

### A bevezetési döntést érdemben befolyásoló korlátok

- **A natív desktop kapcsolat nem nyilvános kompatibilitási szerződésre épül.**
  A forrás maga is belső Codex Desktop pipe-ként és nem dokumentált Claude peer
  protokollként írja le az érintett felületeket. Egy kliensfrissítés után ezért
  új integrációs próba indokolt.
  [Natív relay forrása](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/native-relay.mjs#L28-L34)
- **A Codex → Claude desktop útvonal jelenleg szűk jogosultsági profilt támogat.**
  A feladó ellenőrzése `disabled` permission profile-t, `danger-full-access`
  sandboxot és `user` approval reviewert vár; más profilt visszautasít.
  A `never` és a megerősítést kérő approval policy külön osztályt kap.
  Ez nem a két eszköz általános követelménye, hanem e bridge-változat korlátja.
  **A starterben nem indokolt pusztán a bridge kedvéért feloldani a sandboxot.**
  [Feladói profil ellenőrzése](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/codex-sender-context.mjs#L109-L120)
- **A desktop account-felderítés sem univerzális:** a Codex oldalon fájlban
  tárolt ChatGPT-bejelentkezést vár; a keyring/auto/ephemeral tárolást nem tekinti
  igazoltnak. Ezt minden célgépen ellenőrizni kell.
  [Account-felderítés](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/codex-account-context.mjs)
- **Windows alatt van natív named-pipe megvalósítás** és Windows/Node 22, 24 CI-mátrix.
  A natív desktop relay dokumentált célplatformja Windows/macOS; a Linux app-server
  támogatás nem bizonyít Linux desktop relay-t. Helyi kétklienses próba nem történt.
  [Peer-megvalósítás](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/peer-protocol.mjs),
  [CI-konfiguráció](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/.github/workflows/ci.yml)
- **A bridge nem szinkronizál Git-worktree-ket és nem koordinálja a fájlírókat.**
  Natív feladatindításkor a pontosan egyező, már mentett projekt meglévő helyi
  checkoutját használja; nem hoz létre külön worktree-t. A közös fájloknál az
  egy kijelölt író szabályára továbbra is szükség van.
  [Projektválasztás és feladatindítás](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/thread-delivery.mjs)

### Kézbesítés, ismétlés és költség

A natív Codex-feladat létrehozása tartós nyugtával védi az ismétlést: azonos
kanonikus workspace és explicit cím ugyanarra a feladatra mutat, még módosított
feladatleírásnál is. Folytatáshoz külön küldés kell. Bizonytalan eredménynél nem
indít automatikusan másik feladatot vagy másik backendet.
[Létrehozási nyugták](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/desktop-task-receipts.mjs),
[nyugta felhasználása](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/thread-delivery.mjs)

A Claude felé küldött függő üzenet blokkolja az ugyanoda menő további küldést.
A folyamat újraindítása elveszítheti a memóriabeli nyugtákat. A futó Claude-turnbe
érkezett üzenetnél a visszaolvasott zárószöveg `absorbed` jelölést kaphat: ez
**nem bizonyítja, hogy a fogadó a kérést feldolgozta**. A korrelált válasz és
a frissített tudás alkalmazása ezért külön ellenőrzés.
[Peer és transcript-korreláció](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/peer-protocol.mjs),
[eszközválaszok](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/claude-bridge.mjs)

A bridge **nem garantált tokenmegtakarítás**. Az új agent saját modellfutása és
a visszajuttatott szöveg további kontextust használ. Az app-server válaszformázó
legfeljebb 12 aktivitást sorol, a parancsokat és fájllistákat rövidíti; ez nem
teljes bizonyítéklista. A natív relay 128 KiB-os keretkorlátot használ.
A válasz-visszatovábbítás 5 másodpercenként legfeljebb egy próbát, futásonként
legfeljebb 50 próbát enged. Ezek szállítási és üzemeltetési korlátok,
nem megtakarítási vagy minőségi mérőszámok.
[Válaszformázás](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/index.mjs#L291-L329),
[keretkorlát](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/native-relay.mjs#L41-L47),
[visszatovábbítás](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/reply-forwarder.mjs)

### Egyszerűbb hivatalos alternatíva

Az OpenAI jelenlegi dokumentációja a **`codex mcp-server` parancsot elavultnak
jelöli**, és Claude Code-hoz a hivatalos Codex plugint ajánlja. A helyi CLI helpje
még felsorolja a régi parancsot; ettől az új integrációhoz nem ez az ajánlott út.
[OpenAI MCP Server dokumentáció](https://learn.chatgpt.com/docs/mcp-server)

A hivatalos **Codex plugin for Claude Code** review-t, delegált feladatot,
háttérfutást, eredmény-lekérdezést, folytatást és sessionátadást biztosít a Codex
app-serveren keresztül. Az ellenőrzött forrás commitja
`db52e28f4d9ded852ab3942cea316258ae4ef346`; Node **18.18+** és elérhető,
bejelentkezett Codex kell hozzá. Ez is opcionális fejlesztői eszköz.
A leírt képességek alapján nem állítunk két már futó desktop-session közötti
szimmetrikus üzenetküldést. Az opcionális Stop review gate növelheti az
automatizálást, de a gyártó is jelzi a hosszú review-hurok és a limitfogyás
lehetőségét; alapértelmezett bekapcsolását nem javasoljuk.
[Hivatalos plugin, rögzített forrás](https://github.com/openai/codex-plugin-cc/blob/db52e28f4d9ded852ab3942cea316258ae4ef346/README.md)

**Javaslat:** alkalmi Claude → Codex reviewhoz/delegáláshoz először a hivatalos
plugint érdemes kipróbálni. A bridge külön, választható profilt akkor indokol,
ha a csapat igazolt igénye két élő desktop-session közvetlen együttműködése,
és a célgépek jogosultsági, account- és klienskorlátai teljesülnek.
Egyetlen agent használatakor a bridge nem hoz ilyen előnyt.

Érdemi százalék csak mérésből adható: azonos feladatoknál számoljuk a kézi
átadásokat, a várakozási időt, a két agent összesített felhasználását és a
hibás vagy elakadt kézbesítéseket. A sikeres üzenet mellett külön vizsgáljuk,
hogy a fogadó a megfelelő checkoutban a helyes dokumentumverziót olvasta-e el.

## RTK: megállapítások

### Ellenőrzött állapot és a hordozhatóság határa

A helyi RTK verziója **0.48.0**. Az upstream ellenőrzött kiadása **v0.48.0**, commitja
**fde0a8f185945556f51718de0f4c430bb62b3df6**. A dokumentáció szerint natív Rust
binárisként telepíthető, Windows-kiadása is van; ehhez nem kell npm. A forrásban
külön Gradle-kezelő található, amely a projekt saját wrapperét keresi, Windows alatt
is. Ez alátámasztja, hogy Kotlin-projekthez is lehet hasznos; valódi Kotlin-buildet
itt nem futtattunk.
[RTK kiadás](https://github.com/rtk-ai/rtk/releases/tag/v0.48.0),
[Gradle-kezelő](https://github.com/rtk-ai/rtk/blob/fde0a8f185945556f51718de0f4c430bb62b3df6/src/cmds/jvm/gradlew_cmd.rs)

A reggeli tapasztalatokhoz kapcsolódó OIMP RTK.md-t és helyi szűrőjét teljesen
elolvastuk. Ezek Plastic SCM-re, annak státuszkimenetére és az ottani gépbeállításra
is tartalmaznak szabályokat. **Változtatás nélküli átvételük a Git-alapú starterbe
hibás lenne.** A generikus rész hordozható; a Plastic-parancsok, abszolút helyi
útvonalak és projektspecifikus szűrők nem.

### A reggeli betöltési probléma még releváns

Az RTK jelenlegi Codex-inicializálója továbbra is egy @RTK.md hivatkozást ír az
AGENTS.md-be; régi RTK blokk esetén az inline részt el is távolíthatja. A kód globális
esetben abszolút @hivatkozást használ, de az abszolút útvonal önmagában nem hoz létre
importmechanizmust. Ez a reggeli megfigyelés alapján nem megbízható betöltési alap.
A vizsgálat során az inicializálót nem futtattuk le.
[Inicializáló, rögzített forrás](https://github.com/rtk-ai/rtk/blob/fde0a8f185945556f51718de0f4c430bb62b3df6/src/hooks/init.rs#L2393-L2436),
[AGENTS.md módosítása](https://github.com/rtk-ai/rtk/blob/fde0a8f185945556f51718de0f4c430bb62b3df6/src/hooks/init.rs#L2671-L2688)

Ezért az ajánlott kialakítás:

- Az AGENTS.md közvetlenül tartalmazza a rövid, kritikus szabályt: a döntést,
  írást vagy commitot meghatározó kimenetet teljes terjedelmében ellenőrizzük.
- A részletes szabályok egyetlen RTK.md-ben legyenek. Az AGENTS.md kifejezetten
  utasítson annak elolvasására a parancsfuttatást érintő munka előtt.
- A CLAUDE.md maradjon vékony adapter; ne másoljuk bele ugyanazt a szabályrendszert.
- Ha nincs RTK a gépen, a starter maradjon használható a projekt saját parancsaival;
  az agent jelezze a hiányát, ne telepítsen automatikusan globális eszközt.
- Ne futtassunk vakon rtk init parancsot a gondosan kialakított közös instrukciókra.

A Codex dokumentált AGENTS.md-felderítése és a tényleges fájlolvasás külön dolog;
a fájlra mutató útvonal nem bizonyítja annak beolvasását.
[OpenAI: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

### Mi automatizálható és mi nem?

Claude Code-hoz az RTK natív PreToolUse hookot ad. Ez a támogatott parancsfuttató
eszközök hívásait átírhatja, így nem minden prefix az agent figyelmén múlik. A
jelenlegi natív Windows hookhoz nem szükséges bash vagy jq. Codex esetén az RTK
saját útmutatója utasításalapú integrációt ír le, programozott hook nélkül.
**Ugyanaz az RTK.md tehát nem jelent azonos automatizáltságot a két kliensben.**
A Claude Code hook támogatása nem jelenti automatikusan minden Claude Desktop
eszközhívás, MCP-hívás vagy Codex-parancshívás lefedését.
[RTK kliensintegrációk](https://github.com/rtk-ai/rtk/blob/fde0a8f185945556f51718de0f4c430bb62b3df6/README.md#windows),
[Codex integráció](https://github.com/rtk-ai/rtk/blob/fde0a8f185945556f51718de0f4c430bb62b3df6/hooks/codex/README.md),
[natív hook](https://github.com/rtk-ai/rtk/blob/fde0a8f185945556f51718de0f4c430bb62b3df6/src/hooks/hook_cmd.rs)

A „minden parancs elé biztonságosan odarakható” szabály túl erős. A szűrő módosítja
az agent által látott bizonyítékot; egyes kimenetek szándékosan rövidülnek. Emellett
PowerShell-cmdlet nem külön futtatható program: a helyi próba során az rtk proxy
Get-Content hívás program-not-found hibával állt le. Ilyenkor a megfelelő shellt
kell futtatni, nem a cmdletet külső binárisként meghívni.

Az ajánlott RTK.md külön kezelje:

- A hosszú build-, teszt- és lintkimenetet: a támogatott szűrő hasznos lehet;
  hibakereséshez maradjon elérhető az eredeti kimenet.
- A teljes forrásolvasást, fájlműveletet meghatározó listát, gépi JSON/NUL kimenetet
  és protokolladatot: használjunk igazoltan változatlan útvonalat, szükség esetén
  rtk proxy hívást. MCP stdio adatfolyamot ne formázzunk megjelenítési szűrővel.
- A saját szűrőket: csak igazolt szükség esetén kerüljenek be. A projekt helyi
  szűrőjét a tartalomhoz kötött bizalom hiányában vagy tartalomváltozás után az RTK
  figyelmen kívül hagyhatja. A konfiguráció jelenléte nem bizonyítja az aktiválását.

Az RTK 0.48.0 Git státuszkezelője a vizsgált útvonalon megtartja a fájlsorokat;
a problémát nem szabad általánosan minden RTK-parancsra rávetíteni. A szűrő
megbízhatóságát parancsonként és verziónként kell értékelni.
[Git-kezelő](https://github.com/rtk-ai/rtk/blob/fde0a8f185945556f51718de0f4c430bb62b3df6/src/cmds/git/git.rs),
[helyi szűrők bizalmi ellenőrzése](https://github.com/rtk-ai/rtk/blob/fde0a8f185945556f51718de0f4c430bb62b3df6/src/core/toml_filter.rs#L191-L221)

### Helyi mérés: 61 fájlos, elkülönített Git-próba

A mérés egy új, ideiglenes Git-repóban futott, 61 követetlen fájllal, köztük egy
ékezetes, szóközt tartalmazó névvel. Nem érintette a két workshop-repo tartalmát.
A próbakönyvtárat ellenőrzött útvonalon eltávolítottuk; nem módosítottunk globális
RTK-beállítást vagy szűrőbizalmat.

| Ellenőrzés | Eredmény |
| --- | --- |
| Szokásos git status kimenet, szűrés nélkül | 1089 bájt |
| Ugyanaz rtk git status hívással | 1044 bájt, **4,1% méretcsökkenés** |
| Fájlsorok száma | Mindkettőben **61/61** |
| git status --porcelain=v1 -z --untracked-files=all | RTK-val és proxyval bájtra azonos, **61 NUL-rekord** |
| Kilépési kód | Az összehasonlított párokban azonos |

Ez egy kimenetmegőrzési próba, **nem fejlesztési produktivitási vagy költségmérés**.
Az összetett státuszokat, rename/conflict eseteket, nagy diffeket és Kotlin-buildet
nem fedi le. A hirdetett kimenetcsökkenési arányt nem vetíthetjük a teljes agent
költségére. Az RTK tokenmutatója is becslés: a forrás a szöveg UTF-8 bájtszámát
osztja néggyel, nem a használt modell tokenizálójával számol.
[Becslés implementációja](https://github.com/rtk-ai/rtk/blob/fde0a8f185945556f51718de0f4c430bb62b3df6/src/core/tracking.rs#L1656-L1660)

Az összes input csökkenése első közelítésben a szűrhető kimenet arányától is függ:
ha az input 30%-a ilyen, és azt 60%-kal rövidítjük, az összes input 18%-kal lehet
kisebb. **Ez számpélda, nem erre a projektre mért eredmény.** A második agent
új kontextusa és modellfutása ezt a nyereséget csökkentheti vagy meg is fordíthatja.

## Javasolt bevezetési sorrend

1. **Hordozható RTK.md, rövid közvetlen szabályok az AGENTS.md-ben.** Opcionális
   bináris, teljes kimenetet megőrző kivételek, verzióellenőrzés. Ne kerüljön be
   Plastic-specifikus szűrő, saját wrapper vagy kötelező új runtime.
2. **Választható kliensbeállítás.** Claude Code alatt natív RTK hook, Codex alatt
   explicit olvasás és utasítás. Először ártalmatlan mintaparancson ellenőrizzük,
   melyik valódi eszközhívásra érvényes az átírás. Korlátozásvizsgálathoz a Codex
   execpolicy check nem hajtja végre a vizsgált parancsot; nem kell veszélyes
   parancsot lefuttatni a szabály teszteléséhez.
   [OpenAI: execution rules](https://learn.chatgpt.com/docs/agent-configuration/rules)
3. **Alkalmi Claude → Codex munkához hivatalos plugin kipróbálása.** A bridge csak
   akkor következzen, ha valóban kell a kétirányú élő desktop kommunikáció, és a
   célgépek korlátai elfogadhatók. Egyik telepítése se legyen az alkalmazás npm
   függősége vagy a starter kötelező indulási feltétele.
4. **Automatizálás konkrét munkamenetre.** Például végrehajtás után egy független
   review, meghatározott feladatkörrel és leállási feltétellel. Ne legyen korlátlan
   kölcsönös delegálás vagy automatikus agent-pingpong. Tudásváltozásnál küldhető
   rövid értesítés útvonallal, dokumentum-ID-val, verzióval és Git-revízióval; a
   fogadó a saját checkoutjából olvassa el a teljes releváns forrást, és jelezze
   az eltérő vagy hiányzó verziót. Az üzenetkézbesítés önmagában nem frissítés.
5. **Mérés után bővítés.** A következő általános automatizálási jelölt az index,
   hivatkozások és dokumentumállapotok egyszerű ellenőrzése lehet a projekt saját
   CI-jában. Ez jelenleg nincs megvalósítva; külön döntés, nem egy új keretrendszer
   indoka. A tartalmi helyesség és a megértés ettől sem válik automatikusan igazolttá.

A közös szabályoknak egyetlen gazdája legyen; a kliensadapterek csak a saját
integrációjukat tartalmazzák. A transport cserélhető maradjon: a tudáskezelési
szabályok ne függjenek bridge-sessionazonosítóktól vagy egy vendor protokolljától.
Ez követi a KISS/DRY elveket, és nem épít előre nem igazolt igényekre.

## Mi kellene a tényleges nyereség igazolásához?

Azonos build-, hibakeresési és reviewfeladatokon hasonlítsuk össze a jelenlegi
alapot, az RTK-val kiegészített alapot, majd az RTK és egy kiválasztott delegálási
útvonal együttes használatát. Mérjük az összes részt vevő agent input/output
felhasználását, a futásidőt, a kézi beavatkozásokat, az újramunkát és a kihagyott
hibákat. A review minősége ne csak ugyanannak az agentnek az önértékelése legyen.

**Jelenleg igazolt:** aktuális források, helyi RTK-verzió, az elkülönített Git-kimenet
összehasonlítása és a starter aktuális kialakítása. **Nem igazolt:** működő helyi
bridge/Claude hook integráció, valós Kotlin-build, nettó költségcsökkenés vagy jobb
fejlesztési eredmény. Ezek nélkül az egész projektre adott százalék félrevezető.

A vizsgálat egy kutatási jegyzetet hozott létre. Nem telepített vagy kapcsolt be
integrációt, nem módosított agentkonfigurációt, és nem változtatta meg a prezentációt.
