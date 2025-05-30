import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ResetRequest.css";

export default function ResetRequest() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_URL}/auth/request-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setMessage("If that email exists, we sent you a reset link.");
    } else {
      setMessage("Something went wrong.");
    }
  };

  return (
    <div className="reset-screen">
      <div className="reset-box">
        <div className="scanline"></div>

        <div className="top-bar">
          <div>reset.exe</div>
        </div>

        <div className="reset-instructions">
          <span className="label-symbol">$</span> ENTER EMAIL TO RECEIVE
          PASSWORD RESET LINK
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="email-field">
            <span className="label-symbol">$</span>
            <span className="field-label">email:</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="email-input"
            />
          </div>

          {message && <div className="feedback-message">{message}</div>}

          <div className="button-group">
            <button type="submit" className="retro-button green">
              [ SEND_RESET_LINK ]
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
