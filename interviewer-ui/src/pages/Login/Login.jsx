import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import posthog from "posthog-js";
import "./Login.css";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthError = params.get("error");

    if (oauthError === "github_denied") {
      setError("GitHub login was cancelled.");
    } else if (oauthError === "github_failed") {
      setError("GitHub login failed. Please try again.");
    } else if (oauthError === "github_malformed") {
      setError("Invalid GitHub login attempt.");
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");
      if (!data.jwtoken) throw new Error("No token received from server");

      localStorage.setItem("token", data.jwtoken);
      localStorage.setItem("username", data.username);
      localStorage.setItem("userId", data.user_id);
      setToken(data.jwtoken);

      posthog.identify(data.user_id || email, {
        email: email,
        login_method: "standard",
      });
      posthog.capture("login_successful");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(error.message || "Login failed. Please check your credentials.");
      posthog.capture("login_failed", {
        error: error.message,
        email_attempted: email,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="terminal-window auth-box">
        <div className="auth-body">
          <div className="auth-title">
            <span className="terminal-prompt">$</span> SYSTEM AUTHENTICATION
            REQUIRED
          </div>

          {error && (
            <div className="error-box">
              <span className="error-label">ERROR:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-row">
              <input
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="input-row">
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="retro-button"
            >
              {isLoading ? "[ PROCESSING... ]" : "[ SIGN_IN_WITH_EMAIL ]"}
            </button>
            <p>OR</p>
          </form>

          <a
            href={`https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(import.meta.env.VITE_GITHUB_REDIRECT_URI)}&scope=${encodeURIComponent("user:email")}`}
            className={"login-button-login"}
          >
            <img
              src="/github-mark-white.png"
              alt="GitHub logo"
              className="github-icon"
            />
            [ SIGN_IN_WITH_GITHUB ]
          </a>

          <p className="registration">
            New here?{" "}
            <a
              href="/signup"
              onClick={() => posthog.capture("signup_link_clicked")}
            >
              Create an account
            </a>
          </p>

          <p className="forgot-password">
            Forgot your password?{" "}
            <a
              href="/reset-request"
              onClick={() => posthog.capture("password_reset_link_clicked")}
            >
              Reset it here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
