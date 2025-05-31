import React, {
  useState,
  // useEffect, // useEffect is not used, can be removed
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker'; // Selector nativo
// Considera usar un componente de DatePicker más estilizado si es necesario
// import DateTimePickerModal from "react-native-modal-datetime-picker";

// Tipos basados en tu PesajeData de la web
interface BinData {
  id?: string; // ID temporal para la UI
  codigo: string;
  pesoBruto: number;
  pesoTara: number;
  pesoNeto: number;
  tipoContenedor: 'bin' | 'chingillo';
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
  fecha: Yup.date().required('La fecha es requerida'), // Se mantiene la validación
  tipoPez: Yup.string().required('El tipo de pez es requerido'),
  precioUnitario: Yup.number()
    .positive('El precio debe ser positivo')
    .required('El precio unitario es requerido'),
  embarcacionId: Yup.number()
    .nullable()
    .required('La embarcación es requerida'),
  // pagado y metodoPago eliminados de la validación
  bins: Yup.array()
    .of(
      Yup.object().shape({
        codigo: Yup.string().required('Código de bin requerido'),
        pesoBruto: Yup.number()
          .positive('Peso bruto debe ser positivo')
          .required('Peso bruto requerido'),
        pesoTara: Yup.number()
          .positive('Tara debe ser positiva')
          .required('Tara requerida'),
        tipoContenedor: Yup.string()
          .oneOf(['bin', 'chingillo'])
          .required('Tipo de contenedor requerido'),
      })
    )
    .min(1, 'Debe agregar al menos un bin/chingillo'),
});

export interface PesajeFormRef {
  resetForm: () => void;
}

interface PesajeFormProps {
  embarcaciones: { id: number; nombre: string }[];
  onSubmit: (values: PesajeFormData) => void; // Expects PesajeFormData with totals
  isSubmitting: boolean;
  onSyncPress?: () => void;
  isWeb?: boolean; // Add isWeb prop to handle web-specific behaviors
}

