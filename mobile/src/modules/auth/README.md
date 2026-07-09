# Auth module

Responsable de registro, inicio de sesion y estado de sesion.

## Alcance actual

- Autenticacion real solo con Google Sign-In.
- Firebase Auth recibe la credencial de Google.
- La pantalla conserva campos email/password como UI visual temporal, pero no
  son un metodo de autenticacion funcional.
- Apple Sign-In y correo/password quedan fuera del alcance actual.
- La app mantiene configuracion iOS y Android para Google Sign-In.

## Requerimientos relacionados

`RF-001`, `RF-002`, `RN-001`, `CP-001`, `CP-002`.
