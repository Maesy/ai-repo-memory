# A fájl jelenléte nem bizonyítja a betöltését

## Három külön lépés

1. **A fájl elérhető:** benne van a repóban, és az agent hozzáférhet.
2. **A tartalom bekerült a kontextusba:** a kliens betöltötte, vagy az agent elolvasta.
3. **Az agent alkalmazta:** a válasz és a munka valóban követi a releváns szabályt.

Egyik lépésből sem következik automatikusan a következő. Az agent önbeszámolója
nem helyettesíti a betöltési nyom vagy az eredmény ellenőrzését.

## Import és útmutatás

- A Claude `CLAUDE.md` fájljában támogatott az `@AGENTS.md` import.
- A közös `AGENTS.md` és `SKILL.md` fájlokban ne támaszkodj `@file` feloldásra.
  Codex CLI 0.146.0-val a felhasználó 2026. szeptember 10-i vizsgálata szerint
  az ilyen szöveg literálisan maradt a bemenetben.
  Ezt az átszervezés során elkülönített helyi próbában is reprodukáltuk:
  gyökérjelölő jelen, importszöveg jelen, az importált fájl egyedi jelölője hiányzik.
- A fontos közös szabály legyen közvetlenül az `AGENTS.md`-ben. A részletes
  dokumentumhoz adj feltételt és kifejezett olvasási utasítást.
- A Markdown-link önmagában szintén nem betöltés. Példa: „Tudás módosítása előtt
  olvasd el a `docs/knowledge/governance.md` teljes tartalmát.”
- Azonos nevű személyes és projektskill, globális instrukció vagy eltérő munkamappa
  eltérő eredményt okozhat. Ne vezess be saját, kliens által nem olvasott override-fájlt.

## Helyi ellenőrzés

Codex CLI 0.146.0 alatt a `codex debug prompt-input --help` megerősíti a parancsot.
Saját klienseden előbb ellenőrizd a támogatást:

```sh
codex --version
codex debug prompt-input --help
codex debug prompt-input
```

A JSON-kimenet a parancs által összeállított bemenetet mutatja. Keress egyedi részletet
a várt forrásból, és külön a fel nem oldott importot. Ez nem a jövőbeli tool-olvasások
vagy a desktop app eltérő runtime-jának bizonyítéka. A kimenet személyes instrukciókat
is tartalmazhat: teljes egészében ne tedd Gitbe, és ne vetítsd ki ellenőrzés nélkül.

Más kliensnél használható rövid ellenőrző szöveg:

1. Izolált próbában csak a vizsgált fájlba írj egy friss, egyedi jelölőt.
2. Új sessionben kérd a jelölő megadását további fájlolvasás nélkül.
   A jelölő értékét ne add bele magába a kérdésbe.
3. Ellenőrizd, történt-e közben fájlolvasás, és nem származhatott-e más kontextusból.

A siker egy adott részlet elérhetőségét támogatja. A sikertelen visszamondás önmagában
nem bizonyít hibás betöltést, és a siker sem bizonyítja minden szabály megértését.
Claude-ban a `/memory` is segít a betöltött instrukciófájlok ellenőrzésében.

## Instrukció, jogosultság és kimenetszűrés

- A szöveges tiltás nem technikai végrehajtási korlát. Claude-nál a permissions,
  Codexnél a sandbox/jóváhagyás és az execution policy külön mechanizmusok.
- Codexben a `.rules` szabályok `forbidden` döntést is támogatnak. Ez nem egy
  `config.toml`-beli deny-lista, és az adott parancs/eszköz ellenőrzési útja számít.
  Egy szabályfájl jelenlétéből ne következtess aktív, minden útvonalra kiterjedő tiltásra.
- Alias, wrapper vagy más shelleszköz eltérő szabályillesztést eredményezhet.
  Tiltást ártalmatlan helyettesítő paranccsal vizsgálj, ne romboló próbával.
- Kimenetszűrő, például RTK használata opcionális. A fájllisták teljes tartalmát
  őrizd meg, ha abból írási vagy commit-hatókört határozol meg.
- Tool telepítése/frissítése után nézd át az instrukció- és konfigurációdiffet,
  valamint a sorvégeket. A generált állomány is lehet hibás.

## Források

- [Claude: import és memória](https://code.claude.com/docs/en/memory).
- [Codex: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
- [Codex: parancsszabályok](https://learn.chatgpt.com/docs/agent-configuration/rules).
- Felhasználói tereptapasztalat: *What Your Agent Can't See*, átadva 2026-09-10.
  A beszámoló adott CLI-verzióra vonatkozik; nem minden kliensre érvényes bizonyíték.
