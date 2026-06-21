# PLAN — Alinear el sistema sobre Supabase (manteniéndolo simple)

Plan para resolver lo levantado en `docs/audit.md` y `docs/differences.md`.
Escrito con un sesgo deliberado a la **simplicidad**: menos código, una sola fuente de
verdad, y **no construir lo que la app no usa**.

---

## Principios

1. **Una sola fuente de verdad: Supabase.** Hoy `AuthService` y `TeacherService` ya usan
   Supabase. El resto (catálogo académico, reservas) se alinea ahí. El mock REST queda solo
   como herramienta de desarrollo, no como dependencia de runtime.
2. **YAGNI.** El `api-contract.md` modela mucho más de lo que la app necesita (roles,
   notificaciones, moderación de tutores, `booking_id` en reviews, `category` en subjects).
   **No se implementan** hasta que exista una necesidad real (ver §6).
3. **Mínima fricción de tipos.** Reusar los DTOs e IDs que ya existen. Las tablas de catálogo
   usan **PK de texto** iguales a las del mock (`campus-stgo`, etc.) → el seed y los DTOs no cambian.
4. **No romper contratos públicos.** Reescribir el *interior* de los servicios para que peguen
   a Supabase, manteniendo sus firmas (`Observable<...>`) → los componentes no se tocan.
5. **Cada fase compila, pasa tests y deja la app usable.**

---

## Estado base (verificado 2026-06-21)

- Supabase conectado. Existen (vacías): `profiles`, `teachers`, `subjects`, `teacher_subjects`,
  `availability_slots`, `reviews`.
- **No existen:** `campuses`, `faculties`, `careers`, `bookings`.
- DDL se aplicará con el **Supabase CLI + `.env`** (el usuario lo está configurando).

---

## Fase 0 — Limpieza rápida (solo código, sin Supabase)

Cierra deuda del `audit.md`. Barato y de bajo riesgo; hacerlo primero.

| # | Tarea | Archivos |
|---|-------|----------|
| 0.1 | Borrar código muerto huérfano tras el merge | `api/teacher-api.service.ts`, `api/auth-api.service.ts`, `api/mappers/teacher.mapper.ts`, `api/dtos/teacher.dto.ts`, `api/dtos/auth.dto.ts` |
| 0.2 | Guard de ruta para zonas privadas (`/requests`) | nuevo `guards/auth.guard.ts` (CanActivateFn), `app.routes.ts` |
| 0.3 | Limpiar imports sin uso detectados (p. ej. `IonLabel`) | `login.page.ts`, `register.page.ts` |

**Guard (simple):**
```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
```

**Aceptación:** `ng build` limpio, `npm test` verde, `/requests` redirige a `/login` sin sesión.

---

## Fase 1 — Catálogo académico en Supabase  *(núcleo del TODO)*

Resuelve diferencias §2.2 y §2.1 / brechas accionables #1 y #2.

### 1.1 Esquema (DDL vía CLI)
Tablas con **PK de texto** (iguales al mock) y lectura pública:
```sql
create table public.campuses (
  id text primary key, name text not null, slug text not null, active boolean not null default true
);
create table public.faculties (
  id text primary key, campus_id text not null references public.campuses(id),
  name text not null, slug text not null, active boolean not null default true
);
create table public.careers (
  id text primary key,
  faculty_id text not null references public.faculties(id),
  campus_id  text not null references public.campuses(id),
  name text not null, slug text not null, active boolean not null default true
);
alter table public.campuses  enable row level security;
alter table public.faculties enable row level security;
alter table public.careers   enable row level security;
create policy "lectura publica campuses"  on public.campuses  for select using (true);
create policy "lectura publica faculties" on public.faculties for select using (true);
create policy "lectura publica careers"   on public.careers   for select using (true);
```
> ⚠️ El `faculties` del mock no trae `campus_id`; lo añadimos para que el filtro por campus
> sea real. El **seed** se genera desde `scripts/mock-api/server.mjs` (fuente única de datos).

### 1.2 Persistir la selección del registro
Lo más simple que conecta las tablas al formulario de cuenta:
```sql
alter table public.profiles
  add column campus_id  text references public.campuses(id),
  add column faculty_id text references public.faculties(id),
  add column career_id  text references public.careers(id);
```
Extender el trigger `handle_new_user` para leer `campus_id/faculty_id/career_id` de los metadatos.
(Se mantiene `career` texto como nombre legible; los IDs son la referencia.)

### 1.3 Código
- Reescribir `AcademicCatalogApiService` para leer de Supabase (vía `SupabaseService`),
  **manteniendo las firmas** `getCampuses()/getFaculties(campusId)/getCareers({campusId,facultyId})`
  → `register.page.ts` y `schedule-calendar.component.ts` **no cambian**.
  (Elimina la dependencia de `HttpClient`/`environment.apiUrl` para el catálogo y el fallback mock.)
