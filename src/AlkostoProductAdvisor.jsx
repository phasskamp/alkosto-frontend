import React, { useState, useEffect } from 'react';
import './AlkostoProductAdvisor.css';

const AlkostoProductAdvisor = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentId, setAgentId] = useState('');

  // Railway Letta Server URL - Updated to use v1 API
  const LETTA_SERVER_URL = 'https://lettalettalatest-production-ab71.up.railway.app';

  // Fetch available agents when component mounts
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${LETTA_SERVER_URL}/v1/agents/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const agents = await response.json();
      console.log('Available agents:', agents);
      
      if (agents && agents.length > 0) {
        // Use the first available agent or find your specific agent
        const alkostoAgent = agents.find(agent => 
          agent.name.toLowerCase().includes('alkosto') || 
          agent.name.toLowerCase().includes('product') ||
          agent.name.toLowerCase().includes('advisor')
        );
        
        const selectedAgent = alkostoAgent || agents[0];
        setAgentId(selectedAgent.id);
        console.log('Selected agent:', selectedAgent);
        
        // Add welcome message
        setMessages([{
          role: 'assistant',
          content: `¡Hola! Soy tu asesor de productos Alkosto. ¿En qué puedo ayudarte hoy?`,
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setMessages([{
        role: 'assistant',
        content: 'Error connecting to Alkosto advisor. Please try again later.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !agentId) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Use the correct v1 API endpoint for sending messages
      const response = await fetch(`${LETTA_SERVER_URL}/v1/agents/${agentId}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: inputMessage
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Agent response:', data);

      // Extract assistant messages from the response
      if (data.messages && data.messages.length > 0) {
        const assistantMessages = data.messages
          .filter(msg => msg.message_type === 'assistant_message')
          .map(msg => ({
            role: 'assistant',
            content: msg.content,
            timestamp: new Date().toLocaleTimeString()
          }));

        if (assistantMessages.length > 0) {
          setMessages(prev => [...prev, ...assistantMessages]);
        } else {
          // Fallback if no assistant messages found
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Recibí tu mensaje, pero no pude generar una respuesta en este momento.',
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'No pude procesar tu consulta en este momento. Por favor intenta de nuevo.',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, hay un problema de conexión. Por favor intenta más tarde.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="alkosto-advisor">
      <div className="chat-header">
        <h2>🛒 Asesor de Productos Alkosto</h2>
        <div className="agent-status">
          {agentId ? (
            <span className="status-connected">✅ Conectado</span>
          ) : (
            <span className="status-disconnected">⚠️ Conectando...</span>
          )}
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-timestamp">
              {message.timestamp}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Pregúntame sobre productos, precios, disponibilidad..."
          rows="3"
          disabled={isLoading || !agentId}
        />
        <button 
          onClick={sendMessage} 
          disabled={isLoading || !agentId || !inputMessage.trim()}
          className="send-button"
        >
          {isLoading ? '⏳' : '📤'}
        </button>
      </div>
      
      <div className="chat-footer">
        <small>💡 Pregunta sobre productos, compara precios, consulta disponibilidad</small>
      </div>
    </div>
  );
};

export default AlkostoProductAdvisor;