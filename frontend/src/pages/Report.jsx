import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { reportAPI } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ChevronDown, CheckCircle2, AlertCircle, Lightbulb, FileText, RotateCcw, LayoutDashboard } from "lucide-react";

function NeuralBackground() {
  const canvasRef = useRef(null);
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
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.4 + 0.7,
    }));
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
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
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(233,140,185,0.35)"; ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function ScoreRing({ score = 0, size = 120 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score / 10, 0), 1);
  const offset = circumference * (1 - pct);
  const color = score >= 8 ? "#ED9E59" : score >= 5 ? "#E98CB9" : "#e57373";

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference}
          style={{ animation: `ringFill 1.4s cubic-bezier(0.16,1,0.3,1) 0.3s forwards`, filter: `drop-shadow(0 0 8px ${color}66)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-white font-display font-bold text-3xl leading-none">{score ?? "—"}</span>
        <span className="text-blush/40 text-xs mt-1">/ 10</span>
      </div>
      <style>{`@keyframes ringFill { to { stroke-dashoffset: ${offset}; } }`}</style>
    </div>
  );
}

export default function Report() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    reportAPI.getReport(sessionId)
      .then((data) => setReport(data.report))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const scoreLabel = (score) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Fair";
    return "Needs Work";
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#05040a] flex items-center justify-center">
        <NeuralBackground />
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-amber/30 border-t-amber animate-spin mx-auto mb-4" />
          <p className="text-blush/40 text-sm animate-pulse">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-[#05040a] flex items-center justify-center">
        <NeuralBackground />
        <div className="relative z-10 text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={() => navigate("/dashboard")} className="text-amber text-sm hover:underline underline-offset-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05040a] overflow-x-hidden">
      <NeuralBackground />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-white/[0.02] backdrop-blur-xl sticky top-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-amber">PrepIn</span>
          <button onClick={() => navigate("/dashboard")} className="text-blush/60 hover:text-white text-sm transition-colors duration-200 flex items-center gap-1.5">
            <LayoutDashboard size={14} /> Dashboard
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-3xl font-bold text-white mb-1">Interview Report</h1>
          <p className="text-blush/50 text-sm">Here's a breakdown of your performance</p>
        </motion.div>

        {/* Score card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 sm:p-8"
        >
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 bg-amber/10 rounded-full blur-3xl" />
          <div className="flex items-center gap-6 sm:gap-8">
            <ScoreRing score={report.overall_score} />
            <div>
              <p className="text-blush/50 text-xs uppercase tracking-wider mb-1">Overall Score</p>
              <p className="text-white font-display text-2xl font-bold">{scoreLabel(report.overall_score)}</p>
              <p className="text-blush/40 text-xs mt-1">{report.seniority_level} · {report.target_role}</p>
              {report.end_reason && (
                <span className="inline-block mt-2 text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.04] text-blush/50">
                  {report.end_reason === "performing_well" ? "🌟 Ended early — great performance" :
                   report.end_reason === "struggling" ? "📈 Ended early — room to grow" :
                   "✅ Completed all questions"}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Role readiness */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className={`rounded-2xl p-5 border flex items-center gap-3 ${
            report.ready_for_role ? "bg-amber/[0.06] border-amber/20" : "bg-white/[0.03] border-white/10"
          }`}
        >
          <span className="text-2xl flex-shrink-0">{report.ready_for_role ? "✅" : "🎯"}</span>
          <div>
            <p className={`font-semibold text-sm ${report.ready_for_role ? "text-amber" : "text-blush"}`}>
              {report.ready_for_role ? `Ready for ${report.target_role} role` : `Not quite ready for ${report.target_role} yet`}
            </p>
            <p className="text-blush/50 text-xs mt-0.5">{report.readiness_note}</p>
          </div>
        </motion.div>

        {/* Summary */}
        {report.summary && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6"
          >
            <h2 className="text-white font-display text-base font-semibold mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-amber" /> Summary
            </h2>
            <p className="text-blush/60 text-sm leading-relaxed">{report.summary}</p>
          </motion.div>
        )}

        {/* Strengths */}
        {report.strengths?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6"
          >
            <h2 className="text-white font-display text-base font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-amber" /> Strengths
            </h2>
            <ul className="space-y-2.5">
              {report.strengths.map((s, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber mt-1.5 flex-shrink-0" />
                  <p className="text-blush/70 text-sm">{s}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Weak Areas */}
        {report.weak_areas?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6"
          >
            <h2 className="text-white font-display text-base font-semibold mb-4 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose" /> Areas to Improve
            </h2>
            <ul className="space-y-2.5">
              {report.weak_areas.map((w, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose mt-1.5 flex-shrink-0" />
                  <p className="text-blush/70 text-sm">{w}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Suggestions */}
        {report.suggestions?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6"
          >
            <h2 className="text-white font-display text-base font-semibold mb-4 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber" /> Suggestions
            </h2>
            <ul className="space-y-2.5">
              {report.suggestions.map((s, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                  <p className="text-blush/70 text-sm">{s}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Question Review */}
        {report.questions?.filter(q => q.answer).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6"
          >
            <button onClick={() => setShowReview(!showReview)} className="w-full flex items-center justify-between">
              <h2 className="text-white font-display text-base font-semibold flex items-center gap-2">
                <FileText size={16} className="text-blush/60" /> Question Review
              </h2>
              <motion.div animate={{ rotate: showReview ? 180 : 0 }} transition={{ duration: 0.3 }}>
                <ChevronDown size={18} className="text-blush/40" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showReview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 mt-4">
                    {report.questions.filter(q => q.answer).map((q, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-blush/40 text-xs uppercase tracking-wider">Question {i + 1}</p>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            q.score >= 7 ? "bg-amber/15 text-amber" :
                            q.score >= 4 ? "bg-blush/15 text-blush" :
                            "bg-red-400/15 text-red-300"
                          }`}>
                            {q.score}/10
                          </span>
                        </div>
                        <p className="text-white/80 text-sm font-medium">{q.question}</p>
                        <p className="text-blush/40 text-xs">Your answer:</p>
                        <p className="text-blush/60 text-sm italic">"{q.answer}"</p>
                        {q.feedback && (
                          <p className="text-blush/50 text-xs border-t border-white/10 pt-2 mt-2">
                            💬 {q.feedback}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex gap-3 pb-8"
        >
          <button onClick={() => navigate("/interview")}
            className="flex-1 flex items-center justify-center gap-2 bg-amber hover:bg-amber/90 text-navy font-semibold
                       rounded-xl py-3 text-sm transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(237,158,89,0.3)]"
          >
            <RotateCcw size={15} /> Try Again
          </button>
          <button onClick={() => navigate("/dashboard")}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04]
                       hover:bg-white/[0.08] text-blush font-semibold py-3 text-sm transition-colors duration-200"
          >
            <LayoutDashboard size={15} /> Dashboard
          </button>
        </motion.div>

      </main>
    </div>
  );
}