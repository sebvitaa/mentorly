# Mentorly API Contract

Documento de contrato inicial para la API REST de Mentorly UDD. Este contrato sirve como referencia compartida entre frontend, mock API local y futuro backend real.

## 1. Resumen

Mentorly es una plataforma para conectar estudiantes de la Universidad del Desarrollo con tutores pares para solicitar y coordinar clases particulares.

El proyecto nace como iniciativa academica, pero debe quedar preparado para evolucionar a un producto real. Por esa razon, este documento separa el modelo de API del modelo interno del frontend y define reglas de negocio que el backend deberia respetar.

## 2. Ambientes

| Ambiente | URL | Estado |
|----------|-----|--------|
| Frontend local | `http://localhost:4200` | Implementado |
| Mock API local | `http://localhost:3000/api` | Implementado |
| Backend real | Pendiente | Por definir |
| Staging | Pendiente | Por definir |
| Produccion | Pendiente | Por definir |

La base path recomendada para la API es:

```txt
/api
```

## 3. Convenciones

La API expone recursos REST sobre HTTP.

Los payloads de API usan `snake_case`.

El frontend transforma esos DTOs al modelo de UI con mappers internos.

Las fechas de calendario usan formato ISO corto:

```txt
YYYY-MM-DD
```

Las horas usan formato de 24 horas:

```txt
HH:mm
```

Las respuestas exitosas devuelven JSON.

Los errores devuelven JSON con el formato definido en la seccion de errores.

## 4. Autenticacion

Debe existir login antes de permitir acciones sensibles como reservar, aceptar, rechazar o cancelar clases.

El mecanismo exacto esta pendiente. La recomendacion inicial para backend REST es usar bearer tokens:

```http
Authorization: Bearer <token>
```

Endpoints publicos sugeridos:

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Inicia sesion. |
| `POST` | `/api/auth/logout` | Cierra sesion. |
| `GET` | `/api/auth/me` | Obtiene el usuario autenticado. |

Reglas:

- Ver tutores puede ser publico durante el prototipo.
- Reservar debe requerir usuario autenticado.
- Administrar tutores, ramos y disponibilidad debe requerir permisos.
- Solo usuarios con correo institucional UDD deberian poder completar reservas.

Decision pendiente:

- Proveedor de autenticacion: JWT propio, Firebase, Supabase, SSO universitario u otro.

## 5. Roles

Un usuario puede actuar como estudiante, tutor o ambos.

Roles iniciales:

| Rol | Descripcion |
|-----|-------------|
| `student` | Usuario que busca tutorias y crea reservas. |
| `tutor` | Usuario que ofrece tutorias y gestiona disponibilidad/solicitudes. |
| `admin` | Usuario que administra tutores, ramos y contenido del sistema. |

Reglas:

- Un usuario puede tener multiples roles.
- Un estudiante tambien puede ser tutor.
- Un tutor tambien puede reservar clases con otros tutores.
- Las acciones administrativas deben estar restringidas a `admin`.

## 6. Modelos

### User

```ts
interface UserDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  career: string;
  current_year: string;
  roles: Array<'student' | 'tutor' | 'admin'>;
  created_at: string;
  updated_at: string;
}
```

Reglas:

- `email` debe pertenecer a dominio institucional UDD.
- Dominio exacto recomendado: `@udd.cl`.
- Si la universidad usa otros dominios institucionales, deben agregarse explicitamente.

### TeacherProfile

```ts
interface TeacherProfileDto {
  id: string;
  user_id: string;
  name: string;
  career: string;
  year: string;
  rating: number;
  review_count: number;
  price_range: string;
  subjects: string[];
  avatar_url: string | null;
  about: string;
  contact: ContactDto | null;
  availability: AvailabilityDayDto[];
  reviews: ReviewDto[];
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  created_at: string;
  updated_at: string;
}
```

Reglas:

- `contact` debe ocultarse antes de una reserva confirmada.
- `rating` y `review_count` deberian ser calculados por backend.
- `status` permite moderacion administrativa.

Decision pendiente:

- Si `price_range` seguira siendo texto libre o pasara a campos numericos como `price_min` y `price_max`.

### Contact

```ts
interface ContactDto {
  type: 'email' | 'phone';
  value: string;
}
```

### Subject

