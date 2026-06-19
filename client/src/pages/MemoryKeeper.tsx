import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useGuestSession } from "@/contexts/GuestSessionContext";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";

const EMOJIS = ["🎾", "🏆", "⭐", "🎉", "💪", "❤️", "📸", "🌟", "🎯", "🙏"];

export default function MemoryKeeper() {
  const { token } = useGuestSession();
  const { track } = useAnalytics();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    track("page_view", undefined, "/memories");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [authorName, setAuthorName] = useState("Steve");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [emoji, setEmoji] = useState("🎾");

  const utils = trpc.useUtils();

  const memoriesQuery = trpc.memories.list.useQuery(
    { sessionToken: token },
    { enabled: !!token }
  );

  const addMutation = trpc.memories.add.useMutation({
    onSuccess: () => {
      track("memory_added", title.slice(0, 100), "/memories");
      toast.success("Memory saved! 📸");
      setShowForm(false);
      setTitle("");
      setContent("");
      setEmoji("🎾");
      utils.memories.list.invalidate();
    },
    onError: () => toast.error("Couldn't save memory. Try again!"),
  });

  const deleteMutation = trpc.memories.delete.useMutation({
    onSuccess: () => {
      toast.success("Memory removed.");
      utils.memories.list.invalidate();
    },
  });

  const memories = memoriesQuery.data ?? [];

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please add a title and description.");
      return;
    }
    addMutation.mutate({ sessionToken: token, authorName, title, content, emoji });
  };

  return (
    <div className="px-5 py-6 fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: "#FAF6F0", fontFamily: "'Playfair Display', serif" }}
          >
            Memory Keeper
          </h1>
          <p className="text-base" style={{ color: "#8899BB" }}>Your favorite tennis moments</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="stan-orange-btn rounded-2xl"
          style={{ padding: "0.75rem 1.25rem", fontSize: "1rem" }}
        >
          {showForm ? "✕ Cancel" : "+ Add"}
        </button>
      </div>

      {/* Add Memory Form */}
      {showForm && (
        <div
          className="rounded-2xl p-5 mb-6 slide-up"
          style={{ background: "#162347", border: "2px solid #E8651A" }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: "#FAF6F0" }}>New Memory</h2>

          {/* Author */}
          <div className="mb-4">
            <label className="text-sm font-semibold block mb-2" style={{ color: "#8899BB" }}>
              Who's adding this?
            </label>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl px-4 py-3 text-base outline-none"
              style={{ background: "#0D1B3E", color: "#FAF6F0", border: "1px solid #1E2F5A" }}
            />
          </div>

          {/* Emoji Picker */}
          <div className="mb-4">
            <label className="text-sm font-semibold block mb-2" style={{ color: "#8899BB" }}>
              Pick an emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className="text-2xl rounded-xl p-2 transition-all"
                  style={{
                    background: emoji === e ? "rgba(232,101,26,0.2)" : "#0D1B3E",
                    border: `2px solid ${emoji === e ? "#E8651A" : "transparent"}`,
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="text-sm font-semibold block mb-2" style={{ color: "#8899BB" }}>
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Alcaraz wins Wimbledon!"
              className="w-full rounded-xl px-4 py-3 text-base outline-none"
              style={{ background: "#0D1B3E", color: "#FAF6F0", border: "1px solid #1E2F5A" }}
            />
          </div>

          {/* Content */}
          <div className="mb-5">
            <label className="text-sm font-semibold block mb-2" style={{ color: "#8899BB" }}>
              Your memory
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What made this moment special?"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-base outline-none resize-none"
              style={{ background: "#0D1B3E", color: "#FAF6F0", border: "1px solid #1E2F5A" }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={addMutation.isPending}
            className="w-full stan-orange-btn rounded-2xl"
          >
            {addMutation.isPending ? "Saving..." : "Save Memory 📸"}
          </button>
        </div>
      )}

      {/* Memories List */}
      {memoriesQuery.isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl animate-pulse"
              style={{ background: "#162347" }}
            />
          ))}
        </div>
      )}

      {!memoriesQuery.isLoading && memories.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">📸</p>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#FAF6F0" }}>
            No memories yet
          </h2>
          <p className="text-lg" style={{ color: "#8899BB" }}>
            Start saving your favorite tennis moments!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {memories.map((memory) => (
          <div
            key={memory.id}
            className="rounded-2xl p-5 slide-up"
            style={{ background: "#162347", border: "1px solid #1E2F5A" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-3xl flex-shrink-0">{memory.emoji}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1" style={{ color: "#FAF6F0" }}>
                    {memory.title}
                  </h3>
                  <p className="text-base leading-relaxed mb-2" style={{ color: "#D4C9B8" }}>
                    {memory.content}
                  </p>
                  <p className="text-sm" style={{ color: "#8899BB" }}>
                    By {memory.authorName} · {new Date(memory.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate({ id: memory.id, sessionToken: token })}
                className="text-xl rounded-xl p-2 transition-all flex-shrink-0"
                style={{ color: "#8899BB" }}
                aria-label="Delete memory"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
