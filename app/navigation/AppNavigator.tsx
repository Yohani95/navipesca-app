import React from 'react';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  DrawerNavigationProp,
} from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import PesajeScreen from '../screens/PesajeScreen';
import SyncScreen from '../screens/SyncScreen';
import HomeScreen from '../screens/HomeScreen';
import HistorialPesajesScreen from '../screens/HistorialPesajesScreen';
import { RootStackParamList, DrawerParamList } from './types';
import { Text, View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PesajesEnCursoScreen from '../screens/PesajesEnCursoScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent(props: any) {
  const { usuario, logout } = useAuth();
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerScrollViewContent}
    >
      <View style={styles.drawerMainContent}>
        <View style={styles.drawerHeader}>
          <View style={styles.drawerUserInfo}>
            {usuario ? (
              <>
                <Text
                  style={styles.drawerUserText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {usuario.nombre}
                </Text>
                <Text
                  style={styles.drawerEmailText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {usuario.email}
                </Text>
                {usuario.cliente && (
                  <View style={styles.clienteBadge}>
                    <Icon
                      name="office-building"
                      size={14}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={styles.drawerClienteText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      Cliente: {usuario.cliente.nombre}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.drawerHeaderText}>NaviPesca</Text>
            )}
          </View>
          <View>
            <Icon name="ship-wheel" size={50} color="#FFFFFF" />
          </View>
        </View>
        <DrawerItemList {...props} />
      </View>

      <View style={styles.drawerFooterWrapper}>
        <DrawerItem
          label="Cerrar Sesión"
          onPress={() => logout()}
          labelStyle={{ color: 'red' }}
          style={styles.logoutButton}
          icon={({ color, size }) => (
            <Icon name="logout" size={size} color="red" />
          )}
        />

        <View style={styles.footerTextView}>
          <Text style={styles.footerText}>
            NaviPesca © {new Date().getFullYear()}
          </Text>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

function AppDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({
        navigation,
        route,
      }: {
        navigation: DrawerNavigationProp<DrawerParamList>;
        route: RouteProp<DrawerParamList, keyof DrawerParamList>;
      }) => {
        const isHomeScreen = route.name === 'Home';
        // Determinar el comportamiento del botón izquierdo según pantalla actual
        const getCurrentScreen = route.name;

        return {
          headerShown: true,
          headerStyle: {
            backgroundColor: '#005A9C',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => {
            // Solo mostrar el icono de menú (drawer) en la pantalla Home
            if (isHomeScreen) {
              return (
                <TouchableOpacity
                  onPress={() => navigation.toggleDrawer()}
                  style={{ marginLeft: 15 }}
                >
                  <Icon name="menu" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              );
            }

            // En otras pantallas, mostrar el botón de atrás que navegue a Home
            return (
              <TouchableOpacity
                onPress={() => {
                  // Esto asegura que el comportamiento del botón atrás sea
                  // navegar a Home en lugar de a otra pantalla específica
                  navigation.navigate('Home');
                }}
                style={{ marginLeft: 15 }}
              >
                <Icon name="arrow-left" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            );
          },
          drawerActiveTintColor: '#005A9C',
          drawerInactiveTintColor: '#333333',
          drawerLabelStyle: {
            marginLeft: -20,
            fontSize: 15,
          },
          drawerItemStyle: {},
          headerRight: () => {
            const { usuario } = useAuth();
            return (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginRight: 15,
                }}
              >
                {/* {usuario?.cliente && (
                  <TouchableOpacity
                    onPress={() => {
                      if (!isHomeScreen) {
                        navigation.navigate('Home');
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      marginRight: 10,
                    }}
                  >
                    <Icon
                      name="office-building"
                      size={14}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: '500',
                        marginRight: 4,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {usuario.cliente.nombre}
                    </Text>
                    {!isHomeScreen && (
                      <Icon name="arrow-right" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                )} */}
                {!isHomeScreen && (
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate('Home');
                    }}
                  >
                    <Icon name="home" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            );
          },
        };
      }}
      initialRouteName="Home"
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          drawerIcon: ({ color, size }) => (
            <Icon name="home-outline" color={color} size={size} />
          ),
          drawerLabel: ({ focused, color }) => (
            <View style={styles.drawerLabelContainer}>
              <Text style={{ color, fontSize: 15 }}>Inicio</Text>
              <Icon name="chevron-right" color={color} size={22} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Pesaje"
        component={PesajeScreen}
        options={{
          title: 'Nuevo Pesaje',
          drawerIcon: ({ color, size }) => (
            <Icon name="scale-balance" color={color} size={size} />
          ),
          drawerLabel: ({ focused, color }) => (
            <View style={styles.drawerLabelContainer}>
              <Text style={{ color, fontSize: 15 }}>Nuevo Pesaje</Text>
              <Icon name="chevron-right" color={color} size={22} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="HistorialPesajes"
        component={HistorialPesajesScreen}
        options={{
          title: 'Pesajes de Hoy',
          drawerIcon: ({ color, size }) => (
            <Icon name="calendar-check-outline" color={color} size={size} />
          ),
          drawerLabel: ({ focused, color }) => (
            <View style={styles.drawerLabelContainer}>
              <Text style={{ color, fontSize: 15 }}>Pesajes de Hoy</Text>
              <Icon name="chevron-right" color={color} size={22} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="PesajesEnCurso"
        component={PesajesEnCursoScreen}
        options={{
          title: 'Pesajes en Curso',
          drawerIcon: ({ color, size }) => (
            <Icon name="clipboard-edit-outline" color={color} size={size} />
          ),
          drawerLabel: ({ focused, color }) => (
            <View style={styles.drawerLabelContainer}>
              <Text style={{ color, fontSize: 15 }}>Pesajes en Curso</Text>
              <Icon name="chevron-right" color={color} size={22} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          title: 'Sincronizar',
          drawerIcon: ({ color, size }) => (
            <Icon name="sync" color={color} size={size} />
          ),
          drawerLabel: ({ focused, color }) => (
            <View style={styles.drawerLabelContainer}>
              <Text style={{ color, fontSize: 15 }}>Sincronizar</Text>
              <Icon name="chevron-right" color={color} size={22} />
            </View>
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { usuario, loading } = useAuth();

  // if (loading) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <Text>Cargando...</Text>
  //     </View>
  //   );
  // }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <Stack.Screen name="AppDrawer" component={AppDrawerNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawerScrollViewContent: {
    // Re-añadir estilo para el ScrollView
    flexGrow: 1,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  drawerMainContent: {
    // Contenedor para el contenido principal (header, items)
    // Este View ayuda a agrupar la parte superior del drawer
  },

  drawerHeader: {
    paddingVertical: 15, // Ajustar padding vertical
    paddingHorizontal: 20,
    backgroundColor: '#005A9C',
    borderRadius: 10,
    marginBottom: 10,
    borderBottomColor: '#004A8C',
    flexDirection: 'row', // Alinear elementos en fila
    alignItems: 'center', // Centrar verticalmente
    justifyContent: 'space-between', // Espacio entre el texto y el logo
  },
  drawerUserInfo: {
    flex: 1, // Permitir que la información del usuario ocupe el espacio disponible
    marginRight: 10, // Espacio entre el texto y el logo
  },
  drawerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    tintColor: '#FFFFFF',
  },
  drawerHeaderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawerUserText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    // marginBottom: 2, // Espacio ligero si el email está debajo
  },
  drawerEmailText: {
    color: '#E0E0E0',
    fontSize: 12,
    marginBottom: 4, // Añadir margen inferior para separar del badge de cliente
  },
  clienteBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerClienteText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  logoutButton: {
    // Estilo para el botón de logout
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    // No necesita marginTop si drawerFooterWrapper maneja el espaciado
  },
  drawerFooterWrapper: {
    // Nuevo contenedor para el botón de logout y el texto del footer
    // Este View agrupa los elementos del pie de página
    // borderTopWidth: 1, // Opcional: si quieres una línea encima de todo el footer
    // borderTopColor: '#DDDDDD',
  },
  footerTextView: {
    // Contenedor para el texto del footer
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1, // Línea divisoria sutil encima de todo el footer
    borderTopColor: '#F5F5F5',
  },
  footerText: {
    // Estilo para el texto del copyright
    fontSize: 12,
    color: '#757575',
  },
  drawerLabelContainer: {
    // Nuevo estilo para el contenedor de la etiqueta y el icono chevron
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%', // Ocupar todo el ancho disponible para empujar el chevron al final
  },
});
