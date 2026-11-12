import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
