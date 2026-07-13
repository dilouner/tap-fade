# Bitacora de desarrollo

## Formato de registro

Cada sesion de trabajo debe registrar:

- Fecha.
- Responsable.
- Modulo.
- Actividades realizadas.
- Decisiones tomadas.
- Pruebas ejecutadas.
- Evidencia.
- Pendientes.

## Registros

### 2026-06-16 - Sprint 0

- Responsable: Equipo TapFade.
- Modulo: Documentacion base.
- Actividades: Creacion de estructura inicial de documentacion del proyecto.
- Decisiones: Trabajar por modulos con validacion y trazabilidad.
- Pruebas ejecutadas: Pendiente.
- Evidencia: Documentos en `/docs`.
- Pendientes: Crear proyecto React Native y configurar Firebase.

### 2026-06-16 - Base movil

- Responsable: Equipo TapFade.
- Modulo: Fundaciones tecnicas.
- Actividades: Creacion del proyecto Expo en `/mobile`, estructura modular,
  tema visual inicial y pantalla base.
- Decisiones: Mantener la app movil separada de la documentacion dentro del
  mismo repositorio.
- Pruebas ejecutadas: `npm run typecheck`.
- Evidencia: Proyecto en `/mobile` y archivos de tema en
  `/mobile/src/shared/theme`.
- Pendientes: Configurar pipeline CI y preparar integracion Firebase.

### 2026-06-16 - Pipeline inicial

- Responsable: Equipo TapFade.
- Modulo: DevOps.
- Actividades: Creacion de workflow `Mobile CI` para instalar dependencias y
  ejecutar typecheck.
- Decisiones: Usar GitHub Actions como pipeline inicial.
- Pruebas ejecutadas: Validacion local previa con `npm run typecheck`.
- Evidencia: `.github/workflows/mobile-ci.yml`.
- Pendientes: Ejecutar el pipeline en GitHub cuando exista push remoto.

### 2026-06-16 - Pantalla inicial de login

- Responsable: Equipo TapFade.
- Modulo: Auth / UI inicial.
- Actividades: Reemplazo de la pantalla de fundaciones por una pantalla de
  inicio de sesion alineada a la identidad TapFade.
- Decisiones: La app debe abrir en Login como primera experiencia visible.
- Pruebas ejecutadas: `npm run typecheck`.
- Evidencia: `/mobile/src/app/AppShell.tsx`.
- Pendientes: Conectar formulario con Firebase Auth.

### 2026-06-16 - Reversion de login y downgrade Expo

- Responsable: Equipo TapFade.
- Modulo: Fundaciones tecnicas / Auth.
- Actividades: Retiro completo del login inicial y downgrade controlado de Expo
  SDK 56 a SDK 55.
- Decisiones: El login se redisenara desde cero con mayor calidad visual y
  mayor apego al manual de identidad.
- Pruebas ejecutadas: `npm run typecheck`.
- Evidencia: `/mobile/package.json`, `/mobile/package-lock.json` y
  `/mobile/src/app/AppShell.tsx`.
- Pendientes: Probar nuevamente en Expo Go con cache limpia y definir concepto
  visual del login antes de implementarlo.

### 2026-06-16 - Downgrade adicional a Expo SDK 54

- Responsable: Equipo TapFade.
- Modulo: Fundaciones tecnicas.
- Actividades: Baja adicional de Expo SDK 55 a SDK 54 por persistencia del
  error de compatibilidad en Expo Go.
- Decisiones: Priorizar compatibilidad local para poder validar en dispositivo
  durante Sprint 0.
- Pruebas ejecutadas: `npm run typecheck` y `npx expo config --json`.
- Evidencia: `sdkVersion` efectivo `54.0.0` y dependencias
  `expo@54.0.35`, `react-native@0.81.6`, `react@19.1.4`.
- Pendientes: Cerrar procesos Metro anteriores y reiniciar con cache limpia.

### 2026-06-16 - Rediseno de login

- Responsable: Equipo TapFade.
- Modulo: Auth / UI inicial.
- Actividades: Reimplementacion de pantalla inicial de login con composicion
  visual alineada al manual de identidad: grafito, azul electrico, menta,
  bandas diagonales, escalonado y formulario movil.
