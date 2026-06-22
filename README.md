# Mentorly UDD

Aplicación **Ionic + Angular** que conecta a estudiantes de la UDD con tutores
particulares (que también son estudiantes UDD). Permite registrarse con correo
institucional, buscar tutores por nombre/ramo/carrera, ver su ficha y reseñas,
**agendar una hora**, y —desde el perfil— **publicarse como tutor** definiendo
precio, ramos, contacto y disponibilidad semanal.

> El backend real es **Supabase** (Auth + Postgres + RLS). La app conserva un
> _fallback_ a datos mock locales para que el catálogo no quede en blanco si
> Supabase no responde.

https://mentorly-ivory.vercel.app/


---

## Tabla de contenidos

- [Características](#características)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Cómo ejecutar](#cómo-ejecutar)
- [Configuración (Supabase)](#configuración-supabase)
- [Base de datos y migraciones](#base-de-datos-y-migraciones)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Autenticación y seguridad](#autenticación-y-seguridad)
- [Publicación de tutores](#publicación-de-tutores)
- [Pruebas](#pruebas)
- [Scripts disponibles](#scripts-disponibles)
- [Estado conocido y pendientes](#estado-conocido-y-pendientes)
- [Documentación adicional](#documentación-adicional)

---

## Características

- **Registro e inicio de sesión** con correo institucional `@udd.cl` (Supabase
  Auth, email/contraseña). Toda cuenta es una persona (`profiles`); puede
  reservar tutorías y, opcionalmente, ofrecerlas.
- **Catálogo de tutores**: búsqueda por nombre, carrera o ramo, y filtros
  rápidos. Solo se listan tutores **publicados** (`active`) y con al menos un
  ramo.
- **Ficha de tutor** en un modal: biografía, ramos, rango de precios, reseñas y
  favoritos. El **contacto se oculta** hasta que el tutor confirme una reserva.
- **Agendamiento**: calendario de dos semanas con horas disponibles; la solicitud
  queda `pending` hasta que el tutor la confirme.
- **Publicación como tutor** desde el perfil: precio (min/máx), ramos que enseña,
  contacto preferido y **disponibilidad semanal** (grilla por día y hora). Al
  completar todo, queda publicado automáticamente.
- **Catálogo académico UDD** (campus / facultad / carrera) en selects
  dependientes durante el registro.
- **Rutas protegidas**: `/profile` y `/requests` requieren sesión (route guard).
- **Rate limiting** de login y registro (1 intento cada 10 s, lado cliente).
- **Fallback offline**: si la consulta de tutores a Supabase falla, la app usa
  datos mock locales.

---

## Stack

| Herramienta | Versión | Rol |
|-------------|---------|-----|
| [Angular](https://angular.dev) | 19 | Framework SPA (standalone components, signals) |
| [Ionic](https://ionicframework.com) | 8 | Componentes UI y experiencia móvil |
| [Supabase](https://supabase.com) | JS v2 | Auth, Postgres, RLS, RPCs |
| TypeScript | 5.6 | Lenguaje |
| RxJS | 7.8 | Manejo reactivo de datos |
| Jest | 29 | Pruebas (unitarias + integración) |

---

## Requisitos

- **Node.js** 18 o superior (probado con Node 24).
- **npm** 9 o superior.
- Un proyecto **Supabase** con el esquema aplicado (ver
  [Base de datos y migraciones](#base-de-datos-y-migraciones)).

> No es necesario instalar el CLI de Angular ni de Ionic de forma global.

---

## Cómo ejecutar

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo
npm start
# → http://localhost:4200

# 3. Build de producción (carpeta /www)
npm run build
```

La conexión a Supabase ya viene configurada en `src/environments/environment.ts`.

---

## Configuración (Supabase)

`src/environments/environment.ts` (y su variante `.prod.ts`):

```ts
export const environment = {
  production: false,
  supabase: {
    url: 'https://<tu-proyecto>.supabase.co',
    // Clave PÚBLICA (publishable). NUNCA la service_role key en el frontend.
    publishableKey: 'sb_publishable_...',
  },
  auth: {
    emailPassword: true, // login con correo/contraseña
    uddSso: false,       // OAuth institucional (preparado, desactivado)
  },
};
```

Un único `SupabaseService` (`src/app/services/supabase.service.ts`) crea el
cliente y lo comparte por inyección de dependencias.

---

## Base de datos y migraciones

El esquema vive en `docs/sql/` y se aplica **en orden** desde el **SQL Editor de
Supabase** (no hay migraciones automáticas):

| Archivo | Contenido |
|---------|-----------|
| `fase-1-academic-catalog.sql` | Tablas `campuses`/`faculties`/`careers` + seed, columnas en `profiles`, trigger `handle_new_user`. |
| `fase-2-bookings.sql` | Tabla `bookings` + RLS. |
| `fase-3-hardening.sql` | Fuerza dominio `@udd.cl` (trigger), oculta el contacto del tutor (grants), reafirma RLS. |
| `fase-4-person-tutor-architecture.sql` | Arquitectura persona/tutor: `teachers.status`, `admission_year`, trigger extendido. |
| `fase-5-tutor-publishing.sql` | Publicación del tutor: columna `teachers.weekly_availability` + RPCs `get_my_tutor_profile` / `save_tutor_profile` / `expand_tutor_availability`. |
| `fase-6-contactos-ramos-perfil.sql` | Contacto dual (email + teléfono) + `show_contact`, edición de perfil, RPC `get_teacher_contact` (expone contacto si es público o hay reserva confirmada). |
| `fase-7-tutor-requests.sql` | RLS para el lado del tutor: ver y responder (aceptar/rechazar/cancelar) las solicitudes recibidas. |
| `seed-demo-tutor.sql` | Tutor de demostración para probar el flujo de reserva. |

El detalle de tablas, columnas, RLS y funciones está en
[`docs/supabase-schema.md`](docs/supabase-schema.md).

---

## Estructura del proyecto

```
src/app/
├── app.component.ts        # Shell raíz (ion-app + router-outlet)
├── app.routes.ts           # Rutas (lazy load + authGuard)
├── guards/
│   └── auth.guard.ts       # Protege /profile y /requests
├── services/               # Acceso a datos (Supabase) y estado local
│   ├── supabase.service.ts     # Cliente único de Supabase
│   ├── auth.service.ts         # Sesión, login, registro, rate limiting
│   ├── profile.service.ts      # Perfil propio (persona + faceta tutor)
│   ├── teacher.service.ts      # Catálogo de tutores (+ fallback a mocks)
│   ├── tutor-profile.service.ts# Editar/publicar perfil tutor (RPCs)
│   ├── subject.service.ts      # Catálogo de ramos
│   ├── booking.service.ts      # Reservas
│   ├── favorites.service.ts    # Favoritos (localStorage)
│   └── storage.service.ts      # Wrapper de localStorage
├── api/
│   ├── academic-catalog-api.service.ts  # campus/facultad/carrera (Supabase)
│   └── dtos/
├── models/                 # Interfaces de dominio
├── data/mock-teachers.ts   # Fallback offline del catálogo
├── utils/                  # format.util, rate-limiter
├── testing/                # Soporte de tests de integración
├── components/             # header, hero, teacher-card/grid/modal,
│                           # schedule-calendar, tutor-editor
└── pages/                  # home, login, register, profile, requests
```

---

## Arquitectura

- **Componentes standalone** (sin `NgModule`), con inputs/outputs explícitos y
  signals donde aplica.
- **Servicios como única fuente de verdad**: cada servicio encapsula su acceso a
  Supabase y expone `Observable`s a los componentes; la UI no conoce Supabase.
- **`profiles` es el centro del modelo**: representa a la persona autenticada.
  Ser tutor es una **faceta** (fila 1:1 en `teachers`), no un rol aparte.
- **Catálogo de tutores** (`teacher.service.ts`): consulta anidada a Supabase
  (tutor + perfil + ramos + disponibilidad + reseñas), filtra a los `active` con
  ramos y **omite el contacto**. Si la consulta falla, cae a `MOCK_TEACHERS`.
- **Disponibilidad**: el tutor define un **patrón semanal** que se guarda en
  `teachers.weekly_availability` y la base lo **expande** a fechas concretas en
  `availability_slots` (próximas 2 semanas), que es lo que consume el calendario.

---

## Autenticación y seguridad

- **Supabase Auth** con email/contraseña; la sesión se hidrata y observa con
  signals en `AuthService`.
- **Dominio `@udd.cl`** validado en el cliente (login/registro) y forzado en la
  base con un trigger `BEFORE INSERT` sobre `auth.users`.
- **Rate limiting** de 1 intento cada 10 s para login y registro
  (`src/app/utils/rate-limiter.ts`), como barrera de UX/anti-spam.
- **RLS** en todas las tablas; el contacto del tutor se oculta vía _grants_ por
  columna y solo se accede por RPC `SECURITY DEFINER`.
- **Route guards** (`authGuard`) en `/profile` y `/requests`.

---

## Publicación de tutores

Desde **Perfil → "Tutorías"**, el `TutorEditorComponent` permite definir precio,
ramos, contacto y la grilla de disponibilidad semanal. Al guardar:

1. `TutorProfileService.saveTutorProfile()` llama al RPC `save_tutor_profile`.
2. El RPC crea/actualiza la ficha en `teachers`, reemplaza sus ramos, guarda el
   patrón semanal y lo materializa en `availability_slots`.
3. Si el perfil está **completo** (precio + contacto + ≥1 ramo + ≥1 bloque)
   queda `active` (publicado y visible en el catálogo); si no, `incomplete`.

---

## Pruebas

Dos niveles (detalle en [`docs/testing.md`](docs/testing.md)):

```bash
npm test          # unitarios (jsdom, Supabase mockeado) — offline
npm run test:int  # integración (node) contra el Supabase REAL
npm run test:all  # ambos
```

- **Unitarios** (`*.spec.ts`): lógica pura y servicios con Supabase mockeado.
- **Integración** (`*.int.spec.ts`): instancian los servicios reales y verifican
  las APIs en vivo (catálogo, tutores, reservas/RLS, ramos, RPCs del tutor).

---

## Scripts disponibles

| Script | Acción |
|--------|--------|
| `npm start` / `npm run dev` | Servidor de desarrollo en `http://localhost:4200`. |
| `npm run build` | Build de producción en `/www`. |
| `npm run watch` | Build en modo watch. |
| `npm test` / `npm run test:watch` | Pruebas unitarias. |
| `npm run test:int` | Pruebas de integración (Supabase real). |
| `npm run test:all` | Unitarias + integración. |
| `npm run api` | Mock API local _(legado)_ en `:3000`; hoy sirve solo como fuente del seed del catálogo, no se consume en runtime. |

---

## Estado conocido y pendientes

- ⚠️ **Registro por correo desactivado** en el proyecto Supabase
  (`Email signups are disabled`). Para que `/register` cree cuentas, actívalo en
  Dashboard → Authentication → Providers → Email. Mientras tanto, usa una cuenta
  existente o el tutor demo.
- Las migraciones se aplican **a mano** en el SQL Editor (orden fase-1 → fase-7).
  Si una RPC devuelve `404 / PGRST202`, falta aplicar el `.sql` correspondiente.
- La **ventana rodante** de disponibilidad se refresca al guardar el perfil; para
  que avance sola cada día se puede activar el job `pg_cron` documentado en
  `fase-5-tutor-publishing.sql`.
- Sin tutores `active`, el catálogo muestra los datos mock de respaldo.

---

## Documentación adicional

| Documento | Contenido |
|-----------|-----------|
| [`docs/supabase-schema.md`](docs/supabase-schema.md) | Esquema completo: tablas, RLS, triggers y RPCs. |
| [`docs/testing.md`](docs/testing.md) | Estrategia de pruebas (unitarias e integración). |
| [`docs/audit.md`](docs/audit.md) | Auditoría del sistema (seguridad, código muerto). |
| [`docs/api-contract.md`](docs/api-contract.md) · [`docs/differences.md`](docs/differences.md) | Contrato REST de referencia y su contraste con Supabase. |
| [`docs/sql/`](docs/sql/) | Migraciones SQL ejecutables. |
