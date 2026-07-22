// src/pages/Profile.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import PrepInLogo from "../components/PrepInLogo";
import {
  User,
  Briefcase,
  CalendarDays,
  Plus,
  X,
  LogOut,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authAPI, resumeAPI } from "../services/api";

// ---------- Neural network canvas background (quieter than the login hero) ----------
function NeuralBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let w, h;
    const NODE_COUNT = 22;
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
        if (dist < 110) {
          n.x -= dx * 0.003;
          n.y -= dy * 0.003;
        }
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

// ---------- Cursor-reactive spotlight (desktop only) ----------
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
      style={{
        background:
          "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(237,158,89,0.05), transparent 70%)",
      }}
    />
  );
}

// ---------- Magnetic button (mouse-follow disabled on touch) ----------
function MagneticButton({ children, className, disabled, ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 20 });
  const sy = useSpring(y, { stiffness: 300, damping: 20 });

  function onMove(e) {
    if (window.matchMedia("(hover: none)").matches) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * 0.08);
    y.set(relY * 0.2);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.97 }}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ---------- Premium floating-label field (shared visual language with Login) ----------
function ProfileField({ icon: Icon, label, type = "text", name, value, onChange, placeholder, min, max }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== "" && value !== null && value !== undefined;

  return (
    <div className="relative rounded-xl p-[1px] overflow-hidden">
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          opacity: focused ? 1 : 0,
          background: "linear-gradient(90deg, transparent, rgba(237,158,89,0.6), transparent)",
          backgroundSize: "200% 100%",
          animation: focused ? "shimmerSlideProfile 2.5s linear infinite" : "none",
        }}
      />
      <div
        className={`relative flex items-center rounded-xl border transition-colors duration-300
                   ${focused ? "border-white/[0.02] bg-white/[0.06]" : "border-white/10 bg-white/[0.03]"}`}
      >
        <Icon size={16} className={`absolute left-4 transition-colors duration-300 flex-shrink-0 ${focused ? "text-amber" : "text-blush/30"}`} />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          min={min}
          max={max}
          className="peer w-full bg-transparent text-white text-sm rounded-xl pl-11 pr-4 pt-5 pb-2 focus:outline-none min-w-0"
        />
        <label
          className={`absolute left-11 transition-all duration-300 pointer-events-none
                     ${focused || hasValue ? "top-1.5 text-[10px] text-amber/80 font-medium tracking-wide" : "top-1/2 -translate-y-1/2 text-sm text-blush/40"}`}
        >
          {label}
        </label>
      </div>
      <style>{`
        @keyframes shimmerSlideProfile {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    target_role: user?.profile?.target_role || "",
    years_of_experience: user?.profile?.years_of_experience || "",
  });
  const [skills, setSkills] = useState(user?.profile?.skills || []);
  const [newSkill, setNewSkill] = useState("");

  const [resumeSource, setResumeSource] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    resumeAPI
      .getMyResumes()
      .then((data) => {
        if (!data.resumes || data.resumes.length === 0) return;
        const latest = data.resumes[0];

        setForm((prev) => ({
          ...prev,
          target_role: prev.target_role || latest.job_role || "",
          years_of_experience:
            prev.years_of_experience !== "" && prev.years_of_experience != null
              ? prev.years_of_experience
              : latest.experience_years ?? "",
        }));

        setSkills((prev) => {
          if (prev.length > 0) return prev;
          return latest.skills || [];
        });

        setResumeSource(latest.filename);
      })
      .catch(() => {})
      .finally(() => setLoadingResume(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess("");
    setError("");
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await authAPI.updateProfile({
        name: form.name,
        profile: {
          target_role: form.target_role || null,
          years_of_experience: form.years_of_experience
            ? parseInt(form.years_of_experience)
            : null,
          skills: skills,
        },
      });
      setSuccess("Profile updated");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#05040a] overflow-x-hidden">
      <NeuralBackground />
      <CursorSpotlight />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-white/[0.03] backdrop-blur-md sticky top-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
        <PrepInLogo size={42} clickable />
            <span className="font-display text-2xl font-bold tracking-tight text-white">
                Prep
                <span className="text-amber">In</span>
            </span>
        </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-blush/60 hover:text-blush text-xs sm:text-sm transition-colors duration-200"
          >
            <LogOut size={14} className="flex-shrink-0" />
            <span className="hidden xs:inline sm:inline">Sign out</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <p className="text-blush/40 text-xs uppercase tracking-[0.2em] mb-1.5">Your account</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-blush/50 text-sm break-all sm:break-normal mb-3">{user?.email}</p>

          <AnimatePresence mode="wait">
            {loadingResume ? (
              <motion.p key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-blush/30 text-xs">
                Loading your resume data…
              </motion.p>
            ) : resumeSource ? (
              <motion.p
                key="source"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-blush/40 text-xs flex items-center gap-1.5 flex-wrap"
              >
                <Sparkles size={12} className="text-amber flex-shrink-0" />
                Pre-filled from <span className="text-blush/70 break-all">{resumeSource}</span> — review and edit below
              </motion.p>
            ) : (
              <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-blush/40 text-xs">
                Upload a resume to auto-fill this profile.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative rounded-3xl border border-white/10 bg-white/[0.045] backdrop-blur-2xl
                     shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-5 sm:p-8"
        >
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-amber/10 border border-amber/30 text-amber text-sm rounded-xl px-4 py-3 mb-5"
              >
                <Check size={15} className="flex-shrink-0" /> {success}
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3 mb-5"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSave} className="space-y-5">
            <ProfileField icon={User} label="Full name" name="name" value={form.name} onChange={handleChange} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField
                icon={Briefcase}
                label="Target role"
                name="target_role"
                value={form.target_role}
                onChange={handleChange}
                placeholder="e.g. Backend Engineer"
              />
              <ProfileField
                icon={CalendarDays}
                label="Years of experience"
                type="number"
                name="years_of_experience"
                value={form.years_of_experience}
                onChange={handleChange}
                min="0"
                max="50"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-blush/70 text-xs uppercase tracking-wide mb-2.5">Skills</label>

              <div className="flex flex-wrap gap-2 mb-3 min-h-[2.25rem]">
                {skills.length === 0 && (
                  <p className="text-blush/30 text-xs italic">No skills yet — add manually or upload a resume.</p>
                )}
                <AnimatePresence>
                  {skills.map((skill) => (
                    <motion.span
                      key={skill}
                      layout
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.2 }}
                      className="group flex items-center gap-1.5 bg-amber/10 border border-amber/25 text-amber text-xs font-medium
                                 rounded-full pl-3 pr-2 py-1.5"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                                   text-amber/60 hover:text-white hover:bg-red-500/60 transition-colors duration-200"
                        aria-label={`Remove ${skill}`}
                      >
                        <X size={11} />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSkill(e);
                  }}
                  placeholder="Add a skill and press Enter"
                  className="flex-1 min-w-0 bg-white/[0.03] border border-white/10 text-white placeholder-blush/25
                             rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber/50 transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="flex items-center justify-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10
                             text-blush/80 text-sm font-medium rounded-xl px-4 py-2.5 sm:py-0 transition-colors duration-200 flex-shrink-0"
                >
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>

            <MagneticButton
              type="submit"
              disabled={saving}
              className="w-full bg-amber text-navy font-semibold rounded-xl py-3 text-sm mt-2 flex items-center justify-center gap-2
                         transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(237,158,89,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving
                </>
              ) : (
                "Save changes"
              )}
            </MagneticButton>
          </form>
        </motion.div>
      </main>
    </div>
  );
}