// app/screens/SyncScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity, // Importar TouchableOpacity
  ActivityIndicator, // Importar ActivityIndicator
  RefreshControl, // Importar RefreshControl
  Platform, // Add Platform API
} from 'react-native';
import {
  getQueuedPesajes, // Ahora esta función existe
  clearQueue, // Ahora esta función existe
  removePesajesByIndices, // Ahora esta función existe
  removePesajesFromQueue, // Ahora esta función existe
} from '../storage/OfflineQueue';
import { PesajeService } from '../services/PesajeService';
import { useAuth } from '../context/AuthContext';
import { PesajeData } from '../services/types';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Importar useFocusEffect
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Importar Icon
import AsyncStorage from '@react-native-async-storage/async-storage';
const EMBARCACIONES_CACHE_KEY = 'embarcaciones_cache'; // O impórtalo si está en un archivo común

type SyncScreenNavigationProp = NativeStackNavigationProp<
  // Cambiado el nombre del tipo
  RootStackParamList,
  'Sync'
>;
export default function SyncScreen() {
  const navigation = useNavigation<SyncScreenNavigationProp>(); // Usar el nombre de tipo corregido
  const { usuario } = useAuth();
  const [pendingPesajes, setPendingPesajes] = useState<PesajeData[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Para la carga inicial
  const [isSyncing, setIsSyncing] = useState(false); // Para el proceso de sincronización
  const [syncingIndices, setSyncingIndices] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false); // Para el pull-to-refresh
  const [listaEmbarcaciones, setListaEmbarcaciones] = useState<
    { id: number; nombre: string }[]
  >([]);
  const loadInitialData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const items = await getQueuedPesajes();
      setPendingPesajes(items);
      const cachedEmbarcaciones = await AsyncStorage.getItem(
        EMBARCACIONES_CACHE_KEY
      );
      if (cachedEmbarcaciones) {
        setListaEmbarcaciones(JSON.parse(cachedEmbarcaciones));
      }
    } catch (error) {
      console.error('Error al cargar datos en SyncScreen:', error);
      showAlert('Error', 'No se pudieron cargar los datos necesarios.');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [loadInitialData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInitialData(false).finally(() => setRefreshing(false));
  }, [loadInitialData]);

  // Añadir constante para la clave de AsyncStorage
  const OFFLINE_PESAJE_QUEUE_KEY = 'pesajes_pendientes';

  const syncAll = async () => {
    if (!usuario || !usuario.token) {
      showAlert('Error', 'Usuario no autenticado o token no disponible');
      return;
    }

    if (pendingPesajes.length === 0) {
      showAlert('Información', 'No hay pesajes pendientes para sincronizar.');
      return;
    }
    setIsSyncing(true);

    try {
      // Antes de la sincronización, imprimimos los IDs para verificar
      console.log(
        'Pesajes a sincronizar:',
        pendingPesajes.map((p) => ({
          id: p.id,
          tipoPez: p.tipoPez,
          totalKilos: p.totalKilos,
        }))
      );

      // Intentamos sincronizar todos los pesajes pendientes
      const results = await PesajeService.syncPesajes(pendingPesajes);

      let successCount = 0;
      const successfulIndices: number[] = [];

      // Registrar los índices de los pesajes sincronizados con éxito
      results.forEach((result, index) => {
        if (result.success) {
          successCount++;
          successfulIndices.push(index);
          console.log(`Pesaje #${index} sincronizado con éxito`);
        } else {
          console.log(`Falló la sincronización del pesaje #${index}`);
        }
      });

      console.log(
        `Sincronizados con éxito: ${successCount}/${pendingPesajes.length}`
      );
      console.log(`Índices a eliminar: [${successfulIndices.join(', ')}]`);

      // Eliminar los pesajes sincronizados por sus índices
      if (successfulIndices.length > 0) {
        try {
          await removePesajesByIndices(successfulIndices);

          // Actualizar el estado
          const remainingPesajes = await getQueuedPesajes();
          setPendingPesajes(remainingPesajes);

          // Mostrar mensaje de éxito
          if (successCount === pendingPesajes.length) {
            showAlert(
              'Sincronización completa',
              `Se han sincronizado ${successCount} pesajes.`
            );

            if (remainingPesajes.length === 0) {
              navigation.navigate('Home');
            }
          } else {
            showAlert(
              'Sincronización parcial',
              `Se sincronizaron ${successCount} de ${pendingPesajes.length} pesajes.`
            );
          }
        } catch (error) {
          console.error('Error al eliminar pesajes sincronizados:', error);
          showAlert(
            'Error',
            'Los pesajes se sincronizaron pero hubo un problema al actualizar la cola local.'
          );
        }
      } else {
        showAlert(
          'Sincronización fallida',
          'No se pudo sincronizar ningún pesaje. Intente nuevamente.'
        );
      }
    } catch (error) {
      console.error('Error durante la sincronización:', error);
      showAlert(
        'Error de sincronización',
        'Ocurrió un error al sincronizar los pesajes.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncSinglePesaje = async (pesaje: PesajeData, index: number) => {
    if (!usuario || !usuario.token) {
      showAlert('Error', 'Usuario no autenticado o token no disponible');
      return;
    }

    // Marcar este índice como en sincronización
    setSyncingIndices((prev) => [...prev, index]);

    try {
      console.log(`Intentando sincronizar pesaje individual #${index}`);

      // Usar el método existente de PesajeService para sincronizar un pesaje
      const result = await PesajeService.syncPesaje(pesaje);

      if (result.success) {
        console.log(`Pesaje #${index} sincronizado correctamente`);

        // Eliminar el pesaje de la cola usando su índice
        await removePesajesByIndices([index]);

        // Recargar la lista de pesajes pendientes
        const updatedPesajes = await getQueuedPesajes();
        setPendingPesajes(updatedPesajes);

        showAlert('Éxito', 'El pesaje ha sido sincronizado correctamente');
      } else {
        console.log(`Falló la sincronización del pesaje #${index}`);
        showAlert(
          'Error',
          'No se pudo sincronizar el pesaje. Intente nuevamente.'
        );
      }
    } catch (error) {
      console.error(`Error al sincronizar pesaje #${index}:`, error);
      showAlert('Error', 'Ocurrió un error al sincronizar el pesaje');
    } finally {
      // Quitar este índice de la lista de índices en sincronización
      setSyncingIndices((prev) => prev.filter((i) => i !== index));
    }
  };

  const handleDeleteSinglePesaje = async (index: number) => {
    showConfirmAlert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este pesaje de la cola de sincronización?',
      () => {}, // No action on cancel
      async () => {
        try {
          // Eliminar el pesaje de la cola por su índice
          await removePesajesByIndices([index]);

          // Recargar la lista de pesajes pendientes
          const updatedPesajes = await getQueuedPesajes();
          setPendingPesajes(updatedPesajes);

          showAlert('Éxito', 'El pesaje ha sido eliminado de la cola');
        } catch (error) {
          console.error(`Error al eliminar pesaje #${index}:`, error);
          showAlert('Error', 'No se pudo eliminar el pesaje');
        }
      }
    );
  };

  const getEmbarcacionNombreById = (id: number | undefined | null): string => {
    if (id === null || typeof id === 'undefined') return 'Desconocido';
    const embarcacion = listaEmbarcaciones.find((e) => e.id === id);
    return embarcacion ? embarcacion.nombre : `ID: ${id}`;
  };
  if (isLoading && !refreshing) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color="#005A9C" />
        <Text style={styles.loadingText}>Cargando pesajes pendientes...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#005A9C']}
          tintColor={'#005A9C'}
        />
      }
    >
      <Text style={styles.title}>
        Pesajes Pendientes ({pendingPesajes.length})
      </Text>

      {pendingPesajes.length === 0 && !isLoading && (
        <View style={styles.emptyContainer}>
          <Icon name="cloud-check-outline" size={60} color="#cccccc" />
          <Text style={styles.emptyMessage}>
            ¡Todo sincronizado! No hay pesajes pendientes.
          </Text>
        </View>
      )}

      {pendingPesajes.map((p, i) => (
        <View key={p.id || `pending-pesaje-${i}`} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Icon
                name="fish"
                size={24}
                color="#005A9C"
                style={styles.cardIcon}
              />
              <Text style={styles.cardTitle}>{p.tipoPez.toUpperCase()}</Text>
            </View>
            <Text style={styles.cardKilos}>
              {p.totalKilos?.toFixed(2) || '0.00'} kg
            </Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <Icon
                name="calendar-clock"
                size={16}
                color="#555"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Fecha: {new Date(p.fecha).toLocaleDateString()}{' '}
                {new Date(p.fecha).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon
                name="ship-wheel"
                size={16}
                color="#555"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Embarcación: {getEmbarcacionNombreById(p.embarcacionId)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon
                name="cash-multiple"
                size={16}
                color="#555"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Precio Unit.: ${p.precioUnitario.toLocaleString()}
              </Text>
            </View>
            {/* <View style={styles.infoRow}>
              <Icon
                name="account-hard-hat"
                size={16}
                color="#555"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Trabajador: {p.trabajador?.name || 'Desconocido'}
              </Text>
            </View> */}
            {/* <View style={styles.infoRow}>
              <Icon
                name="account-cash-outline"
                size={16}
                color="#555"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Comprador: {getPersonaNombre(p.compradorId)}
              </Text>
            </View> */}
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.totalAmount}>
              Total: ${p.totalConIVA?.toLocaleString() || '0.00'}
            </Text>

            {/* Nuevos botones para acciones individuales - Solo iconos */}
            <View style={styles.cardActions}>
              {/* Botón de sincronización individual */}
              {/* <TouchableOpacity
                style={[styles.actionButton, styles.syncButton]}
                onPress={() => handleSyncSinglePesaje(p, i)}
                disabled={isSyncing || syncingIndices.includes(i)}
              >
                {syncingIndices.includes(i) ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon name="sync" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity> */}

              {/* Botón de eliminación individual */}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteSinglePesaje(i)}
                disabled={isSyncing || syncingIndices.includes(i)}
              >
                <Icon name="delete" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {pendingPesajes.length > 0 && (
        <TouchableOpacity
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={syncAll}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
              style={styles.syncButtonIcon}
            />
          ) : (
            <Icon
              name="sync"
              size={20}
              color="#FFFFFF"
              style={styles.syncButtonIcon}
            />
          )}
          <Text style={styles.syncButtonText}>
            {isSyncing
              ? 'Sincronizando...'
              : `Sincronizar Todo (${pendingPesajes.length})`}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// Cross-platform alert function
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    // For web, use browser's alert
    window.alert(`${title}: ${message}`);
  } else {
    // For mobile platforms, use React Native's Alert
    Alert.alert(title, message);
  }
};

// Cross-platform confirmation alert function
const showConfirmAlert = (
  title: string,
  message: string,
  onCancel: () => void,
  onConfirm: () => void
) => {
  if (Platform.OS === 'web') {
    // For web, use browser's confirm
    const result = window.confirm(`${title}: ${message}`);
    if (result) {
      onConfirm();
    } else {
      onCancel();
    }
  } else {
    // For mobile platforms, use React Native's Alert with buttons
    Alert.alert(title, message, [
      {
        text: 'Cancelar',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: onConfirm,
      },
    ]);
  }
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 30, // Espacio al final
    paddingHorizontal: 15,
    flexGrow: 1,
    backgroundColor: '#F4F7FC',
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7FC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#34495E',
    marginVertical: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  cardKilos: {
    fontSize: 16,
    fontWeight: '600',
    color: '#005A9C',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555555',
  },
  cardFooter: {
    flexDirection: 'column',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
    gap: 10,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16A085',
    alignSelf: 'flex-end',
  },
  // Fix button styles
  syncButton: {
    flexDirection: 'row',
    backgroundColor: '#005A9C', // Restored original blue color
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 2,
  },
  syncButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  syncButtonIcon: {
    marginRight: 10,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 17,
    color: '#777777',
  },
});
