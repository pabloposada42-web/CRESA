/**
 * ConfirmationModal.tsx
 * 
 * Un modal genérico para solicitar confirmación del usuario antes de
 * realizar una acción importante (ej. "¿Estás seguro de que quieres canjear?").
 */
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {children}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <Button
          type="button"
          variant="primary"
          onClick={onConfirm}
          className="w-full inline-flex justify-center sm:ml-3 sm:w-auto sm:text-sm bg-red-600 hover:bg-red-700 focus:ring-red-500"
        >
          Confirmar
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="mt-3 w-full inline-flex justify-center sm:mt-0 sm:w-auto sm:text-sm"
        >
          Cancelar
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;