// src/pages/Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { analyticsAPI, resumeAPI } from "../services/api";
import ResumeUpload from "./ResumeUpload";
import { Link } from "react-router-dom";
import PrepInLogo from "../components/PrepInLogo";
import { FileText, Folder, CheckCircle2, Trophy, TrendingUp, TrendingDown, Sparkles, Upload, Trash2 } from "lucide-react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ---------- Neural network canvas background ----------
function NeuralBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf, w, h;
    const NODE_COUNT = 34;
    let nodes = [];

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.4 + 0.7,
    }));

    function onMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    if (!window.matchMedia("(hover: none)").matches) {
      window.addEventListener("mousemove", onMove);
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.strokeStyle = `rgba(237,158,89,${0.08 * (1 - d / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(233,140,185,0.35)";
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function ScoreRing({ score = 0, size = 88 }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score / 10, 0), 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ED9E59"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          style={{
            animation: `ringFill-${Math.round(offset)} 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s forwards`,
            filter: "drop-shadow(0 0 5px rgba(237,158,89,0.4))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-display font-bold text-lg leading-none">
          {score ? score.toFixed(1) : "—"}
        </span>
        <span className="text-blush/40 text-[9px] mt-0.5">/ 10</span>
      </div>
      <style>{`@keyframes ringFill-${Math.round(offset)} { to { stroke-dashoffset: ${offset}; } }`}</style>
    </div>
  );
}

function StatPill({ label, value, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden flex items-center gap-3 rounded-2xl border border-white/10
                 bg-white/[0.03] backdrop-blur-md px-4 py-3.5
                 hover:border-amber/30 hover:bg-white/[0.05] transition-colors duration-300 min-w-0"
    >
      <div className="relative w-10 h-10 rounded-xl bg-amber/10 border border-amber/20
                      flex items-center justify-center flex-shrink-0
                      group-hover:scale-105 transition-transform duration-300">
        <Icon size={17} className="text-amber" />
      </div>
      <div className="min-w-0">
        <p className="font-display text-lg sm:text-xl font-bold text-white leading-tight truncate">{value ?? "—"}</p>
        <p className="text-blush/50 text-[10px] sm:text-[11px] uppercase tracking-wider truncate">{label}</p>
      </div>
    </motion.div>
  );
}

function HeroBanner({ user, stats }) {
  const initials = user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]
                 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-6 sm:p-8 mb-6"
    >
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 bg-amber/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 w-48 h-48 bg-rose/10 rounded-full blur-3xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4 min-w-0">
          <div className="relative w-13 h-13 sm:w-14 sm:h-14 flex-shrink-0">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber to-rose/70 flex items-center
                            justify-center text-navy font-display font-bold text-lg sm:text-xl">
              {initials || "?"}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-blush/60 text-xs sm:text-sm">{getGreeting()}</p>
            <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight truncate">
              {user?.name?.split(" ")[0]} 👋
            </h1>
            {stats?.completed_sessions > 0 && (
              <p className="text-blush/50 text-xs mt-1">
                {stats.completed_sessions} interview{stats.completed_sessions !== 1 ? "s" : ""} completed — keep going
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 sm:pl-6 sm:border-l sm:border-white/10 flex-shrink-0">
          <ScoreRing score={stats?.avg_score || 0} />
          <div>
            <p className="text-blush/60 text-xs uppercase tracking-wider mb-1">Avg. score</p>
            <p className="text-blush/40 text-xs max-w-[9rem]">Across all completed sessions</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StartInterviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to="/interview"
        className="relative block mb-6 overflow-hidden rounded-2xl border border-amber/20 bg-gradient-to-r
                   from-amber/[0.08] to-rose/[0.06] backdrop-blur-md px-5 sm:px-6 py-5
                   flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
                   hover:border-amber/40 transition-colors duration-300 group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber/15 border border-amber/25 flex items-center justify-center flex-shrink-0">
            <Sparkles size={18} className="text-amber" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-display text-base sm:text-lg font-semibold">
              Ready for a mock interview?
            </h3>
            <p className="text-blush/60 text-xs sm:text-sm">
              Answer 5 questions tailored to your resume and get instant feedback.
            </p>
          </div>
        </div>
        <span className="bg-amber text-navy font-semibold rounded-xl px-5 py-2.5 text-sm
                         whitespace-nowrap transition-transform duration-300
                         group-hover:translate-x-1 flex-shrink-0 self-start sm:self-auto">
          Start interview →
        </span>
      </Link>
    </motion.div>
  );
}

function ScoreTrendChart({ trend }) {
  if (!trend || trend.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-8 sm:p-10 text-center"
      >
        <TrendingUp size={26} className="mx-auto mb-2 text-blush/30" />
        <p className="text-blush/40 text-sm">Complete an interview to start tracking your progress.</p>
      </motion.div>
    );
  }

  const width = 700;
  const height = 200;
  const padX = 24;
  const padY = 22;
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6
                 hover:border-white/20 transition-colors duration-300"
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-white font-display text-base sm:text-lg font-semibold flex items-center gap-2">
          Score progress
          {delta !== null && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${delta >= 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
              {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {Math.abs(delta)}
            </span>
          )}
        </h3>
        <span className="text-blush/50 text-xs">Last {trend.length} session{trend.length !== 1 ? "s" : ""}</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ED9E59" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ED9E59" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 2.5, 5, 7.5, 10].map((v) => {
          const y = padY + (height - padY * 2) * (1 - v / maxScore);
          return <line key={v} x1={padX} x2={width - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />;
        })}

        <path d={areaPath} fill="url(#areaFill)" style={{ opacity: 0, animation: "fadeIn 0.6s ease-out 0.4s forwards" }} />
        <path d={linePath} fill="none" stroke="#ED9E59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-draw-line" pathLength="1" />

        {points.map((p, i) => (
          <g key={i} className="group/dot" style={{ opacity: 0, animation: `fadeIn 0.4s ease-out ${0.6 + i * 0.08}s forwards` }}>
            <circle cx={p.x} cy={p.y} r="10" fill="transparent" className="cursor-pointer" />
            <circle cx={p.x} cy={p.y} r="4.5" fill="#05040a" stroke="#ED9E59" strokeWidth="2" className="transition-all duration-300 group-hover/dot:r-[7]" />
            <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
              <rect x={p.x - 20} y={p.y - 34} width="40" height="22" rx="6" fill="#1a1428" stroke="#ED9E59" strokeOpacity="0.4" />
              <text x={p.x} y={p.y - 19} textAnchor="middle" fontSize="11" fill="#ED9E59" fontWeight="600">{p.score}</text>
            </g>
          </g>
        ))}
      </svg>

      <style>{`
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes drawLine { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        .animate-draw-line { stroke-dasharray: 1; animation: drawLine 1.1s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; stroke-dashoffset: 1; }
      `}</style>
    </motion.div>
  );
}

function ResumeRow({ resume, index, onDelete }) {
  const statusStyle = {
    parsed: "bg-amber/10 text-amber",
    failed: "bg-red-400/10 text-red-300",
    uploaded: "bg-white/5 text-blush/60",
  }[resume.status] || "bg-white/5 text-blush/60";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03]
                 backdrop-blur-md px-4 sm:px-5 py-3.5 sm:py-4
                 hover:border-white/20 hover:bg-white/[0.05] transition-colors duration-300"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
          <FileText size={16} className="text-blush/60" />
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{resume.filename}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-blush/40 text-xs">{new Date(resume.uploaded_at).toLocaleDateString()}</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusStyle}`}>{resume.status}</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => onDelete(resume.id)}
        aria-label="Delete resume"
        className="text-blush/30 hover:text-red-300 transition-colors duration-200 ml-3 flex-shrink-0 p-1.5"
      >
        <Trash2 size={15} />
      </button>
    </motion.div>
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
    <div className="relative min-h-screen bg-[#05040a] overflow-x-hidden">
      <NeuralBackground />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl sticky top-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <PrepInLogo size={42} />
            <span className="font-display text-2xl font-bold tracking-tight text-white">
                Prep
                <span className="text-amber">In</span>
            </span>
        </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/profile" className="text-blush/60 hover:text-white text-sm transition-colors duration-200">
              Profile
            </Link>
            <button onClick={logout} className="text-blush/60 hover:text-white text-sm transition-colors duration-200">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {!loading && <HeroBanner user={user} stats={stats} />}

        <StartInterviewCard />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatPill label="Resumes" value={stats?.resume_count} icon={FileText} delay={0} />
            <StatPill label="Sessions" value={stats?.total_sessions} icon={Folder} delay={0.06} />
            <StatPill label="Completed" value={stats?.completed_sessions} icon={CheckCircle2} delay={0.12} />
            <StatPill label="Best score" value={stats?.best_score ? `${stats.best_score}/10` : "—"} icon={Trophy} delay={0.18} />
          </div>
        )}

        {!loading && (
          <div className="mb-8">
            <ScoreTrendChart trend={trend} />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-4 flex items-center justify-between gap-3"
        >
          <h2 className="font-display text-lg sm:text-xl font-semibold text-white">Your resumes</h2>
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04]
                       hover:bg-white/[0.08] hover:border-white/20 text-blush text-xs sm:text-sm font-medium
                       px-3.5 sm:px-4 py-2 transition-colors duration-200 flex-shrink-0"
          >
            <Upload size={14} />
            {showUpload ? "Cancel" : "Upload"}
          </button>
        </motion.div>

        <AnimatePresence>
          {showUpload && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <ResumeUpload
                onUploadSuccess={(newResume) => {
                  setResumes((prev) => [newResume, ...prev]);
                  setShowUpload(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {resumes.length === 0 && !showUpload ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 sm:py-16 rounded-2xl border border-dashed border-white/10"
          >
            <FileText size={26} className="mx-auto mb-2 text-blush/25" />
            <p className="text-blush/40 text-sm">No resumes uploaded yet.</p>
            <button onClick={() => setShowUpload(true)} className="mt-3 text-amber text-sm hover:underline underline-offset-4">
              Upload your first resume →
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {resumes.map((r, i) => (
              <ResumeRow key={r.id} resume={r} index={i} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}