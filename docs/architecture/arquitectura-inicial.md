# Arquitectura inicial

## Decision base

La primera version se construira con:

- Frontend movil: React Native.
- Opcion recomendada de arranque: Expo.
- Backend: Firebase.
- Autenticacion: Firebase Auth con Google Sign-In como proveedor inicial.
- Base de datos: Cloud Firestore.
- Archivos: Firebase Storage.
- Notificaciones: Firebase Cloud Messaging.
- Mapas: Google Maps API.
- CI/CD: GitHub Actions.

La configuracion operativa de Firebase se documenta en
`docs/architecture/firebase-configuracion.md`.

## Vista general

```mermaid
flowchart LR
  Cliente["Cliente movil"]
  Barbero["Barbero movil"]
  Dueno["Dueno movil"]
  Admin["Administrador"]

  App["TapFade React Native"]
  Auth["Firebase Auth"]
  Firestore["Cloud Firestore"]
  Storage["Firebase Storage"]
  FCM["Firebase Cloud Messaging"]
  Maps["Google Maps API"]

  Cliente --> App
  Barbero --> App
  Dueno --> App
  Admin --> App

  App --> Auth
  App --> Firestore
  App --> Storage
  App --> FCM
  App --> Maps
```

## Criterios tecnicos iniciales

- Separar modulos por dominio de negocio.
- Mantener componentes compartidos en `shared`.
- Evitar logica de negocio dentro de componentes visuales.
- Centralizar acceso a Firebase.
- Usar validaciones consistentes por modulo.
- Mantener reglas de seguridad de Firestore alineadas a roles.
- Mantener Google Sign-In como unico metodo de autenticacion hasta que se
  apruebe otro proveedor.

## Riesgos a vigilar

- Dependencia de Firebase y servicios de Google.
- No-shows sin penalizacion.
- Baja adopcion por parte de barberias.
- Rechazo en tiendas por privacidad o uso incorrecto de permisos.
- Crecimiento de datos sin reglas claras de retencion.
