// app/screens/PesajeScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import useNetworkStatus from '../hooks/useNetworkStatus';
import { addPesajeToQueue } from '../storage/OfflineQueue';
import { EmbarcacionService } from '../services/EmbarcacionService';
import { PesajeService } from '../services/PesajeService';
import PesajeForm, { PesajeFormRef } from '../components/PesajeForm'; // Asegúrate que la ruta es correcta
import { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMBARCACIONES_CACHE_KEY = 'embarcaciones_cache';

type PesajeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Pesaje'
>;

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

export default function PesajeScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<PesajeScreenNavigationProp>();
  const isConnected = useNetworkStatus();
  const [embarcaciones, setEmbarcaciones] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pesajeFormRef = useRef<PesajeFormRef>(null);
  const [loadingEmbarcaciones, setLoadingEmbarcaciones] = useState(true);

  useEffect(() => {
    const gestionarEmbarcaciones = async () => {
      setLoadingEmbarcaciones(true);
      try {
        // 1. Intentar cargar desde AsyncStorage
        const cachedEmbarcaciones = await AsyncStorage.getItem(
          EMBARCACIONES_CACHE_KEY
        );
        if (cachedEmbarcaciones) {
          setEmbarcaciones(JSON.parse(cachedEmbarcaciones));
        }

        // 2. Si hay conexión, intentar actualizar desde el servicio
        if (isConnected) {
          const dataFromService = await EmbarcacionService.getEmbarcaciones();
          setEmbarcaciones(dataFromService);
          await AsyncStorage.setItem(
            EMBARCACIONES_CACHE_KEY,
            JSON.stringify(dataFromService)
          );
        } else if (!cachedEmbarcaciones) {
          // No hay conexión y no hay datos locales
          showAlert(
            'Modo sin conexión',
            'No hay datos de embarcaciones guardados localmente y no se pueden cargar en este momento. No podrá registrar pesajes hasta tener conexión para obtener la lista de embarcaciones.'
          );
        }
      } catch (error) {
        console.error('Error al gestionar embarcaciones:', error);
        if (!isConnected && embarcaciones.length === 0) {
          showAlert(
            'Error de Carga',
            'No se pudieron cargar las embarcaciones y no hay datos locales. Verifique su conexión o intente más tarde.'
          );
        } else if (isConnected) {
          showAlert(
            'Error de Red',
            'No se pudieron obtener las embarcaciones del servidor.'
          );
        }
        // Si hay error pero teníamos datos cacheados, se siguen usando esos.
      } finally {
        setLoadingEmbarcaciones(false);
      }
    };

    gestionarEmbarcaciones();
  }, [isConnected]);
  const handleSubmit = async (formDataFromForm: any) => {
    setIsSubmitting(true);

    if (
      !usuario ||
      typeof usuario.personaId === 'undefined' ||
      usuario.token === null
    ) {
      showAlert(
        'Error de autenticación',
        'No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.'
      );
      setIsSubmitting(false);
      return;
    }

    // Process formDataFromForm to ensure all fields have the correct type
    const processedFormData = {
      ...formDataFromForm,
      precioUnitario: Number(formDataFromForm.precioUnitario),
      embarcacionId: Number(formDataFromForm.embarcacionId),
      totalKilos: Number(formDataFromForm.totalKilos),
      totalSinIVA: Number(formDataFromForm.totalSinIVA),
      iva: Number(formDataFromForm.iva),
      totalConIVA: Number(formDataFromForm.totalConIVA),
    };

    const pesajePayload = {
      ...processedFormData,
      trabajadorId: usuario.nombre,
      compradorId: usuario.nombre,
      pagado: false,
      metodoPago: null,
    };

    // Eliminar el ID temporal de los bins si existe
    if (pesajePayload.bins) {
      pesajePayload.bins = pesajePayload.bins.map(
        (bin: { id?: string; [key: string]: any }) => {
          const { id, ...restOfBin } = bin;
          // Ensure all bin numeric fields are numbers
          return {
            ...restOfBin,
            pesoBruto: Number(restOfBin.pesoBruto),
            pesoTara: Number(restOfBin.pesoTara),
            pesoNeto: Number(restOfBin.pesoNeto),
          };
        }
      );
    }

    console.log(
      'Enviando pesajePayload:',
      JSON.stringify(pesajePayload, null, 2)
    ); // DEBUGGING: Uncomment to see the exact payload

    if (!isConnected) {
      try {
        await addPesajeToQueue(pesajePayload);
        console.log('Pesaje guardado localmente:', pesajePayload);
        showAlert('Guardado local', 'Pesaje guardado sin conexión');
        pesajeFormRef.current?.resetForm();
        navigation.navigate('Home');
      } catch (error) {
        console.error('Error al guardar pesaje localmente:', error);
        showAlert('Error', 'No se pudo guardar el pesaje localmente.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      await PesajeService.createPesaje(pesajePayload);
      showAlert('Éxito', 'Pesaje enviado correctamente');
      pesajeFormRef.current?.resetForm();
      navigation.navigate('Home');
    } catch (error: any) {
      // Tipar error como any para acceder a sus propiedades
      console.error('Error al enviar pesaje:', error);
      // Loguear más detalles del error si es un error de Axios
      if (error.isAxiosError) {
        console.error(
          'Axios error response:',
          JSON.stringify(error.response?.data, null, 2)
        );
        console.error('Axios error status:', error.response?.status);
        console.error(
          'Axios error headers:',
          JSON.stringify(error.response?.headers, null, 2)
        );
      } else {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
      showAlert(
        'Error',
        `No se pudo enviar el pesaje. ${
          error.response?.data?.message ||
          'Verifique los datos e intente de nuevo.'
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncPress = () => {
    navigation.navigate('Sync');
  };

  const isWeb = Platform.OS === 'web';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
      enabled={!isWeb} // Disable on web as it's not needed
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContentContainer,
          isWeb && styles.webScrollContainer,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <PesajeForm
          ref={pesajeFormRef}
          embarcaciones={embarcaciones}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting || loadingEmbarcaciones}
          isWeb={isWeb} // Pass isWeb prop to PesajeForm
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  webScrollContainer: {
    // Add web-specific styles for better handling of the scroll container
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
});
