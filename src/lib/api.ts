// src/lib/api.ts
export interface BackendProduct {
    id: string;
    title: string;
    price: string;
    type: string;
    brand?: string;
    features?: string;
    image?: string;
    rating?: number;
    availability?: boolean;
  }
  
  export interface BackendResponse {
    message: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    responseTime: number;
    products?: BackendProduct[];
    suggestions?: string[];
    success: boolean;
    agentType: string;
    phase?: string;
    sessionId?: string;
  }
  
  export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'assistant' | 'system';
    timestamp: Date;
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    responseTime?: number;
    suggestions?: string[];
    isError?: boolean;
    products?: BackendProduct[];
  }
  
  export class AlkostoAPI {
    if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error("❌ Environment variable NEXT_PUBLIC_API_URL is not set at build time!");
}
private static baseUrl = process.env.NEXT_PUBLIC_API_URL!;
    private static SESSION_KEY = 'alkosto-session-id';
    private static CHAT_HISTORY_KEY = 'alkosto-chat-history';
  
    /**
     * Get or create persistent session ID
     */
    private static getSessionId(): string {
      if (typeof window === 'undefined') return 'server-session';
      
      try {
        const existing = localStorage.getItem(this.SESSION_KEY);
        if (existing) return existing;
        
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(this.SESSION_KEY, sessionId);
        return sessionId;
      } catch (error) {
        console.warn('localStorage not available, using temporary session');
        return `temp_${Date.now()}`;
      }
    }
  
    /**
     * Save chat history to localStorage
     */
    static saveChatHistory(messages: Message[]): void {
      if (typeof window === 'undefined') return;
      
      try {
        const history = {
          sessionId: this.getSessionId(),
          messages: messages.slice(-50), // Keep last 50 messages
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(this.CHAT_HISTORY_KEY, JSON.stringify(history));
      } catch (error) {
        console.warn('Failed to save chat history:', error);
      }
    }
  
    /**
     * Load chat history from localStorage
     */
    static loadChatHistory(): Message[] {
      if (typeof window === 'undefined') return [];
      
      try {
        const stored = localStorage.getItem(this.CHAT_HISTORY_KEY);
        if (!stored) return [];
        
        const history = JSON.parse(stored);
        if (history.sessionId === this.getSessionId()) {
          return history.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        }
      } catch (error) {
        console.warn('Failed to load chat history:', error);
      }
      
      return [];
    }
  
    /**
     * Send message to Alkosto backend
     */
    static async sendMessage(message: string): Promise<BackendResponse> {
      try {
        const sessionId = this.getSessionId();
        console.log(`🚀 Sending message to ${this.baseUrl}/api/chat`);
        
        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            message: message.trim(),
            sessionId: sessionId,
            timestamp: new Date().toISOString()
          }),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        const data = await response.json();
        console.log('📦 Raw backend response:', data);
        
        // ✅ FIXED: Handle nested response structure from Graduated Search Agent
        if (!data || !data.response || typeof data.response.response !== 'string') {
          console.error('❌ Invalid response structure:', data);
          throw new Error('Invalid response format from server');
        }
  
        // ✅ FIXED: Extract data from nested structure
        const agentResponse = data.response;
        
        return {
          message: agentResponse.response,  // Extract nested response
          confidence: data.mode === "🤖 AI Agent" ? 'HIGH' : 'MEDIUM',
          responseTime: data.responseTime || agentResponse.processing_time || 0,
          products: agentResponse.products || [],
          suggestions: this.extractSuggestions(agentResponse),
          success: true,
          agentType: data.mode || 'GraduatedSearchAgent',
          phase: agentResponse.search_readiness || agentResponse.category_analysis,
          sessionId: data.sessionId || sessionId
        };
  
      } catch (error) {
        console.error('❌ API Error:', error);
        
        // Return user-friendly error response
        return {
          message: this.getErrorMessage(error),
          confidence: 'LOW',
          responseTime: 0,
          products: [],
          suggestions: ['Intenta preguntarme de nuevo', 'Revisa tu conexión a internet'],
          success: false,
          agentType: 'ErrorHandler',
          sessionId: this.getSessionId()
        };
      }
    }
  
    /**
     * Extract suggestions from agent response
     */
    private static extractSuggestions(agentResponse: any): string[] {
      const suggestions: string[] = [];
      
      // Add suggestions based on search readiness
      if (agentResponse.search_readiness === 'insufficient') {
        suggestions.push('Proporciona más detalles sobre el producto');
        suggestions.push('Especifica tu presupuesto');
      } else if (agentResponse.search_readiness === 'viable') {
        suggestions.push('¿Necesitas más información sobre algún producto?');
        suggestions.push('¿Quieres ver productos similares?');
      }
      
      // Add category-specific suggestions
      if (agentResponse.criteria_analysis?.criticalMissing?.length > 0) {
        const missing = agentResponse.criteria_analysis.criticalMissing[0];
        suggestions.push(`¿Podrías especificar el ${missing}?`);
      }
      
      return suggestions.slice(0, 3); // Limit to 3 suggestions
    }
  
    /**
     * Check if backend is available
     */
    static async healthCheck(): Promise<boolean> {
      try {
        const response = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        return response.ok;
      } catch (error) {
        console.warn('Health check failed:', error);
        return false;
      }
    }
  
    /**
     * Get user-friendly error message
     */
    private static getErrorMessage(error: unknown): string {
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          return '❌ No puedo conectarme al servidor. Verifica tu conexión a internet.';
        }
        if (error.message.includes('HTTP 500')) {
          return '❌ Error en el servidor. Nuestro equipo está trabajando para solucionarlo.';
        }
        if (error.message.includes('HTTP 429')) {
          return '❌ Demasiadas consultas. Espera un momento antes de intentar de nuevo.';
        }
        if (error.message.includes('Invalid response format')) {
          return '❌ Respuesta del servidor inválida. Intenta de nuevo.';
        }
      }
      return '❌ Ocurrió un error inesperado. Intenta de nuevo en unos segundos.';
    }
  
    /**
     * Get current session ID
     */
    static getCurrentSessionId(): string {
      return this.getSessionId();
    }
  
    /**
     * Reset session (creates new session ID)
     */
    static resetSession(): void {
      if (typeof window === 'undefined') return;
      
      try {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(this.SESSION_KEY, newSessionId);
        localStorage.removeItem(this.CHAT_HISTORY_KEY);
        console.log(`🔄 New session created: ${newSessionId}`);
      } catch (error) {
        console.warn('Failed to reset session:', error);
      }
    }
  
    /**
     * Convert backend product to frontend format
     */
    static convertProduct(backendProduct: BackendProduct): BackendProduct {
      return {
        id: backendProduct.id || `product_${Date.now()}`,
        title: backendProduct.title || 'Producto sin nombre',
        price: this.formatPrice(backendProduct.price),
        type: backendProduct.type || 'Electrónico',
        brand: backendProduct.brand || 'Marca genérica',
        features: backendProduct.features || '',
        image: backendProduct.image || '/placeholder-product.jpg',
        rating: backendProduct.rating || 4.0,
        availability: backendProduct.availability !== false
      };
    }
  
    /**
     * Format price for display
     */
    private static formatPrice(price: string | number): string {
      if (typeof price === 'number') {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
        }).format(price);
      }
      
      // Handle string prices
      const numericPrice = parseFloat(price.toString().replace(/[^\d.]/g, ''));
      if (isNaN(numericPrice)) return price.toString();
      
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(numericPrice);
    }
  
    /**
     * Get connection status
     */
    static async getConnectionStatus(): Promise<'online' | 'offline' | 'slow'> {
      try {
        const startTime = Date.now();
        const isHealthy = await this.healthCheck();
        const responseTime = Date.now() - startTime;
        
        if (!isHealthy) return 'offline';
        if (responseTime > 3000) return 'slow';
        return 'online';
      } catch (error) {
        return 'offline';
      }
    }
  }
