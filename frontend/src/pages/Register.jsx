// src/pages/Register.jsx
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Check, X, Sparkles, Brain, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ---------- Neural network canvas background ----------
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

function FloatingBadge({ icon: Icon, text, className, delay = 0, floatDelay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay }} className={`absolute ${className}`}>
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: floatDelay }}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md px-3.5 py-2 xl:px-4 shadow-lg"
      >
        <Icon size={13} className="text-amber flex-shrink-0" />
        <span className="text-[11px] text-blush/70 font-medium whitespace-nowrap">{text}</span>
      </motion.div>
    </motion.div>
  );
}

function CinematicHeading() {
  const words = ["Initialize", "your", "AI", "career", "identity."];
  return (
    <h1 className="font-display text-3xl xl:text-4xl 2xl:text-5xl font-bold leading-[1.1] mb-4">
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block mr-3 bg-clip-text text-transparent bg-gradient-to-br from-white via-blush/90 to-amber/80"
        >
          {w}
        </motion.span>
      ))}
    </h1>
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

function Field({ icon: Icon, label, type = "text", name, value, onChange, showToggle, showValue, onToggle, rightSlot }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value?.length > 0;

  return (
    <div className="relative rounded-xl p-[1px] overflow-hidden">
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          opacity: focused ? 1 : 0,
          background: "linear-gradient(90deg, transparent, rgba(237,158,89,0.6), transparent)",
          backgroundSize: "200% 100%",
          animation: focused ? "shimmerSlide 2.5s linear infinite" : "none",
        }}
      />
      <div className={`relative flex items-center rounded-xl border transition-colors duration-300 ${focused ? "border-white/[0.02] bg-white/[0.06]" : "border-white/10 bg-white/[0.03]"}`}>
        <Icon size={16} className={`absolute left-4 transition-colors duration-300 flex-shrink-0 ${focused ? "text-amber" : "text-blush/30"}`} />
        <input
          type={showToggle ? (showValue ? "text" : "password") : type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          required
          className="peer w-full bg-transparent text-white text-sm rounded-xl pl-11 pr-11 pt-5 pb-2 focus:outline-none min-w-0"
        />
        <label className={`absolute left-11 transition-all duration-300 pointer-events-none ${focused || hasValue ? "top-1.5 text-[10px] text-amber/80 font-medium tracking-wide" : "top-1/2 -translate-y-1/2 text-sm text-blush/40"}`}>
          {label}
        </label>
        {rightSlot}
        {showToggle && (
          <button type="button" tabIndex={-1} onClick={onToggle} className="absolute right-4 text-blush/30 hover:text-blush/60 transition-colors duration-200 flex-shrink-0">
            {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      <style>{`@keyframes shimmerSlide { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  );
}

function IdentityRing({ pct, size = 46 }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ED9E59"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold text-amber">{pct}%</span>
      </div>
    </div>
  );
}

function getPasswordChecks(pw) {
  return {
    length: pw.length >= 6,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

function PasswordStrength({ password }) {
  const checks = getPasswordChecks(password);
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-500", "bg-red-400", "bg-amber-400", "bg-lime-400", "bg-emerald-400"];

  if (!password) return null;

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="flex gap-1.5 mt-2 mb-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-1 flex-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: i < score ? "100%" : "0%" }} transition={{ duration: 0.3 }} className={`h-full ${colors[score]}`} />
          </div>
        ))}
      </div>
      <p className={`text-[11px] mb-2 ${score <= 1 ? "text-red-300" : score <= 2 ? "text-amber-300" : "text-emerald-300"}`}>{labels[score]}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {[
          { key: "length", label: "6+ characters" },
          { key: "upper", label: "Uppercase letter" },
          { key: "number", label: "Number" },
          { key: "special", label: "Special character" },
        ].map((r) => (
          <span key={r.key} className={`text-[11px] flex items-center gap-1 transition-colors duration-200 ${checks[r.key] ? "text-emerald-300" : "text-blush/30"}`}>
            {checks[r.key] ? <Check size={11} /> : <X size={11} />}
            {r.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  const identityPct = useMemo(() => {
    let pct = 0;
    if (form.name.trim().length > 1) pct += 25;
    if (/^\S+@\S+\.\S+$/.test(form.email)) pct += 25;
    if (form.password.length >= 6) pct += 25;
    if (form.confirm && form.confirm === form.password && form.password.length >= 6) pct += 25;
    return pct;
  }, [form]);

  const confirmMatch = form.confirm.length > 0 ? form.confirm === form.password : null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords don't match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      setSuccess(true);
      setTimeout(() => navigate("/verify-code", { state: { email: form.email } }), 700);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05040a] overflow-x-hidden">
      <NeuralBackground />
      <CursorSpotlight />
      <ScanLine />

      <div className="relative z-10 min-h-screen flex flex-col xl:flex-row">
        {/* LEFT — cinematic AI onboarding storytelling (xl+ only) */}
        <div className="hidden xl:flex xl:w-[50%] relative items-center px-12 xl:px-16 2xl:px-24 py-10">
          <div className="max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 mb-8"
            >
              <Brain size={13} className="text-amber flex-shrink-0" />
              <span className="text-[11px] text-blush/60 tracking-wide">Preparing your interview intelligence…</span>
            </motion.div>

            <CinematicHeading />

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="text-blush/50 text-base max-w-md mb-2">
              Create your profile once — PrepIn tailors every mock interview to your resume and goals from day one.
            </motion.p>
          </div>

          <FloatingBadge icon={Sparkles} text="Resume-aware questions" className="top-[12%] right-[4%]" delay={0.9} floatDelay={0} />
          <FloatingBadge icon={TrendingUp} text="Track your progress" className="bottom-[18%] left-[6%]" delay={1.05} floatDelay={1.2} />
          <FloatingBadge icon={Check} text="Free to get started" className="bottom-[5%] right-[3%]" delay={1.2} floatDelay={0.6} />
        </div>

        {/* RIGHT — floating offset onboarding panel */}
        <div className="flex-1 flex items-center justify-center xl:justify-end px-4 sm:px-6 xl:pr-16 2xl:pr-24 py-8 sm:py-10">
          <div className="w-full max-w-[440px] xl:mt-[-2vh]" style={{ perspective: 1200 }}>
            <div className="xl:hidden text-center mb-6">
              <h1 className="font-display text-3xl font-bold text-amber tracking-tight">PrepIn</h1>
              <p className="text-blush/50 mt-1 text-sm">Start your interview prep journey</p>
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

              <div className="hidden xl:flex items-center justify-between mb-6 gap-3">
                <div className="min-w-0">
                  <p className="text-blush/40 text-xs uppercase tracking-[0.2em] mb-1">Create identity</p>
                  <h2 className="text-white font-display text-2xl font-semibold">Sign up for PrepIn</h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <IdentityRing pct={identityPct} />
                </div>
              </div>

              <div className="xl:hidden flex items-center justify-between mb-4">
                <p className="text-blush/50 text-xs">Identity created</p>
                <IdentityRing pct={identityPct} size={38} />
              </div>

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
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Field icon={User} label="Full name" name="name" value={form.name} onChange={handleChange} />
                <Field icon={Mail} label="Email" type="email" name="email" value={form.email} onChange={handleChange} />

                <div>
                  <Field
                    icon={Lock}
                    label="Password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    showToggle
                    showValue={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                  />
                  <AnimatePresence>
                    <PasswordStrength password={form.password} />
                  </AnimatePresence>
                </div>

                <div>
                  <Field
                    icon={Lock}
                    label="Confirm password"
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    showToggle
                    showValue={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    rightSlot={
                      confirmMatch !== null && (
                        <span className={`absolute right-11 flex-shrink-0 ${confirmMatch ? "text-emerald-400" : "text-red-400"}`}>
                          {confirmMatch ? <Check size={14} /> : <X size={14} />}
                        </span>
                      )
                    }
                  />
                </div>

                <MagneticButton
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber text-navy font-semibold rounded-xl py-3 text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {success ? (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2">
                      <Check size={16} /> Identity created
                    </motion.span>
                  ) : loading ? (
                    <><Loader2 size={15} className="animate-spin" /> Creating account</>
                  ) : (
                    <>Create account <ArrowRight size={15} /></>
                  )}
                </MagneticButton>
              </form>

              <p className="text-center text-blush/50 text-sm mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-amber hover:text-amber/80 font-medium transition-colors duration-200">
                  Sign in
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}