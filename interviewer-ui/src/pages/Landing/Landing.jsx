import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [githubClicked, setGithubClicked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleGithubClick = () => {
    setGithubClicked(true);
    posthog.capture("github_login_clicked");
  };

  return (
    <div className="landing-page">
      {/* === Hero Section === */}
      <div className="hero-section">
        <h1 className="hero-headline">
          Mock Backend Interviews Using Real Job Descriptions
        </h1>
        <p className="hero-subheadline">
          Sign up now and get your first interview for FREE!
        </p>

        <div className="sign-in-section">
          {isLoggedIn ? (
            <button
              className="login-button"
              onClick={() => {
                posthog.capture("go_to_dashboard_clicked");
                navigate("/dashboard");
              }}
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate("/signup");
                  posthog.capture("email_login_clicked");
                }}
                className="login-button"
              >
                [ SIGN_UP_WITH_EMAIL ]
              </button>
              <a
                onClick={handleGithubClick}
                href={`https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(import.meta.env.VITE_GITHUB_REDIRECT_URI)}&scope=${encodeURIComponent("user:email")}`}
                className={`login-button ${githubClicked ? "disabled" : ""}`}
                style={
                  githubClicked ? { pointerEvents: "none", opacity: 0.5 } : {}
                }
              >
                <img
                  src="/github-mark-white.png"
                  alt="GitHub logo"
                  className="github-icon"
                />
                [ SIGN_UP_WITH_GITHUB ]
              </a>
            </>
          )}
        </div>
      </div>

      {/* === Demo Section ===
      <div className="section demo-section">
        <h2>See it in action</h2>
        <div className="demo-grid">
          <video className="demo-video" autoPlay muted loop controls>
            <source src="/demo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <ul className="feature-list">
            <li>🧠 Upload a job description → Get custom questions</li>
            <li>📈 Instant feedback after every response</li>
            <li>🗂 Review past interviews anytime</li>
            <li>🔐 Built for privacy. No data shared or sold.</li>
          </ul>
        </div>
      </div> */}

      {/* === Value Prop Section === */}
      <div className="section value-section">
        <h2>Why Interviewer?</h2>
        <p>
          Most coding platforms test algorithms. Interviewer prepares you for
          the real conversation. Get structured questions and honest AI feedback
          designed around the exact job you’re applying to.
        </p>
        <div className="value-grid">
          <div>✅ Realistic mock interviews</div>
          <div>✅ Target real jobs</div>
          <div>✅ Practice at your pace</div>
          <div>✅ Measurable progress</div>
        </div>
      </div>

      {/* === Pricing Section === */}
      <div className="section pricing-section">
        <h2>Simple, fair pricing!</h2>
        <p>
          Every new account gets one free interview. No credit card required.
        </p>
        <table className="pricing-table">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Price</th>
              <th>Interviews</th>
              <th>Per Interview</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Free Trial</strong>
              </td>
              <td>$0</td>
              <td>1</td>
              <td>$0</td>
            </tr>
            <tr>
              <td>Individual</td>
              <td>$4.99</td>
              <td>1</td>
              <td>$4.99</td>
            </tr>
            <tr>
              <td>Pro</td>
              <td>$19.99/month</td>
              <td>10/month</td>
              <td>$2.50</td>
            </tr>
            <tr>
              <td>Premium</td>
              <td>$29.99/month</td>
              <td>20/month</td>
              <td>$1.50</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* === About Section === */}
      <div className="section about-section">
        <h2>Made by a dev who hates interview anxiety.</h2>
        <div className="about">
          <p>
            I got tired of feeling rusty before interviews, so I built
            Interviewer to simulate the real thing. Don't let your nerves stand
            in the way of your dream job. Get started for FREE now!
          </p>
          <div className="sign-in-section">
            {isLoggedIn ? (
              <button
                className="login-button"
                onClick={() => {
                  posthog.capture("go_to_dashboard_clicked");
                  navigate("/dashboard");
                }}
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigate("/signup");
                    posthog.capture("email_login_clicked");
                  }}
                  className="login-button"
                >
                  [ SIGN_UP_WITH_EMAIL ]
                </button>
                <a
                  onClick={handleGithubClick}
                  href={`https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(import.meta.env.VITE_GITHUB_REDIRECT_URI)}&scope=${encodeURIComponent("user:email")}`}
                  className={`login-button ${githubClicked ? "disabled" : ""}`}
                  style={
                    githubClicked ? { pointerEvents: "none", opacity: 0.5 } : {}
                  }
                >
                  <img
                    src="/github-mark-white.png"
                    alt="GitHub logo"
                    className="github-icon"
                  />
                  [ SIGN_UP_WITH_GITHUB ]
                </a>
              </>
            )}
          </div>
          <p>
            Reach me at{" "}
            <a className="about-a" href="mailto:support@mail.interviewer.dev">
              support@mail.interviewer.dev
            </a>{" "}
            or{" "}
            <a
              className="about-a"
              href="https://www.linkedin.com/in/michael-boegner-855a9741/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
