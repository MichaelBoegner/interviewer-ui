import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ResetPassword.css";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jwt = urlParams.get("token");
    if (jwt) setToken(jwt);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token, new_password: password }),
    });

    if (res.ok) {
      setMessage("Password reset! You may now log in.");
      setTimeout(() => navigate("/login"), 1000);
    } else {
      setMessage("Reset failed. Token may be invalid or expired.");
    }
  };

  return (
    <div className="reset-screen">
      <div className="reset-box">
        <div className="scanline"></div>

        <div className="reset-instructions">
          <span className="label-symbol">$</span> ENTER A NEW PASSWORD TO
          COMPLETE RESET
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="password-field">
            <span className="label-symbol">$</span>
            <span className="field-label">password:</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              className="password-input"
            />
          </div>

          {message && <div className="feedback-message">{message}</div>}

          <div className="button-group">
            <button type="submit" className="retro-button green">
              [ RESET_PASSWORD ]
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="retro-button blue"
            >
              [ BACK_TO_LOGIN ]
            </button>
          </div>
        </form>

        <div className="footer-note">
          © 2025 Interviewer.dev. All rights reserved.
        </div>
      </div>
    </div>
  );
}
