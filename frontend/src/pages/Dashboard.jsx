// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { analyticsAPI, resumeAPI } from "../services/api";
import ResumeUpload from "./ResumeUpload";
import { Link} from "react-router-dom"

function StatCard({ label, value, color = "amber" }) {
  const colorMap = {
    amber: "text-amber",
    blush: "text-blush",
    rose: "text-rose",
  };
  return (
    <div className="bg-navy/60 border border-purple/40 rounded-2xl p-5">
      <p className="text-blush/60 text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className={`font-display text-3xl font-bold ${colorMap[color]}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [dashData, resumeData] = await Promise.all([
        analyticsAPI.getDashboard(),
        resumeAPI.getMyResumes(),
      ]);
      setStats(dashData);
      setResumes(resumeData.resumes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resume?")) return;
    try {
      await resumeAPI.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-purple/40 to-navy">
      {/* Navbar */}
    <nav className="border-b border-purple/30 bg-navy/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="font-display text-2xl font-bold text-amber">PrepIn</span>
        <div className="flex items-center gap-4">
          <span className="text-blush/60 text-sm hidden sm:block">
          {user?.name}
          </span>
          <Link to="/profile" className="text-blush/60 hover:text-blush text-sm transition">
            Profile
          </Link>
          <button
            onClick={logout}
            className="text-blush/60 hover:text-blush text-sm transition"
          >
            Sign out
          </button>
        </div>
      </div> 
    </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">
            Hey, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-blush/60 mt-1">Here's your prep overview</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="text-blush/40 text-sm">Loading stats...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <StatCard label="Resumes" value={stats?.resume_count} color="amber" />
            <StatCard label="Sessions" value={stats?.total_sessions} color="blush" />
            <StatCard label="Completed" value={stats?.completed_sessions} color="rose" />
            <StatCard
              label="Avg Score"
              value={stats?.avg_score ? `${stats.avg_score}/10` : "—"}
              color="amber"
            />
          </div>
        )}

        {/* Resume section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">
            Your Resumes
          </h2>
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="bg-rose/30 hover:bg-rose/50 text-blush border border-rose/40
                       rounded-xl px-4 py-2 text-sm font-medium transition"
          >
            {showUpload ? "Cancel" : "+ Upload Resume"}
          </button>
        </div>

        {showUpload && (
          <div className="mb-8">
            <ResumeUpload
              onUploadSuccess={(newResume) => {
                setResumes((prev) => [newResume, ...prev]);
                setShowUpload(false);
              }}
            />
          </div>
        )}

        {/* Resume list */}
        {resumes.length === 0 && !showUpload ? (
          <div className="text-center py-16 border border-dashed border-purple/40 rounded-2xl">
            <p className="text-blush/40 text-sm">No resumes uploaded yet.</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-3 text-amber text-sm hover:underline"
            >
              Upload your first resume →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-navy/60 border border-purple/30
                           rounded-xl px-5 py-4 hover:border-purple/60 transition"
              >
                <div className="flex items-center gap-3">
                  {/* File icon */}
                  <div className="w-9 h-9 bg-purple/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blush/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{r.filename}</p>
                    <p className="text-blush/40 text-xs">
                      {new Date(r.uploaded_at).toLocaleDateString()} ·{" "}
                      <span className={
                        r.status === "parsed" ? "text-amber" :
                        r.status === "failed" ? "text-rose" : "text-blush/50"
                      }>
                        {r.status}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-blush/30 hover:text-rose text-xs transition ml-4"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
