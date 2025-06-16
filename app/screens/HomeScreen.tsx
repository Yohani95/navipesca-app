import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import ActionCard from '../components/ActionCard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import useNetworkStatus from '../hooks/useNetworkStatus';

const HomeScreen = ({ navigation }: any) => {
  const { usuario } = useAuth();
  const isConnected = useNetworkStatus(); // Simulación de conexión a internet
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

  const statsCards = [
    { label: 'Pesajes Hoy', value: '12', icon: 'chart-line', color: '#3498DB' },
    {
      label: 'Total KG',
      value: '150.000',
      icon: 'weight-kilogram',
      color: '#2ECC71',
    },
    {
      label: 'Pendientes',
      value: '3',
      icon: 'clock-outline',
      color: '#E74C3C',
    },
  ];

  return (
    <ImageBackground
      source={require('../../assets/fondo-azul.png')} // Ajusta la ruta según tu imagen
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

          {/* Header con gradiente */}
          {/* <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeText}>¡Bienvenido!</Text>
                <Text style={styles.userName}>
                  {usuario?.nombre || 'Usuario'}
                </Text>
                <View style={styles.roleContainer}>
                  <Icon name="account-circle" size={16} color="#E3F2FD" />
                  <Text style={styles.roleText}>Trabajador de Pesca</Text>
                </View>
              </View>
              <View style={styles.headerIcon}>
                <Icon name="waves" size={40} color="#E3F2FD" />
              </View>
            </View>
          </View> */}

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Cards de estadísticas */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Resumen de Hoy</Text>
              <View style={styles.statsGrid}>
                {statsCards.map((stat, index) => (
                  <View
                    key={index}
                    style={[
                      styles.statCard,
                      {
                        borderLeftColor: stat.color,
                        padding: 10,
                        marginHorizontal: 2,
                      },
                    ]}
                  >
                    <View style={styles.statHeader}>
                      <Icon name={stat.icon} size={20} color={stat.color} />
                      <Text style={[styles.statValue, { fontSize: 11 }]}>
                        {stat.value}
                      </Text>
                    </View>
                    <Text style={[styles.statLabel, { fontSize: 10 }]}>
                      {stat.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Acciones principales */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Acciones Principales</Text>
              <View style={styles.actionsGrid}>
                {navigationActions.map((action, index) => (
                  <View key={action.title} style={styles.actionCardWrapper}>
                    <ActionCard
                      title={action.title}
                      iconName={action.iconName}
                      onPress={action.onPress}
                      color={action.color}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Información adicional */}
            {!isConnected && (
              <View style={styles.infoSection}>
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
  header: {
    backgroundColor: 'rgba(26, 35, 126, 0.9)', // Más transparente para mostrar la imagen
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#1A237E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        background:
          'linear-gradient(135deg, rgba(26, 35, 126, 0.9) 0%, rgba(57, 73, 171, 0.9) 100%)',
        boxShadow: '0 4px 20px rgba(26, 35, 126, 0.3)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#E3F2FD',
    marginBottom: 4,
    fontWeight: '400',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    color: '#E3F2FD',
    marginLeft: 6,
    fontWeight: '500',
  },
  headerIcon: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Más transparente
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    borderLeftWidth: 4,

    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(100, 116, 139, 0.2)',
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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
});

export default HomeScreen;
