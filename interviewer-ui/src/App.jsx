import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ResetRequest from './ResetRequest';
import ResetPassword from './ResetPassword';
import LoginPage from "./LoginPage";
import LandingPage from "./LandingPage";
import Dashboard from './Dashboard';
import InterviewScreen from "./InterviewScreen";

import './App.css';

// Add this constant at the top of the file, after imports
const API_URL = import.meta.env.VITE_API_URL;

// Add this ASCII art banner function for the retro vibe.
export const AsciiHeader = ({ text }) => {
  return (
      <pre className="text-green-500 text-sm mx-auto block" style={{
        fontFamily: "'Fira Code', 'Courier New', monospace",
        fontSize: "0.7rem",
        lineHeight: 1.2,
        whiteSpace: "pre",
        letterSpacing: 0,
        textAlign: "center",
        margin: 0,
        padding: 0,
        width: "100%",
        fontWeight: "bold",
        fontVariantLigatures: "none",
      }}>{`
  ___ _   _ _____ _____ ______     _____ _______        _______ ____  
 |_ _| \\ | |_   _| ____|  _ \\ \\   / /_ _| ____\\ \\      / / ____|  _ \\ 
  | ||  \\| | | | |  _| | |_) \\ \\ / / | ||  _|  \\ \\ /\\ / /|  _| | |_) |
  | || |\\  | | | | |___|  _ < \\ V /  | || |___  \\ V  V / | |___|  _ < 
 |___|_| \\_| |_| |_____|_| \\_\\ \\_/  |___|_____|  \\_/\\_/  |_____|_| \\_\\
                                                                       
${'>>'} ${text}
`}</pre>
  );
};



// ✅ Main App Component
export default function App() {
  // Initialize token from localStorage with added safety check
  const getInitialToken = () => {
    try {
      return localStorage.getItem("token") || null;
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return null;
    }
  };

  const [token, setToken] = useState(getInitialToken());
  
  // Function to update token state
  const updateToken = (newToken) => {
    console.log("updateToken called with:", newToken);
    try {
      if (newToken) {
        localStorage.setItem("token", newToken);
      } else {
        localStorage.removeItem("token");
      }
      setToken(newToken);
    } catch (e) {
      console.error("Error updating token in localStorage:", e);
    }
  };
  
  // Safe localStorage check
  const checkToken = () => {
    try {
      const storedToken = localStorage.getItem("token");
      console.log("Checking stored token:", storedToken);
      if (storedToken !== token) {
        console.log("Token mismatch, updating state");
        setToken(storedToken || null);
      }
    } catch (e) {
      console.error("Error checking token in localStorage:", e);
    }
  };

  // Check token on mount and when token changes
  useEffect(() => {
    checkToken();
    
    // Set up an interval to periodically check token
    const intervalId = setInterval(checkToken, 2000);
    
    return () => clearInterval(intervalId);
  }, [token]);
  
  return (
<Router>
  <Routes>
    <Route path="/" element={<LandingPage />} /> 
<Route path="/login" element={token ? <Navigate to="/interview" replace /> : <LoginPage setToken={updateToken} />} />
<Route path="/interview" element={token ? <InterviewScreen token={token} setToken={updateToken} /> : <Navigate to="/login" replace />} />
    <Route path="/reset-request" element={<ResetRequest />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</Router>
  );
}
