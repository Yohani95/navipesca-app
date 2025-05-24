import axios from 'axios';
import { API_URL } from '../config/apiConfig'; // La URL base de tu API, ej: http://localhost:3000
import { triggerLogout } from '../utils/logoutHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Nombre de la clave bajo la cual guardas el token en AsyncStorage
const TOKEN_STORAGE_KEY = 'usuario';

/**
 * Obtiene el token de autenticación desde AsyncStorage.
 */
const getTokenFromStorage = async (): Promise<string | null> => {
  try {
    const userDataString = await AsyncStorage.getItem(TOKEN_STORAGE_KEY); // Leer el objeto 'usuario'
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      return userData.token || null; // Extraer el token del objeto
    }
    return null;
  } catch (e) {
    console.error('Error al obtener el token desde AsyncStorage:', e);
    return null;
  }
};

const apiClient = axios.create({
  baseURL: API_URL, // Tu API_URL base (ej: http://localhost:3000)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Solicitud:
// Se ejecuta ANTES de que cada solicitud sea enviada.
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getTokenFromStorage();
    if (token && config.headers) {
      // Añade el token automáticamente a la cabecera Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Maneja errores en la configuración de la solicitud
    return Promise.reject(error);
  }
);

// Interceptor de Respuesta:
// Se ejecuta DESPUÉS de recibir una respuesta del servidor.
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa (código 2xx), simplemente la devuelve.
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Verifica si el error es un 401 (No Autorizado) y si no es un reintento.
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Marca para evitar bucles infinitos de reintentos.

      console.warn(
        'Error 401: No autorizado. El token podría ser inválido o haber expirado. Iniciando cierre de sesión.'
      );
      await triggerLogout(); // Llama a la función para cerrar sesión.
    }
    // Rechaza la promesa para que el error pueda ser manejado también
    // por la lógica que hizo la llamada original, si es necesario.
    return Promise.reject(error);
  }
);

export default apiClient;
