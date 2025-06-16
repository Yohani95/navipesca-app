export default ({ config }) => {
  // Obtiene el valor de la variable de entorno APP_ENV o usa 'development' por defecto
  const environment = process.env.APP_ENV || 'development';

  // Valor para el canal de actualizaciones
  const updateChannel = process.env.UPDATE_CHANNEL || environment;

  // ID del proyecto en EAS
  const easProjectId = process.env.EAS_PROJECT_ID || 'tu-eas-project-id';

  // Configuración de versión y build
  const version = process.env.APP_VERSION || config.version || '1.0.0';
  const buildNumber = process.env.BUILD_NUMBER
    ? String(process.env.BUILD_NUMBER)
    : String(config.ios?.buildNumber || '1');

  return {
    ...config,
    name: 'NaviPesca',
    slug: 'navipesca-app', // Debe coincidir con el projectId
    icon: './assets/icon.png',
    version,
    ios: {
      ...config.ios,
      buildNumber,
    },
    android: {
      ...config.android,
      icon: './assets/icon.png',
      name: 'NaviPesca',
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.tucompania.navipesca', // Asegúrate de usar tu ID de paquete real
      versionCode: parseInt(buildNumber, 10),
    },
    extra: {
      ...config.extra,
      environment,
      updateEndpoint:
        process.env.UPDATE_CHECK_URL ||
        'https://api.tudominio.com/api/version-check',
      buildNumber,
    },
    updates: {
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 30000,
      url: `https://u.expo.dev/${easProjectId}/${updateChannel}`,
      channel: updateChannel,
    },
    plugins: [...(config.plugins || []), 'expo-updates'],
    runtimeVersion: version, // Usamos la misma versión de la app como runtime version
  };
};
