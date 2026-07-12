import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { interviewAPI } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Keyboard, Volume2, RotateCcw, BookOpen, SkipForward, PartyPopper } from "lucide-react";

// ---------- Neural network canvas background ----------
function NeuralBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf, w, h;
    const NODE_COUNT = 50;
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
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.3 + 0.6,
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
          if (d < 115) {
            ctx.strokeStyle = `rgba(237,158,89,${0.07 * (1 - d / 115)})`;
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
        ctx.fillStyle = "rgba(233,140,185,0.3)";
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

export default function Interview() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("setup"); // setup | active | feedback | completed
  const [answerMode, setAnswerMode] = useState(null); // "type" | "speak"
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState("");
  const [displayedQuestion, setDisplayedQuestion] = useState("");
  const [displayedFeedback, setDisplayedFeedback] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [nextQuestionData, setNextQuestionData] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [seniorityLevel, setSeniorityLevel] = useState(null);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const utteranceRef = useRef(null);
  const baseAnswerRef = useRef(""); // text already recorded/typed before the current recording segment

  const typewriterSpeak = (text, setText, shouldSpeak = true) => {
    return new Promise((resolve) => {
      const words = text.split(" ");
      let currentIndex = 0;
      setText("");

      if (!shouldSpeak) {
        const interval = setInterval(() => {
          currentIndex++;
          setText(words.slice(0, currentIndex).join(" "));
          if (currentIndex >= words.length) {
            clearInterval(interval);
            resolve();
          }
        }, 60);
        return;
      }

      window.speechSynthesis.cancel();

      // Small delay after cancel — Chrome can silently drop the next
      // speak() call if it's fired in the same tick as cancel()
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance; // keep a strong reference — prevents GC mid-speech

        const setVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find(
            (v) =>
              v.name === "Google UK English Female" ||
              v.name === "Google UK English Male" ||
              v.name === "Google US English" ||
              v.name.includes("Samantha") ||
              v.name.includes("Daniel") ||
              v.name.includes("Karen"),
          );
          if (preferred) utterance.voice = preferred;
        };

        if (window.speechSynthesis.getVoices().length > 0) {
          setVoice();
        } else {
          window.speechSynthesis.onvoiceschanged = setVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1;

        utterance.onboundary = (event) => {
          if (event.name === "word") {
            currentIndex++;
            setText(words.slice(0, currentIndex).join(" "));
          }
        };

        utterance.onstart = () => setIsSpeaking(true);

        utterance.onend = () => {
          setText(text);
          setIsSpeaking(false);
          utteranceRef.current = null;
          resolve();
        };

        // If speech errors out, the promise used to hang forever, silently
        // leaving the UI stuck — now it falls back to plain text instead.
        utterance.onerror = () => {
          setText(text);
          setIsSpeaking(false);
          utteranceRef.current = null;
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      }, 50);
    });
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Your browser doesn't support voice input. Try Chrome.");
      return;
    }

    // Clean up any previous recognition instance completely before starting a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    // Preserve whatever text already exists (typed or from a previous
    // recording segment) so the new segment appends instead of overwriting
    baseAnswerRef.current = answer.trim();

    isListeningRef.current = true;
    setIsListening(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const newTranscript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");

      const combined = baseAnswerRef.current
        ? `${baseAnswerRef.current} ${newTranscript}`
        : newTranscript;

      setAnswer(combined);
    };

    recognition.onerror = (e) => {
      if (e.error === "aborted" || e.error === "no-speech") return;
      if (e.error === "network") {
        setTimeout(() => {
          if (isListeningRef.current) {
            try {
              recognitionRef.current?.start();
            } catch {}
          }
        }, 500);
        return;
      }
      setError("Mic error: " + e.error);
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognitionRef.current?.start();
        } catch {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {}
  };

  const stopListening = () => {
    isListeningRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  };

  const handleStart = async () => {
    setLoading(true);
    setError("");
    try {
      const session = await interviewAPI.createSession(targetRole, seniorityLevel);
      const newSessionId = session.session_id;
      setSessionId(newSessionId);
      const first = await interviewAPI.startInterview(newSessionId);
      setQuestion(first.question);
      setQuestionNumber(1);
      setPhase("active");
      await typewriterSpeak(first.question, setDisplayedQuestion, true);
    } catch (err) {
      setError(err.message || "Could not start interview.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    stopListening();
    window.speechSynthesis.cancel();
    setLoading(true);
    setError("");
    try {
      const result = await interviewAPI.submitAnswer(sessionId, answer);
      setLastFeedback({ score: result.score, feedback: result.feedback });
      setDisplayedFeedback("");

      if (result.status === "completed" || !result.next_question) {
        setNextQuestionData(null);
      } else {
        setNextQuestionData(result);
      }

      setPhase("feedback");
    } catch (err) {
      setError(err.message || "Could not submit answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleListenFeedback = async () => {
    await typewriterSpeak(lastFeedback.feedback, setDisplayedFeedback, true);
  };

  const handleReadFeedback = async () => {
    await typewriterSpeak(lastFeedback.feedback, setDisplayedFeedback, false);
  };

  const handleNextQuestion = async () => {
    if (!nextQuestionData) {
      setPhase("completed");
      return;
    }
    window.speechSynthesis.cancel();
    setQuestion(nextQuestionData.next_question);
    setDisplayedQuestion("");
    setDisplayedFeedback("");
    setQuestionNumber((n) => n + 1);
    setAnswer("");
    baseAnswerRef.current = "";
    setLastFeedback(null);
    setPhase("active");
    await typewriterSpeak(nextQuestionData.next_question, setDisplayedQuestion, true);
  };

  const handleSkipToNext = () => {
    if (!nextQuestionData) {
      setPhase("completed");
      return;
    }
    window.speechSynthesis.cancel();
    setQuestion(nextQuestionData.next_question);
    setDisplayedQuestion(nextQuestionData.next_question);
    setDisplayedFeedback("");
    setQuestionNumber((n) => n + 1);
    setAnswer("");
    baseAnswerRef.current = "";
    setLastFeedback(null);
    setPhase("active");
  };

  return (
    <div className="relative min-h-screen bg-[#05040a] px-4 py-8 sm:py-10 overflow-x-hidden">
      <NeuralBackground />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-amber">Mock Interview</h1>
          {(phase === "active" || phase === "feedback") && (
            <p className="text-blush/60 mt-1 text-sm">Question {questionNumber}</p>
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3 mb-6"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* SETUP */}
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-5 sm:space-y-6"
            >
              {/* Role input */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6">
                <h2 className="text-white font-display text-base sm:text-lg font-semibold mb-1">
                  What role are you applying for?
                </h2>
                <p className="text-blush/50 text-xs mb-4">
                  Be specific — e.g. "Backend Developer", "ML Engineer", "Frontend Intern"
                </p>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Backend Developer"
                  className="w-full bg-white/[0.04] border border-white/10 text-white placeholder-blush/30
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber/50
                             focus:ring-2 focus:ring-amber/10 transition-all duration-200"
                />
              </div>

              {/* Seniority level */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6">
                <h2 className="text-white font-display text-base sm:text-lg font-semibold mb-4">
                  What level are you applying for?
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {["Intern", "Junior", "Mid-Level", "Senior"].map((level) => (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSeniorityLevel(level)}
                      className={`rounded-xl py-3 px-4 text-sm font-medium border transition-all duration-200
                        ${
                          seniorityLevel === level
                            ? "border-amber/50 bg-amber/10 text-amber"
                            : "border-white/10 bg-white/[0.02] text-blush/70 hover:border-white/25"
                        }`}
                    >
                      {level}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Answer mode */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6">
                <h2 className="text-white font-display text-base sm:text-lg font-semibold mb-4">
                  How would you like to answer?
                </h2>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {[
                    { mode: "speak", icon: Mic, label: "Speak", sub: "Use your microphone" },
                    { mode: "type", icon: Keyboard, label: "Type", sub: "Write your answer" },
                  ].map(({ mode, icon: Icon, label, sub }) => (
                    <motion.button
                      key={mode}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setAnswerMode(mode)}
                      className={`flex-1 rounded-2xl p-5 border transition-all duration-200 text-center
                        ${
                          answerMode === mode
                            ? "border-amber/50 bg-amber/10"
                            : "border-white/10 bg-white/[0.02] hover:border-white/25"
                        }`}
                    >
                      <Icon size={24} className={`mx-auto mb-2 ${answerMode === mode ? "text-amber" : "text-blush/50"}`} />
                      <p className="text-white font-semibold text-sm">{label}</p>
                      <p className="text-blush/50 text-xs mt-1">{sub}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <motion.button
                onClick={handleStart}
                disabled={!answerMode || !targetRole.trim() || !seniorityLevel || loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-amber hover:bg-amber/90 text-navy font-semibold
                           rounded-xl px-6 py-3 text-sm transition-shadow duration-300
                           hover:shadow-[0_0_24px_rgba(237,158,89,0.35)]
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Starting..." : "Begin interview →"}
              </motion.button>
            </motion.div>
          )}

          {/* ACTIVE — question + answer */}
          {phase === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-5 sm:space-y-6"
            >
              {/* Question counter */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-blush/60 text-sm">Question {questionNumber}</p>
                <p className="text-blush/40 text-xs hidden sm:block">Answer to continue</p>
              </div>

              {/* Sphere */}
              <div className="flex justify-center py-2 sm:py-4">
                <div className="relative flex items-center justify-center">
                  {isSpeaking && (
                    <>
                      <motion.div
                        className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-amber/20"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute w-26 h-26 sm:w-32 sm:h-32 rounded-full border border-amber/30"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, delay: 0.3, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-amber/40"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, delay: 0.6, repeat: Infinity }}
                      />
                    </>
                  )}
                  <motion.div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center
                      ${
                        isSpeaking
                          ? "bg-gradient-to-br from-amber/80 to-rose/60"
                          : "bg-white/[0.04] border border-white/10"
                      }`}
                    animate={isSpeaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
                  >
                    <div className="flex gap-1 items-end h-6 sm:h-8">
                      {[3, 6, 4, 7, 3, 5, 4].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-white rounded-full"
                          animate={
                            isSpeaking
                              ? { height: [`${h * 2}px`, `${h * 4}px`, `${h * 2}px`] }
                              : { height: "4px" }
                          }
                          transition={{ duration: 0.4 + i * 0.1, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Question */}
              <motion.div
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-white text-base sm:text-lg leading-relaxed min-h-[2rem]">
                    {displayedQuestion}
                    {isSpeaking && (
                      <motion.span
                        className="text-amber"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        |
                      </motion.span>
                    )}
                  </p>
                  <button
                    onClick={() => typewriterSpeak(question, setDisplayedQuestion, true)}
                    disabled={isSpeaking}
                    aria-label="Replay question"
                    className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-white/10
                               bg-white/[0.04] hover:bg-white/[0.08] text-blush/70
                               px-2.5 sm:px-3 py-2 text-xs transition-colors duration-200 disabled:opacity-40"
                  >
                    {isSpeaking ? <Volume2 size={14} /> : <RotateCcw size={14} />}
                    <span className="hidden sm:inline">{isSpeaking ? "" : "Replay"}</span>
                  </button>
                </div>
              </motion.div>

              {/* Answer area */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6 min-h-[140px]">
                <p className="text-blush/40 text-xs mb-3 uppercase tracking-wider">Your answer</p>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={
                    answerMode === "speak"
                      ? "Your spoken answer appears here — click to edit if needed..."
                      : "Type your answer here..."
                  }
                  rows={4}
                  className="w-full bg-transparent text-white/80 text-sm leading-relaxed
                             placeholder-blush/30 focus:outline-none resize-none"
                />
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {answerMode === "speak" && (
                  <motion.button
                    onClick={isListening ? stopListening : startListening}
                    disabled={loading || isSpeaking}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-2 font-semibold
                               rounded-xl py-3 text-sm transition-colors duration-200
                               ${
                                 isListening
                                   ? "bg-red-500/80 text-white"
                                   : "bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10"
                               } disabled:opacity-60`}
                  >
                    <Mic size={15} />
                    {isListening ? "Stop" : "Record"}
                  </motion.button>
                )}

                <motion.button
                  onClick={handleSubmitAnswer}
                  disabled={loading || !answer.trim() || isSpeaking}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-amber hover:bg-amber/90 text-navy font-semibold
                             rounded-xl py-3 text-sm transition-shadow duration-300
                             hover:shadow-[0_0_24px_rgba(237,158,89,0.35)]
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Evaluating..." : "Submit answer →"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* FEEDBACK phase */}
          {phase === "feedback" && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-5 sm:space-y-6"
            >
              {/* Score */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 text-center">
                <p className="text-blush/60 text-xs uppercase tracking-wider mb-2">Score</p>
                <motion.p
                  className={`font-display text-5xl sm:text-6xl font-bold ${
                    lastFeedback?.score >= 7
                      ? "text-amber"
                      : lastFeedback?.score >= 4
                        ? "text-blush"
                        : "text-red-300"
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  {lastFeedback?.score}
                </motion.p>
                <p className="text-white/40 text-sm mt-1">/ 10</p>
              </div>

              {/* Feedback text */}
              {displayedFeedback && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 sm:p-6"
                >
                  <p className="text-blush/70 text-sm leading-relaxed">
                    {displayedFeedback}
                    {isSpeaking && (
                      <motion.span
                        className="text-amber"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        |
                      </motion.span>
                    )}
                  </p>
                </motion.div>
              )}

              {/* Feedback options */}
              {!displayedFeedback && (
                <div className="space-y-3">
                  <p className="text-white/70 text-sm text-center">Would you like feedback on your answer?</p>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleListenFeedback}
                      disabled={isSpeaking}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10
                                 bg-white/[0.04] hover:bg-white/[0.08] text-white
                                 py-3 px-2 text-xs font-medium transition-colors duration-200 disabled:opacity-40"
                    >
                      <Volume2 size={16} className="text-blush/70" />
                      Listen
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleReadFeedback}
                      disabled={isSpeaking}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10
                                 bg-white/[0.04] hover:bg-white/[0.08] text-white
                                 py-3 px-2 text-xs font-medium transition-colors duration-200 disabled:opacity-40"
                    >
                      <BookOpen size={16} className="text-blush/70" />
                      Read
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSkipToNext}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10
                                 bg-white/[0.04] hover:bg-white/[0.08] text-white
                                 py-3 px-2 text-xs font-medium transition-colors duration-200"
                    >
                      <SkipForward size={16} className="text-blush/70" />
                      Skip
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Next question button */}
              {displayedFeedback && !isSpeaking && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextQuestion}
                  className="w-full bg-amber hover:bg-amber/90 text-navy font-semibold
                             rounded-xl py-3 text-sm transition-shadow duration-300
                             hover:shadow-[0_0_24px_rgba(237,158,89,0.35)]"
                >
                  {nextQuestionData ? "Next question →" : "View report →"}
                </motion.button>
              )}
            </motion.div>
          )}

          {/* COMPLETED */}
          {phase === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6 sm:p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mb-4 flex justify-center"
              >
                <PartyPopper size={44} className="text-amber" />
              </motion.div>
              <h2 className="text-white font-display text-xl sm:text-2xl font-semibold mb-2">
                Interview complete!
              </h2>
              <p className="text-blush/60 mb-6 text-sm">Your report is ready.</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/report/${sessionId}`)}
                  className="bg-amber hover:bg-amber/90 text-navy font-semibold
                             rounded-xl px-6 py-3 text-sm transition-shadow duration-300
                             hover:shadow-[0_0_24px_rgba(237,158,89,0.35)]"
                >
                  View report
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/dashboard")}
                  className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold
                             rounded-xl px-6 py-3 text-sm transition-colors duration-200"
                >
                  Dashboard
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}