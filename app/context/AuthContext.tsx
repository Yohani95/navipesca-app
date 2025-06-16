// app/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario } from '../models/Usuario';
import { AuthService } from '../services/AuthService';
import Constants from 'expo-constants';

interface AuthContextProps {
  usuario: Usuario | null;
  login: (
    correo: string,
    clave: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null; // Agregamos la propiedad error
  clearError: () => void; // Función para limpiar errores
  isDevelopment: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Función para determinar si estamos en entorno de desarrollo
const isDevelopmentMode = (): boolean => {
  return __DEV__;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Estado para errores
  const isDevelopment = isDevelopmentMode();

  // Función para limpiar errores
  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    console.log(
      `AuthProvider initializing in ${
        isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'
      } mode`
    );
    const loadUsuario = async () => {
      try {
        const data = await AsyncStorage.getItem('usuario');

        if (data) {
          console.log('Usuario encontrado en AsyncStorage');
          const userData = JSON.parse(data) as Usuario;

          // Validar el token si existe
          if (userData.token) {
            // En desarrollo, siempre considerar el token válido
            if (isDevelopment) {
              console.log(
                'Modo desarrollo: Token considerado válido automáticamente'
              );
              setUsuario(userData);
            } else {
              // En producción, validar el token con el backend
              try {
                const isValid = await AuthService.validateCurrentToken();
                if (isValid) {
                  console.log(
                    'Token existente es válido. Estableciendo usuario.'
                  );
                  setUsuario(userData);
                } else {
                  console.log(
                    'Token existente inválido o expirado. Limpiando...'
                  );
                  await AsyncStorage.removeItem('usuario');
                  setUsuario(null);
                }
              } catch (validationError) {
                console.error('Error al validar token:', validationError);
                await AsyncStorage.removeItem('usuario');
                setUsuario(null);
              }
            }
          } else {
            setUsuario(null);
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario desde AsyncStorage:', error);
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };
    loadUsuario();
  }, []);

  const login = async (
    correo: string,
    clave: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null); // Limpiar errores anteriores

      console.log(
        `Intentando iniciar sesión con: ${correo} (Modo: ${
          isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN'
        })`
      );

      // En producción, usar el proceso real de login
      const result = await AuthService.login(correo, clave);

      if (result.success && result.data) {
        await AsyncStorage.setItem('usuario', JSON.stringify(result.data));
        setUsuario(result.data);
        return { success: true };
      } else {
        console.error('Error de autenticación:', result.error);
        setError(result.error || 'Error de autenticación desconocido');
        return {
          success: false,
          error: result.error || 'Error de autenticación desconocido',
        };
      }
    } catch (error: any) {
      console.error('Error en login (catch):', error);
      const errorMessage =
        error.message || 'Ocurrió un error inesperado durante el login.';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      // En producción, notificar al servidor sobre el logout
      if (!isDevelopment) {
        await AuthService.logout();
      } else {
        console.log('Modo desarrollo: Simulando logout');
      }

      // Limpiar almacenamiento local
      await AsyncStorage.removeItem('usuario');
      setUsuario(null);
      console.log('Usuario cerró sesión exitosamente');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        loading,
        error,
        clearError,
        isDevelopment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
