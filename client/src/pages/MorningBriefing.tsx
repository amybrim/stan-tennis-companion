import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

// ─── TTS Hook ─────────────────────────────────────────────────────────────────
function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string, id: string) => {
    // If already speaking this id, stop
    if (activeId === id && speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setActiveId(null);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Prefer a warm English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.toLowerCase().includes("daniel") ||
          v.name.toLowerCase().includes("alex") ||
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("google us") ||
          v.name.toLowerCase().includes("microsoft"))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => {
      setSpeaking(true);
      setActiveId(id);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setActiveId(null);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setActiveId(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [activeId, speaking]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setActiveId(null);
  }, []);

  return { speak, stop, speaking, activeId };
}

// ─── Audio Button Component ────────────────────────────────────────────────────
function AudioButton({
  text,
  id,
  label,
  size = "sm",
  activeId,
  speaking,
  onSpeak,
}: {
  text: string;
  id: string;
  label?: string;
  size?: "sm" | "lg";
  activeId: string | null;
  speaking: boolean;
  onSpeak: (text: string, id: string) => void;
}) {
  const isActive = activeId === id && speaking;
  const isLg = size === "lg";

  return (
    <button
      onClick={() => onSpeak(text, id)}
      title={isActive ? "Stop listening" : label ?? "Listen"}
      aria-label={isActive ? "Stop audio" : label ?? "Listen to this section"}
      className="flex items-center gap-2 rounded-xl font-semibold transition-all active:scale-95"
      style={{
        background: isActive ? "rgba(232,101,26,0.2)" : "rgba(232,101,26,0.1)",
        border: `1px solid ${isActive ? "#E8651A" : "rgba(232,101,26,0.3)"}`,
        color: isActive ? "#E8651A" : "#C4541A",
        padding: isLg ? "0.75rem 1.5rem" : "0.4rem 0.9rem",
        fontSize: isLg ? "1rem" : "0.85rem",
        minHeight: isLg ? 48 : 36,
      }}
    >
      {isActive ? (
        <>
          <SpeakingWave />
          {isLg && <span>Stop</span>}
        </>
      ) : (
        <>
          <svg
            width={isLg ? 20 : 16}
            height={isLg ? 20 : 16}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
          {isLg && <span>{label ?? "Listen"}</span>}
        </>
      )}
    </button>
  );
}

