// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { analyticsAPI, resumeAPI } from "../services/api";
import ResumeUpload from "./ResumeUpload";
import { Link } from "react-router-dom";

function StatCard({ label, value, color = "amber", delay = 0 }) {
  const colorMap = {
    amber: "text-amber",
    blush: "text-blush",
    rose: "text-rose",
  };
  return (
    <div
      className="bg-navy/60 border border-purple/40 rounded-2xl p-5
                 hover:border-purple/70 hover:-translate-y-0.5 transition-all duration-300
                 animate-fade-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <p className="text-blush/60 text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className={`font-display text-3xl font-bold ${colorMap[color]}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

function StartInterviewCard() {
  return (
    <Link
      to="/interview"
      className="block mb-8 bg-gradient-to-r from-purple/60 to-wine/40 border border-rose/40
                 rounded-2xl px-6 py-5 flex items-center justify-between
                 hover:border-amber/60 hover:from-purple/70 hover:to-wine/50
                 transition-all duration-300 group animate-fade-slide-up"
    >
      <div>
        <h3 className="text-white font-display text-lg font-semibold mb-1">
          Ready for a mock interview?
        </h3>
        <p className="text-blush/60 text-sm">
          Answer 5 questions tailored to your resume and get instant feedback.
        </p>
      </div>
      <span
        className="bg-amber text-navy font-semibold rounded-xl px-5 py-2.5 text-sm
                   whitespace-nowrap transition-transform duration-300
                   group-hover:translate-x-1 flex-shrink-0 ml-4"
      >
        Start Interview →
      </span>
    </Link>
  );
}

function ScoreTrendChart({ trend }) {
  if (!trend || trend.length === 0) {
    return (
      <div className="bg-navy/60 border border-purple/40 rounded-2xl p-8 text-center">
        <p className="text-blush/40 text-sm">
          Complete an interview to start tracking your progress.
        </p>
      </div>
    );
  }

  const width = 700;
  const height = 220;
  const padX = 30;
  const padY = 24;
  const maxScore = 10;

  const points = trend.map((t, i) => {
    const x =
      trend.length === 1
        ? width / 2
        : padX + (i * (width - padX * 2)) / (trend.length - 1);
    const y = padY + (height - padY * 2) * (1 - t.score / maxScore);
    return { x, y, ...t };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath =
    `M ${points[0].x} ${height - padY} ` +
    points.map((p) => `L ${p.x} ${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x} ${height - padY} Z`;

  return (
    <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display text-lg font-semibold">
          Score Progress
        </h3>
        <span className="text-blush/50 text-xs">
          Last {trend.length} session{trend.length !== 1 ? "s" : ""}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--amber, #ED9E59)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--amber, #ED9E59)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 2.5, 5, 7.5, 10].map((v) => {
          const y = padY + (height - padY * 2) * (1 - v / maxScore);
          return (
            <line
              key={v}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-purple/20"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#areaFill)"
          className="animate-fade-in"
          style={{ animationDelay: "400ms", animationFillMode: "backwards" }}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#ED9E59"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-draw-line"
          pathLength="1"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <g
            key={i}
            className="animate-fade-in group"
            style={{ animationDelay: `${600 + i * 80}ms`, animationFillMode: "backwards" }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r="10"
              fill="transparent"
              className="cursor-pointer"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill="#1B1931"
              stroke="#ED9E59"
              strokeWidth="2.5"
              className="transition-all duration-200 group-hover:r-[7]"
            />
            {/* Tooltip */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              <rect
                x={p.x - 22}
                y={p.y - 38}
                width="44"
                height="24"
                rx="6"
                fill="#44174E"
                stroke="#ED9E59"
                strokeOpacity="0.5"
              />
              <text
                x={p.x}
                y={p.y - 21}
                textAnchor="middle"
                fontSize="12"
                fill="#ED9E59"
                fontWeight="600"
              >
                {p.score}
              </text>
            </g>
          </g>
        ))}
      </svg>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        .animate-fade-slide-up {
          animation: fadeSlideUp 0.5s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-draw-line {
          stroke-dasharray: 1;
          animation: drawLine 1.1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dashData, trendData, resumeData] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getTrend(),
        resumeAPI.getMyResumes(),
      ]);
      setStats(dashData);
      setTrend(trendData.trend || []);
      setResumes(resumeData.resumes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resume?")) return;
    try {
      await resumeAPI.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-purple/40 to-navy">
      {/* Navbar */}
      <nav className="border-b border-purple/30 bg-navy/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-2xl font-bold text-amber">PrepIn</span>
          <div className="flex items-center gap-4">
            <span className="text-blush/60 text-sm hidden sm:block">{user?.name}</span>
            <Link to="/profile" className="text-blush/60 hover:text-blush text-sm transition">
              Profile
            </Link>
            <button
              onClick={logout}
              className="text-blush/60 hover:text-blush text-sm transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">
            Hey, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-blush/60 mt-1">Here's your prep overview</p>
        </div>

        {/* Start Interview CTA */}
        <StartInterviewCard />

        {/* Stats */}
        {loading ? (
          <div className="text-blush/40 text-sm mb-10">Loading stats...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Resumes" value={stats?.resume_count} color="amber" delay={0} />
            <StatCard label="Sessions" value={stats?.total_sessions} color="blush" delay={80} />
            <StatCard label="Completed" value={stats?.completed_sessions} color="rose" delay={160} />
            <StatCard
              label="Avg Score"
              value={stats?.avg_score ? `${stats.avg_score}/10` : "—"}
              color="amber"
              delay={240}
            />
          </div>
        )}

        {/* Score trend chart */}
        {!loading && (
          <div className="mb-10">
            <ScoreTrendChart trend={trend} />
          </div>
        )}

        {/* Resume section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">Your Resumes</h2>
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="bg-rose/30 hover:bg-rose/50 text-blush border border-rose/40
                       rounded-xl px-4 py-2 text-sm font-medium transition"
          >
            {showUpload ? "Cancel" : "+ Upload Resume"}
          </button>
        </div>

        {showUpload && (
          <div className="mb-8">
            <ResumeUpload
              onUploadSuccess={(newResume) => {
                setResumes((prev) => [newResume, ...prev]);
                setShowUpload(false);
              }}
            />
          </div>
        )}

        {/* Resume list */}
        {resumes.length === 0 && !showUpload ? (
          <div className="text-center py-16 border border-dashed border-purple/40 rounded-2xl">
            <p className="text-blush/40 text-sm">No resumes uploaded yet.</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-3 text-amber text-sm hover:underline"
            >
              Upload your first resume →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-navy/60 border border-purple/30
                           rounded-xl px-5 py-4 hover:border-purple/60 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blush/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{r.filename}</p>
                    <p className="text-blush/40 text-xs">
                      {new Date(r.uploaded_at).toLocaleDateString()} ·{" "}
                      <span
                        className={
                          r.status === "parsed"
                            ? "text-amber"
                            : r.status === "failed"
                            ? "text-rose"
                            : "text-blush/50"
                        }
                      >
                        {r.status}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-blush/30 hover:text-rose text-xs transition ml-4"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}