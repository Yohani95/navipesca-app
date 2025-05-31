import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
  ImageBackground,
} from 'react-native';
import { checkForUpdates } from '../utils/UpdateCheck';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [loadingText, setLoadingText] = useState('Iniciando aplicación...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Verificar si hay actualizaciones disponibles
        setLoadingText('Verificando actualizaciones...');
        setProgress(30);
        await checkForUpdates(true); // Forzamos la verificación de actualizaciones

        // Simulamos carga de recursos adicionales
        setLoadingText('Cargando recursos...');
        setProgress(60);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Finalizamos la carga
        setLoadingText('¡Todo listo!');
        setProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Notificamos que la carga ha finalizado
        onFinish();
      } catch (error) {
        console.error('Error durante la inicialización:', error);
        setLoadingText('Error al iniciar. Continuando...');
        // Aún con error, continuamos después de un momento
        setTimeout(onFinish, 2000);
      }
    };

    initializeApp();
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/fondo-app-navipesca.png')}
        style={styles.background}
      >
        <Text style={styles.title}>NaviPesca</Text>
        <ActivityIndicator
          size="large"
          color="#FFFFFF"
          style={styles.spinner}
        />
        <Text style={styles.loadingText}>{loadingText}</Text>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        <Text style={styles.version}>v1.0.0</Text>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#003366', // Cambiado a azul oscuro para combinar con el fondo
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0, // Eliminado el padding para que la imagen ocupe todo el espacio
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  spinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: 'white', // Cambiado a blanco para ser visible sobre fondo azul
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  progressBarContainer: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semitransparente para fondos oscuros
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF', // Cambiado a blanco para contrastar con el fondo
  },
  version: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: 'white', // Cambiado a blanco para ser visible sobre fondo azul
  },
});

export default SplashScreen;
