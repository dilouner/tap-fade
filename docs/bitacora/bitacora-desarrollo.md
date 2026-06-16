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
