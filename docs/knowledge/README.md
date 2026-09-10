# A közös tudás használata

Feladat elején keresd meg és olvasd el a releváns, teljes dokumentumokat.
Ellenőrizd a státuszt, az alkalmazhatóságot, a verziót és az esetleges utódot.
A dátum és az agent magabiztos válasza önmagában nem bizonyít helyességet.

## Mit hová írunk?

| Tartalom | Cél a docs/knowledge/ alatt |
| --- | --- |
| Elvárt működés, elfogadási feltételek (PRD) | `product/prd/` |
| Termékdöntés és indoklás (PDR) | `product/decisions/` |
| Technikai döntés, alternatívák (ADR) | `architecture/decisions/` |
| A rendszer aktuális felépítése | `architecture/overview/` |
| Fogalmak, fejlesztési szabályok | Csak valódi tartalomhoz létrehozott külön dokumentum |

A PDR itt csapatkonvenció, nem általános szabvány. Könyvtárat akkor hozunk létre,
amikor az első valódi dokumentum belekerül. Egy apró változáshoz nem kell három rekord.
A PRD az elvárást mutatja; a döntésrekord azt indokolja, miért ezt választottuk.

## Rögzítés

1. Keress előzményt; meglévő információra hivatkozz, ne másold át.
2. Használd a [követelmény-](../templates/requirement.md) vagy
   [döntéssablont](../templates/decision.md), és töltsd ki az indokolt mezőket.
3. Egyeztetésig maradjon `proposed`. Elfogadást csak valós felhatalmazás alapján rögzíts.
4. A dokumentumot író agent futtassa a `record-decision` skill indexgeneráló
   scriptjét, majd a `validate-knowledge` indexellenőrzését. A fejlesztőnek
   nem kell az [index](INDEX.md) bejegyzéseit karbantartania.
5. A tudásváltozást a hozzá tartozó kódváltozással együtt nézzétek át.

## Az index frissítése az író agent feladata

Az index a Markdown-dokumentumok első `#` címsorából és relatív útvonalából készül.
Az elején álló YAML-fejlécben, kódkerítésben vagy HTML-kommentblokkban szereplő
címsorokat kihagyja. A cím előtt lezáratlan komment vagy hiányzó cím esetén hibával jelez.
Minden saját tudásfájlnak legyen informatív címe. A gyökérbeli INDEX.md, README.md
és governance.md segédfájl, ezért nem kerül a dokumentumlistába; a sablonok kívül
vannak a tudástáron. A státusz és jóváhagyás továbbra is a teljes forrásban marad.

A repo gyökeréből az agent ezeket futtatja:

```text
node .agents/skills/record-decision/scripts/update-index.mjs --write
node .agents/skills/record-decision/scripts/update-index.mjs --check
```

A `--write` a teljes INDEX.md-t újra előállítja. Azonos eredménynél a fájlt és
időbélyegét sem módosítja. A `--check` nem ír fájlt; eltérésnél hibával jelez.
Új, átnevezett, átcímzett vagy törölt dokumentumot így nem kell egy második helyen
kézzel átvezetni. A tartalom érdemi helyességét továbbra is az agent és a felelős
review vizsgálja. Meglévő indexbe írt egyedi magyarázatot generálás előtt a megfelelő
forrásdokumentumba kell átvinni.

A generátor egyszerre egy indexírót enged, és írás előtt újra ellenőrzi a forrásokat.
A forrásdokumentumok párhuzamos írását a csapatnak továbbra is össze kell hangolnia.
Hiba esetén megmarad az előző index; a feladat nem jelenthető késznek sikeres ellenőrzés nélkül.

## Folytatás és több agent

A `refresh-repo-knowledge` skill újraolvastatja a jelenlegi feladathoz szükséges
forrásokat. A mellékelt hookok lifecycle-eseményeknél jelezhetik a frissítés
szükségességét; nincs folyamatos háttérfigyelő vagy agent–agent eseményfolyam.
Új session, folytatás, kontextustömörítés és feladatváltás után ellenőrizni kell
a forrásokat akkor is, ha az agent emlékezni vél rájuk.

Másik branch, worktree vagy gép tartalma csak a Git-szinkron után elérhető helyben.
Az értesítés nem viszi át a fájlokat, és nem bizonyítja az elolvasásukat.
Az agent ne szinkronizáljon automatikusan mások helyi módosításaira.

Működés és korlátok: [workspace-hookok](../hooks.md).
