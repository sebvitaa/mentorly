# Mentorly — Esquema de base de datos (Supabase)

Documento de referencia para crear/actualizar la base de datos en Supabase antes de conectar la app.
Derivado del modelo de dominio actual (`src/app/models/teacher.model.ts`), los datos mock
(`src/app/data/mock-teachers.ts`) y la decisión de que **`profiles` es la entidad central**.

> **Importante:** lee la sección [Supuestos a validar](#supuestos-a-validar). Tomé varias
> decisiones de diseño; si alguna no calza, avísame y ajusto el esquema.

> **Estado por fases (PLAN.md).** El SQL ejecutable vive en `docs/sql/` y se aplica en orden:
> - **Fase 1** — `docs/sql/fase-1-academic-catalog.sql`: catálogo académico
>   (`campuses`, `faculties`, `careers`) + columnas `campus_id/faculty_id/career_id`
>   en `profiles` + extensión del trigger `handle_new_user`.
> - **Fase 2** — `docs/sql/fase-2-bookings.sql`: reservas (`bookings`) + RLS.
> - **Fase 3** — `docs/sql/fase-3-hardening.sql`: fuerza dominio `@udd.cl` server-side,
>   oculta a nivel BD las columnas de contacto del tutor (`contact_type/contact_value`)
>   y reafirma RLS en todo el esquema.
>
> Notas de modelo: `faculties` **no** tiene `campus_id` (una facultad puede existir en
> varios campus); las facultades por campus se derivan de `careers`. La tabla `bookings`
> **no** duplica datos del alumno: viven en `profiles` (`student_id` → `profiles`).

---

## 1. Resumen del modelo

La app conecta **estudiantes UDD** con **tutores particulares** (que también son estudiantes UDD).

El **centro del sistema es `profiles`**: representa al usuario logueado (vía Supabase Auth) e
incluye su carrera, año y los **ramos que está cursando**. Un perfil puede, además, ofrecerse
como tutor (ficha en `teachers`).

| Tabla | Qué guarda |
|-------|------------|
| **`profiles`** | **Usuario UDD: carrera, año, ramos que cursa, avatar. Ligado a Supabase Auth.** |
| `profile_subjects` | Ramos que el usuario **está cursando** (N:N perfil ↔ ramo) |
| `subjects` | Catálogo de ramos (Cálculo I, Programación, etc.) |
| `teachers` | Ficha de tutoría de un perfil (precio, descripción, contacto) |
| `teacher_subjects` | Ramos que el tutor **enseña** (N:N tutor ↔ ramo) |
| `availability_slots` | Bloques de horario del tutor (fecha + hora + disponible) |
| `reviews` | Reseñas que un perfil deja a un tutor |
| `campuses` / `faculties` / `careers` | Catálogo académico UDD (Fase 1) |
| `bookings` | Reservas que un estudiante hace a un tutor (Fase 2) |

---

## 2. Diagrama de relaciones (texto)

```
auth.users
    │ 1:1
    ▼
profiles ──< profile_subjects >── subjects ──< teacher_subjects >── teachers
    │                                                                  │
    ├──< reviews (author_id) >──────────────────────────────────────┘ (teacher_id)
    │                                                                  │
    └── (1:1 opcional) ───────────────────────────────────────────────┤
                                                                       │
                                              availability_slots >─────┘
```

- `profiles` es el usuario. Cursa ramos (`profile_subjects`).
- `teachers` es la **faceta de tutor** de un perfil: enseña ramos (`teacher_subjects`),
  tiene disponibilidad (`availability_slots`) y recibe reseñas (`reviews`).
- Cada reseña la escribe un perfil (`reviews.author_id`).

---

## 3. SQL para crear la base de datos

> Pégalo en **Supabase → SQL Editor → New query**. Pensado para una base limpia.
> Si ya creaste tablas con la versión anterior del doc, mira la sección
> [Qué cambió / qué recrear](#5-qué-cambió-respecto-a-la-versión-anterior).

```sql
-- =========================================================
-- Mentorly — esquema (profiles como centro)
-- =========================================================
create extension if not exists "pgcrypto";

-- ---------- CATÁLOGO DE RAMOS ----------
create table public.subjects (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);

-- ---------- PERFILES (USUARIO UDD — CENTRO DEL SISTEMA) ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text        not null,
  email       text,                              -- normalmente el correo @udd.cl
  career      text        not null,              -- carrera que estudia
  year        text        not null,              -- año que cursa, ej. "3er año"
  avatar_url  text,
  bio         text        not null default '',   -- descripción libre del usuario
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- RAMOS QUE EL USUARIO ESTÁ CURSANDO ----------
create table public.profile_subjects (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  primary key (profile_id, subject_id)
);

-- ---------- TUTORES (faceta de tutoría de un perfil) ----------
create table public.teachers (
  id            uuid primary key default gen_random_uuid(),
  -- Un tutor ES un perfil. 1:1 con profiles (ver supuesto #1)
  profile_id    uuid unique references public.profiles(id) on delete cascade,
  about         text        not null default '',
  -- Precio normalizado en pesos (ver supuesto #2)
  price_min     integer     not null,
  price_max     integer     not null,
  -- Contacto (ver supuesto #3)
  contact_type  text        not null check (contact_type in ('email','phone')),
  contact_value text        not null,
  -- Métricas derivadas de reviews (ver supuesto #4)
  rating        numeric(2,1) not null default 0,
  review_count  integer      not null default 0,
  created_at    timestamptz  not null default now()
);

-- ---------- RAMOS QUE EL TUTOR ENSEÑA ----------
create table public.teacher_subjects (
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

-- ---------- DISPONIBILIDAD ----------
create table public.availability_slots (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  date       date    not null,
  hour       text    not null,            -- "09:00" (ver supuesto #5)
  available  boolean not null default true,
  unique (teacher_id, date, hour)
);

-- ---------- RESEÑAS ----------
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text    not null default '',
  date       date    not null default current_date,
  created_at timestamptz not null default now(),
  -- un perfil deja una sola reseña por tutor (ver supuesto #6)
  unique (teacher_id, author_id)
);

-- ---------- ÍNDICES ÚTILES ----------
create index on public.profile_subjects (subject_id);
create index on public.teacher_subjects (subject_id);
create index on public.availability_slots (teacher_id, date);
create index on public.reviews (teacher_id);
```

> El **nombre del autor** de una reseña ya no se guarda como texto: se obtiene con un join a
> `profiles.full_name` desde `author_id`. Así el dato vive en un solo lugar.

---

## 4. (Opcional) Recalcular rating y review_count

```sql
create or replace function public.refresh_teacher_rating()
returns trigger language plpgsql as $$
declare
  t_id uuid := coalesce(new.teacher_id, old.teacher_id);
begin
  update public.teachers t set
    review_count = (select count(*) from public.reviews r where r.teacher_id = t_id),
    rating = coalesce((select round(avg(r.rating)::numeric, 1)
                       from public.reviews r where r.teacher_id = t_id), 0)
  where t.id = t_id;
  return null;
end $$;

create trigger trg_refresh_rating
after insert or update or delete on public.reviews
for each row execute function public.refresh_teacher_rating();
```

### Crear el perfil automáticamente al registrarse (recomendado)

Para que cada usuario nuevo de Auth tenga su fila en `profiles`:

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, career, year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'career', ''),
    coalesce(new.raw_user_meta_data->>'year', '')
  );
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
```

---

## 5. Qué cambió respecto a la versión anterior

Si ya creaste las tablas con el doc anterior, estas son las **tablas a recrear**:

| Tabla | Cambio |
|-------|--------|
| **`profiles`** | **RECREAR.** Antes era opcional y mínima. Ahora es obligatoria y central: agrega `career`, `year`, `email`, `bio`, `avatar_url`. |
| **`profile_subjects`** | **NUEVA.** Ramos que el usuario está cursando. |
| **`teachers`** | **RECREAR.** Se le agrega `profile_id` (1:1 con `profiles`) y se le quitan `name`, `career`, `year`, `avatar_url` (ahora viven en `profiles`). |
| **`reviews`** | **RECREAR.** Se quita `student_name` (texto) y `author_id` pasa a ser **obligatorio** (`not null`) + restricción única por tutor. |
| `subjects`, `teacher_subjects`, `availability_slots` | Sin cambios. |

SQL para recrear solo lo que cambió (orden importa por las FKs):

```sql
drop table if exists public.reviews          cascade;
drop table if exists public.teachers         cascade;  -- también arrastra teacher_subjects/slots
drop table if exists public.profile_subjects cascade;
drop table if exists public.profiles         cascade;
-- Luego vuelve a ejecutar, en este orden, los CREATE de la sección 3:
-- profiles → profile_subjects → teachers → teacher_subjects → availability_slots → reviews
```

> Como `teachers` cambió, `teacher_subjects` y `availability_slots` se borran por el `cascade`;
> vuelve a crearlas también (su definición no cambió).

---

## 6. Seguridad (RLS) — recomendado

```sql
alter table public.profiles           enable row level security;
alter table public.profile_subjects   enable row level security;
alter table public.subjects           enable row level security;
alter table public.teachers           enable row level security;
alter table public.teacher_subjects   enable row level security;
alter table public.availability_slots enable row level security;
alter table public.reviews            enable row level security;

