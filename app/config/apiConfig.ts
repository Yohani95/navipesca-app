import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detectar el entorno usando variables de entorno o el modo de desarrollo
// Esta configuración facilita la integración con GitHub Actions
const ENV = {
  dev: 'development',
  prod: 'production',
  test: 'testing',
};

// Podemos obtener el entorno desde process.env en el caso de usar GitHub Actions
// o usar el __DEV__ flag de React Native
const getEnvironment = () => {
  // Si se define una variable de entorno (útil para CI/CD)
  if (Constants.expoConfig?.extra?.environment) {
    return Constants.expoConfig.extra.environment;
  }

  // Por defecto, usar el flag __DEV__
  return __DEV__ ? ENV.dev : ENV.prod;
};

const currentEnvironment = getEnvironment();
const isProduction = currentEnvironment === ENV.prod;

// URLs de API para diferentes entornos
const API_URLS = {
  [ENV.dev]: {
    LOCAL_IP: '192.168.1.9',
    API_PORT: '3000',
    API_BASE_PATH: '/api',
  },
  [ENV.test]: {
    BASE_URL: 'https://testing.navi-pesca.vercel.app',
    API_BASE_PATH: '/api',
  },
  [ENV.prod]: {
    BASE_URL: 'https://navi-pesca.vercel.app',
    API_BASE_PATH: '/api',
  },
};

// Determina la URL de la API basada en el entorno
export const API_URL =
  isProduction || currentEnvironment === ENV.test
    ? `${API_URLS[currentEnvironment].BASE_URL}${API_URLS[currentEnvironment].API_BASE_PATH}`
    : Platform.OS === 'android'
    ? `http://${API_URLS[ENV.dev].LOCAL_IP}:${API_URLS[ENV.dev].API_PORT}${
        API_URLS[ENV.dev].API_BASE_PATH
      }`
    : `http://localhost:${API_URLS[ENV.dev].API_PORT}${
        API_URLS[ENV.dev].API_BASE_PATH
      }`;

console.log(`App corriendo en modo: ${currentEnvironment.toUpperCase()}`);
console.log(`API URL: ${API_URL}`);

// Exportamos información adicional útil para la app
export const APP_ENV = {
  isProduction,
  environment: currentEnvironment,
};
