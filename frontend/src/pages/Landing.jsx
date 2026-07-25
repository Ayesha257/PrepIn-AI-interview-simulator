import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Mic,
  BarChart3,
  Sparkles,
  Brain,
  Target,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PrepInLogo from "../components/PrepInLogo";

const ease = [0.16, 1, 0.3, 1];

function NeuralBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let w;
    let h;
    const NODE_COUNT = 48;
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
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.5 + 0.7,
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
        if (dist < 140) {
          n.x -= dx * 0.003;
          n.y -= dy * 0.003;
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 140) {
            ctx.strokeStyle = `rgba(237,158,89,${0.1 * (1 - d / 140)})`;
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
        ctx.fillStyle = "rgba(233,140,185,0.45)";
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

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StepRow({ step, title, body, icon: Icon, index }) {
  return (
    <Reveal delay={index * 0.08}>
      <div className="group grid grid-cols-[auto_1fr] gap-5 border-b border-white/[0.06] py-8 sm:gap-8 sm:py-10">
        <div className="relative flex h-12 w-12 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-2xl bg-amber/10"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.35, ease }}
          />
          <Icon size={20} className="relative z-10 text-amber" />
        </div>
        <div>
          <p className="mb-1.5 font-display text-[11px] uppercase tracking-[0.22em] text-amber/70">
            Step {step}
          </p>
          <h3 className="mb-2 font-display text-xl font-semibold text-white sm:text-2xl">{title}</h3>
          <p className="max-w-xl text-sm leading-relaxed text-blush/55 sm:text-[15px]">{body}</p>
        </div>
      </div>
    </Reveal>
  );
}

const STEPS = [
  {
    step: "01",
    title: "Create your account",
    body: "Sign up with email or Google. Verify once, then you’re in — your progress stays synced across sessions.",
    icon: Shield,
  },
  {
    step: "02",
    title: "Upload your resume",
    body: "PrepIn reads your experience and skills so every question feels relevant to the role you’re targeting.",
    icon: FileText,
  },
  {
    step: "03",
    title: "Run a mock interview",
    body: "Answer five tailored questions by voice or text. The AI listens, scores you, and adapts as you go.",
    icon: Mic,
  },
  {
    step: "04",
    title: "Review your report",
    body: "See scores, strengths, and gaps on your dashboard. Track trends so each practice round makes you sharper.",
    icon: BarChart3,
  },
];

