import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function FamilyDrops() {
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [fromName, setFromName] = useState("");
  const [message, setMessage] = useState("");

  const utils = trpc.useUtils();

  const dropsQuery = trpc.drops.list.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const addMutation = trpc.drops.add.useMutation({
    onSuccess: () => {
      toast.success("Drop left for Steve! 💌");
      setShowLeaveForm(false);
      setFromName("");
      setMessage("");
      utils.drops.list.invalidate();
      utils.drops.unreadCount.invalidate();
    },
    onError: () => toast.error("Couldn't send drop. Try again!"),
  });

  const markReadMutation = trpc.drops.markRead.useMutation({
    onSuccess: () => {
      utils.drops.list.invalidate();
      utils.drops.unreadCount.invalidate();
    },
  });

  const drops = dropsQuery.data ?? [];
  const unreadDrops = drops.filter((d) => !d.isRead);
  const readDrops = drops.filter((d) => d.isRead);

  const handleSubmit = () => {
    if (!fromName.trim() || !message.trim()) {
      toast.error("Please add your name and a message.");
      return;
    }
    addMutation.mutate({ fromName, message });
  };

  return (
    <div className="px-5 py-6 fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: "#FAF6F0", fontFamily: "'Playfair Display', serif" }}
          >
            Family Drops
          </h1>
          <p className="text-base" style={{ color: "#8899BB" }}>Messages left just for Steve</p>
        </div>
        <button
          onClick={() => setShowLeaveForm(!showLeaveForm)}
          className="stan-orange-btn rounded-2xl"
          style={{ padding: "0.75rem 1.25rem", fontSize: "1rem" }}
        >
          {showLeaveForm ? "✕ Cancel" : "💌 Leave Drop"}
        </button>
      </div>

      {/* Unread indicator */}
      {unreadDrops.length > 0 && (
        <div
          className="rounded-2xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ background: "rgba(232,101,26,0.1)", border: "1px solid rgba(232,101,26,0.3)" }}
        >
          <span className="text-2xl">💌</span>
          <p className="text-base font-semibold" style={{ color: "#E8651A" }}>
            {unreadDrops.length} new drop{unreadDrops.length !== 1 ? "s" : ""} waiting for you, Steve!
          </p>
        </div>
      )}

      {/* Leave a Drop Form */}
      {showLeaveForm && (
        <div
          className="rounded-2xl p-5 mb-6 slide-up"
          style={{ background: "#162347", border: "2px solid #E8651A" }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: "#FAF6F0" }}>Leave a Drop for Steve</h2>

          <div className="mb-4">
            <label className="text-sm font-semibold block mb-2" style={{ color: "#8899BB" }}>
              Your name
            </label>
            <input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="e.g. Amy, John, Sarah..."
              className="w-full rounded-xl px-4 py-3 text-base outline-none"
              style={{ background: "#0D1B3E", color: "#FAF6F0", border: "1px solid #1E2F5A" }}
            />
          </div>

          <div className="mb-5">
            <label className="text-sm font-semibold block mb-2" style={{ color: "#8899BB" }}>
              Your message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave Steve a tennis update, a note, or just say hi!"
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-base outline-none resize-none"
              style={{ background: "#0D1B3E", color: "#FAF6F0", border: "1px solid #1E2F5A" }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={addMutation.isPending}
            className="w-full stan-orange-btn rounded-2xl"
          >
            {addMutation.isPending ? "Sending..." : "Send Drop 💌"}
          </button>
        </div>
      )}

      {/* Drops Loading */}
      {dropsQuery.isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "#162347" }} />
          ))}
        </div>
      )}

      {/* No Drops */}
      {!dropsQuery.isLoading && drops.length === 0 && !showLeaveForm && (
        <div className="text-center py-12">
          <p className="text-5xl mb-4">💌</p>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#FAF6F0" }}>
            No drops yet
          </h2>
          <p className="text-lg" style={{ color: "#8899BB" }}>
            Family can leave messages here for Steve to find!
          </p>
        </div>
      )}

      {/* Unread Drops */}
      {unreadDrops.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3" style={{ color: "#FAF6F0" }}>New Drops</h2>
          <div className="space-y-3">
            {unreadDrops.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                isNew={true}
                onRead={() => markReadMutation.mutate({ id: drop.id })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Read Drops */}
      {readDrops.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#8899BB" }}>Earlier Drops</h2>
          <div className="space-y-3">
            {readDrops.map((drop) => (
              <DropCard
                key={drop.id}
                drop={drop}
                isNew={false}
                onRead={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DropCard({
  drop,
  isNew,
  onRead,
}: {
  drop: { id: number; fromName: string; message: string; isRead: boolean; createdAt: Date };
  isNew: boolean;
  onRead: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-5 slide-up"
      style={{
        background: isNew ? "rgba(232,101,26,0.06)" : "#162347",
        border: `1px solid ${isNew ? "rgba(232,101,26,0.3)" : "#1E2F5A"}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center rounded-full text-base font-bold flex-shrink-0"
          style={{
            width: 44,
            height: 44,
            background: isNew ? "#E8651A" : "#1E2F5A",
            color: "white",
          }}
        >
          {drop.fromName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-base" style={{ color: isNew ? "#E8651A" : "#FAF6F0" }}>
              {drop.fromName}
              {isNew && <span className="ml-2 text-xs">● New</span>}
            </p>
            <p className="text-sm" style={{ color: "#8899BB" }}>
              {new Date(drop.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <p className="text-base leading-relaxed" style={{ color: "#D4C9B8" }}>
            {drop.message}
          </p>
          {isNew && (
            <button
              onClick={onRead}
              className="mt-3 text-sm font-semibold px-3 py-1 rounded-lg transition-all"
              style={{ color: "#8899BB", background: "#0D1B3E" }}
            >
              Mark as read ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
