import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./githubCallback.css";

function GithubCallback() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const hasRun = useRef(false);

  useEffect(() => {
    if (window.rdt) {
      window.rdt("track", "PageVisit");
    }
  }, []);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      // User cancelled or denied GitHub permissions
      navigate("/login?error=github_denied");
      return;
    }

    if (!code) {
      // Malformed callback with no code or error
      navigate("/login?error=github_malformed");
      return;
    }

    fetch(`${API_URL}/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("GitHub login failed");
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("token", data.jwt);
        localStorage.setItem("username", data.username);
        localStorage.setItem("userId", data.user_id);
        navigate("/dashboard");
      })
      .catch(() => {
        navigate("/login?error=github_failed");
      });
  }, []);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      fetch(`${API_URL}/auth/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("token", data.jwt);
          localStorage.setItem("username", data.username);
          localStorage.setItem("userId", data.user_id);
          navigate("/dashboard");
        });
    }
  }, []);

  return (
    <div className="auth-callback-screen">
      <div className="auth-loading-card">
        <p>Signing you in with GitHub. . .</p>
        <div className="spinner" />
      </div>
    </div>
  );
}

export default GithubCallback;
