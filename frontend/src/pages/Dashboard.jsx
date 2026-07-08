// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { analyticsAPI, resumeAPI } from "../services/api";
import ResumeUpload from "./ResumeUpload";
import { Link } from "react-router-dom";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 bg-navy" />
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-purple/25 rounded-full blur-[120px] animate-drift-slow" />
      <div className="absolute top-[30%] right-[5%] w-[400px] h-[400px] bg-rose/15 rounded-full blur-[110px] animate-drift-slow-reverse" />
      <div className="absolute bottom-[-15%] left-[30%] w-[450px] h-[450px] bg-wine/25 rounded-full blur-[130px] animate-drift-slower" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(233,140,185,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(233,140,185,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <style>{`
        @keyframes driftSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, 30px) scale(1.08); }
          66% { transform: translate(-20px, 50px) scale(0.95); }
        }
        @keyframes driftSlowReverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, -20px) scale(1.1); }
          66% { transform: translate(20px, -40px) scale(0.92); }
        }
        @keyframes driftSlower {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.12); }
        }
        .animate-drift-slow { animation: driftSlow 22s ease-in-out infinite; }
        .animate-drift-slow-reverse { animation: driftSlowReverse 26s ease-in-out infinite; }
        .animate-drift-slower { animation: driftSlower 30s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function ScoreRing({ score = 0, size = 96 }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score / 10, 0), 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" className="text-purple/25" strokeWidth="7" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ED9E59"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: circumference,
            animation: `ringFill-${Math.round(offset)} 1.4s cubic-bezier(0.16,1,0.3,1) 0.4s forwards`,
            filter: "drop-shadow(0 0 6px rgba(237,158,89,0.5))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-display font-bold text-xl leading-none">
          {score ? score.toFixed(1) : "—"}
        </span>
        <span className="text-blush/40 text-[10px] mt-0.5">/ 10</span>
      </div>
      <style>{`
        @keyframes ringFill-${Math.round(offset)} {
          to { stroke-dashoffset: ${offset}; }
        }
      `}</style>
    </div>
  );
}

function StatPill({ label, value, icon, delay = 0 }) {
  return (
    <div
      className="group relative overflow-hidden flex items-center gap-3 bg-navy/50 border border-purple/30
                 rounded-2xl px-4 py-3.5 backdrop-blur-sm
                 hover:border-amber/50 hover:bg-navy/70 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber/5
                 transition-all duration-500 ease-out animate-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full
                       bg-gradient-to-r from-transparent via-white/[0.06] to-transparent
                       transition-transform duration-1000 ease-out" />
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple/60 to-wine/40 border border-purple/40
                      flex items-center justify-center text-lg flex-shrink-0
                      group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out">
        {icon}
      </div>
      <div className="min-w-0 relative">
        <p className="font-display text-xl font-bold text-white leading-tight">{value ?? "—"}</p>
        <p className="text-blush/50 text-[11px] uppercase tracking-wider truncate">{label}</p>
      </div>
    </div>
  );
}

function HeroBanner({ user, stats }) {
  const initials = user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple/50 via-wine/30 to-navy/60
                    border border-purple/40 rounded-3xl p-7 sm:p-8 mb-8 animate-rise">
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 bg-amber/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 w-48 h-48 bg-rose/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1.5s" }} />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-amber/30 blur-md animate-pulse-slow" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber to-rose/70 flex items-center
                            justify-center text-navy font-display font-bold text-xl">
              {initials || "?"}
            </div>
          </div>
          <div>
            <p className="text-blush/60 text-sm">{getGreeting()}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
              {user?.name?.split(" ")[0]} 👋
            </h1>
            {stats?.completed_sessions > 0 && (
              <p className="text-blush/50 text-xs mt-1">
                {stats.completed_sessions} interview{stats.completed_sessions !== 1 ? "s" : ""} completed — keep going
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:pl-6 sm:border-l sm:border-purple/30">
          <ScoreRing score={stats?.avg_score || 0} />
          <div>
            <p className="text-blush/60 text-xs uppercase tracking-wider mb-1">Avg. score</p>
            <p className="text-blush/40 text-xs max-w-[8rem]">Across all completed sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StartInterviewCard() {
  return (
    <Link
      to="/interview"
      className="relative block mb-8 overflow-hidden bg-gradient-to-r from-purple/60 to-wine/40
                 border border-rose/40 rounded-2xl px-6 py-5 flex items-center justify-between
                 hover:border-amber/60 hover:from-purple/70 hover:to-wine/50 hover:shadow-xl hover:shadow-rose/10
                 transition-all duration-500 ease-out group animate-rise"
      style={{ animationDelay: "80ms" }}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full
                       bg-gradient-to-r from-transparent via-white/10 to-transparent
                       transition-transform duration-700 ease-out" />
      <div className="relative">
        <h3 className="text-white font-display text-lg font-semibold mb-1 flex items-center gap-2">
          <span className="text-xl inline-block group-hover:animate-wiggle">🎯</span>
          Ready for a mock interview?
        </h3>
        <p className="text-blush/60 text-sm">
          Answer 5 questions tailored to your resume and get instant feedback.
        </p>
      </div>
      <span className="relative bg-amber text-navy font-semibold rounded-xl px-5 py-2.5 text-sm
                       whitespace-nowrap transition-transform duration-300
                       group-hover:translate-x-1 flex-shrink-0 ml-4 shadow-glow-amber">
        Start Interview →
      </span>
    </Link>
  );
}

function ScoreTrendChart({ trend }) {
  if (!trend || trend.length === 0) {
    return (
      <div className="bg-navy/60 border border-purple/40 rounded-2xl p-10 text-center animate-rise">
        <div className="text-3xl mb-2 opacity-40">📈</div>
        <p className="text-blush/40 text-sm">Complete an interview to start tracking your progress.</p>
      </div>
    );
  }

  const width = 700;
  const height = 220;
  const padX = 30;
  const padY = 24;
  const maxScore = 10;

  const points = trend.map((t, i) => {
    const x = trend.length === 1 ? width / 2 : padX + (i * (width - padX * 2)) / (trend.length - 1);
    const y = padY + (height - padY * 2) * (1 - t.score / maxScore);
    return { x, y, ...t };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath =
    `M ${points[0].x} ${height - padY} ` +
    points.map((p) => `L ${p.x} ${p.y}`).join(" ") +
    ` L ${points[points.length - 1].x} ${height - padY} Z`;

  const latest = trend[trend.length - 1]?.score;
  const first = trend[0]?.score;
  const delta = trend.length > 1 ? (latest - first).toFixed(1) : null;

  return (
    <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6 hover:border-purple/60 transition-colors duration-500 animate-rise">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display text-lg font-semibold flex items-center gap-2">
          Score progress
          {delta !== null && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${delta >= 0 ? "bg-amber/15 text-amber" : "bg-rose/20 text-rose"}`}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}
            </span>
          )}
        </h3>
        <span className="text-blush/50 text-xs">Last {trend.length} session{trend.length !== 1 ? "s" : ""}</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ED9E59" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ED9E59" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 2.5, 5, 7.5, 10].map((v) => {
          const y = padY + (height - padY * 2) * (1 - v / maxScore);
          return <line key={v} x1={padX} x2={width - padX} y1={y} y2={y} stroke="currentColor" className="text-purple/20" strokeDasharray="4 4" />;
        })}

        <path d={areaPath} fill="url(#areaFill)" className="animate-fade-in" style={{ animationDelay: "500ms", animationFillMode: "backwards" }} />
        <path d={linePath} fill="none" stroke="#ED9E59" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-line" pathLength="1" />

        {points.map((p, i) => (
          <g key={i} className="animate-fade-in group/dot" style={{ animationDelay: `${700 + i * 100}ms`, animationFillMode: "backwards" }}>
            <circle cx={p.x} cy={p.y} r="12" fill="transparent" className="cursor-pointer" />
            <circle cx={p.x} cy={p.y} r="5" fill="#1B1931" stroke="#ED9E59" strokeWidth="2.5" className="transition-all duration-300 group-hover/dot:r-[8]" />
            <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
              <rect x={p.x - 22} y={p.y - 38} width="44" height="24" rx="6" fill="#44174E" stroke="#ED9E59" strokeOpacity="0.5" />
              <text x={p.x} y={p.y - 21} textAnchor="middle" fontSize="12" fill="#ED9E59" fontWeight="600">{p.score}</text>
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ResumeRow({ resume, index, onDelete }) {
  const statusStyle = {
    parsed: "bg-amber/10 text-amber",
    failed: "bg-rose/15 text-rose",
    uploaded: "bg-blush/10 text-blush/70",
  }[resume.status] || "bg-blush/10 text-blush/70";

  return (
    <div
      className="flex items-center justify-between bg-navy/60 border border-purple/30
                 rounded-xl px-5 py-4 hover:border-purple/60 hover:bg-navy/80
                 hover:translate-x-1 transition-all duration-400 ease-out animate-rise"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 bg-purple/40 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blush/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{resume.filename}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-blush/40 text-xs">{new Date(resume.uploaded_at).toLocaleDateString()}</span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyle}`}>{resume.status}</span>
          </div>
        </div>
      </div>
      <button onClick={() => onDelete(resume.id)} className="text-blush/30 hover:text-rose text-xs font-medium transition-colors duration-200 ml-4 flex-shrink-0">
        Delete
      </button>
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
    <div className="min-h-screen bg-prepin-gradient">
      <AnimatedBackground />

      {/* Navbar */}
      <nav className="border-b border-purple/30 bg-navy/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-2xl font-bold text-amber tracking-tight">PrepIn</span>
          <div className="flex items-center gap-5">
            <Link to="/profile" className="text-blush/60 hover:text-blush text-sm transition-colors duration-200">Profile</Link>
            <button onClick={logout} className="text-blush/60 hover:text-blush text-sm transition-colors duration-200">Sign out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!loading && <HeroBanner user={user} stats={stats} />}

        <StartInterviewCard />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-navy/40 border border-purple/20 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatPill label="Resumes" value={stats?.resume_count} icon="📄" delay={0} />
            <StatPill label="Sessions" value={stats?.total_sessions} icon="🗂️" delay={90} />
            <StatPill label="Completed" value={stats?.completed_sessions} icon="✅" delay={180} />
            <StatPill label="Best score" value={stats?.best_score ? `${stats.best_score}/10` : "—"} icon="🏆" delay={270} />
          </div>
        )}

        {!loading && (
          <div className="mb-10">
            <ScoreTrendChart trend={trend} />
          </div>
        )}

        <div className="mb-6 flex items-center justify-between animate-rise">
          <h2 className="font-display text-xl font-semibold text-white">Your resumes</h2>
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="bg-rose/30 hover:bg-rose/50 text-blush border border-rose/40
                       rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300
                       hover:-translate-y-0.5 active:scale-95"
          >
            {showUpload ? "Cancel" : "+ Upload resume"}
          </button>
        </div>

        {showUpload && (
          <div className="mb-8 animate-rise">
            <ResumeUpload
              onUploadSuccess={(newResume) => {
                setResumes((prev) => [newResume, ...prev]);
                setShowUpload(false);
              }}
            />
          </div>
        )}

        {resumes.length === 0 && !showUpload ? (
          <div className="text-center py-16 border border-dashed border-purple/40 rounded-2xl animate-rise">
            <div className="text-3xl mb-2 opacity-40">🗒️</div>
            <p className="text-blush/40 text-sm">No resumes uploaded yet.</p>
            <button onClick={() => setShowUpload(true)} className="mt-3 text-amber text-sm hover:underline underline-offset-4">
              Upload your first resume →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((r, i) => (
              <ResumeRow key={r.id} resume={r} index={i} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes rise {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-12deg); }
          75% { transform: rotate(12deg); }
        }
        .animate-rise {
          animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-draw-line {
          stroke-dasharray: 1;
          animation: drawLine 1.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}