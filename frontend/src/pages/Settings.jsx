
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  UserRound,
  SlidersHorizontal,
  Volume2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import { auth } from "../firebase";
import "./Settings.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const defaultSettings = {
  name: "",
  email: "",
  role: "Frontend Developer",
  level: "Beginner",
  type: "Technical",
  count: "5",
  autoRead: true,
  voiceEnabled: true,
};

function getUserId() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in to access your settings.");
  }

  return user.uid;
}

function getStorageKey(userId, key) {
  return `interviewAI:${userId}:${key}`;
}

function getDefaultSettings() {
  const user = auth.currentUser;

  return {
    ...defaultSettings,
    name: user?.displayName || "",
    email: user?.email || "",
  };
}

function loadLocalSettings(userId) {
  const defaults = getDefaultSettings();

  try {
    const profile = JSON.parse(
      localStorage.getItem(
        getStorageKey(userId, "userProfile")
      ) || "{}"
    );

    const preferences = JSON.parse(
      localStorage.getItem(
        getStorageKey(userId, "interviewPreferences")
      ) || "{}"
    );

    const setup = JSON.parse(
      localStorage.getItem(
        getStorageKey(userId, "interviewSetup")
      ) || "{}"
    );

    return {
      ...defaults,
      ...setup,
      ...preferences,
      ...profile,
      count: String(setup.count ?? defaults.count),
    };
  } catch (error) {
    console.error("Local settings load error:", error);
    return defaults;
  }
}

function normalizeSettings(data = {}) {
  const defaults = getDefaultSettings();

  return {
    ...defaults,
    ...data,
    count: String(data.count ?? defaults.count),
    autoRead: data.autoRead ?? defaults.autoRead,
    voiceEnabled: data.voiceEnabled ?? defaults.voiceEnabled,
  };
}

function saveLocalSettings(settings, userId) {
  localStorage.setItem(
    getStorageKey(userId, "userProfile"),
    JSON.stringify({
      name: settings.name,
      email: settings.email,
    })
  );

  localStorage.setItem(
    getStorageKey(userId, "interviewPreferences"),
    JSON.stringify({
      autoRead: settings.autoRead,
      voiceEnabled: settings.voiceEnabled,
    })
  );

  localStorage.setItem(
    getStorageKey(userId, "interviewSetup"),
    JSON.stringify({
      role: settings.role,
      level: settings.level,
      type: settings.type,
      count: settings.count,
    })
  );
}

