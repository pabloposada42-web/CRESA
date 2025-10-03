/**
 * AuthContext.tsx
 * 
 * Este archivo crea otro "Contenedor Global", pero este es específico para la
 * autenticación, es decir, para todo lo relacionado con el inicio y cierre de sesión.
 * 
 * Su responsabilidad es:
 * 1.  Mantener un registro de quién es el usuario que ha iniciado sesión (`user`).
 * 2.  Proveer una función `login` que verifica las credenciales y, si son correctas,
 *     guarda la información del usuario.
 * 3.  Proveer una función `logout` que limpia la información del usuario, cerrando la sesión.
 * 4.  Manejar estados de carga (`loading`) y error (`error`) durante el proceso de login.
 * 
 * Al igual que DataContext, permite que cualquier componente de la app sepa si hay un
 * usuario logueado y quién es, sin tener que pasar la información manualmente.
 */

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useData } from './DataContext'; // Importamos el hook para acceder a los datos de la app.
import type { User, Notification } from '../types';
import { calculateEarnedBadges } from '../utils/badgeUtils';

// Define la estructura de nuestro contexto de autenticación.
interface AuthContextType {
  user: User | null; // El usuario logueado, o `null` si nadie ha iniciado sesión.
  login: (email: string, password?: string) => Promise<boolean>; // Función para iniciar sesión.
  logout: () => void; // Función para cerrar sesión.
  loading: boolean; // `true` si se está procesando un intento de login.
  error: string | null; // Mensaje de error si el login falla.
  notifications: Notification[]; // Notificaciones del usuario actual.
  unreadCount: number; // Cantidad de notificaciones no leídas.
  markNotificationsAsRead: () => void; // Función para marcar notificaciones como leídas.
}

// Creamos el Contexto.
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// El componente Proveedor que envolverá a la aplicación.
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const { users, applause, loading: dataLoading } = useData();

  useEffect(() => {
    if (user && !dataLoading) {
      const received = applause.filter(a => a.receptor_id === user.usuario_id);
      
      const newNotifications: Notification[] = [];

      // Notificaciones de aplausos
      received.slice(-5).forEach(a => {
        const sender = users.find(u => u.usuario_id === a.otorgante_id);
        newNotifications.push({
          id: `applause-${a.aplauso_id}`,
          type: 'applause',
          message: `Recibiste una Milla Extra de ${sender?.nombre || 'alguien'}.`,
          date: a.fecha,
          read: false,
          relatedId: a.aplauso_id,
        });
      });

      // Notificaciones de insignias
      const earnedBadges = calculateEarnedBadges(received);
      const userBadges = earnedBadges.filter(b => b.earned && b.earnedDate);

      userBadges.forEach(badge => {
        newNotifications.push({
            id: `badge-${badge.name}-${user.usuario_id}`,
            type: 'badge',
            message: `¡Felicidades! Ganaste la insignia "${badge.name}".`,
            date: badge.earnedDate!,
            read: false,
            relatedId: badge.principle
        });
      });

      setNotifications(newNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  }, [user, applause, users, dataLoading]);

  const login = useCallback(async (email: string, password?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    // Espera activa si los datos aún no están listos.
    let attempts = 0;
    while (dataLoading && attempts < 10) {
        await new Promise(res => setTimeout(res, 300));
        attempts++;
    }

    if (dataLoading) {
        setError('Los datos de la aplicación no se pudieron cargar. Inténtalo de nuevo.');
        setLoading(false);
        return false;
    }

    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Se verifica el usuario, estado, y que la contraseña coincida con clave_hash.
    if (foundUser && foundUser.estado === 'activo' && foundUser.clave_hash === password) {
      setUser(foundUser);
      setLoading(false);
      return true;
    } else {
      setError('Correo electrónico o contraseña incorrectos.');
      setLoading(false);
      return false;
    }
  }, [users, dataLoading]);

  const logout = () => {
    setUser(null);
    setNotifications([]);
  };

  const markNotificationsAsRead = () => {
      setNotifications(prev => prev.map(n => ({...n, read: true})));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, notifications, unreadCount, markNotificationsAsRead }}>
      {children}
    </AuthContext.Provider>
  );
};

// Creamos un hook personalizado para facilitar el uso de este contexto.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};