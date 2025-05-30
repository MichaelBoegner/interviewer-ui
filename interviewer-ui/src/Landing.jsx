import "./Landing.css"; // create this file

export default function Landing() {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <p className="intro-text">
          Practice mock technical interviews with AI.
          <br />
          Built for backend engineers, by a backend engineer.
        </p>

        <div className="info-section">
          <p>
            <strong>✅ What is it?</strong>
            <br />
            Interviewer is a solo-built, AI-powered platform that simulates
            technical interviews for backend engineers. You’ll receive real-time
            questions, feedback, and scoring — just like a real interview.
          </p>

          <p>
            <strong>👨‍💻 Who made this?</strong>
            <br />
            Hi! I'm Michael, a backend engineer, currently based in Thailand.
            Reach me at:{" "}
            <a
              href="mailto:support@mail.interviewer.dev"
              className="email-link"
            >
              support@mail.interviewer.dev
            </a>
          </p>

          <p>
            <strong>📬 Want early access?</strong>
            <br />
            Email me and I’ll personally notify you when it launches.
          </p>
        </div>

        <a href="/login" className="login-button">
          [ LOGIN ]
        </a>

        <div className="footer-text">
          © 2025 Interviewer.dev. All rights reserved.
        </div>
      </div>
    </div>
  );
}
