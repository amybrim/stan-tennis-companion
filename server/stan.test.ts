import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  upsertGuestSession: vi.fn().mockResolvedValue({ id: 1, token: "test_token", name: "Steve" }),
  getChatHistory: vi.fn().mockResolvedValue([]),
  saveChatMessage: vi.fn().mockResolvedValue(undefined),
  getMemories: vi.fn().mockResolvedValue([]),
  addMemory: vi.fn().mockResolvedValue({ insertId: 1 }),
  deleteMemory: vi.fn().mockResolvedValue(undefined),
  getFamilyDrops: vi.fn().mockResolvedValue([]),
  addFamilyDrop: vi.fn().mockResolvedValue(undefined),
  markDropRead: vi.fn().mockResolvedValue(undefined),
  getUnreadDropCount: vi.fn().mockResolvedValue(0),
  getPickBattles: vi.fn().mockResolvedValue([]),
  createPickBattle: vi.fn().mockResolvedValue({ insertId: 1 }),
  submitStevePick: vi.fn().mockResolvedValue(undefined),
  resolvePickBattle: vi.fn().mockResolvedValue(undefined),
  getPickBattleScore: vi.fn().mockResolvedValue({ stanWins: 3, steveWins: 2, total: 5 }),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Test response from Stan" } }],
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Guest Session", () => {
  it("initializes a guest session with token and name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.guest.init({ token: "test_token_123", name: "Steve" });
    expect(result).toBeTruthy();
  });
});

describe("Chat", () => {
  it("returns chat history for a session token", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const history = await caller.chat.history({ sessionToken: "test_token" });
    expect(Array.isArray(history)).toBe(true);
  });

  it("sends a message and returns a reply", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.send({ sessionToken: "test_token", message: "Who is Alcaraz?" });
    expect(result).toHaveProperty("reply");
    expect(typeof result.reply).toBe("string");
  });
});

describe("Memories", () => {
  it("returns memories list for a session", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const memories = await caller.memories.list({ sessionToken: "test_token" });
    expect(Array.isArray(memories)).toBe(true);
  });

  it("adds a memory successfully", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.memories.add({
      sessionToken: "test_token",
      authorName: "Steve",
      title: "Alcaraz wins Wimbledon",
      content: "What a match! He was incredible.",
      emoji: "🏆",
    });
    expect(result.success).toBe(true);
  });
});

describe("Family Drops", () => {
  it("returns drops list", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const drops = await caller.drops.list();
    expect(Array.isArray(drops)).toBe(true);
  });

  it("adds a family drop", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.drops.add({ fromName: "Amy", message: "Hey Dad, watch Alcaraz today!" });
    expect(result.success).toBe(true);
  });

  it("returns unread count", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const count = await caller.drops.unreadCount();
    expect(typeof count).toBe("number");
  });
});

describe("Pick Battle Score", () => {
  it("returns score for a session", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const score = await caller.picks.score({ sessionToken: "test_token" });
    expect(score).toHaveProperty("stanWins");
    expect(score).toHaveProperty("steveWins");
    expect(score).toHaveProperty("total");
    expect(score.stanWins).toBe(3);
    expect(score.steveWins).toBe(2);
  });
});

describe("Auth", () => {
  it("returns null user for unauthenticated requests", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
});
