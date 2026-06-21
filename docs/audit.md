# Auditoría del sistema — Mentorly UDD

_Fecha: 2026-06-21 · Alcance: estado del repo tras el merge de `feature/academic-catalog-selects` sobre la rama con conexión a Supabase._

## Resumen ejecutivo

La app es un frontend Ionic + Angular 19 (standalone) que hoy convive con **dos backends**:

- **Supabase** → autenticación y tutores (`AuthService`, `TeacherService`).
- **API REST mock** (`scripts/mock-api/server.mjs`) → reservas y catálogo académico
  (`BookingApiService`, `AcademicCatalogApiService`).

El merge dejó la capa de UI cableada a una versión de `AuthService` distinta de la
que se conservó, por lo que **la app no compilaba**. Se corrigió adaptando la UI a
Supabase. También se encontraron y arreglaron dos bugs de configuración de entorno,
se documentó código muerto y se implementó rate limiting en login/registro con su
suite de tests.

Estado tras la intervención: ✅ `ng build` (dev y prod) compila · ✅ `npm test` 23/23 en verde.

---

## Hallazgos

### 🔴 Crítico — La UI estaba cableada a un `AuthService` inexistente _(corregido)_

Al resolver el conflicto se conservó el `AuthService` de Supabase (signals + Promises),
pero los consumidores venían de la otra rama y usaban la API REST anterior
(Observables/DTOs). Cuatro archivos no compilaban:

| Archivo | Llamaba | Realidad (Supabase) |
| --- | --- | --- |
| `app.component.ts` | `restoreSession()` | innecesario: el constructor hidrata sesión vía `getSession()` |
| `header.component.ts` | `user$` (Observable), `logout()` | `user` (signal), `signOut()` |
| `login.page.ts` | `login({email,password})` → Observable | `signIn(email, password)` → Promise |
| `register.page.ts` | `register(RegisterRequestDto)` → Observable | `signUp(SignUpData)` → Promise |

**Acción:** se reescribieron los cuatro consumidores contra la API de Supabase. El
formulario de registro mapea a `SignUpData` así: `fullName = nombre + apellido`,
`career = nombre de la carrera seleccionada`, `year = año de admisión`.

> ⚠️ **Limitación conocida:** `campus`, `facultad` y `wants_to_teach` del formulario de
> registro **no se persisten** en los metadatos de Supabase (el modelo `SignUpData` no
> los contempla). Si se requieren, hay que extender `SignUpData` + el trigger
> `handle_new_user`.

### 🔴 Crítico — `environment.prod.ts` con shape incompleto _(corregido)_

El build de producción reemplaza `environment.ts` por `environment.prod.ts`
(`angular.json` → `fileReplacements`). El archivo de prod **no tenía las claves
`supabase` ni `auth`** que leen `SupabaseService` y `AuthService`, por lo que un build
de producción reventaba en runtime. Se alineó el shape con el de desarrollo.

### 🟠 Bug — Falta `environment.useMocks` _(corregido)_

`BookingApiService` lee `environment.useMocks` y ningún entorno la definía → error de
compilación (`TS2339`). Se agregó `useMocks: true` a ambos entornos: sin `apiUrl`, los
servicios REST sirven datos mock en vez de fallar.

### 🟡 Código muerto tras el merge

Al conservar las versiones Supabase, quedaron huérfanos (no los importa nadie):

- `src/app/api/teacher-api.service.ts`
- `src/app/api/auth-api.service.ts`
- `src/app/api/mappers/teacher.mapper.ts`
- `src/app/api/dtos/teacher.dto.ts`, `src/app/api/dtos/auth.dto.ts`

Compilan, pero confunden y aumentan superficie de mantenimiento. **Recomendación:**
eliminarlos (o moverlos si se planea volver al backend REST). No se borraron en esta
pasada para no tomar una decisión de producto sin confirmación.

### 🟡 Seguridad

1. **Sin guards de ruta.** `app.routes.ts` no protege ninguna ruta; `/requests` (y
   cualquier área "privada") es accesible sin sesión. Recomendado: `CanActivateFn`
   basado en `AuthService.isAuthenticated()`.
2. **Rate limiting solo en cliente.** El límite implementado (ver abajo) es una barrera
   de UX/anti-spam; se puede saltar. El control real debe estar en el servidor: Supabase
   Auth ya aplica rate limiting propio, y el mock API debería sumar el suyo en producción.
3. **Validación de correo `@udd.cl` solo en cliente.** El regex en login/registro es UX;
   la restricción real debe imponerse en Supabase (p. ej. policies/hook de signup).
4. **`localStorage` para sesión y datos** (`StorageService`, favoritos, historial). Es
   legible por cualquier script → vector de XSS. Mantener sanitizada toda entrada de
   usuario y considerar no persistir tokens sensibles ahí.
5. **Clave publishable en el repo** (`environment.*.ts`). Es aceptable (es la clave
   pública/anon), **siempre que** las tablas tengan Row Level Security estricta. Verificar
   RLS en `teachers`, `profiles`, `reviews`, `availability_slots`.

### 🟢 Observaciones de arquitectura

- Conviven dos fuentes de datos (Supabase + REST mock). Es funcional, pero conviene
  decidir una estrategia única o documentar claramente la frontera.
- `TeacherService` y `AuthService` (Supabase) tienen buen fallback a mocks y son la
  fuente de verdad; mantener ese patrón si se migra booking/catálogo a Supabase.

---

## Rate limiting (nueva funcionalidad)

**Requisito:** 1 intento cada 10 s para login y para creación de cuenta.

**Implementación:**

- `src/app/utils/rate-limiter.ts` — clase `RateLimiter` reutilizable (ventana mínima por
  clave, reloj inyectable para tests) y `RateLimitError` (expone `retryAfterMs` y un
  mensaje legible en español).
- `AuthService` instancia un `RateLimiter(10_000)` y aplica `enforceRateLimit()` en
  `signIn` (clave `login`) y `signUp` (clave `signup`), con conteos **independientes**.
- **Los intentos fallidos también consumen el límite** (anti fuerza bruta): un error de
  credenciales no permite reintentar al instante.
- `login.page.ts` / `register.page.ts` capturan `RateLimitError` y muestran el mensaje
  (con la espera en segundos) vía toast.

**Alcance:** es protección del lado del cliente. Para defensa real, apoyarse en el rate
limiting de Supabase y/o del backend.

---

## Testing (nueva infraestructura)

No existía runner de tests. Se configuró **Jest + jest-preset-angular** (jsdom, sin
navegador): `jest.config.js`, `setup-jest.ts`, `tsconfig.spec.json`. Correr con
`npm test`.

| Suite | Qué cubre |
| --- | --- |
| `utils/rate-limiter.spec.ts` | ventanas de tiempo, conteo por clave, reset, `RateLimitError` |
| `services/auth.service.spec.ts` | delegación a Supabase + rate limiting (login/registro, fallidos, independencia, reintento a los 10 s) |
| `utils/format.util.spec.ts` | iniciales y formato de precio CLP |

**23 tests en verde.** Gaps a futuro: componentes de página (login/register/header),
`TeacherService` (mapeo + fallback), guards cuando existan.

---

## Próximos pasos recomendados (priorizados)

1. Agregar guard de autenticación a rutas privadas (`/requests`).
2. Eliminar el código muerto del bloque 🟡 (o decidir el futuro del backend REST).
3. Confirmar/forzar RLS en Supabase y el dominio `@udd.cl` del lado servidor.
4. Persistir `campus`/`facultad`/`wants_to_teach` en el registro si el producto los pide.
5. Ampliar cobertura de tests a páginas y `TeacherService`.
