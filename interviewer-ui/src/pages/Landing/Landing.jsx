import "./Landing.css";

export default function Landing() {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <p className="intro-text">
          AI-driven backend engineering interviews. Real questions. Real
          feedback.
        </p>

        <div className="info-section">
          <p>
            <strong>✅ What is it?</strong>
            <br />
            Interviewer is a solo-built, AI-powered platform that simulates
            backend engineering interviews. Each interview features real-time
            questions, tailored feedback, and a final score. You also get access
            to past interviews you've already started or completed so you can
            review and improve.
          </p>

          <p>
            <strong>💸 Pricing</strong>
            <br />
            Start for just <strong>$4.99</strong> per interview. Upgrade to
            bundles or subscriptions once you're ready to go deeper. Transparent
            pricing. No surprises.
          </p>

          <p>
            <strong>🧪 Version 1.0.0</strong>
            <br />
            This is the first public version. I'm going to work my hardest to
            keep up rapid iteration, with more features and polish coming soon,
            but please bear with me. It's just me and the robots for now. ^_^
          </p>

          <p>
            <strong>💬 Feedback welcome</strong>
            <br />
            I’m building this to hopefully help others. If something breaks or
            feels off, let me know. I’m listening and improving constantly.
          </p>

          <p>
            <strong>👨‍💻 Who made this?</strong>
            <br />
            Hi! I'm Michael, a backend engineer based in Thailand. Reach me
            directly at:{" "}
            <a
              href="mailto:support@mail.interviewer.dev"
              className="email-link"
            >
              support@mail.interviewer.dev
            </a>
          </p>
        </div>

        <a href="/login" className="login-button">
          [ LOGIN ]
        </a>
      </div>
    </div>
  );
}
