import apiClient from '../api/apiClient'; // Usar el cliente API configurado

// El nombre del controlador o ruta base para las embarcaciones, DENTRO de /api/protected/
// Si tu endpoint en el backend es /boat, aquí sería 'boat'.
// La URL completa sería API_URL/api/protected/boat
const controllerPath = '/protected/embarcacion'; // Ajusta 'boat' si tu ruta es diferente (ej: 'embarcaciones')

export const EmbarcacionService = {
  // El token ya no se pasa como argumento, apiClient lo maneja.
  async getEmbarcaciones() {
    const response = await apiClient.get(`${controllerPath}`);
    return response.data;
  },
};
