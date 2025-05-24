import axios from 'axios'; // Se mantiene para el login
import apiClient from '../api/apiClient'; // Se usa para llamadas autenticadas
import { API_URL } from '../config/apiConfig';

/**
 * Servicio para manejar peticiones relacionadas con la autenticación
 */
export const AuthService = {
  /**
   * Autenticar usuario usando el endpoint dedicado para la app móvil
   */
  async login(email: string, password: string) {
    try {
      // La solicitud de login no usa el token (aún no lo tiene),
      // por lo que puede usar axios directamente.
      const response = await axios.post(`${API_URL}/auth/external-login`, {
        email,
        password,
      });

      // Asegúrate que el backend realmente devuelva un campo 'token'.
      if (response.status === 200 && response.data && response.data.token) {
        return {
          success: true,
          data: {
            id: response.data.id,
            nombre: response.data.name || response.data.nombre,
            email: response.data.email,
            token: response.data.token, // Usar el token del backend
            personaId: response.data.personaId || response.data.id,
            rolId: response.data.rolId,
            image: response.data.image,
          },
        };
      }

      return {
        success: false,
        error: response.data?.message || 'Error de autenticación desconocido',
      };
    } catch (error: any) {
      console.error('Error en AuthService.login:', error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error de conexión o del servidor durante el login';

      return {
        success: false,
        error: errorMsg,
      };
    }
  },

  /**
   * Verifica si el token actual (almacenado) es válido haciendo una petición
   * a un endpoint protegido. El interceptor de apiClient se encargará de añadir el token.
   * Si la petición falla con 401, el interceptor de respuesta disparará el logout.
   *
   * Nota: Tu middleware protege rutas bajo `/api/protected/`.
   * Necesitas un endpoint ligero bajo esa ruta para esta verificación.
   * Si no tienes uno específico, puedes intentar obtener datos del perfil del usuario
   * o cualquier otro dato que requiera autenticación y sea pequeño.
   * Por ejemplo, si tienes `/api/protected/user/profile`.
   */
  async validateCurrentToken() {
    try {
      const response = await apiClient.get('/protected/ping');
      return response.status === 200;
    } catch (error: any) {
      // Si el error es 401, el interceptor de apiClient ya habrá iniciado el logout.
      // Esta función simplemente reporta que la validación falló.
      console.error(
        'Error al validar token (validateCurrentToken):',
        error.message
      );
      return false;
    }
  },

  /**
   * Cerrar sesión (notificar al servidor opcionalmente).
   * El logout principal (limpiar token local, navegar) se maneja en AuthContext
   * y es disparado por logoutHandler.ts a través del interceptor.
   * Esta función es más para si quieres notificar al backend explícitamente.
   */
  async logout() {
    // Ya no necesita el token como argumento si usa apiClient
    try {
      // Opcional: notificar al servidor del logout.
      // Si tienes un endpoint como `/api/protected/logout`
      // await apiClient.post('/api/protected/logout');
      console.log(
        'AuthService.logout: Notificación al servidor (si está implementada).'
      );
      return true;
    } catch (error) {
      console.error('Error al notificar cierre de sesión al servidor:', error);
      // Aunque falle la notificación al servidor, el logout local debe proceder.
      return true;
    }
  },
};
