-- ============================================================
-- Mentorly — Fase 2: reservas (bookings)
-- Ejecutar en Supabase (SQL Editor) o vía CLI.
-- ============================================================

create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id),
  student_id uuid not null references public.profiles(id) default auth.uid(),
  date       date not null,
  hour       text not null,
  status     text not null default 'pending'
             check (status in ('pending','confirmed','rejected','cancelled')),
  message    text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_student_idx on public.bookings (student_id);
create index if not exists bookings_teacher_idx on public.bookings (teacher_id);

alter table public.bookings enable row level security;

-- El estudiante crea, ve y cancela (update) sus propias reservas.
create policy "crear mi reserva" on public.bookings
  for insert to authenticated with check (auth.uid() = student_id);

create policy "ver mis reservas" on public.bookings
  for select to authenticated using (auth.uid() = student_id);

create policy "cancelar mi reserva" on public.bookings
  for update to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);
