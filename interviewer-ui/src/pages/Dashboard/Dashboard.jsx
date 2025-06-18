import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import "./Dashboard.css";

export default function Dashboard({ token, setToken }) {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetch(`${API_URL}/user/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => data && setUserData(data))
          .catch((err) => console.error("Refresh on tab return failed:", err));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [API_URL, token]);

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

          posthog.identify(data.user_id || data.email, {
            email: data.email,
            plan: data.plan,
            status: data.status,
          });
        }
      })
      .catch((err) => setError(err.message));
  }, [API_URL, token, navigate, setToken]);

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

  const handleChangePlan = async () => {
    if (isChangingPlan) return;
    setIsChangingPlan(true);

    const tier = userData.plan === "pro" ? "premium" : "pro";

    posthog.capture("subscription_change_plan_clicked", {
      from: userData.plan,
      to: tier,
    });

    try {
      const res = await fetch(`${API_URL}/payment/change-plan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Change plan failed:", errText);
        posthog.capture("subscription_change_plan_failed", {
          error: errText,
        });
        setIsChangingPlan(false);
        return;
      }

      posthog.capture("subscription_change_plan_successful", {
        to: tier,
      });

      alert(
        `Subscription updated to ${tier.toUpperCase()}! 

NOTE: It may take a couple seconds for the update to occur. Try refreshing your browser if needed.`
      );

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error("Change plan error:", err);
      posthog.capture("subscription_change_plan_exception", {
        error: err.message,
      });
      setIsChangingPlan(false);
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
      <div className="dashboard-header">
        <h1>DASHBOARD</h1>
        <p className="dashboard-subtext">
          Buy interview credits and see past interviews and account info.
        </p>
        <div className="go-to-interview-row">
          <button
            onClick={() => {
              posthog.capture("dashboard_to_interview", {});
              navigate("/interview");
            }}
            className="retro-button"
          >
            [ Go_to_Interview ]
          </button>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="left-panel">
          <h2 className="section-heading">Account Info</h2>
          <div className="user-info">
            <p>
              <span className="account-label">Email:</span> {userData.email}
            </p>
            <p>
              <span className="account-label">Plan:</span> {userData.plan}
            </p>
            <p>
              <span className="account-label">Status:</span> {userData.status}
            </p>
            {userData.subscription_start_date && (
              <p>
                <span className="account-label">Subscription Start Date:</span>{" "}
                {formatDate(userData.subscription_start_date)}
              </p>
            )}
            {userData.subscription_end_date && (
              <p>
                <span className="account-label">Subscription End Date:</span>{" "}
                {formatDate(userData.subscription_end_date)}
              </p>
            )}
            <p>
              <span className="account-label">Individual Credits:</span>{" "}
              {userData.individual_credits}
            </p>
            <p>
              <span className="account-label">Subscription Credits:</span>{" "}
              {userData.subscription_credits}
            </p>
            <p>
              <span className="account-label">Total Credits:</span>{" "}
              {totalCredits}
            </p>
          </div>

          <div className="purchase-options">
            <h3 className="section-heading">Buy/Subscribe</h3>
            <p className="section-sub-heading">1 Credit == 1 Interview</p>
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
              disabled={
                userData.status === "active" || userData.status === "cancelled"
              }
            >
              PRO | 10/month | $19.99/month
            </button>

            <button
              className="retro-button"
              onClick={() => handlePurchase("premium")}
              disabled={
                userData.status === "active" || userData.status === "cancelled"
              }
            >
              PREMIUM | 20/month | $29.99/month
            </button>
            {userData.plan !== "free" && userData.status === "active" && (
              <button
                className="retro-button cancel-change-button"
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
            {userData.status === "active" &&
              (userData.plan === "pro" || userData.plan === "premium") && (
                <button
                  className="retro-button cancel-change-button"
                  onClick={handleChangePlan}
                  disabled={isChangingPlan}
                >
                  {isChangingPlan
                    ? "Processing..."
                    : userData.plan === "pro"
                      ? "Upgrade to Premium"
                      : "Downgrade to Pro"}
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
                {userData.past_interviews.map((interviewMap) => (
                  <li
                    key={interviewMap.id}
                    onClick={async () => {
                      const userId = localStorage.getItem("userId");
                      posthog.capture("past_interview_clicked", {
                        interview_id: interviewMap.id,
                        score: interviewMap.score ?? null,
                      });

                      localStorage.removeItem(`${userId}_interviewId`);
                      localStorage.removeItem(`${userId}_conversationId`);

                      try {
                        const res = await fetch(
                          `${API_URL}/interviews/${interviewMap.id}`,
                          {
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );

                        if (!res.ok)
                          throw new Error("Failed to fetch interview");

                        const data = await res.json();
                        const interview = data.interview;

                        localStorage.setItem(
                          `${userId}_interviewId`,
                          interviewMap.id
                        );
                        localStorage.setItem(
                          `${userId}_conversationId`,
                          interview.conversation_id
                        );

                        navigate("/conversation");
                      } catch (err) {
                        console.error("Error loading past interview:", err);
                      }
                    }}
                    className="interview-item"
                  >
                    <div>
                      {new Date(interviewMap.started_at).toLocaleString()} —
                      {" Score:"}
                      {interviewMap.score ?? "N/A"}%
                    </div>
                    <div className="interview-feedback">
                      {interviewMap.feedback}
                    </div>
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
