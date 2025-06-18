import React from 'react';
import { Bot, User, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: Date;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  responseTime?: number;
  suggestions?: string[];
  isError?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onSuggestionClick?: (suggestion: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSuggestionClick }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  // System messages (errors, notifications)
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className={`px-4 py-2 rounded-lg text-sm max-w-md text-center ${
          message.isError 
            ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
            : 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {message.isError ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isUser ? 'bg-orange-500' : 'bg-purple-600'}
      `}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      
      <div className={`max-w-md lg:max-w-lg ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Message bubble */}
        <div className={`
          p-3 rounded-2xl ${isUser 
            ? 'bg-orange-500 text-white' 
            : 'bg-white/10 text-white backdrop-blur-sm border border-white/20'
          }
        `}>
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
        
        {/* Metadata for assistant messages */}
        {!isUser && (
          <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
            {message.confidence && (
              <span className={`px-2 py-1 rounded ${
                message.confidence === 'HIGH' ? 'bg-green-500/20 text-green-300' :
                message.confidence === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                {message.confidence === 'HIGH' ? 'Alta confianza' :
                 message.confidence === 'MEDIUM' ? 'Media confianza' :
                 'Baja confianza'}
              </span>
            )}
            {message.responseTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{message.responseTime}ms</span>
              </div>
            )}
          </div>
        )}
        
        {/* Suggestion buttons */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="block w-full text-left text-sm bg-white/10 hover:bg-white/20 text-white/80 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
              >
                💡 {suggestion}
              </button>
            ))}
          </div>
        )}
        
        {/* Timestamp */}
        <p className="text-xs text-white/40 mt-1">
          {message.timestamp.toLocaleTimeString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;