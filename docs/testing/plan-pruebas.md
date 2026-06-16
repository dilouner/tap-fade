# Plan de pruebas inicial

## Objetivo

Asegurar que cada modulo de TapFade sea verificable, trazable y estable antes
de avanzar al siguiente.

## Niveles de prueba

- Unitarias: funciones, validaciones y transformaciones.
- Integracion: servicios del modulo y acceso a datos.
- Funcionales: flujos completos segun FRU.
- Seguridad: acceso por rol y pantallas protegidas.
- Usabilidad: agendado sin ayuda y en menos de 2 minutos.
- Rendimiento: operaciones criticas p95 <= 3 segundos.

## Criterios de cierre por modulo

- Casos de prueba definidos.
- Pruebas ejecutadas y documentadas.
- Errores criticos corregidos.
- Evidencia anexada en bitacora o reporte.
- Requerimientos trazados.

## Casos base del FRU

| ID | Escenario |
|---|---|
| CP-001 | Registro con Google, Apple y correo |
| CP-002 | Intento de acceso sin autenticacion |
| CP-003 | Registro de barberia |
| CP-004 | Configurar horarios disponibles |
| CP-005 | Crear, editar y eliminar servicio |
| CP-006 | Busqueda por nombre y ubicacion |
| CP-007 | Agendar cita completa |
| CP-008 | Cancelar cita con anticipacion |
| CP-009 | Barbero confirma y rechaza cita |
| CP-010 | Recordatorios automaticos |
| CP-011 | Consultar historial de citas |
| CP-012 | Generar reporte de ocupacion |

