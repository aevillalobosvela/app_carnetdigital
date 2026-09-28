import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/auth_service';
import { registerOnUnauthorized } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  cargandoSession: boolean;
  activarSession: () => Promise<void>;
  logoutSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cargandoSession, setCargandoSession] = useState(true);

  // Inicializar sesión leyendo SecureStore al arrancar la app
  useEffect(() => {
    async function initSession() {
      try {
        const authed = await authService.isAuthenticated();
        setIsAuthenticated(authed);
      } catch (e) {
        console.error('Failed to restore session:', e);
      } finally {
        setCargandoSession(false);
      }
    }
    initSession();

    // Registrar callback para cuando el API reciba un 401/403
    registerOnUnauthorized(() => {
      setIsAuthenticated(false);
    });
  }, []);

  const activarSession = async () => {
    setIsAuthenticated(true);
  };

  const logoutSession = async () => {
    const fullyLoggedOut = await authService.logoutCurrent();
    if (fullyLoggedOut) {
      setIsAuthenticated(false);
    }
    return fullyLoggedOut;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        cargandoSession,
        activarSession,
        logoutSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
