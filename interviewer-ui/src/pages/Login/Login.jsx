import { useState } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import "./Login.css";

export default function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

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
      localStorage.setItem("username", username);
      localStorage.setItem("userId", data.user_id);
      setToken(data.jwtoken);

      // ✅ Track successful login
      posthog.identify(data.user_id || email, {
        email: email,
        login_method: "standard",
      });
      posthog.capture("login_successful");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(error.message || "Login failed. Please check your credentials.");

      // ✅ Track login failure
      posthog.capture("login_failed", {
        error: error.message,
        email_attempted: email,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");

      setSuccessMessage("Account created successfully! You can now log in.");
      setShowRegister(false);
      setUsername("");
      setPassword("");
      setEmail("");

      // ✅ Track registration success
      posthog.capture("registration_successful", {
        email: email,
        username: username,
      });
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");

      // ✅ Track registration failure
      posthog.capture("registration_failed", {
        error: error.message,
        email_attempted: email,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setShowRegister(!showRegister);
    setError("");
    setSuccessMessage("");
    setUsername("");
    setPassword("");
    setEmail("");

    // ✅ Track form toggle
    posthog.capture(
      showRegister ? "viewed_login_form" : "viewed_register_form"
    );
  };

  return (
    <div className="login-container">
      <div className="terminal-window auth-box">
        <div className="scanline"></div>

        <div className="auth-body">
          <div className="auth-title">
            <span className="terminal-prompt">$</span>{" "}
            {showRegister
              ? "NEW USER REGISTRATION"
              : "SYSTEM AUTHENTICATION REQUIRED"}
          </div>

          {error && (
            <div className="error-box">
              <span className="error-label">ERROR:</span> {error}
            </div>
          )}

          {successMessage && (
            <div className="success-box">
              <span className="success-label">SUCCESS:</span> {successMessage}
            </div>
          )}

          <form
            onSubmit={showRegister ? handleRegister : handleSubmit}
            className="auth-form"
          >
            {showRegister && (
              <div className="input-row">
                <input
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            )}

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
              disabled={
                isLoading || !email || !password || (showRegister && !username)
              }
              className="retro-button"
            >
              {isLoading
                ? "[ PROCESSING... ]"
                : showRegister
                  ? "[ CREATE_ACCOUNT ]"
                  : "[ LOGIN ]"}
            </button>

            <button
              type="button"
              onClick={toggleForm}
              className="retro-button secondary"
            >
              [ {showRegister ? "RETURN_TO_LOGIN" : "NEW_USER_REGISTRATION"} ]
            </button>
          </form>

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
