-- ============================================================
-- Mentorly — Fase 1: catálogo académico (DDL + seed)
-- Generado desde scripts/mock-api/server.mjs (fuente única).
-- Ejecutar en Supabase (SQL Editor) o vía CLI.
-- ============================================================

-- ---------- 1.1 Tablas del catálogo ----------
create table if not exists public.campuses (
  id text primary key, name text not null, slug text not null, active boolean not null default true
);
create table if not exists public.faculties (
  id text primary key, name text not null, slug text not null, active boolean not null default true
);
create table if not exists public.careers (
  id text primary key,
  faculty_id text not null references public.faculties(id),
  campus_id  text not null references public.campuses(id),
  name text not null, slug text not null, active boolean not null default true
);

alter table public.campuses  enable row level security;
alter table public.faculties enable row level security;
alter table public.careers   enable row level security;
create policy "lectura publica campuses"  on public.campuses  for select using (true);
create policy "lectura publica faculties" on public.faculties for select using (true);
create policy "lectura publica careers"   on public.careers   for select using (true);

-- ---------- Seed: campuses ----------
insert into public.campuses (id,name,slug,active) values ('campus-stgo','Santiago','santiago',true) on conflict (id) do nothing;
insert into public.campuses (id,name,slug,active) values ('campus-ccpc','Concepción','concepcion',true) on conflict (id) do nothing;

-- ---------- Seed: faculties ----------
insert into public.faculties (id,name,slug,active) values ('fac-arquitectura-arte-stgo','Arquitectura y Arte','arquitectura-arte',true) on conflict (id) do nothing;
insert into public.faculties (id,name,slug,active) values ('fac-ciencias-salud-ccpc','Ciencias de la Salud','ciencias-salud',true) on conflict (id) do nothing;
insert into public.faculties (id,name,slug,active) values ('fac-comunicaciones-stgo','Comunicaciones','comunicaciones',true) on conflict (id) do nothing;
insert into public.faculties (id,name,slug,active) values ('fac-derecho-stgo','Derecho','derecho',true) on conflict (id) do nothing;
insert into public.faculties (id,name,slug,active) values ('fac-diseno-stgo','Diseño','diseno',true) on conflict (id) do nothing;
insert into public.faculties (id,name,slug,active) values ('fac-economia-negocios-stgo','Economía y Negocios','economia-negocios',true) on conflict (id) do nothing;
insert into public.faculties (id,name,slug,active) values ('fac-educacion-stgo','Educación','educacion',true) on conflict (id) do nothing;
insert into public.faculties (id,name,slug,active) values ('fac-gobierno-stgo','Gobierno','gobierno',true) on conflict (id) do nothing;
insert into public.faculties (id,name,slug,active) values ('fac-ingenieria-stgo','Ingeniería','ingenieria',true) on conflict (id) do nothing;
insert into public.faculties (id,name,slug,active) values ('fac-medicina-stgo','Medicina Clínica Alemana UDD','medicina',true) on conflict (id) do nothing;
insert into public.faculties (id,name,slug,active) values ('fac-psicologia-stgo','Psicología','psicologia',true) on conflict (id) do nothing;