const AFTER_LOGIN = [
  {
    icon: Target,
    title: "Dashboard",
    body: "Average scores, session history, and a clear view of how you’re improving over time.",
  },
  {
    icon: FileText,
    title: "Resume hub",
    body: "Upload and manage resumes that power question generation for your target role.",
  },
  {
    icon: Brain,
    title: "Live interviews",
    body: "Start a mock session anytime — five questions, real-time evaluation, voice-ready.",
  },
  {
    icon: Sparkles,
    title: "AI reports",
    body: "Actionable feedback after each interview so you know exactly what to practice next.",
  },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.35]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const primaryHref = user ? "/dashboard" : "/register";
  const primaryLabel = user ? "Go to dashboard" : "Get started free";
  const secondaryHref = user ? "/interview" : "/login";
  const secondaryLabel = user ? "Start interview" : "Sign in";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05040a]">
        <div className="animate-pulse font-display text-xl text-amber">PrepIn...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05040a] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <NeuralBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-[#05040a]/40 via-transparent to-[#05040a]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
      </div>

      {/* Nav */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12"
      >
        <Link to="/" className="flex items-center gap-3">
          <PrepInLogo size={36} />
          <span className="font-display text-lg font-bold tracking-tight text-amber">PrepIn</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {!user && (
            <Link
              to="/login"
              className="rounded-xl px-3 py-2 text-sm text-blush/70 transition-colors hover:text-white sm:px-4"
            >
              Sign in
            </Link>
          )}
          <Link
            to={primaryHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber px-3.5 py-2 text-sm font-semibold text-navy transition-shadow hover:shadow-glow-amber sm:px-4"
          >
            {user ? "Dashboard" : "Get started"}
            <ArrowRight size={14} />
          </Link>
        </div>
      </motion.header>

      {/* Hero — one composition */}
      <section ref={heroRef} className="relative z-10 flex min-h-[calc(100vh-5.5rem)] flex-col justify-center px-5 pb-16 pt-6 sm:px-8 lg:px-12">
        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="mx-auto w-full max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[11px] tracking-wide text-blush/60"
          >
            <Brain size={12} className="text-amber" />
            AI-powered mock interviews
          </motion.p>

          <h1 className="mb-4 font-display text-[2.75rem] font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            <motion.span
              initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.15, ease }}
              className="block bg-clip-text text-transparent bg-gradient-to-br from-amber via-blush to-white"
            >
              PrepIn
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: 0.28, ease }}
              className="mt-2 block text-white/95"
            >
              Practice like it’s the real interview.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mx-auto mb-10 max-w-xl text-base text-blush/55 sm:text-lg"
          >
            Upload your resume, answer AI-generated questions, get scored in real time, and walk into your next interview prepared.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease }}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Link
              to={primaryHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-7 py-3.5 text-sm font-semibold text-navy transition-shadow hover:shadow-glow-amber sm:w-auto"
            >
              {primaryLabel}
              <ArrowRight size={16} />
            </Link>
            <Link
              to={secondaryHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:border-amber/40 hover:bg-white/[0.06] sm:w-auto"
            >
              {secondaryLabel}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-blush/35"
        >
          <span className="text-[10px] uppercase tracking-[0.2em]">How it works</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={16} />
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="mb-3 font-display text-[11px] uppercase tracking-[0.22em] text-amber/70">The journey</p>
            <h2 className="mb-3 font-display text-3xl font-bold text-white sm:text-4xl">
              What happens after you sign in
            </h2>
            <p className="mb-4 max-w-2xl text-blush/50">
              From account to feedback in four clear steps — built so you always know what to do next.
            </p>
          </Reveal>

          <div>
            {STEPS.map((s, i) => (
              <StepRow key={s.step} {...s} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* After login — what the product is */}
      <section className="relative z-10 px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-3 text-center font-display text-[11px] uppercase tracking-[0.22em] text-amber/70">
              Inside the app
            </p>
            <h2 className="mb-12 text-center font-display text-3xl font-bold text-white sm:text-4xl">
              Everything you need to prep with purpose
            </h2>
          </Reveal>

          <div className="grid gap-10 sm:grid-cols-2 lg:gap-x-16 lg:gap-y-12">
            {AFTER_LOGIN.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.07}>
                <div className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-amber/20 bg-amber/[0.07]">
                    <item.icon size={18} className="text-amber" />
                  </div>
                  <div>
                    <h3 className="mb-1.5 font-display text-lg font-semibold text-white">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-blush/50">{item.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative z-10 px-5 pb-24 pt-8 sm:px-8 lg:px-12">
        <Reveal>
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple/40 via-navy/80 to-[#05040a] px-6 py-14 text-center sm:px-12">
            <motion.div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber/15 blur-3xl"
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <h2 className="relative mb-3 font-display text-3xl font-bold text-white sm:text-4xl">
              Ready when you are
            </h2>
            <p className="relative mx-auto mb-8 max-w-md text-sm text-blush/55 sm:text-base">
              Create an account, upload a resume, and complete your first mock interview in minutes.
            </p>
            <Link
              to={primaryHref}
              className="relative inline-flex items-center gap-2 rounded-xl bg-amber px-8 py-3.5 text-sm font-semibold text-navy transition-shadow hover:shadow-glow-amber"
            >
              {primaryLabel}
              <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>

        <p className="mt-12 text-center text-xs text-blush/30">
          Built by Ayesha Amer &amp; Faiqa Waseem
        </p>
      </section>
    </div>
  );
}
