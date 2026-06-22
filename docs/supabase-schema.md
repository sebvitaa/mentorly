# Mentorly UDD — Esquema de base de datos (Supabase)

Referencia del esquema **actual y deployado**. Se mantiene sincronizado con los scripts en `docs/sql/`.  
Las migraciones se aplican **en orden**: fase-1 → fase-2 → fase-3 → fase-4 → fase-5.

---

## 1. Modelo conceptual

La app conecta **estudiantes UDD** con **tutores** (que también son estudiantes UDD).

| Tabla | Qué representa |
|---|---|
| `profiles` | Persona UDD ligada a Supabase Auth. Toda cuenta puede reservar tutorías. |
| `subjects` | Catálogo de ramos (Cálculo I, Programación…). |
| `profile_subjects` | Ramos que un perfil **está cursando** (N:N). |
| `teachers` | Faceta de tutor de un perfil (precio, descripción, estado). 1:1 con `profiles`. |
| `teacher_subjects` | Ramos que un tutor **enseña** (N:N). |
| `availability_slots` | Bloques horarios de un tutor (fecha + hora). |
| `reviews` | Reseñas que un perfil deja a un tutor. |
| `campuses` | Campus UDD (Santiago, Concepción). |
| `faculties` | Facultades. Sin `campus_id`; una facultad puede existir en varios campus. |
| `careers` | Carreras. Referencia a `faculties` y `campuses`. |
| `bookings` | Reservas de un estudiante a un tutor. |

Relaciones clave:
- `profiles` ← 1:1 → `teachers` (ser tutor es una faceta opcional, no un rol).
- `profiles` → `campus_id / faculty_id / career_id` (FKs al catálogo académico).
- La facultad de un campus se **deriva** de las carreras activas: no existe `careers.campus_id = faculty.campus_id`.

---

## 2. Tablas

### `profiles`

Creada automáticamente por el trigger `handle_new_user` al registrar un usuario.

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | `uuid` | NO | PK. FK → `auth.users(id)` on delete cascade. |
| `full_name` | `text` | NO | |
| `email` | `text` | sí | Correo `@udd.cl`. |
| `career` | `text` | NO | Nombre legible de la carrera (texto libre). |
| `year` | `text` | NO | Mantenido por compatibilidad. Usar `admission_year`. |
| `admission_year` | `text` | NO | Año de ingreso, ej. `"2023"`. |
| `avatar_url` | `text` | sí | |
| `bio` | `text` | NO | Default `''`. |
| `campus_id` | `text` | sí | FK → `campuses(id)`. |
| `faculty_id` | `text` | sí | FK → `faculties(id)`. |
| `career_id` | `text` | sí | FK → `careers(id)`. |
| `created_at` | `timestamptz` | NO | Default `now()`. |
| `updated_at` | `timestamptz` | NO | Default `now()`. |

---

### `subjects`

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | `uuid` | NO | PK. Default `gen_random_uuid()`. |
| `name` | `text` | NO | Unique. |

---

### `profile_subjects`

N:N entre perfiles y ramos que cursan.

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `profile_id` | `uuid` | NO | PK parcial. FK → `profiles(id)` on delete cascade. |
| `subject_id` | `uuid` | NO | PK parcial. FK → `subjects(id)` on delete cascade. |

---

### `teachers`

