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
            Every new account will come with one free interview, no credit card
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
            <strong>🧪 Version 1.0.0 Coming</strong>
            <br />
            Public version coming soon! Reach out below if you'd like to be
            notified when it's live.
          </p>

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
            .
          </p>
        </div>

        <a href="/login" className="login-button">
          [ LOGIN/SIGNUP ]
        </a>
      </div>
    </div>
  );
}
