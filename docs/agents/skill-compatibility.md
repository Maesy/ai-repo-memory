# Opcionális skillek integrációja

Az alaprepo négy saját tudáskezelő skillt tartalmaz. További projektskillek
telepíthetők mellé, de használatuk nem kötelező.

## Forrás és elsőbbség

- A kanonikus skillforrás `.agents/skills/`. A `.claude/skills/` csak generált,
  vékony adaptereket tartalmaz.
- GitHub Copilot közvetlenül a `.agents/skills/` könyvtárat olvassa. Ne készíts
  `.github/skills/` másolatot, és ne konfiguráld `.claude/skills/`-t második
  Copilot-forrásként.
- Copilot CLI-ben az első azonos nevű projekt-skill nyer; `.github/skills/`
  hiányában a kanonikus `.agents/skills/` megelőzi a `.claude/skills/`
  Claude-adaptert. VS Code-ban
  a támogatott baseline 1.125+, amely tartalmazza a több skillforrás duplikációjának
  javítását. A `.vscode/settings.json` deprecated location-beállítása csak Local
  agent fallback: ott kizárja a Claude-adaptereket; Agent Hostban nem érvényes.
- Elsőbbség: platform- és biztonsági korlátok, felhasználói kérés, `AGENTS.md`,
  `docs/agents/*.md`, majd a kiválasztott skill általános szabályai.
- A skill kiválasztása nem ad új írási, publikálási, issue-kezelési vagy külső
  rendszerhez tartozó felhatalmazást.
- Azonos nevű globális és projektskill ne legyen egyszerre aktív.

## Közös szerződés

- Doménnyelv: `CONTEXT.md`; nagyobb rendszer térképe: `CONTEXT-MAP.md`, a térképen
  jelölt komponensnyelv pedig `src/<context>/CONTEXT.md`.
- PRD: `docs/prd/`; PDR: `docs/pdr/`; rendszerszintű ADR: `docs/adr/`;
  komponens-ADR: `src/<context>/docs/adr/`.
- Issue tracker és triage-konfiguráció csak a célprojekt tényleges folyamata alapján
  jöhet létre, például `docs/agents/issue-tracker.md` alatt.
- Az opcionális workflow-k minden kliensben ugyanitt keresik a megosztott
  `issue-tracker.md`, `triage-labels.md` és `domain.md` konfigurációt. Egy
  vendor-specifikus telepítőbejegyzés nem írhatja felül ezt a közös helyet.
- Issue, specifikáció, map és ticket tervezési/végrehajtási artefaktum. Tartós
  tudásra stabil rekord-ID és verzió alapján hivatkozzon.

## Telepítés előtti audit

Ellenőrizd a skill:

- triggerét és azt, hogy user- vagy model-invoked;
- írási, hálózati, CLI- és issue-tracker mellékhatását;
- saját scriptjeinek runtime- és csomagfüggőségét;
- feltételezett dokumentumútvonalait;
- ütközését a négy saját workflow-val.

A starter egy-runtime garanciája csak a repository saját scriptjeire vonatkozik.
Opcionális skill csak akkor őrzi meg ezt a garanciát, ha instruction-only vagy
stdlib-only Node.js 24.x scriptet tartalmaz; egyébként a külön függőséget előre
dokumentálni kell.

## Claude-adapterek

Skill telepítése, eltávolítása vagy metadata-változása után:

```text
node .agents/scripts/sync-claude-skill-adapters.mjs --write
node .agents/scripts/sync-claude-skill-adapters.mjs --check
```

A generátor megőrzi a kanonikus frontmattert, frissíti a vékony adaptereket, és csak
korábban generált, már árva adaptert töröl. Kézzel kezelt Claude-skillt nem töröl.
