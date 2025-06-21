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
  const [, setTotalScore] = useState(0);
  const [, setQuestionsAnswered] = useState(0);
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

      if (!response.ok) {
        const { error, message } = await response.json();
        throw new Error(error || message || "Unexpected server error");
      }

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
      const userMessages = messages.filter((msg) => msg.role === "user");
      const isFirstMessage = userMessages.length === 0;

      const payload = isFirstMessage
        ? { message: userMessage }
        : { conversation_id: conversationId, message: userMessage };

      const url = isFirstMessage
        ? `${API_URL}/conversations/create/${interviewId}`
        : `${API_URL}/conversations/append/${interviewId}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setAuthError("Your session has expired. Please login again.");
          setToken(null);
          setTimeout(() => navigate("/"), 2000);
        }
        throw new Error(data.message || data.error || "Failed to send message");
      }

      if (isFirstMessage && data.conversation?.id) {
        setConversationId(data.conversation.id);
        const userId = localStorage.getItem("userId");
        localStorage.setItem(`${userId}_conversationId`, data.conversation.id);
      }

      const conv = data.conversation;

      if (
        conv.current_topic === 0 &&
        conv.current_subtopic === "finished" &&
        conv.current_question_number === 0
      ) {
        setIsInterviewEnded(true);
        posthog.capture("interview_completed", {
          interviewId,
          total_score: "final",
          questions_answered: "final",
        });
      }

      const updatedMessages = flattenConversation(conv);
      setMessages(updatedMessages);
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
              {isLoading ? "[ THINKING... ]" : "[ SAVE_AND_RESET ]"}
            </button>
          )}
          <button
            onClick={() => {
              posthog.capture("interview_to_dashboard", {});
              navigate("/dashboard");
            }}
            className="retro-button"
          >
            [ Go_to_Dashboard ]
          </button>
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
                    Hey there {username}! Welcome to the interview, and thanks
                    so much for taking the time!
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
                    and one suggestion for improvement. <br />
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
                    As a solo dev, I made Interviewer because I always feel so
                    nervous about an upcoming interview, no matter how confident
                    I feel in my knowledge. Part of that is just wanting to do
                    well, but I think a bigger part comes from so infrequently
                    getting to test my knowledge in an interview setting. So I
                    created something to help myself, and hopefully others, get
                    more comfortable through regular practice, so the nerves
                    don’t get in the way.
                    <br />
                    <br />
                    Finally, your feedback is everything to me and the way I'll
                    be able to make this the best experience for everyone. As a
                    result, you'll get a very short survey at the end of each
                    interview. If you can, please take the time to fill it out.
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
                {isLoading ? "[ THINKING... ]" : "[ SEND_MESSAGE ]"}
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
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      posthog.capture("language_selected", {
                        language: e.target.value,
                      });
                    }}
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
