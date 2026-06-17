import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useGuestSession } from "@/contexts/GuestSessionContext";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export default function CompanionChat() {
  const { token } = useGuestSession();
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const historyQuery = trpc.chat.history.useQuery(
    { sessionToken: token },
    { enabled: !!token, staleTime: 0 }
  );

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply,
        createdAt: new Date(),
      };
      setLocalMessages((prev) => [...prev, assistantMsg]);
      setIsSending(false);
    },
    onError: () => {
      toast.error("Stan had trouble responding. Try again!");
      setIsSending(false);
    },
  });

  // Merge DB history with local messages
  const dbMessages = historyQuery.data ?? [];
  const allMessages: Message[] = [
    ...dbMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      createdAt: new Date(m.createdAt),
    })),
    ...localMessages.filter((lm) => !dbMessages.some((dm) => dm.id === lm.id)),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length, isSending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: text,
      createdAt: new Date(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    sendMutation.mutate({ sessionToken: token, message: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showWelcome = allMessages.length === 0 && !historyQuery.isLoading;

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)]">
      {/* Chat Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-3"
        style={{ borderColor: "#1E2F5A", background: "#0D1B3E" }}
      >
        <div
          className="flex items-center justify-center rounded-full text-xl font-bold flex-shrink-0"
          style={{ width: 48, height: 48, background: "#E8651A", color: "white" }}
        >
          S
        </div>
        <div>
          <p className="font-bold text-xl" style={{ color: "#FAF6F0" }}>Stan</p>
          <p className="text-sm" style={{ color: "#4CAF50" }}>● Online — ready to talk tennis</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {historyQuery.isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4 rounded-2xl" style={{ background: "#162347" }} />
            <Skeleton className="h-12 w-1/2 rounded-2xl ml-auto" style={{ background: "#162347" }} />
          </div>
        )}

        {showWelcome && (
          <div className="text-center py-8 fade-in">
            <div
              className="inline-flex items-center justify-center rounded-full text-4xl mb-4"
              style={{ width: 80, height: 80, background: "#162347" }}
            >
              🎾
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#FAF6F0" }}>
              Hey Steve! I'm Stan.
            </h2>
            <p className="text-lg mb-6" style={{ color: "#8899BB" }}>
              Your personal tennis companion. Ask me anything!
            </p>
            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto">
              {[
                "Who's the best player right now?",
                "What happened at Wimbledon this year?",
                "Explain a tiebreak to me",
                "Who should I watch this week?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                  className="text-left rounded-xl px-4 py-3 text-base transition-all active:scale-95"
                  style={{ background: "#162347", color: "#FAF6F0", border: "1px solid #1E2F5A" }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {allMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} fade-in`}
          >
            {msg.role === "assistant" && (
              <div
                className="flex items-center justify-center rounded-full text-base font-bold flex-shrink-0 mr-2 self-end"
                style={{ width: 36, height: 36, background: "#E8651A", color: "white" }}
              >
                S
              </div>
            )}
            <div
              className="max-w-[80%] rounded-2xl px-4 py-3 text-base leading-relaxed"
              style={{
                background: msg.role === "user" ? "#E8651A" : "#162347",
                color: "#FAF6F0",
                borderBottomRightRadius: msg.role === "user" ? 4 : undefined,
                borderBottomLeftRadius: msg.role === "assistant" ? 4 : undefined,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start fade-in">
            <div
              className="flex items-center justify-center rounded-full text-base font-bold flex-shrink-0 mr-2 self-end"
              style={{ width: 36, height: 36, background: "#E8651A", color: "white" }}
            >
              S
            </div>
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "#162347", borderBottomLeftRadius: 4 }}
            >
              <div className="flex gap-1 items-center h-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      background: "#E8651A",
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div
        className="px-4 py-3 border-t"
        style={{ borderColor: "#1E2F5A", background: "#0D1B3E" }}
      >
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Stan anything about tennis..."
            rows={1}
            className="flex-1 rounded-2xl px-4 py-3 text-base resize-none outline-none transition-all"
            style={{
              background: "#162347",
              color: "#FAF6F0",
              border: "1px solid #1E2F5A",
              minHeight: 52,
              maxHeight: 120,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="flex items-center justify-center rounded-full font-bold transition-all active:scale-95 flex-shrink-0"
            style={{
              width: 52,
              height: 52,
              background: input.trim() && !isSending ? "#E8651A" : "#1E2F5A",
              color: "white",
              fontSize: 20,
            }}
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
