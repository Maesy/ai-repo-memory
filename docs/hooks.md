# Tudásfrissítés workspace-hookokkal

A repo három eseménynél ellenőrzi, szükséges-e a projekttudás újraolvasása.
A Claude és Codex saját beállítása a frissítő skill két rövid belépőjét futtatja;
ezek ugyanazt a függőségmentes változásellenőrzőt használják.
A hook jelzi a frissítés szükségességét; a forrásokat a
[refresh-repo-knowledge](../.agents/skills/refresh-repo-knowledge/SKILL.md) workflow szerint az agent olvassa el.

## Indulás

1. A hookos részhez legyen **Node 22+** az agentfolyamat PATH-ján. Nem kell npm
   install, MCP, hálózati kapcsolat vagy külön háttérszolgáltatás.
2. Meglévő repóban egyesítsd a `.claude/settings.json` és `.codex/hooks.json`
   saját hookbejegyzéseit. A programok a `.agents/skills/refresh-repo-knowledge/scripts/`
   mappában vannak: `claude.mjs`, `codex.mjs` és a közös `knowledge.mjs`.
3. A kliensben tekintsd át és engedélyezd a workspace-et és a hookokat, ahol ezt
   a host kéri. Codex CLI-ben a `/hooks` mutatja a felismerést és trustot; ott
   eseményenként külön kell jóváhagyni, tehát mind a hármat. A fájl jelenléte vagy
   a saját doctor kimenete nem helyettesíti ezt. A részletek lentebb, a trustról
   szóló szakaszban.
4. Indíts új sessiont. Ellenőrizd az alábbi működési próbával a saját hostodat.

A konfiguráció már tartalmazza a hookokat; az adott host támogatása és trustja
határozza meg, futnak-e. A kézi munkafolyamat automatizálás nélkül is használható:
ehhez csak a saját három handler bejegyzését vedd ki a két konfigurációból, más
hookot ne törölj. A programot és a dokumentációt nem szükséges eltávolítani.

## Melyik hook mikor fut?

| Hook | Mikor? | Mit tesz? |
| --- | --- | --- |
| `SessionStart` | Új session, támogatott resume/compaction esemény | Forrásfrissítést kér akkor is, ha a tartalomhash változatlan: a modell kontextusa megváltozhatott |
| `UserPromptSubmit` | Felhasználói kérés előtt | Változás esetén forrásolvasást kér; változatlan tartalomnál csendben marad |
| `PostToolUse` | Fájlíró eszköz befejezése után | Változás esetén a frissítő skillhez irányít; változatlan tartalomnál csendben marad |

Mindkét kliensnél és mindhárom eseménynél a kimenet
`hookSpecificOutput.additionalContext`. A hook sehol nem blokkol, és nem kér
eszközjóváhagyást.

A `PostToolUse` mindkét kliensnél `Write|Edit` matcherre szűkített. Claude-ban ez
a két név szerinti fájlszerkesztő eszközt, Codexben az `apply_patch` `Edit` és
`Write` aliasait is lefedi. Shellparanccsal vagy más nevű MCP-eszközzel végzett
írást ez a matcher nem figyel; az ilyen változást a következő `UserPromptSubmit`
vagy `SessionStart` észleli. A jelzés csak akkor jön létre, ha a figyelt
Markdown-fájlok lenyomata ténylegesen változott.

`Stop` nincs regisztrálva. A `Stop` a válasz lezárásakor sül el, vagyis már a
befejezés közben kérne olvasást, és a folytatáskérés újabb `Stop`-ot váltana ki.
A védekezéshez külön `stopUsed` és `stopBlocked` állapotkezelés kellett, amely a
közös programból így teljesen elhagyható.

`PreToolUse` sincs regisztrálva: a `UserPromptSubmit` már a turn elején ellenőriz,
a `PostToolUse` pedig az írás után érzékeli a változást. A `PreToolUse` minden
eszközhívás előtt egy második teljes lenyomatolvasást jelentene, érdemi
többletfedettség nélkül.

## Trust: hol dől el, hogy fut-e a hook?

A konfiguráció jelenléte nem elég: a host támogatása, futtatási módja, workspace-
trustja és szervezeti policyja is számít. A repo nem nyilváníthatja megbízhatóvá
saját magát: különben egy letöltött repo a saját fájljaival kikényszeríthetné a
benne leírt parancsok futtatását.

Codexnél két kapu van:

| Kapu | Hol | Mit dönt el? |
| --- | --- | --- |
| Projekt-trust | Felhasználói, helyi Codex-beállítás | Betöltődik-e egyáltalán a repo `.codex/` rétege |
| Hookonkénti review és trust | Codex `/hooks` felület | Futhat-e az adott, pontos hookdefiníció |

A projekt-trust szükséges, de nem elegendő. A Codex a nem menedzselt hook pontos
definíciójához kötött trustot tárol; új vagy megváltozott hookot újra át kell nézni
és jóvá kell hagyni. Ezt a klienssel kezeld, ne kézzel szerkesztett, verziókezelt
állapotként.

