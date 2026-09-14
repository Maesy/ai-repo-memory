# Érvényesség és karbantartás

- A rekord azonosítója maradjon állandó; tárgya és alkalmazási területe legyen világos.
- `proposed`: még nem elfogadott. PRD-nél az `active`, döntésnél az `accepted`
  jelenti az alkalmazható állapotot. Egy proposed döntés implementálható review
  céljából; ezt külön `implementation_status` jelezheti, de nem teszi elfogadottá.
- `superseded`: új rekord váltotta fel. `deprecated`: utód nélkül már nem alkalmazzuk.
- Elfogadáskor rögzíts valódi jóváhagyót, dátumot és visszakereshető alapot. Ezeket
  ne találd ki.
- Új verzió nem örökli automatikusan az előző jóváhagyását.
- Elfogadott ADR vagy PDR lényegi módosításához új döntésrekord kell. Kapcsold össze
  őket `supersedes` és `superseded_by` mezőkkel.
- Verziókonvenció: PATCH jelentés nélküli pontosítás, MINOR kompatibilis bővítés,
  MAJOR korábbi elvárást érvénytelenítő változás.
- `updated_at` csak tényleges módosításkor változzon. A dátum ISO 8601 formátumú.
- PRD és PDR csak `docs/prd/`, illetve `docs/pdr/` alatt legyen. Rendszerszintű ADR
  helye `docs/adr/`; egy `src/<context>/CONTEXT.md` hatókörére szűkülő ADR helye
  `src/<context>/docs/adr/`.
- A generált `docs/INDEX.md` nem kanonikus tartalomforrás. Minden review olvassa el
  a teljes rekordot és futtassa az index read-only `--check` ellenőrzését.
