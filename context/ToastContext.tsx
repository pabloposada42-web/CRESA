/**
 * ToastContext.tsx
 * 
 * Este contexto se encarga de gestionar las notificaciones "toast" (mensajes emergentes
 * no intrusivos) en toda la aplicación.
 * 
 * Proporciona una forma centralizada de mostrar mensajes de feedback al usuario,
 * como "Aplauso enviado con éxito" o "Error al cargar datos".
 */
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import Toast from '../components/common/Toast';

// Define la estructura de un objeto de Toast.
type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

// Define la estructura del contexto.
interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

// Creamos el contexto.
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// El componente Proveedor que gestionará el estado de los toasts.
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Función para eliminar un toast por su ID.
  const removeToast = useCallback((id: number) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);

  // Función para añadir un nuevo toast.
  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(currentToasts => [...currentToasts, { id, message, type }]);
  }, []);
  
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Contenedor donde se renderizarán todos los toasts. */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácilmente.
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};