import { ReactNode, createContext, useContext, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { SystemSetting } from '@/api/systemSettings';
import { useSystemSettings } from '@/hooks/useSystemSettingsQuery';

// Types
export interface ModalConfig {
  isOpen: boolean;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
  details?: React.ReactNode;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export interface UIState {
  // Modal state
  modal: ModalConfig;
  
  // System settings
  systemSettings: SystemSetting | null;
  isLoadingSettings: boolean;
  
  // Global loading state
  isLoading: boolean;
  
  // Theme state (for future use)
  theme: 'dark' | 'light';
}

export interface UIContextType extends UIState {
  // Modal actions
  showModal: (config: Omit<ModalConfig, 'isOpen'>) => void;
  hideModal: () => void;
  
  // Modal helpers
  modalHelpers: {
    success: (title: string, message?: string, options?: { autoClose?: boolean; details?: React.ReactNode }) => void;
    error: (title: string, message?: string, options?: { autoClose?: boolean; details?: React.ReactNode }) => void;
    info: (title: string, message?: string, options?: { autoClose?: boolean; details?: React.ReactNode }) => void;
    confirm: (title: string, message?: string, onConfirm?: () => void, onCancel?: () => void) => void;
  };
  
  // Toast actions (wrappers around sonner)
  showSuccess: (message: string, options?: { duration?: number }) => void;
  showError: (message: string, options?: { duration?: number }) => void;
  showInfo: (message: string, options?: { duration?: number }) => void;
  showWarning: (message: string, options?: { duration?: number }) => void;
  
  // Toast helpers
  toastHelpers: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
  
  // Operations helpers
  operations: {
    saved: (entity: string) => void;
    saveError: (entity: string, error?: string) => void;
    success: (operation: string) => void;
    error: (operation: string, error?: string) => void;
    confirmDelete: (entity: string, onConfirm: () => void) => void;
  };
  
  // Settings actions
  updateSystemSettings: (settings: SystemSetting) => void;
  refreshSettings: () => Promise<void>;
  
  // Loading actions
  setLoading: (loading: boolean) => void;
  
  // Theme actions
  toggleTheme: () => void;
}

// Create context
const UIContext = createContext<UIContextType | undefined>(undefined);

// Provider component
export function UIProvider({ children }: { children: ReactNode }) {
  // Usar React Query para system settings
  const { 
    settings: systemSettings, 
    isLoading: isLoadingSettings, 
    updateMultipleSettings,
    refetch: refreshSettings
  } = useSystemSettings();

  // Estado local para modal y loading global
  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    title: '',
    type: 'info',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Modal actions
  const showModal = useCallback((config: Omit<ModalConfig, 'isOpen'>) => {
    setModal({
      ...config,
      isOpen: true,
    });
  }, []);

  const hideModal = useCallback(() => {
    setModal(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Toast actions (wrappers around sonner)
  const showSuccess = useCallback((message: string, options?: { duration?: number }) => {
    toast.success(message, { duration: options?.duration || 4000 });
  }, []);

  const showError = useCallback((message: string, options?: { duration?: number }) => {
    toast.error(message, { duration: options?.duration || 6000 });
  }, []);

  const showInfo = useCallback((message: string, options?: { duration?: number }) => {
    toast.info(message, { duration: options?.duration || 4000 });
  }, []);

  const showWarning = useCallback((message: string, options?: { duration?: number }) => {
    toast.warning(message, { duration: options?.duration || 5000 });
  }, []);

  // Loading actions
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Settings actions
  const updateSystemSettings = useCallback(async (settings: SystemSetting) => {
    try {
      setLoading(true);
      await updateMultipleSettings(settings);
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Error al actualizar configuración del sistema');
    } finally {
      setLoading(false);
    }
  }, [updateMultipleSettings, setLoading]);

  // Theme actions
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  // Modal helpers
  const modalHelpers = useMemo(() => ({
    success: (title: string, message?: string, options?: { autoClose?: boolean; details?: React.ReactNode }) => {
      showModal({
        type: 'success',
        title,
        message,
        autoClose: options?.autoClose ?? true,
        autoCloseDelay: 3000,
        details: options?.details,
      });
    },

    error: (title: string, message?: string, options?: { autoClose?: boolean; details?: React.ReactNode }) => {
      showModal({
        type: 'error',
        title,
        message,
        autoClose: options?.autoClose ?? false,
        details: options?.details,
      });
    },

    info: (title: string, message?: string, options?: { autoClose?: boolean; details?: React.ReactNode }) => {
      showModal({
        type: 'info',
        title,
        message,
        autoClose: options?.autoClose ?? false,
        details: options?.details,
      });
    },

    confirm: (title: string, message?: string, onConfirm?: () => void, onCancel?: () => void) => {
      showModal({
        type: 'info',
        title,
        message,
        details: (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                onConfirm?.();
                hideModal();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirmar
            </button>
            <button
              onClick={() => {
                onCancel?.();
                hideModal();
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        ),
        autoClose: false,
      });
    },
  }), [showModal, hideModal]);

  // Toast helpers
  const toastHelpers = useMemo(() => ({
    success: (message: string) => {
      showSuccess(message);
    },
    
    error: (message: string) => {
      showError(message);
    },
    
    info: (message: string) => {
      showInfo(message);
    },
    
    warning: (message: string) => {
      showWarning(message);
    },
  }), [showSuccess, showError, showInfo, showWarning]);

  // Operations helpers
  const operations = useMemo(() => ({
    saved: (entity: string) => {
      showSuccess(`${entity} guardado correctamente`);
    },
    
    saveError: (entity: string, error?: string) => {
      showError(`Error al guardar ${entity}${error ? ': ' + error : ''}`);
    },
    
    success: (operation: string) => {
      showSuccess(`${operation} completada`);
    },
    
    error: (operation: string, error?: string) => {
      showError(`Error en ${operation}${error ? ': ' + error : ''}`);
    },
    
    confirmDelete: (entity: string, onConfirm: () => void) => {
      modalHelpers.confirm(
        `Eliminar ${entity}`,
        `¿Estás seguro de que quieres eliminar este ${entity}? Esta acción no se puede deshacer.`,
        onConfirm
      );
    },
  }), [showSuccess, showError, modalHelpers]);

  const contextValue: UIContextType = {
    // Estado
    modal,
    systemSettings,
    isLoadingSettings,
    isLoading,
    theme,
    
    // Acciones
    showModal,
    hideModal,
    modalHelpers,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    toastHelpers,
    operations,
    updateSystemSettings,
    refreshSettings,
    setLoading,
    toggleTheme,
  };

  return (
    <UIContext.Provider value={contextValue}>
      {children}
    </UIContext.Provider>
  );
}

// Hook to use the UI context
export function useUi() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUi must be used within a UIProvider');
  }
  return context;
}

// Export types for external use
export type { SystemSetting };
