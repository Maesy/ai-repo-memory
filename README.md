# A repo emlékszik — induló projektalap

**Közös instrukciók és verziókezelt projekttudás Claude Code és Codex számára.**
Kotlin-, Java-, .NET-, Python-, webes vagy más projekthez is használható.
A starterhez nem kell Node, npm, Python, telepítőscript vagy háttérszolgáltatás.
Az agentalkalmazás és a saját projekted eszközei ettől külön előfeltételek.

## Indulás

1. Használd ezt a tartalmat az új repód alapjaként, vagy másold a meglévő projektbe.
   Meglévő instrukció- és konfigurációfájlokat egyesíts, ne írj felül.
2. Töltsd ki a [projektadatlapot](docs/project.md): cél, technológia, saját build- és
   tesztparancsok, felelősök és korlátok.
3. Nyisd meg a projekt gyökerét Claude Code-ban vagy Codexben. Kövesd az alábbi
   beállításokat, majd indíts új sessiont.
4. Kérd az [első ellenőrző feladatot](docs/agent-setup.md#első-ellenőrző-kérés).
   A starterben nincs előre elfogadott termékkövetelmény vagy fiktív jóváhagyás.
5. Az első saját követelményt és döntést a [sablonokból](docs/templates/) rögzítsd.
   Az alkalmazás technológiáját, könyvtárszerkezetét és CI-jét te választod hozzá.

## Claude és Codex beállítása

| | Claude Code | Codex |
| --- | --- | --- |
| Belépési pont | `CLAUDE.md`, benne `@AGENTS.md` import | `AGENTS.md` közvetlen betöltése |
| Projektskill | `.claude/skills/` vékony belépők | `.agents/skills/` közös forrás |
| Projektbeállítás | `.claude/settings.json` | `.codex/config.toml` |
| Automatikus memória | `autoMemoryEnabled: false` | `generate_memories = false`, `use_memories = false` |
| Frissítés | Közös skill, szükség esetén kifejezett kérés | Közös skill, szükség esetén kifejezett kérés |

A projektkonfiguráció hatása a kliens támogatásától és bizalmi állapotától függ.

- A repo gyökeréből indíts új feladatot, és ellenőrizd a négy projektskill felismerését.
- A feladathoz szükséges jogosultságot válaszd; nincs kötelező modell vagy teljes hozzáférés.
- A már betöltött emlék nem tűnik el egy kapcsolótól. Globális beállítást nem kell módosítani.
- Az `@file` importot ne általánosítsd az `AGENTS.md`-re. A közös fájlok kifejezett
  olvasási utasítást használnak; egy link önmagában nem betöltés.

Részletes desktop- és CLI-útmutató, hivatalos forrásokkal:
[agentbeállítások](docs/agent-setup.md). A reggeli tereptapasztalat tanulságai:
[mit lát ténylegesen az agent?](docs/instruction-loading.md).

## Napi munkamenet

1. **Keresés:** `find-repo-knowledge` — olvasd el a feladathoz tartozó forrásokat.
2. **Rögzítés:** `record-decision` — tartós döntés és indoklás a megfelelő helyre.
3. **Frissítés:** `refresh-repo-knowledge` — folytatásnál és változásnál újraolvasás.
4. **Ellenőrzés:** `validate-knowledge` — státusz, kapcsolatok, jóváhagyás és diff átnézése.

Ez eljárás fájlműveletekkel. Az utolsó skill nem egy telepített gépi validátor.
Külön worktree vagy gép esetén a fájlokat a Git-folyamatotokkal is szinkronizálni kell.

## Felépítés

```text
ai-repo-memory/
├── AGENTS.md                 közös, rövid munkaszabályok
├── CLAUDE.md                 Claude-specifikus belépő
├── .agents/skills/           négy közös eljárás
├── .claude/                  projektbeállítás és skillbelépők
├── .codex/config.toml        projektmemória-beállítás
├── docs/project.md           a saját projekt kitöltendő adatai
├── docs/knowledge/           index, használat és karbantartás
├── docs/templates/           követelmény- és döntéssablon
├── docs/agent-setup.md        a kliensek beállítása
├── docs/instruction-loading.md  betöltés és ellenőrzés
└── docs/automation.md        képességek és választható bővítések
```

A termék- és architektúradokumentumok mappái az első valódi tartalommal jönnek létre.
Az indexben csak hivatkozás és téma szerepel; a verzió és státusz kanonikus helye a forrás.

## Mire ad alapot?

- Új projektben ugyanazokhoz a karbantartott szabályokhoz férhet hozzá mindkét agent.
- A követelmények és döntések visszakereshetők, felülvizsgálhatók, Gitben átadhatók.
- A projekt nem örököl weboldalt, npm-csomagokat, példaterméket vagy annak döntéseit.
- A jó működéshez továbbra is kell pontos feladat, teszt és review. A fájl jelenléte,
  betöltése és helyes alkalmazása három külön állítás; tökéletes agentműködést nem garantálunk.

A gépi katalógus, hash, eseményfolyam és hook külön, opcionális automatizálás:
[képességek és korlátok](docs/automation.md).
Agentek közötti üzenetváltáshoz: [a codex-mcp-bridge értékelése](docs/agent-communication.md).

Az elméleti előadás külön, `ai-workshop-presentation` nevű repóban található.
Gyakorlati alkalom később, igény szerint tartható.

Starter-változat: [STARTER_VERSION](STARTER_VERSION). A forrásokra és kliensbeállításokra
vonatkozó ellenőrzési dátum a részletes útmutatóban szerepel. [Licenc](LICENSE).
