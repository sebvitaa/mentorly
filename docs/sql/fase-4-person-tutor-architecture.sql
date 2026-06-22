-- ============================================================
-- Mentorly — Fase 4: arquitectura persona/tutor
--
-- Objetivo:
--   * `profiles` es la persona UDD. Toda cuenta puede reservar tutorías.
--   * Ser tutor = tener una fila 1:1 en `teachers`. No hay "rol student".
--   * El registro puede marcar "quiero ofrecer tutorías"; en ese caso se
--     crea automáticamente un perfil tutor en estado `incomplete` para que
--     después complete el onboarding.
--   * Renombramos `profiles.year` → `profiles.admission_year`.
--
-- Ejecutar en Supabase (SQL Editor) o vía CLI. Idempotente.
-- ============================================================

-- ---------- 4.1 Renombrar year → admission_year en profiles ----------
alter table public.profiles
  add column if not exists admission_year text;

-- Migrar datos existentes desde year (si aún no se seteo admission_year).
update public.profiles
   set admission_year = year
 where admission_year is null
   and year is not null;

-- Marcar not null ahora que todos tienen valor (o '' por defecto).
update public.profiles set admission_year = '' where admission_year is null;
alter table public.profiles alter column admission_year set not null;

-- Mantenemos `year` por compatibilidad hacia atrás; las apps nuevas deben
-- leer/escribir `admission_year`.

-- ---------- 4.2 Estado y auditoría en teachers ----------
-- incomplete: recién creado desde el registro; aún no completa onboarding.
-- pending:    completó onboarding; espera activación admin.
-- active:     visible públicamente y reservable.
-- inactive:   pausado por el tutor.
-- rejected:   rechazado por admin.
alter table public.teachers
  add column if not exists status text not null default 'incomplete'
    check (status in ('incomplete','pending','active','inactive','rejected'));

alter table public.teachers
  add column if not exists updated_at timestamptz not null default now();

-- Asegurar 1:1 profile ↔ teacher (ya existe unique en profile_id; lo reforzamos).
-- (No es estrictamente necesario, pero deja explícita la intención.)

-- ---------- 4.3 Trigger handle_new_user actualizado ----------
-- Crea el perfil con admission_year y, si wants_to_teach = 'true',
-- crea la fila en teachers con status = 'incomplete'.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, full_name, email, career, year, admission_year,
    campus_id, faculty_id, career_id
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'career', ''),
    coalesce(new.raw_user_meta_data->>'year', ''),
    coalesce(new.raw_user_meta_data->>'admission_year',
             new.raw_user_meta_data->>'year', ''),
    new.raw_user_meta_data->>'campus_id',
    new.raw_user_meta_data->>'faculty_id',
    new.raw_user_meta_data->>'career_id'
  );

  if coalesce(new.raw_user_meta_data->>'wants_to_teach', 'false') = 'true' then
    insert into public.teachers (profile_id, status)
    values (new.id, 'incomplete')
    on conflict (profile_id) do nothing;
  end if;

  return new;
end $$;

-- (El trigger `on_auth_user_created` ya existe desde fases anteriores;
--  no lo recreamos para no duplicar.)

-- ---------- 4.4 RLS para teachers ----------
-- Ya está habilitada RLS en Fase 3; ajustamos políticas de escritura.

-- Lectura pública SÓLO de tutores activos (el catálogo visible).
-- Nota: la política existente "lectura publica teachers" (si existe) permite
-- ver todos; la reemplazamos por una más restrictiva.
drop policy if exists "lectura publica teachers" on public.teachers;
create policy "ver tutores activos" on public.teachers
  for select using (status = 'active');

-- El propio usuario puede crear su perfil tutor (onboarding futuro).
drop policy if exists "crear mi perfil tutor" on public.teachers;
create policy "crear mi perfil tutor" on public.teachers
  for insert to authenticated
  with check (profile_id = auth.uid());

-- El propio usuario puede editar su perfil tutor.
drop policy if exists "editar mi perfil tutor" on public.teachers;
create policy "editar mi perfil tutor" on public.teachers
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