```ts
interface SubjectDto {
  id: string;
  name: string;
  category: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}
```

Reglas:

- Los ramos deben ser administrables.
- El frontend puede buscar por texto, pero el backend debe tener un catalogo consistente.

### AvailabilityDay

```ts
interface AvailabilityDayDto {
  date: string;
  time_slots: TimeSlotDto[];
}
```

### TimeSlot

```ts
interface TimeSlotDto {
  hour: string;
  available: boolean;
}
```

Decision pendiente:

- Duracion de cada clase: 60 minutos, 45 minutos o variable.
- Si fines de semana estan permitidos.
- Si una reserva pendiente bloquea el horario o solo lo bloquea al confirmarse.

### Booking

```ts
interface BookingDto {
  id: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  student_id: string;
  teacher_id: string;
  subject_id: string | null;
  date: string;
  hour: string;
  student_first_name: string;
  student_last_name: string;
  student_career: string;
  student_current_year: string;
  student_email: string;
  message: string | null;
  tutor_response_message: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
}
```

Reglas:

- Una reserva se crea como `pending`.
- La contraparte debe aceptar para pasar a `confirmed`.
- Al confirmarse, el sistema debe enviar una notificacion.
- El contacto del tutor se muestra despues de que la reserva quede `confirmed`.
- No se puede reservar una fecha pasada.
- No se puede reservar un bloque ocupado.

### Review

```ts
interface ReviewDto {
  id: string;
  booking_id: string;
  student_id: string;
  teacher_id: string;
  student_name: string;
  rating: number;
  date: string;
  comment: string;
  created_at: string;
}
```

Reglas:

- `rating` debe estar entre 1 y 5.
- Idealmente solo se permite reseñar una reserva completada.

### Notification

```ts
interface NotificationDto {
  id: string;
  user_id: string;
  type:
    | 'booking_requested'
    | 'booking_confirmed'
    | 'booking_rejected'
    | 'booking_cancelled';
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}
```

Decision pendiente:

- Canal de notificacion: email, push, notificacion interna o combinacion.

## 7. Endpoints

### Healthcheck

#### GET `/api/health`

Verifica que la API este disponible.

Respuesta `200`:

```json
{
  "ok": true,
  "service": "mentorly-api"
}
```

### Auth

#### POST `/api/auth/login`

Inicia sesion.

Request:

```json
{
  "email": "estudiante@udd.cl",
  "password": "secret"
}
```

Respuesta `200`:

```json
{
  "access_token": "jwt-token",
  "user": {
    "id": "user-1",
    "first_name": "Josefa",
    "last_name": "Perez",
    "email": "josefa.perez@udd.cl",
    "career": "Ingenieria Civil Industrial",
    "current_year": "3er ano",
    "roles": ["student"]
  }
}
```

#### POST `/api/auth/logout`

Cierra sesion.

Respuesta `204`: sin body.

#### GET `/api/auth/me`

Obtiene el usuario autenticado.

Requiere autenticacion.

Respuesta `200`:

```json
{
  "id": "user-1",
  "first_name": "Josefa",
  "last_name": "Perez",
  "email": "josefa.perez@udd.cl",
  "career": "Ingenieria Civil Industrial",
  "current_year": "3er ano",
  "roles": ["student", "tutor"],
  "created_at": "2026-06-20T18:00:00.000Z",
  "updated_at": "2026-06-20T18:00:00.000Z"
}
```

### Teachers

#### GET `/api/teachers`

Lista tutores activos.

Query params:

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `q` | string | Busqueda por nombre, carrera o ramo. |
| `subject` | string | Filtro por ramo. |
| `career` | string | Filtro por carrera. |
| `page` | number | Pagina de resultados. |
| `limit` | number | Cantidad de resultados. |

Respuesta `200`:

```json
[
  {
    "id": "teacher-1",
    "user_id": "user-2",
    "name": "Sofia Contreras",
    "career": "Ingenieria Civil Industrial",
    "year": "3er ano",
    "rating": 4.8,
    "review_count": 12,
    "price_range": "$8.000-$12.000",
    "subjects": ["Calculo I", "Calculo II", "Algebra Lineal"],
    "avatar_url": null,
    "about": "Llevo dos anos ayudando a estudiantes con matematicas.",
    "contact": null,
    "availability": [
      {
        "date": "2026-06-22",
        "time_slots": [
          { "hour": "09:00", "available": true },
          { "hour": "10:00", "available": false }
        ]
      }
    ],
    "reviews": [],
    "status": "active",
    "created_at": "2026-06-20T18:00:00.000Z",
    "updated_at": "2026-06-20T18:00:00.000Z"
  }
]
```

