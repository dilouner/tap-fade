# Modelo de datos inicial para Firestore

Este modelo es inicial y debera ajustarse durante el diseno tecnico.

## Colecciones propuestas

```text
users/{userId}
barberShops/{barberShopId}
barberShops/{barberShopId}/services/{serviceId}
barberShops/{barberShopId}/barbers/{barberId}
barberShops/{barberShopId}/availability/{availabilityId}
appointments/{appointmentId}
notifications/{notificationId}
reports/{reportId}
```

## users

- `displayName`
- `email`
- `phone`
- `photoURL`
- `role`: `client | barber | owner | admin`
- `createdAt`
- `updatedAt`

### Contrato inicial de Auth + Roles

- El documento se crea en `users/{uid}` usando el `uid` de Firebase Auth.
- El primer inicio con Google crea el perfil con `role: client`.
- Inicios posteriores conservan el rol existente y actualizan datos basicos de
  Google como `displayName`, `email`, `phone` y `photoURL`.
- El rol puede cambiarlo un usuario `admin` desde las vistas administrativas.
- El primer `admin` debe asignarse manualmente en Firestore.
- Crear una barberia promueve al usuario autenticado de `client` a `owner`.

## barberShops

- `name`
- `description`
- `address`
- `location`
- `photoUrl`
- `ownerId`
- `status`: `active | inactive`
- `createdAt`
- `updatedAt`

## services

- `name`
- `price`
- `durationMinutes`
- `active`
- `createdAt`
- `updatedAt`

## barbers

- `userId`
- `displayName`
- `photoUrl`
- `specialties`
- `active`
- `createdAt`
- `updatedAt`

## availability

- `dayOfWeek`
- `startTime`
- `endTime`
- `blocked`
- `reason`
- `createdAt`
- `updatedAt`

## appointments

- `clientId`
- `barberShopId`
- `barberId`
- `serviceId`
- `clientName`
- `barberName`
- `serviceName`
- `startAt`
- `endAt`
- `status`: `pending | confirmed | rejected | cancelled | completed`
- `priceSnapshot`
- `durationSnapshot`
- `createdAt`
- `updatedAt`

## Reglas iniciales

- No debe existir mas de una cita activa para el mismo barbero en la misma
  franja horaria.
- Las barberias creadas por usuarios autenticados quedan activas en el MVP.
- Solo barberias activas pueden recibir citas.
- Citas completadas o canceladas no se editan.
- Cancelacion o reagendado por cliente solo aplica con al menos 1 hora de
  anticipacion.
- Los solapes se validan en el repositorio de citas antes de crear o editar.
- Solo usuarios `admin` pueden listar usuarios globalmente, cambiar roles y
  operar barberias/citas fuera de su propiedad.
