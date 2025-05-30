import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ResetRequest from "./ResetRequest";
import ResetPassword from "./ResetPassword";
import LoginPage from "./LoginPage";
import Landing from "./Landing";
import Dashboard from "./Dashboard";
import ConversationScreen from "./ConversationScreen";
import Interview from "./Interview";
import "./App.css";
import Header from "./Header";

function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now(); // JWT `exp` is in seconds
  } catch (e) {
    console.error("Failed to parse token:", e);
    return false;
  }
}

export default function App() {
  const getInitialToken = () => {
    try {
      return localStorage.getItem("token") || null;
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return null;
    }
  };

  const [token, setToken] = useState(getInitialToken());

  const updateToken = (newToken) => {
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

  useEffect(() => {
    const intervalId = setInterval(() => {
      const storedToken = localStorage.getItem("token");
      if (storedToken !== token) {
        setToken(storedToken || null);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [token]);

  const isAuthenticated = token && isTokenValid(token);

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage setToken={updateToken} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard token={token} setToken={updateToken} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/interview"
          element={
            isAuthenticated ? (
              <Interview token={token} setToken={updateToken} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/reset-request" element={<ResetRequest />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/conversation/:interviewId"
          element={<ConversationScreen />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
