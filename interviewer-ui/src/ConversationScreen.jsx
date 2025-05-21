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
      headers: { Authorization: `Bearer ${token}` },
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

  const topics = conversation.topics || {};
  const topicOrder = Object.keys(topics).sort((a, b) => Number(a) - Number(b));

  const renderedOutput = [];

  let prevFeedback = null;

  for (const topicId of topicOrder) {
    const topic = topics[topicId];
    if (!topic?.questions) continue;

    const questionIds = Object.keys(topic.questions).sort(
      (a, b) => Number(a) - Number(b)
    );
    if (questionIds.length === 0) continue;

    renderedOutput.push(
      <h3 key={`topic-${topicId}`} className="text-lg font-semibold mt-6 mb-2">
        {topic.name}
      </h3>
    );

    for (let i = 0; i < questionIds.length; i++) {
      const qId = questionIds[i];
      const question = topic.questions[qId];
      const messages = question.messages || [];

      // Determine prompt
      let prompt = null;

      if (topicId === "1" && qId === "1") {
        // First question of first topic — use plain interviewer content
        const raw = messages.find(
          (m) => m.author === "interviewer" && !m.content.trim().startsWith("{")
        );
        prompt = raw?.content || null;
      } else if (prevFeedback?.next_question) {
        prompt = prevFeedback.next_question;
      }

      // Get user answer
      const userMsg = messages.find((m) => m.author === "user");

      // Get feedback JSON for this question (usually the last message by interviewer with JSON)
      const feedbackMsg = [...messages]
        .reverse()
        .find(
          (m) => m.author === "interviewer" && m.content.trim().startsWith("{")
        );

      let feedback = null;
      let score = null;
      let nextPrompt = null;

      if (feedbackMsg) {
        try {
          const parsed = JSON.parse(feedbackMsg.content);
          feedback = parsed.feedback;
          score = parsed.score;
          nextPrompt = parsed.next_question;
        } catch {}
      }

      // Save next_question for next iteration
      prevFeedback = { next_question: nextPrompt };

      // Render this Q&A
      if (prompt) {
        renderedOutput.push(
          <div
            key={`prompt-${topicId}-${qId}`}
            className="text-sm text-gray-700 mb-1"
          >
            <strong>Interviewer:</strong> {prompt}
          </div>
        );
      }
      if (userMsg) {
        renderedOutput.push(
          <div
            key={`user-${topicId}-${qId}`}
            className="text-sm text-gray-700 mb-1"
          >
            <strong>user:</strong> {userMsg.content}
          </div>
        );
      }
      if (feedback) {
        renderedOutput.push(
          <div
            key={`feedback-${topicId}-${qId}`}
            className="text-sm text-gray-700 mb-4"
          >
            <strong>Feedback:</strong> {score}/10 — {feedback}
          </div>
        );
      }
    }
  }

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
      {renderedOutput}
    </div>
  );
};

export default ConversationScreen;
