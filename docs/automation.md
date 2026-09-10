# Mire elég az alap, és mikor kell automatizálás?

| Képesség | Ebben az alapban |
| --- | --- |
| Közös instrukciók és fájlok | Igen |
| Keresési, rögzítési, frissítési és ellenőrzési skill | Igen, fájlműveletekre építve |
| Döntési előzmények és dokumentumverziók | Igen, a csapat által karbantartva |
| Index | Kézzel, a forrással együtt frissítve |
| Gépi sémaellenőrzés, hash és generált katalógus | Nincs beépítve |
| Eseményfolyam, írózár, sessionenkénti olvasási állapot | Nincs beépítve |
| Automatikus frissítési hook vagy Git-szinkron | Nincs beépítve |

Az agent a saját fájl- és keresőeszközeit használja. Az eljárás követését a prompt,
a munkafolyamat és a review támogatja; a skill kiválasztása nem végrehajtási garancia.

Futó agentek közötti üzenetváltáshoz külön lehetőség a
[codex-mcp-bridge](agent-communication.md). Ez kommunikációs réteg, nem tudástár;
Node-függősége miatt választható kiegészítő, nem a starter előfeltétele.

Ha a csapatnak szüksége lesz gépi ellenőrzésekre, a saját CI-jéhez vagy külön
csomagolt eszközhöz illessze őket. A dokumentumok formátumát az eszköz sémájához
kell igazítani, majd ellenőrizni. Hookot csak a hozzá tartozó programmal és
függőségekkel együtt szabad bevezetni.

Az induló alap és a prezentáció nem tartalmaz kész tudásautomatizálási rendszert.
Másik nyelvre átírás önmagában nem szünteti meg egy runtime telepítési igényét.
A starter nem tartalmaz ilyen külön binárist.
