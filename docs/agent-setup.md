# Claude, Codex és GitHub Copilot beállítása

Ellenőrizve: 2026-09-14. A kliensverzió, szervezeti policy és workspace trust
számít; a fájlok megléte nem bizonyít élő integrációt.

## Közös előfeltételek

1. Nyisd meg a célrepository valódi gyökerét és töltsd ki a
   [projektadatlapot](project.md).
2. Biztosíts Node.js 24.x LTS-t a host `PATH`-ján. Nem kell `npm install`, Python,
   MCP vagy háttérszolgáltatás.
3. Indíts új sessiont a beállítások átvétele után.
4. Ellenőrizd a négy projektskill elérhetőségét és az
   [instrukcióbetöltést](instruction-loading.md).
5. Tekintsd át és külön engedélyezd a [hookokat](hooks.md) minden használt kliensben.

A meglévő Markdown-tudás olvasásához nincs szükség Node-ra; csak a hookok,
generátorok és tesztek futtatásához.

## Claude

- A gyökér `CLAUDE.md` importálja a közös `AGENTS.md` fájlt.
- `.claude/settings.json` kikapcsolja a kliens automatikus memóriáját és három
  projekt-hookot regisztrál.
- `.claude/skills/` generált adapterei a `.agents/skills/` kanonikus forrásaira
  irányítanak; ne szerkeszd őket kézzel.
- A hookok a `${CLAUDE_PROJECT_DIR}` útvonalból indulnak, és a
  `scripts/claude.mjs` belépőt futtatják.

## Codex

- A Codex közvetlenül a gyökér `AGENTS.md` szabályait használja.
- `.codex/config.toml` kikapcsolja a repository saját tudását megkerülő automatikus
  memóriát.
- `.codex/hooks.json` ugyanazt a közös hookmotort a `scripts/codex.mjs` belépőn át
  indítja, és nested working directoryból is megkeresi a repository gyökerét.
- A projekt-hook trustját minden fejlesztő saját kliensében ellenőrzi; a repository
  nem nyilváníthatja megbízhatóvá önmagát.

## GitHub Copilot

- Használj VS Code 1.125 vagy újabb verziót. A korábbi verziók több támogatott
  skillkönyvtár átfedésekor duplikált skillt mutathatnak.
- A Copilot közvetlenül a `.agents/skills/` könyvtár projekt-skilljeit használja.
  Ne készíts `.github/skills/` másolatot, és ne add hozzá `.claude/skills/`-t külön
  Copilot-forrásként.
- A natív hookdefiníció `.github/hooks/repo-knowledge.json`; egyetlen `command`
  stringet használ, nem Claude-féle `command` + `args` alakot.
- A `.vscode/settings.json` engedélyezi a `.github/hooks/` forrást, és letiltja a
  Claude settings hookként történő automatikus betöltését VS Code Copilotban.
- Workspace trust és szervezeti policy továbbra is kliensenként ellenőrzendő.
- A Copilot CLI az azonos nevű skilleknél az első támogatott projektforrást használja;
  `.github/skills/` hiányában az `.agents/skills/` megelőzi `.claude/skills/`-t.
  A `.vscode/settings.json` a deprecated `chat.agentSkillsLocations` beállítással
  a Local agentben is kizárja `.claude/skills/`-t. Agent Host ezt nem használja;
  ott az aktuális natív felderítést az élő ellenőrzéssel kell igazolni.

## Opcionális skillek

Az alap négy saját skillje mellé további skillek telepíthetők. Telepítés előtt
kövesd a [kompatibilitási auditot](agents/skill-compatibility.md), majd generáld újra
az adaptereket:

```text
node .agents/scripts/sync-claude-skill-adapters.mjs --write
node .agents/scripts/sync-claude-skill-adapters.mjs --check
```

## Első ellenőrző kérés

```text
Olvasd el az AGENTS.md és docs/project.md fájlokat, majd használd a
find-repo-knowledge skillt. Sorold fel a ténylegesen elolvasott forrásokat.
Van-e már elfogadott termékkövetelmény? Mi nincs még kitöltve?
Most ne módosíts fájlt.
```

A friss starter helyes válasza: a projektadatok kitöltendők, és nincs elfogadott
termékkövetelmény. A sablonok nem termékkövetelmények; a friss starter saját
projekt-ADR-t sem tartalmaz.

## Ellenőrzött kliensreferenciák

- [VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [GitHub Copilot CLI skillhelyek és prioritás](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
- [VS Code skillduplikáció javítása, 1.125.0](https://github.com/microsoft/vscode/issues/317940)

Dokumentációellenőrzés: 2026-09-14. Élő Copilot CLI nem volt elérhető ebben a
környezetben; a tényleges felderítést minden használt kliensben külön kell próbálni.
