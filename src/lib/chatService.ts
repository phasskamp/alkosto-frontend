// src/lib/chatService.ts - Extracted Chat Service for better testability
export interface ChatServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export interface ErrorContext {
  type: 'network' | 'server' | 'rate_limit' | 'validation' | 'unknown';
  statusCode?: number;
  retryable: boolean;
  userMessage: string;
  technicalMessage: string;
}

export class ChatService {
  private config: ChatServiceConfig;
  private retryCount = 0;

  constructor(config: ChatServiceConfig) {
    this.config = config;
  }

  async sendMessage(message: string, sessionId: string): Promise<BackendResponse> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest(message, sessionId);
      this.retryCount = 0; // Reset on success
      
      return {
        ...response,
        responseTime: Date.now() - startTime,
        success: true
      };

    } catch (error) {
      const errorContext = this.analyzeError(error);
      
      // Retry logic for retryable errors
      if (errorContext.retryable && this.retryCount < this.config.retries) {
        this.retryCount++;
        await this.delay(Math.pow(2, this.retryCount) * 1000); // Exponential backoff
        return this.sendMessage(message, sessionId);
      }

      // Return structured error response
      return {
        message: errorContext.userMessage,
        confidence: 'LOW',
        responseTime: Date.now() - startTime,
        products: [],
        suggestions: this.getErrorSuggestions(errorContext),
        success: false,
        agentType: 'ErrorHandler',
        error: errorContext
      };
    }
  }

  private async makeRequest(message: string, sessionId: string): Promise<BackendResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
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
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP_${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || typeof data.message !== 'string') {
        throw new Error('INVALID_RESPONSE: Missing required fields');
      }

      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private analyzeError(error: unknown): ErrorContext {
    if (error instanceof Error) {
      const message = error.message;

      // Network errors
      if (message.includes('fetch') || message.includes('NetworkError')) {
        return {
          type: 'network',
          retryable: true,
          userMessage: '🌐 Sin conexión a internet. Verifica tu red y reintenta.',
          technicalMessage: message,
          statusCode: undefined
        };
      }

      // HTTP errors
      if (message.includes('HTTP_')) {
        const statusCode = parseInt(message.split('HTTP_')[1]);
        
        switch (true) {
          case statusCode === 429:
            return {
              type: 'rate_limit',
              statusCode,
              retryable: true,
              userMessage: '⏰ Demasiadas consultas. Espera un momento antes de continuar.',
              technicalMessage: message
            };

          case statusCode >= 500:
            return {
              type: 'server',
              statusCode,
              retryable: true,
              userMessage: '🔧 Problema temporal en nuestros servidores. Reintentando...',
              technicalMessage: message
            };

          case statusCode === 400:
            return {
              type: 'validation',
              statusCode,
              retryable: false,
              userMessage: '📝 Mensaje no válido. Intenta reformular tu pregunta.',
              technicalMessage: message
            };

          case statusCode === 404:
            return {
              type: 'server',
              statusCode,
              retryable: false,
              userMessage: '🔍 Servicio no disponible. Contacta al soporte técnico.',
              technicalMessage: message
            };

          default:
            return {
              type: 'server',
              statusCode,
              retryable: statusCode >= 500,
              userMessage: `❌ Error del servidor (${statusCode}). Intenta de nuevo.`,
              technicalMessage: message
            };
        }
      }

      // Timeout errors
      if (message.includes('aborted') || message.includes('timeout')) {
        return {
          type: 'network',
          retryable: true,
          userMessage: '⏱️ La consulta tardó demasiado. Reintentando con una conexión más rápida...',
          technicalMessage: message
        };
      }

      // Validation errors
      if (message.includes('INVALID_RESPONSE')) {
        return {
          type: 'validation',
          retryable: false,
          userMessage: '🔄 Respuesta del servidor inválida. El equipo técnico fue notificado.',
          technicalMessage: message
        };
      }
    }

    // Unknown errors
    return {
      type: 'unknown',
      retryable: false,
      userMessage: '❓ Error inesperado. Intenta reformular tu pregunta.',
      technicalMessage: error?.toString() || 'Unknown error'
    };
  }

  private getErrorSuggestions(errorContext: ErrorContext): string[] {
    switch (errorContext.type) {
      case 'network':
        return [
          'Verificar conexión a internet',
          'Intentar de nuevo',
          'Contactar soporte si persiste'
        ];

      case 'rate_limit':
        return [
          'Esperar 30 segundos',
          'Reformular la pregunta',
          'Intentar una consulta más específica'
        ];

      case 'server':
        return [
          'Reintentar en unos segundos',
          'Simplificar la consulta',
          'Reportar el problema'
        ];

      case 'validation':
        return [
          'Reformular la pregunta',
          'Ser más específico',
          'Intentar con otras palabras'
        ];

      default:
        return [
          'Intentar de nuevo',
          'Reformular la consulta',
          'Contactar soporte'
        ];
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check with detailed status
  async getDetailedStatus(): Promise<{
    status: 'online' | 'degraded' | 'offline';
    responseTime: number;
    lastError?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          status: responseTime > 3000 ? 'degraded' : 'online',
          responseTime
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          lastError: `HTTP ${response.status}`
        };
      }

    } catch (error) {
      return {
        status: 'offline',
        responseTime: Date.now() - startTime,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}