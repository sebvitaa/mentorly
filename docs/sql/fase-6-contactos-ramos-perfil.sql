-- ============================================================
-- Mentorly — Fase 6: contacto dual + mostrar contacto, ramos con detalle,
--                    edición de perfil.
--
-- Resumen:
--   * teachers: contacto NO excluyente (email Y teléfono) + show_contact
--     (mostrar el contacto siempre, sin esperar a confirmar reserva).
--   * subjects: columna `detail` + RPC add_subject (agregar un ramo nuevo).
--   * RPC save_tutor_profile / get_my_tutor_profile actualizadas al nuevo contacto.
--   * RPC get_teacher_contact: expone el contacto al estudiante cuando el tutor
--     lo hace público (show_contact) o cuando hay una reserva confirmada.
--   * profiles: policy de UPDATE para que el dueño edite sus datos.
--
-- Ejecutar en Supabase (SQL Editor) o vía CLI. Idempotente.
-- ============================================================

-- ---------- 6.1 Contacto dual + visibilidad en teachers ----------
alter table public.teachers
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists show_contact  boolean not null default false;

-- Migrar el contacto antiguo (contact_type/contact_value) al nuevo formato.
update public.teachers
   set contact_email = contact_value
 where contact_type = 'email' and contact_email is null and contact_value is not null;
update public.teachers
   set contact_phone = contact_value
 where contact_type = 'phone' and contact_phone is null and contact_value is not null;

-- Las nuevas columnas también quedan ocultas al público (igual que en Fase 3).
-- Solo se exponen vía get_teacher_contact (más abajo).
revoke select (contact_email, contact_phone) on public.teachers from anon, authenticated;
-- show_contact sí puede leerse (no es dato sensible).
grant select (show_contact) on public.teachers to anon, authenticated;

-- ---------- 6.2 Ramos: detalle + alta de ramo nuevo ----------
alter table public.subjects
  add column if not exists detail text;

-- Agregar un ramo (idempotente por nombre, case-insensitive). Devuelve {id,name}.
create or replace function public.add_subject(p_name text, p_detail text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if coalesce(trim(p_name), '') = '' then
    raise exception 'El nombre del ramo no puede estar vacío';
  end if;

  select id into v_id
    from public.subjects
   where lower(name) = lower(trim(p_name));

  if v_id is null then
    insert into public.subjects (name, detail)
    values (trim(p_name), nullif(trim(coalesce(p_detail, '')), ''))
    returning id into v_id;
  end if;

  return (select json_build_object('id', id, 'name', name)
            from public.subjects where id = v_id);
end $$;

grant execute on function public.add_subject(text, text) to authenticated;

-- ---------- 6.3 get_my_tutor_profile (nuevo contacto) ----------
create or replace function public.get_my_tutor_profile()
returns json language sql security definer set search_path = public stable as $$
  select json_build_object(
    'teacher_id',          t.id,
    'about',               t.about,
    'price_min',           t.price_min,
    'price_max',           t.price_max,
    'contact_email',       t.contact_email,
    'contact_phone',       t.contact_phone,
    'show_contact',        t.show_contact,
    'status',              t.status,
    'subject_ids',         coalesce(
                             (select json_agg(ts.subject_id)
                                from public.teacher_subjects ts
                               where ts.teacher_id = t.id),
                             '[]'::json),
    'weekly_availability', coalesce(t.weekly_availability, '[]'::jsonb)
  )
  from public.teachers t
  where t.profile_id = auth.uid();
$$;

-- ---------- 6.4 save_tutor_profile (nuevo contacto + show_contact) ----------
-- Reemplaza la firma anterior (Fase 5). Se borra para evitar ambigüedad.
drop function if exists public.save_tutor_profile(
  text, integer, integer, text, text, uuid[], jsonb
);

create or replace function public.save_tutor_profile(
  p_about         text,
  p_price_min     integer,
  p_price_max     integer,
  p_contact_email text,
  p_contact_phone text,
  p_show_contact  boolean,
  p_subject_ids   uuid[],
  p_weekly        jsonb
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_teacher uuid;
  v_status  text;
  v_email   text := nullif(trim(coalesce(p_contact_email, '')), '');
  v_phone   text := nullif(trim(coalesce(p_contact_phone, '')), '');
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  insert into public.teachers (profile_id, status)
  values (v_uid, 'incomplete')
  on conflict (profile_id) do nothing;

  select id into v_teacher from public.teachers where profile_id = v_uid;

  update public.teachers set
    about               = coalesce(p_about, ''),
    price_min           = p_price_min,
    price_max           = p_price_max,
    contact_email       = v_email,
    contact_phone       = v_phone,
    show_contact        = coalesce(p_show_contact, false),
    weekly_availability = coalesce(p_weekly, '[]'::jsonb),
    updated_at          = now()
  where id = v_teacher;

  -- Reemplazar ramos.
  delete from public.teacher_subjects where teacher_id = v_teacher;
  if p_subject_ids is not null and array_length(p_subject_ids, 1) is not null then
    insert into public.teacher_subjects (teacher_id, subject_id)
    select v_teacher, unnest(p_subject_ids)
    on conflict do nothing;
  end if;

  -- Materializar disponibilidad.
  perform public.expand_tutor_availability(v_teacher);

  -- Completitud → publicar. Requiere AL MENOS un contacto (email o teléfono).
  if p_price_min is not null
     and p_price_max is not null
     and (v_email is not null or v_phone is not null)
     and exists (select 1 from public.teacher_subjects where teacher_id = v_teacher)
     and jsonb_array_length(coalesce(p_weekly, '[]'::jsonb)) > 0
  then
    v_status := 'active';
  else
    v_status := 'incomplete';
  end if;

  update public.teachers set status = v_status where id = v_teacher;
  return v_status;
end $$;

grant execute on function public.save_tutor_profile(
  text, integer, integer, text, text, boolean, uuid[], jsonb
) to authenticated;

-- ---------- 6.5 get_teacher_contact (exposición controlada) ----------
-- Devuelve el contacto del tutor SI lo hace público (show_contact) o si quien
-- pregunta tiene una reserva confirmada con él. Si no, devuelve null.
create or replace function public.get_teacher_contact(p_teacher uuid)
returns json language sql security definer set search_path = public stable as $$
  select case
    when t.show_contact
      or exists (
        select 1 from public.bookings b
         where b.teacher_id = t.id
           and b.student_id = auth.uid()
           and b.status = 'confirmed'
      )
    then json_build_object('email', t.contact_email, 'phone', t.contact_phone)
    else null
  end
  from public.teachers t
  where t.id = p_teacher and t.status = 'active';
$$;

grant execute on function public.get_teacher_contact(uuid) to anon, authenticated;

-- ---------- 6.6 Edición de perfil (profiles UPDATE) ----------
drop policy if exists "editar mi perfil" on public.profiles;
create policy "editar mi perfil" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
