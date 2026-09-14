# Repository-tudás frissítési hookok

A hookok a `refresh-repo-knowledge` workflow indítását jelzik, amikor új session
kezdődik vagy a figyelt tudás megváltozik. Nem töltenek teljes forrást a promptba,
nem hoznak döntést és nem igazolnak olvasást.

## Előfeltételek

- támogatott Claude, Codex vagy GitHub Copilot kliens;
- a projekt hookjainak felhasználói/workspace trustja;
- Node.js 24.x LTS a hookfolyamat `PATH`-ján;
- a repository saját `.claude/settings.json`, `.codex/hooks.json`,
  `.github/hooks/repo-knowledge.json` és `.vscode/settings.json` beállítása.

Nincs npm-, Python-, shell-, MCP-, hálózati vagy háttérszolgáltatás-függőség.

## Események

| Esemény | Viselkedés |
| --- | --- |
| `SessionStart` | Mindig kér teljes, explicit tudásfrissítést. |
| `UserPromptSubmit` | Csak az előzőleg felajánlott snapshot óta történt tudásváltozásnál jelez. |
| `PostToolUse` (`Write|Edit`) | Írás után új snapshotot számol; változásnál jelez. |

A közös motor: `.agents/skills/refresh-repo-knowledge/scripts/knowledge.mjs`.
A kliensbelépők: `claude.mjs`, `codex.mjs` és `copilot.mjs`.

## Figyelt tudás

- `docs/project.md`
- `docs/README.md`
- `docs/governance.md`
- `docs/agents/**/*.md`
- `docs/adr/**/*.md`
- `docs/pdr/**/*.md`
- `docs/prd/**/*.md`
- `CONTEXT.md`
- `CONTEXT-MAP.md`
- `src/*/CONTEXT.md`
- `src/*/docs/adr/**/*.md`

A kutatási jegyzetek és sablonok nem automatikusan alkalmazandó tudás, ezért nem
részei a snapshotnak.

## Állapot és biztonság

- A snapshot relatív útvonalak és SHA-256 tartalomhash-ek listájából készül.
- A gitignore-olt `.agent-runtime/knowledge-hooks/state.json` egyetlen, legfeljebb
  64 agent-state bejegyzést tartalmazó map. A hash-kulcs a klienst, checkoutot,
  sessiont és — ha van — subagentet különíti el.
- Az állapot csak felajánlott revisiont és rövid eseménymetadata-t tárol; promptot,
  dokumentumszöveget vagy olvasási nyugtát nem.
- A motor 1000 fájl / 8 MiB és 1 MiB stdin limiteket alkalmaz.
- Symlinkelt/junction tudás- és állapotútvonalat elutasít.
- Állapotot lock mellett, atomikusan ír. A nem helyreállítható ellenőrzési hibák
  fail-open rendszerüzenetet adnak, így a segédhook nem blokkolja a normál munkát.
- A session `cwd`-jének a checkouton belül kell lennie.

A közös map írásait az atomikus state és a 30 másodperces lock-lease sorosítja.
Sikeres lock esetén a snapshot a kritikus szakaszban készül, ezért régebbi revision
nem írható vissza újabb fölé. Lock-időtúllépéskor a `SessionStart` mindig jelez;
más esemény csak akkor marad csendben, ha a map szerint ugyanaz az agent-state már
megkapta ugyanazt a revisiont. A jelzés megelőzi az állapotmentést, így egy
meghiúsult mentés legfeljebb ismételt frissítést okozhat, kimaradót nem.

Windows `EPERM`, `EACCES` vagy `EBUSY` rename-hibánál az állapotírás öt rövid,
növekvő késleltetésű újrapróbálkozást végez, majd fail-open módon állapotmentés
nélkül folytatódik. Hard kill esetén egy egyedi nevű `.tmp` fájl maradhat vissza;
ezt az állapotépség érdekében nem váltjuk ütközésveszélyes fix tempnévre.

## Kézbesítési modell és subagentek

- A hook eseményvezérelt ellenőrzés, nem fájlfigyelő, push vagy agentek közötti
  broadcast. Tudásváltozást az adott agent csak a következő támogatott
  hookeseményénél észlel.
- Egy futó, csak olvasó subagentet új hookesemény nélkül a repository nem tud
  felébreszteni. A szülő agent delegálás előtt frissítse saját tudását, és adja át
  a feladathoz alkalmazandó forrásokat.
- Már futó agent valós idejű értesítéséhez orchestratorüzenet, MCP vagy
  háttérfigyelő szükséges; ezek nem részei a szolgáltatásmentes starternek.

## GitHub Copilot sajátosságai

- A natív definíció `.github/hooks/repo-knowledge.json`, és egyetlen `command`
  stringet használ.
- A `copilot.mjs` maga is szűri a `PostToolUse` eszköznevét, mert VS Code-ban a
  Claude matcherének betöltése nem garantálja annak érvényesítését.
- A `.vscode/settings.json` letiltja a `.claude/settings*.json` hookforrásként való
  betöltését; így nincs kettős futás vagy elvesző matcher.
- A kimenet Copilot CLI- és VS Code-kompatibilis kontextusmezőt is tartalmaz.

## Diagnosztika

```text
node .agents/skills/refresh-repo-knowledge/scripts/claude.mjs --doctor
node --test tests/knowledge-hooks.test.mjs
```

A doctor a fájlokat, snapshotot és runtime-ot ellenőrzi. Nem bizonyítja a kliens
trustját vagy azt, hogy az üzenet bekerült a modell kontextusába. Ezt friss sessionben,
kliensenként külön kell ellenőrizni.

## Felhőkörnyezet

A támogatott baseline Node.js 24.x LTS. A Claude menedzselt cloud dokumentációja
jelenleg Node 20/21/22 verziókat sorol; ezért a scriptek átmenetileg Node 22-kompatibilis
API-kat használnak. A környezetfrissítésig ez kompatibilitási engedmény, nem a helyi
vagy CI baseline csökkentése.
