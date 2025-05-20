import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AsciiHeader } from './ASCII';

export default function LoginPage({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      console.log("Login response:", data);
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      
      if (!data.jwtoken) {
        throw new Error("No token received from server");
      }
      
      console.log("Saving token to localStorage:", data.jwtoken);
      localStorage.setItem("token", data.jwtoken);
      localStorage.setItem("username", username); // Store username for use in chat
      console.log("Token in localStorage after save:", localStorage.getItem("token"));
      
      setToken(data.jwtoken);
      navigate("/interview", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        redirect: "error",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password
        }),
      });
      
      const data = await response.json();
      console.log("Registration response:", data);
      
      if (!response.ok) {
        throw new Error(data.message || data.error || "Registration failed");
      }
      
      setSuccessMessage("Account created successfully! You can now log in.");
      setShowRegister(false);
      // Clear form
      setUsername("");
      setPassword("");
      setEmail("");
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setShowRegister(!showRegister);
    setError("");
    setSuccessMessage("");
    setUsername("");
    setPassword("");
    setEmail("");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-black text-green-400 p-6 font-mono">
      <div className="w-full max-w-md border-2 border-green-500 bg-gray-900 p-6 rounded-none relative terminal-window">
        <div className="scanline"></div>
        <div className="absolute top-0 left-0 right-0 bg-green-600 text-black px-4 py-1 flex justify-between items-center">
          <div>{showRegister ? "register.exe" : "login.exe"}</div>
        </div>
        <div className="mt-6">
          <AsciiHeader text={showRegister ? "REGISTRATION MODULE v1.0.0" : "LOGIN MODULE v1.0.0"} />
          
          <div className="mb-4 text-green-300 text-sm typewriter">
            <span className="text-yellow-400">$</span> {showRegister ? "NEW USER REGISTRATION" : "SYSTEM AUTHENTICATION REQUIRED"}
          </div>
          
          {error && (
            <div className="mb-4 border border-red-500 bg-red-900/30 p-2 text-red-400 text-sm">
              <span className="text-red-500">ERROR:</span> {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 border border-green-500 bg-green-900/30 p-2 text-green-400 text-sm">
              <span className="text-green-500">SUCCESS:</span> {successMessage}
            </div>
          )}
          
          <form onSubmit={showRegister ? handleRegister : handleSubmit} className="flex flex-col mt-6">
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
            </div>
            
            {showRegister && (
              <div className="flex items-center mb-4">
                <span className="text-yellow-400 mr-2">$</span>
                <span className="text-green-500 mr-2">mail:</span>
                <input 
                  type="email"
                  placeholder="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="flex-1 ml-2 bg-black text-green-400 border-b border-green-500 focus:border-green-400 outline-none p-1" 
                  disabled={isLoading}
                  required
                />
              </div>
            )}
            
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
            </div>
            
            <button 
              type="submit"
              disabled={isLoading || !username || !password || (showRegister && !email)}
              className="mt-4 bg-black border border-green-500 text-green-500 px-4 py-2 hover:bg-green-800 hover:text-black transition-colors duration-300 retro-button"
            >
              {isLoading 
                ? '[ PROCESSING... ]' 
                : showRegister 
                  ? '[ CREATE_ACCOUNT ]' 
                  : '[ LOGIN ]'}
            </button>

            <button 
              type="button"
              onClick={toggleForm}
              className="mt-4 bg-black border border-blue-500 text-blue-500 px-4 py-2 hover:bg-blue-800 hover:text-black transition-colors duration-300 retro-button"
            >
              [ {showRegister ? 'RETURN_TO_LOGIN' : 'NEW_USER_REGISTRATION'} ]
            </button>
            
         
          </form>
          <p>
            Forgot your password?{" "}
            <a href="/reset-request">Reset it here</a>
          </p>
          <div className="text-xs text-gray-500 mt-4 text-center">
            © 2025 Interviewer.dev. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}