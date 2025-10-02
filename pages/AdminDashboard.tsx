/**
 * AdminDashboard.tsx
 * 
 * Esta página es el panel de control exclusivo para los administradores.
 * Proporciona una vista de "alto nivel" de la actividad en toda la plataforma,
 * así como herramientas para gestionar los datos de una forma dinámica y moderna.
 */

import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import Card from '../components/common/Card';
import DataTable from '../components/admin/DataTable';
import PrinciplesChart from '../components/admin/PrinciplesChart';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter'; // Importamos el hook de animación.
import { Users, Award, Gift } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { users, applause, redemptions } = useData();
  
  // Usamos el hook de contador animado para las estadísticas clave.
  const activeUsersCount = useAnimatedCounter(users.filter(u => u.estado === 'activo').length);
  const totalApplauseCount = useAnimatedCounter(applause.length);
  const totalRedemptionsCount = useAnimatedCounter(redemptions.length);


  const topRecognized = useMemo(() => {
    const counts: { [key: string]: number } = {};
    applause.forEach(a => {
      counts[a.receptor_id] = (counts[a.receptor_id] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({
        user: users.find(u => u.usuario_id === id),
        count
      }));
  }, [users, applause]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard de Administrador</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full"><Users className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Usuarios Activos</p>
                    <p className="text-3xl font-bold">{activeUsersCount}</p>
                </div>
            </div>
        </Card>
        <Card className="p-6">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-full"><Award className="h-6 w-6 text-primary-600 dark:text-primary-400" /></div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Aplausos</p>
                    <p className="text-3xl font-bold">{totalApplauseCount}</p>
                </div>
            </div>
        </Card>
        <Card className="p-6">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full"><Gift className="h-6 w-6 text-green-600 dark:text-green-400" /></div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Canjes</p>
                    <p className="text-3xl font-bold">{totalRedemptionsCount}</p>
                </div>
            </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
            <h3 className="text-xl font-bold mb-4">Principios Reconocidos</h3>
            <PrinciplesChart applause={applause} />
        </Card>
        <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Top 5 Reconocidos</h3>
            <ul className="space-y-3">
                {topRecognized.map(({user, count}) => (
                    <li key={user?.usuario_id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="font-medium">{user?.nombre || 'Desconocido'}</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">{count} aplausos</span>
                    </li>
                ))}
            </ul>
        </Card>
      </div>

      <Card className="p-6">
        <DataTable data={users} title="Gestión de Usuarios" filename="usuarios" />
      </Card>
      <Card className="p-6">
        <DataTable data={applause} title="Gestión de Aplausos" filename="aplausos" />
      </Card>
      <Card className="p-6">
        <DataTable data={redemptions} title="Gestión de Canjes" filename="canjes" />
      </Card>

    </div>
  );
};

export default AdminDashboard;