#!/bin/bash

echo "Instalando dependencias para actualizaciones..."

# Instalar expo-updates
npx expo install expo-updates

# Instalar otras dependencias requeridas
npx expo install expo-constants @react-native-async-storage/async-storage @react-native-community/netinfo

# Reconstruir el cache
npx expo start -c

echo "Configuración completada. Ahora puedes usar las actualizaciones OTA."
