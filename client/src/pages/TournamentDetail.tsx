import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

interface Match {
  player1: string;
  player2: string;
  score: string;
  winner: string;
}

interface DrawRound {
  round: string;
  matches: Match[];
}

interface RankingEntry {
  rank: number;
  player: string;
  points: number;
  country: string;
}

export default function TournamentDetail() {
  const params = useParams<{ name: string; tour: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"draw" | "rankings">("draw");

  const name = decodeURIComponent(params.name ?? "");
  const tour = params.tour ?? "ATP";

  const { data, isLoading } = trpc.tournaments.detail.useQuery(
    { name, tour },
    { staleTime: 1000 * 60 * 10 }
  );

  const draw: DrawRound[] = (data?.draw as DrawRound[]) ?? [];
  const rankings: RankingEntry[] = (data?.rankings as RankingEntry[]) ?? [];

  return (
    <div className="px-5 py-6 fade-in max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate("/tournaments")}
        className="flex items-center gap-2 mb-5 text-base font-semibold transition-all"
        style={{ color: "#E8651A" }}
      >
        ← Back to Tournaments
      </button>

      <div className="mb-5">
        <span
          className="text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block"
          style={{
            background: tour === "ATP" ? "rgba(232,101,26,0.15)" : "rgba(100,160,255,0.15)",
            color: tour === "ATP" ? "#E8651A" : "#64A0FF",
          }}
        >
          {tour}
        </span>
        <h1
          className="text-3xl font-bold"
          style={{ color: "#FAF6F0", fontFamily: "'Playfair Display', serif" }}
        >
          {name}
        </h1>
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-2xl p-1 mb-6"
        style={{ background: "#162347" }}
      >
        <button
          onClick={() => setActiveTab("draw")}
          className="flex-1 py-3 rounded-xl text-base font-semibold transition-all"
          style={{
            background: activeTab === "draw" ? "#E8651A" : "transparent",
            color: activeTab === "draw" ? "white" : "#8899BB",
          }}
        >
          🎾 Draw
        </button>
        <button
          onClick={() => setActiveTab("rankings")}
          className="flex-1 py-3 rounded-xl text-base font-semibold transition-all"
          style={{
            background: activeTab === "rankings" ? "#E8651A" : "transparent",
            color: activeTab === "rankings" ? "white" : "#8899BB",
          }}
        >
          🏆 Rankings
        </button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" style={{ background: "#162347" }} />
          ))}
        </div>
      )}

      {!isLoading && activeTab === "draw" && (
        <div className="space-y-5">
          {draw.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg" style={{ color: "#8899BB" }}>Draw not available yet.</p>
            </div>
          ) : (
            draw.map((round, i) => (
              <div key={i} className="slide-up">
                <h3
                  className="text-lg font-bold mb-3 px-1"
                  style={{ color: "#E8651A" }}
                >
                  {round.round}
                </h3>
                <div className="space-y-2">
                  {round.matches.map((match, j) => (
                    <div
                      key={j}
                      className="rounded-2xl p-4"
                      style={{ background: "#162347", border: "1px solid #1E2F5A" }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className="text-base font-semibold"
                              style={{
                                color: match.winner === match.player1 ? "#FAF6F0" : "#8899BB",
                                fontWeight: match.winner === match.player1 ? 700 : 400,
                              }}
                            >
                              {match.winner === match.player1 && "🏆 "}
                              {match.player1}
                            </span>
                            <span className="text-sm" style={{ color: "#8899BB" }}>
                              {match.score.split(" ")[0]}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className="text-base font-semibold"
                              style={{
                                color: match.winner === match.player2 ? "#FAF6F0" : "#8899BB",
                                fontWeight: match.winner === match.player2 ? 700 : 400,
                              }}
                            >
                              {match.winner === match.player2 && "🏆 "}
                              {match.player2}
                            </span>
                            <span className="text-sm" style={{ color: "#8899BB" }}>
                              {match.score.split(" ").slice(1).join(" ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!isLoading && activeTab === "rankings" && (
        <div className="space-y-2">
          {rankings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg" style={{ color: "#8899BB" }}>Rankings not available.</p>
            </div>
          ) : (
            rankings.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl px-4 py-3 slide-up"
                style={{
                  background: i < 3 ? "rgba(232,101,26,0.08)" : "#162347",
                  border: `1px solid ${i < 3 ? "rgba(232,101,26,0.2)" : "#1E2F5A"}`,
                }}
              >
                <span
                  className="text-xl font-bold flex-shrink-0"
                  style={{
                    color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "#8899BB",
                    minWidth: 32,
                  }}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${entry.rank}`}
                </span>
                <div className="flex-1">
                  <p className="text-base font-semibold" style={{ color: "#FAF6F0" }}>{entry.player}</p>
                  <p className="text-sm" style={{ color: "#8899BB" }}>{entry.country}</p>
                </div>
                <span className="text-base font-bold" style={{ color: "#E8651A" }}>
                  {entry.points.toLocaleString()} pts
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
