import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const ConversationScreen = () => {
  const { interviewId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/conversations/${interviewId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch conversation.");
        return res.json();
      })
      .then((data) => setConversation(data.conversation))
      .catch((err) => setError(err.message));
  }, [interviewId]);

  if (error) return <div>Error: {error}</div>;
  if (!conversation) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 px-4 py-1 border border-green-400 rounded text-green-400 hover:bg-green-900"
      >
        ← Back to Dashboard
      </button>
      <h2 className="text-xl font-bold mb-4">
        Interview #{conversation.interview_id}
      </h2>
      {Object.values(conversation.topics).map((topic) => (
        <div key={topic.id} className="mb-6">
          <h3 className="text-lg font-semibold">{topic.name}</h3>
          {Object.values(topic.questions || {}).map((q) => (
            <div key={q.question_number} className="mb-4 pl-4">
              {q.messages
                .filter((msg) => msg.author !== "system") // 👈 Exclude system prompts
                .map((msg, idx) => (
                  <div key={idx} className="text-sm text-gray-700 text-left">
                    <strong>{msg.author}:</strong>{" "}
                    {(() => {
                      if (msg.author === "interviewer") {
                        try {
                          const parsed = JSON.parse(msg.content);
                          if (parsed && parsed.feedback) {
                            return `${parsed.score ?? 0}/10 — ${parsed.feedback}`;
                          }
                        } catch (_) {}
                      }
                      return msg.content;
                    })()}
                  </div>
                ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ConversationScreen;