- Decisiones: Mantener el login como primera experiencia visible, pero dejar la
  autenticacion real para el siguiente paso de Firebase Auth.
- Pruebas ejecutadas: `npm run typecheck`.
- Evidencia: `/mobile/src/app/AppShell.tsx`.
- Pendientes: Revisar visualmente en Expo Go y conectar Firebase Auth.

### 2026-06-16 - Downgrade adicional a Expo SDK 53

- Responsable: Equipo TapFade.
- Modulo: Fundaciones tecnicas.
- Actividades: Baja de Expo SDK 54 a SDK 53 por error en celular:
  `private properties are not supported`.
- Decisiones: Mantener compatibilidad con Expo Go del dispositivo antes de
  avanzar a Firebase.
- Pruebas ejecutadas: `npm run typecheck`, `npm ls expo react react-native`
  y `npx expo config --json`.
- Evidencia: `sdkVersion` efectivo `53.0.0` y dependencias
  `expo@53.0.27`, `react-native@0.79.7`, `react@19.0.0`.
- Pendientes: Probar en Expo Go con cache limpia.

### 2026-06-17 - Correccion de compatibilidad Expo Go 54

- Responsable: Equipo TapFade.
- Modulo: Fundaciones tecnicas.
- Actividades: Re-alineacion del proyecto a Expo SDK 54, cierre de procesos
  Metro/Expo antiguos y movimiento de `AppShell` fuera de `src/app` para evitar
  deteccion accidental de Expo Router.
- Decisiones: Mantener SDK 54 porque el dispositivo usa Expo Go 54.
- Pruebas ejecutadas: `npm run typecheck`, `npm ls expo react react-native`
  y `npx expo config --json`.
- Evidencia: `sdkVersion` efectivo `54.0.0`; dependencias
  `expo@54.0.35`, `react-native@0.81.5`, `react@19.1.4`.
- Pendientes: Probar en Expo Go usando solo el comando desde `/mobile`.

### 2026-06-17 - Login alineado a mockup y assets renombrados

- Responsable: Equipo TapFade.
- Modulo: Auth / UI inicial.
- Actividades: Ajuste del login para seguir la referencia visual proporcionada:
  fondo blanco, logo real, formulario compacto, separador, botones sociales,
  registro y recursos laterales de marca.
- Decisiones: Usar assets reales desde `/mobile/assets` y renombrarlos con
  nombres semanticos.
- Pruebas ejecutadas: `npm run typecheck`.
- Evidencia: `/mobile/src/shell/AppShell.tsx` y assets `logo-*` / `brand-*`.
- Pendientes: Revision visual en dispositivo y conexion con Firebase Auth.

### 2026-06-29 - Pruebas unitarias iniciales en CI

- Responsable: Equipo TapFade.
- Modulo: DevOps / UI compartida.
- Actividades: Configuracion de Jest con `jest-expo`, React Native Testing
  Library y pruebas unitarias iniciales para `PrimaryButton` e `InputField`.
- Decisiones: Mantener el pipeline en GitHub Actions como puerta de validacion
  para typecheck y pruebas unitarias antes de integrar cambios.
- Pruebas ejecutadas: `npm run typecheck` y `npm run test:ci`.
- Evidencia: `.github/workflows/mobile-ci.yml`,
  `/mobile/src/shared/components/__tests__/PrimaryButton-test.tsx` y
  `/mobile/src/shared/components/__tests__/InputField-test.tsx`.
- Pendientes: Agregar pruebas por modulo conforme se implementen reglas de
  negocio, servicios y conexion con Firebase.

### 2026-06-29 - Calidad base del pipeline

- Responsable: Equipo TapFade.
- Modulo: DevOps.
- Actividades: Configuracion de ESLint con `eslint-config-expo`, integracion
  de `npm run lint` al workflow `Mobile CI` y creacion de checklist de pull
  request.
- Decisiones: Usar la configuracion oficial de Expo sin reglas personalizadas
  y mantener Prettier fuera de esta iteracion para evitar cambios masivos de
  formato.
- Pruebas ejecutadas: `npm ci`, `npm run lint`, `npm run typecheck` y
  `npm run test:ci`.
- Evidencia: `.github/workflows/mobile-ci.yml`,
  `.github/pull_request_template.md` y `/mobile/eslint.config.js`.
