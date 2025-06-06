import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import flattenConversation from "../../helpers/flattenConversation";
import "./Conversation.css";

const API_URL = import.meta.env.VITE_API_URL;

const Conversation = () => {
  const { interviewId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();
  const messagesContainerRef = useRef(null);
  const [interviewStatus, setInterviewStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/interviews/${interviewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) =>
        res.ok ? res.json() : Promise.reject("Failed to fetch interview")
      )
      .then((data) => {
        setInterviewStatus(data.status);
      })
      .catch((err) => console.error("Interview status error:", err));
  }, [interviewId]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/conversations/${interviewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch conversation.");
        return res.json();
      })
      .then((data) => {
        const conv = data.conversation;
        setConversation(conv);
        setMessages(flattenConversation(conv));
        posthog.capture("conversation_viewed", {
          interview_id: interviewId,
          total_topics: Object.keys(conv.topics || {}).length,
        });
      })
      .catch((err) => {
        setError(err.message);
        posthog.capture("conversation_view_failed", {
          interview_id: interviewId,
          error: err.message,
        });
      });
  }, [interviewId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (error) return <div className="error-msg">Error: {error}</div>;
  if (!conversation) return <div className="loading-msg">Loading...</div>;

  return (
    <div className="conversation-screen">
      <div className="conversation-box">
        <div className="scanline"></div>

        <div className="header-bar">
          <div className="system-label">
            <span className="label-tag">[SYSTEM]:</span> Displaying previous
            interview
          </div>
          <button
            onClick={() => {
              posthog.capture("conversation_back_to_dashboard", {
                interview_id: interviewId,
              });
              navigate("/dashboard");
            }}
            className="retro-button green small"
          >
            ← Back to Dashboard
          </button>
          {(interviewStatus === "active" || interviewStatus === "paused") && (
            <button
              className="retro-button yellow small"
              onClick={() =>
                navigate(`/interview?resume=true&interviewId=${interviewId}`)
              }
            >
              → Resume Interview
            </button>
          )}
        </div>

        <div className="chat-window" ref={messagesContainerRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-header">
                {msg.role === "interviewer"
                  ? "INTERVIEWER > "
                  : msg.role === "user"
                    ? "USER > "
                    : "SYSTEM > "}
              </div>
              <div className="message-content">{msg.content}</div>
              {msg.role === "user" &&
                (Object.prototype.hasOwnProperty.call(msg, "feedback") ||
                  Object.prototype.hasOwnProperty.call(msg, "score")) && (
                  <div className="feedback-box">
                    <div className="label">FEEDBACK:</div>
                    <div className="feedback">
                      {msg.feedback?.trim() || "(no feedback provided)"}
                    </div>
                    {msg.score !== undefined && (
                      <div className="score">
                        SCORE:{" "}
                        <span
                          className={
                            msg.score >= 8
                              ? "score-high"
                              : msg.score >= 5
                                ? "score-mid"
                                : "score-low"
                          }
                        >
                          {msg.score}/10
                        </span>
                      </div>
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>

        <div className="terminal-footer">
          ====================================================================
        </div>
      </div>
    </div>
  );
};

export default Conversation;
