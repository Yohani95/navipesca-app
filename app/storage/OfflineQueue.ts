// app/storage/OfflineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePesajeId } from '../utils/generateId';

const OFFLINE_QUEUE_KEY = 'offline_pesajes_queue';
const SYNC_STATUS_KEY = 'sync_status';

/**
 * Agrega un pesaje a la cola para sincronización posterior
 */
export async function addPesajeToQueue(pesaje: any): Promise<void> {
  try {
    // Cargar cola existente
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = queueStr ? JSON.parse(queueStr) : [];

    // Generar ID local si no lo tiene
    const pesajeWithId = {
      ...pesaje,
      id: pesaje.id || generatePesajeId(pesaje.embarcacionId),
      createdOffline: true,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending', // pending, syncing, success, failed
    };

    // Agregar a la cola
    queue.push(pesajeWithId);

    // Guardar cola actualizada
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));

    // Actualizar estado de sincronización
    updateSyncStatus();

    console.log('Pesaje agregado a cola offline:', pesajeWithId.id);
  } catch (error) {
    console.error('Error al agregar pesaje a cola offline:', error);
    throw error;
  }
}

/**
 * Actualiza el estado de sincronización
 */
export async function updateSyncStatus(): Promise<void> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = queueStr ? JSON.parse(queueStr) : [];

    const status = {
      lastUpdated: new Date().toISOString(),
      pendingCount: queue.length,
      hasPending: queue.length > 0,
    };

    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Error al actualizar estado de sincronización:', error);
  }
}

/**
 * Obtiene la cola de pesajes pendientes de sincronización
 * Alias para getQueuedPesajes (para mantener compatibilidad con SyncScreen)
 */
export async function getPendingPesajes(): Promise<any[]> {
  return getQueuedPesajes();
}

/**
 * Obtiene la cola de pesajes pendientes de sincronización
 */
export async function getQueuedPesajes(): Promise<any[]> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (error) {
    console.error('Error al obtener pesajes pendientes:', error);
    return [];
  }
}

/**
 * Remueve un pesaje de la cola de pendientes
 */
export async function removePesajeFromQueue(pesajeId: string): Promise<void> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queueStr) return;

    const queue = JSON.parse(queueStr);
    const updatedQueue = queue.filter((p: any) => p.id !== pesajeId);

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    await updateSyncStatus();
  } catch (error) {
    console.error('Error al remover pesaje de la cola:', error);
  }
}

/**
 * Remueve múltiples pesajes de la cola por sus IDs
 */
export async function removePesajesFromQueue(
  pesajeIds: string[]
): Promise<void> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queueStr) return;

    const queue = JSON.parse(queueStr);
    const updatedQueue = queue.filter((p: any) => !pesajeIds.includes(p.id));

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    await updateSyncStatus();
  } catch (error) {
    console.error('Error al remover pesajes de la cola:', error);
  }
}

/**
 * Remueve pesajes de la cola por sus índices en el array
 */
export async function removePesajesByIndices(indices: number[]): Promise<void> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queueStr) return;

    const queue = JSON.parse(queueStr);
    const updatedQueue = queue.filter(
      (_: any, index: number) => !indices.includes(index)
    );

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
    await updateSyncStatus();
  } catch (error) {
    console.error('Error al remover pesajes por índices:', error);
  }
}

/**
 * Limpia la cola de pesajes pendientes
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    await updateSyncStatus();
  } catch (error) {
    console.error('Error al limpiar la cola:', error);
  }
}

/**
 * Actualiza el estado de un pesaje en la cola
 */
export async function updatePesajeInQueue(
  pesajeId: string,
  updates: any
): Promise<void> {
  try {
    const queueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!queueStr) return;

    const queue = JSON.parse(queueStr);
    const updatedQueue = queue.map((p: any) => {
      if (p.id === pesajeId) {
        return { ...p, ...updates };
      }
      return p;
    });

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error al actualizar pesaje en la cola:', error);
  }
}

/**
 * Obtiene el estado de sincronización
 */
export async function getSyncStatus(): Promise<any> {
  try {
    const statusStr = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return statusStr
      ? JSON.parse(statusStr)
      : { hasPending: false, pendingCount: 0 };
  } catch (error) {
    console.error('Error al obtener estado de sincronización:', error);
    return { hasPending: false, pendingCount: 0 };
  }
}
