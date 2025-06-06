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
            Start for just <strong>$4.99</strong> per interview. Or choose a
            subscription to lower the cost per interview:
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
                <td>Pay-as-you-go</td>
                <td>$4.99</td>
                <td>1</td>
                <td>$4.99</td>
              </tr>
              <tr>
                <td>Pro</td>
                <td>$19.99 / mo</td>
                <td>10 / mo</td>
                <td>$2.00</td>
              </tr>
              <tr>
                <td>Premium</td>
                <td>$29.99 / mo</td>
                <td>20 / mo</td>
                <td>$1.50</td>
              </tr>
            </tbody>
          </table>

          <p>
            <strong>🧪 Version 1.0.0 Coming</strong>
            <br />
            Public version coming soon! Reach out below if you'd like early
            access or to be notified when it's live.
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
          [ LOGIN/SIGNUP ]
        </a>
      </div>
    </div>
  );
}
