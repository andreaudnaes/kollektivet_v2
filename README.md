# Kollektivet

En app som gjør samarbeidet i et kollektiv enklere og mer oversiktlig.
Alle beboerne ser den samme oversikten, så det blir færre misforståelser og mindre koordinering i gruppechatten.

## Funksjoner (planlagt)
- **Vaskeliste**: ansvarsområder som roterer mellom beboerne
- **Handleliste**: felles liste over ting som må kjøpes
- **Kalender**: felles hendelser, besøk og bortreiser
- **Beholdning**: oversikt over felles forbruksvarer

Foreløpig er appen bare for vårt eget kollektiv. Man registrerer seg med navn og en felles invitasjonskode.

## Tech stack
- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS
- Drizzle ORM + SQLite lokalt / [Turso](https://turso.tech) i produksjon
- Bun som pakkebehandler

## Kom i gang
```bash
bun install
cp .env.example .env.local   # sett INVITE_CODE til noe eget
bun run db:migrate           # lager tabellene i local.db
bun run dev
```
Åpne http://localhost:3000 og registrer deg med navn, en firesifret PIN og invitasjonskoden.

## Design og farger
- Designet («Klar») bruker felles stiler fra `src/components/ui.tsx` og en bunnmeny for mobil.
- Hver beboer velger sin egen **aksentfarge** under **Profil** (9 farger, grønn er standard). Fargene ligger i `src/lib/colors.ts` og settes som CSS-variabelen `--accent` (Tailwind: `bg-accent`, `text-accent`, `bg-accent-tint`).

## App-ikon og hjemskjerm
- Logoen (4b: huset med tre like beboere) ligger i `src/app/icon.svg` (nettleserfane), `src/app/apple-icon.png` (iPhone) og `public/icon-192.png` / `icon-512.png` (Android).
- `src/app/manifest.ts` gjør at appen får eget navn og ikon og åpnes i fullskjerm fra hjemskjermen.

## Vaskeliste
- **Ansvarsområder** (kjøkken, bad …) med egen rotasjon: hvem som er med, rekkefølge, hvor ofte det bytter (hver/annenhver/hver tredje uke) og startuke.
- Rotasjonen regnes ut automatisk ut fra uke (mandag–søndag, norsk tid). Ingen må trykke «roter».
- **Avkrysning** som alle ser: «Merk som gjort» per område, og valgfri **huskeliste** med punkter som krysses av hver uke.
- **Enkeltuker** kan overstyres i innstillingene: gi uka til noen andre, eller sett «Ingen vask». Resten av rotasjonen påvirkes ikke.
- Logikken ligger i `src/lib/rotation.ts` og `src/lib/weeks.ts`, med tester i `src/lib/rotation.test.ts` (`bun test`).

## Handleliste
- **Én felles liste** for hele kollektivet. Varer kan ha **antall** og **kommentar**, og man ser hvem som la dem til.
- Kryss av når noe er kjøpt. Varen flyttes til **Handlet** med hvem som kjøpte og når, kan angres, og skjules etter 3 dager.
- Når man skriver, foreslås **varer som er kjøpt før**, de mest brukte først.
- Samme vare kan ikke stå på lista to ganger.

## Innlogging
- Beboere registrerer seg med **navn**, **firesifret PIN** og den felles **invitasjonskoden** (`INVITE_CODE`).
- PIN-koden lagres hashet med scrypt.
- Etter **5 feil forsøk** låses kontoen i 15 minutter.
- Man holdes innlogget i **30 dager**. Sessions lagres i databasen, så «Logg ut» virker med en gang.
- `src/proxy.ts` sender folk uten cookie til innloggingssiden. Den egentlige sjekken skjer i `getCurrentUser()` i `src/lib/auth.ts`.

## Scripts
| Kommando | Hva den gjør |
|---|---|
| `bun run dev` | Starter utviklingsserveren |
| `bun run build` | Bygger appen for produksjon |
| `bun run lint` | Sjekker koden med ESLint |
| `bun test` | Kjører testene |
| `bun run db:generate` | Lager en ny migrasjon fra `src/db/schema.ts` |
| `bun run db:migrate` | Kjører migrasjoner mot databasen |
| `bun run db:studio` | Åpner Drizzle Studio for å se på dataene |

## Mappestruktur
```
src/
  app/
    (auth)/   Innlogging og registrering (sider + Server Actions)
    (app)/    Sider for innloggede: forside, vaskeliste, handleliste, profil (med bunnmeny)
  components/ Felles komponenter, ikoner og bunnmeny
  db/         Databaseklient og skjema (Drizzle)
  lib/        Innlogging, uker, rotasjon og datahenting
  proxy.ts    Sender uinnloggede til /logg-inn
drizzle/      Genererte migrasjoner
```
