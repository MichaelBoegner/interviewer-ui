import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import posthog from "posthog-js";
import flattenConversation from "../../helpers/flattenConversation";
import Editor from "@monaco-editor/react";
import useNavigationGuard from "./useNavigationGuard";
import "./Interview.css";

export default function InterviewScreen({ token, setToken }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [hasInterviewStarted, setHasInterviewStarted] = useState(false);
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [username, setUsername] = useState("");
  const [_, setPageLoaded] = useState(false);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();
  const [resetNotice, setResetNotice] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL;

  useNavigationGuard(isLoading);

  useEffect(() => {
    const saved = localStorage.getItem("interviewInput");
    if (saved) setInput(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("interviewInput", input);
  }, [input]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isLoading) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLoading]);

  useEffect(() => {
    console.log("InterviewScreen received token:", token);

    if (!token) {
      console.log("No token found, redirecting to login");
      navigate("/");
    } else {
      setTimeout(() => {
        setPageLoaded(true);
      }, 300);
    }
  }, [token, navigate]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const storedInterviewId = localStorage.getItem(`${userId}_interviewId`);
    const token = localStorage.getItem("token");

    if (!storedInterviewId || !token) return;

    setInterviewId(Number(storedInterviewId));

    // Fetch interview metadata including the current status
    fetch(`${API_URL}/interviews/${storedInterviewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) =>
        res.ok ? res.json() : Promise.reject("Failed to fetch interview status")
      )
      .then(() => {
        setHasInterviewStarted(true);
        const conversationUrl = `${API_URL}/conversations/${storedInterviewId}`;

        return fetch(conversationUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) =>
        res.ok ? res.json() : Promise.reject("Failed to fetch conversation")
      )
      .then((data) => {
        setConversationId(data.conversation.id);
        const flattened = flattenConversation(data.conversation);

        if (flattened.length === 0) {
          // fetch first_question again from local interview context
          fetch(`${API_URL}/interviews/${storedInterviewId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) =>
              res.ok ? res.json() : Promise.reject("Failed to fetch interview")
            )
            .then((interviewData) => {
              if (interviewData.interview?.first_question) {
                setMessages([
                  {
                    role: "interviewer",
                    content: interviewData.interview.first_question,
                  },
                ]);
              } else {
                setMessages([]);
              }
            });
        } else {
          setMessages(flattened);
        }
      })

      .catch((err) => {
        console.error("Auto-resume failed:", err);
      });
  }, [API_URL, location.pathname]);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const resetInterview = () => {
    const userId = localStorage.getItem("userId");

    localStorage.removeItem(`${userId}_interviewId`);
    localStorage.removeItem(`${userId}_conversationId`);

    posthog.capture("interview_reset", {
      interviewId,
      reason: "user_initiated",
    });

    setInterviewId(null);
    setConversationId(null);
    setHasInterviewStarted(false);
    setIsInterviewEnded(false);
    setMessages([]);
    setResetNotice(
      "Interview moved to Past Interviews. You can resume it anytime from your dashboard."
    );
  };

  const startNewInterview = async () => {
    const confirmed = window.confirm(
      "Starting a new interview costs 1 credit. Are you sure you want to start the interview now?"
    );
    if (!confirmed) return;

    setIsLoading(true);
    setIsInterviewEnded(false);
    setMessages([]);
    setAuthError("");
    setResetNotice("");
    setConversationId(null);
    setTotalScore(0);
    setQuestionsAnswered(0);

    if (!token) {
      setAuthError("Authentication token not found. Please login again.");
      setIsLoading(false);
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    try {
      console.log("Starting new interview with token:", token);
      const response = await fetch(`${API_URL}/interviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      // Handle credit-related failure
      if (response.status === 402) {
        const data = await response.json();
        const message = data?.error || "You do not have enough credits.";
        setMessages([{ role: "system", content: message }]);
        posthog.capture("interview_start_failed", {
          reason: "no_credits",
        });
        return;
      }

      // Handle auth expired
      if (response.status === 401) {
        setAuthError("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/"), 2000);
        posthog.capture("interview_start_failed", {
          reason: "unauthorized",
        });
        return;
      }

      // Handle other server-side errors
      if (!response.ok) {
        const { error, message } = await response.json();
        throw new Error(error || message || "Unexpected server error");
      }

      // At this point, we're guaranteed OK response
      const data = await response.json();
      setInterviewId(data.interview_id);
      setConversationId(data.conversation_id);
      const userId = localStorage.getItem("userId");
      localStorage.setItem(`${userId}_interviewId`, data.interview_id);
      localStorage.setItem(`${userId}_conversationId`, data.conversation_id);
      setMessages([{ role: "interviewer", content: data.first_question }]);
      setHasInterviewStarted(true);
      posthog.capture("interview_started", {
        interview_id: data.interview_id,
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      setMessages([
        {
          role: "system",
          content: `Failed to start interview: ${error.message}. Please try again or check your connection.`,
        },
      ]);
      posthog.capture("interview_start_exception", {
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !interviewId || isLoading || isInterviewEnded) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    posthog.capture("interview_message_sent", {
      interviewId,
      content_length: userMessage.length,
    });

    if (!token) {
      setAuthError("Authentication token not found. Please login again.");
      setIsLoading(false);
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    try {
      // Determine if this is the first message in the conversation
      const userMessages = messages.filter((msg) => msg.role === "user");
      const isFirstMessage = userMessages.length === 0;

      // Log the current state for debugging
      console.log("Sending message to interview:", interviewId);
      console.log("Current conversation ID:", conversationId);
      console.log("Is first message:", isFirstMessage);

      // Construct the payload based on whether this is the first message or not
      let payload;
      let url;
      if (isFirstMessage) {
        // First message only needs the user message
        payload = {
          message: userMessage,
        };
        url = `${API_URL}/conversations/create/${interviewId}`;
      } else {
        // Subsequent messages need conversation_id and message
        payload = {
          conversation_id: conversationId,
          message: userMessage,
        };
        url = `${API_URL}/conversations/append/${interviewId}`;
      }

      console.log("Sending payload:", payload);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Conversation response:", data);

      if (!response.ok) {
        if (response.status === 401) {
          setAuthError("Your session has expired. Please login again.");
          setToken(null);
          setTimeout(() => navigate("/"), 2000);
        }
        throw new Error(data.message || data.error || "Failed to send message");
      }

      // Extract and save the conversation ID if this is the first message
      if (isFirstMessage && data.conversation && data.conversation.id) {
        console.log("Setting conversation ID:", data.conversation.id);
        setConversationId(data.conversation.id);
        const userId = localStorage.getItem("userId");
        localStorage.setItem(`${userId}_conversationId`, data.conversation.id);
      }

      // Process the response from the server
      let interviewerResponse = "";
      let isFinished = false;
      let score = 0;
      let feedback = "";
      let parsedResponseData = null;

      // Extract the interviewer's response based on the structure
      if (data.response) {
        // Simple response format
        interviewerResponse = data.response;
        isFinished = data.next_question === "Finished" && data.topic === 0;
      } else if (data.conversation) {
        try {
          // Get the current topic and question number
          const currentTopic = data.conversation.current_topic;
          const currentSubtopic = data.conversation.current_subtopic;
          const currentQuestionNumber =
            data.conversation.current_question_number;

          console.log("Current topic:", currentTopic);
          console.log("Current subtopic:", currentSubtopic);
          console.log("Current question number:", currentQuestionNumber);

          // Check if interview is finished
          isFinished =
            Number(currentTopic) === 0 &&
            String(currentSubtopic).toLowerCase() === "finished";

          // Get the latest topic and question data
          const topics = data.conversation.topics;
          const latestTopic =
            Object.values(topics).find((t) => t.id === currentTopic) ||
            Object.values(topics).pop();

          if (latestTopic && latestTopic.questions) {
            // Find the question with the current question number
            const latestQuestion =
              Object.values(latestTopic.questions).find(
                (q) => q.question_number === currentQuestionNumber
              ) || Object.values(latestTopic.questions).pop();

            if (latestQuestion && latestQuestion.messages) {
              // Get all interviewer messages for this question
              const interviewerMessages = latestQuestion.messages.filter(
                (msg) => msg.author === "interviewer"
              );

              if (interviewerMessages.length > 0) {
                // Get the most recent message
                const latestMessage =
                  interviewerMessages[interviewerMessages.length - 1];

                // Try to parse JSON content if it's a JSON string
                if (
                  typeof latestMessage.content === "string" &&
                  latestMessage.content.trim().startsWith("{") &&
                  latestMessage.content.trim().endsWith("}")
                ) {
                  try {
                    parsedResponseData = JSON.parse(latestMessage.content);
                    const isFinalMessage =
                      parsedResponseData.next_question === "" &&
                      parsedResponseData.next_topic === "" &&
                      parsedResponseData.next_subtopic === "";

                    if (isFinalMessage) {
                      interviewerResponse = ""; // or null — signal to skip display
                    } else {
                      interviewerResponse =
                        parsedResponseData.next_question ||
                        parsedResponseData.question ||
                        latestMessage.content;
                    }

                    // Extract score and feedback
                    if (parsedResponseData.score !== undefined) {
                      score = parsedResponseData.score;
                      setTotalScore((prevTotal) => prevTotal + score);
                      setQuestionsAnswered((prev) => prev + 1);
                    }

                    if (parsedResponseData.feedback) {
                      feedback = parsedResponseData.feedback;
                    }

                    console.log("Extracted score:", score);
                    console.log("Extracted feedback:", feedback);
                    console.log(
                      "Extracted next question:",
                      interviewerResponse
                    );
                  } catch (error) {
                    console.error("Error parsing JSON response:", error);
                    interviewerResponse = latestMessage.content;
                  }
                } else {
                  // If it's not JSON, use the content directly
                  interviewerResponse = latestMessage.content;
                }

                console.log(
                  "Extracted interviewer response:",
                  interviewerResponse
                );
              }
            }
          }
        } catch (error) {
          console.error("Error parsing conversation response:", error);
          interviewerResponse =
            "Error parsing the interview response. Please try again.";
          posthog.capture("interview_message_exception", {
            error: error.message,
            interviewId,
          });
        }
      }

      // Update the UI based on the response
      if (isFinished) {
        setIsInterviewEnded(true);

        let topicSummary = "";
        if (data.conversation?.topics) {
          const topics = data.conversation.topics;
          const topicScores = [];

          Object.values(topics).forEach((topic) => {
            let topicScore = 0;
            let questionsCount = 0;

            const questionEntries = Object.entries(topic.questions || {}).sort(
              ([a], [b]) => Number(a) - Number(b)
            );

            for (let i = 0; i < questionEntries.length; i++) {
              const [, q] = questionEntries[i];
              const [_, nextQ] = questionEntries[i + 1] || [];

              let scoreFound = false;

              // Prefer: score from next question's first interviewer message
              if (nextQ?.messages?.length) {
                for (const msg of nextQ.messages) {
                  if (
                    msg.author === "interviewer" &&
                    typeof msg.content === "string" &&
                    msg.content.trim().startsWith("{")
                  ) {
                    try {
                      const parsed = JSON.parse(msg.content);
                      if (typeof parsed.score === "number") {
                        topicScore += parsed.score;
                        questionsCount++;
                        scoreFound = true;
                        break;
                      }
                    } catch (err) {
                      console.log("malformed json from nextQ:", err);
                    }
                  }
                }
              }

              // Fallback: last question’s own messages
              if (!scoreFound && i === questionEntries.length - 1) {
                for (const msg of q.messages || []) {
                  if (
                    msg.author === "interviewer" &&
                    typeof msg.content === "string" &&
                    msg.content.trim().startsWith("{")
                  ) {
                    try {
                      const parsed = JSON.parse(msg.content);
                      if (typeof parsed.score === "number") {
                        topicScore += parsed.score;
                        questionsCount++;
                        break;
                      }
                    } catch (err) {
                      console.log("malformed json from fallback:", err);
                    }
                  }
                }
              }
            }

            if (questionsCount > 0) {
              topicScores.push({
                topic: topic.name,
                score: topicScore,
                total: questionsCount * 10,
              });
            }
          });

          topicSummary = "\n\nTopic Breakdown:\n";
          topicScores.forEach((t) => {
            const percent = ((t.score / t.total) * 100).toFixed(0);
            topicSummary += `- ${t.topic}: ${t.score}/${t.total} (${percent}%)\n`;
          });
        }

        const isFinalMessage =
          (!parsedResponseData?.next_question ||
            parsedResponseData.next_question.trim() === "") &&
          (!parsedResponseData?.next_topic ||
            parsedResponseData.next_topic.trim() === "") &&
          (!parsedResponseData?.next_subtopic ||
            parsedResponseData.next_subtopic.trim() === "");

        setMessages([
          ...newMessages,
          ...(isFinalMessage
            ? []
            : [
                {
                  role: "interviewer",
                  content: interviewerResponse,
                  score,
                  feedback,
                  parsedData: parsedResponseData,
                },
              ]),
          {
            role: "system",
            content: `
=================================
    INTERVIEW COMPLETED
=================================

Thank you for participating in our technical interview process! 
The interview has concluded.

Your final score: ${totalScore + score}/${(questionsAnswered + 1) * 10} (${(((totalScore + score) / ((questionsAnswered + 1) * 10)) * 100).toFixed(0)}%)${topicSummary}
    `.trim(),
          },
        ]);

        console.log("Firing interview_completed", {
          interviewId,
          total_score: totalScore + score,
          questions_answered: questionsAnswered + 1,
        });

        posthog.capture("interview_completed", {
          interviewId,
          total_score: totalScore + score,
          questions_answered: questionsAnswered + 1,
        });
      } else {
        setMessages([
          ...newMessages.slice(0, -1),
          {
            ...newMessages[newMessages.length - 1],
            feedback,
            score,
          },
          {
            role: "interviewer",
            content: interviewerResponse,
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...newMessages,
        {
          role: "system",
          content: `Error: ${error.message || "Could not send message"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="interview-page">
      <div className="interview-header">
        <h1>INTERVIEW</h1>
        <div className="button-row-start-save">
          {!hasInterviewStarted ? (
            <button
              onClick={startNewInterview}
              disabled={isLoading}
              className={`retro-button green ${isLoading ? "disabled" : ""}`}
            >
              {isLoading
                ? "[ STARTING NEW INTERVIEW... ]"
                : "[ START_NEW_INTERVIEW ]"}
            </button>
          ) : (
            <button
              onClick={resetInterview}
              disabled={isLoading}
              className={`retro-button red ${isLoading ? "disabled" : ""}`}
            >
              {isLoading ? "[ TRANSMITTING... ]" : "[ SAVE_AND_RESET ]"}
            </button>
          )}
        </div>
      </div>
      <div className="reset-pause-notice-row">
        {resetNotice && (
          <div className="reset-pause-notice">
            <span className="label-tag">[SYSTEM]:</span> {resetNotice}
          </div>
        )}
      </div>

      <div className="interview-screen">
        <div className="terminal-box">
          {authError && (
            <div className="error-box">
              <span className="error-label">ERROR:</span> {authError}
            </div>
          )}

          <div className="chat-window-wrapper">
            <div className="chat-window" ref={messagesContainerRef}>
              {messages.length === 0 ? (
                <div className="message interviewer">
                  <div className="message-header">{`INTERVIEWER >`}</div>
                  <div className="message-content">
                    Hey there {username}! Welcome to the backend interview, and
                    thanks so much for taking the time!
                    <br />
                    <br />
                    As you probably noticed, above the chat window here, there's
                    a [ START_NEW_INTERVIEW ] button. That button will, of
                    course, start a new interview. It will also deduct a credit
                    from your current credit total. If you don't have credits,
                    you can purchase them on your Dashboard page.
                    <br />
                    <br />
                    <span className="intro-header">
                      About the Interview Process Itself:
                    </span>
                    <br />
                    Each interview covers 6 topics, with 2 questions for each
                    topic:
                    <br />
                    1. Introduction <br />
                    2. Coding <br />
                    3. System Design <br />
                    4. Databases <br />
                    5. Behavioral <br />
                    6. General backend knowledge <br />
                    <br />
                    - For each response you give, you will get a score and
                    feedback, including what was done well, what was missing,
                    and one clear suggestion for improvement. <br />
                    - At the end of an interview, a message will appear
                    indicating interview has finished and give you your total
                    score as a percentage. <br />
                    - Once you start an interview, you may leave the page at any
                    time, as conversations are asynchronous. <br />
                    - You may also resume any previously unfinished interviews
                    in your Dashboard by clicking on one under "Past
                    Interviews". <br />
                    <br />
                    <span className="intro-header">Scoring Guide:</span> <br />
                    - Each response is scored from 1 to 10. <br />
                    - A score of 7 or above means your answer meets or exceeds
                    senior-level expectations in clarity, completeness, and
                    technical depth. <br />
                    - Scores between 4 and 6 signal that the response is
                    functional but missing important details, edge cases, or
                    deeper insight. <br />
                    - Scores from 1 to 3 indicate an inadequate or vague answer
                    that failed to address the question meaningfully. <br />
                    <br />
                    <span className="intro-header">
                      Important Notes about Usage:
                    </span>{" "}
                    <br />
                    - Make sure you answer each question directly. Asking
                    clarifying questions like “Can you explain?” or “I don’t
                    understand” may confuse me and cause repeated prompts or
                    incorrect feedback.
                    <br />
                    - Once you enter your response, there is no further editing
                    it, meaning you will have wasted a question. As a result,
                    messages can only be sent by clicking the [ SEND_MESSAGE ]
                    button you'll see at the bottom of the input screen on the
                    right.
                    <br />
                    <br />
                    --------------
                    <br />
                    <br />
                    As a solo dev, I made Interviewer because I wanted to
                    provide something useful to the world, so your feedback is
                    everything to me. You'll get a survey at the end of each
                    interview. If you can please take the time to fill it out,
                    it will go a long ways towards making this better for
                    everyone.
                    <br /> <br />
                    Thanks again for stopping by and best of luck on the
                    interview! ^_^
                  </div>
                </div>
              ) : (
                (() => {
                  let interviewerCount = 0;
                  return messages.map((msg, i) => {
                    const isInterviewer = msg.role === "interviewer";
                    if (isInterviewer) interviewerCount++;

                    return (
                      <div className={`message ${msg.role}`} key={i}>
                        <div className="message-header">
                          {isInterviewer
                            ? `INTERVIEWER [${interviewerCount}] >`
                            : msg.role === "user"
                              ? `${msg.username || username || "YOU"} >`
                              : "SYSTEM >"}
                        </div>
                        <div className="message-content">
                          {msg.content}
                          {isInterviewer && <span className="cursor" />}
                        </div>
                        {msg.role === "user" &&
                          (Object.prototype.hasOwnProperty.call(
                            msg,
                            "feedback"
                          ) ||
                            Object.prototype.hasOwnProperty.call(
                              msg,
                              "score"
                            )) && (
                            <div className="feedback-box">
                              <div className="label">FEEDBACK:</div>
                              <div className="feedback">
                                {msg.feedback?.trim() ||
                                  "(no feedback provided)"}
                              </div>
                              {msg.score !== undefined && (
                                <div className="score">
                                  SCORE:{" "}
                                  <span
                                    className={
                                      msg.score >= 7
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
                })()
              )}
            </div>
          </div>

          <div className="user-entry-wrapper">
            <div className="input-wrapper">
              {interviewId &&
                hasInterviewStarted &&
                !authError &&
                !isInterviewEnded && (
                  <>
                    <div className="textarea-wrapper">
                      {isCodeMode ? (
                        <div
                          style={{
                            display: "flex",
                            overflow: "hidden",
                            width: "100%",
                            height: "100%",
                            border: "1px solid var(--primary-green)",
                            transition: "none",
                            animation: "none",
                          }}
                        >
                          <Editor
                            key={language}
                            language={language}
                            defaultLanguage={language}
                            value={input}
                            onChange={(val) => setInput(val || "")}
                            theme="vs-dark"
                            loading={null}
                            options={{
                              fontSize: 14,
                              fontFamily: "monospace",
                              minimap: { enabled: false },
                              lineNumbers: "on",
                            }}
                          />
                        </div>
                      ) : (
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (!isLoading && input.trim()) {
                                sendMessage();
                              }
                            }
                          }}
                          disabled={isLoading || isInterviewEnded}
                          placeholder="Enter your response here. Click [ SEND_MESSAGE ] below to send."
                          className="textarea-input"
                        />
                      )}
                    </div>
                  </>
                )}
            </div>
            <div className="button-container-interview">
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim() || isInterviewEnded}
                className="retro-button green"
              >
                {isLoading ? "[ TRANSMITTING... ]" : "[ SEND_MESSAGE ]"}
              </button>

              <button
                onClick={() => {
                  const newMode = !isCodeMode;
                  setIsCodeMode(newMode);
                  posthog.capture("code_mode_toggled", {
                    mode: newMode ? "code" : "text",
                  });
                }}
                className="retro-button blue"
              >
                [ {isCodeMode ? "TEXT_MODE" : "CODE_MODE"} ]
              </button>
              <div className="button-is-code">
                <div className="language-select-row">
                  <label htmlFor="language-select">Language:</label>
                  <select
                    id="language-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="language-dropdown"
                    disabled={!isCodeMode}
                  >
                    <option value="python">python</option>
                    <option value="go">go</option>
                    <option value="javascript">javaScript</option>
                    <option value="typescript">typeScript</option>
                    <option value="java">java</option>
                    <option value="c">C</option>
                    <option value="csharp">C#</option>
                    <option value="cpp">C++</option>
                    <option value="shell">bash</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="system-message warning">
          <strong>
            {" "}
            ⚠️ Answer each question directly. Asking clarifying questions like
            “Can you explain?” or “I don’t understand” may confuse the system
            and cause repeated prompts or incorrect feedback.
          </strong>
        </p>
      </div>
    </div>
  );
}
