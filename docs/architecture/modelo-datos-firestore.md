# Modelo de datos inicial para Firestore

Este modelo es inicial y debera ajustarse durante el diseno tecnico.

## Colecciones propuestas

```text
users/{userId}
barberShops/{barberShopId}
barberShops/{barberShopId}/services/{serviceId}
barberShops/{barberShopId}/barbers/{barberId}
barbers/{barberId}/availability/{availabilityId}
appointments/{appointmentId}
notifications/{notificationId}
reports/{reportId}
```

## users

- `displayName`
- `email`
- `phone`
- `role`: `client | barber | owner | admin`
- `createdAt`
- `updatedAt`

## barberShops

- `name`
- `description`
- `address`
- `location`
- `photoUrl`
- `ownerId`
- `status`: `pending | approved | active | inactive`
- `createdAt`
- `updatedAt`

## services

- `name`
- `price`
- `durationMinutes`
- `active`

## barbers

- `userId`
- `displayName`
- `specialties`
- `active`

## availability

- `dayOfWeek`
- `startTime`
- `endTime`
- `blocked`
- `reason`

## appointments

- `clientId`
- `barberShopId`
- `barberId`
- `serviceId`
- `startAt`
- `endAt`
- `status`: `pending | confirmed | rejected | cancelled | completed`
- `createdAt`
- `updatedAt`

## Reglas iniciales

- No debe existir mas de una cita activa para el mismo barbero en la misma
  franja horaria.
- Solo barberias aprobadas y activas pueden recibir citas.
- Citas completadas o canceladas no se editan.
- Cancelacion o reagendado por cliente solo aplica con al menos 1 hora de
  anticipacion.

