import { useState } from "react";
import { trpc } from "@/lib/trpc";

type Difficulty = "easy" | "medium" | "hard";

type TriviaQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "#4CAF50",
  medium: "#E8651A",
  hard: "#E84040",
};

const CATEGORY_ICONS: Record<string, string> = {
  "Grand Slams": "🏆",
  Records: "📊",
  Legends: "⭐",
  Rules: "📋",
  History: "📜",
  Players: "🎾",
};

export default function TennisTriva() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [question, setQuestion] = useState<TriviaQuestion | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);

  const triviaQuery = trpc.trivia.question.useMutation({
    onSuccess: (data) => {
      setQuestion(data);
      setSelectedIndex(null);
      setRevealed(false);
    },
  });

  const handleAnswer = (index: number) => {
    if (revealed) return;
    setSelectedIndex(index);
    setRevealed(true);
    const isCorrect = index === question?.correctIndex;
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    setStreak((s) => (isCorrect ? s + 1 : 0));
  };

  const handleNext = () => {
    triviaQuery.mutate({ difficulty });
  };

  const getOptionStyle = (index: number) => {
    if (!revealed) {
      return {
        background: selectedIndex === index ? "rgba(232,101,26,0.15)" : "#162347",
        border: `2px solid ${selectedIndex === index ? "#E8651A" : "#1E2F5A"}`,
        color: "#FAF6F0",
      };
    }
    if (index === question?.correctIndex) {
      return {
        background: "rgba(76,175,80,0.15)",
        border: "2px solid #4CAF50",
        color: "#FAF6F0",
      };
    }
    if (index === selectedIndex) {
      return {
        background: "rgba(232,64,64,0.15)",
        border: "2px solid #E84040",
        color: "#FAF6F0",
      };
    }
    return {
      background: "#0D1B3E",
      border: "2px solid #1E2F5A",
      color: "#8899BB",
    };
  };

  const accuracy =
    score.total > 0 ? Math.round((score.correct / score.total) * 100) : null;

  return (
    <div className="px-5 py-6 fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1
          className="text-3xl font-bold"
          style={{ color: "#FAF6F0", fontFamily: "'Playfair Display', serif" }}
        >
          Tennis Trivia
        </h1>
        {score.total > 0 && (
          <div className="text-right">
            <p className="text-sm font-semibold" style={{ color: "#8899BB" }}>
              {score.correct}/{score.total} correct
            </p>
            {accuracy !== null && (
              <p className="text-xs" style={{ color: "#E8651A" }}>
                {accuracy}% accuracy
              </p>
            )}
          </div>
        )}
      </div>

      {/* Streak Banner */}
      {streak >= 2 && (
        <div
          className="rounded-2xl px-5 py-3 mb-5 flex items-center gap-3 slide-up"
          style={{ background: "rgba(232,101,26,0.12)", border: "1px solid rgba(232,101,26,0.3)" }}
        >
          <span className="text-2xl">🔥</span>
          <p className="font-bold text-base" style={{ color: "#E8651A" }}>
            {streak} question streak! Stan is impressed, Steve!
          </p>
        </div>
      )}

      {/* Difficulty Selector */}
      <div
        className="flex rounded-2xl p-1 mb-6"
        style={{ background: "#162347" }}
      >
        {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => setDifficulty(d)}
            className="flex-1 py-3 rounded-xl text-base font-semibold transition-all capitalize"
            style={{
              background: difficulty === d ? DIFFICULTY_COLORS[d] : "transparent",
              color: difficulty === d ? "white" : "#8899BB",
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* No question yet — Start prompt */}
      {!question && !triviaQuery.isPending && (
        <div
          className="rounded-2xl p-8 text-center slide-up"
          style={{ background: "#162347", border: "1px solid #1E2F5A" }}
        >
          <p className="text-5xl mb-4">🎾</p>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#FAF6F0" }}>
            Ready to test your tennis knowledge, Steve?
          </h2>
          <p className="text-base mb-6" style={{ color: "#8899BB" }}>
            Stan has questions about Grand Slams, legends, records, and more.
          </p>
          <button
            onClick={handleNext}
            className="rounded-2xl font-bold text-lg px-8 py-4 transition-all active:scale-95"
            style={{ background: "#E8651A", color: "white" }}
          >
            Start Trivia!
          </button>
        </div>
      )}

      {/* Loading */}
      {triviaQuery.isPending && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "#162347", border: "1px solid #1E2F5A" }}
        >
          <p className="text-4xl mb-3 animate-bounce">🎾</p>
          <p className="text-lg font-semibold" style={{ color: "#8899BB" }}>
            Stan is thinking up a question...
          </p>
        </div>
      )}

      {/* Error */}
      {triviaQuery.isError && (
        <div className="rounded-2xl p-6 text-center" style={{ background: "#162347" }}>
          <p className="text-base mb-4" style={{ color: "#8899BB" }}>
            Stan had a brain cramp. Try again!
          </p>
          <button
            onClick={handleNext}
            className="rounded-xl font-bold px-6 py-3 transition-all active:scale-95"
            style={{ background: "#E8651A", color: "white" }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Question Card */}
      {question && !triviaQuery.isPending && (
        <div className="space-y-4 slide-up">
          {/* Category + Difficulty Badge */}
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold px-3 py-1 rounded-full"
              style={{
                background: `${DIFFICULTY_COLORS[difficulty]}22`,
                color: DIFFICULTY_COLORS[difficulty],
              }}
            >
              {difficulty.toUpperCase()}
            </span>
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: "#162347", color: "#8899BB" }}
            >
              {CATEGORY_ICONS[question.category] ?? "🎾"} {question.category}
            </span>
          </div>

          {/* Question */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "#162347", border: "1px solid #1E2F5A" }}
          >
            <p className="text-xl font-bold leading-snug" style={{ color: "#FAF6F0" }}>
              {question.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={revealed}
                className="w-full text-left rounded-2xl px-5 py-4 transition-all active:scale-[0.98] flex items-center gap-4"
                style={getOptionStyle(i)}
              >
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm"
                  style={{
                    width: 32,
                    height: 32,
                    background:
                      revealed && i === question.correctIndex
                        ? "#4CAF50"
                        : revealed && i === selectedIndex
                        ? "#E84040"
                        : "rgba(255,255,255,0.08)",
                    color: "white",
                  }}
                >
                  {revealed && i === question.correctIndex
                    ? "✓"
                    : revealed && i === selectedIndex
                    ? "✗"
                    : String.fromCharCode(65 + i)}
                </span>
                <span className="text-base font-medium">{option}</span>
              </button>
            ))}
          </div>

          {/* Explanation (shown after answer) */}
          {revealed && (
            <div
              className="rounded-2xl p-5 slide-up"
              style={{
                background:
                  selectedIndex === question.correctIndex
                    ? "rgba(76,175,80,0.08)"
                    : "rgba(232,64,64,0.08)",
                border: `1px solid ${
                  selectedIndex === question.correctIndex
                    ? "rgba(76,175,80,0.3)"
                    : "rgba(232,64,64,0.3)"
                }`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">
                  {selectedIndex === question.correctIndex ? "🎉" : "💡"}
                </span>
                <p
                  className="font-bold text-base"
                  style={{
                    color:
                      selectedIndex === question.correctIndex ? "#4CAF50" : "#E84040",
                  }}
                >
                  {selectedIndex === question.correctIndex
                    ? "Correct! Well done, Steve!"
                    : "Not quite — here's the answer:"}
                </p>
              </div>
              <p className="text-base leading-relaxed" style={{ color: "#D4C9B8" }}>
                {question.explanation}
              </p>
            </div>
          )}

          {/* Next Question Button */}
          {revealed && (
            <button
              onClick={handleNext}
              className="w-full rounded-2xl font-bold text-lg py-4 transition-all active:scale-95 slide-up"
              style={{ background: "#E8651A", color: "white" }}
            >
              Next Question →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
