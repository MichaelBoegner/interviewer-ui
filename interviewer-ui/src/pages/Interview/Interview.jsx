import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import flattenConversation from "../../helpers/flattenConversation";
import Editor from "@monaco-editor/react";
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
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const storedInterviewId = localStorage.getItem(`${userId}_interviewId`);
    const storedConversationId = localStorage.getItem(
      `${userId}_conversationId`
    );
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

        const conversationUrl = storedConversationId
          ? `${API_URL}/conversations/${storedInterviewId}`
          : `${API_URL}/interviews/${storedInterviewId}`;

        return fetch(conversationUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) =>
        res.ok ? res.json() : Promise.reject("Failed to fetch conversation")
      )
      .then((data) => {
        if (storedConversationId && data.conversation) {
          setConversationId(data.conversation.id);
          setMessages(flattenConversation(data.conversation));
        } else if (data.first_question) {
          setMessages([{ role: "interviewer", content: data.first_question }]);
        }
      })
      .catch((err) => {
        console.error("Auto-resume failed:", err);
      });
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const resume = queryParams.get("resume") === "true";
    const resumeId = queryParams.get("interviewId");

    if (resume && resumeId) {
      const token = localStorage.getItem("token");
      setInterviewId(Number(resumeId));
      fetch(`${API_URL}/interviews/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch interview status");
          return res.json();
        })
        .then(() => {
          setHasInterviewStarted(true);
        })
        .catch((err) => {
          console.error("Error getting interview status:", err.message);
          setHasInterviewStarted(true);
        });

      fetch(`${API_URL}/conversations/${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch conversation");
          return res.json();
        })
        .then((data) => {
          const conv = data.conversation;
          const flattened = flattenConversation(conv);

          setMessages(flattened);
          setConversationId(conv.id);
        })
        .catch(async (err) => {
          console.error("Error resuming conversation:", err.message);

          try {
            const interviewRes = await fetch(
              `${API_URL}/interviews/${resumeId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (!interviewRes.ok)
              throw new Error("Failed to fetch interview fallback");

            const interviewData = await interviewRes.json();

            setMessages([
              {
                role: "interviewer",
                content: interviewData.first_question,
              },
            ]);

            posthog.capture("resume_used_fallback_first_question", {
              interview_id: resumeId,
            });
          } catch (fallbackErr) {
            console.error("Fallback failed:", fallbackErr.message);
            setMessages([
              {
                role: "system",
                content: "Failed to load this interview. Try again later.",
              },
            ]);
          }
        });
    }
  }, []);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

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
    setIsLoading(true);
    setIsInterviewEnded(false);
    setMessages([]);
    setAuthError("");
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
      const userId = localStorage.getItem("userId");
      localStorage.setItem(`${userId}_interviewId`, data.interview_id);
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
      const isFirstMessage = !conversationId;

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
          isFinished = currentTopic === 0 && currentSubtopic === "Finished";

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
                    interviewerResponse =
                      parsedResponseData.next_question ||
                      parsedResponseData.question ||
                      latestMessage.content;

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
        posthog.capture("interview_completed", {
          interviewId,
          total_score: totalScore + score,
          questions_answered: questionsAnswered + 1,
        });

        setMessages([
          ...newMessages,
          {
            role: "interviewer",
            content: interviewerResponse,
            score,
            feedback,
            parsedData: parsedResponseData,
          },
          {
            role: "system",
            content: `
=================================
    INTERVIEW COMPLETED
=================================

Thank you for participating in our technical interview process! 
The interview has concluded.

Your final score: ${totalScore + score}/${(questionsAnswered + 1) * 10} (${(((totalScore + score) / ((questionsAnswered + 1) * 10)) * 100).toFixed(0)}%)

You can start a new interview by clicking the [ START_INTERVIEW ] button above.
            `.trim(),
          },
        ]);
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

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="interview-screen">
      <div className="terminal-box">
        {authError && (
          <div className="error-box">
            <span className="error-label">ERROR:</span> {authError}
          </div>
        )}

        {resetNotice && (
          <div className="system-message reset-pause-notice">
            <span className="label-tag">[SYSTEM]:</span> {resetNotice}
          </div>
        )}
        <div className="chat-window-wrapper">
          <div className="chat-window" ref={messagesContainerRef}>
            {messages.length === 0 ? (
              <div className="empty-chat" />
            ) : (
              messages.map((msg, i) => (
                <div className={`message ${msg.role}`} key={i}>
                  <div className={`message-header`}>
                    {msg.role === "interviewer"
                      ? "INTERVIEWER >"
                      : msg.role === "user"
                        ? `${username || "YOU"} >`
                        : "SYSTEM >"}
                  </div>
                  <div className="message-content">
                    {msg.content}
                    {msg.role === "interviewer" && <span className="cursor" />}
                  </div>
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
              ))
            )}
          </div>
        </div>

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
                        overflow: "auto",
                        width: "100%",
                        height: "100%",
                        // marginTop: "1.5rem",
                        // marginBottom: "1rem",
                        border: "1px solid var(--primary-green)",
                        transition: "none",
                        animation: "none",
                      }}
                    >
                      <Editor
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
                      disabled={isLoading || isInterviewEnded}
                      placeholder="Enter your response here. Click [ SEND_MESSAGE ] below to send."
                      className="textarea-input"
                    />
                  )}
                </div>
              </>
            )}
        </div>
      </div>
      <div className="button-row-input">
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
      </div>
      <div className="button-row">
        {!hasInterviewStarted ? (
          <button
            onClick={startNewInterview}
            disabled={isLoading}
            className={`retro-button red ${isLoading ? "disabled" : ""}`}
          >
            [ START_NEW_INTERVIEW ]
          </button>
        ) : (
          <button onClick={resetInterview} className="retro-button red">
            [ SAVE AND RESET ]
          </button>
        )}
      </div>
      {isCodeMode && (
        <div className="language-select-row">
          <label htmlFor="language-select">Language:</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-dropdown"
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
      )}
    </div>
  );
}
