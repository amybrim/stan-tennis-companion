import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useGuestSession } from "@/contexts/GuestSessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Battle {
  id: number;
  matchDescription: string;
  player1: string;
  player2: string;
  stanPick: string;
  stevePick: string | null;
  actualWinner: string | null;
  stanCorrect: boolean | null;
  steveCorrect: boolean | null;
  tournament: string | null;
  round: string | null;
  createdAt: Date;
}

export default function PickBattle() {
  const { token } = useGuestSession();
  const { track } = useAnalytics();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    track("page_view", undefined, "/picks");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [newBattle, setNewBattle] = useState<{
    id?: number;
    player1: string;
    player2: string;
    stanPick: string;
    stanReasoning: string;
    tournament: string;
    round: string;
    matchDescription: string;
  } | null>(null);
  const [resolveId, setResolveId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const battlesQuery = trpc.picks.list.useQuery({ sessionToken: token }, { enabled: !!token });
  const scoreQuery = trpc.picks.score.useQuery({ sessionToken: token }, { enabled: !!token });

  const generateMutation = trpc.picks.generate.useMutation({
    onSuccess: (data) => {
      setNewBattle(data as typeof newBattle);
      setGenerating(false);
      utils.picks.list.invalidate();
    },
    onError: () => {
      toast.error("Stan couldn't generate a pick right now. Try again!");
      setGenerating(false);
    },
  });

  const submitSteveMutation = trpc.picks.submitSteve.useMutation({
    onSuccess: (_, variables) => {
      track("showdown_pick_made", String((variables as {stevePick?: string}).stevePick ?? ""), "/picks");
      toast.success("Your pick is in! Stan is watching...");
      utils.picks.list.invalidate();
      setNewBattle(null);
    },
  });

  const resolveMutation = trpc.picks.resolve.useMutation({
    onSuccess: () => {
      toast.success("Result recorded!");
      utils.picks.list.invalidate();
      utils.picks.score.invalidate();
      setResolveId(null);
    },
  });

  const battles: Battle[] = (battlesQuery.data ?? []) as Battle[];
  const score = scoreQuery.data ?? { stanWins: 0, steveWins: 0, total: 0 };

  const handleGenerate = () => {
    setGenerating(true);
    setNewBattle(null);
    generateMutation.mutate({ sessionToken: token });
  };

  return (
    <div className="px-5 py-6 fade-in max-w-2xl mx-auto">
      <h1
        className="text-3xl font-bold mb-2"
        style={{ color: "#FAF6F0", fontFamily: "'Playfair Display', serif" }}
      >
        Pick Battle
      </h1>
      <p className="text-base mb-5" style={{ color: "#8899BB" }}>Stan vs Steve — who knows tennis better?</p>

      {/* Scoreboard */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: "#162347", border: "1px solid #1E2F5A" }}
      >
        <h2 className="text-lg font-bold mb-4 text-center" style={{ color: "#8899BB" }}>
          All-Time Record ({score.total} picks)
        </h2>
        <div className="grid grid-cols-3 gap-3 items-center">
          <div className="text-center">
            <div
              className="flex items-center justify-center rounded-full text-2xl font-bold mx-auto mb-2"
              style={{ width: 56, height: 56, background: "#E8651A", color: "white" }}
            >
              S
            </div>
            <p className="text-3xl font-bold" style={{ color: "#FAF6F0" }}>{score.stanWins}</p>
            <p className="text-sm" style={{ color: "#8899BB" }}>Stan</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: "#8899BB" }}>VS</p>
          </div>
          <div className="text-center">
            <div
              className="flex items-center justify-center rounded-full text-2xl font-bold mx-auto mb-2"
              style={{ width: 56, height: 56, background: "#162347", border: "2px solid #E8651A", color: "#E8651A" }}
            >
              👤
            </div>
            <p className="text-3xl font-bold" style={{ color: "#FAF6F0" }}>{score.steveWins}</p>
            <p className="text-sm" style={{ color: "#8899BB" }}>Steve</p>
          </div>
        </div>
      </div>

      {/* Generate New Pick */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full stan-orange-btn rounded-2xl mb-6 flex items-center justify-center gap-2"
        style={{ fontSize: "1.1rem", padding: "1rem" }}
      >
        {generating ? "⏳ Stan is thinking..." : "⚔️ New Pick Battle"}
      </button>

      {/* New Battle Card */}
      {generating && (
        <div className="space-y-3 mb-6">
          <Skeleton className="h-48 w-full rounded-2xl" style={{ background: "#162347" }} />
        </div>
      )}

      {newBattle && !generating && (
        <div
          className="rounded-2xl p-5 mb-6 slide-up"
          style={{ background: "#162347", border: "2px solid #E8651A" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚔️</span>
            <h3 className="text-xl font-bold" style={{ color: "#E8651A" }}>New Battle!</h3>
          </div>
          <p className="text-base mb-1" style={{ color: "#8899BB" }}>
            {newBattle.tournament} · {newBattle.round}
          </p>
          <p className="text-xl font-bold mb-4" style={{ color: "#FAF6F0" }}>
            {newBattle.player1} vs {newBattle.player2}
          </p>

          {/* Stan's Pick */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: "rgba(232,101,26,0.1)", border: "1px solid rgba(232,101,26,0.3)" }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: "#E8651A" }}>Stan picks:</p>
            <p className="text-lg font-bold mb-2" style={{ color: "#FAF6F0" }}>{newBattle.stanPick}</p>
            <p className="text-sm italic" style={{ color: "#8899BB" }}>"{newBattle.stanReasoning}"</p>
          </div>

          {/* Steve's Pick */}
          <p className="text-base font-semibold mb-3" style={{ color: "#FAF6F0" }}>
            Who do you pick, Steve?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[newBattle.player1, newBattle.player2].map((player) => (
              <button
                key={player}
                onClick={() => newBattle.id && submitSteveMutation.mutate({ id: newBattle.id, stevePick: player })}
                className="rounded-xl py-4 px-3 text-base font-bold transition-all active:scale-95"
                style={{
                  background: "#0D1B3E",
                  color: "#FAF6F0",
                  border: "2px solid #1E2F5A",
                }}
              >
                {player}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Battle History */}
      {battles.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#FAF6F0" }}>Battle History</h2>
          <div className="space-y-3">
            {battles.map((battle) => (
              <BattleCard
                key={battle.id}
                battle={battle}
                onResolve={(id) => setResolveId(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveId !== null && (() => {
        const battle = battles.find((b) => b.id === resolveId);
        if (!battle) return null;
        return (
          <div
            className="fixed inset-0 flex items-end justify-center z-50 p-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setResolveId(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6 slide-up"
              style={{ background: "#162347", border: "1px solid #1E2F5A" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-2" style={{ color: "#FAF6F0" }}>Who won?</h3>
              <p className="text-base mb-4" style={{ color: "#8899BB" }}>
                {battle.player1} vs {battle.player2}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[battle.player1, battle.player2].map((player) => (
                  <button
                    key={player}
                    onClick={() => resolveMutation.mutate({ id: resolveId, actualWinner: player })}
                    className="rounded-xl py-4 text-base font-bold transition-all active:scale-95"
                    style={{ background: "#E8651A", color: "white" }}
                  >
                    {player}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setResolveId(null)}
                className="w-full mt-3 py-3 text-base rounded-xl"
                style={{ color: "#8899BB" }}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function BattleCard({ battle, onResolve }: { battle: Battle; onResolve: (id: number) => void }) {
  const isResolved = battle.actualWinner !== null;
  const isPending = battle.stevePick === null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "#162347",
        border: `1px solid ${isResolved ? (battle.stanCorrect ? "rgba(76,175,80,0.3)" : "rgba(232,101,26,0.3)") : "#1E2F5A"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm" style={{ color: "#8899BB" }}>
            {battle.tournament} · {battle.round}
          </p>
          <p className="text-base font-bold" style={{ color: "#FAF6F0" }}>
            {battle.player1} vs {battle.player2}
          </p>
        </div>
        {isResolved ? (
          <span
            className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
            style={{
              background: "rgba(76,175,80,0.15)",
              color: "#4CAF50",
            }}
          >
            ✓ Done
          </span>
        ) : isPending ? (
          <span
            className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
            style={{ background: "rgba(232,101,26,0.15)", color: "#E8651A" }}
          >
            Your pick?
          </span>
        ) : (
          <button
            onClick={() => onResolve(battle.id)}
            className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 transition-all"
            style={{ background: "rgba(232,101,26,0.15)", color: "#E8651A" }}
          >
            Enter result
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1 rounded-xl p-3" style={{ background: "#0D1B3E" }}>
          <p className="text-xs mb-1" style={{ color: "#8899BB" }}>Stan picked</p>
          <p className="text-sm font-bold" style={{ color: isResolved ? (battle.stanCorrect ? "#4CAF50" : "#FF5252") : "#E8651A" }}>
            {isResolved && (battle.stanCorrect ? "✓ " : "✗ ")}{battle.stanPick}
          </p>
        </div>
        <div className="flex-1 rounded-xl p-3" style={{ background: "#0D1B3E" }}>
          <p className="text-xs mb-1" style={{ color: "#8899BB" }}>Steve picked</p>
          <p className="text-sm font-bold" style={{ color: isResolved ? (battle.steveCorrect ? "#4CAF50" : "#FF5252") : "#FAF6F0" }}>
            {battle.stevePick
              ? (isResolved ? (battle.steveCorrect ? "✓ " : "✗ ") : "") + battle.stevePick
              : "—"}
          </p>
        </div>
      </div>

      {isResolved && (
        <p className="text-sm mt-2 text-center" style={{ color: "#8899BB" }}>
          Winner: <span style={{ color: "#FAF6F0", fontWeight: 700 }}>{battle.actualWinner}</span>
        </p>
      )}
    </div>
  );
}