- `AuthService.SignUpData`: agregar `campusId/facultyId/careerId`.
- `register.page.ts`: pasar los tres IDs a `signUp` (hoy se descartan).

### 1.4 Tests
- `academic-catalog.service.spec.ts`: mapeo de filas Supabase → DTOs y filtros.
- Actualizar `auth.service.spec.ts`: `signUp` envía los nuevos metadatos.

**Aceptación:** en registro, Campus muestra Santiago/Concepción **desde Supabase**; el cascade
campus→facultad→carrera funciona; la cuenta nueva guarda `campus_id/faculty_id/career_id` en `profiles`.

---

## Fase 2 — Reservas en Supabase

Resuelve diferencia §2.10 / brecha #3. Versión **mínima** (sin estados que la UI no usa aún).

### 2.1 Esquema
```sql
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id),
  student_id uuid not null references public.profiles(id) default auth.uid(),
  date date not null,
  hour text not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','rejected','cancelled')),
  message text,
  created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
-- el estudiante ve y crea las suyas; el tutor ve las que le llegan
create policy "crear mi reserva" on public.bookings
  for insert to authenticated with check (auth.uid() = student_id);
create policy "ver mis reservas" on public.bookings
  for select to authenticated using (auth.uid() = student_id);
```
> Los datos del alumno (nombre, correo, campus...) **ya viven en `profiles`** → no se duplican
> en `bookings` (a diferencia del `BookingDto` del contrato). Eso simplifica la tabla y evita
> inconsistencias.

### 2.2 Código
- Reescribir `BookingApiService` (o renombrar a `BookingService`) para usar Supabase, manteniendo
  `createBooking(...)` y el listado que usa `requests.page.ts`.
- `schedule-calendar.component.ts`: el formulario deja de pedir datos que ya están en el perfil;
  toma `student_id` de la sesión. (Menos campos = más simple y alineado con el guard de la Fase 0.)
- Evaluar reemplazar `request-history.service` (localStorage) por la consulta a `bookings`.

### 2.3 Tests
- `booking.service.spec.ts`: crear y listar reservas (Supabase mockeado).

**Aceptación:** crear una reserva la persiste en Supabase y aparece en "Mis solicitudes".

---

## Fase 3 — Endurecimiento y cierre

| # | Tarea | Origen |
|---|-------|--------|
| 3.1 | Revisar RLS de todo el esquema (incluye **ocultar contacto** del tutor hasta `confirmed`, diff §2.6) | audit 🟡 / diff §2.6 |
| 3.2 | Forzar dominio `@udd.cl` del lado servidor (hook de signup / policy), no solo en cliente | audit 🟡 |
| 3.3 | Retirar la dependencia de runtime del mock REST (`environment.apiUrl`/`useMocks` quedan sin uso) | diff §2.x |
| 3.4 | Actualizar `docs/supabase-schema.md` con las tablas nuevas | mantenimiento |

---

## 6. Lo que **NO** vamos a construir (YAGNI)

Decisiones explícitas para no inflar el sistema. Si el producto las pide, se reabren.

| Feature del `api-contract.md` | Por qué se omite |
|-------------------------------|------------------|
| Roles `student/tutor/admin` | La app no los usa. "Tutor" = tener fila en `teachers`. |
| Notificaciones | Sin canal definido ni UI que las consuma. |
| `status`/moderación de tutores | No hay panel admin ni flujo de aprobación. |
| `reviews.booking_id` | Las reseñas hoy no parten de una reserva en la UI. |
| `subjects.category/active/timestamps` | La UI solo usa el nombre del ramo. |
| `first_name`/`last_name` separados en BD | `profiles.full_name` basta; el form ya mapea. |
| Estados de reserva `completed` + transiciones ricas | La UI actual solo necesita pending/confirmed/rejected/cancelled. |

---

## Orden, riesgo y rollback

- **Orden:** Fase 0 → 1 → 2 → 3. Cada fase es independiente y entrega valor.
- **Riesgo principal:** la DDL es destructiva si se ejecuta mal. Mitigación: versionar los `.sql`
  como migraciones del CLI y probar en `supabase db reset` local antes de remoto.
- **Rollback:** las tablas nuevas (`campuses/faculties/careers/bookings`) y las columnas de
  `profiles` se pueden `drop` sin afectar lo existente; el código de cada fase va en su propio commit.

---

## Resumen para empezar
1. **Fase 0** ya (no necesita Supabase).
2. Con el CLI + `.env` listos: **Fase 1** (catálogo) — es el corazón del TODO.
3. Luego **Fase 2** (reservas) y **Fase 3** (RLS/limpieza).
