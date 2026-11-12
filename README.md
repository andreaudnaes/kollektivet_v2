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

## Vaskeliste
- **Ansvarsområder** (kjøkken, bad …) med egen rotasjon: hvem som er med, rekkefølge, hvor ofte det bytter (hver/annenhver/hver tredje uke) og startuke.
- Rotasjonen regnes ut automatisk ut fra uke (mandag–søndag, norsk tid). Ingen må trykke «roter».
- **Avkrysning** som alle ser: «Merk som gjort» per område, og valgfri **huskeliste** med punkter som krysses av hver uke.
- **Enkeltuker** kan overstyres i innstillingene: gi uka til noen andre, eller sett «Ingen vask». Resten av rotasjonen påvirkes ikke.
- Logikken ligger i `src/lib/rotation.ts` og `src/lib/weeks.ts`, med tester i `src/lib/rotation.test.ts` (`bun test`).

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
    vaskeliste/  Vaskeliste, innstillinger og Server Actions
    page.tsx  Forsiden
  components/ Felles komponenter
  db/         Databaseklient og skjema (Drizzle)
  lib/        Innlogging, uker, rotasjon og datahenting
  proxy.ts    Sender uinnloggede til /logg-inn
drizzle/      Genererte migrasjoner
```
