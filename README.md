# A repo emlékszik — induló projektalap

**Közös instrukciók és verziókezelt projekttudás Claude Code és Codex számára.**
Kotlin-, Java-, .NET-, Python-, webes vagy más projekthez is használható.
A dokumentumok olvasásához nem kell runtime. Az indexgenerátorhoz és a mellékelt
Claude- és Codex-hookokhoz Node 22+ szükséges; npm install, Python és háttérszolgáltatás nem kell.
Az agentalkalmazás és a saját projekted eszközei ettől külön előfeltételek.

## Indulás

1. Használd ezt a tartalmat az új repód alapjaként, vagy másold a meglévő projektbe.
   Meglévő instrukció- és konfigurációfájlokat egyesíts, ne írj felül.
2. Töltsd ki a [projektadatlapot](docs/project.md): cél, technológia, saját build- és
   tesztparancsok, felelősök és korlátok.
3. Nyisd meg a projekt gyökerét Claude Code-ban vagy Codexben. Kövesd az alábbi
   beállításokat és a [hookok ellenőrzését](docs/hooks.md), majd indíts új sessiont.
   Codexben minden fejlesztőnek külön át kell néznie és jóvá kell hagynia a
   projekt hookjait; a repo nem nyilváníthatja megbízhatóvá saját magát.
4. Kérd az [első ellenőrző feladatot](docs/agent-setup.md#első-ellenőrző-kérés).
   A starterben nincs előre elfogadott termékkövetelmény vagy fiktív jóváhagyás.
5. Az első saját követelményt és döntést a [sablonokból](docs/templates/) rögzítsd.
   Az alkalmazás technológiáját, könyvtárszerkezetét és CI-jét te választod hozzá.

## Claude és Codex beállítása

| | Claude Code | Codex |
| --- | --- | --- |
| Belépési pont | `CLAUDE.md`, benne `@AGENTS.md` import | `AGENTS.md` közvetlen betöltése |
| Projektskill | `.claude/skills/` vékony belépők | `.agents/skills/` közös forrás |
| Projektbeállítás | `.claude/settings.json` | `.codex/config.toml` és `.codex/hooks.json` |
| Automatikus memória | `autoMemoryEnabled: false` | `generate_memories = false`, `use_memories = false` |
| Frissítés | Lifecycle-hook jelzése → közös skill és forrásolvasás | Lifecycle-hook jelzése → közös skill és forrásolvasás |

A projektkonfiguráció hatása a kliens támogatásától és bizalmi állapotától függ.

- A repo gyökeréből indíts új feladatot, és ellenőrizd a négy projektskill felismerését.
- A feladathoz szükséges jogosultságot válaszd; nincs kötelező modell vagy teljes hozzáférés.
- A már betöltött emlék nem tűnik el egy kapcsolótól. Globális beállítást nem kell módosítani.
- Az `@file` importot ne általánosítsd az `AGENTS.md`-re. A közös fájlok kifejezett
  olvasási utasítást használnak; egy link önmagában nem betöltés.

Részletes desktop- és CLI-útmutató, hivatalos forrásokkal:
[agentbeállítások](docs/agent-setup.md). A betöltés működése:
[mit lát ténylegesen az agent?](docs/instruction-loading.md).

## Napi munkamenet

1. **Keresés:** `find-repo-knowledge` — olvasd el a feladathoz tartozó forrásokat.
2. **Rögzítés:** `record-decision` — tartós döntés és indoklás a megfelelő helyre;
   az író agent a skill scriptjével frissíti az indexet.
3. **Frissítés:** `refresh-repo-knowledge` — folytatásnál és változásnál újraolvasás.
4. **Ellenőrzés:** `validate-knowledge` — gépi indexellenőrzés, majd státusz,
   kapcsolatok, jóváhagyás és diff átnézése.

Az index karbantartása a tudástárat módosító agent feladata. A generátor a források
címéből és útvonalából dolgozik; hozzáadás, átnevezés, címváltozás és törlés után
ugyanazzal a paranccsal fut. Változatlan bemenetnél nem írja át az indexet.

```text
node .agents/skills/record-decision/scripts/update-index.mjs --write
node .agents/skills/record-decision/scripts/update-index.mjs --check
```

A `--check` nem módosít fájlokat. Az automatikus ellenőrzés a tartalomjegyzék
helyességét vizsgálja; a döntések jelentését és jóváhagyását az agent továbbra is
a teljes forrásokból ellenőrzi. Részletek: [az index frissítése](docs/knowledge/README.md).
Külön worktree vagy gép esetén a fájlokat a Git-folyamatotokkal is szinkronizálni kell.

## Felépítés

```text
ai-repo-memory/
├── AGENTS.md                 közös, rövid munkaszabályok
├── CLAUDE.md                 Claude-specifikus belépő
├── .agents/skills/           négy közös eljárás
│   ├── record-decision/scripts/  az index generátora és ellenőrzője
│   └── refresh-repo-knowledge/scripts/  a skill saját hookprogramjai
├── .claude/                  projektbeállítás és skillbelépők
├── .codex/                   projektmemória- és hookbeállítás
├── docs/project.md           a saját projekt kitöltendő adatai
├── docs/knowledge/           index, használat és karbantartás
├── docs/templates/           követelmény- és döntéssablon
├── docs/agent-setup.md        a kliensek beállítása
├── docs/instruction-loading.md  betöltés és ellenőrzés
├── docs/hooks.md             a hookok működése, trustja és ellenőrzése
└── tests/                    a hookfolyamat és az indexgenerátor tesztjei
```

A termék- és architektúradokumentumok mappái az első valódi tartalommal jönnek létre.
Az indexben cím, hivatkozás és mappa szerepel; a verzió és státusz kanonikus helye a forrás.

## Mire ad alapot?

- Új projektben ugyanazokhoz a karbantartott szabályokhoz férhet hozzá mindkét agent.
- A követelmények és döntések visszakereshetők, felülvizsgálhatók, Gitben átadhatók.
- A projekt nem örököl weboldalt, npm-csomagokat, példaterméket vagy annak döntéseit.
- A jó működéshez továbbra is kell pontos feladat, teszt és review. A fájl jelenléte,
  betöltése és helyes alkalmazása három külön állítás; tökéletes agentműködést nem garantálunk.

Az opcionális [hookos automatizálás](docs/hooks.md) a projektadatlap és a
tudásfájlok változását észleli mindkét kliensben. A jelzés nem jelent jóváhagyást,
forrásolvasási nyugtát vagy közvetlen agent–agent üzenetküldést. Hook nélkül
kifejezetten kérd a frissítő skillt. A helyi trust- és policy-állapot nem kerül
a repóba; a két kliensben külön ellenőrizd a tényleges futást.

Starter-változat: [STARTER_VERSION](STARTER_VERSION). A forrásokra és kliensbeállításokra
vonatkozó ellenőrzési dátum a részletes útmutatóban szerepel. [Licenc](LICENSE).
