import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAnalytics } from "@/hooks/useAnalytics";

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

type Tournament = {
  name: string;
  tour: string;
  location: string;
  surface: string;
  dates: string;
  status: string;
  prizePool: string;
  topSeeds: string[];
};

// Real 2025 grass-court season tournaments
const ALL_TOURNAMENTS: Tournament[] = [
  {
    name: "Wimbledon",
    tour: "ATP",
    location: "London, UK",
    surface: "Grass",
    dates: "Jun 30 – Jul 13, 2025",
    status: "upcoming",
    prizePool: "$50M",
    topSeeds: ["Jannik Sinner", "Carlos Alcaraz", "Novak Djokovic", "Alexander Zverev"],
  },
  {
    name: "Queen's Club Championships",
    tour: "ATP",
    location: "London, UK",
    surface: "Grass",
    dates: "Jun 16–22, 2025",
    status: "live",
    prizePool: "$2.96M",
    topSeeds: ["Carlos Alcaraz", "Tommy Paul", "Holger Rune", "Casper Ruud"],
  },
  {
    name: "Halle Open",
    tour: "ATP",
    location: "Halle, Germany",
    surface: "Grass",
    dates: "Jun 16–22, 2025",
    status: "live",
    prizePool: "$2.96M",
    topSeeds: ["Jannik Sinner", "Alexander Zverev", "Daniil Medvedev", "Stefanos Tsitsipas"],
  },
  {
    name: "Roland Garros",
    tour: "ATP",
    location: "Paris, France",
    surface: "Clay",
    dates: "May 25 – Jun 8, 2025",
    status: "completed",
    prizePool: "$56M",
    topSeeds: ["Carlos Alcaraz", "Jannik Sinner", "Novak Djokovic", "Casper Ruud"],
  },
  {
    name: "Australian Open",
    tour: "ATP",
    location: "Melbourne, Australia",
    surface: "Hard",
    dates: "Jan 13–26, 2025",
    status: "completed",
    prizePool: "$54.2M",
    topSeeds: ["Jannik Sinner", "Alexander Zverev", "Carlos Alcaraz", "Novak Djokovic"],
  },
  {
    name: "Wimbledon",
    tour: "WTA",
    location: "London, UK",
    surface: "Grass",
    dates: "Jun 30 – Jul 13, 2025",
    status: "upcoming",
    prizePool: "$50M",
    topSeeds: ["Aryna Sabalenka", "Iga Swiatek", "Coco Gauff", "Elena Rybakina"],
  },
  {
    name: "Berlin Open",
    tour: "WTA",
    location: "Berlin, Germany",
    surface: "Grass",
    dates: "Jun 16–22, 2025",
    status: "live",
    prizePool: "$1.75M",
    topSeeds: ["Iga Swiatek", "Aryna Sabalenka", "Coco Gauff", "Jessica Pegula"],
  },
  {
    name: "Birmingham Classic",
    tour: "WTA",
    location: "Birmingham, UK",
    surface: "Grass",
    dates: "Jun 16–22, 2025",
    status: "live",
    prizePool: "$922K",
    topSeeds: ["Elena Rybakina", "Ons Jabeur", "Maria Sakkari", "Petra Kvitova"],
  },
  {
    name: "Roland Garros",
    tour: "WTA",
    location: "Paris, France",
    surface: "Clay",
    dates: "May 25 – Jun 8, 2025",
    status: "completed",
    prizePool: "$56M",
    topSeeds: ["Iga Swiatek", "Aryna Sabalenka", "Coco Gauff", "Elena Rybakina"],
  },
  {
    name: "Australian Open",
    tour: "WTA",
    location: "Melbourne, Australia",
    surface: "Hard",
    dates: "Jan 13–26, 2025",
    status: "completed",
    prizePool: "$54.2M",
    topSeeds: ["Aryna Sabalenka", "Iga Swiatek", "Coco Gauff", "Elena Rybakina"],
  },
];

export default function Tournaments() {
  const { track } = useAnalytics();
  const [filter, setFilter] = useState<TourFilter>("BOTH");
  const [, navigate] = useLocation();

  useEffect(() => {
    track("page_view", undefined, "/tournaments");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tournaments =
    filter === "BOTH"
      ? ALL_TOURNAMENTS
      : ALL_TOURNAMENTS.filter((t) => t.tour === filter);

  // Sort: live first, then upcoming, then completed
  const sorted = [...tournaments].sort((a, b) => {
    const order = { live: 0, upcoming: 1, completed: 2 };
    return (order[a.status as keyof typeof order] ?? 3) - (order[b.status as keyof typeof order] ?? 3);
  });

  return (
    <div className="px-5 py-6 fade-in max-w-2xl mx-auto">
      <h1
        className="text-3xl font-bold mb-5"
        style={{ color: "#FAF6F0", fontFamily: "'Playfair Display', serif" }}
      >
        Tournaments
      </h1>

      {/* Tour Filter */}
      <div className="flex rounded-2xl p-1 mb-6" style={{ background: "#162347" }}>
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

      {/* Section Labels */}
      {["live", "upcoming", "completed"].map((status) => {
        const group = sorted.filter((t) => t.status === status);
        if (group.length === 0) return null;
        const labels: Record<string, string> = {
          live: "🔴 Live Now",
          upcoming: "📅 Coming Up",
          completed: "✓ Recently Completed",
        };
        return (
          <div key={status} className="mb-6">
            <h2
              className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: STATUS_COLORS[status] ?? "#8899BB" }}
            >
              {labels[status]}
            </h2>
            <div className="space-y-3">
              {group.map((t, i) => (
                <button
                  key={i}
                  onClick={() => {
                    track("tournament_viewed", `${t.name} (${t.tour})`, "/tournaments");
                    navigate(`/tournaments/${encodeURIComponent(t.name)}/${t.tour}`);
                  }}
                  className="w-full text-left rounded-2xl p-5 transition-all active:scale-[0.98] slide-up"
                  style={{ background: "#162347", border: "1px solid #1E2F5A" }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background:
                              t.tour === "ATP"
                                ? "rgba(232,101,26,0.15)"
                                : "rgba(100,160,255,0.15)",
                            color: t.tour === "ATP" ? "#E8651A" : "#64A0FF",
                          }}
                        >
                          {t.tour}
                        </span>
                        <span
                          className="text-xs font-semibold"
                          style={{ color: STATUS_COLORS[t.status] ?? "#8899BB" }}
                        >
                          {SURFACE_ICONS[t.surface] ?? "🎾"} {t.surface}
                        </span>
                      </div>
                      <h3
                        className="text-xl font-bold"
                        style={{ color: "#FAF6F0" }}
                      >
                        {t.name}
                      </h3>
                      <p className="text-sm" style={{ color: "#8899BB" }}>
                        📍 {t.location}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-base font-bold"
                        style={{ color: "#E8651A" }}
                      >
                        {t.prizePool}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#8899BB" }}>
                        {t.dates}
                      </p>
                    </div>
                  </div>

                  {t.topSeeds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {t.topSeeds.slice(0, 4).map((seed, j) => (
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
          </div>
        );
      })}
    </div>
  );
}
