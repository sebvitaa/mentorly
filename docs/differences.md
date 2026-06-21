# Diferencias: `api-contract.md` vs `supabase-schema.md`

Contraste entre los dos documentos de diseño de backend del proyecto:

- **`api-contract.md`** — contrato de una **API REST** (`snake_case`, endpoints `/api/...`,
  auth por bearer JWT). Es el modelo que implementa el **mock server** (`scripts/mock-api/server.mjs`).
- **`supabase-schema.md`** — **esquema Postgres/Supabase** (tablas SQL, RLS, triggers).
  Modelo **centrado en `profiles`**, ligado a Supabase Auth.

> Son dos paradigmas distintos del **mismo dominio**. No están alineados: el contrato REST
> modela más entidades (catálogo académico, roles, reservas, notificaciones) que no existen
> en el esquema Supabase. Esto coincide con la verificación en vivo (2026-06-21): en Supabase
> existen `teachers/profiles/subjects/teacher_subjects/availability_slots/reviews` (vacías) y
> **NO existen** `campuses/faculties/careers/bookings`.

---

## 1. Resumen de divergencias

| Área | `api-contract.md` (REST) | `supabase-schema.md` (Postgres) |
|------|--------------------------|----------------------------------|
| Entidad central | `User` (identificado por `email`) | `profiles` (identificado por `id` = `auth.users.id`) |
| Catálogo académico | `Campus`, `Faculty`, `Career` con endpoints | **Ausente** (no hay tablas) |
| Carrera del usuario | `career_id` (FK a catálogo) | `career` (texto libre) |
| Campus / Facultad | `campus_id`, `faculty_id` | **No existen** |
| Roles | `student` / `tutor` / `admin` (array) | **Sin concepto de roles** (tutor = tener fila en `teachers`) |
| Reservas (`bookings`) | Modelo + ciclo de vida + endpoints | **Ausente** |
| Notificaciones | `Notification` + endpoints | **Ausente** |
| Tutor | `TeacherProfile` con `user_id`, `name`, `career`, `year`, `status` | `teachers` con `profile_id`; `name/career/year` viven en `profiles`; **sin `status`** |
| Precio | `price_range` texto (decisión pendiente) | `price_min` + `price_max` enteros (decisión tomada) |
| Contacto del tutor | Oculto hasta reserva `confirmed` (`contact: null`) | Columnas con **lectura pública** (no se oculta) |
| Subjects | `id`, `name`, `category`, `active`, timestamps | Solo `id`, `name` (unique) |
| Ramos que el usuario cursa | No existe | `profile_subjects` (concepto extra) |
| Reviews | `booking_id`, `student_id`, `student_name` (texto) | `author_id` (FK), **sin** `booking_id`, nombre vía join |
| Nombre del usuario | `first_name` + `last_name` | `full_name` (un solo campo) |
| Año | `admission_year` | `year` (ej. "3er año") |
| IDs | Strings (`"campus-stgo"`, `"teacher-1"`) | `uuid` (`gen_random_uuid()`) |
| Auth | JWT propio, `/api/auth/*`, password ≥ 8 | Supabase Auth + trigger `handle_new_user` |

---

## 2. Diferencias en detalle

### 2.1 Modelo de identidad / usuario
- **REST:** `User` con `email` como **PK lógica**, más `first_name`, `last_name`,
  `campus_id`, `faculty_id`, `career_id`, `admission_year`, `roles[]`, timestamps.
- **Supabase:** `profiles.id` = `auth.users.id` (uuid). Campos `full_name`, `email`, `career`
  (texto), `year`, `avatar_url`, `bio`. **No** hay `first_name/last_name`, `campus_id`,
  `faculty_id`, `career_id`, `admission_year` ni `roles`.
- **Impacto:** el formulario de registro recoge `first_name/last_name/campus/faculty/career/admission_year`
  (forma REST), pero Supabase solo persiste `full_name`, `career` (texto) y `year` vía metadatos.
  `campus`, `facultad` y `wants_to_teach` se **pierden** hoy.

### 2.2 Catálogo académico (campus / facultad / carrera)
- **REST:** modela `Campus`, `Faculty`, `Career` (con `slug`, `active`, relación carrera→facultad→campus)
  y expone `/api/campuses`, `/api/faculties`, `/api/careers`.
- **Supabase:** **no existe nada** de esto. La "carrera" es solo texto en `profiles.career`.
- **Impacto:** es la brecha central para el TODO actual. Para conectar los selects de campus/
  facultad/carrera a Supabase hay que **crear y poblar** estas tablas (hoy solo viven en el mock).

### 2.3 Roles y permisos
- **REST:** `roles: ('student'|'tutor'|'admin')[]`; `wants_to_teach` agrega rol `tutor`;
  acciones admin restringidas.
- **Supabase:** sin roles. Ser tutor = existir en `teachers`. No hay rol `admin` ni moderación.
- **Impacto:** la lógica de roles/moderación del contrato no tiene soporte en el esquema.

### 2.4 Tutores
- **REST:** `TeacherProfileDto` con `user_id`, `name`, `career`, `year` (denormalizados),
  `price_range`, `status` (`pending|active|inactive|rejected`), `contact` nullable, `avatar_url`,
  y endpoints `POST/PATCH /api/teachers`, `PATCH /api/teachers/:id/status`.
