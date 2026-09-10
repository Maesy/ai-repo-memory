# Claude és Codex beállítása

Ellenőrzött dokumentáció: 2026-09-10. A kliensverzió, a szervezeti szabályok és a
konfiguráció hatóköre számít. A fájlok megléte nem bizonyít sikeres élő integrációt.

## Mindkét kliensnél

1. Az új projekt tényleges gyökerét nyisd meg. Töltsd ki a [projektadatlapot](project.md).
2. Indíts új sessiont a beállítások átvétele után. A már betöltött kontextus nem törlődik
   egy kapcsoló átállításától.
3. Ellenőrizd a négy projektskill elérhetőségét. A hookos automatizáláshoz Node 22+
   és a kliens hook-trustja kell; npm install, MCP és külön plugin nem szükséges.
   A kézi workflow Node nélkül is működik. [Hookbeállítás és próba](hooks.md).
4. A választott modell maradhat a csapat bevált alapértéke. A repo nem ír elő modellt,
   gondolkodási szintet vagy teljes gépi hozzáférést.
5. Végezd el az [instrukcióbetöltés ellenőrzését](instruction-loading.md), külön mindkét kliensben.

## Claude Code a desktop alkalmazásban

- A **Code** felületen válaszd ki a helyi projektet; a sima beszélgetés eltérő munkakörnyezet.
- A gyökér `CLAUDE.md` Claude-specifikus `@AGENTS.md` importot használ.
- A projekt `.claude/settings.json` fájljában az `autoMemoryEnabled: false`
  a saját automatikus memória kikapcsolásának dokumentált beállítása.
- Ugyanitt a négy lifecycle-hook a közös `.agents/hooks/repo-knowledge.mjs`
  programot indítja. A repo gyökerét a Claude projektútvonalából veszi.
- A `.claude/skills/` belépői a közös `.agents/skills/` fájlok teljes elolvasását kérik.
  Ezek követett normál fájlok, nem symlinkek. A workflow a közös forrásban él.
- A skillválasztóban keresd a `find-repo-knowledge` nevet; ahol támogatott,
  `/find-repo-knowledge` formában is kérhető. `/memory` segít az instrukciók ellenőrzésében.
- A feladathoz szükséges jogosultságot válaszd. A bypass mód, a Remote Control és
  a párhuzamos automatikus munkafolyamat nem feltétele a starter használatának.

## Codex a desktop alkalmazásban

- Helyi projektként add hozzá a repo gyökerét. Ellenőrizd a projekt bizalmi állapotát.
- A közös belépési pont az `AGENTS.md`; a skillek forrása a `.agents/skills/`.
- A `.codex/config.toml` a projektben tiltja a memória képzését és használatát a
  támogatott konfigurációs rétegben. A fájl nem módosít globális beállítást.
- A beállításokban ellenőrizd a munkához szükséges fájlírási és parancsengedélyeket.
  Az olvasási mód elemzésre alkalmas; a tudástár frissítéséhez fájlírás kell.
- A skillválasztóban jelöld ki a `find-repo-knowledge` skillt. A CLI-ben
  `$find-repo-knowledge` is használható. Az app és a PATH-on elérhető CLI verziója eltérhet.
- A `.codex/hooks.json` a négy tudásfrissítési hookot regisztrálja. A launcher
  almappából is megkeresi a közös programot. Normál kliens-trust és saját
  működési próba szükséges; globális trust-felülírást nem állítunk be.

## Első ellenőrző kérés

```text
Olvasd el az AGENTS.md és docs/project.md fájlokat, majd használd a
find-repo-knowledge skillt. Sorold fel a ténylegesen elolvasott forrásokat.
Van-e már elfogadott termékkövetelmény? Mi nincs még kitöltve?
Most ne módosíts fájlt.
```

A friss starterben a helyes eredmény: a projektadatok még kitöltendők, és nincs
elfogadott termékkövetelmény. Ne fogadd el a sablon példaazonosítóját valós döntésként.

## Napi használat és karbantartás

- Feladat elején keresés és teljes forrásolvasás; tartós döntésnél rögzítés.
- Folytatáskor és feladatváltáskor újraolvasás; készre jelentés előtt ellenőrzés.
- A két kliens azonos repo-neve nem bizonyít azonos worktree-t vagy fájlállapotot.
  Szükség esetén a csapat Git-folyamatával add át a változást.
- Meglévő projektbe másoláskor egyesítsd a beállításokat; ne írd felül a csapat saját fájljait.
- Skillmódosításnál a workflow-t a `.agents/skills/` alatt szerkeszd. Ha a `name` vagy
  `description` változik, ugyanaz a metadata szerepeljen a Claude-belépőben is.
  A teljes eljárást ne másold bele a belépőbe.

## Hivatalos források

- [Claude Code memória és importok](https://code.claude.com/docs/en/memory)
- [Claude Code skillek](https://code.claude.com/docs/en/skills)
- [Claude desktop](https://code.claude.com/docs/en/desktop)
- [Codex instrukciók](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Codex skillek](https://learn.chatgpt.com/docs/build-skills)
- [Codex memóriavezérlők](https://learn.chatgpt.com/docs/customization/memories)

A személyes memória kikapcsolása az összehasonlítható közös alapot segíti, de a
kontextus, a history és a compaction más fogalom. Korábbi emlékeket nem kell törölni.
