# Administrace Portfolio Hub

Administrace běží na `/admin` a používá podepsanou `HttpOnly` cookie.

## Ovládání

- **Projekty**: vyhledávání, filtr sekce a stavu, malé náhledy, změna pořadí pomocí šipek. Změněné pořadí se ukládá tlačítkem **Uložit změny**.
- **Sekce**: úprava názvu, popisu a výchozího typu odkazu; změna výchozího typu odkazu po potvrzení aktualizuje i projekty v dané sekci.
- **Technologie a nástroje**: jedno sdílené vysvětlení pro každý přesný název, přepínač chybějících popisů.
- **Editor**: `/admin/projects/[id]/edit`, nový projekt na `/admin/projects/new/edit`. Opuštění rozpracovaných změn je chráněno potvrzením. Existující ID a slug nejsou přepisovány při přejmenování.
- **Náhled**: vlastní obrázek se vybere ve formuláři a nahraje při uložení; uložením se nastaví `manual` a `thumbnailLocked=true`. Automatické generování v produkci probíhá přes GitHub Actions, nikoli tlačítkem v administraci.
- **Archivace/smazání**: potvrzovací dialog. Archivace zároveň nastaví `visibility=private`.

**Pozor:** `notesPrivate` není vykresleno na veřejném webu, ale zůstává v `data/projects.json`. Pokud je repozitář veřejný, není toto pole vhodné pro důvěrné informace.

## Prostředí a zápisy

V produkci API aktualizuje `data/projects.json` přes GitHub Contents API. Při souběžné změně `updatedAt` se zápis odmítne, aby nedošlo k tichému přepsání novějších dat.

Ve Vercel Preview používá API `VERCEL_GIT_COMMIT_REF` místo `GITHUB_BRANCH=main`, aby testování z preview nezasáhlo produkční větev. Pokud ref preview není dostupný, zápisy nejsou povoleny. Každý zápis do preview větve může způsobit nový preview deployment.

Vlastní nahrání obrázku je samostatný GitHub commit. Pokud následné uložení projektu selže, může v repozitáři zůstat nevyužitý obrázek.

## Proměnné prostředí

- `ADMIN_PASSWORD`: heslo zadané do přihlašovacího formuláře.
- `SESSION_SECRET`: dlouhý náhodný řetězec pro podpis session cookie.
- `GITHUB_TOKEN`: minimální oprávnění Contents: Read/Write pouze pro daný repozitář.
- `GITHUB_OWNER`: výchozí `Hawk2323`.
- `GITHUB_REPO`: výchozí `portfolio-hub`.
- `GITHUB_BRANCH`: produkční cílová větev, výchozí `main`.

Session trvá 12 hodin; cookie je `HttpOnly`, `SameSite=Lax` a v produkci `Secure`. Hesla ani tokeny se nikdy nevracejí do frontendu.
