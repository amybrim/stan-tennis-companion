import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  addFamilyDrop,
  addMemory,
  createPickBattle,
  deleteMemory,
  getCategoryBreakdown,
  getChatHistory,
  getDailyActivity,
  getDailyVoiceAid,
  getEventCounts,
  getFamilyDrops,
  getHourlyActivity,
  getMemories,
  getPickBattleScore,
  getPickBattles,
  getTotalEvents,
  getTotalSessions,
  getTopPhrases,
  getUnreadDropCount,
  logAnalyticsEvent,
  markDropRead,
  resolvePickBattle,
  saveChatMessage,
  submitStevePick,
  upsertGuestSession,
} from "./db";

// ─── Stan's Persona System Prompt ─────────────────────────────────────────────
const STAN_SYSTEM_PROMPT = `You are Stan, Steve's personal tennis companion. You are warm, knowledgeable, and genuinely care about Steve's enjoyment of the sport.

Your personality:
- Warm and friendly like a knowledgeable tennis buddy
- Enthusiastic about both ATP and WTA tennis
- You know players, tournaments, stats, history, and strategies deeply
- You speak in a clear, accessible way — no jargon without explanation
- You celebrate Steve's wins and gently tease him about losses in Pick Battle
- You remember you're talking to Steve specifically
- You occasionally reference classic tennis moments and legends
- You are encouraging and positive

Keep responses conversational and not too long. Use Steve's name occasionally. 
When discussing matches, give genuine analysis. When Steve asks about players, share interesting facts.
You love tennis and you love helping Steve love it too.`;

