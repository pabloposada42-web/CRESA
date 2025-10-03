/**
 * Marketplace.tsx
 * 
 * Esta página muestra el "Mercado de Recompensas", un catálogo donde los usuarios
 * pueden ver todos los premios disponibles y canjearlos si tienen el nivel suficiente.
 * El flujo de canje es ahora una experiencia completa con confirmación y generación de PDF.
 */
import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import RewardCard from '../components/user/RewardCard';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { getUserLevel, calculateGrossPoints, calculateNetPoints } from '../../utils/levelUtils';
import type { Reward } from '../types';

const Marketplace: React.FC = () => {
  const { user } = useAuth();
  const { rewards, applause, redemptions, addRedemption } = useData();
  const { addToast } = useToast();
  
  const [levelFilter, setLevelFilter] = useState('all');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  if (!user) return null;

  const receivedApplauseCount = applause.filter(a => a.receptor_id === user.usuario_id).length;
  
  // Lógica de Puntos Netos y Nivel
  const userRedemptions = useMemo(() => redemptions.filter(r => r.usuario_id === user.usuario_id), [redemptions, user.usuario_id]);
  const grossPoints = calculateGrossPoints(receivedApplauseCount, user.puntos_anteriores);
  const userLevel = getUserLevel(grossPoints);
  const netPoints = calculateNetPoints(grossPoints, userRedemptions, rewards);
  
  // Lógica de inventario: Calculamos el stock disponible para cada recompensa.
  const rewardsWithStock = useMemo(() => {
    // Filtramos para contar solo los canjes que no han sido rechazados.
    const activeRedemptions = redemptions.filter(
      r => r.estado?.toLowerCase().trim() !== 'rechazado'
    );
    
    const redemptionCounts = activeRedemptions.reduce((acc, redemption) => {
      const key = redemption.recompensa_id; 
      if (key) {
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return rewards.map(reward => {
      const key = reward.recompensa_id;
      const redeemedCount = key ? redemptionCounts[key] || 0 : 0;
      const initialStock = parseInt(reward.stock) || 0;
      const availableStock = Math.max(0, initialStock - redeemedCount);
      return { ...reward, availableStock };
    });
  }, [rewards, redemptions]);
  
  const handleRedeemClick = (reward: Reward) => {
    // Verificación de Puntos
    const cost = parseInt(reward.puntos_costo, 10) || 0;
    if (netPoints < cost) {
      addToast("No tienes suficientes puntos para esta recompensa.", "error");
      return;
    }

    const rewardInfo = rewardsWithStock.find(r => r.recompensa_id === reward.recompensa_id);
    if (!rewardInfo || rewardInfo.availableStock <= 0) {
      addToast("Esta recompensa está agotada.", "error");
      return;
    }
    setSelectedReward(reward);
    setIsConfirmModalOpen(true);
  };
  
  const generatePDF = (reward: Reward, currentUserPoints: number) => {
    const doc = new jsPDF();
    const redemptionCode = `CANJE-${user.usuario_id.slice(-4)}-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Cupón de Canje - Milla Extra CRESA", 105, 25, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`¡Felicidades, ${user.nombre}!`, 20, 60);
    doc.text(`Has solicitado el canje de la siguiente recompensa:`, 20, 70);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(reward.nombre, 20, 85);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha y hora de solicitud: ${now.toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' })}`, 20, 100);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Resumen de Puntos:", 20, 115);
    doc.setFont('helvetica', 'normal');
    const cost = parseInt(reward.puntos_costo, 10) || 0;
    doc.text(`- Puntos antes del canje: ${currentUserPoints}`, 25, 122);
    doc.text(`- Costo de la recompensa: -${cost} puntos`, 25, 129);
    doc.text(`- Puntos restantes: ${currentUserPoints - cost}`, 25, 136);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Código de Canje:", 20, 150);
    doc.setFillColor(238, 242, 255);
    doc.rect(20, 155, 80, 10, 'F');
    doc.setFont('courier', 'bold');
    doc.text(redemptionCode, 22, 162);
    
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 180, 190, 180);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("Instrucciones y Condiciones Importantes:", 20, 190);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    const instructions = "El colaborador debe acercarse a Trabajo Social con este documento para iniciar el proceso. Los puntos indicados se restarán de tu total posterior a la aceptación del departamento de Trabajo Social. La entrega de los obsequios se basa en el inventario existente.";
    doc.text(instructions, 20, 197, { maxWidth: 170, lineHeightFactor: 1.5 });

    doc.save(`cupon-cresa-${reward.nombre.replace(/\s+/g, '-')}.pdf`);
  };

  const confirmRedemption = () => {
    if (!selectedReward || !user) return;
    
    const rewardInfo = rewardsWithStock.find(r => r.recompensa_id === selectedReward.recompensa_id);
    const cost = parseInt(selectedReward.puntos_costo, 10) || 0;

    if (!rewardInfo || rewardInfo.availableStock <= 0) {
      addToast("Lo sentimos, esta recompensa se agotó mientras confirmabas.", 'error');
      setIsConfirmModalOpen(false);
      setSelectedReward(null);
      return;
    }
    if (netPoints < cost) {
      addToast("Tus puntos han cambiado y ya no son suficientes para esta recompensa.", 'error');
      setIsConfirmModalOpen(false);
      setSelectedReward(null);
      return;
    }
    
    generatePDF(selectedReward, netPoints);
    
    addRedemption({
      usuario_id: user.usuario_id,
      recompensa_id: selectedReward.recompensa_id,
      puntos_requeridos: selectedReward.puntos_costo,
    });
    
    addToast(`¡"${selectedReward.nombre}" canjeado con éxito!`, 'success');
    setIsConfirmModalOpen(false);
    setSelectedReward(null);
  };

  const filteredRewards = useMemo(() => {
    if (levelFilter === 'all') return rewardsWithStock;
    return rewardsWithStock.filter(r => r.nivel_requerido === levelFilter);
  }, [rewardsWithStock, levelFilter]);

  const availableLevels = useMemo(() => {
    // FIX: Use Array.from for better type inference to resolve 'unknown' type error in sort comparison. Also, add radix to parseInt.
    // FIX: Explicitly cast sort parameters to string to handle 'unknown' type inference issue.
    return Array.from(new Set(rewards.map(r => r.nivel_requerido))).sort((a,b) => parseInt(String(a), 10) - parseInt(String(b), 10));
  }, [rewards]);

  return (
    <>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">Marketplace de Recompensas</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Canjea tus logros por premios increíbles.</p>
          <div className="mt-2 font-semibold text-primary-600 dark:text-primary-400 flex justify-center items-center flex-wrap gap-x-4">
            <span>Tu Nivel: {userLevel.level} ({userLevel.name})</span>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
            <span>Puntos Disponibles: {netPoints}</span>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex space-x-2 p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <button onClick={() => setLevelFilter('all')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${levelFilter === 'all' ? 'bg-white dark:bg-gray-900 shadow text-primary-600' : 'text-gray-600 dark:text-gray-300'}`}>Todos</button>
            {availableLevels.map(level => (
              <button key={level} onClick={() => setLevelFilter(level)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${levelFilter === level ? 'bg-white dark:bg-gray-900 shadow text-primary-600' : 'text-gray-600 dark:text-gray-300'}`}>Nivel {level}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRewards.map((reward, index) => (
            <div key={reward.recompensa_id} className="animate-slide-up" style={{animationDelay: `${index*100}ms`}}>
              <RewardCard 
                reward={reward} 
                userLevel={userLevel.level} 
                userPoints={netPoints}
                onRedeem={handleRedeemClick}
                availableStock={reward.availableStock}
              />
            </div>
          ))}
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmRedemption}
        title="Confirmar Canje"
      >
        <p>¿Estás seguro de que quieres canjear la recompensa <strong className="text-primary-600 dark:text-primary-400">{selectedReward?.nombre}</strong> por <strong className="text-primary-600 dark:text-primary-400">{selectedReward?.puntos_costo} puntos</strong>? Esta acción no se puede deshacer.</p>
      </ConfirmationModal>
    </>
  );
};

export default Marketplace;