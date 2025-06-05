import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import posthog from "posthog-js";
import "./Interview.css";

export default function InterviewScreen({ token, setToken }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [interviewStatus, setInterviewStatus] = useState("idle");
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [username, setUsername] = useState("");
  const [_, setPageLoaded] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get username from localStorage for display in messages
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
        posthog.capture("interview_viewed", {
          username,
        });
      }, 300);
    }
  }, [token, navigate]);

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
      setMessages([{ role: "interviewer", content: data.first_question }]);
      setInterviewStatus("active");
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

  // ✅ Send message to backend
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
          ...newMessages,
          {
            role: "interviewer",
            content: interviewerResponse,
            score,
            feedback,
            parsedData: parsedResponseData,
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

  // Handle Enter key in textarea
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleInterviewStatus = async () => {
    if (!interviewId || !token) return;

    const newStatus = interviewStatus === "active" ? "paused" : "active";

    try {
      const response = await fetch(`${API_URL}/interviews/${interviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || "Failed to update status"
        );
      }

      setInterviewStatus(newStatus);
      posthog.capture("interview_status_toggled", {
        interviewId,
        from: interviewStatus,
        to: newStatus,
      });
    } catch (err) {
      console.error("Status update failed:", err);
      posthog.capture("interview_status_toggle_exception", {
        interviewId,
        error: err.message,
      });
      setMessages((prev) => [
        ...prev,
        { role: "system", content: `Failed to update status: ${err.message}` },
      ]);
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
        <div className="scanline"></div>

        {authError && (
          <div className="error-box">
            <span className="error-label">ERROR:</span> {authError}
          </div>
        )}

        <div className="terminal-header">
          <div className="button-row">
            {interviewStatus === "idle" ? (
              <button
                onClick={startNewInterview}
                disabled={isLoading}
                className={`retro-button red ${isLoading ? "disabled" : ""}`}
              >
                {isLoading ? "[ LOADING... ]" : "[ START_INTERVIEW ]"}
              </button>
            ) : (
              <button
                onClick={toggleInterviewStatus}
                className="retro-button yellow"
              >
                {interviewStatus === "active"
                  ? "[ PAUSE_INTERVIEW ]"
                  : "[ RESUME_INTERVIEW ]"}
              </button>
            )}
          </div>
        </div>
        {interviewStatus === "paused" && (
          <div className="paused-message">
            <span className="label-tag">[SYSTEM]:</span> Interview is paused.
            Resume to continue.
          </div>
        )}

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
                      ? `${username || "USER"} >`
                      : "SYSTEM >"}
                </div>
                <div className="message-content">
                  {msg.content}
                  {msg.role === "interviewer" && <span className="cursor" />}
                </div>
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
            ))
          )}
        </div>

        <div className="input-wrapper">
          {interviewId &&
            !isInterviewEnded &&
            !authError &&
            interviewStatus === "active" && (
              <>
                <div className="toggle-row">
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

                <div className="textarea-wrapper">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || isInterviewEnded}
                    placeholder={
                      isLoading
                        ? "Processing response..."
                        : "Enter your response..."
                    }
                    className="textarea-input"
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim() || isInterviewEnded}
                  className="retro-button green"
                >
                  {isLoading ? "[ TRANSMITTING... ]" : "[ SEND_MESSAGE ]"}
                </button>
              </>
            )}
        </div>

        <div className="terminal-footer">
          ====================================================================
        </div>
      </div>
    </div>
  );
}
