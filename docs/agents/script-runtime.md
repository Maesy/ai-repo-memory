# Skill-scriptek futtatókörnyezete

## Döntés

- A repository által birtokolt minden segédscript és teszt **Node.js 24.x LTS**
  alatt futó `.mjs` fájl.
- Kizárólag beépített Node-modul használható. A starter infrastruktúrájához nem
  kell `package.json`, `npm install`, Python, pip, Bash, PowerShell vagy
  háttérszolgáltatás.
- A célalkalmazás saját `package.json`-ja, runtime-ja, függőségei és tesztjei
  ettől függetlenek; a starter ellenőrzései nem vizsgálják vagy tiltják őket.
- A skill elsődlegesen Markdown-utasítás. Script csak ismétlődő, determinisztikus
  művelethez kerüljön bele.
- Opcionális külső skill saját függősége külön auditálandó; nem válik automatikusan
  starterkövetelménnyé.

## Kompatibilitási átmenet

A támogatott baseline Node.js 24.x LTS. A Claude menedzselt cloud image dokumentációja
jelenleg Node 20/21/22 verziókat sorol, ezért a saját scriptek 2027-01-31-ig nem
használnak Node 22-nél újabb API-t. Ez átmeneti futási kompatibilitás, nem támogatott
baseline; Node 22 EOL-dátuma előtt felül kell vizsgálni.

## Scriptkontraktus

- A közvetlen indítás mindhárom platformon `node script.mjs`.
- Használj platformfüggetlen útvonalkezelést és UTF-8 kódolást; generált fájl legyen LF.
- A read-only ellenőrzés és írás külön kapcsoló legyen (`--check`, `--write`).
- Az írás legyen idempotens, atomikus és változatlan bemenetnél ne írja át a fájlt.
- Normál eredmény stdout, diagnosztika stderr, hiba nem nulla exit code.
- Korlátozd a beolvasott fájlok számát és méretét; utasítsd el a symlinket/junctiont,
  amely a checkouton kívülre vezethet.
- Ideiglenes állapot csak a gitignore-olt `.agent-runtime/` alatt lehet, prompt,
  forrásszöveg vagy beszélgetésnapló nélkül.
- Ne legyen rejtett hálózati hozzáférés, globális konfiguráció vagy külső módosítás.

## Ellenőrzési mátrix

A starter három, név szerint felsorolt infrastruktúra-tesztjét Node.js 24.x alatt
Windows, macOS és Linux környezetben kell futtatni. Az alkalmazás ellenőrzései
külön jobba kerülnek. A kód átmeneti Node 22-kompatibilitását külön CI-job
ellenőrizheti, amíg a menedzselt cloud környezet ezt indokolja.
