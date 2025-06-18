// src/lib/messageProtocol.ts - Structured Message Protocol for LLM Optimization
export interface StructuredMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  timestamp: string;
  metadata?: {
    sessionId: string;
    messageId: string;
    context?: ConversationContext;
    intent?: UserIntent;
    confidence?: number;
  };
}

export interface ConversationContext {
  // User context
  userProfile?: {
    preferredBrands?: string[];
    budgetRange?: { min: number; max: number };
    previousPurchases?: string[];
    shoppingBehavior?: 'budget-conscious' | 'premium-seeker' | 'feature-focused';
  };
  
  // Search context
  currentSearch?: {
    category?: string;
    criteria: Record<string, any>;
    phase: 'discovery' | 'narrowing' | 'comparison' | 'decision';
    missingInfo: string[];
  };
  
  // Conversation flow
  conversationState: {
    turnCount: number;
    lastAgentAction: 'search' | 'question' | 'recommendation' | 'clarification';
    userSatisfaction?: 'high' | 'medium' | 'low';
    progressTowards: 'purchase' | 'research' | 'comparison';
  };
  
  // Product context
  productsContext?: {
    lastSearchResults: number;
    viewedProducts: string[];
    comparedProducts: string[];
    addedToCart: string[];
  };
}

export interface UserIntent {
  primary: 'search' | 'compare' | 'question' | 'purchase' | 'support';
  secondary?: string[];
  confidence: number;
  entities: {
    products?: string[];
    brands?: string[];
    features?: string[];
    priceRange?: { min?: number; max?: number };
    category?: string;
  };
}

export class MessageProtocolService {
  private conversationHistory: StructuredMessage[] = [];
  private currentContext: ConversationContext;

  constructor() {
    this.currentContext = {
      conversationState: {
        turnCount: 0,
        lastAgentAction: 'search',
        progressTowards: 'research'
      }
    };
  }

  /**
   * Create a structured message for the LLM
   */
  createStructuredMessage(
    userInput: string,
    sessionId: string,
    previousContext?: ConversationContext
  ): StructuredMessage {
    const intent = this.analyzeUserIntent(userInput);
    const context = this.updateConversationContext(userInput, intent, previousContext);
    
    return {
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
      metadata: {
        sessionId,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        context,
        intent,
        confidence: intent.confidence
      }
    };
  }

  /**
   * Create system prompt with full context for the LLM
   */
  createSystemPromptWithContext(context: ConversationContext): StructuredMessage {
    const systemPrompt = this.buildSystemPrompt(context);
    
    return {
      role: 'system',
      content: systemPrompt,
      timestamp: new Date().toISOString(),
      metadata: {
        sessionId: 'system',
        messageId: `sys_${Date.now()}`,
        context
      }
    };
  }

  /**
   * Format conversation for LLM API call
   */
  formatForLLMAPI(userMessage: StructuredMessage): {
    messages: Array<{ role: string; content: string }>;
    systemContext: string;
    requestMetadata: any;
  } {
    const context = userMessage.metadata?.context;
    const intent = userMessage.metadata?.intent;

    // Build conversation history for LLM
    const messages = [
      {
        role: 'system',
        content: this.buildSystemPrompt(context!)
      },
      ...this.conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: userMessage.content
      }
    ];

    // Enhanced request metadata for agent
    const requestMetadata = {
      sessionId: userMessage.metadata?.sessionId,
      messageId: userMessage.metadata?.messageId,
      userIntent: intent,
      conversationContext: context,
      searchCriteria: this.extractSearchCriteria(context!),
      agentInstructions: this.generateAgentInstructions(context!, intent!)
    };

