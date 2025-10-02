/**
 * DataContext.tsx
 * 
 * Este archivo crea un "Contenedor Global de Datos" para toda la aplicación usando React Context.
 * 
 * ¿Qué es un Contexto?
 * Imagina que tienes una información importante (como la lista de todos los usuarios) que
 * muchos componentes en diferentes partes de la aplicación necesitan. En lugar de pasar esa
 * información de componente en componente (lo cual es muy tedioso), la colocamos en este
 * "contenedor global" (el Contexto).
 * 
 * Así, cualquier componente que necesite los datos, sin importar dónde esté, simplemente
 * puede "pedirlos" a este contenedor.
 * 
 * Este DataProvider se encarga de:
 * 1.  Llamar al `googleSheetsService` para cargar todos los datos al iniciar la app.
 * 2.  Guardar esos datos (usuarios, aplausos, etc.).
 * 3.  Informar a toda la app si los datos todavía se están cargando (`loading`) o si hubo un error (`error`).
 * 4.  Proveer funciones para actualizar los datos en tiempo real (`addApplause`, `addRedemption`).
 */

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { getGoogleSheetsData } from '../services/googleSheetsService';
import type { User, Applause, Reward, Redemption, Notification, EarnedBadge } from '../types';
import { calculateEarnedBadges } from '../utils/badgeUtils';

// Define la estructura de los datos que guardaremos en el estado.
interface DataState {
  users: User[];
  applause: Applause[];
  rewards: Reward[];
  redemptions: Redemption[];
}

// Define la estructura completa de nuestro contexto, incluyendo los datos y los estados de carga/error.
interface DataContextType extends DataState {
  loading: boolean;
  error: Error | null;
  isRefreshing: boolean;
  refreshData: () => Promise<void>;
  addApplause: (newApplause: Omit<Applause, 'aplauso_id' | 'fecha'>) => void;
  addRedemption: (newRedemption: Omit<Redemption, 'canje_id' | 'fecha'>) => void;
}

// Creamos el Contexto. Al principio está vacío (undefined).
export const DataContext = createContext<DataContextType | undefined>(undefined);

// Este es el componente "Proveedor". Se pondrá en la parte más alta de la aplicación
// para que todos sus hijos (es decir, toda la app) puedan acceder a los datos.
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estado para guardar los datos de la aplicación.
  const [data, setData] = useState<DataState>({
    users: [],
    applause: [],
    rewards: [],
    redemptions: [],
  });
  // Estado para saber si estamos cargando los datos. Empieza en `true`.
  const [loading, setLoading] = useState(true);
  // Estado para saber si estamos actualizando los datos manualmente.
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Estado para guardar cualquier error que ocurra durante la carga.
  const [error, setError] = useState<Error | null>(null);

  // Función para buscar y cargar los datos.
  const fetchData = useCallback(async () => {
    try {
      const allData = await getGoogleSheetsData();
      setData(allData);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  // Carga inicial de datos.
  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // Función para refrescar los datos manualmente.
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await fetchData();
    } catch(err) {
      setError(err as Error);
      throw err; // Relanzamos el error para que el componente que llama pueda manejarlo.
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);
  
  /**
   * Añade un nuevo aplauso al estado global y genera notificaciones.
   */
  const addApplause = (newApplauseData: Omit<Applause, 'aplauso_id' | 'fecha'>) => {
    const newApplause: Applause = {
      ...newApplauseData,
      aplauso_id: `app-${Date.now()}`,
      fecha: new Date().toISOString(),
    };
    
    setData(prevData => ({ ...prevData, applause: [...prevData.applause, newApplause] }));
  };

  /**
   * Añade un nuevo canje al estado global con un estado inicial de 'Pendiente'.
   */
  const addRedemption = (newRedemptionData: Omit<Redemption, 'canje_id' | 'fecha'>) => {
    const newRedemption: Redemption = {
      ...newRedemptionData,
      canje_id: `red-${Date.now()}`,
      fecha: new Date().toISOString(),
      estado: 'Pendiente', // Asignamos un estado inicial.
    };
    setData(prevData => ({ ...prevData, redemptions: [...prevData.redemptions, newRedemption] }));
  };
  
  return (
    <DataContext.Provider value={{ ...data, loading, error, isRefreshing, refreshData, addApplause, addRedemption }}>
      {children}
    </DataContext.Provider>
  );
};

// Hook personalizado para facilitar el acceso al contexto.
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};