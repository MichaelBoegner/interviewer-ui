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
          (m) => m.author === "interviewer" && m.content.trim().startsWith("{")
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

  return out;
};

export default flattenConversation;
