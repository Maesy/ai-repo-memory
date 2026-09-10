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
4. Frissítsd az [indexet](INDEX.md), és végezd el az ellenőrzést a
   [karbantartási szabályok](governance.md) szerint.
5. A tudásváltozást a hozzá tartozó kódváltozással együtt nézzétek át.

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
