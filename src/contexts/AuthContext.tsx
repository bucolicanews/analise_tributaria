import React, { createContext, useContext, useState, useCallback } from 'react';
import { isAuthenticated, login as doLogin, logout as doLogout } from '@/lib/auth';

interface AuthContextType {
  autenticado: boolean;
  login: (senha: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  autenticado: false,
  login: () => false,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autenticado, setAutenticado] = useState(isAuthenticated);

  const login = useCallback((senha: string) => {
    const ok = doLogin(senha);
    if (ok) setAutenticado(true);
    return ok;
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setAutenticado(false);
  }, []);

  return (
    <AuthContext.Provider value={{ autenticado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
