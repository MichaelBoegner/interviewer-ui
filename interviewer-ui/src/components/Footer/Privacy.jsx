import "./Legal.css";

export default function Privacy() {
  return (
    <div className="legal-wrapper">
      <div className="legal-text">
        <h1>Privacy Policy</h1>

        <p>Last updated: June 6, 2025</p>

        <h2>1. Information We Collect</h2>
        <p>
          We collect personal information such as your name, email address, and
          activity on the platform to provide and improve our services.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use your information to deliver mock interviews, personalize
          feedback, manage your subscription, and improve our platform.
        </p>

        <h2>3. Third-Party Services</h2>
        <p>
          We use third-party tools for analytics (e.g. PostHog) and payment
          processing (e.g. Lemon Squeezy). These services have their own privacy
          policies.
        </p>

        <h2>4. Data Security</h2>
        <p>
          We take reasonable measures to protect your data but cannot guarantee
          complete security due to the nature of the internet.
        </p>

        <h2>5. Your Rights</h2>
        <p>
          You can request access, correction, or deletion of your data by
          contacting us at support@interviewer.dev.
        </p>

        <h2>6. Changes to This Policy</h2>
        <p>
          We may update this policy. Continued use of the service constitutes
          your acceptance of the updated terms.
        </p>
      </div>
    </div>
  );
}
