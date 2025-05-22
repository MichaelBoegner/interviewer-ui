import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AsciiHeader } from "./ASCII";

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate(); // ← Add this

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/user/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((data) => setUserData(data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!userData) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto text-green-400 bg-black min-h-screen">
      <AsciiHeader text="TECHNICAL INTERVIEW TERMINAL v1.0.0" />
      <div className="text-yellow-400 text-xs mb-2 md:mb-0">
        <span className="mr-2">[SYSTEM]:</span> Displaying user dashboard
      </div>
      <button
        onClick={() => navigate("/interview")}
        className="mt-4 bg-black border border-green-500 text-green-500 px-4 py-2 hover:bg-green-800 hover:text-black transition-colors duration-300 retro-button"
      >
        [ START_NEW_INTERVIEW ]
      </button>

      <div className="mb-6">
        <p>
          <strong>Email:</strong> {userData.email}
        </p>
        <p>
          <strong>Plan:</strong> {userData.plan}
        </p>
        <p>
          <strong>Individual Credits:</strong> {userData.individual_credits}
        </p>
        <p>
          <strong>Subscription Credits:</strong> {userData.subscription_credits}
        </p>
        <p>
          <strong>Total Credits:</strong>{" "}
          {userData.individual_credits + userData.subscription_credits}
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Past Interviews</h2>
      {!userData.past_interviews || userData.past_interviews.length === 0 ? (
        <p>No past interviews yet.</p>
      ) : (
        <ul className="list-none pl-0">
          {userData.past_interviews.map((iv) => (
            <li
              key={iv.id}
              onClick={() => navigate(`/conversation/${iv.id}`)}
              className="cursor-pointer p-2 hover:bg-green-800 rounded mb-2"
            >
              <div>
                {new Date(iv.started_at).toLocaleString()} — {iv.score ?? "N/A"}
                %
              </div>
              <div className="text-sm text-green-300">{iv.feedback}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
