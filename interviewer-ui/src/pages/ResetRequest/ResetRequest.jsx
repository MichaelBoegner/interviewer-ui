import { useState } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import "./ResetRequest.css";

export default function ResetRequest() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    posthog.capture("reset_request_submitted", { email });

    const res = await fetch(`${API_URL}/auth/request-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setMessage("If that email exists, we sent you a reset link.");
      posthog.capture("reset_request_success", { email });
    } else {
      setMessage("Something went wrong.");
      posthog.capture("reset_request_failed", {
        email,
        status: res.status,
      });
    }
  };

  return (
    <div className="reset-screen">
      <div className="reset-box">
        <div className="scanline"></div>

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
              onClick={() => {
                posthog.capture("reset_request_back_to_login");
                navigate("/login");
              }}
              className="retro-button blue"
            >
              [ BACK_TO_LOGIN ]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
