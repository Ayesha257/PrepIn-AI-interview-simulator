// src/pages/Interview.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { interviewAPI } from "../services/api";

const TOTAL_QUESTIONS = 5;

export default function Interview() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("start"); // start | active | completed
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    setLoading(true);
    setError("");
    try {
      const session = await interviewAPI.createSession();
      const newSessionId = session.session_id;
      setSessionId(newSessionId);

      const first = await interviewAPI.startInterview(newSessionId);
      setQuestion(first.question);
      setQuestionNumber(1);
      setPhase("active");
    } catch (err) {
      setError(err.message || "Could not start interview.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await interviewAPI.submitAnswer(sessionId, answer);

      setLastFeedback({
        score: result.score,
        feedback: result.feedback,
      });

      if (result.status === "completed" || !result.next_question) {
        setPhase("completed");
      } else {
        setQuestion(result.next_question);
        setQuestionNumber((n) => n + 1);
        setAnswer("");
      }
    } catch (err) {
      setError(err.message || "Could not submit answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-purple/40 to-navy px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-amber">Mock Interview</h1>
          {phase === "active" && (
            <p className="text-blush/60 mt-1 text-sm">
              Question {questionNumber} of {TOTAL_QUESTIONS}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-rose/20 border border-rose/40 text-blush text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* START phase */}
        {phase === "start" && (
          <div className="bg-navy/60 border border-purple/40 rounded-2xl p-8 text-center">
            <p className="text-blush/70 mb-6">
              You'll be asked {TOTAL_QUESTIONS} questions based on your resume.
              Answer each one, then move to the next.
            </p>
            <button
              onClick={handleStart}
              disabled={loading}
              className="bg-amber hover:bg-amber/90 text-navy font-semibold
                         rounded-xl px-6 py-3 text-sm transition shadow-glow-amber
                         disabled:opacity-60"
            >
              {loading ? "Starting..." : "Start Interview"}
            </button>
          </div>
        )}

        {/* ACTIVE phase */}
        {phase === "active" && (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-purple/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber transition-all duration-500"
                style={{ width: `${(questionNumber / TOTAL_QUESTIONS) * 100}%` }}
              />
            </div>

            {/* Last feedback (if any) */}
            {lastFeedback && (
              <div className="bg-purple/20 border border-purple/40 rounded-xl px-5 py-4">
                <p className="text-amber text-sm font-semibold mb-1">
                  Previous score: {lastFeedback.score}/10
                </p>
                <p className="text-blush/70 text-sm">{lastFeedback.feedback}</p>
              </div>
            )}

            {/* Question card */}
            <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6">
              <p className="text-white text-lg leading-relaxed">{question}</p>
            </div>

            {/* Answer input */}
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              className="w-full bg-purple/20 border border-purple/50 text-white placeholder-blush/30
                         rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber
                         focus:ring-1 focus:ring-amber/50 transition resize-none"
            />

            <button
              onClick={handleSubmitAnswer}
              disabled={loading || !answer.trim()}
              className="w-full bg-amber hover:bg-amber/90 text-navy font-semibold
                         rounded-xl py-3 text-sm transition shadow-glow-amber
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Evaluating..." : "Submit Answer"}
            </button>
          </div>
        )}

        {/* COMPLETED phase */}
        {phase === "completed" && (
          <div className="bg-navy/60 border border-purple/40 rounded-2xl p-8 text-center">
            <h2 className="text-white font-display text-2xl font-semibold mb-2">
              Interview Complete 🎉
            </h2>
            <p className="text-blush/60 mb-6">
              Check your dashboard to see your score and progress.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-amber hover:bg-amber/90 text-navy font-semibold
                         rounded-xl px-6 py-3 text-sm transition shadow-glow-amber"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}