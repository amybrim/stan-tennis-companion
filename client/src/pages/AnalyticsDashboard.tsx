import { useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const NAVY = "#0D1B3E";
const ORANGE = "#E8651A";
const BLUE = "#64A0FF";
const GREEN = "#4CAF50";
const MUTED = "#8899BB";
const CARD_BG = "#162347";
const BORDER = "#1E2F5A";

const CATEGORY_COLORS: Record<string, string> = {
  Communication: ORANGE,
  "Daily Routine": GREEN,
  Tennis: BLUE,
  Social: "#C084FC",
  Navigation: MUTED,
  Other: "#888",
};

const FEATURE_LABELS: Record<string, string> = {
  page_view: "Page Views",
  morning_briefing_opened: "Morning Briefing",
  chat_message_sent: "Chat Messages",
  voice_aid_phrase_tap: "Voice Phrases",
  voice_aid_typed_speak: "Voice Typed",
  voice_aid_say_again: "Say Again",
  showdown_pick_made: "Pick Battle",
  trivia_answered: "Trivia Answers",
  tournament_viewed: "Tournament Views",
  family_drop_left: "Family Drops Left",
  family_drop_played: "Family Drops Read",
  memory_added: "Memories Added",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      <p className="text-sm font-medium" style={{ color: MUTED }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: "#FAF6F0" }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: MUTED }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const printRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = trpc.analytics.dashboard.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: NAVY }}
      >
        <div className="text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-xl font-semibold" style={{ color: "#FAF6F0" }}>
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  const features = (data?.features ?? []).map((f) => ({
    name: FEATURE_LABELS[f.event] ?? f.event,
    count: Number(f.count),
  }));

  const topPhrases = (data?.topPhrases ?? []).map((p) => ({
    label: p.label ?? "(unknown)",
    count: Number(p.count),
  }));

  const hourly = Array.from({ length: 24 }, (_, h) => {
    const found = (data?.hourly ?? []).find((r) => Number(r.hour) === h);
    return { hour: `${h}:00`, count: Number(found?.count ?? 0) };
  });

  const daily = (data?.daily ?? []).map((d) => ({
    date: d.date,
    total: Number(d.count),
  }));

  const dailyWithVoice = daily.map((d) => {
    const voice = (data?.dailyVoiceAid ?? []).find((v) => v.date === d.date);
    return { ...d, voice: Number(voice?.count ?? 0) };
  });

  const categories = (data?.categories ?? []).map((c) => ({
    name: c.category,
    value: Number(c.count),
  }));

  const totalEvents = data?.totalEvents ?? 0;
  const totalSessions = data?.totalSessions ?? 0;
  const topFeature = features[0]?.name ?? "—";
  const avgPerSession =
    totalSessions > 0 ? Math.round(totalEvents / totalSessions) : 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen" style={{ background: NAVY }}>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-page { background: white !important; color: black !important; padding: 2rem; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="max-w-5xl mx-auto px-5 py-8" ref={printRef}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8 no-print">
          <div>
            <h1
              className="text-4xl font-bold mb-1"
              style={{ color: "#FAF6F0", fontFamily: "'Playfair Display', serif" }}
            >
              Stan Analytics
            </h1>
            <p className="text-base" style={{ color: MUTED }}>
              Usage patterns for Steve's tennis companion
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-2xl px-5 py-3 font-bold transition-all active:scale-95"
            style={{ background: ORANGE, color: "white", fontSize: "1rem" }}
          >
            🖨️ Usage Report
          </button>
        </div>

        {/* ─── Printable Report Header (hidden on screen) ─── */}
        <div className="print-only print-page" style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
            Stan Tennis Companion — Usage Report
          </h1>
          <p style={{ color: "#555", marginBottom: "0.5rem" }}>Generated: {today}</p>
          <p style={{ color: "#555", marginBottom: "2rem" }}>
            This report summarizes how Steve is engaging with his tennis companion app. It is
            intended to help caregivers and family members understand patterns of use, feature
            engagement, and daily activity trends.
          </p>
          <hr style={{ marginBottom: "2rem" }} />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
          <StatCard label="Total Events" value={totalEvents.toLocaleString()} sub="All tracked interactions" />
          <StatCard label="Unique Sessions" value={totalSessions.toLocaleString()} sub="Distinct device visits" />
          <StatCard label="Top Feature" value={topFeature} sub="Most used feature" />
          <StatCard label="Events / Session" value={avgPerSession} sub="Average engagement depth" />
        </div>

        {/* 30-Day Daily Trend */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: "#FAF6F0" }}>
            📈 30-Day Activity Trend
          </h2>
          {dailyWithVoice.length === 0 ? (
            <p className="text-center py-8" style={{ color: MUTED }}>
              No data yet — activity will appear here once Steve starts using the app.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyWithVoice}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: MUTED, fontSize: 11 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0D1B3E", border: `1px solid ${BORDER}`, borderRadius: 12 }}
                  labelStyle={{ color: "#FAF6F0" }}
                />
                <Legend wrapperStyle={{ color: MUTED, fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={ORANGE}
                  strokeWidth={2}
                  dot={false}
                  name="Total Events"
                />
                <Line
                  type="monotone"
                  dataKey="voice"
                  stroke={BLUE}
                  strokeWidth={2}
                  dot={false}
                  name="Voice Aid"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Feature Usage + Category Breakdown */}
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
          {/* Feature Usage */}
          <div
            className="rounded-2xl p-5"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: "#FAF6F0" }}>
              🎯 Feature Usage
            </h2>
            {features.length === 0 ? (
              <p className="text-center py-8" style={{ color: MUTED }}>
                No data yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={features} layout="vertical">
                  <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#FAF6F0", fontSize: 11 }}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0D1B3E", border: `1px solid ${BORDER}`, borderRadius: 12 }}
                    labelStyle={{ color: "#FAF6F0" }}
                  />
                  <Bar dataKey="count" fill={ORANGE} radius={[0, 6, 6, 0]} name="Uses" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category Breakdown */}
          <div
            className="rounded-2xl p-5"
            style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: "#FAF6F0" }}>
              🗂 Category Breakdown
            </h2>
            {categories.length === 0 ? (
              <p className="text-center py-8" style={{ color: MUTED }}>
                No data yet.
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {categories.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={CATEGORY_COLORS[entry.name] ?? "#888"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#0D1B3E", border: `1px solid ${BORDER}`, borderRadius: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-full font-semibold"
                      style={{
                        background: `${CATEGORY_COLORS[c.name] ?? "#888"}22`,
                        color: CATEGORY_COLORS[c.name] ?? "#888",
                      }}
                    >
                      {c.name}: {c.value}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hourly Activity Heatmap */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: "#FAF6F0" }}>
            🕐 Hourly Activity Pattern
          </h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hourly}>
              <XAxis
                dataKey="hour"
                tick={{ fill: MUTED, fontSize: 10 }}
                interval={2}
              />
              <YAxis tick={{ fill: MUTED, fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0D1B3E", border: `1px solid ${BORDER}`, borderRadius: 12 }}
                labelStyle={{ color: "#FAF6F0" }}
              />
              <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} name="Events" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Phrases */}
        <div
          className="rounded-2xl p-5 mb-8"
          style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: "#FAF6F0" }}>
            💬 Top Phrases & Messages
          </h2>
          {topPhrases.length === 0 ? (
            <p className="text-center py-6" style={{ color: MUTED }}>
              No phrases recorded yet — chat messages and voice phrases will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {topPhrases.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: "#0D1B3E" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-bold w-6 text-center"
                      style={{ color: i < 3 ? ORANGE : MUTED }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-base" style={{ color: "#FAF6F0" }}>
                      {p.label}
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(232,101,26,0.15)", color: ORANGE }}
                  >
                    {p.count}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transparency note */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{
            background: "rgba(232,101,26,0.06)",
            border: `1px solid rgba(232,101,26,0.2)`,
          }}
        >
          <p className="text-sm" style={{ color: MUTED }}>
            <span style={{ color: ORANGE }}>🤍 A note from Julia:</span> This analytics view is
            private and only accessible at <code>/admin/analytics</code>. Steve sees a small note
            in the app footer letting him know this data is collected to help build him more of
            what he loves.
          </p>
        </div>

        {/* ─── Printable Report Body (hidden on screen) ─── */}
        <div className="print-only" style={{ marginTop: "2rem" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Key Metrics
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
            <tbody>
              {[
                ["Total Interactions", totalEvents.toLocaleString()],
                ["Unique Sessions", totalSessions.toLocaleString()],
                ["Most Used Feature", topFeature],
                ["Average Events per Session", avgPerSession],
              ].map(([k, v]) => (
                <tr key={String(k)} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "0.5rem 0", fontWeight: "bold", width: "50%" }}>{k}</td>
                  <td style={{ padding: "0.5rem 0" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Feature Engagement
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0" }}>Feature</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0" }}>Uses</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.name} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.4rem 0" }}>{f.name}</td>
                  <td style={{ textAlign: "right", padding: "0.4rem 0" }}>{f.count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Category Breakdown
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0" }}>Category</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0" }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.name} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.4rem 0" }}>{c.name}</td>
                  <td style={{ textAlign: "right", padding: "0.4rem 0" }}>{c.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {topPhrases.length > 0 && (
            <>
              <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem" }}>
                Top Phrases &amp; Messages
              </h2>
              <ol style={{ marginBottom: "2rem", paddingLeft: "1.5rem" }}>
                {topPhrases.slice(0, 10).map((p, i) => (
                  <li key={i} style={{ marginBottom: "0.3rem" }}>
                    <strong>"{p.label}"</strong> — {p.count}×
                  </li>
                ))}
              </ol>
            </>
          )}

          <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Clinician / Caregiver Notes
          </h2>
          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              minHeight: 120,
              padding: "1rem",
              marginBottom: "2rem",
            }}
          />

          <p style={{ fontSize: "0.85rem", color: "#777", marginTop: "2rem" }}>
            Stan Tennis Companion — Usage Report · Generated {today} · Private &amp; Confidential
          </p>
        </div>
      </div>
    </div>
  );
}
