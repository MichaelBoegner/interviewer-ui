import { Link } from "react-router-dom";
import { AsciiHeader } from "../ASCII/ASCII";
import "./Header.css";
export default function Header() {
  return (
    <>
      <div className="topbar">
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/interview">Interview</Link>
          <Link to="/login">Logout</Link>
        </div>
      </div>
      <div className="ascii-banner">
        <AsciiHeader text="TECHNICAL INTERVIEW TERMINAL v1.0.0" />
      </div>
    </>
  );
}
