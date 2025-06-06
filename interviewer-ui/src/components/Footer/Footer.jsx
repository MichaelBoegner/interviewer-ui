import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      <div className="footer-links">
        <Link to="/terms">Terms</Link>
        <Link to="/privacy">Privacy</Link>
      </div>
      <div className="footer-note">
        © 2025 Interviewer.dev. All rights reserved.
      </div>
    </footer>
  );
}