Notas:

- `contact` debe venir `null` para usuarios sin reserva confirmada con ese tutor.
- El backend puede omitir `availability` en listados si decide cargarla por endpoint separado, pero el frontend actual la consume dentro del tutor.

#### GET `/api/teachers/:id`

Obtiene detalle de un tutor.

Respuesta `200`: `TeacherProfileDto`.

Errores:

- `404 TEACHER_NOT_FOUND` si el tutor no existe.

#### POST `/api/teachers`

Crea un perfil de tutor.

Requiere autenticacion.

Request:

```json
{
  "about": "Ayudo con Calculo I y Algebra Lineal.",
  "price_range": "$8.000-$12.000",
  "subject_ids": ["subject-1", "subject-2"],
  "contact": {
    "type": "email",
    "value": "tutor@udd.cl"
  }
}
```

Respuesta `201`: `TeacherProfileDto` con `status: "pending"`.

#### PATCH `/api/teachers/:id`

Actualiza perfil de tutor.

Requiere autenticacion y permisos.

Respuesta `200`: `TeacherProfileDto`.

#### PATCH `/api/teachers/:id/status`

Actualiza estado del perfil de tutor.

Requiere rol `admin`.

Request:

```json
{
  "status": "active"
}
```

Respuesta `200`: `TeacherProfileDto`.

### Subjects

#### GET `/api/subjects`

Lista ramos disponibles.

Respuesta `200`:

```json
[
  {
    "id": "subject-1",
    "name": "Calculo I",
    "category": "Matematicas",
    "active": true,
    "created_at": "2026-06-20T18:00:00.000Z",
    "updated_at": "2026-06-20T18:00:00.000Z"
  }
]
```

#### POST `/api/subjects`

Crea un ramo administrable.

Requiere rol `admin`.

Request:

```json
{
  "name": "Calculo I",
  "category": "Matematicas"
}
```

Respuesta `201`: `SubjectDto`.

#### PATCH `/api/subjects/:id`

Actualiza un ramo.

Requiere rol `admin`.

Respuesta `200`: `SubjectDto`.

#### DELETE `/api/subjects/:id`

Desactiva o elimina un ramo.

Requiere rol `admin`.

Respuesta `204`: sin body.

### Availability

#### GET `/api/teachers/:id/availability`

Obtiene disponibilidad de un tutor.

Respuesta `200`:

```json
[
  {
    "date": "2026-06-22",
    "time_slots": [
      { "hour": "09:00", "available": true },
      { "hour": "10:00", "available": false }
    ]
  }
]
```

#### PUT `/api/teachers/:id/availability`

Reemplaza disponibilidad de un tutor.

Requiere que el usuario sea el tutor propietario o `admin`.

Request:

```json
{
  "availability": [
    {
      "date": "2026-06-22",
      "time_slots": [
        { "hour": "09:00", "available": true },
        { "hour": "10:00", "available": true }
      ]
    }
  ]
}
```

Respuesta `200`: `AvailabilityDayDto[]`.

### Bookings

#### POST `/api/bookings`

Crea una solicitud de reserva.

Requiere autenticacion.

Request:

```json
{
  "teacher_id": "teacher-1",
  "subject_id": "subject-1",
  "date": "2026-06-22",
  "hour": "09:00",
  "student_first_name": "Josefa",
  "student_last_name": "Perez",
  "student_career": "Ingenieria Comercial",
  "student_current_year": "2do ano",
  "student_email": "josefa.perez@udd.cl",
  "message": "Necesito preparar la solemne de Calculo I."
}
```

Respuesta `201`:

```json
{
  "id": "booking-1",
  "status": "pending",
  "student_id": "user-1",
  "teacher_id": "teacher-1",
  "subject_id": "subject-1",
  "date": "2026-06-22",
  "hour": "09:00",
  "student_first_name": "Josefa",
  "student_last_name": "Perez",
  "student_career": "Ingenieria Comercial",
  "student_current_year": "2do ano",
  "student_email": "josefa.perez@udd.cl",
  "message": "Necesito preparar la solemne de Calculo I.",
  "tutor_response_message": null,
  "created_at": "2026-06-20T18:00:00.000Z",
  "updated_at": "2026-06-20T18:00:00.000Z",
  "confirmed_at": null,
  "cancelled_at": null
}
```

