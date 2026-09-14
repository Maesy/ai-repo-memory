# A közös tudás használata

Feladat elején keresd meg és olvasd el a releváns teljes dokumentumokat. Ellenőrizd
a státuszt, alkalmazhatóságot, verziót és az esetleges utódot. A fájl jelenléte vagy
az agent magabiztos válasza önmagában nem bizonyít helyességet.

## Mit hová írunk?

| Tartalom | Kanonikus hely |
| --- | --- |
| Elvárt működés és elfogadási feltételek (PRD) | `docs/prd/` |
| Termékdöntés és indoklás (PDR) | `docs/pdr/` |
| Rendszerszintű technikai döntés és alternatívák (ADR) | `docs/adr/` |
| Komponensre szűkülő ADR | `src/<context>/docs/adr/` |
| Egyeztetett doménfogalmak | gyökérbeli `CONTEXT.md`, illetve `src/<context>/CONTEXT.md` |
| Agent- és skillkonfiguráció | `docs/agents/` |
| Kutatási bizonyíték | `docs/research/` |

A PDR csapatkonvenció, nem általános szabvány. Egy változáshoz csak a valóban
szükséges rekord készüljön. Issue, specifikáció, map és ticket végrehajtási vagy
tervezési artefaktum; a belőlük elfogadott tartós tudás kerüljön megfelelő rekordba.

## Miért lapos a szerkezet?

A projektszintű PRD-, PDR- és ADR-rekordok közvetlenül a `docs/` alatt maradnak,
mert így az útvonalak rövidek, kiszámíthatók, és a repositoryt olvasó kliensek vagy
opcionális skillek külön átalakítás nélkül megtalálják őket. A mélyebb, közös
`docs/knowledge/` hierarchia kevés gyakorlati előny mellett plusz navigációt és
kompatibilitási réteget igényelne, ezért nem része a starternek. Beágyazott ADR csak
akkor készül `src/<context>/docs/adr/` alatt, ha a döntés valóban egy adott komponens
hatókörére szűkül.

## Munkafolyamat

1. Keresd az [indexet](INDEX.md), majd a gyökér rekordkönyvtárait és az alkalmazható
   `src/*/docs/adr/` könyvtárakat.
2. Olvasd el a teljes alkalmazható forrásokat és a kapcsolataikat.
3. Új rekordhoz használd a [követelmény-](templates/requirement.md) vagy
   [döntéssablont](templates/decision.md).
4. Egyeztetésig a rekord `proposed`; elfogadást csak valós bizonyíték alapján rögzíts.
5. A rekordot író agent generálja újra az indexet, majd futtassa a validálást.

```text
node .agents/skills/record-decision/scripts/update-index.mjs --write
node .agents/skills/record-decision/scripts/update-index.mjs --check
```

Az index a `docs/adr/`, `docs/pdr/`, `docs/prd/` és `src/*/docs/adr/`
Markdown-fájljainak első valódi `#` címsorából és útvonalából készül. A `.gitkeep`
nem rekord. A tartalom jelentését, státuszát és jóváhagyását továbbra is a teljes
forrásban kell ellenőrizni.

Folytatás, kontextustömörítés, feladat- vagy branchváltás után használd a
`refresh-repo-knowledge` workflow-t. A [hookok](hooks.md) csak jeleznek; nem
továbbítanak teljes forrásszöveget és nem igazolják annak elolvasását.
