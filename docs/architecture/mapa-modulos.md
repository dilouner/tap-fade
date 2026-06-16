# Mapa de modulos

## Estructura sugerida

```text
src/
  app/
  modules/
    auth/
    users/
    barber-shops/
    services/
    availability/
    appointments/
    notifications/
    reports/
    admin/
  shared/
    components/
    theme/
    navigation/
    firebase/
    validation/
    utils/
```

## Modulos

| Modulo | Proposito | Requerimientos relacionados |
|---|---|---|
| auth | Registro, login y sesion | RF-001, RF-002 |
| users | Perfil y roles | RN-001 |
| barber-shops | Registro y administracion de barberias | RF-003, RN-006 |
| services | Servicios, duracion y precios | RF-004 |
| availability | Horarios y bloqueos por barbero | RF-005, RN-003 |
| appointments | Agendar, cancelar, reagendar y confirmar citas | RF-007, RF-008, RF-009 |
| notifications | Push y recordatorios | RF-010, RN-007 |
| reports | Reportes de ocupacion | RF-012 |
| admin | Aprobacion y soporte de plataforma | RF-003, RN-006 |

## Regla de cierre por modulo

Cada modulo debe entregar:

- Pantallas o servicios implementados.
- Casos de prueba.
- Evidencia de validacion.
- Reglas de negocio verificadas.
- Documentacion actualizada.

