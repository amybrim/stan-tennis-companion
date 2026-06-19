import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Guest session — no login required, persisted by device token
export const guestSessions = mysqlTable("guest_sessions", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 64 }).default("Steve").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
});

export type GuestSession = typeof guestSessions.$inferSelect;

// Memory Keeper — Steve and family save tennis moments
export const memories = mysqlTable("memories", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 64 }).notNull(),
  authorName: varchar("authorName", { length: 64 }).default("Steve").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  emoji: varchar("emoji", { length: 8 }).default("🎾"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Memory = typeof memories.$inferSelect;

// Family Drops — messages left for Steve by family
export const familyDrops = mysqlTable("family_drops", {
  id: int("id").autoincrement().primaryKey(),
  fromName: varchar("fromName", { length: 64 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FamilyDrop = typeof familyDrops.$inferSelect;

// Pick Battle — Stan vs Steve match predictions
export const pickBattles = mysqlTable("pick_battles", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 64 }).notNull(),
  matchDescription: varchar("matchDescription", { length: 300 }).notNull(),
  player1: varchar("player1", { length: 100 }).notNull(),
  player2: varchar("player2", { length: 100 }).notNull(),
  stanPick: varchar("stanPick", { length: 100 }).notNull(),
  stevePick: varchar("stevePick", { length: 100 }),
  actualWinner: varchar("actualWinner", { length: 100 }),
  stanCorrect: boolean("stanCorrect"),
  steveCorrect: boolean("steveCorrect"),
  tournament: varchar("tournament", { length: 150 }),
  round: varchar("round", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type PickBattle = typeof pickBattles.$inferSelect;

// Chat history — persisted per guest session
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;

// Analytics Events — track how Steve uses the app
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  guestId: varchar("guestId", { length: 64 }).notNull(),
  event: varchar("event", { length: 128 }).notNull(),
  page: varchar("page", { length: 128 }),
  label: varchar("label", { length: 256 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
