import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // create this file or move to App.css

export default function LoginPage({ setToken }) {
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
      setToken(data.jwtoken);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError(error.message || "Login failed. Please check your credentials.");
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
      if (!response.ok) throw new Error(data.message || "Registration failed");

      setSuccessMessage("Account created successfully! You can now log in.");
      setShowRegister(false);
      setUsername("");
      setPassword("");
      setEmail("");
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");
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
  };

  return (
    <div className="login-container">
      <div className="terminal-window auth-box">
        <div className="scanline"></div>
        <div className="auth-header">
          <div>{showRegister ? "register.exe" : "login.exe"}</div>
        </div>
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
                <span className="terminal-prompt">$</span>
                <span className="input-label">user:</span>
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
              <span className="terminal-prompt">$</span>
              <span className="input-label">mail:</span>
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
              <span className="terminal-prompt">$</span>
              <span className="input-label">pass:</span>
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
            Forgot your password? <a href="/reset-request">Reset it here</a>
          </p>
          <div className="footer-note">
            © 2025 Interviewer.dev. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
