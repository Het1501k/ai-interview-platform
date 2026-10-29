
import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import "./AuthGate.css";


export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Firebase error code:", error.code);
    console.error("Firebase error message:", error.message);
    console.error("Firebase error details:", error.customData);
  }
};

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function handleGoogleLogin() {
    setError("");
    setSigningIn(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(
        err.code === "auth/unauthorized-domain"
          ? "This domain is not authorized in Firebase Authentication settings."
          : err.code === "auth/popup-closed-by-user"
          ? "Sign-in was cancelled. Please try again."
          : err.message || "Unable to sign in. Please try again."
      );
    } finally {
      setSigningIn(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message || "Unable to sign out.");
    }
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <p>Loading InterviewAI...</p>
      </div>
    );
  }

  if (user) {
    return (
      <>
        <div className="auth-user-bar">
          <div className="auth-user-info">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" />
            ) : (
              <div className="auth-avatar">
                {(user.displayName || user.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div>
              <strong>{user.displayName || "InterviewAI User"}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          <button
            className="auth-logout"
            onClick={handleLogout}
            type="button"
          >
            Sign out
          </button>
        </div>

        {children}
      </>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo">AI</div>
        <p className="auth-eyebrow">YOUR CAREER PARTNER</p>
        <h1>Welcome to InterviewAI</h1>
        <p className="auth-description">
          Practice smarter. Build confidence. Get ready for your next
          opportunity with personalized interview preparation.
        </p>

        <button
          className="google-login-button"
          onClick={handleGoogleLogin}
          disabled={signingIn}
          type="button"
        >
          {signingIn ? (
            <>
              <span className="auth-spinner small" />
              Signing in...
            </>
          ) : (
            <>
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.1 13.22l7.98 6.19C13.02 13.72 18.06 9.5 24 9.5Z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.77 7.18l7.73 6C44.4 37.95 46.98 31.8 46.98 24.55Z" />
                <path fill="#FBBC05" d="M11.08 28.59A14.4 14.4 0 0 1 10.3 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 3.08 10.78l8-6.19Z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.17 2.3-5.94 0-10.98-4.22-12.92-9.91l-8 6.19C6.5 43.62 14.62 48 24 48Z" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {error && <p className="auth-error" role="alert">{error}</p>}

        <p className="auth-privacy">
          Sign in with your Google account to access your interview workspace.
        </p>
      </section>
    </main>
  );
}
