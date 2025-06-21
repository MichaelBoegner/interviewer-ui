import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import flattenConversation from "../../helpers/flattenConversation";
import "./Conversation.css";

const API_URL = import.meta.env.VITE_API_URL;

const Conversation = () => {
  const [, setConversation] = useState(null);
  const [error, _] = useState(null);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();
  const messagesContainerRef = useRef(null);
  const [interviewStatus, setInterviewStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const interviewId = localStorage.getItem(`${userId}_interviewId`);

    fetch(`${API_URL}/interviews/${interviewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) =>
        res.ok ? res.json() : Promise.reject("Failed to fetch interview")
      )
      .then((data) => {
        setInterviewStatus(data.interview.status);
      })
      .catch((err) => console.error("Interview status error:", err));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const interviewId = localStorage.getItem(`${userId}_interviewId`);

    Promise.all([
      fetch(`${API_URL}/interviews/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) =>
        res.ok ? res.json() : Promise.reject("Failed to fetch interview")
      ),
      fetch(`${API_URL}/conversations/${interviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) =>
        res.ok ? res.json() : Promise.reject("Failed to fetch conversation")
      ),
    ])
      .then(([interviewData, conversationData]) => {
        const conv = conversationData.conversation;
        setConversation(conv);

        const flattened = flattenConversation(conv);

        if (flattened.length === 0 && interviewData.interview.first_question) {
          setMessages([
            {
              role: "interviewer",
              content: interviewData.interview.first_question,
            },
          ]);
        } else {
          setMessages(flattened);
        }

        setInterviewStatus(interviewData.interview.status);
      })
      .catch((err) => {
        posthog.capture("conversation_view_failed", {
          interview_id: interviewId,
          error: err.message,
        });
      });
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (error) return <div className="error-msg">Error: {error}</div>;

  return (
    <div className="conversation-screen">
      <div className="dashboard-header">
        <h1>Past Interview</h1>
      </div>
      <div className="conversation-box ">
        <div className="scanline"></div>

        <div className="header-bar">
          <button
            onClick={() => {
              const userId = localStorage.getItem("userId");
              const interviewId = localStorage.getItem(`${userId}_interviewId`);
              posthog.capture("conversation_back_to_dashboard", {
                interview_id: interviewId,
              });
              navigate("/dashboard");
            }}
            className="retro-button green small"
          >
            [ Back_to_Dashboard ]
          </button>
          {(interviewStatus === "active" || interviewStatus === "paused") && (
            <button
              onClick={() => {
                posthog.capture("resume_interview_clicked", {});
                navigate("/interview");
              }}
              className="retro-button green small"
            >
              [ Resume_Interview ]
            </button>
          )}
        </div>

        <div className="chat-window ph-block" ref={messagesContainerRef}>
          {(() => {
            let interviewerCount = 0;

            return messages.map((msg, index) => {
              if (msg.role === "interviewer") {
                interviewerCount += 1;
              }

              return (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-header">
                    {msg.role === "interviewer"
                      ? `INTERVIEWER [${interviewerCount}] >`
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
              );
            });
          })()}
        </div>

        <div className="terminal-footer">
          ====================================================================
        </div>
      </div>
    </div>
  );
};

export default Conversation;
