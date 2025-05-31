import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

interface ActionCardProps {
  title: string;
  iconName: string;
  onPress: () => void;
  color?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  iconName,
  onPress,
  color = '#64B5F6',
}) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View
      style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <View style={styles.iconWrapper}>
          <Icon name={iconName} size={26} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { usuario } = useAuth();

  return (
    <>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../../assets/fondo-app-navipesca.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>
              Hola, {usuario?.nombre?.split(' ')[0] || 'Navegante'}
            </Text>
            <Text style={styles.subtitle}>¿Qué necesitas hacer hoy?</Text>
          </View>

          <View style={styles.gridContainer}>
            <ActionCard
              title="Registrar Pesaje"
              iconName="scale"
              onPress={() => navigation.navigate('Pesaje')}
              color="#64B5F6" // Azul claro
            />
            <ActionCard
              title="Historial"
              iconName="history"
              onPress={() => navigation.navigate('HistorialPesajes')}
              color="#80CBC4" // Verde azulado claro
            />
            <ActionCard
              title="Sincronizar"
              iconName="sync"
              onPress={() => navigation.navigate('Sync')}
              color="#FFD54F" // Amarillo suave
            />
          </View>
        </ScrollView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    marginBottom: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  gridContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  cardContainer: {
    backgroundColor: 'rgba(10, 30, 50, 0.75)', // Azul marino oscuro semitransparente
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(100, 181, 246, 0.7)', // Borde izquierdo azul claro
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  card: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF', // Texto blanco para contraste con el fondo oscuro
    letterSpacing: 0.2,
  },
});