const PesajeForm = forwardRef<PesajeFormRef, PesajeFormProps>(
  (
    { embarcaciones, onSubmit, isSubmitting, onSyncPress, isWeb = false },
    ref
  ) => {
    // const [showDatePicker, setShowDatePicker] = useState(false); // Ya no es necesario
    let formikRef: FormikProps<PesajeFormData> | null = null;

    useImperativeHandle(ref, () => ({
      resetForm: () => {
        formikRef?.resetForm();
      },
    }));

    // Estado local para el bin actual que se está agregando
    const [currentBin, setCurrentBin] = useState<
      Omit<BinData, 'id' | 'pesoNeto'>
    >({
      codigo: '',
      pesoBruto: 0,
      pesoTara: 0,
      tipoContenedor: 'bin',
    });

    const calculateTotals = (bins: BinData[], precioUnitario: number) => {
      const totalKilos = bins.reduce((sum, bin) => sum + bin.pesoNeto, 0);
      const totalSinIVA = totalKilos * precioUnitario;
      const iva = totalSinIVA * 0.19;
      const totalConIVA = totalSinIVA + iva;
      return { totalKilos, totalSinIVA, iva, totalConIVA };
    };

    return (
      <Formik
        initialValues={{
          fecha: new Date(),
          tipoPez: '',
          precioUnitario: 0,
          embarcacionId: null,
          bins: [],
        }}
        validationSchema={PesajeValidationSchema}
        onSubmit={(values) => {
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
          handleSubmit, // This is Formik's internal handleSubmit
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

          const handleAddBin = () => {
            if (
              !currentBin.codigo ||
              currentBin.pesoBruto <= 0 ||
              currentBin.pesoTara <= 0 ||
              currentBin.pesoBruto <= currentBin.pesoTara
            ) {
              Alert.alert(
                'Error en Bin',
                'Complete todos los campos del bin correctamente. El peso bruto debe ser mayor a la tara.'
              );
              return;
            }
            const pesoNeto = currentBin.pesoBruto - currentBin.pesoTara;
            const newBinEntry: BinData = {
              ...currentBin,
              id: `temp-${Date.now()}`, // ID temporal para la lista
              pesoNeto,
            };
            setFieldValue('bins', [...values.bins, newBinEntry]);
            setCurrentBin({
              codigo: '',
              pesoBruto: 0,
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
                  {touched.tipoPez && errors.tipoPez && (
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
                      {errors.precioUnitario}
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
                      onValueChange={(itemValue) =>
                        setFieldValue('embarcacionId', itemValue)
                      }
                      style={styles.picker}
                      itemStyle={styles.pickerItem} // Estilo para los items del picker
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
                {/* Formulario para agregar nuevo bin */}
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
                    placeholder="P. Bruto (kg)"
                    keyboardType="numeric"
                    value={
                      currentBin.pesoBruto ? String(currentBin.pesoBruto) : ''
                    }
                    onChangeText={(val) =>
                      setCurrentBin((prev) => ({
                        ...prev,
                        pesoBruto: Number(val),
                      }))
                    }
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.binInput,
                      isWeb && styles.binInputWeb,
                    ]}
                    placeholder="Tara (kg)"
                    keyboardType="numeric"
                    value={
                      currentBin.pesoTara ? String(currentBin.pesoTara) : ''
                    }
                    onChangeText={(val) =>
                      setCurrentBin((prev) => ({
                        ...prev,
                        pesoTara: Number(val),
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
                    <View key={bin.id || index} style={styles.binItem}>
                      <Icon
                        name={
                          bin.tipoContenedor === 'bin'
                            ? 'cube-outline'
                            : 'basket-outline'
                        }
                        size={24}
                        color="#005A9C"
                      />
                      <View style={styles.binInfo}>
                        <Text style={styles.binTextBold}>{bin.codigo}</Text>
                        <Text style={styles.binText}>
                          Bruto: {bin.pesoBruto}kg, Tara: {bin.pesoTara}kg
                        </Text>
                        <Text style={styles.binTextNeto}>
                          Neto: {bin.pesoNeto.toFixed(2)}kg
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveBin(bin.id!)}
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
                {/* Opcional: Botón para limpiar formulario */}
                {/* <TouchableOpacity
                  style={[styles.button, styles.clearButton]}
                  onPress={() => formikRef?.resetForm()}
                  disabled={isSubmitting}
                >
                  <Icon
                    name="refresh"
                    size={20}
                    color="#34495E"
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.buttonText, { color: '#34495E' }]}>
                    Limpiar
                  </Text>
                </TouchableOpacity> */}
              </View>
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
    color: '#005A9C',
    marginBottom: 15, // Aumentar margen inferior para separar de los campos
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 8,
  },
  fieldStackContainer: {
    // Nuevo estilo para agrupar label e input verticalmente
    marginBottom: 15, // Espacio entre cada grupo de campo
  },
  labelContainer: {
    // Contenedor para el icono y la etiqueta
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6, // Espacio entre la etiqueta y el input/picker
  },
  fieldIcon: {
    marginRight: 6, // Espacio reducido para el icono
  },
  label: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    // marginRight ya no es necesario aquí
    // minWidth ya no es necesario aquí
  },
  input: {
    // flex: 1, // Ya no es necesario si el input ocupa todo el ancho disponible
    borderWidth: 1,
    borderColor: '#DDE2E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10, // Ajustar padding vertical
    fontSize: 15,
    backgroundColor: '#F8F9FA',
    color: '#333', // Asegurar que el color del texto del input sea visible
    width: '100%', // Asegurar que ocupe todo el ancho
  },
  pickerWrapper: {
    // flex: 1, // Ya no es necesario
    borderWidth: 1,
    borderColor: '#DDE2E5',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    width: '100%', // Asegurar que ocupe todo el ancho
    justifyContent: 'center', // Centrar el contenido del picker verticalmente en Android
  },
  picker: {
    height: Platform.OS === 'ios' ? undefined : 55, // Altura para Android, iOS se ajusta automáticamente
    color: '#333', // Color del texto del picker
    width: '100%', // Asegurar que el picker ocupe todo el ancho del wrapper
  },
  pickerItem: {
    // Estilo para los items del picker (principalmente para iOS)
    color: '#333',
    fontSize: 16, // Ajustar según sea necesario
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
    marginRight: 6, // Espacio entre icono y texto
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
    // Nuevo estilo para el mensaje de bins vacíos
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
    // Nuevo estilo para el texto del mensaje de bins vacíos
    marginLeft: 8,
    fontSize: 15,
    color: '#555',
  },
  binInfo: {
    flex: 1,
    marginLeft: 10,
  },
  binText: {
    fontSize: 13,
    color: '#555',
  },
  binTextBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  binTextNeto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#005A9C',
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
    color: '#444',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  summaryTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#005A9C',
    borderBottomWidth: 0,
  },
  summaryTotalLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#005A9C',
  },
  summaryTotalValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#005A9C',
  },
  actionButtonsContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    backgroundColor: '#007BFF', // Azul
  },
  clearButton: {
    backgroundColor: '#E9ECEF', // Gris claro
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
    // marginLeft: 0, // Ya no necesita margen izquierdo si está debajo
    marginTop: 4, // Espacio entre el input y el error
    marginBottom: 8,
  },
});

export default PesajeForm;
