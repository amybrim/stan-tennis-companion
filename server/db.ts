import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { chatMessages, familyDrops, guestSessions, InsertUser, memories, pickBattles, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Guest Sessions ───────────────────────────────────────────────────────────

export async function upsertGuestSession(token: string, name = "Steve") {
  const db = await getDb();
  if (!db) return null;
  await db
    .insert(guestSessions)
    .values({ token, name, lastSeenAt: new Date() })
    .onDuplicateKeyUpdate({ set: { lastSeenAt: new Date() } });
  const result = await db.select().from(guestSessions).where(eq(guestSessions.token, token)).limit(1);
  return result[0] ?? null;
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export async function getChatHistory(sessionToken: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionToken, sessionToken))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit)
    .then((rows) => rows.reverse());
}

export async function saveChatMessage(sessionToken: string, role: "user" | "assistant", content: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(chatMessages).values({ sessionToken, role, content });
}

// ─── Memories ─────────────────────────────────────────────────────────────────

export async function getMemories(sessionToken: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(memories)
    .where(eq(memories.sessionToken, sessionToken))
    .orderBy(desc(memories.createdAt));
}

export async function addMemory(sessionToken: string, authorName: string, title: string, content: string, emoji = "🎾") {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(memories).values({ sessionToken, authorName, title, content, emoji });
  return result;
}

export async function deleteMemory(id: number, sessionToken: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(memories).where(and(eq(memories.id, id), eq(memories.sessionToken, sessionToken)));
}

// ─── Family Drops ─────────────────────────────────────────────────────────────

export async function getFamilyDrops() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(familyDrops).orderBy(desc(familyDrops.createdAt));
}

export async function addFamilyDrop(fromName: string, message: string) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(familyDrops).values({ fromName, message });
}

export async function markDropRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(familyDrops).set({ isRead: true }).where(eq(familyDrops.id, id));
}

export async function getUnreadDropCount() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(familyDrops).where(eq(familyDrops.isRead, false));
  return rows.length;
}

// ─── Pick Battles ─────────────────────────────────────────────────────────────

export async function getPickBattles(sessionToken: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pickBattles)
    .where(eq(pickBattles.sessionToken, sessionToken))
    .orderBy(desc(pickBattles.createdAt));
}

export async function createPickBattle(
  sessionToken: string,
  matchDescription: string,
  player1: string,
  player2: string,
  stanPick: string,
  tournament?: string,
  round?: string
) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(pickBattles).values({
    sessionToken,
    matchDescription,
    player1,
    player2,
    stanPick,
    tournament,
    round,
  });
  return result;
}

export async function submitStevePick(id: number, stevePick: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(pickBattles).set({ stevePick }).where(eq(pickBattles.id, id));
}

export async function resolvePickBattle(id: number, actualWinner: string) {
  const db = await getDb();
  if (!db) return;
  const rows = await db.select().from(pickBattles).where(eq(pickBattles.id, id)).limit(1);
  if (!rows[0]) return;
  const battle = rows[0];
  const stanCorrect = battle.stanPick === actualWinner;
  const steveCorrect = battle.stevePick === actualWinner;
  await db.update(pickBattles).set({ actualWinner, stanCorrect, steveCorrect, resolvedAt: new Date() }).where(eq(pickBattles.id, id));
}

export async function getPickBattleScore(sessionToken: string) {
  const db = await getDb();
  if (!db) return { stanWins: 0, steveWins: 0, total: 0 };
  const rows = await db
    .select()
    .from(pickBattles)
    .where(and(eq(pickBattles.sessionToken, sessionToken)));
  const resolved = rows.filter((r) => r.actualWinner != null);
  const stanWins = resolved.filter((r) => r.stanCorrect).length;
  const steveWins = resolved.filter((r) => r.steveCorrect).length;
  return { stanWins, steveWins, total: resolved.length };
}
