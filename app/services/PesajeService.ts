import apiClient from '../api/apiClient'; // Usar el cliente API configurado
import { PesajeData } from './types';

// El nombre del controlador o ruta base para los pesajes, DENTRO de /api/protected/
// Si tu endpoint en el backend es /weight, aquí sería 'weight'.
// La URL completa sería API_URL/api/protected/weight
const controllerPath = '/protected/pesaje'; // Ajusta 'weight' si tu ruta es diferente (ej: 'pesajes')

export const PesajeService = {
  // El token ya no se pasa como argumento, apiClient lo maneja.
  async createPesaje(pesaje: PesajeData) {
    // apiClient antepondrá API_URL. La ruta completa será API_URL/api/protected/weight
    const response = await apiClient.post(`${controllerPath}`, pesaje);
    console.log('Respuesta de createPesaje:', response.data);
    return response.data;
  },

  async getPesajes() {
    const response = await apiClient.get(`${controllerPath}`);
    console.log('Respuesta de getPesajes:', response.data);
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
