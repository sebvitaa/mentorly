# Mentorly UDD

Aplicación **Ionic + Angular** que conecta a estudiantes de la UDD con
profesores particulares. Permite buscar tutores por nombre, ramo o carrera,
filtrar por áreas frecuentes, revisar el perfil y las reseñas de cada profesor,
y agendar una hora desde un calendario de disponibilidad.

> Migrada desde el mockup original en **React + Vite** a una arquitectura por
> componentes, compartimentalizada y lista para conectarse a un backend real.

---

## Tabla de contenidos

- [Características](#características)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Cómo ejecutar](#cómo-ejecutar)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
  - [Modelos](#modelos)
  - [Servicio de datos y fallback offline](#servicio-de-datos-y-fallback-offline)
  - [Componentes](#componentes)
  - [Página](#página)
  - [Utilidades](#utilidades)
- [Conectar un backend](#conectar-un-backend)
- [Flujo de datos](#flujo-de-datos)
- [Estilos y diseño](#estilos-y-diseño)
- [Scripts disponibles](#scripts-disponibles)
- [Decisiones de la migración](#decisiones-de-la-migración)

---

## Características

- **Búsqueda** de profesores por nombre, carrera o ramo.
- **Filtros rápidos** por áreas frecuentes (Cálculo, Economía, Programación,
  Química).
- **Estados de carga** con _skeletons_ y un **estado vacío** cuando no hay
  resultados.
- **Ficha de profesor** en un modal: biografía, ramos, rango de precios,
  reseñas y botón para guardar favoritos.
- **Agendamiento**: calendario de dos semanas con horas disponibles y
  solicitud pendiente de confirmación por el tutor.
- **Historial local** de solicitudes y tutores favoritos en `/requests`,
  persistido con `localStorage`.
- **Uso responsable**: el formulario exige aceptar que la tutoría es para
  reforzamiento académico y no para resolver evaluaciones.
- **Contacto protegido**: el contacto del tutor se oculta hasta que la solicitud
  sea confirmada.
- **Funciona offline**: si no hay backend configurado o falla, la app usa datos
  mock locales automáticamente.

---

## Stack

| Herramienta | Versión | Rol |
|-------------|---------|-----|
| [Angular](https://angular.dev) | 19 | Framework SPA (standalone components) |
| [Ionic](https://ionicframework.com) | 8 | Componentes UI y experiencia móvil |
| TypeScript | 5.6 | Lenguaje |
| RxJS | 7.8 | Manejo reactivo de datos |
| SCSS | — | Estilos |

---

## Requisitos

- **Node.js** 18 o superior (probado con Node 24).
- **npm** 9 o superior.

> No es necesario instalar el CLI de Angular ni de Ionic de forma global: ambos
> se ejecutan vía `npx` / scripts de npm.

---

## Cómo ejecutar

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo
npm start
# → http://localhost:4200

# 3. En otra terminal, levantar la mock API local
npm run api
# → http://localhost:3000/api

# 4. Generar el build de producción (carpeta /www)
npm run build
```

---

## Estructura del proyecto

```
TAWM_01/
├── angular.json            # Configuración de build/serve de Angular
├── tsconfig.json           # Configuración base de TypeScript (modo strict)
├── tsconfig.app.json       # Configuración de la app
├── package.json            # Dependencias y scripts
└── src/
    ├── index.html          # Documento raíz (<app-root>)
    ├── main.ts             # Bootstrap de la app + providers (router, http, ionic)
    ├── global.scss         # CSS de Ionic + fuente Inter + tokens
    ├── theme/
    │   └── variables.scss  # Paleta de marca y variables de Ionic
    ├── environments/
    │   └── environment.ts  # Configuración (apiUrl del backend)
    ├── assets/             # Recursos estáticos
    └── app/
        ├── app.component.ts    # Shell raíz (ion-app + router-outlet)
        ├── app.routes.ts       # Rutas (lazy load de la home)
        ├── models/                     # Interfaces de dominio y persistencia local
        ├── data/
        │   └── mock-teachers.ts        # Datos mock (fallback offline)
        ├── services/                   # Carga de datos, favoritos e historial local
        ├── utils/
        │   └── format.util.ts          # Helpers de formato compartidos
        ├── components/
        │   ├── header/                 # Encabezado con logo
        │   ├── hero/                   # Título, buscador y filtros rápidos
        │   ├── teacher-card/           # Tarjeta de profesor
        │   ├── teacher-grid/           # Grilla + skeletons + estado vacío
        │   ├── teacher-modal/          # Ficha detallada (ion-modal)
        │   └── schedule-calendar/      # Calendario de disponibilidad
        └── pages/
            ├── home/                   # Página que orquesta búsqueda y perfil
            └── requests/               # Historial local y favoritos
```

---

## Arquitectura

La aplicación sigue una separación clara de responsabilidades
(**compartimentalización**): el dominio, los datos, la lógica de acceso y la
presentación viven en capas distintas.

### Modelos

`src/app/models/teacher.model.ts` define las interfaces del dominio, sin lógica:

- `Teacher` — profesor (nombre, carrera, año, rating, ramos, contacto,
  disponibilidad, reseñas…).
- `Review` — reseña de un estudiante.
- `DayAvailability` / `TimeSlot` — disponibilidad por día y hora.
- `Contact` / `ContactType` — método de contacto preferido (`email` | `phone`).

### Servicio de datos y fallback offline

`src/app/services/teacher.service.ts` es la **única fuente de verdad** de la app
y centraliza el acceso a datos:

- Intenta cargar los profesores desde el backend
  (`${environment.apiUrl}/teachers`) con `HttpClient`.
- Si **no hay `apiUrl`** configurada, o la petición **falla**, cae
  automáticamente a los datos mock locales (`catchError`).
- Cachea el resultado con `shareReplay` para no repetir la petición en cada
  búsqueda.
- Expone:
  - `getTeachers()` → todos los profesores.
  - `searchTeachers({ query, subject })` → profesores filtrados por texto libre
    y/o ramo, aplicado en el cliente.

### Componentes

Todos son **standalone** (no usan `NgModule`), con entradas/salidas explícitas:

| Componente | Inputs | Outputs | Responsabilidad |
|------------|--------|---------|-----------------|
| `HeaderComponent` | — | — | Logo / barra superior fija. |
| `HeroComponent` | `activeFilter` | `search`, `filterChange` | Título, buscador y chips de filtros rápidos. |
| `TeacherCardComponent` | `teacher` | `select` | Tarjeta individual; accesible vía teclado. |
| `TeacherGridComponent` | `teachers`, `isLoading` | `teacherSelect` | Grilla, skeletons de carga y estado "sin resultados". |
| `TeacherModalComponent` | `teacher`, `isOpen` | `closed` | Ficha completa en un `ion-modal`; contacto y agenda. |
| `ScheduleCalendarComponent` | `availability` | — | Calendario de 2 semanas + selección y confirmación de hora. |

### Página

`src/app/pages/home/home.page.ts` orquesta los componentes y mantiene el estado
de la vista (texto de búsqueda, filtro activo, carga, profesor seleccionado y
apertura del modal). Reacciona a los eventos del `Hero` y el `TeacherGrid`,
consulta al `TeacherService` y abre/cierra el `TeacherModal`. Se carga de forma
_lazy_ desde `app.routes.ts`.

### Utilidades

`src/app/utils/format.util.ts` agrupa funciones puras reutilizadas por varios
componentes (iniciales de un nombre, formateo de fechas en español, nombre/
número de día), evitando duplicación.

---

## Mock API local y backend

En desarrollo la app apunta a una mock API local en `http://localhost:3000/api`.
Levántala con:

```bash
npm run api
```

Endpoints disponibles:

| Método | Ruta | Uso |
|--------|------|-----|
| `GET` | `/api/health` | Healthcheck de la mock API. |
| `GET` | `/api/teachers` | Listado de tutores. Acepta `q` y `subject`. |
| `GET` | `/api/teachers/:id` | Detalle de un tutor. |
| `GET` | `/api/teachers/:id/availability` | Disponibilidad de un tutor. |
| `GET` | `/api/subjects` | Ramos disponibles. |
| `GET` | `/api/bookings` | Reservas creadas en memoria. |
| `POST` | `/api/bookings` | Crea una solicitud `pending` y bloquea el horario. |
| `PATCH` | `/api/bookings/:id/accept` | Acepta una solicitud. |
| `PATCH` | `/api/bookings/:id/reject` | Rechaza una solicitud y libera el horario. |
| `PATCH` | `/api/bookings/:id/cancel` | Cancela una solicitud/reserva y libera el horario. |
| `GET` | `/api/notifications` | Notificaciones simuladas en memoria. |

Body mínimo para crear una reserva:

```json
{
  "teacher_id": "1",
  "date": "2026-06-20",
  "hour": "10:00",
  "student_first_name": "Josefa",
  "student_last_name": "Perez",
  "student_career": "Ingenieria Comercial",
  "student_current_year": "2do ano",
  "student_email": "josefa.perez@udd.cl"
}
```

Las solicitudes quedan en estado `pending`, bloquean temporalmente el horario y
deben ser aceptadas o rechazadas por la contraparte.

El frontend consume DTOs de API en `snake_case` y los adapta al modelo de UI con
los mappers de `src/app/api/mappers`, por lo que un backend real puede cambiar
su formato sin afectar los componentes.

Para conectarla a una API real, edita `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'https://mi-backend.com/api',
  useMocks: false,
};
```

Si la API no responde y `useMocks` está activo, la app cae a los mocks locales de
TypeScript para no quedar en blanco durante desarrollo.

---

## Flujo de datos

```
Usuario
  │  escribe / filtra / selecciona
  ▼
HomePage (estado de la vista)
  │  searchTeachers({ query, subject })
  ▼
TeacherService ──► ¿hay apiUrl?
  │                   ├─ sí → HTTP GET /teachers ─┐
  │                   └─ no ───────────────────────┤
  │                                                ▼
  │                          (error / vacío) → MOCK_TEACHERS
  ▼
Teacher[] filtrado ──► TeacherGrid ──► TeacherCard
                                  └──► TeacherModal ──► ScheduleCalendar
```

---

## Estilos y diseño

- El diseño del mockup original se preservó fielmente: indigo de marca
  (`#4F46E5`), avatares en lima (`#84CC16`), bordes negros marcados, skeletons
  animados y transiciones.
- La paleta vive como **design tokens** en `src/theme/variables.scss` y se
  consume con variables CSS (`var(--brand-primary)`, etc.), también mapeadas a
  las variables de Ionic (`--ion-color-primary`).
- Tipografía **Inter** cargada en `global.scss`.
- Cada componente tiene su propio `.scss` encapsulado (los CSS modules de React
  se portaron uno a uno).

---

## Scripts disponibles

| Script | Acción |
|--------|--------|
| `npm start` / `npm run dev` | Servidor de desarrollo (`ng serve`) en `http://localhost:4200`. |
| `npm run api` | Mock API local en `http://localhost:3000/api`. |
| `npm run build` | Build de producción en `/www`. |
| `npm run watch` | Build en modo watch (desarrollo). |
| `npm run ng -- <cmd>` | Acceso directo al CLI de Angular. |

---

## Decisiones de la migración

- **React → Angular standalone**: se eliminó todo el andamiaje de React/Vite
  (`main.tsx`, CSS modules, componentes shadcn/ui) y se reconstruyó con
  componentes standalone de Angular 19, el patrón recomendado actualmente.
- **Estado local con servicios**: en lugar de hooks (`useState`, `useMemo`), el
  estado de la vista vive en la `HomePage` y el acceso a datos en un servicio
  inyectable, separando presentación de lógica.
- **Mock-first con fallback**: la lógica de "si no hay backend, mostrar mocks"
  del enunciado se implementó en el servicio con `catchError`, de modo
  transparente para los componentes.
- **UI nativa de Ionic donde aporta**: `ion-app`, `ion-content`, `ion-modal` y
  `ion-toast` para una mejor experiencia móvil, conservando el HTML/CSS propio
  donde el diseño debía mantenerse idéntico.
