import { ReactNode, useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useGuestSession } from "@/contexts/GuestSessionContext";
import { toast } from "sonner";
import { storagePut } from "@/lib/storage";

const navItems = [
  { path: "/", label: "Home", icon: "☀️" },
  { path: "/chat", label: "Stan", icon: "🎾" },
  { path: "/tournaments", label: "Tours", icon: "🏆" },
  { path: "/picks", label: "Picks", icon: "⚔️" },
  { path: "/trivia", label: "Trivia", icon: "🧠" },
  { path: "/memories", label: "Memories", icon: "📸" },
  { path: "/drops", label: "Drops", icon: "💌" },
];

interface StanLayoutProps {
  children: ReactNode;
}

export default function StanLayout({ children }: StanLayoutProps) {
  const [location, navigate] = useLocation();
  const { token } = useGuestSession();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const unreadCount = trpc.drops.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const transcribeAndSend = trpc.chat.transcribeAndSend.useMutation({
    onSuccess: (data) => {
      toast.success(`Stan heard: "${data.userMessage}"`, { duration: 3000 });
      navigate("/chat");
    },
    onError: () => {
      toast.error("Stan couldn't hear that clearly. Try again!");
    },
  });

  const handleVoiceAid = async () => {
    if (isListening) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) {
          toast.error("Recording too short — hold the button and speak clearly.");
          setIsProcessing(false);
          return;
        }
        setIsProcessing(true);
        try {
          // Upload audio to storage
          const audioUrl = await storagePut(`voice/${token}_${Date.now()}.webm`, blob, "audio/webm");
          await transcribeAndSend.mutateAsync({ sessionToken: token, audioUrl });
        } catch (err) {
          toast.error("Voice processing failed. Try typing instead.");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      toast.info("Listening... tap again to send", { duration: 5000 });
    } catch {
      toast.error("Microphone access needed for Voice Aid");
    }
  };

  const unread = unreadCount.data ?? 0;

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "#0D1B3E" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: "#1E2F5A", background: "#0D1B3E" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎾</span>
          <div>
            <h1 className="text-xl font-bold leading-none" style={{ color: "#E8651A", fontFamily: "'Playfair Display', serif" }}>
              Stan
            </h1>
            <p className="text-xs" style={{ color: "#8899BB" }}>Steve's Tennis Companion</p>
          </div>
        </div>

        {/* Voice Aid Button */}
        <button
          onClick={handleVoiceAid}
          disabled={isProcessing}
          className={`flex items-center justify-center rounded-full font-bold transition-all ${
            isListening ? "pulse-mic" : ""
          }`}
          style={{
            width: 56,
            height: 56,
            background: isListening ? "#E8651A" : isProcessing ? "#555" : "#162347",
            border: `2px solid ${isListening ? "#E8651A" : "#1E2F5A"}`,
            fontSize: 24,
            cursor: isProcessing ? "wait" : "pointer",
          }}
          aria-label="Voice Aid — tap to speak to Stan"
          title="Voice Aid — tap to speak to Stan"
        >
          {isProcessing ? "⏳" : isListening ? "🔴" : "🎤"}
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Transparency note — visible in main content scroll area */}
      <div
        className="text-center py-3 px-4"
        style={{ color: "#3A4F7A", fontSize: "0.7rem" }}
      >
        🤍 Julia added light usage tracking to help build you more of what you love.
      </div>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 py-2 border-t z-50"
        style={{ background: "#0D1B3E", borderColor: "#1E2F5A" }}
      >
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          const hasUnread = item.path === "/drops" && unread > 0;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="stan-nav-item relative"
              style={{
                color: isActive ? "#E8651A" : "#8899BB",
                background: isActive ? "rgba(232,101,26,0.12)" : "transparent",
              }}
              aria-label={item.label}
            >
              <span className="text-2xl leading-none">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
              {hasUnread && (
                <span
                  className="absolute top-0 right-1 flex items-center justify-center rounded-full text-white font-bold"
                  style={{ width: 18, height: 18, background: "#E8651A", fontSize: 10 }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