Faceta de tutor. 1:1 con `profiles` (`profile_id` es `unique`).

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | `uuid` | NO | PK. Default `gen_random_uuid()`. |
| `profile_id` | `uuid` | sí | **Unique.** FK → `profiles(id)` on delete cascade. |
| `about` | `text` | NO | Default `''`. |
| `price_min` | `integer` | **sí** | En pesos CLP. Null mientras `status = 'incomplete'`. |
| `price_max` | `integer` | **sí** | En pesos CLP. Null mientras `status = 'incomplete'`. |
| `contact_type` | `text` | **sí** | `'email'` o `'phone'`. Null mientras `status = 'incomplete'`. **Oculto vía grant.** |
| `contact_value` | `text` | **sí** | Null mientras `status = 'incomplete'`. **Oculto vía grant.** |
| `rating` | `numeric(2,1)` | NO | Default `0`. Actualizado por trigger. |
| `review_count` | `integer` | NO | Default `0`. Actualizado por trigger. |
| `status` | `text` | NO | Default `'incomplete'`. Check: `incomplete \| pending \| active \| inactive \| rejected`. |
| `weekly_availability` | `jsonb` | NO | Default `'[]'`. Patrón semanal `[{weekday,hour}]` (fase-5). Se expande a `availability_slots`. |
| `created_at` | `timestamptz` | NO | Default `now()`. |
| `updated_at` | `timestamptz` | NO | Default `now()`. |

**Estados del tutor:**
- `incomplete` — creado desde el registro (`wants_to_teach = true`); aún no completó el onboarding.
- `pending` — completó onboarding; espera activación por un admin.
- `active` — visible en el catálogo público y reservable.
- `inactive` — pausado por el tutor.
- `rejected` — rechazado por admin.

---

### `teacher_subjects`

N:N entre tutores y ramos que enseñan.

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `teacher_id` | `uuid` | NO | PK parcial. FK → `teachers(id)` on delete cascade. |
| `subject_id` | `uuid` | NO | PK parcial. FK → `subjects(id)` on delete cascade. |

---

### `availability_slots`

Superficie reservable (date-based) que consume el catálogo. Desde fase-5 se
**materializa** desde `teachers.weekly_availability` vía `expand_tutor_availability`
(próximas 2 semanas); los tutores no la editan directamente.

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | `uuid` | NO | PK. Default `gen_random_uuid()`. |
| `teacher_id` | `uuid` | NO | FK → `teachers(id)` on delete cascade. |
| `date` | `date` | NO | |
| `hour` | `text` | NO | Formato `"HH:MM"`, ej. `"09:00"`. |
| `available` | `boolean` | NO | Default `true`. |

Constraint: `unique (teacher_id, date, hour)`.

---

### `reviews`

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | `uuid` | NO | PK. Default `gen_random_uuid()`. |
| `teacher_id` | `uuid` | NO | FK → `teachers(id)` on delete cascade. |
| `author_id` | `uuid` | NO | FK → `profiles(id)` on delete cascade. El nombre se lee via join. |
| `rating` | `integer` | NO | Check: entre 1 y 5. |
| `comment` | `text` | NO | Default `''`. |
| `date` | `date` | NO | Default `current_date`. |
| `created_at` | `timestamptz` | NO | Default `now()`. |

Constraint: `unique (teacher_id, author_id)` — un perfil deja una sola reseña por tutor.

---

### `campuses`

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | `text` | NO | PK. Ej. `'campus-stgo'`, `'campus-ccpc'`. |
| `name` | `text` | NO | Ej. `'Santiago'`. |
| `slug` | `text` | NO | Ej. `'santiago'`. |
| `active` | `boolean` | NO | Default `true`. |

Datos sembrados: `campus-stgo` (Santiago) y `campus-ccpc` (Concepción).

---

### `faculties`

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | `text` | NO | PK. Ej. `'fac-ingenieria-stgo'`. |
| `name` | `text` | NO | Ej. `'Ingeniería'`. |
| `slug` | `text` | NO | |
| `active` | `boolean` | NO | Default `true`. |

Sin columna `campus_id`: las facultades disponibles en un campus se derivan de las carreras activas de ese campus. 11 facultades sembradas.

---

### `careers`

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | `text` | NO | PK. Ej. `'career-stgo-ingenieria-ing-civil-industrial'`. |
| `faculty_id` | `text` | NO | FK → `faculties(id)`. |
| `campus_id` | `text` | NO | FK → `campuses(id)`. |
| `name` | `text` | NO | Ej. `'Ingeniería Civil Industrial'`. |
| `slug` | `text` | NO | |
| `active` | `boolean` | NO | Default `true`. |

