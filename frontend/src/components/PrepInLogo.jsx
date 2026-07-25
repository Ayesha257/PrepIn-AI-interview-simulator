import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function PrepInLogo({
  size = 42,
  wordmark = false,
  clickable = false,
  to = "/dashboard",
  amber = "#ED9E59",
  pink = "#E98CB9",
}) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const gradId = "prepin-grad";
  const softId = "prepin-soft"; 

  return (
    <div
    onClick={() => clickable && navigate(to)}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.28,
      cursor: clickable ? "pointer" : "default",
    }}
    >
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{ y: hovered ? -1 : 0, scale: hovered ? 1.04 : 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: size,
          height: size,
          position: "relative",
          cursor: "default",
        }}
      >
        {/* Ambient glow — brightens on hover, never distracts at rest */}
        <motion.div
          animate={{
            opacity: hovered ? [0.35, 0.55, 0.35] : [0.14, 0.24, 0.14],
            scale: hovered ? 1.15 : 1,
          }}
          transition={{ duration: hovered ? 1.6 : 3.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: "-18%",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${amber}55, ${pink}22, transparent 70%)`,
            filter: "blur(10px)",
            pointerEvents: "none",
          }}
        />

        {/* Orbiting practice-round dots — three attempts, circling the mark */}
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          style={{ position: "absolute", inset: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: hovered ? 9 : 22, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="0.4 12.8"
            opacity={hovered ? 0.75 : 0.45}
          />
        </motion.svg>

        {/* The mark itself */}
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={amber} />
              <stop offset="100%" stopColor={pink} />
            </linearGradient>
            <linearGradient id={softId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={amber} stopOpacity="0.16" />
              <stop offset="100%" stopColor={pink} stopOpacity="0.16" />
            </linearGradient>
          </defs>

          {/* Bubble fill + outline, drawn once on mount */}
          <motion.rect
            x="15" y="17" width="70" height="49" rx="19"
            fill={`url(#${softId})`}
            stroke={`url(#${gradId})`}
            strokeWidth="3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ transformOrigin: "50px 41px" }}
          />

          {/* Tail */}
          <motion.path
            d="M31 64 C29 70 25 76 19 80 C27 79 34 75 37 68 C36 66 34 65 31 64 Z"
            fill={`url(#${gradId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          />

          {/* Content: typing dots <-> checkmark */}
          <AnimatePresence mode="wait">
            {!hovered ? (
              <motion.g key="dots">
                {[36, 50, 64].map((cx, i) => (
                  <motion.circle
                    key={cx}
                    cx={cx}
                    cy="41"
                    r="4.4"
                    fill={`url(#${gradId})`}
                    initial={{ opacity: 0.3, y: 0 }}
                    animate={{ opacity: [0.35, 1, 0.35], y: [0, -4, 0] }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      delay: i * 0.16,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </motion.g>
            ) : (
              <motion.g key="check">
                <motion.path
                  d="M32 42 L44 55 L70 27"
                  fill="none"
                  stroke={`url(#${gradId})`}
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
                {/* a brief spark riding off the tip of the check */}
                <motion.circle
                  r="3"
                  fill="#fff"
                  filter="drop-shadow(0 0 4px rgba(255,255,255,0.9))"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                >
                  <animateMotion dur="0.55s" begin="0.05s" fill="freeze" path="M32 42 L44 55 L70 27" />
                </motion.circle>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </motion.div>

      {wordmark && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: '"Fraunces", Georgia, "Times New Roman", serif',
            fontWeight: 600,
            fontSize: size * 0.5,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            color: "#2A2438",
          }}
        >
          <span>Prep</span>
          <span
            style={{
              fontFamily: '"Fraunces", Georgia, serif',
              fontStyle: "italic",
              fontWeight: 500,
              background: `linear-gradient(90deg, ${amber}, ${pink})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            In
          </span>
        </div>
      )}
    </div>
  );
}