    return {
      messages,
      systemContext: JSON.stringify(context, null, 2),
      requestMetadata
    };
  }

  /**
   * Analyze user intent from input
   */
  private analyzeUserIntent(input: string): UserIntent {
    const text = input.toLowerCase();
    
    // Intent classification
    let primary: UserIntent['primary'] = 'search';
    let confidence = 0.7;

    if (text.includes('compar') || text.includes('diferencia') || text.includes('vs')) {
      primary = 'compare';
      confidence = 0.9;
    } else if (text.includes('comprar') || text.includes('precio') || text.includes('carrito')) {
      primary = 'purchase';
      confidence = 0.85;
    } else if (text.includes('?') || text.includes('como') || text.includes('que es')) {
      primary = 'question';
      confidence = 0.8;
    } else if (text.includes('busco') || text.includes('necesito') || text.includes('quiero')) {
      primary = 'search';
      confidence = 0.9;
    }

    // Entity extraction
    const entities: UserIntent['entities'] = {};
    
    // Extract category
    const categories = ['televisor', 'celular', 'laptop', 'gaming', 'audio', 'electrodomestico'];
    entities.category = categories.find(cat => text.includes(cat));
    
    // Extract brands
    const brands = ['samsung', 'lg', 'sony', 'apple', 'lenovo', 'hp', 'dell'];
    entities.brands = brands.filter(brand => text.includes(brand));
    
    // Extract price range
    const priceMatch = text.match(/(\d{1,3}(?:[.,]\d{3})*)/g);
    if (priceMatch) {
      const prices = priceMatch.map(p => parseInt(p.replace(/[.,]/g, '')));
      entities.priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    }

    return {
      primary,
      confidence,
      entities
    };
  }

  /**
   * Update conversation context
   */
  private updateConversationContext(
    userInput: string,
    intent: UserIntent,
    previousContext?: ConversationContext
  ): ConversationContext {
    const context: ConversationContext = {
      ...previousContext,
      conversationState: {
        turnCount: (previousContext?.conversationState.turnCount || 0) + 1,
        lastAgentAction: this.determineAgentAction(intent),
        progressTowards: this.determineProgress(intent, userInput),
        userSatisfaction: this.assessSatisfaction(userInput)
      }
    };

    // Update search context
    if (intent.primary === 'search') {
      context.currentSearch = {
        category: intent.entities.category,
        criteria: this.extractCriteria(userInput, intent),
        phase: this.determineSearchPhase(context.conversationState.turnCount),
        missingInfo: this.identifyMissingInfo(intent)
      };
    }

    this.currentContext = context;
    return context;
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(context: ConversationContext): string {
    const { conversationState, currentSearch, userProfile } = context;
    
    return `Eres un asistente de ventas inteligente de Alkosto especializado en tecnología.

CONTEXTO DE CONVERSACIÓN:
- Turno #${conversationState.turnCount}
- Última acción: ${conversationState.lastAgentAction}
- Progreso hacia: ${conversationState.progressTowards}
- Satisfacción estimada: ${conversationState.userSatisfaction || 'media'}

${currentSearch ? `
BÚSQUEDA ACTUAL:
- Categoría: ${currentSearch.category || 'no especificada'}
- Fase: ${currentSearch.phase}
- Criterios: ${JSON.stringify(currentSearch.criteria)}
- Info faltante: ${currentSearch.missingInfo.join(', ')}
` : ''}

${userProfile ? `
PERFIL DE USUARIO:
- Marcas preferidas: ${userProfile.preferredBrands?.join(', ') || 'no especificadas'}
- Rango de presupuesto: $${userProfile.budgetRange?.min || 0} - $${userProfile.budgetRange?.max || 'sin límite'}
- Comportamiento: ${userProfile.shoppingBehavior || 'no determinado'}
` : ''}

INSTRUCCIONES:
1. Usa el contexto para personalizar respuestas
2. Si falta información crítica, haz preguntas específicas
3. Recomienda productos basado en el perfil y contexto
4. Mantén un tono conversacional y servicial
5. Usa emojis apropiadamente para mejorar la experiencia`;
  }

  /**
   * Extract search criteria from user input and intent
   */
  private extractSearchCriteria(context: ConversationContext): Record<string, any> {
    const criteria: Record<string, any> = {};
    
    if (context.currentSearch) {
      criteria.category = context.currentSearch.category;
      criteria.phase = context.currentSearch.phase;
      
      // Add budget from user profile or search context
      if (context.userProfile?.budgetRange) {
        criteria.budget_max = context.userProfile.budgetRange.max;
        criteria.budget_min = context.userProfile.budgetRange.min;
      }
      
      // Add other criteria
      Object.assign(criteria, context.currentSearch.criteria);
    }
    
    return criteria;
  }

  /**
   * Generate specific instructions for the agent
   */
  private generateAgentInstructions(context: ConversationContext, intent: UserIntent): string[] {
    const instructions: string[] = [];
    
    if (intent.primary === 'search' && context.currentSearch?.missingInfo.length) {
      instructions.push(`ASK_FOR: ${context.currentSearch.missingInfo.join(', ')}`);
    }
    
    if (context.conversationState.turnCount > 5 && !context.productsContext?.lastSearchResults) {
      instructions.push('SUGGEST_ALTERNATIVE_APPROACH');
    }
    
    if (intent.confidence < 0.6) {
      instructions.push('CLARIFY_USER_INTENT');
    }
    
    return instructions;
  }

  // Helper methods
  private determineAgentAction(intent: UserIntent): ConversationContext['conversationState']['lastAgentAction'] {
    switch (intent.primary) {
      case 'search': return 'search';
      case 'compare': return 'comparison';
      case 'question': return 'clarification';
      default: return 'recommendation';
    }
  }

  private determineProgress(intent: UserIntent, input: string): ConversationContext['conversationState']['progressTowards'] {
    if (intent.primary === 'purchase' || input.includes('comprar')) return 'purchase';
    if (intent.primary === 'compare') return 'comparison';
    return 'research';
  }

  private assessSatisfaction(input: string): ConversationContext['conversationState']['userSatisfaction'] {
    const positive = ['bien', 'perfecto', 'excelente', 'gracias', 'bueno'];
    const negative = ['no', 'mal', 'problema', 'error', 'confund'];
    
    const text = input.toLowerCase();
    if (positive.some(word => text.includes(word))) return 'high';
    if (negative.some(word => text.includes(word))) return 'low';
    return 'medium';
  }

  private determineSearchPhase(turnCount: number): ConversationContext['currentSearch']['phase'] {
    if (turnCount <= 2) return 'discovery';
    if (turnCount <= 4) return 'narrowing';
    if (turnCount <= 6) return 'comparison';
    return 'decision';
  }

  private extractCriteria(input: string, intent: UserIntent): Record<string, any> {
    const criteria: Record<string, any> = {};
    
    // Extract from intent entities
    if (intent.entities.priceRange) {
      criteria.presupuesto_max = intent.entities.priceRange.max;
      criteria.presupuesto_min = intent.entities.priceRange.min;
    }
    
    if (intent.entities.brands?.length) {
      criteria.marcas_preferidas = intent.entities.brands;
    }
    
    // Extract usage patterns
    const text = input.toLowerCase();
    if (text.includes('trabajo') || text.includes('oficina')) {
      criteria.uso_principal = 'trabajo';
    } else if (text.includes('gaming') || text.includes('juego')) {
      criteria.uso_principal = 'gaming';
    } else if (text.includes('estudio') || text.includes('universidad')) {
      criteria.uso_principal = 'estudio';
    }
    
    return criteria;
  }

  private identifyMissingInfo(intent: UserIntent): string[] {
    const missing: string[] = [];
    
    if (!intent.entities.category) missing.push('categoria');
    if (!intent.entities.priceRange) missing.push('presupuesto');
    if (intent.primary === 'search' && !intent.entities.features?.length) {
      missing.push('uso_principal');
    }
    
    return missing;
  }

  /**
   * Add message to conversation history
   */
  addToHistory(message: StructuredMessage): void {
    this.conversationHistory.push(message);
    // Keep only last 20 messages for performance
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  /**
   * Get current context
   */
  getCurrentContext(): ConversationContext {
    return this.currentContext;
  }
}