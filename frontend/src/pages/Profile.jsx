// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI, resumeAPI } from "../services/api";

export default function Profile() {
  const { user, logout } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    target_role: user?.profile?.target_role || "",
    years_of_experience: user?.profile?.years_of_experience || "",
  });
  const [skills, setSkills] = useState(user?.profile?.skills || []);
  const [newSkill, setNewSkill] = useState("");

  const [resumeSource, setResumeSource] = useState(null); // filename, for the "filled from" note
  const [loadingResume, setLoadingResume] = useState(true);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    resumeAPI
      .getMyResumes()
      .then((data) => {
        if (!data.resumes || data.resumes.length === 0) return;
        const latest = data.resumes[0];

        // Only auto-fill fields the user hasn't already set themselves
        setForm((prev) => ({
          ...prev,
          target_role: prev.target_role || latest.job_role || "",
          years_of_experience:
            prev.years_of_experience !== "" && prev.years_of_experience != null
              ? prev.years_of_experience
              : latest.experience_years ?? "",
        }));

        setSkills((prev) => {
          if (prev.length > 0) return prev; // don't overwrite existing skills
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
      setSuccess("Profile updated!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-purple/40 to-navy">
      {/* Navbar */}
      <nav className="border-b border-purple/30 bg-navy/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-2xl font-bold text-amber">PrepIn</span>
          <button onClick={logout} className="text-blush/60 hover:text-blush text-sm transition">
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div
          className={`transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="font-display text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-blush/60 text-sm mb-2">{user?.email}</p>

          {!loadingResume && resumeSource && (
            <p className="text-blush/40 text-xs mb-6 flex items-center gap-1.5">
              <span className="text-amber">✨</span>
              Pre-filled from <span className="text-blush/70">{resumeSource}</span> — review and edit below
            </p>
          )}
          {!loadingResume && !resumeSource && (
            <p className="text-blush/40 text-xs mb-6">
              Upload a resume to auto-fill this profile.
            </p>
          )}
          {loadingResume && (
            <p className="text-blush/30 text-xs mb-6 animate-pulse">Loading your resume data...</p>
          )}
        </div>

        <div
          className={`bg-navy/60 border border-purple/40 rounded-2xl p-8 transition-all duration-700 delay-150 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {success && (
            <div className="bg-amber/10 border border-amber/40 text-amber text-sm rounded-lg px-4 py-3 mb-6 animate-[fadeIn_0.3s_ease]">
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="bg-rose/20 border border-rose/40 text-blush text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-blush/80 text-sm mb-1.5">Full Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                           rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber
                           focus:ring-1 focus:ring-amber/50 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-blush/80 text-sm mb-1.5">Target Role</label>
                <input
                  type="text"
                  name="target_role"
                  value={form.target_role}
                  onChange={handleChange}
                  placeholder="e.g. Backend Engineer"
                  className="w-full bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber
                             focus:ring-1 focus:ring-amber/50 transition"
                />
              </div>

              <div>
                <label className="block text-blush/80 text-sm mb-1.5">Years of Experience</label>
                <input
                  type="number"
                  name="years_of_experience"
                  value={form.years_of_experience}
                  onChange={handleChange}
                  min="0"
                  max="50"
                  placeholder="0"
                  className="w-full bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                             rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber
                             focus:ring-1 focus:ring-amber/50 transition"
                />
              </div>
            </div>

            {/* Skills section */}
            <div>
              <label className="block text-blush/80 text-sm mb-2">Skills</label>

              <div className="flex flex-wrap gap-2 mb-3 min-h-[2.5rem]">
                {skills.length === 0 && (
                  <p className="text-blush/40 text-xs italic">
                    No skills yet — add manually or upload a resume.
                  </p>
                )}
                {skills.map((skill, i) => (
                  <span
                    key={skill}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className="group flex items-center gap-1.5 bg-purple/40 hover:bg-purple/60
                               border border-purple/50 text-white text-xs font-medium
                               rounded-full pl-3 pr-2 py-1.5 transition-all duration-300
                               animate-[popIn_0.3s_ease_backwards]"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="w-4 h-4 rounded-full flex items-center justify-center
                                 text-blush/60 hover:text-white hover:bg-rose/60 transition"
                      aria-label={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSkill(e);
                  }}
                  placeholder="Add a skill and press Enter"
                  className="flex-1 bg-purple/30 border border-purple/50 text-white placeholder-blush/30
                             rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber
                             focus:ring-1 focus:ring-amber/50 transition"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="bg-purple/50 hover:bg-purple/70 text-white text-sm font-medium
                             rounded-xl px-4 transition"
                >
                  Add
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-amber hover:bg-amber/90 text-navy font-semibold
                         rounded-xl py-3 text-sm transition shadow-glow-amber
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}