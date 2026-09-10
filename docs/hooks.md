# Tudásfrissítés workspace-hookokkal

A repo négy eseménynél ellenőrzi, szükséges-e a projekttudás újraolvasása.
A Claude és Codex saját beállítása ugyanazt a függőségmentes Node-programot futtatja.
A hook jelzi a frissítés szükségességét; a forrásokat a meglévő
[refresh-repo-knowledge](../.agents/skills/refresh-repo-knowledge/SKILL.md) workflow olvassa el.

## Indulás

1. A hookos részhez legyen **Node 22+** az agentfolyamat PATH-ján. Nem kell npm
   install, MCP, hálózati kapcsolat vagy külön háttérszolgáltatás.
2. Meglévő repóban egyesítsd a `.claude/settings.json` és `.codex/hooks.json`
   saját hookbejegyzéseit. A közös program: `.agents/hooks/repo-knowledge.mjs`.
3. A kliensben tekintsd át és engedélyezd a workspace-et és a hookokat, ahol ezt
   a host kéri. Codex CLI-ben a `/hooks` mutatja a felismerést és trustot.
   A fájl jelenléte vagy a saját doctor kimenete nem helyettesíti ezt.
4. Indíts új sessiont. Ellenőrizd az alábbi működési próbával a saját hostodat.

A konfiguráció már tartalmazza a hookokat; az adott host támogatása és trustja
határozza meg, futnak-e. A kézi munkafolyamat automatizálás nélkül is használható:
ehhez csak a saját négy handler bejegyzését vedd ki a két konfigurációból, más
hookot ne törölj. A programot és a dokumentációt nem szükséges eltávolítani.

## Melyik hook mikor fut?

| Hook | Mikor? | Mit tesz? |
| --- | --- | --- |
| `SessionStart` | Új session, támogatott resume/compaction esemény | Forrásfrissítést kér akkor is, ha a tartalomhash változatlan: a modell kontextusa megváltozhatott |
| `UserPromptSubmit` | Felhasználói kérés előtt | Ellenőrzi a változást; új kérésnél újra engedi az egyszeri Stop-folytatást |
| `PostToolUse` | Támogatott eszköz befejezése után | Változás esetén kontextusjelzést ad; változatlan tartalomnál csendben marad |
| `Stop` | A válasz lezárása előtt | Függő változásnál legfeljebb egy frissítési folytatást kér; újabb változás a következő eseményre marad |

Claude-nál a kimenet `hookSpecificOutput.additionalContext`. Codexnél ugyanez
használatos a három kezdő/eszközeseménynél; a Stop `decision: block` és `reason`
mezőkkel kér folytatást. Ez nem eszközjóváhagyási kérés.

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
node .agents/hooks/repo-knowledge.mjs --doctor
node --test tests/knowledge-hooks.test.mjs
```

A doctor csak a Node-ot, a forrásolvasást és a lenyomatot ellenőrzi. Nem ad
host-trustot, és nem állítja, hogy az üzenet a modellhez jutott.

Saját hostpróba: külön tesztsessionben kérj forrásolvasást; munka közben egy másik
ablakban módosíts egy tesztdöntést. A következő hook után ellenőrizd a tényleges
forrásolvasást és az új verziót a válaszban. Értesítési napló önmagában nem elég.
Termékkövetelményt pusztán a próbához ne jelölj elfogadottnak.

A Windows motorpróbák előzménye Claude valódi modell általi olvasást és Codex
Stop-kontextusátadást igazolt. A mellékelt program külön automatizált teszteket
kap; a natív panelek, Linux/macOS és JetBrains teljes támogatását ez nem jelenti.
A friss saját futási eredményeket az előadás karbantartási jegyzőkönyve rögzíti.

## Időzítés és következő előadás

A hook a következő támogatott eseménynél fut; nem szakít meg egy folyó
modellkérést, és nem garantál idle ébresztést. A Claude `FileChanged` önmagában
nem tölti a jelzést a modellkontextusba; ezért nem erre építünk.
[Claude hookok](https://code.claude.com/docs/en/hooks),
[Codex hookok](https://learn.chatgpt.com/docs/hooks). Dokumentációellenőrzés: 2026-09-10.

Az **A2A protokollon keresztüli kétirányú kommunikáció** az AI-alkalmazások eltérő
integrációja és jelenleg nem teljes támogatása miatt egy következő előadás
témája lehet. A mostani folyamat a helyi hookokra épül.
