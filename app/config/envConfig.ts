import Constants from 'expo-constants';

// Tipos de entornos disponibles
export type Environment = 'development' | 'staging' | 'production';

// Tipo fuertemente tipado para la configuración
interface EnvConfig {
  environment: Environment;
  apiUrl: string;
  enableAnalytics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  updateCheckInterval: number;
  offlineSyncInterval: number;
}

// Obtener el entorno actual
const getEnvironment = (): Environment => {
  // Obtener del manifest o usar fallback
  const envFromExpo = Constants.expoConfig?.extra?.environment;

  if (
    envFromExpo &&
    ['development', 'staging', 'production'].includes(envFromExpo)
  ) {
    return envFromExpo as Environment;
  }

  // Por defecto usar desarrollo
  return __DEV__ ? 'development' : 'production';
};

// Configuración por entorno
const envConfig: Record<Environment, EnvConfig> = {
  development: {
    environment: 'development',
    apiUrl: 'http://192.168.1.11:3000/api', // URL de desarrollo local
    enableAnalytics: false,
    logLevel: 'debug',
    updateCheckInterval: 3600000, // 1 hora
    offlineSyncInterval: 60000, // 1 minuto
  },
  staging: {
    environment: 'staging',
    apiUrl: 'https://staging-api.navipesca.cl/api', // URL de staging
    enableAnalytics: true,
    logLevel: 'info',
    updateCheckInterval: 3600000, // 1 hora
    offlineSyncInterval: 300000, // 5 minutos
  },
  production: {
    environment: 'production',
    apiUrl: 'https://api.navipesca.cl/api', // URL de producción
    enableAnalytics: true,
    logLevel: 'warn',
    updateCheckInterval: 86400000, // 24 horas
    offlineSyncInterval: 900000, // 15 minutos
  },
};

// Configuración actual basada en el entorno
const currentEnv = getEnvironment();
const currentConfig = envConfig[currentEnv];

console.log(`App corriendo en modo: ${currentEnv.toUpperCase()}`);
console.log(`API URL: ${currentConfig.apiUrl}`);

export default currentConfig;
