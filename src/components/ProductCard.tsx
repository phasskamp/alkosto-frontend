import React from 'react';
import { Star, ShoppingCart, Heart, ExternalLink, Package } from 'lucide-react';

interface Product {
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

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all duration-300 group hover:scale-105">
      {/* Product Image Placeholder */}
      <div className="aspect-video bg-white/5 rounded-lg mb-3 flex items-center justify-center border border-white/10">
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
      
      {/* Brand */}
      {product.brand && (
        <p className="text-white/60 text-sm mb-2">
          <span className="text-white/40">Marca:</span> {product.brand}
        </p>
      )}
      
      {/* Features */}
      {product.features && (
        <p className="text-white/50 text-xs mb-3 line-clamp-2">
          {product.features}
        </p>
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
          className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-all