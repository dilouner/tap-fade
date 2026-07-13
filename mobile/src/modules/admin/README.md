# Admin module

Responsable de aprobacion de barberias y soporte operativo de plataforma.

## Capacidades actuales

- Navegador movil exclusivo para usuarios con `role: admin`.
- Listado global de usuarios.
- Cambio de rol: `client`, `barber`, `owner`, `admin`.
- Vinculacion operativa de un usuario `barber` con un documento
  `barberShops/{shopId}/barbers/{barberId}`.
- Listado global de barberias y activacion/inactivacion.
- Monitor global de citas y cambio de estado como soporte.
- Panel de alertas operativas.

## Primer admin

El primer administrador no se crea desde la app. Debe asignarse manualmente en
Firestore actualizando `users/{uid}.role` a `admin`.

## Fuera de alcance actual

- Auditoria persistente de acciones admin.
- Eliminacion dura de usuarios o barberias.
- Reasignacion de dueno de barberia.
- Panel web/desktop.
