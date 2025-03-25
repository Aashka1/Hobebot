import AuthForm from "@/components/AuthForm";
import { RiMentalHealthLine } from "react-icons/ri";

interface HomeProps {
  setIsAuthenticated: (value: boolean) => void;
}

export default function Home({ setIsAuthenticated }: HomeProps) {
  return (
    <main className="flex-grow container mx-auto p-4 flex flex-col md:flex-row gap-6 max-w-7xl">
      {/* AUTH SECTION */}
      <div className="w-full md:w-1/2 flex-grow flex flex-col justify-center">
        <AuthForm setIsAuthenticated={setIsAuthenticated} />
      </div>
      
      {/* CHAT PREVIEW SECTION */}
      <div className="w-full md:w-1/2 flex-grow hidden md:block">
        <div className="h-full max-h-[600px] flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
          {/* Chat Header */}
          <div className="bg-primary text-white p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
                <RiMentalHealthLine className="text-xl" />
              </div>
              <div>
                <h3 className="font-medium">HopeBot</h3>
                <p className="text-xs text-white/80">Mental health companion</p>
              </div>
            </div>
          </div>
          
          {/* Chat Messages Preview */}
          <div className="flex-grow p-4 overflow-y-auto bg-neutral-50">
            <div className="space-y-4">
              {/* Bot message */}
              <div className="flex items-start max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                  <RiMentalHealthLine className="text-primary text-sm" />
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm chat-bubble-bot">
                  <p className="text-sm">Hello! I'm HopeBot, your mental health companion. Sign in to start a conversation, and I'll help support your mental wellbeing.</p>
                </div>
              </div>
              
              {/* User can't message until logged in message */}
              <div className="py-2 px-3 bg-neutral-100 rounded-md text-center text-sm text-neutral-600">
                Please login or sign up to start chatting with HopeBot
              </div>
            </div>
          </div>
          
          {/* Chat Input (disabled) */}
          <div className="p-3 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Login to send messages..." 
                disabled 
                className="flex-grow p-3 bg-neutral-100 rounded-md border border-neutral-200 text-neutral-400" 
              />
              <button 
                disabled 
                className="p-3 rounded-md bg-neutral-100 text-neutral-400"
              >
                <RiMentalHealthLine />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