-- Lectura pública del catálogo de tutores
create policy "lectura publica subjects" on public.subjects           for select using (true);
create policy "lectura publica teachers" on public.teachers           for select using (true);
create policy "lectura publica ts"       on public.teacher_subjects   for select using (true);
create policy "lectura publica slots"    on public.availability_slots for select using (true);
create policy "lectura publica reviews"  on public.reviews            for select using (true);

-- Perfiles: cualquiera puede ver perfiles; cada quien edita el suyo
create policy "ver perfiles"      on public.profiles for select using (true);
create policy "editar mi perfil"  on public.profiles for update using (auth.uid() = id);
create policy "crear mi perfil"   on public.profiles for insert with check (auth.uid() = id);

-- Ramos que cursa: cada quien gestiona los suyos
create policy "ver ramos cursados"   on public.profile_subjects for select using (true);
create policy "editar mis ramos"     on public.profile_subjects
  for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Reseñas: solo el autor autenticado puede crear/editar la suya
create policy "crear review"  on public.reviews
  for insert to authenticated with check (auth.uid() = author_id);
create policy "editar review" on public.reviews
  for update to authenticated using (auth.uid() = author_id);
```

---

## 7. Datos de ejemplo (seed mínimo)

> Los perfiles dependen de usuarios reales en `auth.users`, así que el seed completo se hace
> después de tener al menos un usuario registrado. Para el catálogo:

```sql
insert into public.subjects (name) values
  ('Cálculo I'), ('Cálculo II'), ('Álgebra Lineal'), ('Programación')