Amit a repo tartalmaz, az a kívánság, nem a jóváhagyás:

| Repo (verziókezelt) | Felhasználó gépe (nem verziókezelt) |
| --- | --- |
| `.codex/hooks.json` — mit csináljon a hook | melyik pontos hook van jóváhagyva vagy letiltva |
| `.codex/config.toml` → `[features] hooks = true` — a repo kéri a funkciót | melyik checkout megbízható |
| `.claude/settings.json` — a Claude hookbejegyzései | személyes, géphez kötött döntések |

A Claude és a Codex trust- és policy-folyamata nem azonos. Claude interaktív
sessionben workspace-trustot kérhet, míg nem interaktív `-p` vagy SDK futtatásban
nincs ilyen párbeszéd. Ezért ugyanabban a checkoutban külön-külön kell ellenőrizni
a két kliensben a hookok felismerését és tényleges futását.

### Következmények a napi munkára

- **Egy hookdefiníció módosítása érvényteleníti az érintett hook trustját.** A trust
  a pontos definíció hash-éhez kötődik, ezért az új vagy megváltozott hookot újra
  jóvá kell hagyni a `/hooks` felületen. A változatlan definíciók trustja ettől nem
  változik.
- **Új Codex-checkoutban a projekt hookjai jóváhagyásig nem futnak.** Az onboarding
  lépés: nyisd meg a projektet Codexben, fogadd el a projekt-trustot, futtasd a
  `/hooks`-ot, és hagyd jóvá mind a hármat.
- **Egy réteg egy definíciós formát használjon.** Ez a repo a `.codex/hooks.json`
  fájlban tartja a definíciókat, a `.codex/config.toml` pedig csak kapcsolókat.
  Ha mindkettőbe kerülne hookdefiníció, a Codex összefésüli őket és figyelmeztet.
- **Trust-állapot soha ne kerüljön a repóba.** Személyes, géphez és hash-hez kötött,
  ezért verziókezelve félrevezető volna.
- Szervezeti környezetben a menedzselt szabályok felülírhatják vagy korlátozhatják
  a helyi hookok használatát.

### Hogyan ellenőrizd?

Codexben nyisd meg a `/hooks` felületet, és ellenőrizd, hogy a `SessionStart`,
`UserPromptSubmit` és `PostToolUse` egyaránt telepített, aktív és jóváhagyott.
Konfigurációváltozás után indíts új sessiont, majd egy tényleges
`REPO_KNOWLEDGE_REFRESH` jelzéssel és forrásolvasással ellenőrizd a kézbesítést.
Ne következtess működésre pusztán a fájlok jelenlétéből vagy a doctor sikeréből.

## Miért nem csak egy skill neve szerepel a hookban?

A skill eljárásleírás az agentnek; a lifecycle-hookot a kliens futtatja, és nincs
közös `type: skill` kezelő. Codexben a `command` és `mcp_tool` támogatott, a
`prompt` és `agent` kezelőt a jelenlegi dokumentáció szerint kihagyja. A Claude
hookja sem futtatja magát a skillt: a `claude.mjs` változást ellenőriz, majd arra
utasítja az agentet, hogy olvassa el és kövesse a skillt.

A script, állapotkezelés és kliensenkénti kimenet a skill könyvtárában marad.
A hookbeállításban nincs vendorparaméter. Claude-nál a projektgyökér-változó
rövid hivatkozást tesz lehetővé. A Codex parancsában csak a gyökérkereső indítás
marad: a kliens a session munkakönyvtárából indít, ami almappa is lehet.
Ezért a belépőt felfelé keresi; nem igényel Git-parancsot, telepített globális
segédet vagy géphez kötött abszolút útvonalat. A frissítési logika nincs a JSON-ban.

A két belépő azért marad külön, mert a kliensek eltérő módon hivatkoznak a
programra: Claude-nál a projektgyökér-változó adja az útvonalat, Codexnél a
gyökérkereső indítás. A jelzés formátuma azonban mindkettőnél ugyanaz. Az eltérést
a skill rejti el a konfiguráció és a közös eljárás elől.

## Mit kap meg a modell?

