import { useState } from "react";

export default function ResetRequest() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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
    <form onSubmit={handleSubmit}>
      <h2>Request Password Reset</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        required
      />
      <button type="submit">Send Reset Link</button>
      {message && <p>{message}</p>}
    </form>
  );
}
