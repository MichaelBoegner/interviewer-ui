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
      <div className="landing-content">
        <p className="intro-text">
          AI-driven backend engineering interviews. Real questions. Real
          feedback.
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
                  navigate("/login");
                  posthog.capture("email_login_clicked");
                }}
                className="login-button"
              >
                [ SIGN_IN_WITH_EMAIL ]
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
                [ SIGN_IN_WITH_GITHUB ]
              </a>
            </>
          )}
        </div>

        <div className="info-section">
          <p>
            <strong>✅ What is it?</strong>
            <br />
            Interviewer isn’t just another coding practice tool. It’s built to
            help you master real interviews. Drop in the job description from a
            role you’re aiming for, and get a custom mock interview designed
            around that exact position. Sharpen your skills with targeted
            questions, instant feedback, a final score, and access to every past
            interview, so you can walk into the real thing with confidence!
          </p>

          <p>
            <strong>💸 Pricing</strong>
            <br />
            Every new account comes with one free interview, no credit card
            required. <br />
            After that, it's just <strong>$4.99</strong> per interview. Or
            choose a subscription to lower the cost per interview:
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
                <td>$0 (no credit card)</td>
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

          <p>
            <strong>👨‍💻 Who made this?</strong>
            <br />
            As a solo dev, I made Interviewer because I always feel so nervous
            about an upcoming interview, no matter how confident I feel in my
            knowledge. Part of that is just wanting to do well, but I think a
            bigger part comes from so infrequently getting to test my knowledge
            in an interview setting. So I created something to help myself, and
            hopefully others, get more comfortable through regular practice, so
            the nerves don’t get in the way.
            <br />
            <br />
            You can find me on{" "}
            <a
              href="https://www.linkedin.com/in/michael-boegner-855a9741/"
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              LinkedIn
            </a>{" "}
            or reach me by email at{" "}
            <a
              href="mailto:support@mail.interviewer.dev"
              className="email-link"
            >
              support@mail.interviewer.dev
            </a>
            . I respond quickly (usually same day) and am happy to answer any
            questions you may have! ^_^
          </p>
        </div>
      </div>
    </div>
  );
}
