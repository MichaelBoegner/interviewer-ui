import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import "./Conversation.css";

const API_URL = import.meta.env.VITE_API_URL;

const Conversation = () => {
  const { interviewId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();
  const messagesContainerRef = useRef(null);

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

  const flattenConversation = (conv) => {
    const out = [];
    const topicOrder = Object.keys(conv.topics || {}).sort(
      (a, b) => Number(a) - Number(b)
    );
    for (const topicId of topicOrder) {
      const topic = conv.topics[topicId];
      const questionOrder = Object.keys(topic.questions || {}).sort(
        (a, b) => Number(a) - Number(b)
      );
      for (const qId of questionOrder) {
        const question = topic.questions[qId];
        const msgs = question.messages || [];

        const rawPrompt = msgs.find(
          (m) => m.author === "interviewer" && !m.content.trim().startsWith("{")
        );
        const userMsg = msgs.find((m) => m.author === "user");
        const feedbackMsg = [...msgs]
          .reverse()
          .find(
            (m) =>
              m.author === "interviewer" && m.content.trim().startsWith("{")
          );

        if (rawPrompt)
          out.push({ role: "interviewer", content: rawPrompt.content });
        if (userMsg) out.push({ role: "user", content: userMsg.content });
        if (feedbackMsg) {
          try {
            const parsed = JSON.parse(feedbackMsg.content);
            out.push({
              role: "interviewer",
              content: parsed.next_question || parsed.question || "",
              feedback: parsed.feedback || "",
              score: parsed.score,
            });
          } catch (err) {
            console.warn("Failed to parse feedback JSON:", err.message);
          }
        }
      }
    }

    out.push({
      role: "system",
      content: `
=================================
    INTERVIEW COMPLETED
=================================

Thank you for participating in our technical interview process! 
The interview has concluded.
      `.trim(),
    });

    return out;
  };

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
              {msg.role === "interviewer" && msg.feedback && (
                <div className="feedback-box">
                  <div className="label">FEEDBACK:</div>
                  <div className="feedback">{msg.feedback}</div>
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
