import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

type TourFilter = "BOTH" | "ATP" | "WTA";

const STATUS_COLORS: Record<string, string> = {
  live: "#4CAF50",
  upcoming: "#E8651A",
  completed: "#8899BB",
};

const SURFACE_ICONS: Record<string, string> = {
  Clay: "🟤",
  Grass: "🟢",
  Hard: "🔵",
  Indoor: "🏢",
};

export default function Tournaments() {
  const [filter, setFilter] = useState<TourFilter>("BOTH");
  const [, navigate] = useLocation();

  const { data, isLoading, error } = trpc.tournaments.list.useQuery(
    { tour: filter },
    { staleTime: 1000 * 60 * 15 }
  );

  const tournaments = data?.tournaments ?? [];

  return (
    <div className="px-5 py-6 fade-in max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-5" style={{ color: "#FAF6F0", fontFamily: "'Playfair Display', serif" }}>
        Tournaments
      </h1>

      {/* Tour Filter */}
      <div
        className="flex rounded-2xl p-1 mb-6"
        style={{ background: "#162347" }}
      >
        {(["BOTH", "ATP", "WTA"] as TourFilter[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="flex-1 py-3 rounded-xl text-base font-semibold transition-all"
            style={{
              background: filter === t ? "#E8651A" : "transparent",
              color: filter === t ? "white" : "#8899BB",
            }}
          >
            {t === "BOTH" ? "All Tours" : t}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" style={{ background: "#162347" }} />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-10">
          <p className="text-lg" style={{ color: "#8899BB" }}>
            Stan couldn't load tournaments. Try again in a moment.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {(tournaments as Array<{name:string;tour:string;location:string;surface:string;dates:string;status:string;prizePool:string;topSeeds:string[]}>).map((t, i) => (
          <button
            key={i}
            onClick={() => navigate(`/tournaments/${encodeURIComponent(t.name)}/${t.tour}`)}
            className="w-full text-left rounded-2xl p-5 transition-all active:scale-[0.98] slide-up"
            style={{ background: "#162347", border: "1px solid #1E2F5A" }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: t.tour === "ATP" ? "rgba(232,101,26,0.15)" : "rgba(100,160,255,0.15)",
                      color: t.tour === "ATP" ? "#E8651A" : "#64A0FF",
                    }}
                  >
                    {t.tour}
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${STATUS_COLORS[t.status] ?? "#8899BB"}22`,
                      color: STATUS_COLORS[t.status] ?? "#8899BB",
                    }}
                  >
                    {t.status === "live" ? "🔴 LIVE" : t.status === "upcoming" ? "📅 Upcoming" : "✓ Completed"}
                  </span>
                </div>
                <h3 className="text-xl font-bold" style={{ color: "#FAF6F0" }}>{t.name}</h3>
                <p className="text-base" style={{ color: "#8899BB" }}>
                  {SURFACE_ICONS[t.surface] ?? "🎾"} {t.surface} · {t.location}
                </p>
              </div>
              <span className="text-2xl">→</span>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "#8899BB" }}>{t.dates}</p>
              <p className="text-sm font-semibold" style={{ color: "#E8651A" }}>{t.prizePool}</p>
            </div>

            {t.topSeeds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(t.topSeeds as string[]).slice(0, 4).map((seed: string, j: number) => (
                  <span
                    key={j}
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ background: "#0D1B3E", color: "#FAF6F0" }}
                  >
                    {seed}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {!isLoading && tournaments.length === 0 && !error && (
        <div className="text-center py-10">
          <p className="text-4xl mb-3">🎾</p>
          <p className="text-lg" style={{ color: "#8899BB" }}>No tournaments found right now.</p>
        </div>
      )}
    </div>
  );
}