35 carreras sembradas (source of truth: `scripts/mock-api/server.mjs`).

---

### `bookings`

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | `uuid` | NO | PK. Default `gen_random_uuid()`. |
| `teacher_id` | `uuid` | NO | FK → `teachers(id)`. |
| `student_id` | `uuid` | NO | FK → `profiles(id)`. Default `auth.uid()`. |
| `date` | `date` | NO | |
| `hour` | `text` | NO | Formato `"HH:MM"`. |
| `status` | `text` | NO | Default `'pending'`. Check: `pending \| confirmed \| rejected \| cancelled`. |
| `message` | `text` | sí | Mensaje opcional del estudiante. |
| `created_at` | `timestamptz` | NO | Default `now()`. |

Índices: `bookings_student_idx (student_id)`, `bookings_teacher_idx (teacher_id)`.

---

## 3. Row Level Security

RLS activa en todas las tablas.

### Catálogo académico (`campuses`, `faculties`, `careers`, `subjects`)

| Tabla | Operación | Quién | Condición |
|---|---|---|---|
| `campuses` | SELECT | todos | `true` |
| `faculties` | SELECT | todos | `true` |
| `careers` | SELECT | todos | `true` |
| `subjects` | SELECT | todos | `true` |

### `profiles`

| Operación | Quién | Condición |
|---|---|---|
| SELECT | todos | `true` |
| INSERT | autenticado | `auth.uid() = id` |
| UPDATE | autenticado | `auth.uid() = id` |

### `teachers`

> **Nota de columnas:** `contact_type` y `contact_value` están **excluidos de los grants** para `anon` y `authenticated`. No viajan al cliente a través de PostgREST. Para exponerlos tras una reserva confirmada, se implementará una función `SECURITY DEFINER`.

Columnas accesibles vía API: `id, profile_id, about, price_min, price_max, rating, review_count, status, updated_at, created_at`.

| Operación | Quién | Condición |
|---|---|---|
| SELECT | todos (anon) | `status = 'active'` |
| SELECT | autenticado | `status = 'active'` OR `profile_id = auth.uid()` |
| INSERT | autenticado | `profile_id = auth.uid()` |

### `teacher_subjects` / `availability_slots` / `reviews`

| Operación | Quién | Condición |
|---|---|---|
| SELECT | todos | `true` |

Writes de `reviews`:

| Operación | Quién | Condición |
|---|---|---|
| INSERT | autenticado | `auth.uid() = author_id` |
| UPDATE | autenticado | `auth.uid() = author_id` |

### `profile_subjects`

| Operación | Quién | Condición |
|---|---|---|
| SELECT | todos | `true` |
| ALL (insert/update/delete) | autenticado | `auth.uid() = profile_id` |

### `bookings`

| Operación | Quién | Condición |
|---|---|---|
| SELECT | autenticado | `auth.uid() = student_id` |
| INSERT | autenticado | `auth.uid() = student_id` |
| UPDATE (cancelar) | autenticado | `auth.uid() = student_id` |

---

## 4. Triggers y funciones

### `handle_new_user` → disparado por `on_auth_user_created`

Se ejecuta `AFTER INSERT ON auth.users`. Crea la fila en `profiles` con los metadatos del registro. Si `raw_user_meta_data->>'wants_to_teach' = 'true'`, también crea la fila en `teachers` con `status = 'incomplete'`.

Metadatos que consume del `signUp`:

| Campo en `options.data` | Destino en DB |
|---|---|
| `full_name` | `profiles.full_name` |
| `career` | `profiles.career` |
| `admission_year` | `profiles.admission_year` |
| `campus_id` | `profiles.campus_id` |
| `faculty_id` | `profiles.faculty_id` |
| `career_id` | `profiles.career_id` |
| `wants_to_teach` | Si `'true'` → inserta fila en `teachers` |

