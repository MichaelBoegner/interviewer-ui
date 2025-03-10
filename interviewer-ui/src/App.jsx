import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import MonacoEditor from "@monaco-editor/react";
import './App.css';

// Add this constant at the top of the file, after imports
const API_URL = import.meta.env.VITE_API_URL;

// Add this ASCII art banner function for the retro vibe
const AsciiHeader = ({ text }) => {
  return (
    <div className="my-2">
      <pre className="text-green-500 ascii-header" style={{
        fontFamily: "'Fira Code', 'Courier New', monospace",
        fontSize: "0.7rem",
        lineHeight: 1.2,
        whiteSpace: "pre",
        letterSpacing: 0,
        textAlign: "center",
        margin: 0,
        padding: 0,
        width: "100%",
        fontWeight: "bold",
        fontVariantLigatures: "none",
      }}>{`
  ___ _   _ _____ _____ ______     _____ _______        _______ ____  
 |_ _| \\ | |_   _| ____|  _ \\ \\   / /_ _| ____\\ \\      / / ____|  _ \\ 
  | ||  \\| | | | |  _| | |_) \\ \\ / / | ||  _|  \\ \\ /\\ / /|  _| | |_) |
  | || |\\  | | | | |___|  _ < \\ V /  | || |___  \\ V  V / | |___|  _ < 
 |___|_| \\_| |_| |_____|_| \\_\\ \\_/  |___|_____|  \\_/\\_/  |_____|_| \\_\\
                                                                       
${'>>'} ${text}
`}</pre>
    </div>
  );
};

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
      const response = await fetch(`${API_URL}/auth/login`, {
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
    <div className="h-screen flex flex-col items-center justify-center bg-black text-green-400 p-6 font-mono">
      <div className="w-full max-w-md border-2 border-green-500 bg-gray-900 p-6 rounded-none relative terminal-window">
        <div className="scanline"></div>
        <div className="absolute top-0 left-0 right-0 bg-green-600 text-black px-4 py-1 flex justify-between items-center">
          <div>interviewer.exe</div>
          <div>[X]</div>
        </div>
        <div className="mt-6">
          <AsciiHeader text="LOGIN MODULE v1.0.3" />
          
          <div className="mb-4 text-green-300 text-sm typewriter">
            <span className="text-yellow-400">$</span> SYSTEM AUTHENTICATION REQUIRED
          </div>
          
          {error && (
            <div className="mb-4 border border-red-500 bg-red-900/30 p-2 text-red-400 text-sm">
              <span className="text-red-500">ERROR:</span> {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col mt-6">
            <div className="flex items-center mb-4">
              <span className="text-yellow-400 mr-2">$</span>
              <span className="text-green-500 mr-2">user:</span>
              <input 
                placeholder="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="flex-1 ml-2 bg-black text-green-400 border-b border-green-500 focus:border-green-400 outline-none p-1" 
                disabled={isLoading}
                required
              />
              {!username && <span className="cursor"></span>}
            </div>
            
            <div className="flex items-center mb-6">
              <span className="text-yellow-400 mr-2">$</span>
              <span className="text-green-500 mr-2">pass:</span>
              <input 
                type="password" 
                placeholder="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="flex-1 ml-2 bg-black text-green-400 border-b border-green-500 focus:border-green-400 outline-none p-1" 
                disabled={isLoading}
                required
              />
              {!password && <span className="cursor"></span>}
            </div>
            
            <button 
              type="submit"
              disabled={isLoading || !username || !password}
              className="mt-4 bg-black border border-green-500 text-green-500 px-4 py-2 hover:bg-green-800 hover:text-black transition-colors duration-300 retro-button"
            >
              {isLoading ? '[ AUTHENTICATING... ]' : '[ LOGIN ]'}
            </button>
            
            <div className="text-xs text-gray-500 mt-4 text-center">
              © 1982-2024 INTERVIEWER CORP. ALL RIGHTS RESERVED.
            </div>
          </form>
        </div>
      </div>
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
      const response = await fetch(`${API_URL}/interviews`, {
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
      
      const response = await fetch(`${API_URL}/conversations/${interviewId}`, {
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
          const currentSubtopic = data.conversation.current_subtopic;
          const currentQuestionNumber = data.conversation.current_question_number;
          
          console.log("Current topic:", currentTopic);
          console.log("Current subtopic:", currentSubtopic);
          console.log("Current question number:", currentQuestionNumber);
          
          // Check if interview is finished
          isFinished = currentTopic === 0 && currentSubtopic === "Finished";
          
          // Get the current topic using the current_topic value
          const topics = data.conversation.topics;
          const currentTopicData = topics[currentTopic];
          
          console.log("Current topic data:", currentTopicData);
          
          if (currentTopicData && currentTopicData.questions) {
            // Get the current question using current_question_number
            const currentQuestion = currentTopicData.questions[currentQuestionNumber];
            console.log("Current question:", currentQuestion);
            
            if (currentQuestion && currentQuestion.messages) {
              // Get all interviewer messages for this question
              const interviewerMessages = currentQuestion.messages.filter(msg => 
                msg.author === "interviewer"
              );
              
              console.log("Interviewer messages:", interviewerMessages);
              
              if (interviewerMessages.length > 0) {
                // Get the most recent message
                const latestMessage = interviewerMessages[interviewerMessages.length - 1];
                
                // Try to parse JSON content if it's a JSON string
                if (typeof latestMessage.content === 'string' && 
                    latestMessage.content.trim().startsWith('{') && 
                    latestMessage.content.trim().endsWith('}')) {
                  try {
                    const parsedContent = JSON.parse(latestMessage.content);
                    interviewerResponse = parsedContent.next_question || parsedContent.question || latestMessage.content;
                  } catch (error) {
                    console.error("Error parsing JSON response:", error);
                    interviewerResponse = latestMessage.content;
                  }
                } else {
                  // If it's not JSON, use the content directly
                  interviewerResponse = latestMessage.content;
                }
                
                console.log("Extracted interviewer response:", interviewerResponse);
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
          { 
            role: "system", 
            content: `
=================================
    INTERVIEW COMPLETED
=================================

Thank you for participating in our technical interview process! 
The interview has concluded.

You can start a new interview by clicking the [ INITIALIZE_INTERVIEW ] button above.
            `.trim()
          }
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
    <div className="min-h-screen w-full bg-black text-green-400 p-3 md:p-6 flex flex-col items-center font-mono">
      <div className="w-full max-w-4xl border-2 border-green-500 bg-gray-900 p-4 rounded-none relative terminal-window">
        <div className="scanline"></div>
        <div className="absolute top-0 left-0 right-0 bg-green-600 text-black px-4 py-1 flex justify-between items-center">
          <div>terminal@interviewer:~</div>
          <div className="flex">
            <span className="mr-4">|=|</span>
            <span className="mr-4">|_|</span>
            <span>[X]</span>
          </div>
        </div>
        
        <div className="mt-8 mb-4">
          <AsciiHeader text="TECHNICAL INTERVIEW TERMINAL v2.4.1" />
        </div>

        {/* Display authentication errors */}
        {authError && (
          <div className="w-full mb-4 p-2 bg-red-900/30 border border-red-500 text-red-400 text-sm">
            <span className="text-red-500">ERROR:</span> {authError}
          </div>
        )}

        {!pageLoaded ? (
          <div className="text-yellow-300 text-center animate-pulse p-8">
            <pre className="text-xs">
            {`
            [ LOADING SYSTEM ]
            ==================
            Initializing interface...
            Checking authorization...
            Loading terminal modules...
            `}
            </pre>
          </div>
        ) : (
          <>
            {/* ✅ Terminal Header */}
            <div className="border-b border-green-500 pb-2 mb-4 flex flex-col md:flex-row md:justify-between items-center">
              <div className="text-yellow-400 text-xs mb-2 md:mb-0">
                <span className="mr-2">[SYSTEM]:</span> Backend Interview Protocol Active
              </div>
              {/* ✅ Start Interview Button */}
              <button 
                onClick={startNewInterview} 
                disabled={isLoading}
                className={`px-4 py-1 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} bg-black border border-red-500 text-red-500 hover:bg-red-900 hover:text-white transition-colors duration-300 retro-button`}
              >
                {isLoading ? "[ LOADING... ]" : "[ INITIALIZE_INTERVIEW ]"}
              </button>
            </div>

            {/* ✅ Chat Window */}
            <div className="w-full h-80 overflow-y-auto p-4 bg-black border border-green-600 font-mono text-sm mb-4 retro-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-xs">
                  <pre className="whitespace-pre-wrap">
                  {`
                  =================================
                  COMMAND REQUIRED: START_INTERVIEW
                  =================================
                  `}
                  </pre>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className="message"
                    data-role={msg.role}
                  >
                    <div className="message-content">
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
                      {msg.role === "interviewer" && <span className="cursor"></span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ✅ Input Controls */}
            <div className="flex flex-col w-full gap-2">
              {interviewId && !isInterviewEnded && !authError && (
                <>
                  {/* ✅ Toggle Code/Text Mode */}
                  <div className="flex justify-end mb-2">
                    <button 
                      onClick={() => setIsCodeMode(!isCodeMode)} 
                      className="px-3 py-1 bg-black border border-blue-500 text-blue-500 hover:bg-blue-900 hover:text-white transition-colors duration-300 text-xs retro-button"
                    >
                      [ {isCodeMode ? "TEXT_MODE" : "CODE_MODE"} ]
                    </button>
                  </div>

                  {/* ✅ Text Input or Code Editor */}
                  <div className="relative">
                    <div className="absolute top-0 left-0 bg-green-800 text-black px-2 py-0.5 text-xs">
                      {isCodeMode ? "code_editor.js" : "message.txt"}
                    </div>
                    {isCodeMode ? (
                      <div className="border border-green-500">
                        <MonacoEditor 
                          height="200px" 
                          language="javascript" 
                          theme="vs-dark" 
                          value={input} 
                          onChange={(value) => setInput(value)} 
                          options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontFamily: "monospace"
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex">
                        <div className="bg-gray-800 text-yellow-400 p-2">
                          &gt;
                        </div>
                        <textarea 
                          value={input} 
                          onChange={(e) => setInput(e.target.value)} 
                          onKeyDown={handleKeyDown}
                          disabled={isLoading || isInterviewEnded}
                          className="w-full h-28 bg-gray-900 text-green-400 p-2 border border-green-500 outline-none resize-none" 
                          placeholder={isLoading ? "Processing response..." : "Enter your response..."}
                        />
                      </div>
                    )}
                  </div>

                  {/* ✅ Send Message Button */}
                  <button 
                    onClick={sendMessage} 
                    disabled={isLoading || !input.trim() || isInterviewEnded}
                    className={`mt-2 px-4 py-2 ${isLoading || !input.trim() || isInterviewEnded ? 'bg-gray-800 text-gray-500' : 'bg-black border border-green-500 text-green-500 hover:bg-green-900 hover:text-white'} transition-colors duration-300 retro-button`}
                  >
                    {isLoading ? "[ TRANSMITTING... ]" : "[ SEND_MESSAGE ]"}
                  </button>
                </>
              )}

              {/* ✅ Logout Button */}
              <button 
                onClick={handleLogout} 
                className="mt-4 px-4 py-2 bg-black border border-gray-500 text-gray-500 hover:bg-gray-800 hover:text-white transition-colors duration-300 retro-button"
              >
                [ EXIT_SYSTEM ]
              </button>
            </div>
            
            {/* ✅ Terminal Footer */}
            <div className="text-xs text-gray-600 mt-6 border-t border-gray-800 pt-2 w-full text-center">
              INTERVIEWER OS v3.1.42 // MEMORY: 640K (CLASSIC) // TERMINAL: ACTIVE // PING: 23ms
            </div>
          </>
        )}
      </div>
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
