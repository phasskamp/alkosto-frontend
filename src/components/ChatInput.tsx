import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showTyping?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Escribe tu mensaje aquí...",
  showTyping = false
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'inherit';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-white/5 backdrop-blur-md p-4 sticky bottom-0">
      {/* Typing indicator */}
      {showTyping && (
        <div className="mb-3 flex items-center gap-2 text-white/70 text-sm">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span>El asistente está escribiendo...</span>
        </div>
      )}

      <div className={`
        flex items-end gap-3 bg-white/10 rounded-2xl p-3 transition-all duration-200
        ${isFocused ? 'ring-2 ring-orange-400/50 bg-white/15' : ''}
        ${disabled ? 'opacity-50' : ''}
      `}>
        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent text-white placeholder-white/50 resize-none outline-none min-h-[24px] max-h-32 py-1"
            style={{ lineHeight: '1.5' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className={`
            p-2 rounded-lg transition-all duration-200 flex items-center justify-center
            ${!disabled && message.trim() 
              ? 'bg-orange-500 hover:bg-orange-600 text-white transform hover:scale-105' 
              : 'bg-white/20 text-white/50 cursor-not-allowed'
            }
          `}
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Shortcuts */}
      <div className="flex justify-between items-center mt-2 text-xs text-white/50">
        <span>Enter para enviar, Shift+Enter para nueva línea</span>
        <span>{message.length}/1000</span>
      </div>
    </div>
  );
};

export default ChatInput;
