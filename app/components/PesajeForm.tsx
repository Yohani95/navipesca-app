import React, { useState, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';

// Tipos basados en tu PesajeData de la web
interface BinData {
  id?: string; // ID temporal para la UI
  codigo: string;
  pesoBruto: number | null; // Ahora puede ser null cuando solo se tiene la tara
  pesoTara: number;
  pesoNeto: number | null; // También podría ser null
  tipoContenedor: 'bin' | 'chingillo';
  completo: boolean; // Indicador de si el bin está completo (tiene peso bruto)
}

interface PesajeFormData {
  fecha: Date;
  tipoPez: string;
  precioUnitario: number;
  embarcacionId: number | null;
  bins: BinData[];
  // Add calculated totals to be included in the submission
  totalKilos?: number;
  totalSinIVA?: number;
  iva?: number;
  totalConIVA?: number;
}

const PesajeValidationSchema = Yup.object().shape({
  fecha: Yup.date().required('La fecha es requerida'),
  tipoPez: Yup.string().required('El tipo de pez es requerido'),
  precioUnitario: Yup.number()
    .positive('El precio debe ser positivo')
    .required('El precio unitario es requerido'),
  embarcacionId: Yup.number()
    .nullable()
    .required('La embarcación es requerida'),
  bins: Yup.array()
    .of(
      Yup.object().shape({
        codigo: Yup.string().required('Código de bin requerido'),
        pesoTara: Yup.number()
          .positive('Tara debe ser positiva')
          .required('Tara requerida'),
        tipoContenedor: Yup.string()
          .oneOf(['bin', 'chingillo'])
          .required('Tipo de contenedor requerido'),
        // Ya no requerimos pesoBruto desde el principio
        pesoBruto: Yup.number().nullable(),
        pesoNeto: Yup.number().nullable(),
        completo: Yup.boolean(),
      })
    )
    // Requerimos al menos un bin, pero puede no estar completo
    .min(1, 'Debe agregar al menos un bin/chingillo'),
});

export interface PesajeFormRef {
  resetForm: () => void;
  getCurrentValues?: () => any; // Nueva función para obtener valores actuales
}

interface PesajeFormProps {
  embarcaciones: { id: number; nombre: string }[];
  onSubmit: (values: PesajeFormData) => void;
  isSubmitting: boolean;
  onSyncPress?: () => void;
  isWeb?: boolean;
  initialValues?: any; // Valores iniciales (borrador)
  onEmbarcacionChange?: (embarcacionId: number) => void; // Para verificar pesajes existentes
}

const PesajeForm = forwardRef<PesajeFormRef, PesajeFormProps>(
  (
    {
      embarcaciones,
      onSubmit,
      isSubmitting,
      onSyncPress,
      isWeb = false,
      initialValues,
      onEmbarcacionChange,
    },
    ref
  ) => {
    let formikRef: FormikProps<PesajeFormData> | null = null;

    // Nuevo estado para manejar el modal de edición de bin
    const [editBinModalVisible, setEditBinModalVisible] = useState(false);
    const [selectedBinIndex, setSelectedBinIndex] = useState<number | null>(
      null
    );
    const [tempBinValues, setTempBinValues] = useState<{ pesoBruto: string }>({
      pesoBruto: '',
    });

    useImperativeHandle(ref, () => ({
      resetForm: () => {
        formikRef?.resetForm();
      },
      getCurrentValues: () => {
        return formikRef?.values;
      },
    }));

    // Estado local para el bin actual que se está agregando
    const [currentBin, setCurrentBin] = useState<
      Omit<BinData, 'id' | 'pesoNeto' | 'completo'>
    >({
      codigo: '',
      pesoBruto: null, // Inicialmente puede ser null
      pesoTara: 0,
      tipoContenedor: 'bin',
    });

    const calculateTotals = (bins: BinData[], precioUnitario: number) => {
      // Solo considerar bins completos para el cálculo
      const completeBins = bins.filter(
        (bin) => bin.completo && bin.pesoNeto !== null
      );
      const totalKilos = completeBins.reduce(
        (sum, bin) => sum + (bin.pesoNeto || 0),
        0
      );
      const totalSinIVA = totalKilos * precioUnitario;
      const iva = totalSinIVA * 0.19;
      const totalConIVA = totalSinIVA + iva;
      return { totalKilos, totalSinIVA, iva, totalConIVA };
    };

    // Valores iniciales por defecto o del borrador
    const getInitialValues = () => {
      if (initialValues) {
        // Asegurarnos de que los bins tengan la propiedad completo
        const processedBins =
          initialValues.bins?.map((bin) => ({
            ...bin,
            completo: bin.pesoBruto !== null && bin.pesoBruto > 0,
          })) || [];

        return {
          ...initialValues,
          fecha: initialValues.fecha
            ? new Date(initialValues.fecha)
            : new Date(),
          precioUnitario: initialValues.precioUnitario || 0,
          bins: processedBins,
        };
      }

      return {
        fecha: new Date(),
        tipoPez: '',
        precioUnitario: 0,
        embarcacionId: null,
        bins: [],
      };
    };

    // Función para abrir el modal de edición de bin
    const openEditBinModal = (binIndex: number, bin: BinData) => {
      setSelectedBinIndex(binIndex);
      setTempBinValues({
        pesoBruto: bin.pesoBruto ? String(bin.pesoBruto) : '',
      });
      setEditBinModalVisible(true);
    };

    // Función para guardar los cambios del bin
    const saveBinChanges = () => {
      if (selectedBinIndex === null || !formikRef) return;

      const pesoBruto = Number(tempBinValues.pesoBruto);
      const currentBins = [...formikRef.values.bins];
      const bin = currentBins[selectedBinIndex];

      if (isNaN(pesoBruto) || pesoBruto <= 0) {
        Alert.alert('Error', 'El peso bruto debe ser un número positivo');
        return;
      }

      if (pesoBruto <= bin.pesoTara) {
        Alert.alert('Error', 'El peso bruto debe ser mayor a la tara');
        return;
      }

      // Actualizar el bin con los nuevos valores
      currentBins[selectedBinIndex] = {
        ...bin,
        pesoBruto,
        pesoNeto: pesoBruto - bin.pesoTara,
        completo: true,
      };

      formikRef.setFieldValue('bins', currentBins);
      setEditBinModalVisible(false);
      setSelectedBinIndex(null);
    };

    return (
      <Formik
        initialValues={getInitialValues()}
        validationSchema={PesajeValidationSchema}
        onSubmit={(values) => {
          // Verificar si hay al menos un bin completo
          const hasBinsWithWeight = values.bins.some((bin) => bin.completo);

          if (!hasBinsWithWeight) {
            Alert.alert(
              'Advertencia',
              'Debe completar el peso bruto de al menos un bin para enviar el pesaje.'
            );
            return;
          }

          // Ensure precioUnitario is a number
          const precioUnitario = Number(values.precioUnitario);

          // Calculate totals based on the current form values
          const { totalKilos, totalSinIVA, iva, totalConIVA } = calculateTotals(
            values.bins,
            precioUnitario
          );

          // Construct the data to be submitted, with proper types
          const dataToSubmit: PesajeFormData = {
            ...values,
            precioUnitario, // Use the explicitly converted number
            embarcacionId: values.embarcacionId
              ? Number(values.embarcacionId)
              : null, // Ensure embarcacionId is a number
            totalKilos,
            totalSinIVA,
            iva,
            totalConIVA,
          };

          onSubmit(dataToSubmit); // Pass the complete data (with totals) up
        }}
        innerRef={(f) => {
          formikRef = f;
        }}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldValue,
        }) => {
          // Calculate totals for display on each render
          const {
            totalKilos: displayTotalKilos,
            totalSinIVA: displayTotalSinIVA,
            iva: displayIva,
            totalConIVA: displayTotalConIVA,
          } = calculateTotals(values.bins, values.precioUnitario);

          // Ahora permite agregar bins con solo tara y código
          const handleAddBin = () => {
            if (!currentBin.codigo || currentBin.pesoTara <= 0) {
              Alert.alert(
                'Error en Bin',
                'Complete el código y la tara del bin correctamente.'
              );
              return;
            }

            // Determinar si el bin está completo (tiene peso bruto)
            const isCompleto =
              currentBin.pesoBruto !== null &&
              currentBin.pesoBruto > 0 &&
              currentBin.pesoBruto > currentBin.pesoTara;

            // Calcular pesoNeto solo si tiene peso bruto
            const pesoNeto =
              isCompleto && currentBin.pesoBruto !== null
                ? currentBin.pesoBruto - currentBin.pesoTara
                : null;

            const newBinEntry: BinData = {
              ...currentBin,
              id: `temp-${Date.now()}`, // ID temporal para la lista
              pesoNeto,
              completo: isCompleto,
            };

            setFieldValue('bins', [...values.bins, newBinEntry]);
            setCurrentBin({
              codigo: '',
              pesoBruto: null,
              pesoTara: 0,
              tipoContenedor: 'bin',
            }); // Resetear
          };

          const handleRemoveBin = (binIdToRemove: string) => {
            setFieldValue(
              'bins',
              values.bins.filter((bin) => bin.id !== binIdToRemove)
            );
          };

          // Verificar si hay un pesaje existente para la embarcación seleccionada
          const handleEmbarcacionChange = (itemValue: any) => {
            setFieldValue('embarcacionId', itemValue);

            // Si hay una función para verificar pesajes existentes, llamarla
            if (onEmbarcacionChange && itemValue) {
              onEmbarcacionChange(Number(itemValue));
            }
          };

          return (
            <View style={styles.formContainer}>
              {/* Sección Datos Generales */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Datos del Pesaje</Text>

                {/* Tipo de Pez */}
                <View style={styles.fieldStackContainer}>
                  <View style={styles.labelContainer}>
                    <Icon
                      name="fish"
                      size={18}
                      color="#555"
                      style={styles.fieldIcon}
                    />
                    <Text style={styles.label}>Tipo de Pez:</Text>
                  </View>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={values.tipoPez}
                      onValueChange={handleChange('tipoPez')}
                      style={styles.picker}
                      itemStyle={styles.pickerItem} // Estilo para los items del picker
                      prompt="Seleccione tipo de pez"
                    >
                      <Picker.Item label="Seleccione..." value="" />
                      <Picker.Item label="Jibia" value="jibia" />
                      <Picker.Item label="Reineta" value="reineta" />
                      <Picker.Item label="Merluza" value="merluza" />
                      <Picker.Item label="Jurel" value="jurel" />
                      <Picker.Item label="Otro" value="otro" />
                    </Picker>
                  </View>
                  {touched.tipoPez &&
                    errors.tipoPez &&
                    typeof errors.tipoPez === 'string' && (
                      <Text style={styles.errorText}>{errors.tipoPez}</Text>
                    )}
                </View>

                {/* Precio Unitario */}
                <View style={styles.fieldStackContainer}>
                  <View style={styles.labelContainer}>
                    <Icon
                      name="cash-multiple"
                      size={18}
                      color="#555"
                      style={styles.fieldIcon}
                    />
                    <Text style={styles.label}>Precio Unitario (kg):</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    onChangeText={handleChange('precioUnitario')}
                    onBlur={handleBlur('precioUnitario')}
                    value={
                      values.precioUnitario ? String(values.precioUnitario) : ''
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  {touched.precioUnitario && errors.precioUnitario && (
                    <Text style={styles.errorText}>
                      {typeof errors.precioUnitario === 'string' &&
                        errors.precioUnitario}
                    </Text>
                  )}
                </View>

                {/* Embarcación */}
                <View style={styles.fieldStackContainer}>
                  <View style={styles.labelContainer}>
                    <Icon
                      name="ship-wheel"
                      size={18}
                      color="#555"
                      style={styles.fieldIcon}
                    />
                    <Text style={styles.label}>Embarcación:</Text>
                  </View>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={values.embarcacionId}
                      onValueChange={handleEmbarcacionChange}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                      prompt="Seleccione embarcación"
                    >
                      <Picker.Item label="Seleccione..." value={null} />
                      {embarcaciones.map((e) => (
                        <Picker.Item label={e.nombre} value={e.id} key={e.id} />
                      ))}
                    </Picker>
                  </View>
                  {touched.embarcacionId &&
                    typeof errors.embarcacionId === 'string' && (
                      <Text style={styles.errorText}>
                        {errors.embarcacionId}
                      </Text>
                    )}
                </View>
              </View>

              {/* Sección Bins/Chingillos */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Bins / Chingillos</Text>

                {/* Agregar infobox sobre cómo usar el nuevo flujo */}
                <View style={styles.infoBox}>
                  <Icon name="information-outline" size={22} color="#3498DB" />
                  <Text style={styles.infoText}>
                    Puede agregar bins con solo la tara (peso vacío) y completar
                    el peso bruto después.
                  </Text>
                </View>

                {/* Formulario para agregar nuevo bin - Ahora con opción de tara solamente */}
                <View
                  style={[styles.addBinForm, isWeb && styles.addBinFormWeb]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      styles.binInput,
                      isWeb && styles.binInputWeb,
                    ]}
                    placeholder="Código Bin"
                    value={currentBin.codigo}
                    onChangeText={(val) =>
                      setCurrentBin((prev) => ({ ...prev, codigo: val }))
                    }
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.binInput,
                      isWeb && styles.binInputWeb,
                    ]}
                    placeholder="Tara (kg) *"
                    keyboardType="numeric"
                    value={
                      currentBin.pesoTara ? String(currentBin.pesoTara) : ''
                    }
                    onChangeText={(val) =>
                      setCurrentBin((prev) => ({
                        ...prev,
                        pesoTara: Number(val) || 0,
                      }))
                    }
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.binInput,
                      isWeb && styles.binInputWeb,
                    ]}
                    placeholder="P. Bruto (kg) - Opcional"
                    keyboardType="numeric"
                    value={
                      currentBin.pesoBruto !== null
                        ? String(currentBin.pesoBruto)
                        : ''
                    }
                    onChangeText={(val) =>
                      setCurrentBin((prev) => ({
                        ...prev,
                        pesoBruto: val ? Number(val) : null,
                      }))
                    }
                  />
                  <View
                    style={[
                      styles.pickerWrapper,
                      styles.binInput,
                      isWeb && styles.binInputWeb,
                      { minWidth: isWeb ? 200 : 150 },
                    ]}
                  >
                    <Picker
                      selectedValue={currentBin.tipoContenedor}
                      onValueChange={(val) =>
                        setCurrentBin((prev) => ({
                          ...prev,
                          tipoContenedor: val as 'bin' | 'chingillo',
                        }))
                      }
                      style={styles.picker}
                      itemStyle={styles.pickerItem} // Estilo para los items del picker
                    >
                      <Picker.Item label="Bin" value="bin" />
                      <Picker.Item label="Chingillo" value="chingillo" />
                    </Picker>
                  </View>
                  <TouchableOpacity
                    style={[styles.addButton, isWeb && styles.addButtonWeb]}
                    onPress={handleAddBin}
                  >
                    <Icon
                      name="plus-circle"
                      size={22}
                      color="#FFFFFF"
                      style={styles.addButtonIcon}
                    />
                    <Text style={styles.addButtonText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
                {touched.bins &&
                  errors.bins &&
                  typeof errors.bins === 'string' && (
                    <Text style={styles.errorText}>{errors.bins}</Text>
                  )}

                {/* Lista de bins agregados */}
                {values.bins.length === 0 ? (
                  <View style={styles.emptyBinsContainer}>
                    <Icon name="information-outline" size={24} color="#777" />
                    <Text style={styles.emptyBinsText}>
                      No hay bins/chingillos agregados aún.
                    </Text>
                  </View>
                ) : (
                  values.bins.map((bin, index) => (
                    <View
                      key={bin.id || index}
                      style={[
                        styles.binItem,
                        !bin.completo && styles.incompleteBin,
                      ]}
                    >
                      <Icon
                        name={
                          bin.tipoContenedor === 'bin'
                            ? 'cube-outline'
                            : 'basket-outline'
                        }
                        size={24}
                        color={bin.completo ? '#005A9C' : '#F39C12'}
                      />
                      <View style={styles.binInfo}>
                        <View style={styles.binHeaderRow}>
                          <Text style={styles.binTextBold}>{bin.codigo}</Text>
                          {!bin.completo && (
                            <View style={styles.pendingBadge}>
                              <Text style={styles.pendingBadgeText}>
                                Pendiente
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.binText}>
                          Tara: {bin.pesoTara}kg
                        </Text>
                        {bin.completo ? (
                          <>
                            <Text style={styles.binText}>
                              Bruto: {bin.pesoBruto}kg
                            </Text>
                            <Text style={styles.binTextNeto}>
                              Neto: {bin.pesoNeto?.toFixed(2)}kg
                            </Text>
                          </>
                        ) : (
                          <TouchableOpacity
                            style={styles.completeBinButton}
                            onPress={() => openEditBinModal(index, bin)}
                          >
                            <Icon name="weight" size={16} color="#FFFFFF" />
                            <Text style={styles.completeBinButtonText}>
                              Agregar Peso
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveBin(bin.id!)}
                        style={styles.binActionButton}
                      >
                        <Icon name="delete-forever" size={26} color="#E74C3C" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {/* Sección Resumen */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Resumen del Pesaje</Text>

                <View style={styles.binsStatusSummary}>
                  <Text style={styles.binsStatusText}>
                    <Text style={styles.boldText}>{values.bins.length}</Text>{' '}
                    bin(s) en total |
                    <Text style={styles.boldText}>
                      {' '}
                      {values.bins.filter((bin) => bin.completo).length}
                    </Text>{' '}
                    completados |
                    <Text style={styles.boldText}>
                      {' '}
                      {values.bins.filter((bin) => !bin.completo).length}
                    </Text>{' '}
                    pendientes
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Kilos Netos:</Text>
                  <Text style={styles.summaryValue}>
                    {displayTotalKilos.toFixed(2)} kg
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal (sin IVA):</Text>
                  <Text style={styles.summaryValue}>
                    ${displayTotalSinIVA.toLocaleString('es-CL')}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>IVA (19%):</Text>
                  <Text style={styles.summaryValue}>
                    ${displayIva.toLocaleString('es-CL')}
                  </Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={[styles.summaryLabel, styles.summaryTotalLabel]}>
                    Total a Pagar:
                  </Text>
                  <Text style={[styles.summaryValue, styles.summaryTotalValue]}>
                    ${displayTotalConIVA.toLocaleString('es-CL')}
                  </Text>
                </View>
              </View>

              {/* Botones de Acción */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    isSubmitting && styles.buttonDisabled,
                  ]}
                  onPress={() => handleSubmit()} // Call Formik's handleSubmit
                  disabled={isSubmitting}
                >
                  <Icon
                    name="content-save"
                    size={20}
                    color="#FFFFFF"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>
                    {isSubmitting ? 'Guardando...' : 'Guardar Pesaje'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Modal para completar el peso de un bin */}
              <Modal
                visible={editBinModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEditBinModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                      Completar Peso del Bin
                    </Text>

                    {selectedBinIndex !== null &&
                    values.bins[selectedBinIndex] ? (
                      <View style={styles.modalForm}>
                        <Text style={styles.modalBinInfo}>
                          Bin: {values.bins[selectedBinIndex].codigo} | Tara:{' '}
                          {values.bins[selectedBinIndex].pesoTara}kg
                        </Text>

                        <View style={styles.fieldStackContainer}>
                          <Text style={styles.label}>Peso Bruto (kg):</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="Ingrese el peso bruto"
                            value={tempBinValues.pesoBruto}
                            onChangeText={(text) =>
                              setTempBinValues({
                                ...tempBinValues,
                                pesoBruto: text,
                              })
                            }
                          />
                        </View>

                        <View style={styles.modalButtons}>
                          <TouchableOpacity
                            style={[
                              styles.modalButton,
                              styles.modalCancelButton,
                            ]}
                            onPress={() => setEditBinModalVisible(false)}
                          >
                            <Text style={styles.modalButtonText}>Cancelar</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.modalButton, styles.modalSaveButton]}
                            onPress={saveBinChanges}
                          >
                            <Text style={styles.modalButtonText}>Guardar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <Text>Error: Bin no encontrado</Text>
                    )}
                  </View>
                </View>
              </Modal>
            </View>
          );
        }}
      </Formik>
    );
  }
);

const styles = StyleSheet.create({
  formContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333', // Changed to dark gray
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 8,
  },
  fieldStackContainer: {
    marginBottom: 15,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 15,
    color: '#333333', // Changed to dark gray
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDE2E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    backgroundColor: '#F8F9FA',
    color: '#333333', // Changed to dark gray
    width: '100%',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#DDE2E5',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    width: '100%',
    justifyContent: 'center',
  },
  picker: {
    height: Platform.OS === 'ios' ? undefined : 55,
    color: '#333333', // Changed to dark gray
    width: '100%',
  },
  pickerItem: {
    color: '#333333', // Changed to dark gray
    fontSize: 16,
  },
  addBinForm: {
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
    flexWrap: 'wrap',
  },
  addBinFormWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  binInput: {
    flexBasis: '48%',
    minWidth: 120,
  },
  binInputWeb: {
    flexBasis: '22%',
    minWidth: 150,
  },
  addButtonIcon: {
    marginRight: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#2ECC71',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignSelf: 'flex-end',
    alignItems: 'center',
    height: 44,
    elevation: 2,
  },
  addButtonWeb: {
    alignSelf: 'flex-end',
    marginTop: 10,
    minWidth: 120,
  },
  binItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  emptyBinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginTop: 10,
  },
  emptyBinsText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#555555', // Changed to gray
  },
  binInfo: {
    flex: 1,
    marginLeft: 10,
  },
  binText: {
    fontSize: 13,
    color: '#555555', // Changed to gray
  },
  binTextBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333', // Changed to dark gray
  },
  binTextNeto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333', // Changed to dark gray
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#444444', // Changed to gray
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222', // Changed to dark gray
  },
  summaryTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#333333', // Changed to dark gray
    borderBottomWidth: 0,
  },
  summaryTotalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333333', // Changed to dark gray
  },
  summaryTotalValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333333', // Changed to dark gray
  },
  actionButtonsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    minWidth: 200,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  errorText: {
    fontSize: 13,
    color: '#E74C3C',
    marginTop: 4,
    marginBottom: 8,
  },

  // Nuevos estilos
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#555555', // Changed to gray
  },
  incompleteBin: {
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
  },
  binHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pendingBadge: {
    backgroundColor: '#F39C12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  completeBinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F39C12',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  completeBinButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  binActionButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333', // Changed to dark gray
    marginBottom: 16,
    textAlign: 'center',
  },
  modalForm: {
    width: '100%',
  },
  modalBinInfo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#555555', // Changed to gray
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#E0E0E0',
  },
  modalSaveButton: {
    backgroundColor: '#2ECC71',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  binsStatusSummary: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  binsStatusText: {
    fontSize: 14,
    color: '#555555', // Changed to gray
  },
  boldText: {
    fontWeight: 'bold',
    color: '#333333', // Changed to dark gray
  },
});

export default PesajeForm;
