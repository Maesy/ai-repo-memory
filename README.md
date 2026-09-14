# AI repo memory starter

Technológiasemleges repository-alap közös, verziózott projekttudáshoz és opcionális
Claude/Codex/GitHub Copilot frissítési hookokhoz. Frontend-, JVM-, .NET-, Python- vagy más projektre
ráépíthető; alkalmazáskódot és termékspecifikációt nem tartalmaz.

## Alapelvek

- A Markdown-tudás runtime nélkül olvasható.
- A repository saját segédscriptjeinek egyetlen runtime-ja **Node.js 24.x LTS**.
- A scriptek `.mjs` fájlok, kizárólag beépített modulokkal: nincs `npm install`,
  Python-, pip-, Bash- vagy háttérszolgáltatás-függőség.
- Ez csak a starter saját infrastruktúrájára vonatkozik. A ráépülő alkalmazás
  használhat saját `package.json`-t, runtime-ot, függőségeket és tesztfájlokat.
- A kanonikus skillforrás `.agents/skills/`; Claude vékony adapterei
  `.claude/skills/` alatt vannak.
- GitHub Copilot közvetlenül az `.agents/skills/` kanonikus skilleket használja;
  számára nem készül második skillmásolat.
- Az alap négy saját skillt tartalmaz: `find-repo-knowledge`, `record-decision`,
  `refresh-repo-knowledge`, `validate-knowledge`.
- További engineering skillek opcionálisan telepíthetők. Használatuk nincs előírva,
  és saját függőségük nem válik automatikusan a starter követelményévé.

## Másolás új projektbe

Meglévő projektbe az `.github/hooks/`, `.github/workflows/` és `.vscode/settings.json`
fájlokat is egyesítsd a helyi beállításokkal; ne írj felül vakon meglévő konfigurációt.

1. Másold be a starter tartalmát a célrepository gyökerébe.
2. Egyesítsd a meglévő `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` és
   `.codex/` fájlokat; ne írd felül vakon a projekt szabályait.
3. Töltsd ki a [projektadatlapot](docs/project.md).
4. Biztosíts Node.js 24.x LTS-t a helyi és CI-környezetben.
5. Ellenőrizd a [kliensbeállítást](docs/agent-setup.md) és a
   [hookok trustját](docs/hooks.md) külön minden használt kliensben.

A starter CI-je név szerint csak a három saját infrastruktúra-tesztet futtatja.
Az alkalmazás buildjét, lintjét és tesztjeit külön jobban vagy workflow-ban add
hozzá; az általános `node --test` automatikusan az alkalmazás tesztjeit is
felderítheti.

## Szerkezet

```text
AGENTS.md                         közös rövid szabályok
CLAUDE.md                         Claude belépési pont
.agents/skills/                   négy kanonikus saját skill
.agents/scripts/                  skilladapter-generátor
.claude/skills/                   generált Claude-adapterek
.claude/settings.json             Claude projekt-hookok
.codex/hooks.json                 Codex projekt-hookok
.github/hooks/                    GitHub Copilot projekt-hookok
.github/workflows/                starter-ellenőrző CI
.vscode/settings.json             Copilot skill- és hookforrások kiválasztása
docs/INDEX.md                     generált rekordindex
docs/README.md                    tudásrouting
docs/governance.md                rekord-életciklus
docs/adr/                         technikai döntések
docs/pdr/                         termékdöntések
docs/prd/                         követelmények
docs/agents/                      agent- és skillpolicy
docs/research/                    kutatási bizonyíték
docs/templates/                   kitöltendő sablonok
tests/                            név szerint futtatott starter-infrastruktúra-tesztek
```

A `docs/adr/`, `docs/pdr/` és `docs/prd/` verziókezelt üres könyvtár; az első
valódi rekordig csak `.gitkeep` fájlt tartalmaz.

## Karbantartási parancsok

```text
node .agents/scripts/sync-claude-skill-adapters.mjs --write
node .agents/scripts/sync-claude-skill-adapters.mjs --check
node .agents/skills/record-decision/scripts/update-index.mjs --write
node .agents/skills/record-decision/scripts/update-index.mjs --check
node --test tests/knowledge-hooks.test.mjs tests/knowledge-index.test.mjs tests/skill-integration.test.mjs
```

Az adaptergenerátort saját skill metadata-változása vagy opcionális skill
telepítése/eltávolítása után futtasd. Az indexgenerátort rekord hozzáadása,
átnevezése, címváltozása vagy törlése után futtasd.

## Opcionális skillek

Az integrációs szerződés nem kötődik egyetlen külső gyűjteményhez sem:

- közös kanonikus hely: `.agents/skills/<skill>/SKILL.md`;
- tartós doménnyelv: gyökérbeli `CONTEXT.md`, nagyobb rendszernél
  `CONTEXT-MAP.md` és `src/<context>/CONTEXT.md`;
- PRD/PDR routing: `docs/prd/`, `docs/pdr/`; rendszerszintű ADR:
  `docs/adr/`; komponens-ADR: `src/<context>/docs/adr/`;
- issue tracker és triage-konfiguráció csak a célprojektben jön létre;
- telepítés előtt runtime-, CLI-, hálózat- és írási audit szükséges;
- azonos nevű globális és projektskill együtt kerülendő.

Részletek: [skillkompatibilitás](docs/agents/skill-compatibility.md).

## Korlátok

- A hookok futása kliensverziótól, host policytól és workspace trusttól függ.
- A Claude jelenlegi menedzselt cloud image-e Node 20/21/22 verziókat dokumentál;
  ezért a scriptek átmenetileg Node 22-kompatibilis API-kat használnak, miközben a
  támogatott helyi/CI baseline Node 24.x LTS.
- A hookjelzés nem forrásolvasási nyugta és nem jóváhagyás.
- A starter nem ír elő alkalmazásmodellt, issue trackert vagy kiadási folyamatot.

Starter-verzió: [STARTER_VERSION](STARTER_VERSION).
