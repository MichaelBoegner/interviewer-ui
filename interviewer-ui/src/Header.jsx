import { Link } from "react-router-dom";
import { AsciiHeader } from "./ASCII";

export default function Header() {
  return (
    <header>
      <AsciiHeader text="TECHNICAL INTERVIEW TERMINAL v1.0.0" />
      <nav className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/interview">Interview</Link>
        <Link to="/login">Logout</Link>
      </nav>
    </header>
  );
}
