// app/storage/OfflineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Consistencia: usar una única clave para la cola de pesajes
const KEY = 'pesajes_pendientes';

// Añadir un pesaje a la cola con un ID único
export const addPesajeToQueue = async (pesaje: any) => {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    const currentQueue = stored ? JSON.parse(stored) : [];

    // Asegurarse de que el pesaje tenga un ID
    const pesajeWithId = {
      ...pesaje,
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };

    console.log(`Añadiendo pesaje a la cola con ID: ${pesajeWithId.id}`);

    currentQueue.push(pesajeWithId);
    await AsyncStorage.setItem(KEY, JSON.stringify(currentQueue));
    console.log(`Pesaje añadido a la cola con ID: ${pesajeWithId.id}`);

    return pesajeWithId; // Retornar el pesaje con su ID asignado
  } catch (error) {
    console.error('Error al añadir pesaje a la cola:', error);
    throw error;
  }
};

export const getQueuedPesajes = async (): Promise<any[]> => {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    const queue = stored ? JSON.parse(stored) : [];
    console.log(`Obtenidos ${queue.length} pesajes de la cola`);
    return queue;
  } catch (error) {
    console.error('Error al obtener pesajes de la cola:', error);
    return [];
  }
};

// Limpiar toda la cola
export const clearQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEY);
    console.log('Cola de pesajes limpiada completamente');
  } catch (error) {
    console.error('Error al limpiar la cola de pesajes:', error);
    throw error;
  }
};

// Eliminar pesajes específicos por su índice en la cola
export const removePesajesByIndices = async (
  indicesToRemove: number[]
): Promise<void> => {
  try {
    if (indicesToRemove.length === 0) {
      console.log('No hay índices para eliminar');
      return;
    }

    console.log(
      `Intentando eliminar pesajes en los índices: ${indicesToRemove.join(
        ', '
      )}`
    );

    // Obtener la cola actual
    const currentQueue = await getQueuedPesajes();

    if (currentQueue.length === 0) {
      console.log('La cola está vacía');
      return;
    }

    // Filtrar la cola para mantener solo los elementos cuyos índices NO están en indicesToRemove
    const updatedQueue = currentQueue.filter(
      (_, index) => !indicesToRemove.includes(index)
    );

    // Guardar la cola actualizada
    await AsyncStorage.setItem(KEY, JSON.stringify(updatedQueue));
    console.log(
      `Se eliminaron ${indicesToRemove.length} pesajes. Quedan ${updatedQueue.length}`
    );
  } catch (error) {
    console.error('Error al eliminar pesajes por índice:', error);
    throw error;
  }
};

// Función para eliminar pesajes específicos de la cola por sus IDs
export const removePesajesFromQueue = async (
  successfulIds: string[]
): Promise<void> => {
  try {
    if (successfulIds.length === 0) {
      console.log('No hay IDs para eliminar');
      return;
    }

    console.log(
      `Intentando eliminar ${successfulIds.length} pesajes: ${JSON.stringify(
        successfulIds
      )}`
    );

    // Obtener la cola actual
    const queue = await getQueuedPesajes();

    if (queue.length === 0) {
      console.log('La cola está vacía');
      return;
    }

    // Verificar IDs antes de filtrar
    console.log(
      'IDs en la cola actual:',
      queue.map((item) => item.id || 'sin-id')
    );

    // Filtrar la cola para mantener solo los elementos que NO están en successfulIds
    const updatedQueue = queue.filter((item) => {
      const itemId = item.id;
      const shouldKeep = !successfulIds.includes(itemId);
      console.log(`Evaluando ID: ${itemId}, Mantener: ${shouldKeep}`);
      return shouldKeep;
    });

    // Guardar la cola actualizada
    await AsyncStorage.setItem(KEY, JSON.stringify(updatedQueue));
    console.log(
      `Eliminados ${queue.length - updatedQueue.length} pesajes. Quedan ${
        updatedQueue.length
      }`
    );
  } catch (error) {
    console.error('Error al eliminar pesajes de la cola:', error);
    throw error;
  }
};