- Pendientes: Revisar vulnerabilidades moderadas de dependencias antes de una
  version distribuible y evaluar Prettier en una iteracion separada.

### 2026-07-06 - Auth + Roles con Google Sign-In

- Responsable: Equipo TapFade.
- Modulo: Auth / Users.
- Actividades: Configuracion inicial de Firebase, Google Sign-In para
  development build, estado de sesion y creacion/lectura de perfiles
  `users/{uid}` con rol inicial `client`.
- Decisiones: Mantener Google como unico proveedor real de autenticacion;
  Apple Sign-In y correo/password quedan fuera del alcance funcional actual.
- Pruebas ejecutadas: `npm ci`, `npm run lint`, `npm run typecheck` y
  `npm run test:ci`.
- Evidencia: `/mobile/src/modules/auth`, `/mobile/src/modules/users`,
  `/mobile/src/shared/firebase` y pruebas unitarias/integracion mockeada.
- Pendientes: Crear proyecto Firebase real, completar variables
  `EXPO_PUBLIC_*`, generar development build y validar login en dispositivo.
  `npm audit` reporta 16 vulnerabilidades moderadas en dependencias.

### 2026-07-09 - Configuracion Firebase real

- Responsable: Equipo TapFade.
- Modulo: Firebase / Auth / Users.
- Actividades: Instalacion de Firebase CLI, creacion del proyecto
  `tapfade-dev`, registro de apps Web y Android, configuracion local de
  variables `EXPO_PUBLIC_*`, versionado/despliegue de reglas iniciales de
  Firestore y registro de SHA-1/SHA-256 de debug para Android.
- Decisiones: Validar manualmente primero en Android, pero conservar soporte
  iOS y Android para la app. Usar reglas de Firestore versionadas en lugar de
  dejar la base en modo abierto de pruebas.
- Pruebas ejecutadas: `npm run lint`, `npm run typecheck` y `npm run test:ci`.
- Evidencia: `.firebaserc`, `firebase.json`, `firestore.rules`,
  `/mobile/.env.example` y `docs/architecture/firebase-configuracion.md`.
- Pendientes: Validar Google Sign-In en Android development build.

### 2026-07-09 - MVP operativo de reservas

- Responsable: Equipo TapFade.
- Modulo: Barberias / Servicios / Disponibilidad / Citas / Reportes.
- Actividades: Implementacion de navegacion por rol, alta de barberia activa,
  administracion de barberos, servicios y disponibilidad, agenda por barbero,
  citas pendientes con confirmacion/rechazo y reporte semanal de ocupacion.
- Decisiones: Cualquier usuario autenticado puede crear barberia y queda como
  `owner`; la agenda usa recarga manual; los slots son de 15 minutos; las
  citas nacen `pending`.
- Pruebas ejecutadas: `npm run typecheck` y `npm run test:ci`.
- Evidencia: `/mobile/src/app/MainNavigator.tsx`, modulos de dominio y
  repositorios Firestore, `firestore.rules` y pruebas unitarias/integracion
  mockeada.
- Pendientes: Validacion manual Android con development build y validacion iOS
  cuando exista entorno de build.

### 2026-07-13 - Rediseno UI y navegacion por rol

- Responsable: Brandom Borrego, Daniel Ramirez / dilouner y Gustavo Pando.
- Modulo: UI compartida / Navegacion / Barberias / Citas / Disponibilidad /
  Reportes.
- Actividades: Redisenio de tokens visuales TapFade, componentes reutilizables,
  navegadores por rol, vistas cliente, vistas barbero, vistas dueno y soporte
  `photoUrl` para barberias y barberos.
- Decisiones: Usar tabs por rol con stacks internos, iconografia
  `@expo/vector-icons`, fallbacks locales de marca y persistencia de imagenes
  como URL sin implementar subida a Storage.
- Pruebas ejecutadas: `npm run lint`, `npm run typecheck` y
  `npm run test:ci`.
- Evidencia: `/mobile/src/app/MainNavigator.tsx`,
  `/mobile/src/shared/components/AppUI.tsx`, pruebas UI y cambios de tipos en
  `/mobile/src/modules/barber-shops`.
- Pendientes: Validacion manual en dispositivo Android/iOS y PR a `develop`.