---

### `refresh_teacher_rating` → disparado por `trg_refresh_rating`

Se ejecuta `AFTER INSERT OR UPDATE OR DELETE ON reviews`. Recalcula `teachers.rating` (promedio con 1 decimal) y `teachers.review_count` para el tutor afectado.

---

### `enforce_udd_email` → disparado por `enforce_udd_email_before_insert`

Se ejecuta `BEFORE INSERT ON auth.users`. Rechaza registros cuyo email no termine en `@udd.cl`. Es la barrera server-side que complementa la validación del cliente en `login.page` y `register.page`.

---

### Publicación del perfil tutor (fase-5) — RPCs `SECURITY DEFINER`

El editor del perfil tutor (precio, ramos, contacto, disponibilidad semanal) usa estas funciones; concentran la lógica y permiten acceder al contacto (oculto por grant).

| Función | Qué hace |
|---|---|
| `get_my_tutor_profile()` → `json` | Devuelve el perfil tutor editable de `auth.uid()` (incluye `contact_*`, `subject_ids[]`, `weekly_availability[]`), o `null` si no tiene ficha. |
| `save_tutor_profile(p_about, p_price_min, p_price_max, p_contact_type, p_contact_value, p_subject_ids uuid[], p_weekly jsonb)` → `text` | Crea/actualiza la ficha tutor, reemplaza sus ramos, guarda el patrón semanal, lo materializa y decide el `status`: `active` si está completo (precio + contacto + ≥1 ramo + ≥1 bloque), si no `incomplete`. Devuelve el status. |
| `expand_tutor_availability(p_teacher uuid)` | Materializa `weekly_availability` en `availability_slots` para hoy..+13 días (idempotente; limpia futuros fuera del patrón). |
| `expand_all_tutor_availability()` | Reexpande a todos los tutores. Pensada para un job diario (pg_cron) que "rueda" la ventana de 2 semanas. |

`get_my_tutor_profile` y `save_tutor_profile` tienen `grant execute ... to authenticated`.

---

## 5. Diagramas de relaciones

```
auth.users
    │ 1:1 (on_auth_user_created)
    ▼
profiles ──< profile_subjects >── subjects ──< teacher_subjects >── teachers
    │  │                                                                 │
    │  │ FK campus_id / faculty_id / career_id                          │
    │  ├──► campuses                                                     │
    │  ├──► faculties                                                    │
    │  └──► careers                                                      │
    │                                                                    │
    ├──< bookings (student_id) ──────────────────────► teachers (teacher_id)
    │                                                                    │
    └──< reviews (author_id) ───────────────────────► teachers (teacher_id)
                                                                         │
                                              availability_slots >───────┘
```

---

## 6. Seed

| Qué | Script |
|---|---|
| Catálogo académico (campuses, faculties, careers) | `docs/sql/fase-1-academic-catalog.sql` |
| Tutor de demo (para probar reservas) | `docs/sql/seed-demo-tutor.sql` |

El seed del tutor demo requiere un usuario ya registrado con email `tutor.demo@udd.cl`. Ver instrucciones dentro del archivo.

---

## 7. Estado actual del proyecto Supabase

| Tabla | Estado |
|---|---|
| `campuses` | 2 filas (Santiago, Concepción) |
| `faculties` | 11 filas |
| `careers` | 35 filas |
| `subjects` | presente (sin seed cargado aún) |
| `teachers` | 0 tutores activos (RLS columnas `contact_*` ocultas) |
| `bookings` | 0 reservas |
| `profiles` | 1 fila (usuario de prueba de integración) |

**Bloqueante activo:** el registro por correo está **desactivado** en el proyecto (`Email signups are disabled`). Para que `/register` funcione: Dashboard → Authentication → Providers → Email → activar "Allow new users to sign up".