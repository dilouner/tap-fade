# Configuracion Firebase

## Proyecto

- Nombre: TapFade.
- Project ID: `tapfade-dev`.
- Cuenta administradora usada para configuracion inicial: `indiotoons@gmail.com`.

## Apps registradas

| Plataforma | Nombre | Identificador | Uso actual |
|---|---|---|---|
| Web | TapFade Mobile Config | `1:312781381250:web:43acc3d8809e9879485e9b` | Config Firebase para Expo y Firebase JS SDK |
| Android | TapFade Android | `com.tapfade.mobile` | App nativa Android y Google Sign-In |
| iOS | TapFade iOS | `com.tapfade.mobile` | App nativa iOS y Google Sign-In |

La app soporta iOS y Android. El proveedor de autenticacion real sigue siendo
Google Sign-In; Apple Sign-In queda fuera del alcance.

## Variables locales

La app lee configuracion desde `/mobile/.env`, archivo ignorado por Git. El
repositorio solo versiona `/mobile/.env.example`.

Variables requeridas:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```

La configuracion web de Firebase no es una llave privada, pero debe mantenerse
fuera del repositorio para separar ambientes y evitar acoplar el codigo a un
proyecto especifico.

## Authentication

- Proveedor habilitado: Google.
- Apple Sign-In y email/password quedan fuera del alcance actual.
- La app usa `@react-native-google-signin/google-signin` para obtener el
  `idToken`.
- Firebase Auth inicia sesion con `GoogleAuthProvider.credential`.

## Firestore

Base de datos esperada:

- Database ID: `(default)`.
- Region recomendada: `nam5`.

Reglas versionadas:

- Archivo: `/firestore.rules`.
- Cada usuario autenticado puede crear, leer y actualizar solo
  `users/{uid}`.
- El rol inicial permitido desde cliente es `client`.
- El cliente no puede escalar ni modificar su rol.

## Pendientes de configuracion nativa

- SHA-1/SHA-256 de debug local registrados en Firebase para desarrollo Android.
- iOS requiere validar el OAuth client ID en un entorno macOS/EAS antes de
  distribuir builds de prueba.
- Descargar o regenerar configuracion Android solo si el flujo nativo lo
  requiere durante la validacion en dispositivo.
- Validar login real en Android development build.