function Settings({ onBack }) {
  const [settings, setSettings] = useState(getDefaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchSettings() {
      setLoading(true);
      setMessage("");
      setMessageType("");

      try {
        const user = auth.currentUser;

        if (!user) {
          throw new Error("Please sign in again.");
        }

        const userId = user.uid;
        const token = await user.getIdToken();

        const response = await fetch(
          `${API_BASE_URL}/api/settings`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            result.message || "Could not load settings."
          );
        }

        if (cancelled) return;

        if (result.settings) {
          const normalized = normalizeSettings(result.settings);

          setSettings(normalized);
          saveLocalSettings(normalized, userId);
        } else {
          setSettings(loadLocalSettings(userId));
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Settings load error:", error);

        try {
          const userId = getUserId();
          setSettings(loadLocalSettings(userId));
        } catch {
          setSettings(getDefaultSettings());
        }

        setMessage(
          `Settings load failed: ${error.message}`
        );
        setMessageType("error");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function update(field, value) {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSaved(false);
    setMessage("");
    setMessageType("");
  }

  async function handleSave(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setSaved(false);
    setMessage("");
    setMessageType("");

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Please sign in again.");
      }

      const userId = user.uid;
      const token = await user.getIdToken();

      const payload = {
        name: settings.name.trim(),
        email: user.email || "",
        role: settings.role,
        level: settings.level,
        type: settings.type,
        count: String(settings.count),
        autoRead: Boolean(settings.autoRead),
        voiceEnabled: Boolean(settings.voiceEnabled),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Could not save settings."
        );
      }

      saveLocalSettings(payload, userId);
      setSettings(normalizeSettings(payload));
      setSaved(true);
      setMessage("Settings saved successfully!");
      setMessageType("success");
    } catch (error) {
      console.error("Settings save error:", error);
      setMessage(`Settings save failed: ${error.message}`);
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  function resetSettings() {
    setSettings(getDefaultSettings());
    setSaved(false);
    setMessage("Default values set. Click Save Settings to apply them.");
    setMessageType("success");
  }

  return (
    <div className="settings-page">
      <div className="settings-heading">
        <div>
          <span className="settings-eyebrow">
            PERSONALIZE YOUR EXPERIENCE
          </span>

          <h1>Settings</h1>

          <p>
            Manage your profile and customize your interview
            practice experience.
          </p>
        </div>

        <button
          type="button"
          className="settings-back"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>
      </div>

      {loading && (
        <div className="settings-notice" role="status">
          <LoaderCircle
            className="settings-spinner"
            size={18}
          />
          Loading your settings...
        </div>
      )}

      <form onSubmit={handleSave}>
        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon profile-color">
              <UserRound size={21} />
            </div>

            <div>
              <h2>Profile information</h2>
              <p>Personal details for your workspace.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label htmlFor="settings-name">Full name</label>

              <input
                id="settings-name"
                value={settings.name}
                onChange={(event) =>
                  update("name", event.target.value)
                }
                placeholder="Enter your name"
                maxLength={100}
                required
              />
            </div>

            <div className="settings-field">
              <label htmlFor="settings-email">
                Email address
              </label>

              <input
                id="settings-email"
                type="email"
                value={settings.email}
                readOnly
                placeholder="Your signed-in email"
              />

              <span className="settings-help">
                Email comes from your signed-in Google account.
              </span>
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon preferences-color">
              <SlidersHorizontal size={21} />
            </div>

            <div>
              <h2>Interview preferences</h2>
              <p>Set your default mock interview configuration.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label htmlFor="settings-role">
                Target job role
              </label>

              <select
                id="settings-role"
                value={settings.role}
                onChange={(event) =>
                  update("role", event.target.value)
                }
              >
                <option>Frontend Developer</option>
                <option>Full Stack Developer</option>
                <option>Java Developer</option>
                <option>Data Analyst</option>
                <option>Software Engineer</option>
                <option>HR Executive</option>
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-level">
                Experience level
              </label>

              <select
                id="settings-level"
                value={settings.level}
                onChange={(event) =>
                  update("level", event.target.value)
                }
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-type">
                Interview type
              </label>

              <select
                id="settings-type"
                value={settings.type}
                onChange={(event) =>
                  update("type", event.target.value)
                }
              >
                <option>Technical</option>
                <option>HR</option>
                <option>Behavioral</option>
                <option>Mixed</option>
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="settings-count">
                Question count
              </label>

              <select
                id="settings-count"
                value={String(settings.count)}
                onChange={(event) =>
                  update("count", event.target.value)
                }
              >
                <option value="5">5 questions</option>
                <option value="10">10 questions</option>
              </select>
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon voice-color">
              <Volume2 size={21} />
            </div>

            <div>
              <h2>Voice preferences</h2>
              <p>Customize how you practice speaking.</p>
            </div>
          </div>

          <div className="settings-toggle-row">
            <div>
              <strong>Enable voice features</strong>
              <p>
                Allow voice input and speech features where supported.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.voiceEnabled}
              aria-label="Enable voice features"
              className={`settings-switch ${
                settings.voiceEnabled ? "switch-on" : ""
              }`}
              onClick={() =>
                update("voiceEnabled", !settings.voiceEnabled)
              }
            >
              <span />
            </button>
          </div>

          <div className="settings-toggle-row">
            <div>
              <strong>Automatically read questions</strong>
              <p>
                Read interview questions aloud when voice features
                are enabled.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.autoRead}
              aria-label="Automatically read questions"
              className={`settings-switch ${
                settings.autoRead ? "switch-on" : ""
              }`}
              onClick={() =>
                update("autoRead", !settings.autoRead)
              }
            >
              <span />
            </button>
          </div>
        </section>

        <div className="settings-actions">
          <button
            type="button"
            className="settings-reset"
            onClick={resetSettings}
            disabled={saving}
          >
            <RotateCcw size={16} />
            Reset form
          </button>

          <button
            type="submit"
            className="settings-save"
            disabled={saving || loading}
          >
            {saving ? (
              <LoaderCircle
                className="settings-spinner"
                size={17}
              />
            ) : saved ? (
              <CheckCircle2 size={17} />
            ) : (
              <Save size={17} />
            )}

            {saving
              ? "Saving..."
              : saved
                ? "Settings saved"
                : "Save settings"}
          </button>
        </div>

        {message && (
          <div
            className={`settings-notice ${
              messageType === "success"
                ? "settings-notice-success"
                : "settings-notice-error"
            }`}
            role="status"
          >
            {messageType === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}

            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  );
}

export default Settings;
