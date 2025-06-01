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

  const totalCredits =
    userData.individual_credits + userData.subscription_credits;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-grid">
        <div className="left-panel">
          <h2 className="section-heading">Account Info</h2>
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
              <strong>Subscription Credits:</strong>{" "}
              {userData.subscription_credits}
            </p>
            <p>
              <strong>Total Credits:</strong> {totalCredits}
            </p>
          </div>

          <div className="purchase-options">
            <h3 className="sub-heading">Buy / Subscribe</h3>
            <button className="retro-button">
              Buy 1 Interview (Individual)
            </button>
            <button className="retro-button">Subscribe: 10/month (Pro)</button>
            <button className="retro-button">
              Subscribe: 20/month (Premium)
            </button>
          </div>
        </div>

        <div className="right-panel">
          <h2 className="section-heading">Past Interviews</h2>
          {!userData.past_interviews ||
          userData.past_interviews.length === 0 ? (
            <p>No past interviews yet.</p>
          ) : (
            <div className="interview-scroll">
              <ul className="interview-list">
                {userData.past_interviews.map((iv) => (
                  <li
                    key={iv.id}
                    onClick={() => navigate(`/conversation/${iv.id}`)}
                    className="interview-item"
                  >
                    <div>
                      {new Date(iv.started_at).toLocaleString()} —{" "}
                      {iv.score ?? "N/A"}%
                    </div>
                    <div className="interview-feedback">{iv.feedback}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
