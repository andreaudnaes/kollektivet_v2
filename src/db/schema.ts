import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** En beboer i kollektivet. */
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** Navnet slik beboeren skrev det, f.eks. "Andrea". */
  name: text("name").notNull(),
  /** Navnet normalisert (små bokstaver, uten ekstra mellomrom). Brukes til innlogging. */
  nameKey: text("name_key").notNull().unique(),
  /** Hashet PIN (scrypt). Selve PIN-en lagres aldri. */
  pinHash: text("pin_hash").notNull(),
  /** Antall feil PIN-forsøk på rad. Nullstilles ved vellykket innlogging. */
  failedAttempts: integer("failed_attempts").notNull().default(0),
  /** Hvis satt: kontoen er midlertidig låst til dette tidspunktet. */
  lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** En innlogget enhet. Cookien inneholder et tilfeldig token; her lagres bare hashen av det. */
export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 av session-tokenet i cookien. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export type User = typeof users.$inferSelect;

// ---------------------------------------------------------------------------
// Vaskeliste
//
// Uker identifiseres med datoen for mandagen i uka, som tekst: "2026-11-09".
// ---------------------------------------------------------------------------

/** Et ansvarsområde, f.eks. "Kjøkken" eller "Bad". */
export const cleaningAreas = sqliteTable("cleaning_areas", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  /** Hvor mange uker hver person har ansvaret før det går videre: 1, 2 eller 3. */
  intervalWeeks: integer("interval_weeks").notNull().default(1),
  /** Mandagen rotasjonen starter. Den første i rekkefølgen har ansvaret da. */
  startWeek: text("start_week").notNull(),
  /** Rekkefølge i lista over områder. */
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Hvem som er med i rotasjonen for et område, og i hvilken rekkefølge. */
export const cleaningAreaMembers = sqliteTable(
  "cleaning_area_members",
  {
    areaId: text("area_id")
      .notNull()
      .references(() => cleaningAreas.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
  },
  (table) => [primaryKey({ columns: [table.areaId, table.userId] })],
);

/** Valgfri huskeliste for et område, f.eks. "Tørke benker". */
export const cleaningTasks = sqliteTable(
  "cleaning_tasks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    areaId: text("area_id")
      .notNull()
      .references(() => cleaningAreas.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => [index("cleaning_tasks_area_id_idx").on(table.areaId)],
);

/**
 * Overstyring av én bestemt uke for et område.
 * userId satt  = denne personen har ansvaret uka (bytte).
 * userId null  = ingen vask denne uka.
 */
export const cleaningWeekOverrides = sqliteTable(
  "cleaning_week_overrides",
  {
    areaId: text("area_id")
      .notNull()
      .references(() => cleaningAreas.id, { onDelete: "cascade" }),
    week: text("week").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.areaId, table.week] })],
);

/** At et område er vasket en gitt uke, og av hvem. */
export const cleaningCompletions = sqliteTable(
  "cleaning_completions",
  {
    areaId: text("area_id")
      .notNull()
      .references(() => cleaningAreas.id, { onDelete: "cascade" }),
    week: text("week").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    completedAt: integer("completed_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.areaId, table.week] })],
);

/** At ett punkt på huskelista er gjort en gitt uke. */
export const cleaningTaskChecks = sqliteTable(
  "cleaning_task_checks",
  {
    taskId: text("task_id")
      .notNull()
      .references(() => cleaningTasks.id, { onDelete: "cascade" }),
    week: text("week").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checkedAt: integer("checked_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.taskId, table.week] })],
);
