// src/components/EnhancedProductCard.tsx
import React, { useState } from 'react';
import { Star, ShoppingCart, Heart, ExternalLink, Package, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface EnhancedProduct {
  id: string;
  title: string;
  price: string;
  type: string;
  brand?: string;
  features?: string;
  image?: string;
  rating?: number;
  availability?: boolean;
  
  // Enhanced context from Agent
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  matchReasons?: string[];
  criteriaMatch?: {
    category: boolean;
    budget: boolean;
    features: boolean;
  };
  agentRecommendation?: string;
  alternativeOptions?: boolean;
}

interface EnhancedProductCardProps {
  product: EnhancedProduct;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  showRecommendationBadge?: boolean;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({ 
  product, 
  onAddToCart,
  onAddToWishlist,
  onViewDetails,
  showRecommendationBadge = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getConfidenceBadge = () => {
    if (!product.confidence) return null;

    const badgeConfig = {
      HIGH: { color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: CheckCircle, text: 'Alta confianza' },
      MEDIUM: { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', icon: Info, text: 'Media confianza' },
      LOW: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: AlertCircle, text: 'Baja confianza' }
    };

    const config = badgeConfig[product.confidence];
    const IconComponent = config.icon;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        <span>{config.text}</span>
      </div>
    );
  };

  const getCriteriaMatches = () => {
    if (!product.criteriaMatch) return null;

    const matches = Object.entries(product.criteriaMatch)
      .filter(([_, matched]) => matched)
      .map(([criteria, _]) => {
        const labels = {
          category: 'Categoría',
          budget: 'Presupuesto',
          features: 'Características'
        };
        return labels[criteria as keyof typeof labels];
      });

    if (matches.length === 0) return null;

    return (
      <div className="text-xs text-white/60">
        <span className="text-white/40">Coincide con:</span> {matches.join(', ')}
      </div>
    );
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300 group hover:scale-105 relative">
      {/* Recommendation Badge */}
      {showRecommendationBadge && product.confidence === 'HIGH' && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Recomendado
          </div>
        </div>
      )}

      {/* Product Image */}
      <div className="aspect-video bg-white/5 rounded-lg mb-3 flex items-center justify-center border border-white/10 relative overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-center">
            <Package className="w-8 h-8 text-white/40 mx-auto mb-2" />
            <span className="text-white/50 text-xs">{product.type}</span>
          </div>
        )}
        
        {/* Availability overlay */}
        {product.availability === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Agotado</span>
          </div>
        )}
      </div>
      
      {/* Product Title */}
      <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-orange-300 transition-colors">
        {product.title}
      </h3>
      
      {/* Price and Rating */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-orange-400 font-bold text-lg">{product.price}</span>
        {product.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-white/70 text-sm">{product.rating}</span>
          </div>
        )}
      </div>

      {/* Confidence Badge */}
      <div className="mb-2">
        {getConfidenceBadge()}
      </div>
      
      {/* Brand */}
      {product.brand && (
        <p className="text-white/60 text-sm mb-2">
          <span className="text-white/40">Marca:</span> {product.brand}
        </p>
      )}

      {/* Criteria Matches */}
      {getCriteriaMatches()}
      
      {/* Features */}
      {product.features && (
        <div className="mb-3">
          <p className={`text-white/50 text-xs ${isExpanded ? '' : 'line-clamp-2'}`}>
            {product.features}
          </p>
          {product.features.length > 100 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-orange-400 text-xs hover:text-orange-300 mt-1"
            >
              {isExpanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
      )}

      {/* Agent Recommendation */}
      {product.agentRecommendation && (
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-2 mb-3">
          <p className="text-purple-200 text-xs">
            <span className="font-semibold">🤖 Recomendación:</span> {product.agentRecommendation}
          </p>
        </div>
      )}

      {/* Match Reasons */}
      {product.matchReasons && product.matchReasons.length > 0 && (
        <div className="mb-3">
          <p className="text-white/40 text-xs mb-1">¿Por qué este producto?</p>
          <ul className="text-white/60 text-xs space-y-1">
            {product.matchReasons.slice(0, 3).map((reason, index) => (
              <li key={index} className="flex items-start gap-1">
                <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Availability Status */}
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
      
      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <button 
          onClick={() => onAddToCart?.(product.id)}
          className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium ${
            product.availability !== false
              ? 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-105'
              : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
          }`}
          disabled={product.availability === false}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{product.availability !== false ? 'Comprar' : 'Agotado'}</span>
        </button>
        
        <button 
          onClick={() => onAddToWishlist?.(product.id)}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
          title="Agregar a favoritos"
        >
          <Heart className="w-4 h-4" />
        </button>
        
        <button 
          onClick={() => onViewDetails?.(product.id)}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105"
          title="Ver detalles"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
      
      {/* Alternative Options Hint */}
      {product.alternativeOptions && (
        <div className="mt-2 text-center">
          <p className="text-white/50 text-xs">
            💡 Hay opciones similares disponibles
          </p>
        </div>
      )}
      
      {/* Product ID for debugging */}
      <p className="text-white/30 text-xs mt-2 text-center">
        ID: {product.id}
      </p>
    </div>
  );
};

export default EnhancedProductCard;