Eszközművelet után a kliens a hook stdout-ján kapott JSON-ból olvassa ki a jelzést:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "REPO_KNOWLEDGE_REFRESH: Read .agents/skills/refresh-repo-knowledge/SKILL.md completely and follow its workflow in this checkout before finalizing. Hook event: PostToolUse."
  }
}
```

Ez a tényleges üzenet rövidített részlete. Mindhárom esemény ugyanahhoz a kanonikus
skillhez irányít; csak az esemény neve és a jelzés oka tér el. A kliens a következő
modellkérés kontextusához adja. A modell ezután saját fájlolvasó eszközével végzi el
a skillben leírt olvasást. A hook nem hajtja végre a skillt, és nem helyettesíti az
olvasást.

## Keresés és változásellenőrzés

Az agent a generált `docs/knowledge/INDEX.md` címei és hivatkozásai alapján
választ dokumentumot. Ha ez nem elég, célzott szöveges keresést végez a tudástárban,
majd a releváns dokumentumokat teljes egészükben olvassa el. A tudástárat módosító
agent a `record-decision` skill indexgenerátorát futtatja; a `validate-knowledge`
ellenőrző módban vizsgálja, hogy a tartalomjegyzék egyezik-e a forrásokkal.
Az embernek nem kell indexsorokat karbantartania. A starter jelenlegi keresési
eljárása ezt a navigációt és a fájlos keresést használja.

Ettől külön művelet a hook lenyomatképzése: mindkét kliens hookellenőrzése beolvassa a figyelt
Markdown-fájlok bájtjait, hogy a változást észlelje. Ezek nem kerülnek a modell
kontextusába; a modellnek csak a kiválasztott forrásokat kell feldolgoznia.

## A változástól a friss tudásig

1. Ember vagy agent elmenti a `docs/project.md` vagy `docs/knowledge/**/*.md` egyikét.
2. A fogadó következő hookja a saját checkout fájlneveiből és tartalmából SHA-256
   lenyomatot számol. A létrehozást és törlést is érzékeli; nem csak agentírásokat.
3. Ha új állapotot talál, rögzített `REPO_KNOWLEDGE_REFRESH` jelzést ad. A forrásból
   nem másol tetszőleges szöveget magas prioritású modellutasításba.
4. Az agent elolvassa a teljes kanonikus skillt, projektadatlapot, indexet és a
   feladathoz tartozó teljes dokumentumokat. Megvizsgálja a verziót, státuszt és hatókört.
5. Az agent megnevezi, mit olvasott és hogyan érinti a feladatát. Egy `proposed`
   rekord ettől nem válik elfogadottá. A változásjelzés nem jogosít fájlmódosításra.

Nincs közvetlen agent–agent üzenetküldés vagy automatikus Git-szinkron. Azonos
checkoutban mindkét vendor látja a változást; külön worktree-ben a fájloknak előbb
oda kell kerülniük a csapat szokásos folyamatával.

## Állapot és hibakezelés

- Helyi, Gitből kizárt állapot: `.agent-runtime/knowledge-hooks/`.
  A kulcs vendor + kanonikus checkout + session-ID + rendelkezésre álló subagent-ID.
- A `state.json` az utoljára **felajánlott** revíziót és 24 rövid eseményt tárol.
  Nincs prompt-, forrástartalom- vagy beszélgetésnapló. Ez nem forrásolvasási ACK.
- Az azonos session párhuzamos callbackjeit könyvtárzár sorosítja. A state atomikus
  átnevezéssel frissül, a jelzés stdout-ra írása után. Összeomláskor ismételt
  jelzés lehetséges; pontosan egyszeri modellfeldolgozást nem ígérünk.
- Hiba esetén a segéd rövid diagnosztikát ad, és nem tiltja a szokásos munkát.
  A frissítést ilyenkor kifejezetten kell kérni. Beragadt `lock` csak az összes
  érintett session/hook leállítása után törölhető; a teljes helyi hookállapot is
  újraépíthető, de az első következő esemény új frissítést fog kérni.
- Egy ellenőrzés legfeljebb 1000 Markdown-fájlt / 8 MiB tartalmat és 1 MiB hookinputot
  kezel. A forrás- és state-symlinkeket/junctionöket elutasítja. Nagyobb tudástárnál
  külön méretezés szükséges. Hook timeout: 5 másodperc; zárra várás legfeljebb 0,5 másodperc.

## Ellenőrzés

A repo gyökerében:

```text
node .agents/skills/refresh-repo-knowledge/scripts/claude.mjs --doctor
node --test tests/knowledge-hooks.test.mjs
```

A doctor csak a Node-ot, a forrásolvasást és a lenyomatot ellenőrzi. Nem ad
host-trustot, és nem állítja, hogy az üzenet a modellhez jutott.

Saját hostpróba: külön tesztsessionben kérj forrásolvasást; munka közben egy másik
ablakban módosíts egy tesztdöntést. A következő hook után ellenőrizd a tényleges
forrásolvasást és az új verziót a válaszban. Értesítési napló önmagában nem elég.
Termékkövetelményt pusztán a próbához ne jelölj elfogadottnak.

A Windows motorpróbák előzménye Claude valódi modell általi olvasást és Codex
modellkontextus-átadást igazolt. A mellékelt program külön automatizált teszteket
kap; a natív panelek, Linux/macOS és JetBrains teljes támogatását ez nem jelenti.

## Időzítés és további korlát

A hook a következő támogatott eseménynél fut; nem szakít meg egy folyó
modellkérést, és nem garantál idle ébresztést. A Claude `FileChanged` önmagában
nem tölti a jelzést a modellkontextusba; ezért nem erre építünk.
[Claude hookok](https://code.claude.com/docs/en/hooks),
[Codex hookok](https://learn.chatgpt.com/docs/hooks). Dokumentációellenőrzés: 2026-09-11.
