export default function flattenConversation(conv) {
  const out = [];
  const topicOrder = Object.keys(conv.topics || {}).sort(
    (a, b) => Number(a) - Number(b)
  );

  let prevUserEntry = null;

  for (let tIndex = 0; tIndex < topicOrder.length; tIndex++) {
    const topicId = topicOrder[tIndex];
    const topic = conv.topics[topicId];
    const questionOrder = Object.keys(topic.questions || {}).sort(
      (a, b) => Number(a) - Number(b)
    );

    for (let qIndex = 0; qIndex < questionOrder.length; qIndex++) {
      const qId = questionOrder[qIndex];
      const question = topic.questions[qId];
      const msgs = question.messages || [];

      const interviewerPrompt = question.prompt;
      let userMessage = null;

      const isLastTopic = tIndex === topicOrder.length - 1;
      const isLastQuestion = qIndex === questionOrder.length - 1;
      const isFinalQuestion = isLastTopic && isLastQuestion;

      // STEP 1: Extract feedback from first interviewer message
      let feedbackToApply = null;
      for (const msg of msgs) {
        if (msg.author === "interviewer") {
          const trimmed = msg.content.trim();
          if (trimmed.startsWith("{")) {
            try {
              const parsed = JSON.parse(trimmed);

              if (!isFinalQuestion && parsed.feedback) {
                feedbackToApply = {
                  feedback: parsed.feedback,
                  score: typeof parsed.score === "number" ? parsed.score : null,
                };
              } else if (isFinalQuestion && parsed.feedback && prevUserEntry) {
                // Apply final question's feedback to previous question (Q11)
                prevUserEntry.feedback = parsed.feedback;
                prevUserEntry.score =
                  typeof parsed.score === "number" ? parsed.score : null;
              }

              break; // Only parse first interviewer JSON block
            } catch (err) {
              console.log("Invalid JSON:", err);
            }
          }
        }
      }

      // STEP 2: Apply feedback to *previous* question's user entry
      if (feedbackToApply && prevUserEntry) {
        prevUserEntry.feedback = feedbackToApply.feedback;
        prevUserEntry.score = feedbackToApply.score;
      }

      // STEP 3: Extract user message
      for (const msg of msgs) {
        if (msg.author === "user" && !userMessage) {
          userMessage = msg.content;
        }
      }

      // STEP 4: Push prompt and user message
      if (interviewerPrompt) {
        out.push({ role: "interviewer", content: interviewerPrompt });
      }

      if (userMessage) {
        const userEntry = { role: "user", content: userMessage };
        out.push(userEntry);
        prevUserEntry = userEntry;
      }

      // STEP 5: Final question fallback (feedback lives in current question)
      if (isFinalQuestion && prevUserEntry) {
        try {
          const lastMsg = msgs[msgs.length - 1];
          const parsed = JSON.parse(lastMsg.content);
          if (
            parsed.feedback &&
            (prevUserEntry.feedback === undefined ||
              prevUserEntry.feedback === "")
          ) {
            prevUserEntry.feedback = parsed.feedback;
            prevUserEntry.score =
              typeof parsed.score === "number" ? parsed.score : null;
          }
        } catch (err) {
          console.log("Invalid JSON (final fallback):", err);
        }
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
    const topicScores = [];

    for (let tIndex = 0; tIndex < topicOrder.length; tIndex++) {
      const topicId = topicOrder[tIndex];
      const topic = conv.topics[topicId];
      const questionOrder = Object.keys(topic.questions || {}).sort(
        (a, b) => Number(a) - Number(b)
      );

      let topicScore = 0;
      let topicQuestions = 0;

      for (let qIndex = 0; qIndex < questionOrder.length; qIndex++) {
        const qId = questionOrder[qIndex];

        // 1. Try feedback from next question in same topic
        const nextQId = questionOrder[qIndex + 1];
        const nextQuestion = topic.questions[nextQId];
        const nextMsgs = nextQuestion?.messages || [];

        let parsed = null;

        for (const msg of nextMsgs) {
          if (
            msg.author === "interviewer" &&
            msg.content.trim().startsWith("{")
          ) {
            try {
              parsed = JSON.parse(msg.content);
              break;
            } catch (err) {
              console.log("Invalid JSON (summary next-question):", err);
            }
          }
        }

        // 2. If this is the last question in the topic, look at next topic's first question
        const isLastQuestion = qIndex === questionOrder.length - 1;
        if (!parsed && isLastQuestion) {
          const nextTopicId = topicOrder[tIndex + 1];
          const nextTopic = conv.topics[nextTopicId];
          const firstQId = nextTopic
            ? Object.keys(nextTopic.questions || {}).sort(
                (a, b) => Number(a) - Number(b)
              )[0]
            : null;
          const nextTopicMsgs =
            nextTopic?.questions?.[firstQId]?.messages || [];

          for (const msg of nextTopicMsgs) {
            if (
              msg.author === "interviewer" &&
              msg.content.trim().startsWith("{")
            ) {
              try {
                parsed = JSON.parse(msg.content);
                break;
              } catch (err) {
                console.log("Invalid JSON (summary next-topic):", err);
              }
            }
          }
        }

        // 3. If this is the last question of the last topic, get feedback from its own messages
        const isLastTopic = tIndex === topicOrder.length - 1;
        if (!parsed && isLastQuestion && isLastTopic) {
          const msgs = conv.topics[topicId].questions[qId].messages || [];
          for (const msg of msgs) {
            if (
              msg.author === "interviewer" &&
              msg.content.trim().startsWith("{")
            ) {
              try {
                parsed = JSON.parse(msg.content);
                break;
              } catch (err) {
                console.log("Invalid JSON (summary final question):", err);
              }
            }
          }
        }

        if (parsed && typeof parsed.score === "number") {
          topicScore += parsed.score;
          totalScore += parsed.score;
          topicQuestions++;
          totalQuestions++;
        }
      }

      if (topicQuestions > 0) {
        topicScores.push({
          name: topic.name,
          score: topicScore,
          total: topicQuestions * 10,
        });
      }
    }

    const percentage =
      totalQuestions > 0
        ? Math.round((totalScore / (totalQuestions * 10)) * 100)
        : 0;

    const topicScoreText = topicScores
      .map(
        (t) =>
          `${t.name}: ${t.score}/${t.total} (${Math.round(
            (t.score / t.total) * 100
          )}%)`
      )
      .join("\n");

    out.push({
      role: "system",
      content: `
=================================
    INTERVIEW COMPLETED
=================================

Total Score: ${totalScore}/${totalQuestions * 10}
Percentage: ${percentage}%

Scores by Topic:
${topicScoreText}

Thank you for participating. I hope you found it useful. 
If you have a moment, please fill out the short survey so I can keep improving the experience for you! ^_^
    `.trim(),
    });
  }

  return out;
}
