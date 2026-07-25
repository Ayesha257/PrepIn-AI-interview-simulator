// src/pages/ResumeUpload.jsx
import { useState, useRef } from "react";
import { resumeAPI } from "../services/api";

export default function ResumeUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ["application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(f.type)) {
      setError("Only PDF or DOCX files are accepted");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File too large — max 5 MB");
      return;
    }
    setFile(f);
    setError("");
    setSuccess("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data = await resumeAPI.upload(file);
      setSuccess(`"${file.name}" uploaded successfully!`);
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="font-display text-2xl font-semibold text-white mb-2">
        Upload Resume
      </h2>
      <p className="text-blush/60 text-sm mb-6">
        PDF or DOCX · max 5 MB.
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center
                    justify-center cursor-pointer transition
                    ${dragging
                      ? "border-amber bg-amber/10"
                      : "border-purple/60 bg-navy/40 hover:border-amber/60 hover:bg-purple/10"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {/* Upload icon */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4
                         ${dragging ? "bg-amber/20" : "bg-purple/40"}`}>
          <svg className={`w-7 h-7 ${dragging ? "text-amber" : "text-blush/60"}`}
               fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        {file ? (
          <div className="text-center">
            <p className="text-amber font-medium">{file.name}</p>
            <p className="text-blush/50 text-xs mt-1">
              {(file.size / 1024).toFixed(0)} KB · Click to change
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white/70 text-sm">
              Drag & drop your resume here, or{" "}
              <span className="text-amber font-medium">browse</span>
            </p>
            <p className="text-blush/40 text-xs mt-1">PDF, DOC, DOCX up to 5 MB</p>
          </div>
        )}
      </div>

      {/* Error / Success messages */}
      {error && (
        <div className="mt-3 bg-rose/20 border border-rose/40 text-blush text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 bg-amber/10 border border-amber/40 text-amber text-sm rounded-lg px-4 py-3">
          ✓ {success}
        </div>
      )}

      {/* Upload button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-4 w-full bg-amber hover:bg-amber/90 text-navy font-semibold
                     rounded-xl py-3 text-sm transition shadow-glow-amber
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload Resume"}
        </button>
      )}
    </div>
  );
}