Reglas:

- Debe validar correo institucional.
- Debe validar que la fecha/hora exista en la disponibilidad del tutor.
- Debe validar que la fecha/hora no este ocupada.
- La reserva queda `pending`, no `confirmed`.

#### GET `/api/bookings/me`

Lista reservas relacionadas al usuario autenticado.

Requiere autenticacion.

Query params:

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `role` | `student` o `tutor` | Filtra reservas donde el usuario actua como estudiante o tutor. |
| `status` | string | Filtra por estado. |

Respuesta `200`: `BookingDto[]`.

#### GET `/api/bookings/:id`

Obtiene detalle de una reserva.

Requiere ser estudiante asociado, tutor asociado o `admin`.

Respuesta `200`: `BookingDto`.

#### PATCH `/api/bookings/:id/accept`

Acepta una solicitud de reserva.

Requiere ser el tutor asociado o `admin`.

Request:

```json
{
  "message": "Confirmada. Nos vemos en la biblioteca UDD."
}
```

Respuesta `200`: `BookingDto` con `status: "confirmed"`.

Efectos esperados:

- Bloquear definitivamente el bloque horario.
- Enviar notificacion de confirmacion.
- Habilitar visualizacion de contacto del tutor para el estudiante.

#### PATCH `/api/bookings/:id/reject`

Rechaza una solicitud de reserva.

Requiere ser el tutor asociado o `admin`.

Request:

```json
{
  "message": "No puedo en ese horario."
}
```

Respuesta `200`: `BookingDto` con `status: "rejected"`.

#### PATCH `/api/bookings/:id/cancel`

Cancela una reserva.

Requiere ser estudiante asociado, tutor asociado o `admin`.

Request:

```json
{
  "reason": "Tuve un cambio de horario."
}
```

Respuesta `200`: `BookingDto` con `status: "cancelled"`.

#### PATCH `/api/bookings/:id/complete`

Marca una reserva como completada.

Requiere ser tutor asociado o `admin`.

Respuesta `200`: `BookingDto` con `status: "completed"`.

### Notifications

#### GET `/api/notifications`

Lista notificaciones del usuario autenticado.

Respuesta `200`: `NotificationDto[]`.

#### PATCH `/api/notifications/:id/read`

Marca una notificacion como leida.

Respuesta `200`: `NotificationDto`.

## 8. Estados de Reserva

| Estado | Descripcion |
|--------|-------------|
| `pending` | Solicitud creada, esperando respuesta del tutor. |
| `confirmed` | Solicitud aceptada por el tutor. |
| `rejected` | Solicitud rechazada por el tutor. |
| `cancelled` | Reserva cancelada por estudiante, tutor o admin. |
| `completed` | Clase realizada. |

Flujos permitidos:

```txt
pending -> confirmed
pending -> rejected
pending -> cancelled
confirmed -> cancelled
confirmed -> completed
```

Decision tomada:

- `pending` bloquea temporalmente el horario para evitar solicitudes simultaneas sobre el mismo bloque. Si la reserva se rechaza o cancela, el horario se libera.

## 9. Errores

Formato recomendado:

```json
{
  "code": "BOOKING_SLOT_TAKEN",
  "message": "The selected time slot is no longer available.",
  "details": {}
}
```

Codigos HTTP:

| HTTP | Codigo sugerido | Uso |
|------|-----------------|-----|
| `400` | `BAD_REQUEST` | Request mal formado. |
| `401` | `UNAUTHENTICATED` | Falta login o token invalido. |
| `403` | `FORBIDDEN` | Usuario sin permisos. |
| `404` | `NOT_FOUND` | Recurso inexistente. |
| `409` | `CONFLICT` | Conflicto de estado, como horario ocupado. |
| `422` | `VALIDATION_ERROR` | Datos validos como JSON, pero invalidos para negocio. |
| `500` | `INTERNAL_ERROR` | Error inesperado. |

Codigos de negocio sugeridos:

