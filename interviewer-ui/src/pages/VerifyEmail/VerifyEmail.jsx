import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./VerifyEmail.css";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const hasSubmittedRef = useRef(false);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token || hasSubmittedRef.current) return;

    hasSubmittedRef.current = true;

    const verify = async () => {
      try {
        const response = await fetch(`${API_URL}/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Verification failed");
        }

        localStorage.setItem("token", data.jwtoken);
        setStatus("success");
        setTimeout(() => navigate("/dashboard", { replace: true }), 3000);
      } catch (err) {
        const alreadyExists = err.message.includes("Email already exists");
        setError(err.message);
        setStatus("error");

        if (alreadyExists) {
          setTimeout(() => navigate("/login", { replace: true }), 4000);
        }
      }
    };

    verify();
  }, [searchParams, API_URL, navigate]);

  return (
    <div className="login-container">
      <div className="terminal-window auth-box">
        <div className="scanline"></div>
        <div className="auth-body">
          <div className="auth-title">
            <span className="terminal-prompt">$</span> EMAIL VERIFICATION
          </div>

          {status === "verifying" && (
            <div className="info-box">Verifying your account...</div>
          )}

          {status === "success" && (
            <div className="success-box">
              <span className="success-label">SUCCESS:</span> Your account has
              been verified! Logging in...
            </div>
          )}

          {status === "error" && (
            <div className="system-message error-box">
              {error === "Email already exists"
                ? "Email already exists. Redirecting back to Login."
                : error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
