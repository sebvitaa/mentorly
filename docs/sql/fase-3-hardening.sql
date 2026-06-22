-- ============================================================
-- Mentorly — Fase 3: endurecimiento (RLS / contacto / dominio UDD)
-- Ejecutar en Supabase (SQL Editor) o vía CLI.
-- ============================================================

-- ---------- 3.2 Forzar dominio institucional @udd.cl (server-side) ----------
-- Defensa real: además de la validación en el cliente, rechaza en la BD
-- cualquier alta de usuario cuyo correo no sea @udd.cl.
create or replace function public.enforce_udd_email()
returns trigger language plpgsql as $$
begin
  if new.email is null or new.email !~* '^[^@\s]+@udd\.cl$' then
    raise exception 'Solo se permiten correos institucionales @udd.cl';
  end if;
  return new;
end $$;

drop trigger if exists enforce_udd_email_before_insert on auth.users;
create trigger enforce_udd_email_before_insert
before insert on auth.users
for each row execute function public.enforce_udd_email();

-- ---------- 3.1 Ocultar el contacto del tutor a nivel BD ----------
-- El catálogo es de lectura pública, pero las columnas de contacto no deben
-- viajar al cliente. Se revoca el SELECT de tabla y se concede por columna,
-- excluyendo contact_type / contact_value.
revoke select on public.teachers from anon, authenticated;
grant select (
  id, profile_id, about, price_min, price_max, rating, review_count, created_at
) on public.teachers to anon, authenticated;
-- (Cuando exista UI para revelar el contacto tras una reserva 'confirmed',
--  se expondrá vía una función SECURITY DEFINER que valide la reserva.)

-- ---------- 3.1 Repaso de RLS: asegurar que esté activa en todo el esquema ----------
alter table public.profiles           enable row level security;
alter table public.profile_subjects   enable row level security;
alter table public.subjects           enable row level security;
alter table public.teachers           enable row level security;
alter table public.teacher_subjects   enable row level security;
alter table public.availability_slots enable row level security;
alter table public.reviews            enable row level security;
alter table public.campuses           enable row level security;
alter table public.faculties          enable row level security;
alter table public.careers            enable row level security;
alter table public.bookings           enable row level security;
