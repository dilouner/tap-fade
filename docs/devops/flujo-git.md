# Flujo de trabajo Git

## Ramas

- `main`: version estable.
- `develop`: integracion de trabajo validado.
- `feature/<modulo>-<descripcion>`: desarrollo de nuevas capacidades.
- `fix/<descripcion>`: correcciones.
- `docs/<descripcion>`: cambios de documentacion.

## Reglas

- Todo cambio entra por pull request.
- Cada pull request debe indicar modulo afectado.
- Cada pull request debe indicar pruebas ejecutadas.
- Cada pull request debe pasar `npm run lint`, `npm run typecheck` y
  `npm run test:ci` en `/mobile` cuando afecte la app movil.
- No mezclar refactors grandes con funcionalidades.
- Documentar decisiones tecnicas relevantes.

## Convencion de commits

Formato sugerido:

```text
tipo(modulo): descripcion corta
```

Tipos:

- `feat`: nueva funcionalidad.
- `fix`: correccion.
- `docs`: documentacion.
- `test`: pruebas.
- `refactor`: mejora interna sin cambio funcional.
- `chore`: configuracion o mantenimiento.

Ejemplos:

```text
feat(auth): agregar pantalla de inicio de sesion
docs(architecture): definir modelo inicial de firestore
test(appointments): cubrir regla de horario ocupado
```
