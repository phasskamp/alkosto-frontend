import React from 'react';
import { Sparkles, Smartphone, Laptop, Gamepad2 } from 'lucide-react';

interface LandingScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onSuggestionClick }) => {
  const suggestions = [
    {
      title: "Portátil para Trabajo",
      subtitle: "Encuentra el equipo perfecto para tu productividad",
      icon: <Laptop className="w-6 h-6" />,
      query: "Necesito un portátil para trabajo, algo potente pero que no sea muy costoso"
    },
    {
      title: "Celular Gama Media", 
      subtitle: "Explora opciones con la mejor relación precio-calidad",
      icon: <Smartphone className="w-6 h-6" />,
      query: "Busco un celular de gama media con buena cámara y batería"
    },
    {
      title: "Gaming Setup",
      subtitle: "Arma tu estación de juegos ideal", 
      icon: <Gamepad2 className="w-6 h-6" />,
      query: "Ayúdame a armar un setup gamer completo"
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Alkosto AI</h1>
        </div>
        <p className="text-xl text-white/90 mb-2">¡Hola! Soy tu asistente de tecnología</p>
        <p className="text-white/70">¿En qué te puedo ayudar hoy?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.query)}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-left hover:bg-white/20 transition-all duration-300 hover:scale-105 group"
          >
            <div className="flex items-start gap-4">
              <div className="text-orange-400 group-hover:text-orange-300 transition-colors">
                {suggestion.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">{suggestion.title}</h3>
                <p className="text-white/70 text-sm">{suggestion.subtitle}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LandingScreen;
