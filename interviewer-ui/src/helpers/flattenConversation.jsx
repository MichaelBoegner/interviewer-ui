export default function flattenConversation(conv) {
  const out = [];
  const topicOrder = Object.keys(conv.topics || {}).sort(
    (a, b) => Number(a) - Number(b)
  );

  for (const topicId of topicOrder) {
    const topic = conv.topics[topicId];
    const questionOrder = Object.keys(topic.questions || {}).sort(
      (a, b) => Number(a) - Number(b)
    );

    for (let i = 0; i < questionOrder.length; i++) {
      const qId = questionOrder[i];
      const question = topic.questions[qId];
      const msgs = question.messages || [];

      const nextQId = questionOrder[i + 1];
      const nextQuestion = topic.questions[nextQId];
      const nextMsgs = nextQuestion?.messages || [];

      let interviewerPrompt = null;
      let userMessage = null;
      let feedback = null;
      let score = null;
      let nextPrompt = null;

      for (const msg of msgs) {
        if (
          msg.author === "interviewer" &&
          !msg.content.trim().startsWith("{")
        ) {
          interviewerPrompt = msg.content;
        }
        if (msg.author === "user") {
          userMessage = msg.content;
        }
      }

      // Look ahead into the next question for feedback JSON
      for (const msg of nextMsgs) {
        if (
          msg.author === "interviewer" &&
          msg.content.trim().startsWith("{")
        ) {
          try {
            const parsed = JSON.parse(msg.content);
            feedback = parsed.feedback || "";
            score = parsed.score ?? null;
            nextPrompt = parsed.next_question || parsed.question || null;
            break;
          } catch (err) {
            console.warn("Invalid JSON in next question:", err.message);
          }
        }
      }

      if (interviewerPrompt) {
        out.push({ role: "interviewer", content: interviewerPrompt });
      }

      if (userMessage) {
        const userEntry = {
          role: "user",
          content: userMessage,
        };
        if (feedback || score !== null) {
          userEntry.feedback = feedback;
          userEntry.score = score;
        }
        out.push(userEntry);
      }

      if (nextPrompt) {
        out.push({ role: "interviewer", content: nextPrompt });
      }
    }
  }
  if (
    conv.current_topic === 0 &&
    conv.current_subtopic === "finished" &&
    conv.current_question_number === 0
  ) {
    let totalScore = 0;
    let totalQuestions = 0;

    for (const topicId of topicOrder) {
      const topic = conv.topics[topicId];
      const questionOrder = Object.keys(topic.questions || {});

      for (const qId of questionOrder) {
        const question = topic.questions[qId];
        const msgs = question.messages || [];

        for (const msg of msgs) {
          if (
            msg.author === "interviewer" &&
            msg.content.trim().startsWith("{")
          ) {
            try {
              const parsed = JSON.parse(msg.content);
              if (typeof parsed.score === "number") {
                totalScore += parsed.score;
                totalQuestions++;
              }
            } catch (_) {
              continue;
            }
          }
        }
      }
    }

    const percentage =
      totalQuestions > 0
        ? Math.round((totalScore / (totalQuestions * 10)) * 100)
        : 0;

    out.push({
      role: "system",
      content: `
=================================
    INTERVIEW COMPLETED
=================================

Total Score: ${totalScore}/${totalQuestions * 10}
Percentage: ${percentage}%

Thank you for participating. I hope you found it useful. 
If you have a moment, please fill out the short survey so I can keep improving the experience for you! ^_^

`,
    });
  }

  return out;
}
