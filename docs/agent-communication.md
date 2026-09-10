# Opcionális kommunikáció: codex-mcp-bridge

**A közös tudás alapját megtartjuk; a bridge külön, választható üzenetküldő réteg.**
A starter használatához nem kell telepíteni. Akkor érdemes bevezetni, ha a csapat
rendszeresen szeretne futó Claude- és Codex-feladatok között munkát vagy jelzést átadni.

## Mit ellenőriztünk?

Forrásellenőrzés: 2026-09-10, `codex-mcp-bridge` **1.15.0**, commit:
`8cea74351c0a4d852cf1ba9f97775c4f33873d00`.

- A csomag Node **22+** környezetet igényel, és npm-es telepítést dokumentál.
- Claude → Codex irányban külön app-server és opcionális natív desktop-mód szerepel.
  Az utóbbi a desktop feladattulajdonlását megőrző companionon keresztül dolgozik.
- Codex → Claude irányban helyi sessionazonosítás és peer-kapcsolat van;
  Windows alatt named pipe, macOS/Linux alatt Unix socket szerepel a kódban.
- A natív desktop-útvonalhoz további telepítés és klienskonfiguráció kell.
  A célprojekt, célfeladat, account és jogosultság ellenőrzése része a megvalósításnak.
- Külön app-server nem veheti át észrevétlenül egy már desktopban írt feladat írói szerepét.
  A megfelelő kommunikációs módot a használt kliensekhez kell választani.

Ezek forrásból ellenőrzött képességek, nem ebben a starterben lefuttatott élő
kétklienses integráció bizonyítékai. A verzió a megvizsgált Git-forrásé;
nem állítjuk, hogy ezt az npm-registryben vagy a felhasználó gépén is ellenőriztük.

## Mit nem helyettesít?

- A verziókezelt PRD/PDR/ADR-t és a valódi jóváhagyást.
- A Git-szinkront eltérő munkakönyvtárak között.
- A releváns forrás elolvasását és az elvárás helyes alkalmazását.
- A tudáskezelő gépi validátorát vagy az összes dokumentum frissességvizsgálatát.

Rövid jelzést adj át: téma, dokumentum-ID, verzió, forrásútvonal és a forrás Git-revíziója,
ha már commitolták. A fogadó ellenőrizze a saját checkoutját, olvassa el a teljes
forrást, és mondja el, hogyan érinti a feladatát. Egy üzenet állítása nem önmagában jóváhagyás.

## Bevezetés előtt

1. Az aktuális upstream útmutató alapján válassz a CLI és a natív desktop-útvonal között.
2. Egyeztesd a külön Node-eszköz és a klienskonfiguráció telepítését a csapattal.
   A starter nem módosít globális beállítást és nem regisztrál MCP-szervert.
3. Ellenőrizd a ténylegesen betöltött bridge- és kliensverziókat a célfeladatból.
4. Elkülönített projektben próbáld ki mindkét irányt, új és futó sessionnel,
   valamint eltérő worktree-vel. A helyes címzettet és tényleges forrásolvasást is figyeld.
5. Bizonytalan kézbesítésnél vizsgáld meg a meglévő feladatot; ne küldd el vakon újra.

Ha nincs szükség rendszeres agent–agent koordinációra, az explicit frissítési kérés
és a közös repo kevesebb üzemeltetési terhet jelent. A bridge előnyét ez a konkrét
igény indokolhatja; pusztán a dokumentumok megosztásához nem szükséges.

## Rögzített források

- [Csomag és Node-igény](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/package.json)
- [Működés és telepítés](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/README.md)
- [Codex-kézbesítési módok](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/thread-delivery.mjs)
- [Claude peer-kapcsolat](https://github.com/buidangminh23/codex-mcp-bridge/blob/8cea74351c0a4d852cf1ba9f97775c4f33873d00/src/peer-protocol.mjs)
