import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity, // Importar TouchableOpacity
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; // Importar useNavigation
import { PesajeService } from '../services/PesajeService';
import { EmbarcacionService } from '../services/EmbarcacionService';
import { useAuth } from '../context/AuthContext';
import { PesajeData } from '../services/types';
import useNetworkStatus from '../hooks/useNetworkStatus';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Importar Icon
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Para tipar navigation
import { RootStackParamList } from '../navigation/types'; // Para tipar navigation

interface Embarcacion {
  id: number;
  nombre: string;
}

// Tipar la prop de navegación si se usa para navegar a detalles, etc.
type HistorialPesajesNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'HistorialPesajes' // Asumiendo que 'HistorialPesajes' es una ruta válida
>;

export default function HistorialPesajesScreen() {
  const { usuario } = useAuth();
  const isConnected = useNetworkStatus();
  const navigation = useNavigation<HistorialPesajesNavigationProp>(); // Hook de navegación
  const [pesajesDelDia, setPesajesDelDia] = useState<PesajeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda

  const fetchEmbarcacionesYPesajes = useCallback(
    async (isRefresh = false) => {
      // Control de concurrencia al inicio de la función
      if (!isRefresh && loading) return;
      if (isRefresh && refreshing) return;

      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      if (!usuario?.token) {
        Alert.alert('Error', 'Usuario no autenticado.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        const [todosLosPesajesApi] = await Promise.all([
          isConnected ? PesajeService.getPesajes() : Promise.resolve([]),
        ]);

        let pesajesParaMostrar = todosLosPesajesApi;

        if (!isConnected && !isRefresh) {
          Alert.alert(
            'Modo Offline',
            'Mostrando información limitada. Conéctese para ver todos los pesajes.'
          );
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);

        const filtrados = pesajesParaMostrar.filter((p) => {
          const fechaPesaje = new Date(p.fecha);
          return fechaPesaje >= hoy && fechaPesaje < manana;
        });
        setPesajesDelDia(filtrados);
      } catch (error) {
        console.error('Error al obtener datos para historial:', error);
        if (!isRefresh) {
          Alert.alert('Error', 'No se pudieron cargar los datos.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [usuario?.token, isConnected] // Dependencias correctas para la definición de la función
  );

  useFocusEffect(
    useCallback(() => {
      // Llama a la función de carga cuando la pantalla obtiene el foco.
      // La propia función fetchEmbarcacionesYPesajes maneja la lógica
      // de no ejecutarse si ya está en proceso (loading/refreshing).
      fetchEmbarcacionesYPesajes();
    }, [fetchEmbarcacionesYPesajes]) // Depender solo de la función de fetch memoizada
  );

  const onRefresh = useCallback(() => {
    fetchEmbarcacionesYPesajes(true);
  }, [fetchEmbarcacionesYPesajes]);

  const filteredPesajes = useMemo(() => {
    if (!searchTerm.trim()) {
      return pesajesDelDia;
    }
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return pesajesDelDia.filter((p) => {
      const tipoPezMatch = p.tipoPez
        .toLowerCase()
        .includes(lowercasedSearchTerm);

      const embarcacionMatch = p.embarcacion?.nombre
        .toLowerCase()
        .includes(lowercasedSearchTerm);
      return tipoPezMatch || embarcacionMatch;
    });
  }, [pesajesDelDia, searchTerm]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#005A9C" />
        <Text style={styles.loadingText}>Cargando pesajes del día...</Text>
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
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={22} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por pez o embarcación..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#888"
        />
      </View>
      <Text style={styles.title}>
        Pesajes de Hoy ({filteredPesajes.length})
      </Text>
      {filteredPesajes.length === 0 && !loading && !refreshing && (
        <View style={styles.emptyContainer}>
          <Icon name="fish-off" size={60} color="#cccccc" />
          <Text style={styles.emptyMessage}>
            {searchTerm
              ? 'No se encontraron pesajes.'
              : 'Aún no hay pesajes registrados hoy.'}
          </Text>
        </View>
      )}
      {filteredPesajes.map((p, i) => (
        <TouchableOpacity
          key={p.id || `pesaje-${i}`}
          style={styles.card}
          activeOpacity={0.7}
          // onPress={() => navigation.navigate('DetallePesaje', { pesajeId: p.id })} // Ejemplo de navegación
        >
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
                name="clock-outline"
                size={16}
                color="#555"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Hora:{' '}
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
                Embarcación: {p.embarcacion?.nombre}
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
            <View style={styles.infoRow}>
              <Icon
                name="account-hard-hat"
                size={16}
                color="#555"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Trabajador: {p.trabajadorId || 'Desconocido'}
              </Text>
            </View>
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
            {p.pagado !== undefined && (
              <View
                style={[
                  styles.statusBadge,
                  p.pagado ? styles.pagadoBadge : styles.noPagadoBadge,
                ]}
              >
                <Icon
                  name={
                    p.pagado ? 'check-circle-outline' : 'alert-circle-outline'
                  }
                  size={14}
                  color="#fff"
                />
                <Text style={styles.statusText}>
                  {p.pagado ? 'Pagado' : 'No Pagado'}
                  {p.pagado && p.metodoPago ? ` (${p.metodoPago})` : ''}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    paddingHorizontal: 15,
    flexGrow: 1,
    backgroundColor: '#F4F7FC', // Fondo más claro y consistente
  },
  centered: {
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
    color: '#34495E', // Color de título más oscuro
    marginVertical: 20,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginTop: 20,
    marginBottom: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16A085', // Un verde para el total
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12, // Más redondeado
  },
  pagadoBadge: {
    backgroundColor: '#2ECC71', // Verde más brillante
  },
  noPagadoBadge: {
    backgroundColor: '#E74C3C', // Rojo más brillante
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 17,
    color: '#777777',
  },
  // Estilos anteriores para statusBase, pagado, noPagado pueden ser eliminados si no se usan
});
