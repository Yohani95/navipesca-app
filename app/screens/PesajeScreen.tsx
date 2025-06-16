// app/screens/PesajeScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import useNetworkStatus from '../hooks/useNetworkStatus';
import { addPesajeToQueue } from '../storage/OfflineQueue';
import { EmbarcacionService } from '../services/EmbarcacionService';
import { PesajeService } from '../services/PesajeService';
import PesajeForm, { PesajeFormRef } from '../components/PesajeForm';
import { RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { savePesajeDraft, deleteDraftPesaje } from '../helpers/PesajeHelper';

const EMBARCACIONES_CACHE_KEY = 'embarcaciones_cache';

type PesajeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Pesaje'
>;

export default function PesajeScreen() {
  const route = useRoute();
  const navigation = useNavigation<PesajeScreenNavigationProp>();
  const { usuario } = useAuth();
  const isConnected = useNetworkStatus();
  const [embarcaciones, setEmbarcaciones] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const pesajeFormRef = useRef<PesajeFormRef>(null);
  const [loadingEmbarcaciones, setLoadingEmbarcaciones] = useState(true);
  const { draft } = (route.params as { draft: any }) || { draft: null };

  // Cargar embarcaciones y configurar navegación
  useEffect(() => {
    loadEmbarcaciones();

    // Cuando se carga un nuevo draft (o se inicia uno nuevo), resetear el formulario
    if (pesajeFormRef.current) {
      // Si no hay draft, resetear el formulario
      if (!draft && pesajeFormRef.current.resetForm) {
        pesajeFormRef.current.resetForm();
      }
    }

    // Configurar navegación cuando se presiona el botón atrás
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={handleBackPress} style={{ marginLeft: 15 }}>
          <Icon name="arrow-left" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, draft]); // Añadir draft como dependencia

  // Movemos la lógica del BackHandler a useFocusEffect para que solo se active cuando la pantalla tiene el foco
  useFocusEffect(
    React.useCallback(() => {
      console.log('useFocusEffect called');
      // Configurar manejo del botón de retroceso en Android SOLO cuando la pantalla está enfocada
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );

      // Limpieza: remover el listener cuando la pantalla pierde el foco
      return () => {
        backHandler.remove();
      };
    }, [])
  );

  const loadEmbarcaciones = async () => {
    setLoadingEmbarcaciones(true);
    try {
      // Cargar desde caché primero
      const cachedData = await AsyncStorage.getItem(EMBARCACIONES_CACHE_KEY);

      if (cachedData) {
        setEmbarcaciones(JSON.parse(cachedData));
      }

      // Si hay conexión, intentar actualizar
      if (isConnected) {
        const freshData = await EmbarcacionService.getEmbarcaciones();
        setEmbarcaciones(freshData);
        await AsyncStorage.setItem(
          EMBARCACIONES_CACHE_KEY,
          JSON.stringify(freshData)
        );
      } else if (!cachedData) {
        // Sin conexión y sin datos en caché, usar datos mock
        const mockEmbarcaciones = [
          { id: 1, nombre: 'Nautilus I' },
          { id: 2, nombre: 'Pescadora del Sur' },
          { id: 3, nombre: 'Oceánica' },
          { id: 4, nombre: 'Mar Azul' },
        ];
        setEmbarcaciones(mockEmbarcaciones);
        await AsyncStorage.setItem(
          EMBARCACIONES_CACHE_KEY,
          JSON.stringify(mockEmbarcaciones)
        );
      }
    } catch (error) {
      console.error('Error al cargar embarcaciones:', error);
      // Usar datos mock en caso de error
      const mockEmbarcaciones = [
        { id: 1, nombre: 'Nautilus I' },
        { id: 2, nombre: 'Pescadora del Sur' },
        { id: 3, nombre: 'Oceánica' },
        { id: 4, nombre: 'Mar Azul' },
      ];
      setEmbarcaciones(mockEmbarcaciones);
    } finally {
      setLoadingEmbarcaciones(false);
    }
  };

  // Manejador del botón atrás
  const handleBackPress = () => {
    // Solo mostrar diálogo si hay datos en el formulario
    const currentValues = pesajeFormRef.current?.getCurrentValues?.();
    const hasBins = currentValues?.bins?.length > 0;
    const hasTipoPez = currentValues?.tipoPez;
    const hasEmbarcacion = currentValues?.embarcacionId;

    // Si el formulario está vacío o no hay cambios, volver directamente
    if (!hasBins && !hasTipoPez && !hasEmbarcacion) {
      navigation.navigate('PesajesEnCurso');
      return true;
    }

    // Preguntar si quiere guardar como borrador antes de salir
    Alert.alert(
      'Salir del pesaje',
      '¿Deseas guardar este pesaje como borrador antes de salir?',
      [
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            // Asegurar que se resetea correctamente el formulario
            if (pesajeFormRef.current?.resetForm) {
              pesajeFormRef.current.resetForm();
            }
            navigation.navigate('PesajesEnCurso');
          },
        },
        {
          text: 'Guardar borrador',
          onPress: async () => {
            await handleSaveDraft();
            // Asegurar que se resetea correctamente el formulario después de guardar
            if (pesajeFormRef.current?.resetForm) {
              pesajeFormRef.current.resetForm();
            }
            navigation.navigate('PesajesEnCurso');
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
    return true; // Previene el comportamiento predeterminado
  };

  const handleSaveDraft = async () => {
    if (!pesajeFormRef.current) return;

    setIsSaving(true);
    try {
      // Obtener valores actuales del formulario
      const currentValues = pesajeFormRef.current.getCurrentValues?.();

      if (!currentValues) {
        throw new Error('No se pudieron obtener los valores del formulario');
      }

      // Si no tiene datos suficientes, no guardar
      if (
        !currentValues.tipoPez &&
        !currentValues.embarcacionId &&
        (!currentValues.bins || currentValues.bins.length === 0)
      ) {
        setIsSaving(false);
        Alert.alert(
          'Advertencia',
          'No hay suficientes datos para guardar un borrador.'
        );
        return;
      }

      // Guardar usando nuestra función helper
      const savedDraft = await savePesajeDraft(currentValues);

      Alert.alert('Guardado', 'El pesaje ha sido guardado como borrador', [
        { text: 'OK', onPress: () => navigation.navigate('PesajesEnCurso') },
      ]);
    } catch (error) {
      console.error('Error al guardar borrador:', error);
      Alert.alert('Error', 'No se pudo guardar el borrador del pesaje');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (formValues: any) => {
    setIsSubmitting(true);

    // Validar que el usuario esté autenticado
    if (!usuario?.personaId || !usuario?.token) {
      Alert.alert(
        'Error de autenticación',
        'No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.'
      );
      setIsSubmitting(false);
      return;
    }

    // Guardar el ID del borrador si existe, para eliminarlo después
    const draftId = formValues.id;
    const isDraft = !!draftId;

    // console.log(
    //   `Es un borrador: ${isDraft ? 'Sí' : 'No'}, ID: ${draftId || 'N/A'}`
    // );
    // console.log(
    //   'Valores originales del formulario:',
    //   JSON.stringify(formValues, null, 2)
    // );

    // IMPORTANTE: Crear una copia limpia del objeto sin propiedades problemáticas
    // que podrían causar error 500 en el servidor
    const cleanValues = { ...formValues };

    // Eliminar propiedades que podrían causar problemas en el servidor
    delete cleanValues.id; // Eliminar ID local
    delete cleanValues.createdAt; // Eliminar fechas locales
    delete cleanValues.updatedAt;

    // Si hay otras propiedades problemáticas, eliminarlas también
    delete cleanValues.syncStatus;
    delete cleanValues.createdOffline;

    // Crear una copia limpia del pesaje para enviar al servidor
    const pesajePayload = {
      ...cleanValues,
      // Asegurar que todos los campos numéricos sean realmente números
      precioUnitario: Number(cleanValues.precioUnitario),
      embarcacionId: Number(cleanValues.embarcacionId),
      totalKilos: Number(cleanValues.totalKilos || 0),
      totalSinIVA: Number(cleanValues.totalSinIVA || 0),
      iva: Number(cleanValues.iva || 0),
      totalConIVA: Number(cleanValues.totalConIVA || 0),
      trabajadorId: usuario.nombre,
      compradorId: usuario.nombre,
      pagado: false,
      metodoPago: null,
      // Asegurar que la fecha esté en formato ISO
      fecha: new Date().toISOString(),
    };

    // Eliminar IDs temporales de los bins y asegurar que los datos son números
    if (pesajePayload.bins) {
      pesajePayload.bins = pesajePayload.bins.map((bin: any) => {
        // Crear un objeto nuevo sin ID para cada bin
        const { id, ...binData } = bin;
        return {
          ...binData,
          pesoBruto: Number(binData.pesoBruto),
          pesoTara: Number(binData.pesoTara),
          pesoNeto: Number(binData.pesoNeto),
        };
      });
    }

    // console.log(
    //   'Payload limpio a enviar:',
    //   JSON.stringify(pesajePayload, null, 2)
    // );

    try {
      // Verificar conexión a internet
      const netInfo = await NetInfo.fetch();

      if (netInfo.isConnected && netInfo.isInternetReachable) {
        // Con conexión - enviar al servidor
        console.log('Enviando al servidor...');
        const response = await PesajeService.createPesaje(pesajePayload);
        // console.log(
        //   'Respuesta del servidor:',
        //   JSON.stringify(response, null, 2)
        // );

        // Si el pesaje era un borrador, eliminarlo después de enviarlo exitosamente
        if (draftId) {
          try {
            await deleteDraftPesaje(draftId);
            // console.log(
            //   `Borrador con ID ${draftId} eliminado después de enviarse correctamente`
            // );
          } catch (deleteError) {
            console.error(
              'Error al eliminar borrador después de enviar:',
              deleteError
            );
            // No interrumpimos el flujo si hay error al eliminar
          }
        }

        Alert.alert('Éxito', 'Pesaje enviado correctamente', [
          {
            text: 'OK',
            onPress: () => {
              // Resetear formulario antes de navegar
              if (pesajeFormRef.current?.resetForm) {
                pesajeFormRef.current.resetForm();
              }
              navigation.navigate('Home');
            },
          },
        ]);
      } else {
        // Sin conexión - guardar localmente para sincronizar después
        try {
          // Guardar en cola para sincronización posterior
          await addPesajeToQueue(pesajePayload);

          // También guardar como borrador para poder editarlo
          await savePesajeDraft(formValues);

          Alert.alert(
            'Sin conexión',
            'El pesaje se ha guardado localmente. Podrás sincronizarlo más tarde desde la pantalla de Sincronización.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Resetear formulario antes de navegar
                  if (pesajeFormRef.current?.resetForm) {
                    pesajeFormRef.current.resetForm();
                  }
                  navigation.navigate('PesajesEnCurso');
                },
              },
            ]
          );
        } catch (error) {
          console.error('Error al guardar localmente:', error);
          Alert.alert(
            'Error',
            'No se pudo guardar el pesaje en modo sin conexión'
          );
        }
      }
    } catch (error: any) {
      console.error('Error al enviar pesaje:', error);

      // Log detallado del error
      if (error.response) {
        console.error('Código de estado:', error.response.status);
        console.error(
          'Datos de respuesta:',
          JSON.stringify(error.response.data, null, 2)
        );
        console.error(
          'Cabeceras:',
          JSON.stringify(error.response.headers, null, 2)
        );
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor:', error.request);
      } else {
        console.error(
          'Error en la configuración de la solicitud:',
          error.message
        );
      }

      // Intentar guardar como borrador en caso de error
      try {
        await savePesajeDraft(formValues);
        Alert.alert(
          'Error al enviar',
          'No se pudo enviar el pesaje al servidor, pero se guardó como borrador.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Resetear formulario antes de navegar
                if (pesajeFormRef.current?.resetForm) {
                  pesajeFormRef.current.resetForm();
                }
                navigation.navigate('PesajesEnCurso');
              },
            },
          ]
        );
      } catch (draftError) {
        Alert.alert(
          'Error',
          'No se pudo enviar ni guardar el pesaje. Por favor, intente nuevamente.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWeb = Platform.OS === 'web';

  if (loadingEmbarcaciones) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#005A9C" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
      enabled={!isWeb}
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
          isSubmitting={isSubmitting}
          isWeb={isWeb}
          initialValues={draft}
          onEmbarcacionChange={(embarcacionId) => {
            // Aquí puedes verificar si ya existe un pesaje para esta embarcación
            // y mostrar una alerta si es necesario, pero permitiendo continuar
          }}
        />

        {/* Botón para guardar como borrador */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.draftButton, isSaving && styles.buttonDisabled]}
            onPress={handleSaveDraft}
            disabled={isSaving}
          >
            <Icon
              name="content-save-outline"
              size={20}
              color="#005A9C"
              style={styles.buttonIcon}
            />
            <Text style={styles.draftButtonText}>
              {isSaving ? 'Guardando...' : 'Guardar como Borrador'}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  webScrollContainer: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  draftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#005A9C',
    minWidth: 200,
  },
  buttonIcon: {
    marginRight: 8,
  },
  draftButtonText: {
    color: '#005A9C',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#F0F0F0',
    borderColor: '#CCCCCC',
  },
});
