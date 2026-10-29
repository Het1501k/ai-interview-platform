
import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { FileText, Upload, Sparkles, RefreshCw, Trash2 } from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const emptyProfile = null;

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function request(path, options = {}) {
    const user = auth.currentUser;
    if (!user) throw new Error("Please sign in first.");

    const token = await user.getIdToken();
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  async function loadProfile() {
    if (!auth.currentUser) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    try {
      setLoadingProfile(true);
      const data = await request("/api/resume/profile");
      setProfile(data.profile || null);
    } catch (err) {
      setError(err.message || "Could not load your saved profile.");
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!auth.currentUser) {
          setProfile(null);
          return;
        }

        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${API}/api/resume/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not load profile.");
        }

        if (!cancelled) setProfile(data.profile || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load profile.");
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function uploadResume(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const user = auth.currentUser;
    if (!user) {
      setError("Please sign in before uploading your resume.");
      return;
    }

    if (!file) {
      setError("Please choose a PDF or DOCX resume.");
      return;
    }

    if (!/\.(pdf|docx)$/i.test(file.name)) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Your resume must be 5 MB or smaller.");
      return;
    }

    try {
      setLoading(true);

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch(`${API}/api/resume/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Resume analysis failed.");
      }

      setProfile(data.profile);
      setFile(null);
      setMessage("Resume analyzed and your career profile was saved.");
    } catch (err) {
      setError(err.message || "Could not analyze the resume.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProfile() {
    if (!window.confirm("Delete your saved career profile?")) return;

    try {
      setError("");
      setMessage("");
      await request("/api/resume/profile", { method: "DELETE" });
      setProfile(null);
      setMessage("Your saved career profile has been deleted.");
    } catch (err) {
      setError(err.message || "Could not delete your profile.");
    }
  }

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e8e7f0",
    borderRadius: 18,
    padding: 24,
    marginBottom: 28,
    color: "#202033",
  };

  const chipStyle = {
    display: "inline-block",
    padding: "7px 11px",
    margin: "4px 6px 4px 0",
    borderRadius: 9,
    background: "#f1efff",
    color: "#5142a5",
    fontSize: 13,
  };

  function renderList(items) {
    if (!Array.isArray(items) || !items.length) {
      return <span style={{ color: "#8b899b" }}>Not detected</span>;
    }

    return items.map((item, index) => (
      <span style={chipStyle} key={`${item}-${index}`}>
        {typeof item === "string" ? item : item.name || "Not detected"}
      </span>
    ));
  }

  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          background: "#f1efff",
          color: "#6352bd",
          borderRadius: 12,
          padding: 12,
        }}>
          <Sparkles size={24} />
        </div>

        <div>
          <h2 style={{ margin: 0, fontSize: 21 }}>
            Build your AI career profile
          </h2>
          <p style={{ margin: "6px 0 0", color: "#777589", fontSize: 14 }}>
            Upload your resume for personalized interview preparation.
          </p>
        </div>
      </div>

      <form
        onSubmit={uploadResume}
        style={{
          marginTop: 22,
          padding: 18,
          border: "1px dashed #c9c3e9",
          borderRadius: 14,
          background: "#faf9ff",
        }}
      >
        <label style={{ display: "block", fontWeight: 600, marginBottom: 10 }}>
          Select your resume
        </label>

        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);
            setError("");
            setMessage("");
          }}
          style={{ display: "block", width: "100%", marginBottom: 14 }}
        />

        {file && (
          <p style={{ color: "#6254ad", fontSize: 13 }}>
            <FileText size={15} style={{ verticalAlign: "middle" }} />{" "}
            {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            border: 0,
            borderRadius: 10,
            padding: "12px 17px",
            background: "#6352bd",
            color: "#fff",
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {loading ? <RefreshCw size={17} /> : <Upload size={17} />}
          {loading ? "Analyzing resume..." : "Upload and analyze"}
        </button>

        <p style={{ color: "#858297", fontSize: 12, marginBottom: 0 }}>
          PDF or DOCX · Maximum 5 MB
        </p>
      </form>

      {error && (
        <p role="alert" style={{ color: "#c03945", marginTop: 14 }}>
          {error}
        </p>
      )}

      {message && (
        <p role="status" style={{ color: "#25845a", marginTop: 14 }}>
          {message}
        </p>
      )}

      {loadingProfile && (
        <p style={{ color: "#777589" }}>Loading your saved profile...</p>
      )}

      {profile && (
        <div style={{ marginTop: 26 }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}>
            <h3 style={{ margin: 0, fontSize: 19 }}>
              {profile.name || "Your career profile"}
            </h3>

            <button
              type="button"
              onClick={deleteProfile}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #ead8dc",
                background: "#fff",
                color: "#b33e50",
                borderRadius: 9,
                padding: "8px 10px",
                cursor: "pointer",
              }}
            >
              <Trash2 size={15} /> Delete profile
            </button>
          </div>

          <p style={{ color: "#6d5ab7", fontWeight: 600 }}>
            Career field: {profile.field || "Not detected"}
          </p>

          <div style={{ marginTop: 18 }}>
            <strong>Suggested roles</strong>
            <div>{renderList(profile.suggestedRoles)}</div>
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>Skills</strong>
            <div>{renderList(profile.skills)}</div>
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>Education</strong>
            <div>{renderList(profile.education)}</div>
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>Experience</strong>
            <div>{renderList(profile.experience)}</div>
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>Projects</strong>
            <div>
              {profile.projects?.length
                ? profile.projects.map((project, index) => (
                    <div
                      key={`${project.name}-${index}`}
                      style={{
                        padding: 12,
                        marginTop: 8,
                        border: "1px solid #eeedf4",
                        borderRadius: 10,
                      }}
                    >
                      <strong>{project.name || "Project"}</strong>
                      <p style={{ color: "#777589", margin: "6px 0" }}>
                        {project.description || "Not detected"}
                      </p>
                      {renderList(project.technologies)}
                    </div>
                  ))
                : <span style={{ color: "#8b899b" }}>Not detected</span>}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>Certifications</strong>
            <div>{renderList(profile.certifications)}</div>
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>Topics to practice</strong>
            <div>{renderList(profile.topicsToPractice)}</div>
          </div>

          {profile.summary && (
            <p style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 10,
              background: "#f8f7fc",
              color: "#666477",
              lineHeight: 1.6,
            }}>
              {profile.summary}
            </p>
          )}

          <p style={{ color: "#8b899b", fontSize: 12, marginBottom: 0 }}>
            This profile is saved to your signed-in account.
          </p>
        </div>
      )}

      {!loadingProfile && !profile && (
        <p style={{ color: "#777589", marginBottom: 0, marginTop: 18 }}>
          No resume profile yet. Upload your resume to get started.
        </p>
      )}
    </section>
  );
}
