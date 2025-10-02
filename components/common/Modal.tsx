/**
 * Modal.tsx
 * 
 * Componente de modal genérico y reutilizable.
 * Se encarga de la lógica de superposición, centrado y cierre.
 * Es accesible y se puede cerrar con la tecla 'Escape' o haciendo clic fuera.
 */
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Este 'useEffect' añade un listener para la tecla 'Escape' cuando el modal se muestra.
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
        window.addEventListener('keydown', handleEsc);
    }
    // Limpiamos el evento al desmontar o cuando el modal se cierra.
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Si 'isOpen' es falso, el modal no se renderiza en absoluto.
  if (!isOpen) {
    return null;
  }

  return (
    // Contenedor principal del modal que ocupa toda la pantalla (el fondo oscuro).
    // Al hacer clic aquí, se cierra el modal.
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* El contenido del modal en sí (la caja blanca). */}
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative animate-slide-up"
        onClick={e => e.stopPropagation()} // Evita que el clic DENTRO del modal lo cierre.
      >
        {/* Cabecera del modal con título y botón de cierre. */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>
        {/* El cuerpo del modal, donde se inyecta el contenido (children). */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;