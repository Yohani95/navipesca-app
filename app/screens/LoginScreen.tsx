// app/screens/LoginScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';

const LoginSchema = Yup.object().shape({
  correo: Yup.string().email('Correo inválido').required('Requerido'),
  clave: Yup.string().min(4, 'Mínimo 4 caracteres').required('Requerido'),
});

// Definir el tipo para los valores del formulario
interface LoginFormValues {
  correo: string;
  clave: string;
}

// Cross-platform alert function
const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    // For web, use browser's alert or you could implement a custom modal
    window.alert(`${title}: ${message}`);
  } else {
    // For mobile platforms, use React Native's Alert
    Alert.alert(title, message);
  }
};

export default function LoginScreen() {
  const { login } = useAuth();
  const currentYear = new Date().getFullYear(); // Obtener el año actual

  return (
    <ImageBackground
      source={require('../../assets/fondo-app-navipesca.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.mainContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.appName}>NAVIPESCA</Text>
              <Text style={styles.appSubtitle}>REGISTRO DE PESAJES</Text>
              <Image
                source={require('../../assets/balanza-negro.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.container}>
              <Text style={styles.title}>Iniciar Sesión</Text>
              <Formik<LoginFormValues>
                initialValues={{ correo: '', clave: '' }}
                validationSchema={LoginSchema}
                onSubmit={async (
                  values,
                  { setSubmitting }: FormikHelpers<LoginFormValues>
                ) => {
                  const result = await login(values.correo, values.clave);
                  setSubmitting(false);
                  if (!result.success) {
                    showAlert(
                      'Error',
                      result.error ||
                        'Credenciales incorrectas o error desconocido'
                    );
                  }
                }}
              >
                {({
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  values,
                  errors,
                  touched,
                  isSubmitting,
                }) => (
                  <View style={styles.form}>
                    <TextInput
                      placeholder="Correo Electrónico"
                      style={styles.input}
                      autoCapitalize="none"
                      onChangeText={handleChange('correo')}
                      onBlur={handleBlur('correo')}
                      value={values.correo}
                      keyboardType="email-address"
                      placeholderTextColor="#BDC3C7"
                    />
                    {touched.correo && errors.correo && (
                      <Text style={styles.error}>{errors.correo}</Text>
                    )}

                    <TextInput
                      placeholder="Clave"
                      style={styles.input}
                      secureTextEntry
                      onChangeText={handleChange('clave')}
                      onBlur={handleBlur('clave')}
                      value={values.clave}
                      placeholderTextColor="#BDC3C7"
                    />
                    {touched.clave && errors.clave && (
                      <Text style={styles.error}>{errors.clave}</Text>
                    )}

                    <View style={styles.buttonContainer}>
                      <Button
                        title="Ingresar"
                        onPress={() => handleSubmit()}
                        disabled={isSubmitting}
                        color="#3498DB" // Un color de botón que contraste
                      />
                    </View>
                  </View>
                )}
              </Formik>
            </View>
          </View>
          <View style={styles.footerView}>
            <Text style={styles.footerTextLogin}>
              NaviPesca © {currentYear}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between', // Para empujar el footer hacia abajo
    flexDirection: 'column', // Asegurar dirección de columna
  },
  mainContent: {
    // Contenedor para el logo y el formulario
    flex: 1, // Ocupar el espacio disponible para centrar
    justifyContent: 'center', // Centrar el contenido principal
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30, // Espacio entre el logo/título y el formulario
    paddingHorizontal: 20,
  },
  logo: {
    width: 150, // Ajusta el tamaño según tu imagen
    height: 150, // Ajusta el tamaño según tu imagen
    marginBottom: 2,
    color: '#FFFFFF', // Color blanco para el logo
    tintColor: '#FFFFFF', // Asegúrate de que el logo sea blanco
    opacity: 0.5, // Un poco de transparencia para el logo
    borderRadius: 75, // Bordes redondeados para el logo
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#E0E0E0', // Un blanco un poco más suave
    textAlign: 'center',
    marginBottom: 10,
  },
  container: {
    paddingHorizontal: 30, // Más padding horizontal
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Un overlay oscuro semitransparente para legibilidad
    borderRadius: 15, // Bordes redondeados para el contenedor del formulario
    marginHorizontal: 20, // Margen para que no ocupe toda la pantalla
    alignSelf: 'center', // Centrar el contenedor del formulario
    minWidth: '80%', // Ancho mínimo
    maxWidth: 400, // Ancho máximo
    marginTop: 0, // Ajusta el marginTop si el logoContainer está comentado
  },
  title: {
    fontSize: 24, // Reducir un poco el tamaño si el título principal está arriba
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  form: { gap: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#7F8C8D', // Borde más sutil
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Fondo de input ligeramente transparente
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#2C3E50', // Color de texto oscuro
  },
  error: {
    color: '#E74C3C', // Un rojo más brillante para errores
    fontSize: 13,
    marginTop: -5, // Ajustar posición del error
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 15, // Espacio antes del botón
    borderRadius: 10, // Bordes redondeados para el contenedor del botón (si el botón no los toma)
    overflow: 'hidden', // Para que el borderRadius del contenedor afecte al botón en Android
  },
  footerView: {
    // Estilo para el contenedor del footer
    paddingVertical: 15,
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)', // Opcional: un fondo sutil si es necesario
  },
  footerTextLogin: {
    // Estilo para el texto del footer en LoginScreen
    fontSize: 12,
    color: '#FFFFFF', // Color blanco para contraste con el fondo oscuro
    opacity: 0.8, // Un poco de opacidad
  },
});