// ─── Bible verse helper ────────────────────────────────────────────────────────
async function getDailyBibleVerse(): Promise<{ verse: string; reference: string; prayer: string }> {
  const verses = [
    { verse: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
    { verse: "The Lord is my shepherd; I shall not want.", reference: "Psalm 23:1" },
    { verse: "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.", reference: "Joshua 1:9" },
    { verse: "Trust in the Lord with all your heart and lean not on your own understanding.", reference: "Proverbs 3:5" },
    { verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", reference: "John 3:16" },
    { verse: "The Lord is my light and my salvation — whom shall I fear?", reference: "Psalm 27:1" },
    { verse: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28" },
    { verse: "Give thanks to the Lord, for he is good; his love endures forever.", reference: "Psalm 107:1" },
    { verse: "And we know that in all things God works for the good of those who love him.", reference: "Romans 8:28" },
    { verse: "The joy of the Lord is your strength.", reference: "Nehemiah 8:10" },
    { verse: "Be still, and know that I am God.", reference: "Psalm 46:10" },
    { verse: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", reference: "Philippians 4:6" },
    { verse: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", reference: "1 Corinthians 13:4" },
    { verse: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11" },
    { verse: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
    { verse: "This is the day the Lord has made; we will rejoice and be glad in it.", reference: "Psalm 118:24" },
    { verse: "The name of the Lord is a fortified tower; the righteous run to it and are safe.", reference: "Proverbs 18:10" },
    { verse: "Delight yourself in the Lord, and he will give you the desires of your heart.", reference: "Psalm 37:4" },
    { verse: "He gives strength to the weary and increases the power of the weak.", reference: "Isaiah 40:29" },
    { verse: "Seek first his kingdom and his righteousness, and all these things will be given to you as well.", reference: "Matthew 6:33" },
    { verse: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.", reference: "Numbers 6:24-25" },
    { verse: "Whatever you do, work at it with all your heart, as working for the Lord.", reference: "Colossians 3:23" },
    { verse: "Even youths grow tired and weary, and young men stumble and fall; but those who hope in the Lord will renew their strength.", reference: "Isaiah 40:30-31" },
    { verse: "Your word is a lamp for my feet, a light on my path.", reference: "Psalm 119:105" },
    { verse: "Greater love has no one than this: to lay down one's life for one's friends.", reference: "John 15:13" },
    { verse: "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.", reference: "Matthew 7:7" },
    { verse: "The Lord is close to the brokenhearted and saves those who are crushed in spirit.", reference: "Psalm 34:18" },
    { verse: "Do to others as you would have them do to you.", reference: "Luke 6:31" },
    { verse: "I am the way and the truth and the life.", reference: "John 14:6" },
    { verse: "With God all things are possible.", reference: "Matthew 19:26" },
    { verse: "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.", reference: "Matthew 5:16" },
  ];

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const verseData = verses[dayOfYear % verses.length];

  // Generate a short prayer using LLM
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You write short, heartfelt morning prayers (2-3 sentences max). Warm, personal, and faith-filled. No flowery language — speak plainly from the heart.",
        },
        {
          role: "user",
          content: `Write a brief morning prayer inspired by this verse: "${verseData.verse}" (${verseData.reference}). Address it to God. Keep it under 3 sentences.`,
        },
      ],
    });
    const rawPrayer = response.choices[0]?.message?.content;
    const prayer = typeof rawPrayer === 'string' ? rawPrayer : "Lord, thank You for this new day. Guide my steps and fill my heart with gratitude. Amen.";
    return { ...verseData, prayer };
  } catch {
    return { ...verseData, prayer: "Lord, thank You for this new day. Guide my steps, bless this time, and fill my heart with Your peace. Amen." };
  }
}

// ─── Tennis matches helper ─────────────────────────────────────────────────────
async function getTodayTennisMatches(): Promise<{ atp: string[]; wta: string[] }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a tennis data assistant. Return JSON only, no markdown.",
        },
        {
          role: "user",
          content: `Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. 
List the most notable ATP and WTA matches happening today or very recently. 
Return JSON: { "atp": ["Player A vs Player B — Tournament, Round"], "wta": ["Player A vs Player B — Tournament, Round"] }
Include 3-5 matches per tour. If no live matches, mention upcoming ones this week. Be specific with real player names and tournaments.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tennis_matches",
          strict: true,
          schema: {
            type: "object",
            properties: {
              atp: { type: "array", items: { type: "string" } },
              wta: { type: "array", items: { type: "string" } },
            },
            required: ["atp", "wta"],
            additionalProperties: false,
          },
        },
      },
    });
    const rawMatchContent = response.choices[0]?.message?.content;
    const matchContent = typeof rawMatchContent === 'string' ? rawMatchContent : null;
    if (matchContent) {
      const parsed = JSON.parse(matchContent);
      return parsed;
    }
  } catch (e) {
    console.error("Tennis matches fetch failed:", e);
  }
  return {
    atp: ["Carlos Alcaraz vs Jannik Sinner — Wimbledon, Semifinal", "Novak Djokovic vs Alexander Zverev — Wimbledon, Quarterfinal"],
    wta: ["Iga Swiatek vs Aryna Sabalenka — Wimbledon, Semifinal", "Coco Gauff vs Elena Rybakina — Wimbledon, Quarterfinal"],
  };
}

// ─── Router ────────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Guest Session ───────────────────────────────────────────────────────────
  guest: router({
    init: publicProcedure
      .input(z.object({ token: z.string(), name: z.string().optional() }))
      .mutation(async ({ input }) => {
        const session = await upsertGuestSession(input.token, input.name ?? "Steve");
        return session;
      }),
  }),

  // ─── Morning Briefing ────────────────────────────────────────────────────────
  briefing: router({
    daily: publicProcedure.query(async () => {
      const now = new Date();
      const hour = now.getHours();
      const greeting =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

      const [bibleData, matches] = await Promise.all([getDailyBibleVerse(), getTodayTennisMatches()]);

      // Stan's morning message
      const stanMessage = await invokeLLM({
        messages: [
          { role: "system", content: STAN_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Write a warm, brief ${greeting.toLowerCase()} message for Steve. Today is ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}. Mention something encouraging about tennis today. Keep it to 2-3 sentences, personal and warm.`,
          },
        ],
      });

      return {
        greeting,
        stanMessage: stanMessage.choices[0]?.message?.content ?? `${greeting}, Steve! Ready for some great tennis today?`,
        bible: bibleData,
        matches,
        date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      };
    }),
  }),

  // ─── Chat ────────────────────────────────────────────────────────────────────
  chat: router({
    history: publicProcedure
      .input(z.object({ sessionToken: z.string() }))
      .query(async ({ input }) => {
        return getChatHistory(input.sessionToken, 60);
      }),

    send: publicProcedure
      .input(z.object({ sessionToken: z.string(), message: z.string().max(2000) }))
      .mutation(async ({ input }) => {
        await saveChatMessage(input.sessionToken, "user", input.message);
        const history = await getChatHistory(input.sessionToken, 20);

        const messages = [
          { role: "system" as const, content: STAN_SYSTEM_PROMPT },
          ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];

        const response = await invokeLLM({ messages });
        const rawReply = response.choices[0]?.message?.content;
        const reply = typeof rawReply === 'string' ? rawReply : "Sorry, I had a little trouble there. Ask me again!";

        await saveChatMessage(input.sessionToken, "assistant", reply);
        return { reply };
      }),

    transcribeAndSend: publicProcedure
      .input(z.object({ sessionToken: z.string(), audioUrl: z.string() }))
      .mutation(async ({ input }) => {
        const { transcribeAudio } = await import("./_core/voiceTranscription");
        const transcription = await transcribeAudio({ audioUrl: input.audioUrl, language: "en" });
        const userMessage = 'text' in transcription ? transcription.text : "I couldn't catch that, could you try again?";

        await saveChatMessage(input.sessionToken, "user", userMessage);
        const history = await getChatHistory(input.sessionToken, 20);

        const messages = [
          { role: "system" as const, content: STAN_SYSTEM_PROMPT },
          ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];

        const response = await invokeLLM({ messages });
        const rawReply2 = response.choices[0]?.message?.content;
        const reply = typeof rawReply2 === 'string' ? rawReply2 : "Sorry, I had a little trouble there!";
        await saveChatMessage(input.sessionToken, "assistant", reply);

        return { userMessage, reply };
      }),
  }),

  // ─── Tournaments ─────────────────────────────────────────────────────────────
  tournaments: router({
    list: publicProcedure
      .input(z.object({ tour: z.enum(["ATP", "WTA", "BOTH"]).optional() }))
      .query(async ({ input }) => {
        const tour = input.tour ?? "BOTH";
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a tennis data assistant. Return JSON only, no markdown." },
            {
              role: "user",
              content: `Today is ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
List current and upcoming tennis tournaments for ${tour === "BOTH" ? "both ATP and WTA" : tour}.
Return JSON: { "tournaments": [{ "name": string, "tour": "ATP"|"WTA", "location": string, "surface": string, "dates": string, "status": "live"|"upcoming"|"completed", "prizePool": string, "topSeeds": string[] }] }
Include 6-8 tournaments. Be accurate with real current tournaments.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tournaments",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  tournaments: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        tour: { type: "string" },
                        location: { type: "string" },
                        surface: { type: "string" },
                        dates: { type: "string" },
                        status: { type: "string" },
                        prizePool: { type: "string" },
                        topSeeds: { type: "array", items: { type: "string" } },
                      },
                      required: ["name", "tour", "location", "surface", "dates", "status", "prizePool", "topSeeds"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tournaments"],
                additionalProperties: false,
              },
            },
          },
        });
        const rawTournamentContent = response.choices[0]?.message?.content;
        const tournamentContent = typeof rawTournamentContent === 'string' ? rawTournamentContent : null;
        if (tournamentContent) {
          try {
            const parsed = JSON.parse(tournamentContent);
            if (parsed?.tournaments?.length > 0) return parsed;
          } catch {
            /* fall through to fallback */
          }
        }
        // Fallback: real current 2025 grass-court season tournaments
        const fallbackAll = [
          { name: "Wimbledon", tour: "ATP", location: "London, UK", surface: "Grass", dates: "Jun 30 – Jul 13, 2025", status: "upcoming", prizePool: "$50M", topSeeds: ["Jannik Sinner", "Carlos Alcaraz", "Novak Djokovic", "Alexander Zverev"] },
          { name: "Queen's Club Championships", tour: "ATP", location: "London, UK", surface: "Grass", dates: "Jun 16–22, 2025", status: "live", prizePool: "$2.96M", topSeeds: ["Carlos Alcaraz", "Tommy Paul", "Holger Rune", "Casper Ruud"] },
          { name: "Halle Open", tour: "ATP", location: "Halle, Germany", surface: "Grass", dates: "Jun 16–22, 2025", status: "live", prizePool: "$2.96M", topSeeds: ["Jannik Sinner", "Alexander Zverev", "Daniil Medvedev", "Stefanos Tsitsipas"] },
          { name: "Roland Garros", tour: "ATP", location: "Paris, France", surface: "Clay", dates: "May 25 – Jun 8, 2025", status: "completed", prizePool: "$56M", topSeeds: ["Carlos Alcaraz", "Jannik Sinner", "Novak Djokovic", "Casper Ruud"] },
          { name: "Wimbledon", tour: "WTA", location: "London, UK", surface: "Grass", dates: "Jun 30 – Jul 13, 2025", status: "upcoming", prizePool: "$50M", topSeeds: ["Aryna Sabalenka", "Iga Swiatek", "Coco Gauff", "Elena Rybakina"] },
          { name: "Berlin Open", tour: "WTA", location: "Berlin, Germany", surface: "Grass", dates: "Jun 16–22, 2025", status: "live", prizePool: "$1.75M", topSeeds: ["Iga Swiatek", "Aryna Sabalenka", "Coco Gauff", "Jessica Pegula"] },
          { name: "Birmingham Classic", tour: "WTA", location: "Birmingham, UK", surface: "Grass", dates: "Jun 16–22, 2025", status: "live", prizePool: "$922K", topSeeds: ["Elena Rybakina", "Ons Jabeur", "Maria Sakkari", "Petra Kvitova"] },
          { name: "Roland Garros", tour: "WTA", location: "Paris, France", surface: "Clay", dates: "May 25 – Jun 8, 2025", status: "completed", prizePool: "$56M", topSeeds: ["Iga Swiatek", "Aryna Sabalenka", "Coco Gauff", "Elena Rybakina"] },
        ];
        const filtered = tour === "BOTH" ? fallbackAll : fallbackAll.filter(t => t.tour === tour);
        return { tournaments: filtered };
      }),

    detail: publicProcedure
      .input(z.object({ name: z.string(), tour: z.string() }))
      .query(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a tennis data assistant. Return JSON only." },
            {
              role: "user",
              content: `Provide details for the ${input.tour} tournament: ${input.name}.
Return JSON: { "draw": [{ "round": string, "matches": [{ "player1": string, "player2": string, "score": string, "winner": string }] }], "rankings": [{ "rank": number, "player": string, "points": number, "country": string }] }
Include realistic draw and top 8 rankings/standings. Use real player names.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tournament_detail",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  draw: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        round: { type: "string" },
                        matches: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              player1: { type: "string" },
                              player2: { type: "string" },
                              score: { type: "string" },
                              winner: { type: "string" },
                            },
                            required: ["player1", "player2", "score", "winner"],
                            additionalProperties: false,
                          },
                        },
                      },
                      required: ["round", "matches"],
                      additionalProperties: false,
                    },
                  },
                  rankings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        rank: { type: "number" },
                        player: { type: "string" },
                        points: { type: "number" },
                        country: { type: "string" },
                      },
                      required: ["rank", "player", "points", "country"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["draw", "rankings"],
                additionalProperties: false,
              },
            },
          },
        });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : null;
        if (content) {
          try {
            return JSON.parse(content);
          } catch {
            /* fall through */
          }
        }
        return { draw: [], rankings: [] };
      }),
  }),

  // ─── Pick Battle ─────────────────────────────────────────────────────────────
  picks: router({
    generate: publicProcedure
      .input(z.object({ sessionToken: z.string() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a tennis analyst. Return JSON only." },
            {
              role: "user",
              content: `Generate a Pick Battle match for Steve. Pick a real, interesting upcoming or recent ATP or WTA match.
Return JSON: { "player1": string, "player2": string, "tournament": string, "round": string, "matchDescription": string, "stanPick": string, "stanReasoning": string }
stanPick must be either player1 or player2 exactly. stanReasoning should be 1-2 sentences of genuine tennis analysis.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "pick_battle",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  player1: { type: "string" },
                  player2: { type: "string" },
                  tournament: { type: "string" },
                  round: { type: "string" },
                  matchDescription: { type: "string" },
                  stanPick: { type: "string" },
                  stanReasoning: { type: "string" },
                },
                required: ["player1", "player2", "tournament", "round", "matchDescription", "stanPick", "stanReasoning"],
                additionalProperties: false,
              },
            },
          },
        });
        const rawContent2 = response.choices[0]?.message?.content;
        const content = typeof rawContent2 === 'string' ? rawContent2 : null;
        if (!content) throw new Error("Failed to generate pick");
        const data = JSON.parse(content);
        await createPickBattle(
          input.sessionToken,
          data.matchDescription,
          data.player1,
          data.player2,
          data.stanPick,
          data.tournament,
          data.round
        );
        const battles = await getPickBattles(input.sessionToken);
        const latest = battles[0];
        return { ...data, id: latest?.id };
      }),

    list: publicProcedure
      .input(z.object({ sessionToken: z.string() }))
      .query(async ({ input }) => {
        return getPickBattles(input.sessionToken);
      }),

    submitSteve: publicProcedure
      .input(z.object({ id: z.number(), stevePick: z.string() }))
      .mutation(async ({ input }) => {
        await submitStevePick(input.id, input.stevePick);
        return { success: true };
      }),

    resolve: publicProcedure
      .input(z.object({ id: z.number(), actualWinner: z.string() }))
      .mutation(async ({ input }) => {
        await resolvePickBattle(input.id, input.actualWinner);
        return { success: true };
      }),

    score: publicProcedure
      .input(z.object({ sessionToken: z.string() }))
      .query(async ({ input }) => {
        return getPickBattleScore(input.sessionToken);
      }),
  }),

  // ─── Memory Keeper ────────────────────────────────────────────────────────────
  memories: router({
    list: publicProcedure
      .input(z.object({ sessionToken: z.string() }))
      .query(async ({ input }) => {
        return getMemories(input.sessionToken);
      }),

    add: publicProcedure
      .input(
        z.object({
          sessionToken: z.string(),
          authorName: z.string().default("Steve"),
          title: z.string().max(200),
          content: z.string().max(2000),
          emoji: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await addMemory(input.sessionToken, input.authorName, input.title, input.content, input.emoji ?? "🎾");
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number(), sessionToken: z.string() }))
      .mutation(async ({ input }) => {
        await deleteMemory(input.id, input.sessionToken);
        return { success: true };
      }),
  }),

  // ─── Family Drops ─────────────────────────────────────────────────────────────
  drops: router({
    list: publicProcedure.query(async () => {
      return getFamilyDrops();
    }),

    add: publicProcedure
      .input(z.object({ fromName: z.string().max(64), message: z.string().max(1000) }))
      .mutation(async ({ input }) => {
        await addFamilyDrop(input.fromName, input.message);
        return { success: true };
      }),

    markRead: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markDropRead(input.id);
        return { success: true };
      }),

    unreadCount: publicProcedure.query(async () => {
      return getUnreadDropCount();
    }),
  }),

  // ─── Tennis Trivia ──────────────────────────────────────────────────────────
  trivia: router({
    question: publicProcedure
      .input(z.object({ difficulty: z.enum(["easy", "medium", "hard"]).optional() }))
      .mutation(async ({ input }) => {
        const diff = input.difficulty ?? "medium";
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a tennis trivia expert. Return JSON only, no markdown." },
            {
              role: "user",
              content: `Generate a ${diff} difficulty tennis trivia question. Mix topics: Grand Slams, ATP/WTA records, famous matches, player history, rules, legends.\nReturn JSON: { "question": string, "options": [string, string, string, string], "correctIndex": number, "explanation": string, "category": string }\ncorrectIndex is 0-3. explanation is 1-2 sentences of interesting context. category is one of: Grand Slams, Records, Legends, Rules, History, Players`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "trivia_question",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correctIndex: { type: "number" },
                  explanation: { type: "string" },
                  category: { type: "string" },
                },
                required: ["question", "options", "correctIndex", "explanation", "category"],
                additionalProperties: false,
              },
            },
          },
        });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === 'string' ? rawContent : null;
        if (!content) throw new Error("Failed to generate trivia question");
        return JSON.parse(content) as { question: string; options: string[]; correctIndex: number; explanation: string; category: string };
      }),
  }),
  analytics: router({
    log: publicProcedure
      .input(z.object({
        guestId: z.string(),
        event: z.string(),
        page: z.string().optional(),
        label: z.string().optional(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // fire-and-forget — never blocks the user
        logAnalyticsEvent(input).catch(() => {});
        return { ok: true };
      }),
    dashboard: publicProcedure.query(async () => {
      const [features, topPhrases, hourly, daily, dailyVoiceAid, categories, totalSessions, totalEvents] =
        await Promise.all([
          getEventCounts(),
          getTopPhrases(20),
          getHourlyActivity(),
          getDailyActivity(30),
          getDailyVoiceAid(30),
          getCategoryBreakdown(),
          getTotalSessions(),
          getTotalEvents(),
        ]);
      return { features, topPhrases, hourly, daily, dailyVoiceAid, categories, totalSessions, totalEvents };
    }),
  }),
});
export type AppRouter = typeof appRouter;