| Codigo | Descripcion |
|--------|-------------|
| `INVALID_UDD_EMAIL` | El correo no pertenece al dominio institucional permitido. |
| `TEACHER_NOT_FOUND` | Tutor no encontrado. |
| `SUBJECT_NOT_FOUND` | Ramo no encontrado. |
| `BOOKING_NOT_FOUND` | Reserva no encontrada. |
| `BOOKING_SLOT_TAKEN` | El horario ya no esta disponible. |
| `BOOKING_PAST_DATE` | No se puede reservar una fecha pasada. |
| `BOOKING_INVALID_STATUS_TRANSITION` | Cambio de estado no permitido. |
| `CONTACT_LOCKED_UNTIL_CONFIRMATION` | El contacto aun no puede mostrarse. |

## 10. Reglas de Negocio

- Solo estudiantes de la Universidad del Desarrollo pueden reservar.
- La informacion minima para reservar es nombre, apellido, carrera, ano cursando y correo institucional.
- El correo institucional debe validarse antes de crear la reserva.
- Un usuario puede ser estudiante y tutor al mismo tiempo.
- El perfil de tutor debe ser administrable.
- Los ramos deben ser administrables.
- El contacto del tutor no debe mostrarse antes de una reserva confirmada.
- Una reserva requiere confirmacion de la contraparte.
- Una reserva confirmada debe gatillar una notificacion.
- No se puede aceptar una reserva si el bloque horario ya fue tomado por otra reserva incompatible.
- No se debe permitir reservar fechas pasadas.
- El estudiante debe aceptar una regla de integridad academica antes de solicitar una tutoría: el apoyo es para reforzamiento y no para resolver evaluaciones, tareas o trabajos por el estudiante.

## 11. Persistencia Local del MVP

El MVP puede usar `localStorage` para complementar la API simulada con trazabilidad simple del navegador.

Claves actuales:

| Clave | Uso |
|-------|-----|
| `mentorly:requests` | Historial local de solicitudes enviadas. |
| `mentorly:favorites` | Tutores guardados como favoritos. |

Esta persistencia no reemplaza al backend real. En produccion, solicitudes y favoritos deberian persistirse por usuario autenticado.

## 12. Mock API Local

La mock API local vive en:

```txt
scripts/mock-api/server.mjs
```

Se levanta con:

```bash
npm run api
```

Base URL:

```txt
http://localhost:3000/api
```

Endpoints implementados actualmente:

| Metodo | Ruta | Estado |
|--------|------|--------|
| `GET` | `/api/health` | Implementado |
| `GET` | `/api/teachers` | Implementado |
| `GET` | `/api/teachers/:id` | Implementado |
| `GET` | `/api/teachers/:id/availability` | Implementado |
| `GET` | `/api/subjects` | Implementado |
| `GET` | `/api/bookings` | Implementado |
| `POST` | `/api/bookings` | Implementado |
| `PATCH` | `/api/bookings/:id/accept` | Implementado |
| `PATCH` | `/api/bookings/:id/reject` | Implementado |
| `PATCH` | `/api/bookings/:id/cancel` | Implementado |
| `PATCH` | `/api/bookings/:id/complete` | Implementado |
| `GET` | `/api/notifications` | Implementado |
| `PATCH` | `/api/notifications/:id/read` | Implementado |

Diferencias con backend real esperado:

- No tiene autenticacion real.
- No persiste datos en disco o base de datos.
- Las reservas se guardan solo en memoria.
- Las reservas se crean como `pending` y bloquean el horario hasta aceptacion, rechazo o cancelacion.
- Las notificaciones se simulan en memoria.
- El frontend oculta el contacto antes de la confirmacion, pero la mock API no valida permisos reales para exponerlo.
- No implementa administracion real de tutores o ramos.

## 13. Pendientes

- Definir proveedor de autenticacion.
- Definir si los endpoints de tutores seran publicos o requeriran login.
- Confirmar dominio institucional exacto permitido para correos UDD.
- Definir canal de notificaciones.
- Definir duracion de clases y reglas de bloques horarios.
- Definir si habra modalidad online, presencial o ambas.
- Definir si tutores se auto-registran o requieren aprobacion administrativa previa.
- Definir estructura final de precio.
- Definir estrategia de paginacion para listados.
- Definir si habra reseñas solo despues de reservas completadas.
