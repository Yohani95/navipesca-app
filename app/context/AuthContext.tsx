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

interface AuthContextProps {
  usuario: Usuario | null;
  login: (
    correo: string,
    clave: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>; // Asegurarse que logout aquí también refleje Promise<void>
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider is initializing');
    const loadUsuario = async () => {
      try {
        const data = await AsyncStorage.getItem('usuario');
        if (data) {
          console.log('Usuario encontrado en AsyncStorage');
          const userData = JSON.parse(data) as Usuario; // Tipar userData
          // No establecer el usuario aquí todavía, primero validar el token.
          // setUsuario(userData); // Movido más abajo

          // Validar el token si existe
          // El token se obtiene de AsyncStorage por el interceptor de apiClient
          if (userData.token) {
            // Usar validateCurrentToken que no toma argumentos.
            // El token se adjuntará automáticamente por el interceptor de apiClient.
            const isValid = await AuthService.validateCurrentToken();
            if (isValid) {
              console.log('Token existente es válido. Estableciendo usuario.');
              setUsuario(userData); // Establecer usuario solo si el token es válido
            } else {
              console.log(
                'Token existente inválido o expirado (según validateCurrentToken). Limpiando...'
              );
              // El interceptor de apiClient ya debería haber llamado a triggerLogout,
              // que a su vez llama a esta función logout del contexto si está bien configurado.
              // Pero como medida de seguridad, limpiamos aquí también si la validación inicial falla.
              await AsyncStorage.removeItem('usuario');
              setUsuario(null);
            }
          } else {
            // No había token, así que no hay usuario logueado.
            setUsuario(null);
          }
        }
      } catch (error) {
        console.error('Error al cargar usuario desde AsyncStorage:', error);
        setUsuario(null); // Asegurar que el usuario sea null en caso de error
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
    // Modified return type
    try {
      console.log('Intentando iniciar sesión con:', correo);

      const result = await AuthService.login(correo, clave);

      if (result.success && result.data) {
        await AsyncStorage.setItem('usuario', JSON.stringify(result.data));
        setUsuario(result.data);
        return { success: true }; // Return success object
      } else {
        console.error('Error de autenticación:', result.error);
        return {
          success: false,
          error: result.error || 'Error de autenticación desconocido',
        }; // Return error object
      }
    } catch (error: any) {
      console.error('Error en login (catch):', error);
      return {
        success: false,
        error: error.message || 'Ocurrió un error inesperado durante el login.',
      }; // Return error object
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Notificar al servidor sobre el logout.
      // AuthService.logout() ya no necesita el token como argumento.
      await AuthService.logout();

      // Limpiar almacenamiento local
      await AsyncStorage.removeItem('usuario');
      setUsuario(null);
      console.log('Usuario cerró sesión exitosamente');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, loading }}>
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
