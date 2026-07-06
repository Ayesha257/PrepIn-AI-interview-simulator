import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { reportAPI } from "../services/api";
import { motion } from "framer-motion";

export default function Report() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    reportAPI
      .getReport(sessionId)
      .then((data) => setReport(data.report))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const scoreColor = (score) => {
    if (score >= 8) return "text-amber";
    if (score >= 5) return "text-blush";
    return "text-rose";
  };

  const scoreLabel = (score) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Fair";
    return "Needs Work";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy via-purple/40 to-navy flex items-center justify-center">
        <p className="text-blush/40 animate-pulse">Generating your report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy via-purple/40 to-navy flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-amber text-sm hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-purple/40 to-navy px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-amber mb-1">
            Interview Report
          </h1>
          <p className="text-blush/50 text-sm">Here's how you did</p>
        </div>

        {/* Overall Score */}
        <div className="bg-navy/60 border border-purple/40 rounded-2xl p-8 text-center">
          <p className="text-blush/60 text-sm uppercase tracking-wider mb-2">
            Overall Score
          </p>
          <p
            className={`font-display text-7xl font-bold ${scoreColor(report.overall_score)}`}
          >
            {report.overall_score}
          </p>
          <p className="text-white/40 text-sm mt-1">/ 10</p>
          <span
            className={`inline-block mt-3 text-xs font-semibold px-4 py-1.5 rounded-full
                           bg-purple/30 border border-purple/50 ${scoreColor(report.overall_score)}`}
          >
            {scoreLabel(report.overall_score)}
          </span>
        </div>

        {/* Role readiness */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl p-6 border ${
            report.ready_for_role
              ? "bg-amber/10 border-amber/40"
              : "bg-purple/20 border-purple/40"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {report.ready_for_role ? "✅" : "🎯"}
            </span>
            <div>
              <p
                className={`font-semibold text-sm ${report.ready_for_role ? "text-amber" : "text-blush"}`}
              >
                {report.ready_for_role
                  ? `Ready for ${report.target_role} role`
                  : `Not quite ready for ${report.target_role} yet`}
              </p>
              <p className="text-blush/60 text-xs mt-0.5">
                {report.readiness_note}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Summary */}
        {report.summary && (
          <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6">
            <h2 className="text-white font-display text-lg font-semibold mb-3">
              📋 Summary
            </h2>
            <p className="text-blush/70 text-sm leading-relaxed">
              {report.summary}
            </p>
          </div>
        )}

        {/* Strengths */}
        {report.strengths?.length > 0 && (
          <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6">
            <h2 className="text-white font-display text-lg font-semibold mb-4">
              💪 Strengths
            </h2>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-amber mt-0.5">✓</span>
                  <p className="text-blush/70 text-sm">{s}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weak Areas */}
        {report.weak_areas?.length > 0 && (
          <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6">
            <h2 className="text-white font-display text-lg font-semibold mb-4">
              ⚠️ Areas to Improve
            </h2>
            <ul className="space-y-2">
              {report.weak_areas.map((w, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-rose mt-0.5">✗</span>
                  <p className="text-blush/70 text-sm">{w}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {report.suggestions?.length > 0 && (
          <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6">
            <h2 className="text-white font-display text-lg font-semibold mb-4">
              🚀 Suggestions
            </h2>
            <ul className="space-y-2">
              {report.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-purple/80 mt-0.5">→</span>
                  <p className="text-blush/70 text-sm">{s}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pb-6">
          <button
            onClick={() => navigate("/interview")}
            className="flex-1 bg-amber hover:bg-amber/90 text-navy font-semibold
                       rounded-xl py-3 text-sm transition shadow-glow-amber"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 bg-purple/40 hover:bg-purple/60 text-white font-semibold
                       rounded-xl py-3 text-sm transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
