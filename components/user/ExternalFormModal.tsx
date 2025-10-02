/**
 * ExternalFormModal.tsx
 * 
 * Este modal está diseñado para embeber contenido externo, como un formulario de SharePoint,
 * dentro de la aplicación usando un <iframe>.
 * Proporciona una experiencia de usuario más integrada y fluida.
 * Incluye un enlace de respaldo en caso de que las políticas de seguridad del sitio externo
 * impidan que se muestre correctamente.
 */
import React from 'react';
import Modal from '../common/Modal';
import { ExternalLink } from 'lucide-react';

interface ExternalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const ExternalFormModal: React.FC<ExternalFormModalProps> = ({ isOpen, onClose, url, title }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="aspect-w-9 aspect-h-16 h-[70vh] bg-gray-100 dark:bg-gray-900 rounded-md">
          <iframe
            src={url}
            className="w-full h-full border-0 rounded-md"
            title={title}
          >
            Cargando formulario...
          </iframe>
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
          <p>
            Si el formulario no se carga correctamente, puedes acceder directamente.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline mt-1 font-semibold"
          >
            <ExternalLink size={12} className="mr-1" />
            Abrir en una nueva pestaña
          </a>
        </div>
      </div>
    </Modal>
  );
};

export default ExternalFormModal;