# Users module

Responsable de perfiles, roles y permisos de usuario.

Roles iniciales: `client`, `barber`, `owner`, `admin`.

## Contrato actual

- El perfil se guarda en `users/{uid}`.
- El primer inicio con Google crea un perfil con `role: client`.
- Los inicios posteriores conservan el rol existente.
- Los cambios de rol quedan reservados para flujos administrativos futuros.
