import { useState } from "react";
import posthog from "posthog-js";
import "./UserSignUp.css";

export default function UserSignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const emailCheck = await fetch(`${API_URL}/auth/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const emailData = await emailCheck.json();
      if (emailData.exists) {
        setError("An account with that email already exists.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/auth/request-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");

      setSuccessMessage("Check your email to verify your account.");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setEmail("");

      posthog.capture("registration_successful", {
        email: email,
        username: username,
      });
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");

      posthog.capture("registration_failed", {
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
        <div className="scanline"></div>
        <div className="auth-body">
          <div className="auth-title">
            <span className="terminal-prompt">$</span> NEW USER REGISTRATION
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

          <form onSubmit={handleRegister} className="auth-form">
            <div className="input-row">
              <input
                placeholder="what name should we use in interviews?"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

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
                type={showPassword ? "text" : "password"}
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="input-row">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="input-row">
              <label>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                />{" "}
                Show Passwords
              </label>
            </div>

            <button
              type="submit"
              disabled={
                isLoading ||
                !email ||
                !password ||
                !username ||
                !confirmPassword
              }
              className="retro-button"
            >
              {isLoading ? "[ PROCESSING... ]" : "[ CREATE_ACCOUNT ]"}
            </button>
            <p className="registration">
              Already have an account?{" "}
              <a
                href="/login"
                onClick={() => posthog.capture("login_link_clicked")}
              >
                Login
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
