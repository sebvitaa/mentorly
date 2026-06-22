-- ============================================================
-- Mentorly — Fase 5: publicación del perfil tutor
--
-- El tutor define, desde su perfil: precio (min/max), ramos que enseña,
-- contacto (tipo + valor) y su disponibilidad SEMANAL. Al completar todo,
-- queda PUBLICADO (status = 'active') y aparece en el catálogo. Sin ramos,
-- no es visible.
--
-- Disponibilidad: NO hay tabla nueva. El patrón semanal se guarda en una
-- columna jsonb de `teachers` y se EXPANDE a `availability_slots` (la tabla
-- date-based que ya consume el catálogo) sobre las próximas 2 semanas. Así,
-- si el tutor marca "lunes 10:00", queda disponible este lunes y el siguiente.
--
-- Ejecutar en Supabase (SQL Editor) o vía CLI. Idempotente.
-- ============================================================

-- ---------- 5.1 Patrón semanal en teachers (columna, no tabla) ----------
-- Forma: [{ "weekday": 1, "hour": "09:00" }, ...]   weekday 1=Lun..7=Dom (ISO)
alter table public.teachers
  add column if not exists weekly_availability jsonb not null default '[]'::jsonb;

-- ---------- 5.2 Expandir patrón semanal → availability_slots ----------
-- Materializa los próximos 14 días (hoy..+13). Idempotente: preserva filas ya
-- existentes (incluida su bandera `available`) y limpia las futuras que ya no
-- estén en el patrón.
create or replace function public.expand_tutor_availability(p_teacher uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_weekly jsonb;
begin
  select coalesce(weekly_availability, '[]'::jsonb)
    into v_weekly
    from public.teachers
   where id = p_teacher;

  if v_weekly is null then
    return;
  end if;

  -- Quitar slots futuros que ya no están en el patrón.
  delete from public.availability_slots a
   where a.teacher_id = p_teacher
     and a.date >= current_date
     and not exists (
       select 1
         from jsonb_to_recordset(v_weekly) as w(weekday int, hour text)
        where w.weekday = extract(isodow from a.date)::int
          and w.hour = a.hour
     );

  -- Sembrar el patrón sobre los próximos 14 días.
  insert into public.availability_slots (teacher_id, date, hour, available)
  select p_teacher, d::date, w.hour, true
    from generate_series(current_date, current_date + 13, interval '1 day') d
    cross join jsonb_to_recordset(v_weekly) as w(weekday int, hour text)
   where w.weekday = extract(isodow from d)::int
  on conflict (teacher_id, date, hour) do nothing;
end $$;

-- Reexpandir a TODOS los tutores (para correr a diario y "rodar" la ventana).
create or replace function public.expand_all_tutor_availability()
returns void language sql security definer set search_path = public as $$
  select public.expand_tutor_availability(id) from public.teachers;
$$;

-- Opcional: rodar la ventana cada día (requiere la extensión pg_cron).
-- Si pg_cron no está disponible, los slots cubren 14 días desde el último
-- guardado; basta con que el tutor reabra/reguarde su perfil.
--   select cron.schedule(
--     'expand-availability-daily', '5 0 * * *',
--     'select public.expand_all_tutor_availability();'
--   );

-- ---------- 5.3 Leer mi perfil tutor (incluye contacto, oculto por grant) ----------
-- SECURITY DEFINER para poder devolver contact_type/contact_value al dueño
-- (fase-3 revocó el SELECT de esas columnas para anon/authenticated).
create or replace function public.get_my_tutor_profile()
returns json language sql security definer set search_path = public stable as $$
  select json_build_object(
    'teacher_id',          t.id,
    'about',               t.about,
    'price_min',           t.price_min,
    'price_max',           t.price_max,
    'contact_type',        t.contact_type,
    'contact_value',       t.contact_value,
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

-- ---------- 5.4 Guardar / publicar mi perfil tutor ----------
create or replace function public.save_tutor_profile(
  p_about         text,
  p_price_min     integer,
  p_price_max     integer,
  p_contact_type  text,
  p_contact_value text,
  p_subject_ids   uuid[],
  p_weekly        jsonb
) returns text language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_teacher uuid;
  v_status  text;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  if p_contact_type is not null and p_contact_type not in ('email','phone') then
    raise exception 'contact_type inválido: %', p_contact_type;
  end if;

  -- 1:1 con el perfil; crear la ficha tutor si aún no existe.
  insert into public.teachers (profile_id, status)
  values (v_uid, 'incomplete')
  on conflict (profile_id) do nothing;

  select id into v_teacher from public.teachers where profile_id = v_uid;

  -- 2. Datos editables.
  update public.teachers set
    about               = coalesce(p_about, ''),
    price_min           = p_price_min,
    price_max           = p_price_max,
    contact_type        = p_contact_type,
    contact_value       = p_contact_value,
    weekly_availability = coalesce(p_weekly, '[]'::jsonb),
    updated_at          = now()
  where id = v_teacher;

  -- 3. Reemplazar ramos que enseña.
  delete from public.teacher_subjects where teacher_id = v_teacher;
  if p_subject_ids is not null and array_length(p_subject_ids, 1) is not null then
    insert into public.teacher_subjects (teacher_id, subject_id)
    select v_teacher, unnest(p_subject_ids)
    on conflict do nothing;
  end if;

  -- 4. Materializar disponibilidad.
  perform public.expand_tutor_availability(v_teacher);

  -- 5. Completitud → publicar o dejar incompleto.
  if p_price_min is not null
     and p_price_max is not null
     and p_contact_type is not null
     and coalesce(p_contact_value, '') <> ''
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

-- ---------- 5.5 Grants ----------
grant execute on function public.get_my_tutor_profile() to authenticated;
grant execute on function public.save_tutor_profile(
  text, integer, integer, text, text, uuid[], jsonb
) to authenticated;
