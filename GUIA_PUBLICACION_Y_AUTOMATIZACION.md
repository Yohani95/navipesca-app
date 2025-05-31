# Guía Completa para Configuración, Pruebas y Publicación de NaviPesca App

k&5wh^q\*==49H4h
yohani95
Esta guía te llevará a través de todos los pasos necesarios para configurar tu proyecto NaviPesca, generar APKs para pruebas, publicar en las tiendas de aplicaciones y automatizar las actualizaciones Over-The-Air (OTA).

## 0. Prerrequisitos

- **Cuenta de Expo creada**: Ya tienes una cuenta en [expo.dev](https://expo.dev/).
- **Proyecto Expo existente**: Tienes tu proyecto NaviPesca en tu máquina local.
- **Node.js y npm/yarn instalados**.
- **Git instalado**.

## 1. Configuración Inicial del Proyecto y EAS CLI

EAS (Expo Application Services) es el conjunto de herramientas que usarás para construir, enviar y actualizar tu aplicación.

### 1.1. Instalar EAS CLI Globalmente

Si aún no lo has hecho, instala EAS CLI en tu computadora:

```bash
npm install -g eas-cli
```

### 1.2. Iniciar Sesión en EAS CLI

Desde la raíz de tu proyecto NaviPesca, inicia sesión en tu cuenta de Expo a través de EAS CLI:

```bash
eas login
```

Sigue las instrucciones en la terminal. Esto conectará tu CLI con tu cuenta de Expo.

### 1.3. Configurar el Proyecto para EAS Build

Este comando configurará tu proyecto para que pueda ser construido por los servicios de EAS. Te preguntará sobre cómo manejar las credenciales de firma para iOS y Android.

```bash
eas build:configure
```

- **Para Android**: Puedes dejar que EAS genere y gestione una nueva Keystore (recomendado si no tienes una) o subir una existente.
- **Para iOS**: EAS puede ayudarte a generar y gestionar tus certificados y perfiles de aprovisionamiento.

### 1.4. Revisar y Ajustar `app.json`

Asegúrate de que tu archivo `app.json` esté correctamente configurado, especialmente `runtimeVersion` y el `projectId` de EAS.

```json
// Ejemplo de app.json relevante
{
  "expo": {
    "name": "NaviPesca",
    "slug": "navipesca-app",
    "version": "1.0.0", // Actualiza para releases significativos
    // ... otras configuraciones ...
    "ios": {
      "bundleIdentifier": "com.tudominio.navipesca" // Cambia esto a tu identificador
    },
    "android": {
      "package": "com.tudominio.navipesca" // Cambia esto a tu identificador
    },
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_LOAD",
      "fallbackToCacheTimeout": 30000
      // La URL de updates se gestiona por EAS usando el projectId
    },
    "runtimeVersion": "1.0.0", // Define una versión de runtime. Actualiza cuando cambie código nativo.
    "extra": {
      "eas": {
        "projectId": "TU_EAS_PROJECT_ID_AQUI" // ¡¡IMPORTANTE: Reemplaza esto!!
      }
    },
    "plugins": [
      "expo-updates"
      // ... otros plugins ...
    ]
  }
}
```

- **Obtener `projectId`**: Ve a tu dashboard en [expo.dev](https://expo.dev/), selecciona tu proyecto NaviPesca (o créalo si no existe allí) y encontrarás el Project ID en la página del proyecto.

### 1.5. Revisar y Ajustar `eas.json`

Este archivo define los perfiles de construcción y envío. El que te proporcioné anteriormente es un buen punto de partida. Asegúrate de que los perfiles `development`, `preview` y `production` estén configurados según tus necesidades.

```json
// Ejemplo de eas.json relevante
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      // Para development clients (APK/IPA de desarrollo)
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "android": {
        "buildType": "apk" // Para generar APK directamente
      }
    },
    "preview": {
      // Para builds de prueba/QA
      "distribution": "internal",
      "channel": "preview",
      "env": {
        "APP_ENV": "staging"
        // "API_URL": "https://staging-api.navipesca.cl/api"
      }
    },
    "production": {
      // Para builds de tienda
      "channel": "production",
      "env": {
        "APP_ENV": "production"
        // "API_URL": "https://api.navipesca.cl/api"
      }
      // "autoIncrement": true // Para iOS buildNumber y Android versionCode
    }
  },
  "submit": {
    // ... configuración de submit para producción ...
  }
}
```

## 2. Generación de una APK de Desarrollo/Pruebas

Mientras desarrollas, es útil tener una APK que puedas instalar directamente en un dispositivo Android para probar. Esto se conoce como "Development Build".

### 2.1. ¿Qué es un Development Build?

Un Development Build es una versión de tu app que incluye herramientas de desarrollo (como el menú de desarrollador de Expo) y te permite cargar tu código JavaScript desde tu máquina local (usando `expo start --dev-client`) o desde una actualización publicada en un canal específico. Es diferente a usar Expo Go porque incluye cualquier código nativo que hayas añadido.

### 2.2. Generar una APK de Desarrollo

Con el perfil `development` en `eas.json` configurado para generar una APK (como en el ejemplo anterior), ejecuta:

```bash
eas build -p android --profile development
```

- EAS construirá tu app y te proporcionará un enlace para descargar la APK una vez que esté lista.
- También puedes ver el progreso y descargarla desde tu dashboard de EAS.

### 2.3. Instalar la APK en un Dispositivo Android

1.  Descarga el archivo `.apk` a tu computadora.
2.  Transfiere el archivo `.apk` a tu dispositivo Android (por ejemplo, mediante un cable USB, Google Drive, email, etc.).
3.  En tu dispositivo Android, ve a la configuración de seguridad y permite la instalación de aplicaciones de "fuentes desconocidas" (el nombre exacto de esta opción puede variar según el fabricante y la versión de Android).
4.  Abre el administrador de archivos en tu dispositivo, busca el archivo `.apk` y tócalo para instalarlo.

Ahora puedes abrir la app. Para conectar con tu servidor de desarrollo local:

```bash
expo start --dev-client
```

Escanea el código QR desde la app de desarrollo o ingresa la URL manualmente si es necesario.

## 3. Preparación para Publicación en Tiendas (Primera Vez)

Estos pasos son necesarios para la primera publicación.

### 3.1. Cuentas de Desarrollador

- **Apple App Store Connect**: Necesitas una cuenta en el [Apple Developer Program](https://developer.apple.com/programs/) ($99 USD/año).
- **Google Play Console**: Necesitas una cuenta en [Google Play Console](https://play.google.com/console) ($25 USD pago único).

### 3.2. Google Play Console (Android)

1.  **Crear la Aplicación**:
    - Ve a tu Google Play Console.
    - Haz clic en "Crear aplicación".
    - Completa los detalles iniciales (nombre de la app, idioma, etc.).
2.  **Generar Clave de Servicio JSON**:
    - Para que EAS pueda subir builds automáticamente a tu cuenta de Google Play, necesitas una clave de API de servicio.
    - En Google Play Console, ve a `Configuración > Acceso API > Cuentas de servicio`.
    - Sigue las instrucciones para crear una nueva cuenta de servicio con el rol "Administrador de versiones" (o similar).
    - Descarga el archivo JSON de la clave.
    - Guarda este archivo en la raíz de tu proyecto (ej: `google-play-service-account.json`) y **asegúrate de añadirlo a tu `.gitignore`** para no subirlo a tu repositorio.
    - Actualiza la ruta en `eas.json` en la sección `submit.production.android.serviceAccountKeyPath`.
3.  **Completar Ficha de la Tienda**:
    - En Google Play Console, navega por el menú lateral y completa toda la información requerida:
      - `Presencia en Google Play Store > Ficha de Play Store principal`: Descripción, título, gráficos (icono, imagen de cabecera, capturas de pantalla).
      - `Contenido de la aplicación`: Política de privacidad, anuncios, acceso a la app, clasificación de contenido, público objetivo, etc.
      - Precios y distribución.

### 3.3. Apple App Store Connect (iOS)

1.  **Crear la Aplicación**:
    - Ve a [App Store Connect](https://appstoreconnect.apple.com/).
    - Haz clic en "Mis apps" y luego en el signo "+" para crear una nueva app.
    - Completa los detalles: Nombre, Idioma principal, Identificador de paquete (Bundle ID - debe coincidir con el de `app.json`), SKU.
2.  **Obtener IDs para `eas.json`**:
    - **`ascAppId` (Apple ID de la App)**: Lo encontrarás en App Store Connect, en la sección "Información de la app" de tu nueva aplicación. Es un número largo.
    - **`appleTeamId`**: Lo puedes encontrar en tu cuenta de Apple Developer, en la sección "Membership details".
    - Actualiza estos valores en `eas.json` en la sección `submit.production.ios`.
3.  **Completar Ficha de la Tienda**:
    - En App Store Connect, completa toda la información para la versión de tu app:
      - Capturas de pantalla (para diferentes tamaños de iPhone y iPad).
      - Texto promocional, descripción, palabras clave.
      - URL de soporte, URL de marketing.
      - Información de contacto para la revisión.
      - Información de inicio de sesión para la revisión si tu app requiere login.
      - Clasificación de contenido.
      - Precios y disponibilidad.

## 4. Generación de Builds de Producción (Para Tiendas)

Cuando estés listo para publicar la primera versión o una actualización nativa significativa:

### 4.1. Android (`.aab`)

```bash
eas build -p android --profile production
```

Esto generará un Android App Bundle (`.aab`), que es el formato requerido por Google Play.

### 4.2. iOS (`.ipa`)

```bash
eas build -p ios --profile production
```

Esto generará un archivo `.ipa`.

## 5. Envío a Tiendas (Submit)

Una vez que las builds de producción estén listas y hayas completado las fichas de tienda:

### 5.1. Android

```bash
eas submit -p android --profile production --latest
```

Esto usará tu clave de servicio JSON para subir el `.aab` a Google Play Console. Desde allí, tendrás que ir a "Producción" (o el canal que desees), crear un nuevo "release", seleccionar el bundle y enviarlo a revisión.

### 5.2. iOS

```bash
eas submit -p ios --profile production --latest
```

Esto subirá el `.ipa` a App Store Connect. Desde allí, selecciona la build y envíala a revisión por Apple.

### 5.3. Proceso de Revisión

- **Google Play**: La revisión suele ser rápida (horas o un par de días).
- **App Store**: La revisión puede tardar más (días, a veces más).

## 6. Configuración de Actualizaciones OTA Automáticas (GitHub Actions)

Esto es para que los cambios en la rama `main` actualicen automáticamente la app para los usuarios que ya la tienen instalada (sin pasar por la tienda, solo para cambios de JS/assets).

### 6.1. Crear `EXPO_TOKEN` en GitHub Secrets

1.  Ve a [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).
2.  Crea un nuevo token de acceso. Dale un nombre descriptivo (ej: `GITHUB_ACTIONS_NAVIPESCA`).
3.  Copia el token.
4.  En tu repositorio de GitHub, ve a `Settings > Secrets and variables > Actions`.
5.  Haz clic en `New repository secret`.
6.  Nombra el secreto `EXPO_TOKEN` y pega el token que copiaste.

### 6.2. Workflow de GitHub Actions (`deploy.yml`)

Asegúrate de tener el archivo `.github/workflows/deploy.yml` que te proporcioné anteriormente. Este se activará en cada `push` a la rama `main` y ejecutará `eas update --auto` para publicar los cambios OTA al canal `production`.

## 7. Consideraciones Adicionales

### 7.1. `runtimeVersion`

- **Actualizaciones OTA**: Funcionan siempre que la `runtimeVersion` de la actualización coincida con la `runtimeVersion` de la app nativa instalada por el usuario.
- **Cuándo cambiar `runtimeVersion`**: Debes incrementar la `runtimeVersion` en `app.json` (ej: de "1.0.0" a "1.0.1") si:
  - Actualizas la versión del SDK de Expo.
  - Añades o actualizas una librería nativa.
  - Cambias configuraciones nativas significativas (a través de plugins en `app.json`, etc.).
- **Después de cambiar `runtimeVersion`**: Necesitas generar y enviar nuevas builds nativas a las tiendas (pasos 4 y 5). Las actualizaciones OTA para la `runtimeVersion` anterior ya no se aplicarán a estas nuevas builds.

### 7.2. Pruebas Exhaustivas

- **TestFlight (iOS)**: Usa TestFlight para invitar a usuarios a probar tus builds de iOS antes de publicarlas.
- **Canales de Pruebas de Google Play (Android)**: Usa los canales "Pruebas internas", "Cerrado" (alfa) o "Abierto" (beta) para probar tus builds de Android.

---

Siguiendo esta guía, deberías poder configurar tu entorno, generar APKs para pruebas, publicar tu aplicación NaviPesca y mantenerla actualizada. ¡Mucha suerte!
