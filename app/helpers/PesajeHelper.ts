import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { generatePesajeId, generateBinId } from '../utils/generateId';

// Clave para almacenar los borradores de pesajes
const DRAFTS_KEY = 'pesajes_drafts';

/**
 * Guarda un borrador de pesaje en AsyncStorage
 * Solo permite un pesaje por embarcación
 */
export async function savePesajeDraft(pesaje: any): Promise<any> {
  try {
    // 1. Preparar bins con IDs únicos si no los tienen
    const binsWithIds =
      pesaje.bins?.map((bin: any) => {
        return bin.id ? bin : { ...bin, id: generateBinId(bin.codigo) };
      }) || [];

    // 2. Cargar borradores existentes
    const savedDrafts = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = savedDrafts ? JSON.parse(savedDrafts) : [];

    // 3. Verificar si ya existe un pesaje para esta embarcación
    const embarcacionId = pesaje.embarcacionId;
    const existingDraftIndex = embarcacionId
      ? drafts.findIndex(
          (d: any) =>
            d.embarcacionId === embarcacionId &&
            // Solo comparar IDs diferentes (si estamos actualizando el mismo draft, permitirlo)
            (pesaje.id ? d.id !== pesaje.id : true)
        )
      : -1;

    // 4. Si existe un pesaje para esta embarcación, mostrar alerta
    if (existingDraftIndex !== -1 && embarcacionId) {
      // Actualizar el pesaje existente en lugar de crear uno nuevo
      const existingDraft = drafts[existingDraftIndex];
      Alert.alert(
        'Pesaje existente',
        `Ya existe un pesaje en curso para esta embarcación. Se actualizará el existente.`
      );

      // Actualizar el pesaje existente
      drafts[existingDraftIndex] = {
        ...pesaje,
        bins: binsWithIds,
        id: existingDraft.id, // Mantener el ID original
        createdAt: existingDraft.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
      return drafts[existingDraftIndex];
    }

    // 5. Si no existe, crear uno nuevo
    const pesajeDraft = {
      ...pesaje,
      bins: binsWithIds,
      id: pesaje.id || generatePesajeId(pesaje.embarcacionId),
      createdAt: pesaje.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 6. Actualizar borrador existente o agregar nuevo
    const draftIndex = drafts.findIndex((d: any) => d.id === pesajeDraft.id);
    let updatedDrafts;

    if (draftIndex >= 0) {
      // Actualizar borrador existente
      updatedDrafts = [...drafts];
      updatedDrafts[draftIndex] = pesajeDraft;
    } else {
      // Agregar nuevo borrador
      updatedDrafts = [...drafts, pesajeDraft];
    }

    // 7. Guardar array actualizado de borradores
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
    console.log(`Guardado pesaje con ID: ${pesajeDraft.id}`);

    return pesajeDraft;
  } catch (error) {
    console.error('Error al guardar borrador:', error);
    Alert.alert('Error', 'No se pudo guardar el borrador del pesaje');
    throw error;
  }
}

/**
 * Obtiene todos los pesajes en borrador
 */
export async function getDraftPesajes(): Promise<any[]> {
  try {
    const savedDrafts = await AsyncStorage.getItem(DRAFTS_KEY);
    return savedDrafts ? JSON.parse(savedDrafts) : [];
  } catch (error) {
    console.error('Error al obtener borradores:', error);
    Alert.alert('Error', 'No se pudieron cargar los pesajes en curso');
    return [];
  }
}

/**
 * Elimina un borrador de pesaje por ID
 */
export async function deleteDraftPesaje(id: string): Promise<void> {
  try {
    // 1. Cargar borradores
    const savedDrafts = await AsyncStorage.getItem(DRAFTS_KEY);
    if (!savedDrafts) return;

    // 2. Filtrar para eliminar el pesaje con el ID especificado
    const drafts = JSON.parse(savedDrafts);
    const updatedDrafts = drafts.filter((draft: any) => draft.id !== id);

    // 3. Guardar array actualizado
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
    console.log(`Eliminado pesaje con ID: ${id}`);
  } catch (error) {
    console.error('Error al eliminar borrador:', error);
    Alert.alert('Error', 'No se pudo eliminar el pesaje en curso');
    throw error;
  }
}

/**
 * Obtiene un borrador de pesaje específico por ID
 */
export async function getDraftPesaje(id: string): Promise<any | null> {
  try {
    const drafts = await getDraftPesajes();
    return drafts.find((draft) => draft.id === id) || null;
  } catch (error) {
    console.error('Error al obtener borrador específico:', error);
    return null;
  }
}
