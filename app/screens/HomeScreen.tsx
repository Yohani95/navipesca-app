import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import ActionCard from '../components/ActionCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useNetworkStatus from '../hooks/useNetworkStatus';
import { useFocusEffect } from '@react-navigation/native';
import { getDraftPesajes } from '../helpers/PesajeHelper';
import { getSyncStatus } from '../storage/OfflineQueue';
import { PesajeService } from '../services/PesajeService';

const HomeScreen = ({ navigation }: any) => {
  const { usuario } = useAuth();
  const isConnected = useNetworkStatus();
  const [stats, setStats] = useState({
    pesajesHoy: 0,
    totalKg: 0,
    pendientes: 0,
    borradores: 0,
    completos: 0,
    incompletos: 0,
  });
  const [loading, setLoading] = useState(true);

  // Detectar si estamos en web
  const isWeb = Platform.OS === 'web';
  const windowWidth = Dimensions.get('window').width;

  // Cargar estadísticas reales cuando la pantalla gana foco
  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    setLoading(true);
    try {
      // Obtener borradores
      const drafts = await getDraftPesajes();
      const completos = drafts.filter((d) => {
        const hasBinsWithWeight = d.bins?.some((bin) => bin.completo);
        return (
          hasBinsWithWeight && d.tipoPez && d.embarcacionId && d.precioUnitario
        );
      }).length;
      const incompletos = drafts.length - completos;

      // Obtener pesajes pendientes de sincronización
      const syncStatus = await getSyncStatus();

      // Intentar cargar pesajes de hoy desde el servidor (si hay conexión)
      let pesajesHoy = 0;
      let totalKg = 0;

      if (isConnected) {
        try {
          const pesajes = await PesajeService.getPesajes();
          // Filtrar los pesajes de hoy
          const hoy = new Date();
          const pesajesDeHoy = pesajes.filter((p: any) => {
            const fechaPesaje = new Date(p.fecha);
            return (
              fechaPesaje.setHours(0, 0, 0, 0) === hoy.setHours(0, 0, 0, 0)
            );
          });

          pesajesHoy = pesajesDeHoy.length;
          totalKg = pesajesDeHoy.reduce(
            (sum: number, p: any) => sum + (p.totalKilos || 0),
            0
          );
        } catch (error) {
          console.log('Error al cargar pesajes del servidor:', error);
        }
      }

      setStats({
        pesajesHoy,
        totalKg,
        pendientes: syncStatus.pendingCount || 0,
        borradores: drafts.length,
        completos,
        incompletos,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Configurar tarjetas de estadísticas con datos reales
  const statsCards = [
    {
      label: 'Pesajes Hoy',
      value: loading ? '...' : `${stats.pesajesHoy}`,
      icon: 'chart-line',
      color: '#3498DB',
      onPress: () => navigation.navigate('HistorialPesajes'),
    },
    {
      label: 'Kg Registrados',
      value: loading ? '...' : `${stats.totalKg.toLocaleString('es-CL')}`,
      icon: 'weight-kilogram',
      color: '#2ECC71',
      onPress: () => navigation.navigate('HistorialPesajes'),
    },
    {
      label: 'Pendientes',
      value: loading ? '...' : `${stats.pendientes}`,
      icon: 'clock-outline',
      color: '#E74C3C',
      onPress: () => navigation.navigate('Sync'),
    },
  ];

  // Nuevas tarjetas para mostrar los borradores
  const draftCards = [
    {
      label: 'Borradores',
      value: loading ? '...' : `${stats.borradores}`,
      icon: 'file-document-outline',
      color: '#9B59B6',
      onPress: () => navigation.navigate('PesajesEnCurso'),
    },
    {
      label: 'Completos',
      value: loading ? '...' : `${stats.completos}`,
      icon: 'check-circle-outline',
      color: '#27AE60',
      onPress: () => navigation.navigate('PesajesEnCurso'),
    },
    {
      label: 'Incompletos',
      value: loading ? '...' : `${stats.incompletos}`,
      icon: 'alert-circle-outline',
      color: '#F39C12',
      onPress: () => navigation.navigate('PesajesEnCurso'),
    },
  ];

  const navigationActions = [
    {
      title: 'Pesajes',
      iconName: 'scale',
      color: '#64B5F6',
      onPress: () => navigation.navigate('PesajesEnCurso'),
    },
    {
      title: 'Sincronizar',
      iconName: 'cloud-sync',
      color: '#80CBC4',
      onPress: () => navigation.navigate('Sync'),
    },
    {
      title: 'Historial',
      iconName: 'history',
      color: '#FFD54F',
      onPress: () => navigation.navigate('HistorialPesajes'),
    },
  ];

  return (
    <ImageBackground
      source={require('../../assets/fondo-azul.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              isWeb && styles.webScrollContent,
            ]}
          >
            {isWeb && (
              <View style={styles.webHeader}>
                <Text style={styles.webHeaderTitle}>
                  Panel de Control NaviPesca
                </Text>
                <Text style={styles.webHeaderSubtitle}>
                  Bienvenido, {usuario?.nombre || 'Usuario'}
                </Text>
              </View>
            )}

            {/* Sección de estadísticas principales */}
            <View
              style={[styles.statsSection, isWeb && styles.webStatsSection]}
            >
              <Text style={styles.sectionTitle}>Resumen de Hoy</Text>
              <View style={[styles.statsGrid, isWeb && styles.webStatsGrid]}>
                {statsCards.map((stat, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.statCard, isWeb && styles.webStatCard]}
                    onPress={stat.onPress}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: `${stat.color}20` },
                        isWeb && styles.webStatIconContainer,
                      ]}
                    >
                      <Icon
                        name={stat.icon}
                        size={isWeb ? 32 : 24}
                        color={stat.color}
                      />
                    </View>
                    <Text
                      style={[styles.statValue, isWeb && styles.webStatValue]}
                    >
                      {stat.value}
                    </Text>
                    <Text
                      style={[styles.statLabel, isWeb && styles.webStatLabel]}
                    >
                      {stat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Nueva sección de borradores */}
            <View
              style={[styles.statsSection, isWeb && styles.webStatsSection]}
            >
              <Text style={styles.sectionTitle}>Pesajes en Curso</Text>
              <View style={[styles.statsGrid, isWeb && styles.webStatsGrid]}>
                {draftCards.map((card, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.statCard, isWeb && styles.webStatCard]}
                    onPress={card.onPress}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.statIconContainer,
                        { backgroundColor: `${card.color}20` },
                        isWeb && styles.webStatIconContainer,
                      ]}
                    >
                      <Icon
                        name={card.icon}
                        size={isWeb ? 32 : 24}
                        color={card.color}
                      />
                    </View>
                    <Text
                      style={[styles.statValue, isWeb && styles.webStatValue]}
                    >
                      {card.value}
                    </Text>
                    <Text
                      style={[styles.statLabel, isWeb && styles.webStatLabel]}
                    >
                      {card.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Acciones principales */}
            <View
              style={[styles.actionsSection, isWeb && styles.webActionsSection]}
            >
              <Text style={styles.sectionTitle}>Acciones Principales</Text>
              <View
                style={[styles.actionsGrid, isWeb && styles.webActionsGrid]}
              >
                {navigationActions.map((action, index) => (
                  <View
                    key={action.title}
                    style={[
                      styles.actionCardWrapper,
                      isWeb && styles.webActionCardWrapper,
                    ]}
                  >
                    <ActionCard
                      title={action.title}
                      iconName={action.iconName}
                      onPress={action.onPress}
                      color={action.color}
                      isWeb={isWeb}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Información adicional */}
            {!isConnected && (
              <View
                style={[styles.infoSection, isWeb && styles.webInfoSection]}
              >
                <View style={styles.infoCard}>
                  <Icon name="information-outline" size={24} color="#64B5F6" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>Modo Offline Activado</Text>
                    <Text style={styles.infoDescription}>
                      Los pesajes se guardarán localmente hasta que tengas
                      conexión
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Overlay semi-transparente para mejorar legibilidad
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF', // Cambiar a blanco para mejor contraste sobre la imagen
    marginBottom: 16,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Más transparente
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  actionsGrid: {
    gap: 16,
  },
  actionCardWrapper: {
    marginBottom: 8,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  infoCard: {
    backgroundColor: 'rgba(235, 248, 255, 0.95)', // Más transparente
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(191, 219, 254, 0.8)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#3730A3',
    lineHeight: 20,
  },

  // Nuevos estilos específicos para web
  webScrollContent: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
    paddingBottom: 60,
  },
  webHeader: {
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  webHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 6,
  },
  webHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  webStatsSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  webStatsGrid: {
    flexWrap: 'wrap',
    gap: 16,
  },
  webStatCard: {
    flexBasis: Dimensions.get('window').width / 3 - 16,
    flexGrow: 1,
    flexShrink: 0,
    marginHorizontal: 0,
    paddingVertical: 20,
    ...Platform.select({
      web: {
        transition: 'transform 0.2s, box-shadow 0.2s',
      },
    }),
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  webStatIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  webStatValue: {
    fontSize: 24,
    marginVertical: 8,
  },
  webStatLabel: {
    fontSize: 14,
  },
  webActionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  webActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  webActionCardWrapper: {
    width: Dimensions.get('window').width / 3 - 16,
    marginBottom: 16,
    minWidth: 250,
  },
  webInfoSection: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    marginTop: 10,
  },
});

export default HomeScreen;
