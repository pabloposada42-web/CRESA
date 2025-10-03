/**
 * Dashboard.tsx
 * 
 * Esta es la página principal que ve un usuario normal después de iniciar sesión.
 * Actúa como un "centro de mando" personal, resumiendo la información más importante
 * y relevante para el usuario de una forma dinámica y atractiva.
 * 
 * Responsabilidades:
 * - Saludar al usuario por su nombre.
 * - Mostrar tarjetas con estadísticas clave animadas.
 * - Mostrar la pirámide de niveles del usuario.
 * - Mostrar la tabla de líderes (Leaderboard).
 * - Presentar una "llamada a la acción" visualmente atractiva para dar aplausos.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LevelPyramid from '../components/user/LevelPyramid';
import Leaderboard from '../components/user/Leaderboard';
import { Award, Send, Sparkles } from 'lucide-react';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { SHAREPOINT_FORM_URL } from '../config';
import { POINTS_PER_APPLAUSE } from '../constants'; // Importar la constante de puntos
import { calculateGrossPoints } from '../utils/levelUtils';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { users, applause } = useData();
  
  if (!user) return null;

  const receivedApplause = applause.filter(a => a.receptor_id === user.usuario_id);
  const grossPoints = calculateGrossPoints(receivedApplause.length, user.puntos_anteriores);
  const givenApplause = applause.filter(a => a.otorgante_id === user.usuario_id);

  // Usamos el hook de contador animado para las estadísticas, mostrando el valor en millas (puntos).
  const animatedReceived = useAnimatedCounter(receivedApplause.length * POINTS_PER_APPLAUSE, 1500);
  const animatedGiven = useAnimatedCounter(givenApplause.length * POINTS_PER_APPLAUSE, 1500);
  
  // Función para abrir el formulario en una nueva pestaña.
  const handleGiveApplauseClick = () => {
    window.open(SHAREPOINT_FORM_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          ¡Hola, {user.nombre.split(' ')[0]}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 animate-slide-up">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-secondary-100 dark:bg-secondary-900/50 rounded-full">
                <Award className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Millas Extra Recibidas</p>
                <p className="text-3xl font-bold">{animatedReceived}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-full">
                <Send className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Millas Extra Otorgadas</p>
                <p className="text-3xl font-bold">{animatedGiven}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <LevelPyramid totalPoints={grossPoints} />
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Leaderboard users={users} applause={applause} currentUser={user} />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          {user.rol === 'otorgador' || user.rol === 'admin' ? (
            <Card className="p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white flex flex-col items-center text-center">
              <Sparkles className="h-12 w-12 text-yellow-300" />
              <h2 className="text-2xl font-bold mt-4">Reconoce a un Colega</h2>
              <p className="mt-2 mb-6 text-primary-200">El reconocimiento impulsa la grandeza. ¿Alguien hizo un trabajo excepcional? ¡Házselo saber!</p>
              <Button
                onClick={handleGiveApplauseClick}
                variant="secondary"
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" /> Dar una Milla Extra
              </Button>
            </Card>
          ) : (
            <Card className="p-6 bg-gradient-to-br from-secondary-600 to-secondary-800 text-white">
              <h2 className="text-xl font-bold">¡Sigue así!</h2>
              <p className="mt-2">Tu trabajo está siendo notado. ¡Sigue esforzándote para ganar más reconocimientos y subir de nivel!</p>
            </Card>
          )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;