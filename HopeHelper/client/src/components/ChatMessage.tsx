import { RiMentalHealthLine } from "react-icons/ri";
import { Message } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.isBot === "true";
  
  if (isBot) {
    return (
      <div className="flex items-start max-w-[80%] fade-in">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-2 flex-shrink-0">
          <RiMentalHealthLine className="text-primary text-sm" />
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm chat-bubble-bot">
          {message.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className={cn("text-sm", i > 0 && "mt-2")}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-start justify-end fade-in">
      <div className="bg-primary p-3 rounded-lg shadow-sm text-white chat-bubble-user max-w-[80%]">
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
}
