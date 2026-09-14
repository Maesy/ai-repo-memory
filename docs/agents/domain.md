# Doménmodell és terminológia

A tartós, projektspecifikus doménszótár kanonikus helye a repository gyökerében
lévő `CONTEXT.md`. Nagyobb rendszerben a gyökér `CONTEXT-MAP.md` mutathat komponens-
szintű `CONTEXT.md` fájlokra.

A komponens kanonikus útvonala `src/<context>/CONTEXT.md`; a kizárólag azt a
komponenst érintő technikai döntések helye `src/<context>/docs/adr/`. A teljes
rendszert érintő ADR továbbra is `docs/adr/` alatt marad.

- Ugyanaz a fogalom ne kapjon több nevet indoklás nélkül.
- A szótár tömör definíciót, határt és szükség esetén ellenpéldát tartalmazzon.
- A terminológia módosítása ne írjon felül hallgatólagosan elfogadott követelményt.
- Tartós technikai következményhez ADR, termékdöntéshez PDR, megfigyelhető elváráshoz
  PRD tartozik.
- Opcionális domain-modellező workflow ugyanezeket a kanonikus helyeket használja;
  ne hozzon létre párhuzamos tudástárat.
