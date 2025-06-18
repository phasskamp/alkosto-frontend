'use client';

import React, { useEffect } from 'react';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import LandingScreen from '../components/LandingScreen';
import { AlkostoAPI, Message, BackendProduct } from '../lib/api';
import { Bot, Wifi, WifiOff, MessageSquare, Download } from 'lucide-react';

export default function HomePage() {
  // Core state
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [showLanding, setShowLanding] = React.useState(true);
  const [connectionStatus, setConnectionStatus] = React.useState<'online' | 'offline' | 'slow'>('online');
  
  // UI state
  const [products, setProducts] = React.useState<BackendProduct[]>([]);
  const [sessionId, setSessionId] = React.useState<string>('');
  const [currentError, setCurrentError] = React.useState<{
    type: string;
    message: string;
    retryable: boolean;
  } | null>(null);

  // Initialize session and load history
  useEffect(() => {
    const initializeApp = async () => {
      const currentSessionId = AlkostoAPI.getCurrentSessionId();
      setSessionId(currentSessionId);
      
      // Load previous chat history
      const history = AlkostoAPI.loadChatHistory();
      if (history.length > 0) {
        setMessages(history);
        setShowLanding(false);
      }
      
      // Check connection status
      const status = await AlkostoAPI.getConnectionStatus();
      setConnectionStatus(status);
    };

    initializeApp();
  }, []);

  // Auto-scroll to bottom
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      AlkostoAPI.saveChatHistory(messages);
    }
  }, [messages]);

  // Start conversation from landing screen
  const startConversation = (initialMessage?: string) => {
    setShowLanding(false);
    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
  };

  // Handle sending messages
  const handleSendMessage = async (messageText: string) => {
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setProducts([]); // Clear previous products
    setCurrentError(null); // Clear any previous errors

    try {
      const startTime = Date.now();
      const response = await AlkostoAPI.sendMessage(messageText);
      const responseTime = Date.now() - startTime;

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        text: response.message,
        sender: 'assistant',
        timestamp: new Date(),
        confidence: response.confidence,
        responseTime: responseTime,
        suggestions: response.suggestions,
        products: response.products
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update products if any
      if (response.products && response.products.length > 0) {
        setProducts(response.products);
      }

      // Update connection status
      setConnectionStatus('online');

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        text: '❌ No pude procesar tu mensaje. Verifica tu conexión e intenta de nuevo.',
        sender: 'system',
        timestamp: new Date(),
        isError: true,
        suggestions: ['Reintentar', 'Verificar conexión']
      };

      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus('offline');
      setCurrentError({
        type: 'network',
        message: 'Error de conexión',
        retryable: true
      });
    } finally {
      setIsTyping(false);
    }
  };

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Start new chat
  const handleNewChat = () => {
    AlkostoAPI.resetSession();
    setMessages([]);
    setProducts([]);
    setShowLanding(true);
    setCurrentError(null);
    setSessionId(AlkostoAPI.getCurrentSessionId());
  };

  // Export chat history
  const handleExportHistory = () => {
    const history = AlkostoAPI.exportChatHistory ? AlkostoAPI.exportChatHistory() : JSON.stringify(messages);
    const blob = new Blob([history], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alkosto-chat-${sessionId.slice(-8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Retry last message
  const retryLastMessage = async () => {
    const lastUserMessage = [...messages]
      .reverse()
      .find(msg => msg.sender === 'user');
    
    if (lastUserMessage) {
      await handleSendMessage(lastUserMessage.text);
    }
  };

  // Clear error
  const clearError = () => {
    setCurrentError(null);
  };

  // Connection status component
  const ConnectionIndicator = () => (
    <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full ${
      connectionStatus === 'online' ? 'bg-green-500/20 text-green-300' :
      connectionStatus === 'slow' ? 'bg-yellow-500/20 text-yellow-300' :
      'bg-red-500/20 text-red-300'
    }`}>
      {connectionStatus === 'online' ? <Wifi className="w-4 h-4" /> :
       connectionStatus === 'slow' ? <Wifi className="w-4 h-4" /> :
       <WifiOff className="w-4 h-4" />}
      <span className="hidden sm:inline">
        {connectionStatus === 'online' ? 'Conectado' :
         connectionStatus === 'slow' ? 'Conexión lenta' :
         'Sin conexión'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">Alkosto AI</h1>
              <p className="text-white/60 text-xs">
                Asistente inteligente • Sesión: {sessionId.slice(-8)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ConnectionIndicator />
            
            {/* Export History Button */}
            {messages.length > 0 && (
              <button
                onClick={handleExportHistory}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-all duration-200"
                title="Exportar historial"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}
            
            {!showLanding && (
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Conversación</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {currentError && (
        <div className="bg-red-500/20 border-b border-red-500/30 p-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-300">
              <span>❌ {currentError.message}</span>
            </div>
            <div className="flex gap-2">
              {currentError.retryable && (
                <button
                  onClick={retryLastMessage}
                  className="bg-red-500/30 hover:bg-red-500/50 text-red-200 px-3 py-1 rounded text-sm transition-colors"
                >
                  Reintentar
                </button>
              )}
              <button
                onClick={clearError}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
        {showLanding ? (
          <LandingScreen onSuggestionClick={startConversation} />
        ) : (
          <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}
              
              {/* Products Grid */}
              {products.length > 0 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-white font-semibold text-lg mb-2">
                      Productos recomendados para ti
                    </h3>
                    <p className="text-white/70 text-sm">
                      Encontré {products.length} producto{products.length !== 1 ? 's' : ''} que podrían interesarte
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300 group hover:scale-105"
                      >
                        {/* Product Image Placeholder */}
                        <div className="aspect-video bg-white/5 rounded-lg mb-3 flex items-center justify-center border border-white/10">
                          <div className="text-center">
                            <div className="w-8 h-8 bg-white/20 rounded-lg mx-auto mb-2"></div>
                            <span className="text-white/50 text-xs">{product.type || 'Producto'}</span>
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-orange-300 transition-colors">
                          {product.title || 'Producto sin nombre'}
                        </h3>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-orange-400 font-bold text-lg">
                            {product.price || 'Precio no disponible'}
                          </span>
                        </div>
                        
                        {product.brand && (
                          <p className="text-white/60 text-sm mb-2">
                            <span className="text-white/40">Marca:</span> {product.brand}
                          </p>
                        )}
                        
                        {product.features && (
                          <p className="text-white/50 text-xs mb-3 line-clamp-2">
                            {product.features}
                          </p>
                        )}
                        
                        {/* Availability */}
                        <div className="mb-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            product.availability !== false 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              product.availability !== false ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                            {product.availability !== false ? 'Disponible' : 'Agotado'}
                          </span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          <button 
                            className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium ${
                              product.availability !== false
                                ? 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-105'
                                : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                            }`}
                            disabled={product.availability === false}
                          >
                            <span>{product.availability !== false ? 'Comprar' : 'Agotado'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={isTyping || connectionStatus === 'offline'}
              placeholder={
                connectionStatus === 'offline' 
                  ? "Sin conexión - verifica tu internet..." 
                  : isTyping 
                    ? "El asistente está escribiendo..."
                    : "Pregúntame sobre productos de tecnología..."
              }
              showTyping={isTyping}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 p-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/50 text-xs">
            Alkosto AI • Powered by{' '}
            <span className="text-orange-400">Graduated Search Agent v5.0</span>
            {' '}• {messages.length} mensaje{messages.length !== 1 ? 's' : ''} en esta sesión
            {products.length > 0 && (
              <span className="ml-2">• {products.length} productos encontrados</span>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}