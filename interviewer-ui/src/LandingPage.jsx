import { AsciiHeader } from './App';

export default function LandingPage() {
    return (
      <div className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-8 font-mono">
        <AsciiHeader text="Welcome fellow devs!" />
        <div className="text-center max-w-xl">
          <p className="text-lg text-green-300 mb-6">
            Practice mock technical interviews with AI.<br />
            Built for backend engineers, by a backend engineer.
          </p>
  

  
          <div className="mt-10 text-sm text-green-400 space-y-4 text-left">
            <p><strong>✅ What is it?</strong><br />
            Interviewer is a solo-built, AI-powered platform that simulates technical interviews for backend engineers. You’ll receive real-time questions, feedback, and scoring — just like a real interview.</p>
  
            <p><strong>👨‍💻 Who made this?</strong><br />
            Hi! I'm Michael, a backend engineer, currently based in Thailand. Reach me at: <a href="mailto:support@mail.interviewer.dev" className="underline text-green-300">support@mail.interviewer.dev</a></p>
  
            <p><strong>📬 Want early access?</strong><br />
            Email me and I’ll personally notify you when it launches.</p>
          </div>

          <a 
            href="/login"
            className="bg-black border border-green-500 text-green-500 px-6 py-3 hover:bg-green-800 hover:text-black transition-colors retro-button"
          >
            [ LOGIN ]
          </a>
  
          <div className="mt-8 text-xs text-gray-500">
            © 2025 Interviewer.dev. All rights reserved.
          </div>
        </div>
      </div>
    );
  }
  