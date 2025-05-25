# Instrucciones para GitHub Copilot

- responde en español
- usa un tono profesional

## 🌊 Proyecto: NaviPesca

NaviPesca es una aplicación que permite registrar **pesajes de pesca artesanal**.

Ya existe una **versión web** de esta app construida en:

- **Next.js 15** (App Router)
- Arquitectura limpia
- PostgreSQL (vía Prisma)
- UI con **Shadcn**
- Autenticación con NextAuth
- Tipado estricto con TypeScript

---

## 📱 Versión móvil (actual)

Actualmente estoy desarrollando una **versión móvil con Expo y React Native**, que debe:

- Compartir la misma API y backend de la versión web
- Autenticarse usando el endpoint `/api/login`, retornando `token`, `id`, `rolId` y `personaId`
- Utilizar el mismo flujo de pesaje que en la web:

### 🧾 Flujo de pesaje

1. El trabajador inicia sesión
2. Selecciona una embarcación
3. Agrega bins/chingillos:
   - Código
   - Peso bruto
   - Tara
4. El sistema calcula:
   - Peso neto
   - Total kilos
   - Subtotal (precio \* kilos)
   - IVA (19%)
   - Total con IVA
5. El trabajador envía el pesaje, que se guarda en el backend
6. Si no hay conexión, se guarda localmente y se sincroniza luego

---

## 🔧 Tecnologías utilizadas

- React Native + Expo
- React Navigation (Stack)
- Context API para autenticación
- AsyncStorage para persistencia
- Formik + Yup para formularios
- @react-native-community/netinfo para modo offline
- Axios para llamadas HTTP
- Estado y navegación tipo Clean Architecture

---

## 🧠 Consideraciones para Copilot

- El diseño y estructura deben **mantener coherencia con la versión web**
- Siempre que se cree un nuevo pesaje, debe usarse el mismo modelo de datos que la web (`PesajeData`)
- Los selectores como `embaracionId` o `trabajadorId` deben cargar desde API (o con mocks temporales)
- El modo offline debe guardar los datos en cola local (`OfflineQueue.ts`) hasta tener conexión
- La sincronización se hace desde `SyncScreen.tsx`
- Mostrar siempre errores con `Alert.alert()` y evitar que el usuario pierda datos

---

## 🔒 Roles

- Usuario logueado debe tener `rolId` y `personaId`
- Solo trabajadores con el rol adecuado pueden registrar pesajes
