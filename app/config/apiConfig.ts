import { Platform } from 'react-native';

// Dirección IP de tu computadora en la red local donde corre el backend de NaviPesca
// Ejemplo: Si tu backend Next.js corre en http://192.168.1.100:3000
const LOCAL_IP = '192.168.1.11'; // Reemplaza con la IP correcta de tu computadora
const API_PORT = '3000'; // Puerto donde corre tu backend Next.js

// La API de la aplicación Next.js generalmente está bajo /api
// Ejemplo: http://192.168.1.100:3000/api/pesajes
const API_BASE_PATH = '/api';

export const API_URL =
  Platform.OS === 'android'
    ? `http://${LOCAL_IP}:${API_PORT}${API_BASE_PATH}` // Para dispositivos Android
    : `http://localhost:${API_PORT}${API_BASE_PATH}`; // Para emuladores iOS o desarrollo web
