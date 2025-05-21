import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AsciiHeader } from "./ASCII";

const API_URL = import.meta.env.VITE_API_URL;

const ConversationScreen = () => {
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
      })
      .catch((err) => setError(err.message));
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

        // Reconstruct order of: Interviewer question -> User answer -> Feedback (parsed from JSON)
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

        if (rawPrompt) {
          out.push({ role: "interviewer", content: rawPrompt.content });
        }
        if (userMsg) {
          out.push({ role: "user", content: userMsg.content });
        }
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

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!conversation) {
    return <div className="text-yellow-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen w-full bg-black text-green-400 p-3 md:p-6 flex flex-col items-center font-mono">
      <div className="w-full max-w-4xl border-2 border-green-500 bg-gray-900 p-4 rounded-none relative terminal-window">
        <div className="scanline"></div>

        <div className="mt-8 mb-4">
          <AsciiHeader text="TECHNICAL INTERVIEW TERMINAL v1.0.0" />
        </div>

        <div className="border-b border-green-500 pb-2 mb-4 flex flex-col md:flex-row md:justify-between items-center">
          <div className="text-yellow-400 text-xs mb-2 md:mb-0">
            <span className="mr-2">[SYSTEM]:</span> Displaying previous
            interview
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-4 py-1 border border-green-400 rounded text-green-400 hover:bg-green-900"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div
          className="w-full h-[40rem] overflow-y-auto p-4 bg-black border border-green-600 font-mono text-sm mb-4 retro-scrollbar"
          ref={messagesContainerRef}
        >
          {messages.map((msg, index) => (
            <div key={index} className={`message mb-6 ${msg.role}`}>
              <div
                className={`message-header text-xs mb-1 ${
                  msg.role === "interviewer"
                    ? "text-green-500"
                    : msg.role === "user"
                      ? "text-yellow-400"
                      : "text-blue-400"
                }`}
              >
                {msg.role === "interviewer"
                  ? "INTERVIEWER > "
                  : msg.role === "user"
                    ? "USER > "
                    : "SYSTEM > "}
              </div>
              <div className="message-content pl-2 border-l-2 border-gray-700 whitespace-pre-wrap">
                {msg.content}
              </div>
              {msg.role === "interviewer" && msg.feedback && (
                <div className="mt-2 border border-dashed border-yellow-500 bg-yellow-900/20 p-2 rounded text-xs">
                  <div className="text-yellow-400 font-bold mb-1">
                    FEEDBACK:
                  </div>
                  <div className="text-yellow-300">{msg.feedback}</div>
                  {msg.score !== undefined && (
                    <div className="mt-1">
                      <span className="text-yellow-400 font-bold">SCORE: </span>
                      <span
                        className={`${
                          msg.score >= 8
                            ? "text-green-400"
                            : msg.score >= 5
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
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

        <div className="text-xs text-gray-600 mt-6 border-t border-gray-800 pt-2 w-full text-center">
          ====================================================================
        </div>
      </div>
    </div>
  );
};

export default ConversationScreen;
