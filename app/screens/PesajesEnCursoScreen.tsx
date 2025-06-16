import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';
import { getDraftPesajes, deleteDraftPesaje } from '../helpers/PesajeHelper';

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PesajesEnCurso'
>;

export default function PesajesEnCursoScreen() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [embarcaciones, setEmbarcaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  // Cargar datos cada vez que la pantalla obtiene el foco
  useFocusEffect(
    React.useCallback(() => {
      fetchDrafts();
      checkConnection();

      // Suscribirse al estado de la conexión
      const unsubscribe = NetInfo.addEventListener((state) => {
        setIsConnected(!!state.isConnected);
      });

      return () => {
        unsubscribe();
      };
    }, [])
  );

  const checkConnection = async () => {
    const netInfo = await NetInfo.fetch();
    setIsConnected(!!netInfo.isConnected);
  };

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      // Usar la función helper para obtener los borradores
      const draftsData = await getDraftPesajes();

      // Ordenar por fecha de actualización (más reciente primero)
      draftsData.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || a.fecha).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || b.fecha).getTime();
        return dateB - dateA;
      });

      setDrafts(draftsData);

      // Cargar embarcaciones para mostrar nombres
      const embarcacionesCache = await AsyncStorage.getItem(
        'embarcaciones_cache'
      );
      if (embarcacionesCache) {
        setEmbarcaciones(JSON.parse(embarcacionesCache));
      } else {
        // Datos mock si no hay caché
        const mockEmbarcaciones = [
          { id: 1, nombre: 'Nautilus I' },
          { id: 2, nombre: 'Pescadora del Sur' },
          { id: 3, nombre: 'Oceánica' },
          { id: 4, nombre: 'Mar Azul' },
        ];
        setEmbarcaciones(mockEmbarcaciones);
        await AsyncStorage.setItem(
          'embarcaciones_cache',
          JSON.stringify(mockEmbarcaciones)
        );
      }
    } catch (error) {
      console.error('Error al cargar borradores:', error);
      Alert.alert('Error', 'No se pudieron cargar los pesajes en curso');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDrafts();
  };

  const handleContinue = (draft: any) => {
    navigation.navigate('Pesaje', { draft });
  };

  const handleNewPesaje = async () => {
    navigation.navigate('Pesaje', { draft: null });
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro que deseas eliminar este pesaje en curso?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Usar la función helper para eliminar el borrador
              await deleteDraftPesaje(id);
              // Actualizar la lista local de borradores
              setDrafts(drafts.filter((d) => d.id !== id));
            } catch (error) {
              console.error('Error al eliminar pesaje:', error);
              Alert.alert('Error', 'No se pudo eliminar el pesaje');
            }
          },
        },
      ]
    );
  };

  const getEmbarcacionNombre = (embarcacionId: number | null) => {
    if (!embarcacionId) return 'Sin especificar';
    const embarcacion = embarcaciones.find((e) => e.id === embarcacionId);
    return embarcacion ? embarcacion.nombre : `ID: ${embarcacionId}`;
  };

  const formatFecha = (fechaString?: string | Date) => {
    if (!fechaString) return 'Sin fecha';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calcular total de kilos y valor para un pesaje
  const calcularTotales = (draft: any) => {
    if (!draft.bins || draft.bins.length === 0) {
      return { kilos: 0, valor: 0 };
    }

    const kilos = draft.bins.reduce((sum, bin) => sum + (bin.pesoNeto || 0), 0);
    const valor = kilos * (draft.precioUnitario || 0);

    return { kilos, valor };
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#005A9C" />
        <Text style={styles.loadingText}>Cargando pesajes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Icon name="cloud-off-outline" size={20} color="#fff" />
          <Text style={styles.offlineText}>Modo sin conexión</Text>
        </View>
      )}

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Pesajes en Curso</Text>
          <Text style={styles.headerSubtitle}>
            {drafts.length} pesaje{drafts.length !== 1 ? 's' : ''} guardado
            {drafts.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleNewPesaje}>
          <Icon name="scale-balance" size={18} color="#FFF" />
          <Text style={styles.addButtonText}>Nuevo Pesaje</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={drafts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const { kilos, valor } = calcularTotales(item);
          const embarcacionNombre = getEmbarcacionNombre(item.embarcacionId);

          return (
            <TouchableOpacity
              onPress={() => handleContinue(item)}
              style={styles.draftCard}
              activeOpacity={0.7}
            >
              <View style={styles.draftHeader}>
                <View style={styles.draftHeaderLeft}>
                  <Icon
                    name={item.tipoPez ? 'fish' : 'help-circle-outline'}
                    size={24}
                    color="#005A9C"
                  />
                  <View style={styles.draftHeaderTexts}>
                    <Text style={styles.draftTitle}>
                      {item.tipoPez
                        ? item.tipoPez.charAt(0).toUpperCase() +
                          item.tipoPez.slice(1)
                        : 'Pesaje sin tipo'}
                    </Text>
                    <Text style={styles.draftDate}>
                      {formatFecha(item.createdAt || item.fecha)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteButton}
                >
                  <Icon name="delete-outline" size={22} color="#E74C3C" />
                </TouchableOpacity>
              </View>

              <View style={styles.draftInfo}>
                <View style={styles.infoItem}>
                  <Icon name="ship-wheel" size={16} color="#555" />
                  <Text style={styles.infoText}>{embarcacionNombre}</Text>
                </View>

                <View style={styles.infoItem}>
                  <Icon name="cube-outline" size={16} color="#555" />
                  <Text style={styles.infoText}>
                    {item.bins?.length || 0} bin
                    {item.bins?.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.draftFooter}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Total Kg:</Text>
                  <Text style={styles.totalValue}>{kilos.toFixed(2)} kg</Text>
                </View>

                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Valor:</Text>
                  <Text style={styles.totalValue}>
                    ${valor.toLocaleString('es-CL')}
                  </Text>
                </View>
              </View>

              <View style={styles.draftActions}>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => handleContinue(item)}
                >
                  <Icon name="chevron-right" size={20} color="#FFF" />
                  <Text style={styles.continueButtonText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="scale-balance" size={60} color="#DDD" />
            <Text style={styles.emptyTitle}>No hay pesajes en curso</Text>
            <Text style={styles.emptyText}>
              Los pesajes que guardes como borrador aparecerán aquí
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleNewPesaje}
            >
              <Text style={styles.emptyButtonText}>Crear Nuevo Pesaje</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#005A9C']}
            tintColor="#005A9C"
          />
        }
        contentContainerStyle={
          drafts.length === 0 ? { flex: 1 } : { paddingBottom: 20 }
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  offlineBanner: {
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  offlineText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#005A9C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: '500',
  },
  draftCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  draftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  draftHeaderTexts: {
    marginLeft: 12,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  draftDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  deleteButton: {
    padding: 5,
  },
  draftInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
  },
  draftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
  },
  totalItem: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#005A9C',
  },
  draftActions: {
    alignItems: 'flex-end',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#005A9C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#005A9C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
