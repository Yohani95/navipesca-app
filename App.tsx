import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import AppNavigator from './app/navigation/AppNavigator';
import { View } from 'react-native';
import { LogBox } from 'react-native';
import { setLogoutCallback } from './app/utils/logoutHandler';
import SplashScreen from './src/components/SplashScreen';

LogBox.ignoreLogs(['Warning: ...']);

/**
 * Componente auxiliar para configurar el callback de logout.
 * Se usa dentro de AuthProvider para tener acceso a la función logout del contexto.
 */
const AuthSetup: React.FC = () => {
  // Obtén la función de logout de tu AuthContext.
  // El nombre 'logout' puede variar según cómo lo hayas implementado.
  const auth = useAuth();
  const logoutFunction = auth?.logout; // o como se llame tu función de logout

  useEffect(() => {
    if (logoutFunction) {
      // Registra la función de logout de tu AuthContext para que
      // logoutHandler.ts pueda llamarla.
      // Se envuelve en una función async para asegurar que el tipo coincida
      // con lo que setLogoutCallback espera (Promise<void>).
      // La corrección ideal es que logoutFunction desde useAuth() ya sea async.
      const asyncLogoutFunction = async () => {
        logoutFunction(); // Llama a la función original
      };
      setLogoutCallback(asyncLogoutFunction);
      console.log('Callback de logout configurado en AuthSetup.');
    } else {
      console.warn(
        'AuthSetup: La función de logout no está disponible en AuthContext. El cierre de sesión automático por 401 podría no funcionar completamente.'
      );
    }
    // Se ejecuta cuando el componente se monta y si logoutFunction cambia.
  }, [logoutFunction]);

  return null; // No renderiza nada visualmente.
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Aquí puedes poner manejo de errores globales si lo necesitas,
    // pero ErrorUtils puede estar obsoleto. Considera alternativas.
    // const globalErrorHandler = (error: any, isFatal?: boolean) => {
    //   console.error('Error global no manejado:', error, 'Fatal:', isFatal);
    // };
    // ErrorUtils.setGlobalHandler(globalErrorHandler);
  }, []);

  // Renderizamos el contenido basado en el estado de carga
  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  return (
    <AuthProvider>
      {/* Tu AuthProvider debe envolver la app */}
      <AuthSetup /> {/* Este componente configura el logout automático */}
      <View style={{ flex: 1 }}>
        <AppNavigator />
      </View>
    </AuthProvider>
  );
}