on conflict (name) do nothing;
```

Para migrar los 9 tutores mock necesito que confirmes el esquema; luego genero el script
(crea usuarios de prueba en Auth → perfiles → fichas de tutor → ramos → reseñas).

---

## 8. Qué necesito de ti para conectar la app

Cuando el proyecto esté en Supabase, pásame (o pega en `src/environments/`):

1. **Project URL** — `https://xxxxxxxx.supabase.co`
2. **anon public key** — la clave pública. La `service_role` **NO** va en el frontend.
3. ¿Vas a usar **email/password** o login con Google/correo UDD? (define el flujo de Auth).

Con eso instalo `@supabase/supabase-js`, creo el cliente y reemplazo el `TeacherService`
(que hoy usa mocks) por consultas reales, más un `AuthService`/`ProfileService`.

---

## Supuestos a validar

1. **Un tutor es un perfil (relación 1:1).** `teachers.profile_id` apunta a `profiles`. Es decir,
   para ser tutor primero eres usuario. *(Alternativa: tutores totalmente independientes de los
   perfiles — pero rompería la idea de "profiles como centro".)*

2. **`priceRange` → `price_min` + `price_max` (enteros, en pesos).** El formato visual
   `"$8.000-$12.000"` se reconstruye en la app.

3. **Contacto único embebido en `teachers`** (`contact_type` + `contact_value`). *(Si el tutor
   pudiera tener varios contactos, iría a una tabla aparte. Nota: con login podríamos incluso
   usar el `email` del perfil como contacto por defecto.)*

4. **`rating` y `review_count` derivados** de `reviews` vía trigger (sección 4).

5. **`hour` como texto `"HH:MM"`**, igual que el modelo. *(Alternativa: tipo `time`.)*

6. **Una reseña por perfil y por tutor** (`unique (teacher_id, author_id)`). *(Si permites varias
   reseñas del mismo usuario al mismo tutor, quito la restricción.)*

7. **`year` como texto** (`"3er año"`) tanto en `profiles` como en la UI. *(Alternativa: entero 1–7.)*

8. **El catálogo es de lectura pública**; crear/editar perfiles, ramos y reseñas requiere login.

9. **`profiles` se crea automáticamente** al registrarse en Auth (trigger `handle_new_user`),
   tomando `full_name`, `career` y `year` de los metadatos del registro. *(Si prefieres crear el
   perfil manualmente desde la app tras el signup, quito el trigger.)*
