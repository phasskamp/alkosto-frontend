// src/lib/chatStore.ts - Global State Management with Zustand
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChatService } from './chatService';
import { BackendProduct, Message } from './api';

interface ChatState {
  // Core chat state
  messages: Message[];
  isTyping: boolean;
  connectionStatus: 'online' | 'offline' | 'slow';
  sessionId: string;
  
  // Product state
  products: BackendProduct[];
  searchContext: {
    lastQuery: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    missingCriteria: string[];
    budgetRange?: { min: number; max: number };
    category?: string;
    productCount: number;
  };
  
  // UI state
  showLanding: boolean;
  currentError?: {
    type: string;
    message: string;
    retryable: boolean;
  };
  
  // Services
  chatService?: ChatService;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  setConnectionStatus: (status: 'online' | 'offline' | 'slow') => void;
  setProducts: (products: BackendProduct[]) => void;
  updateSearchContext: (context: Partial<ChatState['searchContext']>) => void;
  startNewChat: () => void;
  hideLanding: () => void;
  initializeChatService: (config: { baseUrl: string; timeout: number; retries: number }) => void;
  
  // Advanced actions
  retryLastMessage: () => Promise<void>;
  clearError: () => void;
  exportChatHistory: () => string;
  importChatHistory: (data: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isTyping: false,
      connectionStatus: 'online',
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      products: [],
      searchContext: {
        lastQuery: '',
        confidence: 'MEDIUM',
        missingCriteria: [],
        productCount: 0
      },
      showLanding: true,
      currentError: undefined,
      chatService: undefined,

      // Initialize chat service
      initializeChatService: (config) => {
        const chatService = new ChatService(config);
        set({ chatService });
      },

      // Send message action
      sendMessage: async (messageText: string) => {
        const state = get();
        const { chatService, sessionId } = state;
        
        if (!chatService) {
          console.error('ChatService not initialized');
          return;
        }

        // Add user message
        const userMessage: Message = {
          id: `user_${Date.now()}`,
          text: messageText,
          sender: 'user',
          timestamp: new Date()
        };

        set({ 
          messages: [...state.messages, userMessage],
          isTyping: true,
          products: [],
          currentError: undefined,
          showLanding: false
        });

        try {
          const startTime = Date.now();
          const response = await chatService.sendMessage(messageText, sessionId);
          const responseTime = Date.now() - startTime;

          // Create assistant message
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

          // Update state
          set(state => ({
            messages: [...state.messages, assistantMessage],
            products: response.products || [],
            connectionStatus: 'online',
            isTyping: false,
            searchContext: {
              ...state.searchContext,
              lastQuery: messageText,
              confidence: response.confidence || 'MEDIUM',
              productCount: response.products?.length || 0,
              // Extract context from response if available
              category: extractCategoryFromResponse(response),
              budgetRange: extractBudgetFromResponse(response),
              missingCriteria: extractMissingCriteria(response)
            }
          }));

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

          set(state => ({
            messages: [...state.messages, errorMessage],
            connectionStatus: 'offline',
            isTyping: false,
            currentError: {
              type: 'network',
              message: 'Error de conexión',
              retryable: true
            }
          }));
        }
      },

      // Retry last message
      retryLastMessage: async () => {
        const state = get();
        const lastUserMessage = [...state.messages]
          .reverse()
          .find(msg => msg.sender === 'user');
        
        if (lastUserMessage) {
          await state.sendMessage(lastUserMessage.text);
        }
      },

      // Simple actions
      addMessage: (message) => set(state => ({ 
        messages: [...state.messages, message] 
      })),

      setTyping: (isTyping) => set({ isTyping }),

      setConnectionStatus: (status) => set({ connectionStatus: status }),

      setProducts: (products) => set({ products }),

      updateSearchContext: (context) => set(state => ({
        searchContext: { ...state.searchContext, ...context }
      })),

      hideLanding: () => set({ showLanding: false }),

      startNewChat: () => {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set({
          messages: [],
          products: [],
          showLanding: true,
          sessionId: newSessionId,
          currentError: undefined,
          searchContext: {
            lastQuery: '',
            confidence: 'MEDIUM',
            missingCriteria: [],
            productCount: 0
          }
        });
      },

      clearError: () => set({ currentError: undefined }),

      // Export/Import functionality
      exportChatHistory: () => {
        const state = get();
        return JSON.stringify({
          messages: state.messages,
          searchContext: state.searchContext,
          sessionId: state.sessionId,
          exportedAt: new Date().toISOString()
        }, null, 2);
      },

      importChatHistory: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          set({
            messages: parsed.messages || [],
            searchContext: parsed.searchContext || get().searchContext,
            sessionId: parsed.sessionId || get().sessionId,
            showLanding: parsed.messages?.length === 0
          });
        } catch (error) {
          console.error('Failed to import chat history:', error);
        }
      }
    }),
    {
      name: 'alkosto-chat-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential data
        messages: state.messages.slice(-50), // Last 50 messages
        sessionId: state.sessionId,
        searchContext: state.searchContext
      })
    }
  )
);

// Helper functions to extract context from responses
function extractCategoryFromResponse(response: any): string | undefined {
  // Parse response for category information
  if (response.agentType === 'GraduatedSearchAgent' && response.phase) {
    // Extract category from agent response
    const text = response.message.toLowerCase();
    const categories = ['televisor', 'celular', 'laptop', 'gaming', 'audio', 'electrodomestico'];
    return categories.find(cat => text.includes(cat));
  }
  return undefined;
}

function extractBudgetFromResponse(response: any): { min: number; max: number } | undefined {
  // Parse response for budget information
  const text = response.message;
  const budgetMatch = text.match(/\$?([\d,]+).*?\$?([\d,]+)/);
  if (budgetMatch) {
    return {
      min: parseInt(budgetMatch[1].replace(/,/g, '')),
      max: parseInt(budgetMatch[2].replace(/,/g, ''))
    };
  }
  return undefined;
}

function extractMissingCriteria(response: any): string[] {
  const criteria: string[] = [];
  const text = response.message.toLowerCase();
  
  if (text.includes('presupuesto') || text.includes('precio')) {
    criteria.push('budget');
  }
  if (text.includes('uso') || text.includes('utilizar')) {
    criteria.push('use_case');
  }
  if (text.includes('característica') || text.includes('especifica')) {
    criteria.push('features');
  }
  
  return criteria;
}

// Selectors for better performance
export const useMessages = () => useChatStore(state => state.messages);
export const useProducts = () => useChatStore(state => state.products);
export const useSearchContext = () => useChatStore(state => state.searchContext);
export const useConnectionStatus = () => useChatStore(state => state.connectionStatus);
export const useIsTyping = () => useChatStore(state => state.isTyping);