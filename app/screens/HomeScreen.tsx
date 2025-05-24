import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Animated,
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
  color = '#007AFF',
}) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View
      style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, { borderTopColor: color }]}
      >
        <Icon name={iconName} size={36} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { usuario } = useAuth();

  return (
    <ImageBackground
      source={require('../../assets/fondo-app-navipesca.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.userName}>
            {usuario?.nombre?.trim()
              ? usuario.nombre
              : 'Bienvenido a NaviPesca'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.grid}>
            <ActionCard
              title="Registrar Pesaje"
              iconName="scale-balance"
              onPress={() => navigation.navigate('Pesaje')}
              color="#00BFFF"
            />
            <ActionCard
              title="Pesajes de Hoy"
              iconName="calendar-check-outline"
              onPress={() => navigation.navigate('HistorialPesajes')}
              color="#2ECC71"
            />
            <ActionCard
              title="Sincronizar"
              iconName="sync"
              onPress={() => navigation.navigate('Sync')}
              color="#F39C12"
            />
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    color: '#ECF0F1',
  },
  userName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ECF0F1',
    marginBottom: 10,
  },
  grid: {
    gap: 15,
  },
  cardContainer: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFFEE',
    borderRadius: 15,
    padding: 20,
    borderTopWidth: 4,
    elevation: 3,
    alignItems: 'flex-start',
    opacity: 0.9,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 10,
  },
});
