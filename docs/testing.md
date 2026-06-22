# Testing — Mentorly UDD

Dos niveles de pruebas, separados a propósito:

## 1. Unitarios (offline, Supabase mockeado)

```bash
npm test          # corre todo, sin red
npm run test:watch
```

- Config: `jest.config.js` (entorno `jsdom`).
- Archivos: `*.spec.ts`.
- Supabase está **mockeado**: prueban lógica pura (rate limiter, mapeos,
  formato, manejo de errores de los servicios) sin tocar la red.
- Ignoran los `*.int.spec.ts`.

## 2. Integración (APIs REALES de Supabase)

```bash
npm run test:int                      # no destructivo
MENTORLY_E2E_SIGNUP=1 npm run test:int   # incluye el registro real (crea usuario)
npm run test:all                      # unitarios + integración
```

- Config: `jest.int.config.js` (entorno `node`, donde existe `fetch`).
- Archivos: `*.int.spec.ts`.
- Instancian los **servicios reales** (vía `Injector.create`, sin TestBed) con el
  cliente real y la clave publishable de `environment`. Pegan al proyecto
  Supabase de verdad.
- Soporte común en `src/app/testing/integration-support.ts`.

### Qué verifican

| API / Servicio | Comprueba |
| --- | --- |
| `AcademicCatalogApiService` | campuses/faculties/careers sembrados, filtros por campus/facultad, orden |
| `TeacherService` | la consulta anidada real resuelve sin error de esquema; `getTeachers()` siempre entrega arreglo |
| `BookingService` | RLS: anónimo ve `[]` y no puede insertar reservas |
| `ProfileService` | sin sesión devuelve `null` (auth + RLS no explotan) |
| `AuthService` | login real rechaza credenciales inválidas; (opcional) registro real → trigger `handle_new_user` → fila en `profiles` con FKs |

### Hallazgo abierto ⚠️

El test de registro (`MENTORLY_E2E_SIGNUP=1`) detecta que **el registro por
correo está DESACTIVADO** en el proyecto Supabase
(`AuthApiError: Email signups are disabled`). Mientras siga así, la página
`/register` no podrá crear cuentas reales.

**Arreglo:** Supabase Dashboard → Authentication → Providers → Email →
activar "Allow new users to sign up". Tras eso, el test del pipeline completo
debería pasar.