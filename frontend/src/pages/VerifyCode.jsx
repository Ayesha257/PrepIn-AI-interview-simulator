// src/pages/VerifyCode.jsx
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Loader2, Check, ShieldCheck, Sparkles } from "lucide-react";
import { authAPI } from "../services/api";

// ---------- Neural network canvas background (same as Register/Login) ----------
function NeuralBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf, w, h;
    const NODE_COUNT = 40;
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
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.5 + 0.8,
    }));

    function onMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener("mousemove", onMove);

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const dx = mouseRef.current.x - n.x;
        const dy = mouseRef.current.y - n.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          n.x -= dx * 0.004;
          n.y -= dy * 0.004;
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(237,158,89,${0.12 * (1 - d / 130)})`;
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
        ctx.fillStyle = "rgba(233,140,185,0.5)";
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

function CursorSpotlight() {
  const ref = useRef(null);
  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;
    function onMove(e) {
      if (ref.current) {
        ref.current.style.setProperty("--x", `${e.clientX}px`);
        ref.current.style.setProperty("--y", `${e.clientY}px`);
      }
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-0 hidden sm:block"
      style={{ background: "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(237,158,89,0.05), transparent 70%)" }}
    />
  );
}

function ScanLine() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 h-full overflow-hidden z-0">
      <div className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-amber/[0.04] to-transparent animate-scan" />
      <style>{`
        @keyframes scan { 0% { transform: translateY(-30%); } 100% { transform: translateY(130%); } }
        .animate-scan { animation: scan 7s linear infinite; }
      `}</style>
    </div>
  );
}

function MagneticButton({ children, className, disabled, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });
  const [ripples, setRipples] = useState([]);

  function onMove(e) {
    if (window.matchMedia("(hover: none)").matches) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * 0.12);
    y.set((e.clientY - (rect.top + rect.height / 2)) * 0.25);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }
  function onClick(e) {
    const rect = ref.current.getBoundingClientRect();
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      disabled={disabled}
      className={`relative overflow-hidden ${className} ${!disabled ? "animate-breathe" : ""}`}
      {...props}
    >
      {ripples.map((r) => (
        <span key={r.id} className="absolute rounded-full bg-white/40 pointer-events-none animate-ripple" style={{ left: r.x, top: r.y, width: 10, height: 10, marginLeft: -5, marginTop: -5 }} />
      ))}
      {children}
      <style>{`
        @keyframes breathe { 0%, 100% { box-shadow: 0 0 20px rgba(237,158,89,0.25); } 50% { box-shadow: 0 0 34px rgba(237,158,89,0.45); } }
        .animate-breathe { animation: breathe 2.6s ease-in-out infinite; }
        @keyframes ripple { from { transform: scale(0); opacity: 0.6; } to { transform: scale(18); opacity: 0; } }
        .animate-ripple { animation: ripple 0.6s ease-out forwards; }
      `}</style>
    </motion.button>
  );
}

export default function VerifyCode() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const panelRef = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 20 });
  const sry = useSpring(ry, { stiffness: 150, damping: 20 });

  function handlePanelMove(e) {
    if (window.innerWidth < 1280 || window.matchMedia("(hover: none)").matches || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 8);
    rx.set(-py * 8);
  }
  function handlePanelLeave() {
    rx.set(0);
    ry.set(0);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authAPI.verifyCode(email, code);
      localStorage.setItem("token", data.access_token);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 600);
    } catch (err) {
      setError(err.message || "Invalid code");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg("");
    setError("");
    try {
      await authAPI.resendVerification(email);
      setResendMsg("A new code has been sent to your email.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05040a] overflow-x-hidden">
      <NeuralBackground />
      <CursorSpotlight />
      <ScanLine />

      <div className="relative z-10 min-h-screen flex flex-col xl:flex-row">
        {/* LEFT — cinematic storytelling (xl+ only) */}
        <div className="hidden xl:flex xl:w-[50%] relative items-center px-12 xl:px-16 2xl:px-24 py-10">
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 mb-8"
            >
              <ShieldCheck size={13} className="text-amber flex-shrink-0" />
              <span className="text-[11px] text-blush/60 tracking-wide">Securing your identity…</span>
            </motion.div>

            <h1 className="font-display text-3xl xl:text-4xl 2xl:text-5xl font-bold leading-[1.1] mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white via-blush/90 to-amber/80">
              One last step to unlock your interview intelligence.
            </h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="text-blush/50 text-base max-w-md mb-2">
              We've sent a 6-digit code to your inbox. Enter it to activate your PrepIn account.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="absolute top-[14%] right-[5%] flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md px-3.5 py-2 xl:px-4 shadow-lg"
          >
            <Sparkles size={13} className="text-amber flex-shrink-0" />
            <span className="text-[11px] text-blush/70 font-medium whitespace-nowrap">Codes expire in 10 minutes</span>
          </motion.div>
        </div>

        {/* RIGHT — floating glass panel */}
        <div className="flex-1 flex items-center justify-center xl:justify-end px-4 sm:px-6 xl:pr-16 2xl:pr-24 py-8 sm:py-10">
          <div className="w-full max-w-[440px] xl:mt-[-2vh]" style={{ perspective: 1200 }}>
            <div className="xl:hidden text-center mb-6">
              <h1 className="font-display text-3xl font-bold text-amber tracking-tight">PrepIn</h1>
              <p className="text-blush/50 mt-1 text-sm">Verify your email to continue</p>
            </div>

            <motion.div
              ref={panelRef}
              onMouseMove={handlePanelMove}
              onMouseLeave={handlePanelLeave}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
              className="relative rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 sm:p-8"
            >
              <div className="hidden xl:block mb-6">
                <p className="text-blush/40 text-xs uppercase tracking-[0.2em] mb-1">Verify identity</p>
                <h2 className="text-white font-display text-2xl font-semibold">Check your inbox</h2>
              </div>

              <p className="text-blush/60 text-sm mb-6">
                We sent a 6-digit code to <b className="text-white">{email || "your email"}</b>. Enter it below.
              </p>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3 mb-4"
                  >
                    {error}
                  </motion.div>
                )}
                {resendMsg && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-xl px-4 py-3 mb-4"
                  >
                    {resendMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative rounded-xl p-[1px] overflow-hidden">
                  <div className="relative rounded-xl border border-white/10 bg-white/[0.03]">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="——————"
                      maxLength={6}
                      required
                      className="w-full bg-transparent text-white text-xl text-center tracking-[0.6em] rounded-xl px-4 py-4 focus:outline-none placeholder-blush/20"
                    />
                  </div>
                </div>

                <MagneticButton
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber text-navy font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {success ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2">
                      <Check size={16} /> Verified
                    </motion.span>
                  ) : loading ? (
                    <><Loader2 size={15} className="animate-spin" /> Verifying</>
                  ) : (
                    <>Verify Email</>
                  )}
                </MagneticButton>
              </form>

              <p className="text-center text-blush/50 text-sm mt-6">
                Didn't get a code?{" "}
                <button onClick={handleResend} className="text-amber hover:text-amber/80 font-medium transition-colors duration-200">
                  Resend
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}