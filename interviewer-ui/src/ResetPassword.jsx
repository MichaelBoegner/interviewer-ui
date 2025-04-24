import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AsciiHeader } from './App';

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const jwt = urlParams.get("token");
    if (jwt) setToken(jwt);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token, new_password: password }),
    });
  
    if (res.ok) {
      setMessage("Password reset! You may now log in.");
      setTimeout(() => navigate("/login"), 1000); 
    } else {
      setMessage("Reset failed. Token may be invalid or expired.");
    }
  };
  return (
    <div className="h-screen flex items-center justify-center bg-black text-green-400 font-mono px-4">
      <div className="w-full max-w-md border-2 border-green-500 bg-gray-900 p-8 pt-14 relative terminal-window space-y-8">
        {/* Top Bar */}
        <div className="scanline"></div>
        <div className="absolute top-0 left-0 right-0 bg-green-600 text-black px-4 py-1 flex justify-between items-center">
          <div>reset.exe</div>
        </div>

        {/* Header */}
        <AsciiHeader text="RESET PASSWORD v1.0.0" />

        {/* Instructions */}
        <div className="text-green-300 text-sm px-1">
          <span className="text-yellow-400">$</span> ENTER A NEW PASSWORD TO COMPLETE RESET
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-6 px-1">
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">$</span>
            <span className="text-green-500 mr-2">password:</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
              className="flex-1 bg-black text-green-400 border-b border-green-500 focus:border-green-400 outline-none p-3"
            />
          </div>

          {message && (
            <div className="text-yellow-400 text-xs border border-yellow-600 bg-yellow-900/30 p-3 rounded">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <button
              type="submit"
              className="w-full bg-black border border-green-500 text-green-500 px-4 py-3 hover:bg-green-800 hover:text-black transition-colors retro-button"
            >
              [ RESET_PASSWORD ]
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-black border border-blue-500 text-blue-500 px-4 py-3 hover:bg-blue-800 hover:text-black transition-colors retro-button"
            >
              [ BACK_TO_LOGIN ]
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-xs text-gray-500 text-center pt-6">
          © 2025 Interviewer.dev. All rights reserved.
        </div>
      </div>
    </div>
  );
}
