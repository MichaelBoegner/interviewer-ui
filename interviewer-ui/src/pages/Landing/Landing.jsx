import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    // let <a> handle redirect naturally
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
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <a href="/login" className="login-button">
                [ SIGN_IN_WITH_EMAIL ]
              </a>
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
            Interviewer is a solo-built, AI-powered platform that simulates
            backend engineering interviews. Each interview features real-time
            questions, tailored feedback, and a final score. You also get access
            to past interviews you've already started or completed so you can
            review and improve.
            <br />
            <br />
            As a solo dev, I made Interviewer because I always feel so nervous
            about an upcoming interview, no matter how confident I feel in my
            knowledge. Part of that is just wanting to do well, but I think a
            bigger part comes from so infrequently getting to test my knowledge
            in an interview setting. So I created something to help myself, and
            hopefully others, get more comfortable through regular practice, so
            the nerves don’t get in the way.
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
            Hi! I'm Michael, a backend engineer based in Thailand. You can find
            me on{" "}
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
