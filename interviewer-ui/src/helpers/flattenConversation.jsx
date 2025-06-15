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

      // STEP 1: Extract interviewer prompt
      for (const msg of msgs) {
        if (msg.author === "interviewer") {
          const trimmed = msg.content.trim();
          if (!trimmed.startsWith("{")) {
            interviewerPrompt = msg.content; // first question only
            break;
          } else {
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.next_question) {
                interviewerPrompt = parsed.next_question;
                break;
              }
            } catch (err) {
              console.log(err);
            }
          }
        }
      }

      // STEP 2: Extract user message
      for (const msg of msgs) {
        if (msg.author === "user") {
          userMessage = msg.content;
          break;
        }
      }

      // STEP 3: Extract feedback from next question's first interviewer message
      for (const msg of nextMsgs) {
        if (
          msg.author === "interviewer" &&
          msg.content.trim().startsWith("{")
        ) {
          try {
            const parsed = JSON.parse(msg.content);
            feedback = parsed.feedback || "";
            score = parsed.score ?? null;
            break;
          } catch (err) {
            console.log(err);
          }
        }
      }

      // STEP 4: Fallback: extract feedback from current if last question
      if (!feedback && score === null) {
        for (const msg of msgs) {
          if (
            msg.author === "interviewer" &&
            msg.content.trim().startsWith("{")
          ) {
            try {
              const parsed = JSON.parse(msg.content);
              feedback = parsed.feedback || "";
              score = parsed.score ?? null;
              break;
            } catch (err) {
              console.log(err);
            }
          }
        }
      }

      // STEP 5: Push prompt and user response + feedback
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
    }
  }
  // STEP 6: Add summary if finished
  if (
    conv.current_topic === 0 &&
    conv.current_subtopic === "finished" &&
    conv.current_question_number === 0
  ) {
    let totalScore = 0;
    let totalQuestions = 0;
    const topicScores = [];

    for (const topicId of topicOrder) {
      const topic = conv.topics[topicId];
      const questionOrder = Object.keys(topic.questions || {}).sort(
        (a, b) => Number(a) - Number(b)
      );

      let topicScore = 0;
      let topicQuestions = 0;

      for (let i = 0; i < questionOrder.length; i++) {
        const qId = questionOrder[i];
        const nextQId = questionOrder[i + 1];
        const question = topic.questions[qId];
        const nextQuestion = topic.questions[nextQId];

        // 1. Prefer: score from next question's first interviewer message
        if (nextQuestion) {
          const nextMsgs = nextQuestion.messages || [];
          for (const msg of nextMsgs) {
            if (
              msg.author === "interviewer" &&
              msg.content.trim().startsWith("{")
            ) {
              try {
                const parsed = JSON.parse(msg.content);
                if (typeof parsed.score === "number") {
                  topicScore += parsed.score;
                  totalScore += parsed.score;
                  topicQuestions++;
                  totalQuestions++;
                  break;
                }
              } catch (err) {
                console.log(err);
              }
            }
          }
        }

        // 2. Fallback: score from current question (for final Q only)
        if (!nextQuestion) {
          const msgs = question.messages || [];
          for (const msg of msgs) {
            if (
              msg.author === "interviewer" &&
              msg.content.trim().startsWith("{")
            ) {
              try {
                const parsed = JSON.parse(msg.content);
                if (typeof parsed.score === "number") {
                  topicScore += parsed.score;
                  totalScore += parsed.score;
                  topicQuestions++;
                  totalQuestions++;
                  break;
                }
              } catch (err) {
                console.log(err);
              }
            }
          }
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
