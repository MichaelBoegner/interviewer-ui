import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard({ token, setToken }) {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/user/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          setToken(null);
          navigate("/login", { replace: true });
          return null;
        }
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        return res.json();
      })
      .then((data) => {
        if (data) setUserData(data);
      })
      .catch((err) => setError(err.message));
  }, [token, navigate, setToken]);

  if (error) return <div className="dashboard-error">Error: {error}</div>;
  if (!userData) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="system-msg">
        <span className="label">[SYSTEM]:</span> Displaying user dashboard
      </div>

      <button
        onClick={() => navigate("/interview")}
        className="retro-button start-btn"
      >
        [ START_NEW_INTERVIEW ]
      </button>

      <div className="user-info">
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

      <h2 className="section-heading">Past Interviews</h2>

      {!userData.past_interviews || userData.past_interviews.length === 0 ? (
        <p>No past interviews yet.</p>
      ) : (
        <ul className="interview-list">
          {userData.past_interviews.map((iv) => (
            <li
              key={iv.id}
              onClick={() => navigate(`/conversation/${iv.id}`)}
              className="interview-item"
            >
              <div>
                {new Date(iv.started_at).toLocaleString()} — {iv.score ?? "N/A"}
                %
              </div>
              <div className="interview-feedback">{iv.feedback}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
