import { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { AsciiHeader } from './App';

// ✅ Interview Terminal
export default function InterviewScreen({ token, setToken }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [interviewId, setInterviewId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [username, setUsername] = useState("");
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
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({})
    });

    // Handle credit-related failure
    if (response.status === 402) {
      const data = await response.json();
      const message = data?.error || "You do not have enough credits.";
      setMessages([{ role: "system", content: message }]);
      return;
    }

    // Handle auth expired
    if (response.status === 401) {
      setAuthError("Your session has expired. Please login again.");
      localStorage.removeItem("token");
      setTimeout(() => navigate("/"), 2000);
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

  } catch (error) {
    console.error("Error starting interview:", error);
    setMessages([{
      role: "system",
      content: `Failed to start interview: ${error.message}. Please try again or check your connection.`
    }]);
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
      let url;
      if (isFirstMessage) {
        // First message only needs the user message
        payload = {
          message: userMessage
          
        };
        url = `${API_URL}/conversations/create/${interviewId}`;
      } else {
        // Subsequent messages need conversation_id and message
        payload = {
          conversation_id: conversationId,
          message: userMessage
        };
        url = `${API_URL}/conversations/append/${interviewId}`;
      }
      
      console.log("Sending payload:", payload);
      
      const response = await fetch(url, {
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
          const currentQuestionNumber = data.conversation.current_question_number;
          
          console.log("Current topic:", currentTopic);
          console.log("Current subtopic:", currentSubtopic);
          console.log("Current question number:", currentQuestionNumber);
          
          // Check if interview is finished
          isFinished = currentTopic === 0 && currentSubtopic === "Finished";
          
          // Get the latest topic and question data
          const topics = data.conversation.topics;
          const latestTopic = Object.values(topics).find(t => t.id === currentTopic) || Object.values(topics).pop();
          
          if (latestTopic && latestTopic.questions) {
            // Find the question with the current question number
            const latestQuestion = Object.values(latestTopic.questions).find(q => 
              q.question_number === currentQuestionNumber
            ) || Object.values(latestTopic.questions).pop();
            
            if (latestQuestion && latestQuestion.messages) {
              // Get all interviewer messages for this question
              const interviewerMessages = latestQuestion.messages.filter(msg => 
                msg.author === "interviewer"
              );
              
              if (interviewerMessages.length > 0) {
                // Get the most recent message
                const latestMessage = interviewerMessages[interviewerMessages.length - 1];
                
                // Try to parse JSON content if it's a JSON string
                if (typeof latestMessage.content === 'string' && 
                    latestMessage.content.trim().startsWith('{') && 
                    latestMessage.content.trim().endsWith('}')) {
                  try {
                    parsedResponseData = JSON.parse(latestMessage.content);
                    interviewerResponse = parsedResponseData.next_question || parsedResponseData.question || latestMessage.content;
                    
                    // Extract score and feedback
                    if (parsedResponseData.score !== undefined) {
                      score = parsedResponseData.score;
                      setTotalScore(prevTotal => prevTotal + score);
                      setQuestionsAnswered(prev => prev + 1);
                    }
                    
                    if (parsedResponseData.feedback) {
                      feedback = parsedResponseData.feedback;
                    }
                    
                    console.log("Extracted score:", score);
                    console.log("Extracted feedback:", feedback);
                    console.log("Extracted next question:", interviewerResponse);
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
          { 
            role: "interviewer", 
            content: interviewerResponse,
            score,
            feedback,
            parsedData: parsedResponseData
          },
          { 
            role: "system", 
            content: `
=================================
    INTERVIEW COMPLETED
=================================

Thank you for participating in our technical interview process! 
The interview has concluded.

Your final score: ${totalScore + score}/${(questionsAnswered + 1) * 10} (${((totalScore + score) / ((questionsAnswered + 1) * 10) * 100).toFixed(0)}%)

You can start a new interview by clicking the [ INITIALIZE_INTERVIEW ] button above.
            `.trim()
          }
        ]);
      } else {
        setMessages([
          ...newMessages, 
          { 
            role: "interviewer", 
            content: interviewerResponse,
            score,
            feedback,
            parsedData: parsedResponseData
          }
        ]);
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

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="min-h-screen w-full bg-black text-green-400 p-3 md:p-6 flex flex-col items-center font-mono">
      <div className="w-full max-w-4xl border-2 border-green-500 bg-gray-900 p-4 rounded-none relative terminal-window">
        <div className="scanline"></div>
       
        
        <div className="mt-8 mb-4">
          <AsciiHeader text="TECHNICAL INTERVIEW TERMINAL v1.0.0" />
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
            <div className="w-full h-80 overflow-y-auto p-4 bg-black border border-green-600 font-mono text-sm mb-4 retro-scrollbar" ref={messagesContainerRef}>
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8 text-xs">
                  <pre className="whitespace-pre-wrap ">
                  {`
                  `}
                  </pre>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`message mb-6 ${msg.role}`}
                  >
                    {/* Message header with role */}
                    <div className={`message-header text-xs mb-1 ${
                      msg.role === 'interviewer' ? 'text-green-500' : 
                      msg.role === 'user' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {msg.role === 'interviewer' ? 'INTERVIEWER > ' : 
                       msg.role === 'user' ? `${username || 'USER'} > ` : 'SYSTEM > '}
                    </div>
                    
                    {/* Message content */}
                    <div className="message-content pl-2 border-l-2 border-gray-700">
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
                    
                    {/* Display Feedback and Score if available */}
                    {msg.role === "interviewer" && msg.feedback && (
                      <div className="mt-2 border border-dashed border-yellow-500 bg-yellow-900/20 p-2 rounded text-xs">
                        <div className="text-yellow-400 font-bold mb-1">FEEDBACK:</div>
                        <div className="text-yellow-300">{msg.feedback}</div>
                        {msg.score !== undefined && (
                          <div className="mt-1">
                            <span className="text-yellow-400 font-bold">SCORE: </span>
                            <span className={`${
                              msg.score >= 8 ? 'text-green-400' : 
                              msg.score >= 5 ? 'text-yellow-400' : 
                              'text-red-400'
                            }`}>{msg.score}/10</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                  
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
                      className="px-3 py-1 mb-4 bg-black border border-blue-500 text-blue-500 hover:bg-blue-900 hover:text-white transition-colors duration-300 text-xs retro-button"
                    >
                      [ {isCodeMode ? "TEXT_MODE" : "CODE_MODE"} ]
                    </button>
                  </div>

                  {/* ✅ Text Input or Code Editor */}
                  <div className="relative mt-4">
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

                        </div>
                        <textarea 
                          value={input} 
                          onChange={(e) => setInput(e.target.value)} 
                          onKeyDown={handleKeyDown}
                          disabled={isLoading || isInterviewEnded}
                          placeholder={isLoading ? "Processing response..." : "Enter your response..."}
                          className="w-full min-h-[10rem] resize-y bg-gray-900 text-green-400 p-3 border border-green-500 outline-none font-mono"
                          style={{ minHeight: "10rem", minWidth: "40rem", height: "auto" }} 
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
              ====================================================================
            </div>
          </>
        )}
      </div>
    </div>
  );
}