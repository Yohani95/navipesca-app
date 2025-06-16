import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { generatePesajeId, generateBinId } from '../utils/generateId';

const DRAFTS_KEY = 'pesajes_drafts';

/**
 * Guarda un borrador de pesaje localmente
 */
export async function savePesajeDraft(values: any) {
  try {
    // Asegurar que cada bin tenga un ID único
    const binsWithIds = values.bins.map((bin: any) => {
      return bin.id ? bin : { ...bin, id: generateBinId() };
    });

    // Crear objeto de pesaje con ID único
    const draft = {
      ...values,
      bins: binsWithIds,
      id: values.id || generatePesajeId(), // Mantener el ID si ya existe, o crear uno nuevo
      createdAt: values.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Cargar borradores existentes
    const savedDrafts = await AsyncStorage.getItem(DRAFTS_KEY);
    const drafts = savedDrafts ? JSON.parse(savedDrafts) : [];

    // Actualizar si ya existe, o agregar nuevo
    const draftIndex = drafts.findIndex((d: any) => d.id === draft.id);
    let updatedDrafts;

    if (draftIndex >= 0) {
      updatedDrafts = [...drafts];
      updatedDrafts[draftIndex] = draft;
    } else {
      updatedDrafts = [...drafts, draft];
    }

    // Guardar en AsyncStorage
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
    return draft;
  } catch (error) {
    console.error('Error al guardar borrador:', error);
    Alert.alert('Error', 'No se pudo guardar el borrador del pesaje');
    throw error;
  }
}

/**
 * Elimina un borrador de pesaje
 */
export async function deletePesajeDraft(id: string) {
  try {
    const savedDrafts = await AsyncStorage.getItem(DRAFTS_KEY);
    if (!savedDrafts) return;

    const drafts = JSON.parse(savedDrafts);
    const updatedDrafts = drafts.filter((d: any) => d.id !== id);
    await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
  } catch (error) {
    console.error('Error al eliminar borrador:', error);
    Alert.alert('Error', 'No se pudo eliminar el borrador');
    throw error;
  }
}
