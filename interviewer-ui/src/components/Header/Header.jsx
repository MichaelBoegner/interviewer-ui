import { Link, useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import { AsciiHeader } from "../ASCII/ASCII";
import "./Header.css";

export default function Header({ setToken, isAuthenticated }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    posthog.capture("logout_clicked");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    navigate("/login");
  };

  return (
    <>
      <div className="topbar">
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/interview">Interview</Link>
          <Link to="/about">About</Link>

          {isAuthenticated ? (
            <span onClick={handleLogout} className="logout-link">
              Logout
            </span>
          ) : (
            <Link to="/login" className="logout-link">
              Login
            </Link>
          )}
        </div>
      </div>
      <div className="ascii-banner">
        <AsciiHeader text="TECHNICAL INTERVIEW TERMINAL v1.0.0" />
      </div>
    </>
  );
}
