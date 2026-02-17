import { useUi } from "@/providers/UIProvider";
import { useState } from "react";

interface SiteBrandProps {
  variant?: 'full' | 'compact' | 'logo-only';
  className?: string;
  showDebug?: boolean; // Para debugging
}

export function SiteBrand({ variant = 'full', className = '', showDebug = false }: SiteBrandProps) {
  const { systemSettings, isLoadingSettings } = useUi();
  const [imageError, setImageError] = useState(false);

  if (isLoadingSettings) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  const siteName = systemSettings?.siteName || 'Zona Xtreme';
  const logoUrl = systemSettings?.logoUrl;

  const renderLogo = () => {
    if (logoUrl && !imageError) {
      return (
        <div className="relative">
          <img 
            src={logoUrl} 
            alt={siteName}
            className="h-8 w-auto object-contain"
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
          {showDebug && imageError && (
            <div className="absolute -top-2 -right-2 w-2 h-2 bg-red-500 rounded-full" title="Error loading image"/>
          )}
        </div>
      );
    }
    
    // Default logo (text-based) - usa iniciales del nombre del sitio
    const initials = siteName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'ZX';
    
    return (
      <div className="h-8 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg px-3 rounded">
        {initials}
      </div>
    );
  };

  const renderContent = () => {
    switch (variant) {
      case 'logo-only':
        return renderLogo();
      
      case 'compact':
        return (
          <div className="flex items-center gap-2">
            {renderLogo()}
            <span className="font-semibold text-lg">{siteName}</span>
          </div>
        );
      
      case 'full':
      default:
        return (
          <div className="flex flex-col items-center gap-2">
            {renderLogo()}
            <div className="text-center">
              <h1 className="font-bold text-xl">{siteName}</h1>
              <p className="text-sm text-muted-foreground">Sistema de Operación</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {renderContent()}
    </div>
  );
}
