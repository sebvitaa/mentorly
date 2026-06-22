-- ============================================================
-- Mentorly — Seed de un TUTOR DEMO (para probar el flujo de reserva)
-- ============================================================
-- Cómo usarlo:
--   1. Regístrate en la app con la cuenta que será el tutor
--      (p. ej. tutor.demo@udd.cl). Esto crea su `profile` (la confirmación
--      de email debe estar desactivada para tener sesión al instante).
--   2. Pon ese correo en `v_email` aquí abajo.
--   3. Ejecuta este script en Supabase (SQL Editor → Run).
--   4. Inicia sesión con OTRA cuenta de estudiante y reserva con este tutor.
--
-- Idempotente: se puede correr varias veces sin duplicar.
-- ============================================================

do $$
declare
  v_email   text := 'tutor.demo@udd.cl';   -- <-- correo de un usuario YA registrado
  v_profile uuid;
  v_teacher uuid;
begin
  select id into v_profile from public.profiles where email = v_email;
  if v_profile is null then
    raise exception 'No hay un profile con email %. Regístralo primero en la app.', v_email;
  end if;

  -- Ficha de tutor (1:1 con el perfil; profile_id es unique).
  -- status = 'active' para que sea visible en el catálogo (RLS "ver tutores activos").
  insert into public.teachers
    (profile_id, about, price_min, price_max, contact_type, contact_value, status)
  values
    (v_profile,
     'Tutor demo: ayudo con ramos de primer año, con paciencia y ejemplos prácticos.',
     8000, 12000, 'email', v_email, 'active')
  on conflict (profile_id) do update
    set about = excluded.about,
        status = 'active',
        updated_at = now()
  returning id into v_teacher;

  if v_teacher is null then
    select id into v_teacher from public.teachers where profile_id = v_profile;
  end if;

  -- Ramos que enseña (deben existir en `subjects`; vienen del seed de Fase 1).
  insert into public.teacher_subjects (teacher_id, subject_id)
  select v_teacher, s.id
  from public.subjects s
  where s.name in ('Cálculo I', 'Programación', 'Álgebra Lineal')
  on conflict do nothing;

  -- Disponibilidad: próximas 2 semanas, lunes a viernes, 6 bloques por día.
  insert into public.availability_slots (teacher_id, date, hour, available)
  select v_teacher, d::date, t.h, true
  from generate_series(current_date, current_date + 13, interval '1 day') d
  cross join (values ('09:00'),('10:00'),('11:00'),('14:00'),('15:00'),('16:00')) as t(h)
  where extract(isodow from d) < 6   -- 1..5 = lunes a viernes
  on conflict (teacher_id, date, hour) do nothing;

  raise notice 'Tutor demo listo: profile=%  teacher=%', v_profile, v_teacher;
end $$;
