-- ============================================================
-- Mentorly — Fase 7: solicitudes desde el lado del tutor
-- Ejecutar en Supabase (SQL Editor) o vía CLI.
--
-- Hasta ahora `bookings` solo era accesible para el estudiante dueño
-- (fase-2). El tutor necesita ver las solicitudes que recibe y
-- aceptarlas/rechazarlas. Se agregan dos políticas RLS *permisivas*
-- (se combinan con OR con las del estudiante):
--   * SELECT: el tutor ve las reservas de su propia ficha `teachers`.
--   * UPDATE: el tutor cambia el estado (confirmar/rechazar/cancelar).
--
-- El nombre del estudiante se obtiene por el join a `profiles`
-- (SELECT público), no hace falta función SECURITY DEFINER.
-- El contacto del tutor se sigue exponiendo solo vía
-- `get_teacher_contact` cuando la reserva queda `confirmed` (fase-6).
-- ============================================================

-- El tutor ve las solicitudes dirigidas a su ficha.
drop policy if exists "tutor ve solicitudes recibidas" on public.bookings;
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
drop policy if exists "tutor responde solicitudes" on public.bookings;
create policy "tutor responde solicitudes" on public.bookings
  for update to authenticated
  using (
    exists (
      select 1 from public.teachers t
       where t.id = bookings.teacher_id
         and t.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.teachers t
       where t.id = bookings.teacher_id
         and t.profile_id = auth.uid()
    )
  );
