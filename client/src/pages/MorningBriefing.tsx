import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function MorningBriefing() {
  const [, navigate] = useLocation();
  const { data, isLoading, error } = trpc.briefing.daily.useQuery(undefined, {
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="px-5 py-6 space-y-5 fade-in">
        <Skeleton className="h-10 w-3/4 rounded-xl" style={{ background: "#162347" }} />
        <Skeleton className="h-32 w-full rounded-2xl" style={{ background: "#162347" }} />
        <Skeleton className="h-40 w-full rounded-2xl" style={{ background: "#162347" }} />
        <Skeleton className="h-40 w-full rounded-2xl" style={{ background: "#162347" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-5 py-10 text-center fade-in">
        <p className="text-2xl mb-2">🎾</p>
        <p className="text-lg" style={{ color: "#8899BB" }}>
          Stan is warming up... check your connection and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 space-y-5 fade-in max-w-2xl mx-auto">
      {/* Greeting Header */}
      <div className="text-center py-2">
        <p className="text-base font-medium mb-1" style={{ color: "#8899BB" }}>{data.date}</p>
        <h1
          className="text-4xl font-bold"
          style={{ color: "#E8651A", fontFamily: "'Playfair Display', serif" }}
        >
          {data.greeting}, Steve!
        </h1>
      </div>

      {/* Stan's Message */}
      <div
        className="rounded-2xl p-5 slide-up"
        style={{ background: "#162347", border: "1px solid #1E2F5A" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex items-center justify-center rounded-full text-xl font-bold flex-shrink-0"
            style={{ width: 44, height: 44, background: "#E8651A", color: "white" }}
          >
            S
          </div>
          <div>
            <p className="font-bold text-base" style={{ color: "#E8651A" }}>Stan</p>
            <p className="text-xs" style={{ color: "#8899BB" }}>Your Tennis Companion</p>
          </div>
        </div>
        <p className="text-lg leading-relaxed" style={{ color: "#FAF6F0" }}>
          {typeof data.stanMessage === 'string' ? data.stanMessage : ''}
        </p>
      </div>

      {/* Bible Prayer */}
      <div
        className="rounded-2xl p-5 slide-up"
        style={{
          background: "linear-gradient(135deg, #0D2240 0%, #162347 100%)",
          border: "1px solid #2A3F6A",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">✝️</span>
          <h2 className="text-xl font-bold" style={{ color: "#FAF6F0" }}>Morning Prayer</h2>
        </div>

        {/* Prayer */}
        <p className="text-base italic leading-relaxed mb-4" style={{ color: "#D4C9B8" }}>
          "{data.bible.prayer}"
        </p>

        {/* Verse */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(232,101,26,0.08)", border: "1px solid rgba(232,101,26,0.2)" }}
        >
          <p className="text-base leading-relaxed mb-2" style={{ color: "#FAF6F0" }}>
            "{data.bible.verse}"
          </p>
          <p className="text-sm font-semibold" style={{ color: "#E8651A" }}>
            — {data.bible.reference}
          </p>
        </div>
      </div>

      {/* ATP Matches */}
      <MatchSection
        title="ATP Today"
        emoji="🎾"
        matches={data.matches.atp}
        tour="ATP"
        onNavigate={() => navigate("/tournaments")}
      />

      {/* WTA Matches */}
      <MatchSection
        title="WTA Today"
        emoji="🏆"
        matches={data.matches.wta}
        tour="WTA"
        onNavigate={() => navigate("/tournaments")}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        <button
          onClick={() => navigate("/chat")}
          className="rounded-2xl p-4 text-left transition-all active:scale-95"
          style={{ background: "#162347", border: "1px solid #1E2F5A" }}
        >
          <p className="text-2xl mb-1">💬</p>
          <p className="font-bold text-base" style={{ color: "#FAF6F0" }}>Chat with Stan</p>
          <p className="text-sm" style={{ color: "#8899BB" }}>Ask anything tennis</p>
        </button>
        <button
          onClick={() => navigate("/picks")}
          className="rounded-2xl p-4 text-left transition-all active:scale-95"
          style={{ background: "#162347", border: "1px solid #1E2F5A" }}
        >
          <p className="text-2xl mb-1">⚔️</p>
          <p className="font-bold text-base" style={{ color: "#FAF6F0" }}>Pick Battle</p>
          <p className="text-sm" style={{ color: "#8899BB" }}>Stan vs Steve</p>
        </button>
      </div>
    </div>
  );
}

function MatchSection({
  title,
  emoji,
  matches,
  onNavigate,
}: {
  title: string;
  emoji: string;
  matches: string[];
  tour: string;
  onNavigate: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-5 slide-up"
      style={{ background: "#162347", border: "1px solid #1E2F5A" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h2 className="text-xl font-bold" style={{ color: "#FAF6F0" }}>{title}</h2>
        </div>
        <button
          onClick={onNavigate}
          className="text-sm font-semibold px-3 py-1 rounded-lg transition-all"
          style={{ color: "#E8651A", background: "rgba(232,101,26,0.1)" }}
        >
          Full Draw →
        </button>
      </div>
      <div className="space-y-2">
        {matches.length === 0 ? (
          <p className="text-base" style={{ color: "#8899BB" }}>No matches scheduled today.</p>
        ) : (
          matches.map((match, i) => (
            <div
              key={i}
              className="rounded-xl px-4 py-3 text-base"
              style={{ background: "#0D1B3E", color: "#FAF6F0" }}
            >
              {match}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
