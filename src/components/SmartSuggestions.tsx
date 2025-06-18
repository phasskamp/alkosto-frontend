// src/components/SmartSuggestions.tsx
import React from 'react';
import { RefreshCw, DollarSign, Filter, Lightbulb, ArrowRight } from 'lucide-react';

interface SuggestionContext {
  hasProducts: boolean;
  productCount: number;
  searchConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  lastQuery: string;
  missingCriteria?: string[];
  budgetRange?: { min: number; max: number };
  category?: string;
}

interface SmartSuggestionsProps {
  context: SuggestionContext;
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ 
  context, 
  onSuggestionClick, 
  className = "" 
}) => {
  const generateSuggestions = (): Array<{
    text: string;
    type: 'refinement' | 'expansion' | 'alternative' | 'budget';
    icon: React.ReactNode;
    priority: number;
  }> => {
    const suggestions = [];

    // No products found - offer alternatives
    if (!context.hasProducts) {
      suggestions.push({
        text: "Ampliar búsqueda a categorías relacionadas",
        type: 'expansion' as const,
        icon: <Filter className="w-4 h-4" />,
        priority: 1
      });

      if (context.budgetRange) {
        suggestions.push({
          text: `Aumentar presupuesto a $${(context.budgetRange.max * 1.3).toLocaleString()}`,
          type: 'budget' as const,
          icon: <DollarSign className="w-4 h-4" />,
          priority: 2
        });
      }

      suggestions.push({
        text: "Buscar productos en oferta",
        type: 'alternative' as const,
        icon: <Lightbulb className="w-4 h-4" />,
        priority: 3
      });
    }

    // Low confidence with products - suggest refinement
    else if (context.searchConfidence === 'LOW') {
      if (context.missingCriteria?.includes('budget')) {
        suggestions.push({
          text: "Especificar presupuesto para mejores recomendaciones",
          type: 'refinement' as const,
          icon: <DollarSign className="w-4 h-4" />,
          priority: 1
        });
      }

      if (context.missingCriteria?.includes('use_case')) {
        suggestions.push({
          text: "¿Para qué lo vas a usar principalmente?",
          type: 'refinement' as const,
          icon: <Lightbulb className="w-4 h-4" />,
          priority: 2
        });
      }

      suggestions.push({
        text: "Ver opciones con características específicas",
        type: 'refinement' as const,
        icon: <Filter className="w-4 h-4" />,
        priority: 3
      });
    }

    // Medium confidence - offer related searches
    else if (context.searchConfidence === 'MEDIUM') {
      suggestions.push({
        text: "Comparar con marcas premium",
        type: 'expansion' as const,
        icon: <ArrowRight className="w-4 h-4" />,
        priority: 1
      });

      suggestions.push({
        text: "Ver opciones más económicas",
        type: 'budget' as const,
        icon: <DollarSign className="w-4 h-4" />,
        priority: 2
      });

      if (context.category) {
        suggestions.push({
          text: `Explorar accesorios para ${context.category}`,
          type: 'expansion' as const,
          icon: <Filter className="w-4 h-4" />,
          priority: 3
        });
      }
    }

    // High confidence - offer complementary suggestions
    else {
      suggestions.push({
        text: "Buscar productos complementarios",
        type: 'expansion' as const,
        icon: <Lightbulb className="w-4 h-4" />,
        priority: 1
      });

      suggestions.push({
        text: "Comparar especificaciones técnicas",
        type: 'refinement' as const,
        icon: <Filter className="w-4 h-4" />,
        priority: 2
      });

      if (context.productCount > 3) {
        suggestions.push({
          text: "Filtrar por marca preferida",
          type: 'refinement' as const,
          icon: <Filter className="w-4 h-4" />,
          priority: 3
        });
      }
    }

    // Always offer to restart search
    suggestions.push({
      text: "Empezar búsqueda nueva",
      type: 'alternative' as const,
      icon: <RefreshCw className="w-4 h-4" />,
      priority: 9
    });

    return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 4);
  };

  const getSuggestionStyle = (type: string) => {
    const baseStyle = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105";
    
    switch (type) {
      case 'refinement':
        return `${baseStyle} bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30`;
      case 'expansion':
        return `${baseStyle} bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30`;
      case 'budget':
        return `${baseStyle} bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30`;
      case 'alternative':
        return `${baseStyle} bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/30`;
      default:
        return `${baseStyle} bg-white/10 text-white/80 hover:bg-white/20 border border-white/20`;
    }
  };

  const suggestions = generateSuggestions();

  if (suggestions.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-white/70 text-sm">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <span>Sugerencias para mejorar tu búsqueda:</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.text)}
            className={getSuggestionStyle(suggestion.type)}
          >
            {suggestion.icon}
            <span>{suggestion.text}</span>
          </button>
        ))}
      </div>

      {/* Context Information */}
      <div className="text-xs text-white/50 mt-2 text-center">
        {context.hasProducts 
          ? `${context.productCount} producto${context.productCount !== 1 ? 's' : ''} encontrado${context.productCount !== 1 ? 's' : ''} • Confianza: ${context.searchConfidence.toLowerCase()}`
          : 'No se encontraron productos con los criterios actuales'
        }
      </div>
    </div>
  );
};

export default SmartSuggestions;