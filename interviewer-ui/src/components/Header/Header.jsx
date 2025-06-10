import { Link, useNavigate, useLocation } from "react-router-dom";
import posthog from "posthog-js";
import { AsciiHeader } from "../ASCII/ASCII";
import "./Header.css";

export default function Header({ setToken, isAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const shouldUseCenteredLayout = [
    "/about",
    "/signup",
    "/verify-email",
    "/login",
    "/reset-request",
    "/reset-password",
    "/terms",
    "/privacy",
  ].includes(path);

  const handleLogout = () => {
    posthog.capture("logout_clicked");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    navigate("/login");
  };

  return (
    <>
      <div
        className={`header-wrapper ${shouldUseCenteredLayout ? "centered-layout" : ""}`}
      >
        <div className="topbar">
          {!shouldUseCenteredLayout && (
            <div className="header-logo-row">
              <img
                src="/interviewer-logo.png"
                alt="Interviewer Logo"
                className="header-logo"
              />
            </div>
          )}

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

        {shouldUseCenteredLayout && (
          <div className="ascii-banner">
            <AsciiHeader text="BACKEND INTERVIEW TERMINAL v1.0.0" />
          </div>
        )}
      </div>
    </>
  );
}
