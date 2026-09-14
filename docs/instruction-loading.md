# Instrukcióbetöltés ellenőrzése

A fájl megléte, a kliens általi betöltés és az agent helyes alkalmazása három külön
állítás. Mindhárom klienst friss sessionben, a célrepository gyökeréből ellenőrizd.

## Statikus ellenőrzés

- `AGENTS.md` a közös szabályforrás.
- `CLAUDE.md` csak Claude-belépő és nem tartalmaz párhuzamos workflow-t.
- `.agents/skills/` a kanonikus skillforrás.
- `.claude/skills/` csak generált adaptereket tartalmaz.
- GitHub Copilot a `.agents/skills/` forrást közvetlenül használja; nincs külön
  `.github/skills/` másolat.
- A Copilot natív hookja `.github/hooks/`, VS Code-ban pedig a
  `.vscode/settings.json` kizárja a Claude-hookok párhuzamos betöltését.
- Az adapterek aktuálisak:

```text
node .agents/scripts/sync-claude-skill-adapters.mjs --check
```

## Élő ellenőrzés

1. Indíts új sessiont.
2. Kérd a klienst, hogy sorolja fel a ténylegesen elolvasott instrukciófájlokat.
3. Indítsd explicit módon a `find-repo-knowledge` skillt.
4. Ellenőrizd, hogy a válasz a `docs/project.md` és `docs/INDEX.md` tényleges
   tartalmára hivatkozik, nem sablonra vagy korábbi session emlékére.
5. Módosíts egy teszt-fixture-ben figyelt tudásfájlt, majd ellenőrizd a hookot;
   éles rekordot csak valódi döntés miatt módosíts.

Claude-nál az aktuális instruction diagnostics mutathatja az importált fájlokat.
Codexnél ellenőrizd az `AGENTS.md` hatókörét, a projekt skilllistáját és a hook trustot.
Copilotnál ellenőrizd a projekt skilllistáját, a `.github/hooks/` felismerését és azt,
hogy `.claude/settings.json` nem jelenik meg második hookforrásként.
Copilot CLI-ben a `copilot skill list --json`, VS Code 1.125+-ban a Skills nézet
mutathatja, hogy a négy név egyszer és `.agents/skills/` forrásból jelenik meg.

## Sikerkritérium

- A közös szabályok mindkét kliensben elérhetők.
- Egy skill teljes workflow-ja csak `.agents/skills/` alatt létezik.
- A négy saját skill mindkét kliensben kiválasztható.
- A hook ugyanarra a kanonikus refresh skillre mutat.
- A kliens nem állítja, hogy egy fájlt elolvasott, ha csak linket vagy hookjelzést látott.
- A README-ben felsorolt három starterteszt és mindkét generátor `--check`
  parancsa sikeres.

Ha valamelyik állítás nem bizonyítható a használt kliensben, azt külön korlátként
dokumentáld; ne következtesd ki pusztán a konfiguráció jelenlétéből.
