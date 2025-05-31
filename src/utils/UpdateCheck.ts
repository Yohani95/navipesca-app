import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { Alert } from 'react-native';
import Constants from 'expo-constants';

const UPDATE_CHECK_INTERVAL = 3600000; // 1 hora en ms
const LAST_UPDATE_CHECK_KEY = 'lastUpdateCheck';

interface VersionInfo {
  latestVersion: string;
  currentVersion: string;
  updateRequired: boolean;
  updateUrl?: string;
}

// Función para verificar si expo-updates está disponible y no estamos en Expo Go
const canUseExpoUpdates = async () => {
  try {
    // En desarrollo o Expo Go, no podemos usar las actualizaciones
    if (__DEV__ || Constants.appOwnership === 'expo') {
      return false;
    }

    // Verificamos si el módulo está disponible
    const Updates = require('expo-updates');
    return true;
  } catch (error) {
    console.log('No se puede utilizar expo-updates:', error);
    return false;
  }
};

export const checkForUpdates = async (forceCheck = false): Promise<void> => {
  try {
    // Verificar si tenemos conexión a internet
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No hay conexión a internet para verificar actualizaciones');
      return;
    }

    // Verificar si ya hemos comprobado recientemente
    const lastCheck = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);
    const now = Date.now();

    if (
      !forceCheck &&
      lastCheck &&
      now - parseInt(lastCheck) < UPDATE_CHECK_INTERVAL
    ) {
      console.log('Ya se verificaron actualizaciones recientemente');
      return;
    }

    // Guardar la fecha actual como último chequeo
    await AsyncStorage.setItem(LAST_UPDATE_CHECK_KEY, now.toString());

    const canUseUpdates = await canUseExpoUpdates();

    if (canUseUpdates) {
      try {
        const Updates = require('expo-updates');
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();

          Alert.alert(
            '¡Actualización disponible!',
            'Se ha descargado una nueva versión. ¿Deseas reiniciar para aplicar los cambios?',
            [
              { text: 'Más tarde', style: 'cancel' },
              {
                text: 'Actualizar ahora',
                onPress: () => Updates.reloadAsync(),
              },
            ]
          );
        } else {
          console.log('Aplicación actualizada al día');
        }
      } catch (error) {
        console.log('Error al verificar expo-updates:', error);
      }
    } else if (!__DEV__) {
      // En producción, sin expo-updates, usamos nuestra API
      try {
        const appVersion = Constants.expoConfig?.version || '1.0.0';
        console.log(`Verificando actualizaciones para versión ${appVersion}`);

        // Aquí puedes implementar tu lógica de verificación de versiones con tu backend
        const response = await axios.get('/api/version-check', {
          params: { currentVersion: appVersion },
        });

        if (response.data && response.data.updateRequired) {
          Alert.alert(
            'Actualización disponible',
            `Hay una nueva versión (${
              response.data.latestVersion
            }) disponible. ${
              response.data.updateRequired
                ? 'Esta actualización es obligatoria.'
                : ''
            }`,
            [
              {
                text: 'Actualizar ahora',
                onPress: () => {
                  const storeUrl =
                    Platform.OS === 'ios'
                      ? response.data.iosUrl ||
                        'itms-apps://itunes.apple.com/app/id[TU-APP-ID]'
                      : response.data.androidUrl ||
                        'market://details?id=com.navipesca.app';
                  Linking.openURL(storeUrl);
                },
              },
            ],
            { cancelable: !response.data.updateRequired }
          );
        } else {
          console.log('No hay actualizaciones disponibles');
        }
      } catch (error) {
        console.log('Error al verificar versiones con el servidor:', error);
      }
    } else {
      console.log(
        'Saltando verificación de actualizaciones en modo desarrollo'
      );
    }
  } catch (error) {
    console.error(
      'Error en el proceso de verificación de actualizaciones:',
      error
    );
  }
};
