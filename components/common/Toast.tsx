/**
 * Toast.tsx
 * 
 * Este componente renderiza una notificación "toast" individual.
 * Es responsable de su apariencia, iconos y la animación de entrada/salida.
 */
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

const toastConfig = {
  success: {
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    style: 'bg-green-50 dark:bg-green-900/50 border-green-400 dark:border-green-600',
  },
  error: {
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    style: 'bg-red-50 dark:bg-red-900/50 border-red-400 dark:border-red-600',
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-500" />,
    style: 'bg-blue-50 dark:bg-blue-900/50 border-blue-400 dark:border-blue-600',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Inicia el temporizador para cerrar el toast automáticamente.
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 5000); // El toast dura 5 segundos.

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isExiting) {
      // Espera a que la animación de salida termine antes de llamar a onDismiss.
      const timer = setTimeout(onDismiss, 300); // Coincide con la duración de la animación.
      return () => clearTimeout(timer);
    }
  }, [isExiting, onDismiss]);

  const config = toastConfig[type];

  return (
    <div
      className={`max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${config.style} ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}`}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {config.icon}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => setIsExiting(true)}
              className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">Cerrar</span>
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;