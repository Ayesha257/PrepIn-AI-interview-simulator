import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { interviewAPI } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

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

  const typewriterSpeak = (text, setText, shouldSpeak = true) => {
    return new Promise((resolve) => {
      const words = text.split(" ");
      let currentIndex = 0;
      setText("");

      if (!shouldSpeak) {
        // Just typewriter, no TTS
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
      const utterance = new SpeechSynthesisUtterance(text);

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
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Your browser doesn't support voice input. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setAnswer(transcript);
    };

    recognition.onerror = (e) => {
      if (e.error === "network") {
        setTimeout(() => {
          if (isListeningRef.current) startListening();
        }, 500);
      } else if (e.error === "no-speech" || e.error === "aborted") {
        // ignore
      } else {
        setError("Mic error: " + e.error);
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        recognition.start(); // auto restart
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    isListeningRef.current = true;
    setIsListening(true);
  };

  const stopListening = () => {
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleStart = async () => {
    setLoading(true);
    setError("");
    try {
      const session = await interviewAPI.createSession(
        targetRole,
        seniorityLevel,
      );
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
    setLastFeedback(null);
    setPhase("active");
    await typewriterSpeak(
      nextQuestionData.next_question,
      setDisplayedQuestion,
      true,
    );
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
    setLastFeedback(null);
    setPhase("active");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-purple/40 to-navy px-4 py-10 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl font-bold text-amber">
            Mock Interview
          </h1>
          {(phase === "active" || phase === "feedback") && (
            <p className="text-blush/60 mt-1 text-sm">
              Question {questionNumber}
            </p>
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose/20 border border-rose/40 text-blush text-sm rounded-lg px-4 py-3 mb-6"
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
              className="space-y-6"
            >
              {/* Role input */}
              <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6">
                <h2 className="text-white font-display text-lg font-semibold mb-1">
                  What role are you applying for?
                </h2>
                <p className="text-blush/50 text-xs mb-4">
                  Be specific — e.g. "Backend Developer", "ML Engineer",
                  "Frontend Intern"
                </p>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Backend Developer"
                  className="w-full bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                   rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber
                   focus:ring-1 focus:ring-amber/50 transition"
                />
              </div>

              {/* Seniority level */}
              <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6">
                <h2 className="text-white font-display text-lg font-semibold mb-4">
                  What level are you applying for?
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {["Intern", "Junior", "Mid-Level", "Senior"].map((level) => (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSeniorityLevel(level)}
                      className={`rounded-xl py-3 px-4 text-sm font-medium border transition-all
              ${
                seniorityLevel === level
                  ? "border-amber bg-amber/10 text-amber shadow-lg shadow-amber/20"
                  : "border-purple/40 bg-navy/40 text-blush/70 hover:border-purple/70"
              }`}
                    >
                      {level}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Answer mode */}
              <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6">
                <h2 className="text-white font-display text-lg font-semibold mb-4">
                  How would you like to answer?
                </h2>
                <div className="flex gap-4">
                  {[
                    {
                      mode: "speak",
                      icon: "🎙️",
                      label: "Speak",
                      sub: "Use your microphone",
                    },
                    {
                      mode: "type",
                      icon: "⌨️",
                      label: "Type",
                      sub: "Write your answer",
                    },
                  ].map(({ mode, icon, label, sub }) => (
                    <motion.button
                      key={mode}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setAnswerMode(mode)}
                      className={`flex-1 rounded-2xl p-5 border transition-all duration-300 text-center
              ${
                answerMode === mode
                  ? "border-amber bg-amber/10 shadow-lg shadow-amber/20"
                  : "border-purple/40 bg-navy/40 hover:border-purple/70"
              }`}
                    >
                      <div className="text-3xl mb-2">{icon}</div>
                      <p className="text-white font-semibold text-sm">
                        {label}
                      </p>
                      <p className="text-blush/50 text-xs mt-1">{sub}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <motion.button
                onClick={handleStart}
                disabled={
                  !answerMode ||
                  !targetRole.trim() ||
                  !seniorityLevel ||
                  loading
                }
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 0 20px rgba(237,158,89,0.4)",
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-amber hover:bg-amber/90 text-navy font-semibold
                 rounded-xl px-6 py-3 text-sm transition shadow-glow-amber
                 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Starting..." : "Begin Interview →"}
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
              className="space-y-6"
            >
              {/* Question counter */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-blush/60 text-sm">
                  Question {questionNumber}
                </p>
                <p className="text-blush/40 text-xs">Answer to continue</p>
              </div>

              {/* Sphere */}
              <div className="flex justify-center py-4">
                <div className="relative flex items-center justify-center">
                  {isSpeaking && (
                    <>
                      <motion.div
                        className="absolute w-40 h-40 rounded-full border border-amber/20"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute w-32 h-32 rounded-full border border-amber/30"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{
                          duration: 2,
                          delay: 0.3,
                          repeat: Infinity,
                        }}
                      />
                      <motion.div
                        className="absolute w-24 h-24 rounded-full border border-amber/40"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{
                          duration: 2,
                          delay: 0.6,
                          repeat: Infinity,
                        }}
                      />
                    </>
                  )}
                  <motion.div
                    className={`w-20 h-20 rounded-full flex items-center justify-center
                      ${
                        isSpeaking
                          ? "bg-gradient-to-br from-amber/80 to-purple/80"
                          : "bg-gradient-to-br from-purple/60 to-navy border border-purple/40"
                      }`}
                    animate={
                      isSpeaking ? { scale: [1, 1.05, 1] } : { scale: 1 }
                    }
                    transition={{
                      duration: 0.5,
                      repeat: isSpeaking ? Infinity : 0,
                    }}
                  >
                    <div className="flex gap-1 items-end h-8">
                      {[3, 6, 4, 7, 3, 5, 4].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-white rounded-full"
                          animate={
                            isSpeaking
                              ? {
                                  height: [
                                    `${h * 2}px`,
                                    `${h * 4}px`,
                                    `${h * 2}px`,
                                  ],
                                }
                              : { height: "4px" }
                          }
                          transition={{
                            duration: 0.4 + i * 0.1,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Question */}
              <motion.div
                className="bg-navy/60 border border-purple/40 rounded-2xl p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-white text-lg leading-relaxed min-h-[2rem]">
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
                    onClick={() =>
                      typewriterSpeak(question, setDisplayedQuestion, true)
                    }
                    disabled={isSpeaking}
                    className="flex-shrink-0 bg-purple/40 hover:bg-purple/60 text-blush
                               rounded-xl px-3 py-2 text-xs transition disabled:opacity-40"
                  >
                    {isSpeaking ? "🔊" : "🔁 Replay"}
                  </button>
                </div>
              </motion.div>

              {/* Answer area */}
              <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6 min-h-[140px]">
                <p className="text-blush/40 text-xs mb-3 uppercase tracking-wider">
                  Your Answer
                </p>
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
              <div className="flex gap-4">
                {answerMode === "speak" && (
                  <motion.button
                    onClick={isListening ? stopListening : startListening}
                    disabled={loading || isSpeaking}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-2 font-semibold
                               rounded-xl py-3 text-sm transition
                               ${
                                 isListening
                                   ? "bg-rose/80 text-white"
                                   : "bg-purple/40 hover:bg-purple/60 text-white"
                               } disabled:opacity-60`}
                  >
                    {isListening ? "🎙️ Stop" : "🎙️ Record"}
                  </motion.button>
                )}

                <motion.button
                  onClick={handleSubmitAnswer}
                  disabled={loading || !answer.trim() || isSpeaking}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 20px rgba(237,158,89,0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-amber hover:bg-amber/90 text-navy font-semibold
                             rounded-xl py-3 text-sm transition shadow-glow-amber
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Evaluating..." : "Submit Answer →"}
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
              className="space-y-6"
            >
              {/* Score */}
              <div className="bg-navy/60 border border-purple/40 rounded-2xl p-6 text-center">
                <p className="text-blush/60 text-xs uppercase tracking-wider mb-2">
                  Score
                </p>
                <motion.p
                  className={`font-display text-6xl font-bold ${
                    lastFeedback?.score >= 7
                      ? "text-amber"
                      : lastFeedback?.score >= 4
                        ? "text-blush"
                        : "text-rose"
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
                  className="bg-purple/20 border border-purple/40 rounded-2xl p-6"
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
                <div className="grid grid-cols-3 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleListenFeedback}
                    disabled={isSpeaking}
                    className="bg-purple/40 hover:bg-purple/60 border border-purple/50
                               text-white rounded-xl py-3 px-3 text-xs font-medium transition
                               disabled:opacity-40"
                  >
                    🔊 Listen
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleReadFeedback}
                    disabled={isSpeaking}
                    className="bg-purple/40 hover:bg-purple/60 border border-purple/50
                               text-white rounded-xl py-3 px-3 text-xs font-medium transition
                               disabled:opacity-40"
                  >
                    📖 Read
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSkipToNext}
                    className="bg-purple/40 hover:bg-purple/60 border border-purple/50
                               text-white rounded-xl py-3 px-3 text-xs font-medium transition"
                  >
                    ⏭️ Skip
                  </motion.button>
                </div>
              )}

              {/* Next question button — shows after feedback is displayed */}
              {displayedFeedback && !isSpeaking && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 20px rgba(237,158,89,0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextQuestion}
                  className="w-full bg-amber hover:bg-amber/90 text-navy font-semibold
                             rounded-xl py-3 text-sm transition shadow-glow-amber"
                >
                  {nextQuestionData ? "Next Question →" : "View Report →"}
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
              className="bg-navy/60 border border-purple/40 rounded-2xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="text-5xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-white font-display text-2xl font-semibold mb-2">
                Interview Complete!
              </h2>
              <p className="text-blush/60 mb-6">Your report is ready.</p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 0 20px rgba(237,158,89,0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/report/${sessionId}`)}
                  className="bg-amber hover:bg-amber/90 text-navy font-semibold
                             rounded-xl px-6 py-3 text-sm transition shadow-glow-amber"
                >
                  View Report
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/dashboard")}
                  className="bg-purple/40 hover:bg-purple/60 text-white font-semibold
                             rounded-xl px-6 py-3 text-sm transition"
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
