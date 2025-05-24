# NaviPesca App Móvil

NaviPesca Móvil es una aplicación React Native construida con Expo, diseñada para registrar pesajes de pesca artesanal. Complementa la aplicación web NaviPesca, utilizando el mismo backend y API.

## ✨ Características

- **Autenticación de Usuarios**: Inicio de sesión seguro utilizando el endpoint `/api/login`, que proporciona un token, ID de usuario, `rolId` y `personaId`.
- **Acceso Basado en Roles**: Asegura que solo los trabajadores con los roles adecuados puedan registrar pesajes.
- **Flujo de Pesaje**:
  1.  El usuario inicia sesión.
  2.  Selecciona una embarcación.
  3.  Agrega bins/chingillos, ingresando código, peso bruto y tara.
  4.  El sistema calcula automáticamente:
      - Peso neto
      - Total de kilos
      - Subtotal (precio × kilos)
      - IVA (19%)
      - Total con IVA
  5.  El trabajador envía los datos del pesaje, que se guardan en el backend.
- **Soporte Offline**: Si no hay conexión a internet, los pesajes se guardan localmente (planeado para ser gestionado por `app/storage/OfflineQueue.ts`). Los datos se sincronizan cuando se restablece la conectividad (planeado para ser manejado a través de `app/screens/SyncScreen.tsx`).
- **Persistencia de Datos**: Utiliza AsyncStorage para el almacenamiento local de datos.
- **Manejo de Formularios**: Implementa Formik y Yup para la creación y validación robusta de formularios.
- **Estado de Red**: Usa `@react-native-community/netinfo` para detectar el estado online/offline.
- **Manejo de Errores**: Mensajes de error amigables para el usuario mostrados mediante `Alert.alert()`.

## 🛠️ Tecnologías Utilizadas

- React Native
- Expo
- React Navigation (Stack)
- Context API (para autenticación y estado global)
- AsyncStorage (para persistencia de datos local)
- Formik & Yup (para formularios y validación)
- Axios (para peticiones HTTP)
- `@react-native-community/netinfo` (para detección del estado de red)

## 📂 Estructura del Proyecto

El proyecto sigue una estructura orientada a características:

```
navipesca-app/
├── android/              # Archivos de compilación específicos de Android y código nativo
├── app/                  # Código fuente principal de la aplicación
│   ├── api/              # Integraciones con servicios API
│   ├── components/       # Componentes de UI reutilizables
│   ├── config/           # Configuración de la aplicación
│   ├── context/          # Proveedores de React Context API
│   ├── hooks/            # Hooks de React personalizados
│   ├── models/           # Modelos de datos y tipos (ej. PesajeData)
│   ├── navigation/       # Configuración de la navegación (React Navigation)
│   ├── screens/          # Pantallas/vistas de la aplicación
│   ├── services/         # Servicios de lógica de negocio
│   ├── storage/          # Utilidades de almacenamiento local (ej. OfflineQueue.ts)
│   └── utils/            # Funciones de utilidad
├── assets/               # Recursos estáticos (imágenes, fuentes, etc.)
├── .expo/                # Archivos generados específicos de Expo
├── .github/              # Archivos específicos de GitHub (ej. workflows, plantillas de issues)
│   └── instructions/     # Instrucciones para Copilot
├── .vscode/              # Configuraciones del editor VS Code
├── App.tsx               # Componente principal de la aplicación
├── app.json              # Archivo de configuración de Expo
├── index.js              # Punto de entrada para React Native
├── package.json          # Dependencias y scripts del proyecto
└── tsconfig.json         # Configuración de TypeScript
```

## 🚀 Cómo Empezar

### Prerrequisitos

- Node.js (versión LTS recomendada)
- npm o Yarn
- Expo CLI: `npm install -g expo-cli`

### Instalación

1.  Clona el repositorio:
    ```bash
    git clone <url-de-tu-repositorio>
    cd navipesca-app
    ```
2.  Si ya inicializaste un repositorio local y quieres conectarlo a uno remoto existente:
    ```bash
    git remote add origin https://github.com/Yohani95/navipesca-app.git
    ```
3.  Instala las dependencias:
    ```bash
    npm install
    # o
    yarn install
    ```

### Ejecutando la Aplicación

1.  Inicia el empaquetador Metro:
    ```bash
    npx expo start
    ```
2.  Sigue las instrucciones en la terminal para abrir la aplicación:
    - En un Emulador/Dispositivo Android: Presiona `a`
    - En un Simulador/Dispositivo iOS: Presiona `i`
    - En un navegador web: Presiona `w`

## ⚙️ Configuración

- Las configuraciones generales de la aplicación (nombre, versión, ícono, pantalla de bienvenida, configuraciones específicas de la plataforma) se gestionan en [`app.json`](app.json).
- Las configuraciones de compilación específicas de Android se pueden encontrar en [`android/app/build.gradle`](android/app/build.gradle). El `versionCode` y `versionName` en este archivo deben coincidir con la `version` en [`app.json`](app.json).

## 📦 Compilando para Producción

Para compilar aplicaciones independientes para Android e iOS, consulta la documentación oficial de Expo:

- [Compilando Aplicaciones Independientes](https://docs.expo.dev/build/introduction/)

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor, sigue el estilo y la estructura de código existentes. Si planeas agregar una nueva característica o realizar cambios significativos, abre un issue primero para discutirlo.

## 📄 Licencia

Este proyecto está bajo la licencia [Tu Licencia Aquí - ej. Licencia MIT]. (Especifica tu licencia)
