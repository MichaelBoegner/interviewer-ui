import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";

// ✅ Login Page
function LoginPage({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      console.log("Login response:", data); // Debug login response
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      
      // Check for jwtoken in the response (not token)
      if (!data.jwtoken) {
        throw new Error("No token received from server");
      }
      
      // Important: Store the jwtoken from the response
      console.log("Saving token to localStorage:", data.jwtoken);
      localStorage.setItem("token", data.jwtoken);
      console.log("Token in localStorage after save:", localStorage.getItem("token"));
      
      // Then update the app state
      setToken(data.jwtoken);
      // Navigate programmatically
      navigate("/interview", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-green-400 p-6">
      <h1 className="text-2xl font-mono mb-4">Login to Interviewer</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-64">
        <input 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          className="mb-2 p-2 bg-gray-800 text-white rounded w-full" 
          disabled={isLoading}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className="mb-4 p-2 bg-gray-800 text-white rounded w-full" 
          disabled={isLoading}
          required
        />
        <button 
          type="submit"
          disabled={isLoading || !username || !password}
          className={`px-4 py-2 ${isLoading ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'} text-white rounded w-full transition-colors`}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

// ✅ Interview Terminal
function InterviewScreen({ token, setToken }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    console.log("InterviewScreen received token:", token);
    
    if (!token) {
      console.log("No token found, redirecting to login");
      navigate("/");
    } else {
      // Mark the page as loaded after a small delay to ensure UI is refreshed
      setTimeout(() => {
        setPageLoaded(true);
      }, 300);
    }
  }, [token, navigate]);

  // ✅ Start a new interview
  const startNewInterview = async () => {
    setIsLoading(true);
    setIsInterviewEnded(false);
    setMessages([]);
    setAuthError("");
    setConversationId(null); // Reset conversation ID when starting a new interview
    
    if (!token) {
      setAuthError("Authentication token not found. Please login again.");
      setIsLoading(false);
      setTimeout(() => navigate("/"), 2000);
      return;
    }
    
    try {
      console.log("Starting new interview with token:", token);
      const response = await fetch("http://localhost:8080/api/interviews", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      console.log("Interview start response:", data);
      
      if (!response.ok) {
        if (response.status === 401) {
          setAuthError("Your session has expired. Please login again.");
          localStorage.removeItem("token");
          setTimeout(() => navigate("/"), 2000);
        }
        throw new Error(data.message || "Failed to start interview");
      }
      
      setInterviewId(data.interview_id);
      setMessages([{ role: "interviewer", content: data.first_question }]);
    } catch (error) {
      console.error("Error starting interview:", error);
      setMessages([{ role: "system", content: `Error: ${error.message || "Could not start interview"}` }]);
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
      if (isFirstMessage) {
        // First message only needs the user message
        payload = {
          message: {
            author: "user",
            content: userMessage
          }
        };
      } else {
        // Subsequent messages need conversation_id and message
        payload = {
          conversation_id: conversationId,
          message: {
            author: "user",
            content: userMessage
          }
        };
      }
      
      console.log("Sending payload:", payload);
      
      const response = await fetch(`http://localhost:8080/api/conversations/${interviewId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}`
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
      
      // Extract the interviewer's response based on the structure
      if (data.response) {
        // Simple response format
        interviewerResponse = data.response;
        isFinished = data.next_question === "Finished" && data.topic === 0;
      } else if (data.conversation) {
        // Full conversation structure
        try {
          // Get the current topic and question number
          const currentTopic = data.conversation.current_topic;
          const currentQuestion = data.conversation.current_question_number;
          
          // Find the latest message from the interviewer in the current topic/question
          const topic = data.conversation.topics[currentTopic];
          if (topic && topic.questions) {
            const question = topic.questions[currentQuestion];
            if (question && question.messages) {
              // Find the last interviewer message
              const interviewerMessages = question.messages.filter(msg => 
                msg.author === "interviewer"
              );
              
              if (interviewerMessages.length > 0) {
                // Get the most recent message
                const latestMessage = interviewerMessages[interviewerMessages.length - 1];
                
                // Check if it's JSON content that needs parsing
                if (latestMessage.content.startsWith('{') && latestMessage.content.endsWith('}')) {
                  try {
                    const parsedContent = JSON.parse(latestMessage.content);
                    interviewerResponse = parsedContent.next_question;
                    
                    // Check if interview is finished
                    isFinished = parsedContent.next_topic === "Finished";
                  } catch (error) {
                    // If parsing fails, use the raw content
                    console.error("Error parsing JSON response:", error);
                    interviewerResponse = latestMessage.content;
                  }
                } else {
                  interviewerResponse = latestMessage.content;
                }
              }
            }
          }
        } catch (error) {
          console.error("Error parsing conversation response:", error);
          interviewerResponse = "Error parsing the interview response. Please try again.";
        }
      }
      
      // Update the UI based on the response
      if (isFinished) {
        setIsInterviewEnded(true);
        setMessages([
          ...newMessages, 
          { role: "interviewer", content: interviewerResponse },
          { role: "system", content: "Interview has ended. You can start a new interview." }
        ]);
      } else {
        setMessages([...newMessages, { role: "interviewer", content: interviewerResponse }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([...newMessages, { role: "system", content: `Error: ${error.message || "Could not send message"}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Logout function
  const handleLogout = () => {
    // First clear tokens and state
    setToken(null);
    localStorage.removeItem("token");
    setInterviewId(null);
    setConversationId(null);
    setMessages([]);
    setInput("");
    setIsCodeMode(false);
    setIsInterviewEnded(false);
    
    // Then navigate to login page
    navigate("/", { replace: true });
  };

  // Handle Enter key in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen w-full bg-black text-green-400 p-6 flex flex-col items-center">
      <h1 className="text-2xl font-mono mb-4">Mock Interview Terminal</h1>

      {/* Display authentication errors */}
      {authError && (
        <div className="w-full max-w-2xl mb-4 p-4 bg-red-900 text-white rounded text-center">
          {authError}
        </div>
      )}

      {!pageLoaded ? (
        <div className="text-yellow-300 text-center animate-pulse">
          Loading terminal interface...
        </div>
      ) : (
        <>
          {/* ✅ Start Interview Button */}
          <button 
            onClick={startNewInterview} 
            disabled={isLoading}
            className={`mb-4 px-4 py-2 ${isLoading ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'} text-white rounded transition-colors`}
          >
            {isLoading ? "Loading..." : "Start New Interview"}
          </button>

          {/* ✅ Chat Window */}
          <div className="w-full max-w-2xl h-80 overflow-y-auto p-4 bg-gray-900 border border-green-600 rounded mb-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Click "Start New Interview" to begin
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-2 mb-2 ${
                    msg.role === "user" 
                      ? "text-blue-300 text-right" 
                      : msg.role === "system" 
                        ? "text-red-400 text-center italic" 
                        : "text-yellow-300 text-left"
                  }`}
                >
                  {msg.role === "user" 
                    ? "You: " 
                    : msg.role === "system" 
                      ? "" 
                      : "Interviewer: "
                  }
                  {msg.content && msg.content.startsWith('{') && msg.content.endsWith('}')
                    ? (() => {
                        try {
                          const parsed = JSON.parse(msg.content);
                          return parsed.next_question || parsed.question || msg.content;
                        } catch (error) {
                          console.warn("Error parsing message JSON:", error.message);
                          return msg.content;
                        }
                      })()
                    : msg.content
                  }
                </div>
              ))
            )}
          </div>

          {/* ✅ Input Controls */}
          <div className="flex flex-col items-center w-full max-w-2xl gap-2">
            {interviewId && !isInterviewEnded && !authError && (
              <>
                {/* ✅ Toggle Code/Text Mode */}
                <button 
                  onClick={() => setIsCodeMode(!isCodeMode)} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded w-full transition-colors"
                >
                  {isCodeMode ? "Switch to Text Mode" : "Switch to Code Mode"}
                </button>

                {/* ✅ Text Input or Code Editor */}
                {isCodeMode ? (
                  <MonacoEditor 
                    height="200px" 
                    language="javascript" 
                    theme="vs-dark" 
                    value={input} 
                    onChange={(value) => setInput(value)} 
                    className="w-full border border-gray-700 rounded" 
                  />
                ) : (
                  <textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || isInterviewEnded}
                    className="w-full h-32 bg-gray-800 text-green-400 p-2 rounded" 
                    placeholder={isLoading ? "Waiting for response..." : "Type your response here..."} 
                  />
                )}

                {/* ✅ Send Message Button */}
                <button 
                  onClick={sendMessage} 
                  disabled={isLoading || !input.trim() || isInterviewEnded}
                  className={`mt-2 px-4 py-2 ${isLoading || !input.trim() || isInterviewEnded ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'} text-white rounded w-full transition-colors`}
                >
                  {isLoading ? "Sending..." : "Send"}
                </button>
              </>
            )}

            {/* ✅ Logout Button */}
            <button 
              onClick={handleLogout} 
              className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded w-full transition-colors"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ✅ Main App Component
export default function App() {
  // Initialize token from localStorage with added safety check
  const getInitialToken = () => {
    try {
      return localStorage.getItem("token") || null;
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return null;
    }
  };

  const [token, setToken] = useState(getInitialToken());
  
  // Function to update token state
  const updateToken = (newToken) => {
    console.log("updateToken called with:", newToken);
    try {
      if (newToken) {
        localStorage.setItem("token", newToken);
      } else {
        localStorage.removeItem("token");
      }
      setToken(newToken);
    } catch (e) {
      console.error("Error updating token in localStorage:", e);
    }
  };
  
  // Safe localStorage check
  const checkToken = () => {
    try {
      const storedToken = localStorage.getItem("token");
      console.log("Checking stored token:", storedToken);
      if (storedToken !== token) {
        console.log("Token mismatch, updating state");
        setToken(storedToken || null);
      }
    } catch (e) {
      console.error("Error checking token in localStorage:", e);
    }
  };

  // Check token on mount and when token changes
  useEffect(() => {
    checkToken();
    
    // Set up an interval to periodically check token
    const intervalId = setInterval(checkToken, 2000);
    
    return () => clearInterval(intervalId);
  }, [token]);
  
  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            token ? (
              <Navigate to="/interview" replace />
            ) : (
              <LoginPage setToken={updateToken} />
            )
          } 
        />
        <Route 
          path="/interview" 
          element={
            token ? (
              <InterviewScreen token={token} setToken={updateToken} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
