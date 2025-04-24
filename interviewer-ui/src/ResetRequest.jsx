import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AsciiHeader } from './App';

export default function ResetRequest() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_URL}/auth/request-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setMessage("If that email exists, we sent you a reset link.");
    } else {
      setMessage("Something went wrong.");
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
    <AsciiHeader text="RESET MODULE v1.0.0" />

    {/* Instruction */}
    <div className="text-green-300 text-sm typewriter px-1">
      <span className="text-yellow-400">$</span> ENTER EMAIL TO RECEIVE PASSWORD RESET LINK
    </div>

    {/* Form */}
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6 px-1">
      {/* Email Field */}
      <div className="flex items-center">
        <span className="text-yellow-400 mr-2">$</span>
        <span className="text-green-500 mr-2">email:</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="flex-1 bg-black text-green-400 border-b border-green-500 focus:border-green-400 outline-none p-3"
        />
      </div>

      {/* Message */}
      {message && (
        <div className="text-yellow-400 text-xs border border-yellow-600 bg-yellow-900/30 p-3 rounded">
          {message}
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col gap-4">
        <button
          type="submit"
          className="w-full bg-black border hover:bg-green-800 transition-colors retro-button"
        >
          [ SEND_RESET_LINK ]
        </button>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full bg-black border hover:bg-blue-800 transition-colors retro-button"
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
