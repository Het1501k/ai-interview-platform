
import { useEffect, useState } from "react";
import {
  BrainCircuit,
  Clock3,
  CalendarDays,
  ClipboardCheck,
  Trash2,
  ArrowUpRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import "./InterviewHistory.css";
import { auth } from "../firebase";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds = 0) {
  const value = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(value / 60);
  const remaining = value % 60;

  return `${minutes}m ${remaining}s`;
}

function getScore(session) {
  if (typeof session.score === "number") {
    return session.score;
  }

  if (typeof session.evaluation?.overallScore === "number") {
    return session.evaluation.overallScore;
  }

  return null;
}

export default function InterviewHistory() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSessions() {
    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in to view your interview history.");
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/interview/sessions`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load interview history.");
      }

      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      console.error("Could not load Firebase interview history:", err);
      setError(
        "Could not load history from Firebase. Check that the backend is running and Firebase is connected."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function deleteSession(id) {
    if (!window.confirm("Delete this interview session?")) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in to delete an interview session.");
      const idToken = await user.getIdToken();
      const response = await fetch(
        `${API_BASE}/api/interview/sessions/${encodeURIComponent(id)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${idToken}` } }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not delete this session.");
      }

      setSessions((previous) =>
        previous.filter((session) => session.id !== id)
      );
      setSelected(null);
    } catch (err) {
      console.error("Could not delete Firebase session:", err);
      window.alert(err.message || "Could not delete this session. Please try again.");
    }
  }

  if (selected) {
    const questions = Array.isArray(selected.questions)
      ? selected.questions
      : [];

    const answered = questions.filter(
      (item) => item.answer?.trim()
    ).length;

    const score = getScore(selected);
    const evaluation = selected.evaluation;

    return (
      <section className="history-page">
        <button
          className="history-back"
          onClick={() => setSelected(null)}
        >
          <ArrowLeft size={16} /> Back to history
        </button>

        <div className="history-detail-card">
          <div className="history-detail-icon">
            <BrainCircuit size={28} />
          </div>

          <span className="history-eyebrow">
            INTERVIEW DETAILS
          </span>

          <h1>{selected.role || "Mock Interview"}</h1>

          <p>
            {selected.type || "General"} ·{" "}
            {selected.level || "Beginner"}
          </p>

          <div className="history-summary">
            <div>
              <strong>
                {answered}/{questions.length}
              </strong>
              <span>Answered</span>
            </div>

            <div>
              <strong>
                {score === null
                  ? "—"
                  : `${Math.round(score)}%`}
              </strong>
              <span>AI score</span>
            </div>

            <div>
              <strong>
                {formatDuration(selected.durationSeconds)}
              </strong>
              <span>Duration</span>
            </div>
          </div>

          {evaluation && (
            <section className="history-evaluation">
              <h2>
                <Sparkles size={20} /> AI feedback
              </h2>

              {evaluation.summary && (
                <p>{evaluation.summary}</p>
              )}

              {Array.isArray(evaluation.strengths) &&
                evaluation.strengths.length > 0 && (
                  <div className="history-feedback-section">
                    <h3>
                      <TrendingUp size={17} /> Strengths
                    </h3>
                    <ul>
                      {evaluation.strengths.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {Array.isArray(evaluation.improvements) &&
                evaluation.improvements.length > 0 && (
                  <div className="history-feedback-section">
                    <h3>
                      <Lightbulb size={17} /> Areas to improve
                    </h3>
                    <ul>
                      {evaluation.improvements.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </section>
          )}

          <h2>Your answers</h2>

          {questions.length === 0 ? (
            <p>No questions were saved for this session.</p>
          ) : (
            questions.map((item, index) => {
              const feedback = Array.isArray(evaluation?.answers)
                ? evaluation.answers[index]
                : item.evaluation;

              return (
                <article
                  className="history-answer"
                  key={`${selected.id}-${index}`}
                >
                  <span>QUESTION {index + 1}</span>
                  <h3>
                    {typeof item.question === "string"
                      ? item.question
                      : item.question?.question ||
                        "Question unavailable"}
                  </h3>

                  <p>{item.answer?.trim() || "No answer submitted."}</p>

                  {feedback && (
                    <div className="history-feedback-section">
                      {typeof feedback.score === "number" && (
                        <strong>
                          Score: {feedback.score}/10
                        </strong>
                      )}

                      {feedback.feedback && (
                        <p>{feedback.feedback}</p>
                      )}

                      {feedback.suggestion && (
                        <p>
                          <strong>Suggestion:</strong>{" "}
                          {feedback.suggestion}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}

          <p className="history-note">
            This interview session is loaded from Firebase Firestore.
          </p>

          <button
            className="history-delete-button"
            onClick={() => deleteSession(selected.id)}
          >
            <Trash2 size={16} /> Delete this session
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="history-page">
      <header className="history-heading">
        <div>
          <span className="history-eyebrow">YOUR JOURNEY</span>
          <h1>Interview history</h1>
          <p>
            Review your previous practice sessions, scores and answers.
          </p>
        </div>

        <div className="history-total">
          <BrainCircuit size={19} />
          <span>{sessions.length} sessions</span>
        </div>
      </header>

      {loading ? (
        <div className="history-empty">
          <div className="history-empty-icon">
            <BrainCircuit size={30} />
          </div>
          <h2>Loading interview history...</h2>
          <p>Fetching your sessions from Firebase Firestore.</p>
        </div>
      ) : error ? (
        <div className="history-empty">
          <div className="history-empty-icon">
            <ClipboardCheck size={30} />
          </div>
          <h2>Could not load history</h2>
          <p>{error}</p>
          <button className="history-view-button" onClick={loadSessions}>
            Try again
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">
            <ClipboardCheck size={30} />
          </div>
          <h2>No interviews yet</h2>
          <p>
            Complete your first mock interview and your saved sessions
            will appear here.
          </p>
        </div>
      ) : (
        <div className="history-grid">
          {sessions.map((session) => {
            const questions = Array.isArray(session.questions)
              ? session.questions
              : [];

            const answered = questions.filter(
              (item) => item.answer?.trim()
            ).length;

            const progress = questions.length
              ? (answered / questions.length) * 100
              : 0;

            const score = getScore(session);

            return (
              <article
                className="history-card"
                key={session.id}
              >
                <div className="history-card-top">
                  <div className="history-card-icon">
                    <BrainCircuit size={23} />
                  </div>

                  <span className="history-status">
                    <i /> Saved to Firebase
                  </span>
                </div>

                <span className="history-type">
                  {session.type || "GENERAL"} INTERVIEW
                </span>

                <h2>{session.role || "Mock Interview"}</h2>

                <p className="history-level">
                  {session.level || "Beginner"} level
                </p>

                <div className="history-metadata">
                  <span>
                    <CalendarDays size={14} />
                    {formatDate(session.completedAt)}
                  </span>

                  <span>
                    <Clock3 size={14} />
                    {formatDuration(session.durationSeconds)}
                  </span>
                </div>

                <div className="history-progress-heading">
                  <span>Questions answered</span>
                  <strong>
                    {answered}/{questions.length}
                  </strong>
                </div>

                <div className="history-progress">
                  <div style={{ width: `${progress}%` }} />
                </div>

                <div className="history-progress-heading">
                  <span>AI score</span>
                  <strong>
                    {score === null
                      ? "Not available"
                      : `${Math.round(score)}%`}
                  </strong>
                </div>

                <div className="history-card-actions">
                  <button
                    className="history-view-button"
                    onClick={() => setSelected(session)}
                  >
                    View details <ArrowUpRight size={15} />
                  </button>

                  <button
                    className="history-delete-button"
                    aria-label="Delete session"
                    title="Delete session"
                    onClick={() => deleteSession(session.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
