import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ResetRequest from "./pages/ResetRequest/ResetRequest";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import UserSignUp from "./pages/UserSignUp/UserSignUp";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import Login from "./pages/Login/Login";
import Landing from "./pages/Landing/Landing";
import Dashboard from "./pages/Dashboard/Dashboard";
import Conversation from "./pages/Conversation/Conversation";
import Interview from "./pages/Interview/Interview";
import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Terms from "./components/Footer/Terms";
import Privacy from "./components/Footer/Privacy";

function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
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
      <Header setToken={updateToken} isAuthenticated={isAuthenticated} />
      <Routes>
        <Route path="/about" element={<Landing />} />
        <Route path="/signup" element={<UserSignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login setToken={updateToken} />
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
        <Route path="/conversation/:interviewId" element={<Conversation />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Navigate to="/about" replace />} />
      </Routes>
      <Footer />
    </Router>
  );
}
