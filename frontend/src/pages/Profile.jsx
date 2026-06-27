// src/pages/Profile.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

export default function Profile() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    target_role: user?.profile?.target_role || "",
    years_of_experience: user?.profile?.years_of_experience || "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess("");
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile({
        name: form.name,
        profile: {
          target_role: form.target_role || null,
          years_of_experience: form.years_of_experience
            ? parseInt(form.years_of_experience)
            : null,
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
        <h1 className="font-display text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-blush/60 text-sm mb-8">{user?.email}</p>

        <div className="bg-navy/60 border border-purple/40 rounded-2xl p-8">
          {success && (
            <div className="bg-amber/10 border border-amber/40 text-amber text-sm rounded-lg px-4 py-3 mb-6">
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
    </div>
  );
}