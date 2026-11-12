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
cp .env.example .env.local
bun run dev
```
Åpne http://localhost:3000.

## Scripts
| Kommando | Hva den gjør |
|---|---|
| `bun run dev` | Starter utviklingsserveren |
| `bun run build` | Bygger appen for produksjon |
| `bun run lint` | Sjekker koden med ESLint |
| `bun run db:generate` | Lager en ny migrasjon fra `src/db/schema.ts` |
| `bun run db:migrate` | Kjører migrasjoner mot databasen |
| `bun run db:studio` | Åpner Drizzle Studio for å se på dataene |

## Mappestruktur
```
src/
  app/        Sider og layout (Next.js App Router)
  db/         Databaseklient og skjema (Drizzle)
drizzle/      Genererte migrasjoner
```
