# Plan — Solicitudes para ti (lado tutor)

## Estado
El código está completo. Solo falta aplicar la migración SQL.

---

## Qué se implementó

La página de solicitudes (`src/app/pages/requests/`) ahora tiene una tercera
sección **"Solicitudes para ti"**, visible únicamente si el usuario es tutor
(detectado con `TutorProfileService.getMyTutorProfile() !== null`):

- **Aceptadas** (arriba): tarjetas `Nombre Apellido - dd/mm/yy - HH:MM` con botón
  Cancelar.
- **Por aceptar** (abajo): grid 3×N de tarjetas con nombre, `HH:MM - dd/mm/yy`,
  mensaje, `Enviada: dd/mm/yy HH:MM`, y botones Aceptar / Rechazar.

Del lado del estudiante, "Mis solicitudes" ahora:
- Oculta las solicitudes rechazadas (solo muestra `pending` y `confirmed`).
- Muestra el contacto del tutor cuando la reserva está confirmada (vía RPC
  `get_teacher_contact` existente).
- Permite cancelar tanto pendientes como confirmadas.

`BookingService` tiene los métodos nuevos `getIncomingRequests`, `acceptBooking`,
`rejectBooking`. Ambas listas filtran explícitamente por `student_id` /
`teacher.profile_id` para que un usuario que es estudiante y tutor a la vez no
vea las dos sets mezcladas.

Todas las pruebas pasan (48 unitarias, 3 integración en bookings). Build limpio.

---

## Acción pendiente (tutor)

### Aplicar `docs/sql/fase-7-tutor-requests.sql` en Supabase

Sin esta migración el tutor recibe "Solicitudes para ti" vacío y Aceptar/Rechazar
falla por RLS.

El archivo agrega dos políticas permisivas a la tabla `bookings`:

```sql
-- El tutor ve las solicitudes dirigidas a su ficha.
create policy "tutor ve solicitudes recibidas" on public.bookings
  for select to authenticated
  using (
    exists (
      select 1 from public.teachers t
       where t.id = bookings.teacher_id
         and t.profile_id = auth.uid()
    )
  );

-- El tutor responde la solicitud (confirmar / rechazar / cancelar).
create policy "tutor responde solicitudes" on public.bookings
  for update to authenticated
  using ( ... misma condición ... )
  with check ( ... misma condición ... );
```

El archivo completo está en `docs/sql/fase-7-tutor-requests.sql`. Es idempotente
(`drop policy if exists` antes de cada `create policy`).

### Verificación manual tras aplicar

1. Iniciar sesión como tutor (el tutor demo o cualquier cuenta con `teachers` row).
2. Ir a Solicitudes → debe aparecer la sección "Solicitudes para ti".
3. Desde otra cuenta (estudiante), enviar una solicitud al tutor.
4. El tutor ve la tarjeta en "Por aceptar"; al aceptar pasa a "Aceptadas".
5. El estudiante ve la solicitud como "Aceptada" y ve el contacto del tutor.
6. Al rechazar, desaparece de la vista del estudiante.