// Animated sound wave for active state
function SpeakingWave() {
  return (
    <span className="flex items-end gap-0.5" style={{ height: 16 }}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 3,
            borderRadius: 2,
            background: "#E8651A",
            animation: `wave-bar 0.8s ease-in-out ${i * 0.15}s infinite alternate`,
            height: i === 2 ? 14 : 8,
          }}
        />
      ))}
      <style>{`
        @keyframes wave-bar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </span>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MorningBriefing() {
  const [, navigate] = useLocation();
  const { speak, stop, speaking, activeId } = useSpeech();
  const { track } = useAnalytics();

  useEffect(() => {
    track("morning_briefing_opened", undefined, "/morning");
    track("page_view", undefined, "/morning");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, error } = trpc.briefing.daily.useQuery(undefined, {
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });

  // Build the full briefing text for "Listen to Full Briefing"
  const fullBriefingText = data
    ? [
        `${data.greeting}, Steve!`,
        typeof data.stanMessage === "string" ? data.stanMessage : "",
        `Morning Prayer. ${data.bible.prayer}`,
        `Today's verse: ${data.bible.verse} — ${data.bible.reference}`,
        `ATP Tennis Today. ${data.matches.atp.length > 0 ? data.matches.atp.join(". ") : "No ATP matches scheduled today."}`,
        `WTA Tennis Today. ${data.matches.wta.length > 0 ? data.matches.wta.join(". ") : "No WTA matches scheduled today."}`,
      ]
        .filter(Boolean)
        .join(" ... ")
    : "";

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
        <p className="text-base font-medium mb-1" style={{ color: "#8899BB" }}>
          {data.date}
        </p>
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: "#E8651A", fontFamily: "'Playfair Display', serif" }}
        >
          {data.greeting}, Steve!
        </h1>

        {/* Master "Listen to Full Briefing" button */}
        <button
          onClick={() =>
            speaking && activeId === "full"
              ? stop()
              : speak(fullBriefingText, "full")
          }
          className="inline-flex items-center gap-2 rounded-2xl font-bold transition-all active:scale-95"
          style={{
            background: speaking && activeId === "full" ? "#E8651A" : "rgba(232,101,26,0.12)",
            border: "2px solid #E8651A",
            color: speaking && activeId === "full" ? "white" : "#E8651A",
            padding: "0.75rem 1.75rem",
            fontSize: "1rem",
            minHeight: 52,
          }}
        >
          {speaking && activeId === "full" ? (
            <>
              <SpeakingWave />
              <span>Stop Briefing</span>
            </>
          ) : (
            <>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <span>Listen to Full Briefing</span>
            </>
          )}
        </button>
      </div>

      {/* Stan's Message */}
      <div
        className="rounded-2xl p-5 slide-up"
        style={{ background: "#162347", border: "1px solid #1E2F5A" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full text-xl font-bold flex-shrink-0"
              style={{ width: 44, height: 44, background: "#E8651A", color: "white" }}
            >
              S
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: "#E8651A" }}>
                Stan
              </p>
              <p className="text-xs" style={{ color: "#8899BB" }}>
                Your Tennis Companion
              </p>
            </div>
          </div>
          <AudioButton
            text={typeof data.stanMessage === "string" ? data.stanMessage : ""}
            id="stan-message"
            label="Listen"
            activeId={activeId}
            speaking={speaking}
            onSpeak={speak}
          />
        </div>
        <p className="text-lg leading-relaxed" style={{ color: "#FAF6F0" }}>
          {typeof data.stanMessage === "string" ? data.stanMessage : ""}
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✝️</span>
            <h2 className="text-xl font-bold" style={{ color: "#FAF6F0" }}>
              Morning Prayer
            </h2>
          </div>
          <AudioButton
            text={`Morning Prayer. ${data.bible.prayer} ... Today's verse: ${data.bible.verse} — ${data.bible.reference}`}
            id="bible-prayer"
            label="Listen"
            activeId={activeId}
            speaking={speaking}
            onSpeak={speak}
          />
        </div>

        {/* Prayer */}
        <p
          className="text-base italic leading-relaxed mb-4"
          style={{ color: "#D4C9B8" }}
        >
          "{data.bible.prayer}"
        </p>

        {/* Verse */}
        <div
          className="rounded-xl p-4"
          style={{
            background: "rgba(232,101,26,0.08)",
            border: "1px solid rgba(232,101,26,0.2)",
          }}
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
        sectionId="atp-matches"
        activeId={activeId}
        speaking={speaking}
        onSpeak={speak}
        onNavigate={() => navigate("/tournaments")}
      />

      {/* WTA Matches */}
      <MatchSection
        title="WTA Today"
        emoji="🏆"
        matches={data.matches.wta}
        sectionId="wta-matches"
        activeId={activeId}
        speaking={speaking}
        onSpeak={speak}
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
          <p className="font-bold text-base" style={{ color: "#FAF6F0" }}>
            Chat with Stan
          </p>
          <p className="text-sm" style={{ color: "#8899BB" }}>
            Ask anything tennis
          </p>
        </button>
        <button
          onClick={() => navigate("/picks")}
          className="rounded-2xl p-4 text-left transition-all active:scale-95"
          style={{ background: "#162347", border: "1px solid #1E2F5A" }}
        >
          <p className="text-2xl mb-1">⚔️</p>
          <p className="font-bold text-base" style={{ color: "#FAF6F0" }}>
            Pick Battle
          </p>
          <p className="text-sm" style={{ color: "#8899BB" }}>
            Stan vs Steve
          </p>
        </button>
      </div>
    </div>
  );
}

// ─── Match Section ─────────────────────────────────────────────────────────────
function MatchSection({
  title,
  emoji,
  matches,
  sectionId,
  activeId,
  speaking,
  onSpeak,
  onNavigate,
}: {
  title: string;
  emoji: string;
  matches: string[];
  sectionId: string;
  activeId: string | null;
  speaking: boolean;
  onSpeak: (text: string, id: string) => void;
  onNavigate: () => void;
}) {
  const speakText =
    matches.length > 0
      ? `${title}. ${matches.join(". ")}`
      : `${title}. No matches scheduled today.`;

  return (
    <div
      className="rounded-2xl p-5 slide-up"
      style={{ background: "#162347", border: "1px solid #1E2F5A" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h2 className="text-xl font-bold" style={{ color: "#FAF6F0" }}>
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <AudioButton
            text={speakText}
            id={sectionId}
            activeId={activeId}
            speaking={speaking}
            onSpeak={onSpeak}
          />
          <button
            onClick={onNavigate}
            className="text-sm font-semibold px-3 py-1 rounded-lg transition-all"
            style={{ color: "#E8651A", background: "rgba(232,101,26,0.1)" }}
          >
            Full Draw →
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {matches.length === 0 ? (
          <p className="text-base" style={{ color: "#8899BB" }}>
            No matches scheduled today.
          </p>
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
