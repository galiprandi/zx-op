import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { UIProvider } from '@/providers/UIProvider';
import { SystemModal } from '@/components/SystemModal';
import { Toaster } from 'sonner';

// Crear una instancia de QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Componente que agrupa todos los providers de la aplicación
 * Centraliza la configuración de providers globales
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <div className="min-h-screen bg-background text-foreground">
          {children}
          
          {/* Componentes globales de UI */}
          <SystemModal />
          <Toaster 
            position="top-right"
            expand={true}
            richColors
            closeButton
          />
        </div>
        
        {/* DevTools - Solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools 
            initialIsOpen={false}
          />
        )}
      </UIProvider>
    </QueryClientProvider>
  );
}
