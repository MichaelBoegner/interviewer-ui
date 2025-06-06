import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
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
        if (data) {
          setUserData(data);

          // ✅ Track dashboard view
          posthog.identify(data.user_id || data.email, {
            email: data.email,
            plan: data.plan,
            status: data.status,
          });
          posthog.capture("dashboard_viewed", {
            plan: data.plan,
            total_credits: data.individual_credits + data.subscription_credits,
          });
        }
      })
      .catch((err) => setError(err.message));
  }, [token, navigate, setToken]);

  if (error) return <div className="dashboard-error">Error: {error}</div>;
  if (!userData) return <div className="dashboard-loading">Loading...</div>;

  const totalCredits =
    userData.individual_credits + userData.subscription_credits;

  const handlePurchase = async (tier) => {
    posthog.capture("subscription_purchase_attempted", { tier });

    try {
      const res = await fetch(`${API_URL}/payment/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Failed to start checkout:", errText);
        posthog.capture("subscription_checkout_failed", {
          tier,
          error: errText,
        });
        return;
      }

      const data = await res.json();
      if (data.checkout_url) {
        posthog.capture("subscription_checkout_started", { tier });
        window.open(data.checkout_url, "_blank");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      posthog.capture("subscription_checkout_exception", {
        tier,
        error: err.message,
      });
    }
  };

  const handleCancel = async () => {
    posthog.capture("subscription_cancel_clicked");

    try {
      const res = await fetch(`${API_URL}/payment/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Cancellation failed:", errText);
        posthog.capture("subscription_cancel_failed", {
          error: errText,
        });
        return;
      }

      posthog.capture("subscription_cancel_successful");
      alert(
        "Subscription canceled. You will retain access until the end of the billing cycle."
      );
      window.location.reload();
    } catch (err) {
      console.error("Cancel error:", err);
      posthog.capture("subscription_cancel_exception", {
        error: err.message,
      });
    }
  };

  const handleResume = async () => {
    posthog.capture("subscription_resume_clicked");

    try {
      const res = await fetch(`${API_URL}/payment/resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Resume failed:", errText);
        posthog.capture("subscription_resume_failed", {
          error: errText,
        });
        return;
      }

      posthog.capture("subscription_resume_successful");
      alert("Subscription resumed successfully.");
      window.location.reload();
    } catch (err) {
      console.error("Resume error:", err);
      posthog.capture("subscription_resume_exception", {
        error: err.message,
      });
    }
  };

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

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
              <strong>Status:</strong> {userData.status}
            </p>
            {userData.subscription_start_date && (
              <p>
                <strong>Subscription Start Date:</strong>{" "}
                {formatDate(userData.subscription_start_date)}
              </p>
            )}
            {userData.subscription_end_date && (
              <p>
                <strong>Subscription End Date:</strong>{" "}
                {formatDate(userData.subscription_end_date)}
              </p>
            )}
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
            <h3 className="section-heading">Buy/Subscribe</h3>
            <div className="sub-heading">INDIVIDUAL</div>
            <button
              className="retro-button"
              onClick={() => handlePurchase("individual")}
            >
              1 Interview | $4.99
            </button>

            <div className="sub-heading">SUBSCRIBE</div>
            <button
              className="retro-button"
              onClick={() => handlePurchase("pro")}
            >
              PRO | 10/month | $19.99/month
            </button>
            <button
              className="retro-button"
              onClick={() => handlePurchase("premium")}
            >
              PREMIUM | 20/month | $29.99/month
            </button>
            {userData.plan !== "free" && userData.status === "active" && (
              <button
                className="retro-button cancel-button"
                onClick={handleCancel}
              >
                Cancel Subscription
              </button>
            )}
            {userData.plan !== "free" && userData.status === "cancelled" && (
              <button
                className="retro-button resume-button"
                onClick={handleResume}
              >
                Resume Subscription
              </button>
            )}
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
                    onClick={() => {
                      posthog.capture("past_interview_clicked", {
                        interview_id: iv.id,
                        score: iv.score ?? null,
                      });
                      navigate(`/conversation/${iv.id}`);
                    }}
                    className="interview-item"
                  >
                    <div>
                      {new Date(iv.started_at).toLocaleString()} —{" Score:"}
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
