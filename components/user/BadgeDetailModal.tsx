/**
 * BadgeDetailModal.tsx
 * 
 * Este modal muestra los detalles de una insignia que el usuario ha ganado.
 * Proporciona información ampliada y una opción para compartir el logro
 * en redes sociales como LinkedIn.
 */
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import Modal from '../common/Modal';
import Button from '../common/Button';
import BadgeCertificate from './BadgeCertificate'; // Importamos el nuevo componente de certificado.
import type { EarnedBadge } from '../../types';
import { Award, Linkedin } from 'lucide-react';

interface BadgeDetailModalProps {
  badge: EarnedBadge;
  onClose: () => void;
  userName: string;
}

const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({ badge, onClose, userName }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    setIsGenerating(true);
    
    // 1. Generar y descargar la imagen del certificado.
    const certificateElement = certificateRef.current;
    if (certificateElement) {
        try {
            const canvas = await html2canvas(certificateElement, { scale: 2 });
            const imageUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `Certificado-${badge.name.replace(/\s+/g, '_')}.png`;
            link.click();
        } catch (error) {
            console.error("Error al generar la imagen:", error);
        }
    }
    
    // 2. Abrir la ventana de compartir de LinkedIn.
    const shareText = `¡Estoy emocionado de compartir que he ganado la insignia "${badge.name}" en nuestra plataforma de reconocimiento interno de CRESA! Este logro representa mi compromiso con el principio de "${badge.principle}". #GPTW #Reconocimiento #CRESA #CulturaDeEmpresa`;
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    
    setIsGenerating(false);
  };

  return (
    <>
      {/* El certificado se renderiza fuera de la pantalla para ser capturado por html2canvas */}
      <BadgeCertificate ref={certificateRef} badge={badge} userName={userName} />
      
      <Modal isOpen={true} onClose={onClose} title={badge.name}>
        <div className="text-center">
          <div className="mx-auto mb-4 inline-block p-4 bg-secondary-100 dark:bg-secondary-900/50 rounded-full">
            <Award className="h-20 w-20 text-secondary-500" />
          </div>
          <h3 className="text-2xl font-bold">{badge.name}</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{badge.description}</p>
          {badge.earnedDate && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
              Ganada el: {new Date(badge.earnedDate).toLocaleDateString()}
            </p>
          )}
          <div className="mt-6">
            <Button onClick={handleShare} className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generando Certificado...
                </>
              ) : (
                <>
                  <Linkedin className="mr-2 h-4 w-4" />
                  Compartir en LinkedIn
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 mt-2">Se descargará una imagen para que la adjuntes a tu publicación.</p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default BadgeDetailModal;