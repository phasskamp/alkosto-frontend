// src/components/MultimodalProductCard.tsx - Enhanced with next/image and structured features
import React, { useState } from 'react';
import Image from 'next/image';
import { Star, ShoppingCart, Heart, ExternalLink, Package, CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export interface MultimodalProduct {
  id: string;
  title: string;
  price: string;
  type: string;
  brand?: string;
  features?: string | string[]; // Support both string and array
  image?: string;
  rating?: number;
  availability?: boolean;
  
  // Enhanced multimodal context
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  matchReasons?: string[];
  criteriaMatch?: {
    category: boolean;
    budget: boolean;
    features: boolean;
  };
  agentRecommendation?: string;
  alternativeOptions?: boolean;
  
  // Rich media support
  images?: string[];
  videoUrl?: string;
  specifications?: Record<string, string>;
  userReviews?: Array<{
    rating: number;
    comment: string;
    verified: boolean;
  }>;
}

interface MultimodalProductCardProps {
  product: MultimodalProduct;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  showRecommendationBadge?: boolean;
  layout?: 'compact' | 'detailed' | 'grid';
}

const MultimodalProductCard: React.FC<MultimodalProductCardProps> = ({ 
  product, 
  onAddToCart,
  onAddToWishlist,
  onViewDetails,
  showRecommendationBadge = true,
  layout = 'grid'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Process features as structured data
  const processedFeatures = React.useMemo(() => {
    if (!product.features) return [];
    
    if (Array.isArray(product.features)) {
      return product.features;
    }
    
    // Convert string features to bullet points
    return product.features
      .split(/[•\n,]/)
      .map(feature => feature.trim())
      .filter(feature => feature.length > 0 && feature !== '-')
      .slice(0, 6); // Limit to 6 features
  }, [product.features]);

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

  const renderProductImage = () => {
    const images = product.images || (product.image ? [product.image] : []);
    const currentImage = images[currentImageIndex];

    if (!currentImage || imageError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-white/5 border border-white/10 rounded-lg">
          <div className="text-center">
            <Package className="w-8 h-8 text-white/40 mx-auto mb-2" />
            <span className="text-white/50 text-xs">{product.type}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full group">
        <Image
          src={currentImage}
          alt={product.title}
          fill
          className="object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={layout === 'detailed'}
        />
        
        {/* Availability overlay */}
        {product.availability === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <span className="text-white font-semibold">Agotado</span>
          </div>
        )}
        
        {/* Image navigation for multiple images */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-orange-400' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFeatures = () => {
    if (processedFeatures.length === 0) return null;

    const visibleFeatures = isExpanded ? processedFeatures : processedFeatures.slice(0, 3);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-white/70 text-sm font-medium">Características</h4>
          {processedFeatures.length > 3 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-orange-400 text-xs hover:text-orange-300 flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Más
                </>
              )}
            </button>
          )}
        </div>
        
        <ul className="space-y-1">
          {visibleFeatures.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-white/60 text-xs">
              <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderSpecs = () => {
    if (!product.specifications || layout === 'compact') return null;

    const specs = Object.entries(product.specifications).slice(0, 4);

    return (
      <div className="space-y-2">
        <h4 className="text-white/70 text-sm font-medium">Especificaciones</h4>
        <div className="grid grid-cols-1 gap-1">
          {specs.map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-white/50">{key}:</span>
              <span className="text-white/70">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReviews = () => {
    if (!product.userReviews?.length || layout !== 'detailed') return null;

    const averageRating = product.userReviews.reduce((acc, review) => acc + review.rating, 0) / product.userReviews.length;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-white/70 text-sm font-medium">Opiniones</h4>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-white/70 text-xs">{averageRating.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="space-y-1">
          {product.userReviews.slice(0, 2).map((review, index) => (
            <div key={index} className="bg-white/5 rounded p-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-2 h-2 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-white/30'}`}
                    />
                  ))}
                </div>
                {review.verified && (
                  <span className="text-green-400 text-xs">✓ Verificado</span>
                )}
              </div>
              <p className="text-white/60 text-xs line-clamp-2">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Layout-specific rendering
  if (layout === 'compact') {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 hover:bg-white/15 transition-all duration-300 group hover:scale-105">
        <div className="flex gap-3">
          <div className="w-16 h-16 flex-shrink-0">
            {renderProductImage()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-sm line-clamp-1 mb-1">{product.title}</h3>
            <p className="text-orange-400 font-bold text-lg mb-1">{product.price}</p>
            
            <div className="flex items-center justify-between">
              {getConfidenceBadge()}
              
              <button
                onClick={() => onAddToCart?.(product.id)}
                disabled={product.availability === false}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs transition-colors disabled:bg-gray-500/50"
              >
                {product.availability !== false ? 'Comprar' : 'Agotado'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard grid layout (default)
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
      <div className="aspect-video mb-3 relative">
        {renderProductImage()}
      </div>
      
      {/* Product Info */}
      <div className="space-y-3">
        {/* Title */}
        <h3 className="text-white font-semibold line-clamp-2 group-hover:text-orange-300 transition-colors">
          {product.title}
        </h3>
        
        {/* Price and Rating */}
        <div className="flex items-center justify-between">
          <span className="text-orange-400 font-bold text-lg">{product.price}</span>
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-white/70 text-sm">{product.rating}</span>
            </div>
          )}
        </div>

        {/* Confidence Badge */}
        {getConfidenceBadge()}
        
        {/* Brand */}
        {product.brand && (
          <p className="text-white/60 text-sm">
            <span className="text-white/40">Marca:</span> {product.brand}
          </p>
        )}

        {/* Features */}
        {renderFeatures()}

        {/* Specifications (detailed layout only) */}
        {renderSpecs()}

        {/* Reviews (detailed layout only) */}
        {renderReviews()}

        {/* Agent Recommendation */}
        {product.agentRecommendation && (
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-2">
            <p className="text-purple-200 text-xs">
              <span className="font-semibold">🤖 Recomendación:</span> {product.agentRecommendation}
            </p>
          </div>
        )}

        {/* Match Reasons */}
        {product.matchReasons && product.matchReasons.length > 0 && (
          <div>
            <p className="text-white/40 text-xs mb-1">¿Por qué este producto?</p>
            <ul className="text-white/60 text-xs space-y-1">
              {product.matchReasons.slice(0, 2).map((reason, index) => (
                <li key={index} className="flex items-start gap-1">
                  <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Availability Status */}
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
        
        {/* Action Buttons */}
        <div className="flex gap-2">
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
          <div className="text-center">
            <p className="text-white/50 text-xs">
              💡 Hay opciones similares disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultimodalProductCard;