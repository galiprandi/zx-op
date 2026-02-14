import { useLocation } from "react-router-dom";
import { useEffect } from "react";

// Mapa de rutas a títulos
const routeTitles: Record<string, string> = {
  "/": "ZX: Operación",
  "/checkin": "ZX: Check-in", 
  "/monitor": "ZX: Monitor",
  "/products": "ZX: Productos",
  "/accesos": "ZX: Accesos",
};

export function usePageTitle() {
  const location = useLocation();

  useEffect(() => {
    const title = routeTitles[location.pathname] || "ZX: Zona Xtreme";
    document.title = title;
  }, [location.pathname]);

  // Retornar el título actual para uso en UI si es necesario
  return routeTitles[location.pathname] || "ZX: Zona Xtreme";
}
