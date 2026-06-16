# Registro de decisiones tecnicas

## ADR-001 - Desarrollo modular

- Estado: Aprobada.
- Fecha: 2026-06-16.
- Decision: TapFade se desarrollara por modulos independientes y validados.
- Motivo: Reducir riesgo, facilitar pruebas, documentar avances y mantener
  trazabilidad con el FRU.
- Consecuencia: Cada modulo requiere implementacion, pruebas, evidencia y
  documentacion antes de considerarse terminado.

## ADR-002 - Firebase como backend inicial

- Estado: Aprobada.
- Fecha: 2026-06-16.
- Decision: Usar Firebase Auth, Firestore, Storage y FCM en la primera version.
- Motivo: Acelera autenticacion, datos en tiempo real, notificaciones y
  escalabilidad inicial.
- Consecuencia: El proyecto dependera de costos, limites y disponibilidad de
  servicios Firebase/Google.

## ADR-003 - Expo como punto de arranque

- Estado: Aprobada.
- Fecha: 2026-06-16.
- Decision: Iniciar con Expo para acelerar desarrollo y pruebas en dispositivos.
- Motivo: Reduce friccion inicial y permite validar rapido el vertical slice.
- Consecuencia: Si aparece una dependencia nativa no soportada, se evaluara
  migrar o usar desarrollo nativo gestionado.
