// app/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from 'react-native';
import { Usuario } from '../models/Usuario';
import { AuthService } from '../services/AuthService';
import Constants from 'expo-constants'; // Asegúrate de tener expo-constants instalado

// Usuario de prueba para desarrollo
// const DEV_USER: Usuario = {
//   id: 'dev-user-id',
//   nombre: 'Usuario Desarrollo',
//   correo: 'dev@example.com',
//   rol: { nombre: 'ADMIN' }, // O el rol que necesites para probar
//   token: 'dev-token-123456',
//   // Añade cualquier otra propiedad requerida por el tipo Usuario
// };

interface AuthContextProps {
  usuario: Usuario | null;
  login: (
    correo: string,
    clave: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loading: boolean;
  isDevelopment: boolean; // Agregada para que los componentes puedan verificar el modo
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Función para determinar si estamos en entorno de desarrollo
const isDevelopmentMode = (): boolean => {
  // __DEV__ es true cuando ejecutas en desarrollo local (metro bundler)
  return __DEV__;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const isDevelopment = isDevelopmentMode();

  useEffect(() => {
    console.log(
      `AuthProvider initializing in ${
        isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'
      } mode`
    );
    const loadUsuario = async () => {
      try {
        const data = await AsyncStorage.getItem('usuario');

        // Si estamos en desarrollo y no hay usuario almacenado, usar el usuario de desarrollo
        // if (isDevelopment && !data) {
        //   console.log(
        //     'Modo desarrollo: Cargando usuario simulado automáticamente'
        //   );
        //   await AsyncStorage.setItem('usuario', JSON.stringify(DEV_USER));
        //   setUsuario(DEV_USER);
        //   setLoading(false);
        //   return;
        // }

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
      console.log(
        `Intentando iniciar sesión con: ${correo} (Modo: ${
          isDevelopment ? 'DESARROLLO' : 'PRODUCCIÓN'
        })`
      );

      // Si estamos en desarrollo, simular un inicio de sesión exitoso
      // if (isDevelopment) {
      //   console.log('Modo desarrollo: Simulando inicio de sesión exitoso');

      //   // Crear un usuario personalizado basado en las credenciales proporcionadas
      //   // pero manteniendo la estructura del usuario de desarrollo
      //   const devLoginUser: Usuario = {
      //     ...DEV_USER,
      //     correo: correo,
      //     nombre: `Dev ${correo.split('@')[0]}`, // Usar parte del correo como nombre
      //   };

      //   await AsyncStorage.setItem('usuario', JSON.stringify(devLoginUser));
      //   setUsuario(devLoginUser);
      //   return { success: true };
      // }

      // En producción, usar el proceso real de login
      const result = await AuthService.login(correo, clave);

      if (result.success && result.data) {
        await AsyncStorage.setItem('usuario', JSON.stringify(result.data));
        setUsuario(result.data);
        return { success: true };
      } else {
        console.error('Error de autenticación:', result.error);
        return {
          success: false,
          error: result.error || 'Error de autenticación desconocido',
        };
      }
    } catch (error: any) {
      console.error('Error en login (catch):', error);
      return {
        success: false,
        error: error.message || 'Ocurrió un error inesperado durante el login.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
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
    }
  };

  return (
    <AuthContext.Provider
      value={{ usuario, login, logout, loading, isDevelopment }}
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
