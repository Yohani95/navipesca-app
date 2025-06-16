// app/screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import useNetworkStatus from '../hooks/useNetworkStatus';

// Esquema de validación
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Correo electrónico inválido')
    .required('El correo electrónico es obligatorio'),
  password: Yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es obligatoria'),
});

export default function LoginScreen() {
  const { login, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isConnected = useNetworkStatus();
  const isWeb = Platform.OS === 'web';

  // Limpiar errores cuando se monta el componente
  useEffect(() => {
    clearError();
    // Actualizar el error local si hay un error en el contexto
    if (error) {
      setLoginError(error);
    }
  }, [error]);

  const handleLogin = async (values: { email: string; password: string }) => {
    if (!isConnected) {
      Alert.alert(
        'Sin conexión',
        'No hay conexión a internet. Conéctate para iniciar sesión.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Limpiar errores previos
    setLoginError(null);
    clearError();

    // Activar estado de carga del botón
    setIsLoggingIn(true);

    try {
      // Intentar inicio de sesión
      const result = await login(values.email, values.password);

      if (!result.success) {
        // Si falla, mostrar error y desactivar estado de carga
        setLoginError(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      // Capturar cualquier otro error y mostrar mensaje
      if (error instanceof Error) {
        setLoginError(error.message);
      } else {
        setLoginError('Error al iniciar sesión');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Renderizamos componentes diferentes según la plataforma para evitar problemas en web
  const renderLoginForm = () => (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={LoginSchema}
      onSubmit={handleLogin}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        values,
        errors,
        touched,
      }) => (
        <View style={styles.form}>
          {/* Campo de Email */}
          <View style={styles.inputGroup}>
            <View
              style={[
                styles.inputContainer,
                touched.email && errors.email && styles.inputError,
              ]}
            >
              <Icon
                name="email-outline"
                size={22}
                color="#005A9C"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#90A4AE"
                value={values.email}
                onChangeText={(text) => {
                  // Limpiar errores al escribir
                  if (loginError) {
                    setLoginError(null);
                    clearError();
                  }
                  handleChange('email')(text);
                }}
                onBlur={handleBlur('email')}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
                editable={!isLoggingIn} // Deshabilitar durante el inicio de sesión
              />
            </View>
            {touched.email && errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Campo de Contraseña */}
          <View style={styles.inputGroup}>
            <View
              style={[
                styles.inputContainer,
                touched.password && errors.password && styles.inputError,
              ]}
            >
              <Icon
                name="lock-outline"
                size={22}
                color="#005A9C"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#90A4AE"
                value={values.password}
                onChangeText={(text) => {
                  // Limpiar errores al escribir
                  if (loginError) {
                    setLoginError(null);
                    clearError();
                  }
                  handleChange('password')(text);
                }}
                onBlur={handleBlur('password')}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                editable={!isLoggingIn} // Deshabilitar durante el inicio de sesión
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={isLoggingIn} // Deshabilitar durante el inicio de sesión
              >
                <Icon
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#607D8B"
                />
              </TouchableOpacity>
            </View>
            {touched.password && errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Mensaje de error del login */}
          {(loginError || error) && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle-outline" size={18} color="#E53935" />
              <Text style={styles.loginErrorText}>{loginError || error}</Text>
            </View>
          )}

          {/* Indicador de estado offline */}
          {!isConnected && (
            <View style={styles.offlineContainer}>
              <Icon name="wifi-off" size={18} color="#455A64" />
              <Text style={styles.offlineText}>Sin conexión a Internet</Text>
            </View>
          )}

          {/* Botón de Login */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoggingIn && styles.loginButtonLoading,
            ]}
            onPress={() => handleSubmit()}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.loginButtonText}>Iniciando sesión...</Text>
              </View>
            ) : (
              <>
                <Icon
                  name="login"
                  size={20}
                  color="#FFFFFF"
                  style={styles.loginButtonIcon}
                />
                <Text style={styles.loginButtonText}>Ingresar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </Formik>
  );

  return (
    <ImageBackground
      source={require('../../assets/fondo-azul.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {isWeb ? (
        // Versión específica para web sin KeyboardAvoidingView ni TouchableWithoutFeedback
        <View style={styles.container}>
          <View style={styles.overlay} />

          <View style={styles.content}>
            {/* Logo y encabezado */}
            <View style={styles.logoContainer}>
              <Icon
                name="ship-wheel"
                size={80}
                color="#FFFFFF"
                style={styles.logo}
              />
              <Text style={styles.appName}>NaviPesca</Text>
              <Text style={styles.appSlogan}>Gestión de pesca artesanal</Text>
            </View>

            {/* Contenedor del formulario con efecto de cristal */}
            <View style={styles.formContainer}>
              <Text style={styles.title}>Iniciar Sesión</Text>
              {renderLoginForm()}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                NaviPesca © {new Date().getFullYear()}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        // Versión para móvil con KeyboardAvoidingView y TouchableWithoutFeedback
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.overlay} />

            <View style={styles.content}>
              {/* Logo y encabezado */}
              <View style={styles.logoContainer}>
                <Icon
                  name="ship-wheel"
                  size={80}
                  color="#FFFFFF"
                  style={styles.logo}
                />
                <Text style={styles.appName}>NaviPesca</Text>
                <Text style={styles.appSlogan}>Gestión de pesca artesanal</Text>
              </View>

              {/* Contenedor del formulario con efecto de cristal */}
              <View style={styles.formContainer}>
                <Text style={styles.title}>Iniciar Sesión</Text>
                {renderLoginForm()}
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  NaviPesca © {new Date().getFullYear()}
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 60, 120, 0.4)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  appSlogan: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#005A9C',
    marginBottom: 25,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    overflow: 'hidden',
    height: 56,
  },
  inputError: {
    borderColor: '#E53935',
    borderWidth: 1,
  },
  inputIcon: {
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#37474F',
    fontSize: 16,
    paddingRight: 15,
    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none' as 'solid', // Explicitly cast to avoid type errors
          outline: 'none',
          paddingTop: 0,
          paddingBottom: 0,
        }
      : {}),
  },
  eyeIcon: {
    padding: 15,
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#005A9C',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#005A9C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 90, 156, 0.3)',
        cursor: 'pointer',
      },
    }),
  },
  loginButtonIcon: {
    marginRight: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginLeft: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonLoading: {
    backgroundColor: '#64B5F6',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  loginErrorText: {
    color: '#C62828',
    fontSize: 14,
    marginLeft: 8,
  },
  offlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  offlineText: {
    color: '#455A64',
    fontSize: 14,
    marginLeft: 8,
  },
  footer: {
    marginTop: 40,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontSize: 12,
  },
});
