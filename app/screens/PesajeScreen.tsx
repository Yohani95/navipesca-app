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

type PesajeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Pesaje'
>;

export default function PesajeScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<PesajeScreenNavigationProp>();
  const isConnected = useNetworkStatus();
  const [embarcaciones, setEmbarcaciones] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pesajeFormRef = useRef<PesajeFormRef>(null);

  useEffect(() => {
    const fetchEmbarcaciones = async () => {
      try {
        const data = await EmbarcacionService.getEmbarcaciones();
        setEmbarcaciones(data);
      } catch (error) {
        console.error('Error al obtener embarcaciones:', error);
        Alert.alert('Error', 'No se pudieron cargar las embarcaciones');
      }
    };

    fetchEmbarcaciones();
  }, []);

  const handleSubmit = async (formDataFromForm: any) => {
    setIsSubmitting(true);

    if (
      !usuario ||
      typeof usuario.personaId === 'undefined' ||
      usuario.token === null
    ) {
      Alert.alert(
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
      trabajadorId: usuario.personaId,
      compradorId: usuario.personaId,
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
        Alert.alert('Guardado local', 'Pesaje guardado sin conexión');
        pesajeFormRef.current?.resetForm();
        navigation.navigate('Home');
      } catch (error) {
        console.error('Error al guardar pesaje localmente:', error);
        Alert.alert('Error', 'No se pudo guardar el pesaje localmente.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      await PesajeService.createPesaje(pesajePayload);
      Alert.alert('Éxito', 'Pesaje enviado correctamente');
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
      Alert.alert(
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <PesajeForm
          ref={pesajeFormRef}
          embarcaciones={embarcaciones}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
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
    paddingHorizontal: 10, // Reducir un poco si las tarjetas tienen su propio padding
    paddingVertical: 15,
  },
});