- **Supabase:** `teachers` con `profile_id` (1:1), `about`, `price_min/price_max`,
  `contact_type/contact_value` (NOT NULL, embebido), `rating`, `review_count`.
  **Sin** `status`, `name`, `career`, `year`, `avatar` (esos viven en `profiles`).
- **Impacto:** no hay moderación (`status`) ni endpoints de gestión de tutor en Supabase.

### 2.5 Precio
- **REST:** `price_range` como **texto** ("$8.000-$12.000"); decisión marcada como **pendiente**.
- **Supabase:** **decisión tomada** → `price_min` + `price_max` enteros; la app reconstruye el string.

### 2.6 Visibilidad del contacto
- **REST:** regla de negocio explícita → el `contact` del tutor se **oculta** hasta que la
  reserva esté `confirmed` (`contact: null` mientras tanto).
- **Supabase:** `contact_type/contact_value` viven en `teachers` con política `for select using (true)`
  → **contacto público**. Contradice directamente la regla del contrato.

### 2.7 Subjects (ramos)
- **REST:** `SubjectDto` con `category`, `active`, `created_at`, `updated_at` y CRUD admin.
- **Supabase:** `subjects` solo `id` + `name` (unique). Sin `category/active/timestamps` ni CRUD.

### 2.8 Ramos que el usuario cursa
- **REST:** no existe ese concepto.
- **Supabase:** `profile_subjects` (N:N perfil↔ramo) modela los ramos que el usuario **cursa**,
  distinto de `teacher_subjects` (ramos que **enseña**). Concepto exclusivo del esquema.

### 2.9 Reviews
- **REST:** `ReviewDto` con `booking_id`, `student_id`, `teacher_id`, `student_name` (texto),
  `rating` 1–5; idealmente solo tras reserva completada.
- **Supabase:** `reviews` con `author_id` (FK a `profiles`), `teacher_id`, `rating`, `comment`,
  `date`. **Sin** `booking_id` ni `student_name` (el nombre se obtiene por join a `profiles.full_name`).
  Restricción `unique(teacher_id, author_id)` (una reseña por persona y tutor).
- **Impacto:** el esquema no liga la reseña a una reserva; el contrato sí.

### 2.10 Reservas (bookings)
- **REST:** `BookingDto` completo + estados (`pending/confirmed/rejected/cancelled/completed`),
  transiciones, endpoints (`POST /api/bookings`, accept/reject/cancel/complete), reglas
  (no fecha pasada, no bloque ocupado, validar correo UDD y combinación académica).
- **Supabase:** **no existe** tabla `bookings` ni lógica asociada. Hoy las reservas viven solo
  en memoria del mock + `localStorage` (`mentorly:requests`).

### 2.11 Notificaciones
- **REST:** `NotificationDto` + endpoints; confirmación de reserva gatilla notificación.
- **Supabase:** ausente.

### 2.12 Autenticación
- **REST:** JWT bearer, endpoints propios `/api/auth/register|login|logout|me`, `password` ≥ 8,
  unicidad de `email`, `roles` en la respuesta.
- **Supabase:** Supabase Auth (email/contraseña). Trigger `handle_new_user` crea el perfil con
  `full_name`, `career`, `year` desde los metadatos (no incluye campus/facultad/carrera/roles).

### 2.13 Convenciones de IDs y nombres
- **IDs:** REST usa strings legibles (`"campus-stgo"`, `"career-stgo-..."`, `"teacher-1"`);
  Supabase usa `uuid`. **Excepción a considerar:** si las tablas de catálogo se crean en Supabase
  conviene decidir si se conservan los IDs string del mock (para no romper DTOs/seed) o se migran a uuid.
- **Nombres:** REST separa `first_name`/`last_name` y usa `admission_year`; Supabase usa
  `full_name` y `year`.

---

## 3. Puntos consistentes entre ambos
- Fechas `YYYY-MM-DD` y horas `HH:mm` (24h).
- `hour` como **texto** en la disponibilidad.
- `rating` y `review_count` **derivados** por el backend (trigger en Supabase / cálculo en REST).
- Dominio institucional `@udd.cl` requerido para acciones sensibles.
- Disponibilidad como lista de días con `time_slots` (`hour` + `available`).

---

## 4. Brechas accionables (qué falta en Supabase respecto al contrato)
Ordenado por relevancia para el TODO actual:

1. **Catálogo académico** — crear y poblar `campuses`, `faculties`, `careers` (no existen).
2. **Persistir la selección académica del registro** — `profiles` no tiene dónde guardar
   `campus_id` / `faculty_id` / `career_id` (solo `career` texto). Decidir: agregar columnas/FK
   o seguir guardando solo el nombre de la carrera.
3. **Reservas** — crear tabla `bookings` + estados/transiciones si se migra el booking a Supabase.
4. **Roles** — sin soporte (`student/tutor/admin`); definir si se modelan.
5. **Estado/moderación de tutores** (`status`) — ausente.
6. **Notificaciones** — ausentes.
7. **Ocultar contacto hasta `confirmed`** — el esquema lo expone públicamente; revisar RLS.
8. **Campos de `subjects`** (`category`, `active`, timestamps) — ausentes.

> Nota: las diferencias 4–8 exceden el TODO actual (conectar catálogo académico y APIs). Se
> listan para que la decisión de alinear contrato ↔ esquema sea explícita más adelante.
