import apiClient from '../api/apiClient'; // Usar el cliente API configurado
import { PesajeData } from './types';

// El nombre del controlador o ruta base para los pesajes, DENTRO de /api/protected/
// Si tu endpoint en el backend es /weight, aquí sería 'weight'.
// La URL completa sería API_URL/api/protected/weight
const controllerPath = '/protected/pesaje'; // Ajusta 'weight' si tu ruta es diferente (ej: 'pesajes')

export const PesajeService = {
  // El token ya no se pasa como argumento, apiClient lo maneja.
  async createPesaje(pesaje: PesajeData) {
    try {
      // Asegurarnos de limpiar completamente el objeto antes de enviar
      const pesajeToSend = { ...pesaje };

      // console.log(
      //   'PesajeService - Enviando al servidor:',
      //   JSON.stringify(pesajeToSend, null, 2)
      // );

      // apiClient antepondrá API_URL. La ruta completa será API_URL/api/protected/weight
      const response = await apiClient.post(`${controllerPath}`, pesajeToSend);
      // console.log(
      //   'PesajeService - Respuesta del servidor:',
      //   JSON.stringify(response.data, null, 2)
      // );
      return response.data;
    } catch (error: any) {
      console.error('PesajeService - Error al crear pesaje:', error.message);
      if (error.response) {
        console.error(
          'PesajeService - Detalles del error:',
          JSON.stringify(
            {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers,
            },
            null,
            2
          )
        );
      }
      throw error;
    }
  },

  async getPesajes() {
    const response = await apiClient.get(`${controllerPath}`);
    // console.log('Respuesta de getPesajes:', response.data[0]);
    return response.data;
  },

  async syncPesajes(pesajes: PesajeData[]) {
    const results = [];
    for (const pesaje of pesajes) {
      try {
        // Es importante no enviar el 'id' local si es una creación nueva en el backend.
        const pesajeParaSincronizar = { ...pesaje };
        delete pesajeParaSincronizar.id; // O asegúrate que el backend lo ignore si existe.

        console.log('Sincronizando pesaje:', pesajeParaSincronizar);
        const result = await this.createPesaje(pesajeParaSincronizar);
        results.push({
          success: true,
          pesajeIdRemoto: result.id,
          idLocal: pesaje.id,
        });
      } catch (error: any) {
        console.error(
          'Error sincronizando un pesaje:',
          error.response?.data || error.message
        );
        results.push({
          success: false,
          error:
            error.response?.data?.message ||
            error.message ||
            'Error desconocido al sincronizar',
          idLocal: pesaje.id,
        });
      }
    }
    return results;
  },

  async syncPesaje(pesaje: PesajeData) {
    const pesajeParaSincronizar = { ...pesaje };
    delete pesajeParaSincronizar.id;

    try {
      const result = await this.createPesaje(pesajeParaSincronizar);
      return { success: true, pesajeIdRemoto: result.id, idLocal: pesaje.id };
    } catch (error: any) {
      console.error(
        'Error sincronizando un solo pesaje:',
        error.response?.data || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Error desconocido al sincronizar',
        idLocal: pesaje.id,
      };
    }
  },
};
