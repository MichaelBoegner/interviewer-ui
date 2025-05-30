import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Interview.css";

export default function Interview({ token, setToken }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [username, setUsername] = useState("");
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) setUsername(storedUsername);
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/");
    } else {
      setTimeout(() => setPageLoaded(true), 300);
    }
  }, [token, navigate]);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setInterviewId(null);
    setMessages([]);
    setInput("");
    setIsCodeMode(false);
    setIsInterviewEnded(false);
    navigate("/", { replace: true });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    // implementation as before (omitted for brevity)
  };

  const startNewInterview = async () => {
    // implementation as before (omitted for brevity)
  };

  return (
    <div className="interview-screen">
      <div className="terminal-box">
        <div className="scanline"></div>

        {authError && (
          <div className="error-box">
            <span className="error-label">ERROR:</span> {authError}
          </div>
        )}

        {!pageLoaded ? (
          <div className="loading-screen">
            <pre>
              [ LOADING SYSTEM ] ================== Initializing interface...
              Checking authorization... Loading terminal modules...
            </pre>
          </div>
        ) : (
          <>
            <div className="terminal-header">
              <div className="system-label">
                <span className="label-tag">[SYSTEM]:</span> Backend Interview
                Protocol Active
              </div>

              <div className="button-row">
                <button
                  onClick={startNewInterview}
                  disabled={isLoading}
                  className={`retro-button red ${isLoading ? "disabled" : ""}`}
                >
                  {isLoading ? "[ LOADING... ]" : "[ INITIALIZE_INTERVIEW ]"}
                </button>
              </div>
            </div>

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
                      {msg.role === "interviewer" && (
                        <span className="cursor" />
                      )}
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
              {interviewId && !isInterviewEnded && !authError && (
                <>
                  <div className="toggle-row">
                    <button
                      onClick={() => setIsCodeMode(!isCodeMode)}
                      className="retro-button blue small"
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

              <button onClick={handleLogout} className="retro-button gray">
                [ LOGOUT ]
              </button>
            </div>

            <div className="terminal-footer">
              ====================================================================
            </div>
          </>
        )}
      </div>
    </div>
  );
}