-- ---------- Seed: careers ----------
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-arquitectura-arte-arquitectura','fac-arquitectura-arte-stgo','campus-stgo','Arquitectura','arquitectura',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-comunicaciones-cine-comunicacion-audiovisual','fac-comunicaciones-stgo','campus-stgo','Cine y Comunicación Audiovisual','cine-comunicacion-audiovisual',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-comunicaciones-periodismo-comunicacion','fac-comunicaciones-stgo','campus-stgo','Periodismo y Comunicación','periodismo-comunicacion',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-comunicaciones-publicidad-marketing','fac-comunicaciones-stgo','campus-stgo','Publicidad y Marketing','publicidad-marketing',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-derecho-derecho','fac-derecho-stgo','campus-stgo','Derecho','derecho',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-diseno-diseno','fac-diseno-stgo','campus-stgo','Diseño','diseno',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-economia-negocios-ing-comercial','fac-economia-negocios-stgo','campus-stgo','Ingeniería Comercial','ingenieria-comercial',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-economia-negocios-global-business-administration','fac-economia-negocios-stgo','campus-stgo','Global Business Administration','global-business-administration',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-economia-negocios-negocios-ciencia-datos','fac-economia-negocios-stgo','campus-stgo','Negocios y Ciencia de Datos','negocios-ciencia-datos',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-educacion-pedagogia-educacion-basica','fac-educacion-stgo','campus-stgo','Pedagogía en Educación Básica','pedagogia-educacion-basica',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-educacion-pedagogia-educacion-parvulos','fac-educacion-stgo','campus-stgo','Pedagogía en Educación de Párvulos','pedagogia-educacion-parvulos',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-gobierno-ciencia-politica-politicas-publicas','fac-gobierno-stgo','campus-stgo','Ciencia Política y Políticas Públicas','ciencia-politica-politicas-publicas',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-ingenieria-ing-civil-industrial','fac-ingenieria-stgo','campus-stgo','Ingeniería Civil Industrial','ingenieria-civil-industrial',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-ingenieria-ing-civil-informatica-innovacion','fac-ingenieria-stgo','campus-stgo','Ingeniería Civil en Informática e Innovación Tecnológica','ingenieria-civil-informatica-innovacion',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-ingenieria-ing-civil-informatica-ia','fac-ingenieria-stgo','campus-stgo','Ingeniería Civil en Informática e Inteligencia Artificial','ingenieria-civil-informatica-ia',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-ingenieria-ing-civil-biomedicina','fac-ingenieria-stgo','campus-stgo','Ingeniería Civil en BioMedicina','ingenieria-civil-biomedicina',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-ingenieria-ing-civil-mineria','fac-ingenieria-stgo','campus-stgo','Ingeniería Civil en Minería','ingenieria-civil-mineria',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-ingenieria-ing-civil-obras-civiles','fac-ingenieria-stgo','campus-stgo','Ingeniería Civil en Obras Civiles','ingenieria-civil-obras-civiles',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-ingenieria-geologia','fac-ingenieria-stgo','campus-stgo','Geología','geologia',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-medicina-medicina','fac-medicina-stgo','campus-stgo','Medicina','medicina',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-medicina-enfermeria','fac-medicina-stgo','campus-stgo','Enfermería','enfermeria',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-medicina-kinesiologia','fac-medicina-stgo','campus-stgo','Kinesiología','kinesiologia',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-medicina-nutricion-dietetica','fac-medicina-stgo','campus-stgo','Nutrición y Dietética','nutricion-dietetica',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-medicina-obstetricia','fac-medicina-stgo','campus-stgo','Obstetricia','obstetricia',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-medicina-odontologia','fac-medicina-stgo','campus-stgo','Odontología','odontologia',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-medicina-quimica-farmacia','fac-medicina-stgo','campus-stgo','Química y Farmacia','quimica-farmacia',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-medicina-tecnologia-medica','fac-medicina-stgo','campus-stgo','Tecnología Médica','tecnologia-medica',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-medicina-terapia-ocupacional','fac-medicina-stgo','campus-stgo','Terapia Ocupacional','terapia-ocupacional',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-stgo-psicologia-psicologia','fac-psicologia-stgo','campus-stgo','Psicología','psicologia',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-arquitectura-arte-arquitectura','fac-arquitectura-arte-stgo','campus-ccpc','Arquitectura','arquitectura',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-derecho-derecho','fac-derecho-stgo','campus-ccpc','Derecho','derecho',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-diseno-diseno','fac-diseno-stgo','campus-ccpc','Diseño','diseno',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-economia-negocios-ing-comercial','fac-economia-negocios-stgo','campus-ccpc','Ingeniería Comercial','ingenieria-comercial',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-ingenieria-ing-civil-industrial','fac-ingenieria-stgo','campus-ccpc','Ingeniería Civil Industrial','ingenieria-civil-industrial',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-ingenieria-ing-civil-informatica-innovacion','fac-ingenieria-stgo','campus-ccpc','Ingeniería Civil en Informática e Innovación Tecnológica','ingenieria-civil-informatica-innovacion',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-comunicaciones-periodismo-comunicacion','fac-comunicaciones-stgo','campus-ccpc','Periodismo y Comunicación','periodismo-comunicacion',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-psicologia-psicologia','fac-psicologia-stgo','campus-ccpc','Psicología','psicologia',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-ciencias-salud-enfermeria','fac-ciencias-salud-ccpc','campus-ccpc','Enfermería','enfermeria',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-ciencias-salud-kinesiologia','fac-ciencias-salud-ccpc','campus-ccpc','Kinesiología','kinesiologia',true) on conflict (id) do nothing;
insert into public.careers (id,faculty_id,campus_id,name,slug,active) values ('career-ccpc-ciencias-salud-odontologia','fac-ciencias-salud-ccpc','campus-ccpc','Odontología','odontologia',true) on conflict (id) do nothing;

-- ---------- 1.2 Columnas de referencia en profiles ----------
alter table public.profiles
  add column if not exists campus_id  text references public.campuses(id),
  add column if not exists faculty_id text references public.faculties(id),
  add column if not exists career_id  text references public.careers(id);

-- ---------- 1.2 Extender el trigger handle_new_user ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, career, year, campus_id, faculty_id, career_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'career', ''),
    coalesce(new.raw_user_meta_data->>'year', ''),
    new.raw_user_meta_data->>'campus_id',
    new.raw_user_meta_data->>'faculty_id',
    new.raw_user_meta_data->>'career_id'
  );
  return new;
end $$;
