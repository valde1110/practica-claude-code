-- Esquema completo de la app de estudio UNED Química.
-- Se ejecuta una sola vez desde Supabase (SQL Editor).
--
-- Seguridad: la app no tiene "usuarios" en el sentido normal (es de una sola
-- persona), pero se despliega en una URL pública. Para que nadie pueda leer
-- ni escribir datos con la clave publicable (que va en el frontend y es
-- visible por diseño), toda tabla exige estar autenticado con Supabase Auth.
-- El único usuario se crea a mano desde el panel de Supabase y el alta
-- pública de cuentas queda desactivada (Authentication > Settings).
-- La tabla tokens_drive no lleva ninguna política: solo el backend
-- (Netlify Functions, con la service_role key) puede leerla o escribirla.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Asignaturas y temas (estructura reflejada de Google Drive)
-- ---------------------------------------------------------------------
create table public.asignaturas (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  nombre text not null,
  drive_folder_id text unique,
  fecha_examen date,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table public.temas (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid not null references public.asignaturas(id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  drive_folder_id text unique,
  created_at timestamptz not null default now()
);
create index temas_asignatura_idx on public.temas(asignatura_id);

-- Cache de la estructura de archivos de Drive (apuntes, audios, exámenes, ejercicios)
create table public.archivos_drive (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid not null references public.asignaturas(id) on delete cascade,
  tema_id uuid references public.temas(id) on delete cascade,
  categoria text not null check (categoria in ('apunte', 'audio', 'examen', 'ejercicio')),
  drive_file_id text not null unique,
  nombre text not null,
  mime_type text,
  web_view_link text,
  modified_time timestamptz,
  created_at timestamptz not null default now()
);
create index archivos_drive_asignatura_idx on public.archivos_drive(asignatura_id);
create index archivos_drive_tema_idx on public.archivos_drive(tema_id);

-- Posición de reproducción y descarga offline de audios (NotebookLM, etc.)
create table public.posiciones_audio (
  id uuid primary key default gen_random_uuid(),
  archivo_id uuid not null unique references public.archivos_drive(id) on delete cascade,
  posicion_segundos numeric not null default 0,
  duracion_segundos numeric,
  descargado boolean not null default false,
  actualizado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Banco de preguntas de teoría
-- ---------------------------------------------------------------------
create table public.preguntas (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid not null references public.asignaturas(id) on delete cascade,
  tema_id uuid references public.temas(id) on delete set null,
  tipo text not null check (tipo in ('test', 'vf', 'corta')),
  enunciado text not null,
  opciones jsonb,
  respuesta_correcta text not null,
  explicacion text,
  origen text not null default 'banco' check (origen in ('banco', 'ia_generada')),
  estado text not null default 'aprobada' check (estado in ('aprobada', 'pendiente_revision', 'descartada')),
  archivo_origen_id uuid references public.archivos_drive(id) on delete set null,
  created_at timestamptz not null default now()
);
create index preguntas_asignatura_idx on public.preguntas(asignatura_id);
create index preguntas_tema_idx on public.preguntas(tema_id);
create index preguntas_estado_idx on public.preguntas(estado);

create table public.intentos_pregunta (
  id uuid primary key default gen_random_uuid(),
  pregunta_id uuid not null references public.preguntas(id) on delete cascade,
  respuesta_usuario text,
  resultado text not null check (resultado in ('correcto', 'parcial', 'incorrecto', 'pendiente_correccion')),
  explicacion_ia text,
  creado_en timestamptz not null default now()
);
create index intentos_pregunta_pregunta_idx on public.intentos_pregunta(pregunta_id);

-- ---------------------------------------------------------------------
-- Ejercicios prácticos paso a paso
-- ---------------------------------------------------------------------
create table public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  asignatura_id uuid not null references public.asignaturas(id) on delete cascade,
  tema_id uuid references public.temas(id) on delete set null,
  titulo text,
  enunciado text not null,
  datos jsonb not null default '[]'::jsonb,
  origen text not null check (origen in ('examen_resuelto', 'examen_sin_resolver', 'libro_pec', 'ia_generado')),
  verificado boolean not null default false,
  archivo_origen_id uuid references public.archivos_drive(id) on delete set null,
  created_at timestamptz not null default now()
);
create index ejercicios_asignatura_idx on public.ejercicios(asignatura_id);
create index ejercicios_tema_idx on public.ejercicios(tema_id);

create table public.pasos_ejercicio (
  id uuid primary key default gen_random_uuid(),
  ejercicio_id uuid not null references public.ejercicios(id) on delete cascade,
  clave text not null,
  descripcion text not null,
  dependencias jsonb not null default '[]'::jsonb,
  expresion_mathjs text,
  resultado_esperado text,
  unidad text,
  pistas jsonb not null default '[]'::jsonb,
  orden_sugerido int not null default 0,
  created_at timestamptz not null default now(),
  unique (ejercicio_id, clave)
);
create index pasos_ejercicio_ejercicio_idx on public.pasos_ejercicio(ejercicio_id);

create table public.intentos_ejercicio (
  id uuid primary key default gen_random_uuid(),
  ejercicio_id uuid not null references public.ejercicios(id) on delete cascade,
  iniciado_en timestamptz not null default now(),
  finalizado_en timestamptz,
  resumen jsonb
);
create index intentos_ejercicio_ejercicio_idx on public.intentos_ejercicio(ejercicio_id);

create table public.intentos_paso (
  id uuid primary key default gen_random_uuid(),
  intento_ejercicio_id uuid not null references public.intentos_ejercicio(id) on delete cascade,
  paso_id uuid not null references public.pasos_ejercicio(id) on delete cascade,
  num_intentos int not null default 0,
  pistas_usadas int not null default 0,
  resultado text check (resultado in ('acierto_directo', 'acierto_con_pistas', 'fallado')),
  creado_en timestamptz not null default now()
);
create index intentos_paso_intento_idx on public.intentos_paso(intento_ejercicio_id);

-- ---------------------------------------------------------------------
-- Progreso, repetición espaciada, rachas y plan de estudio
-- ---------------------------------------------------------------------
create table public.progreso_tema (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null unique references public.temas(id) on delete cascade,
  porcentaje_acierto numeric not null default 0,
  preguntas_respondidas int not null default 0,
  actualizado_en timestamptz not null default now()
);

create table public.repeticion_espaciada (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('pregunta', 'ejercicio')),
  referencia_id uuid not null,
  intervalo_dias int not null default 1,
  proxima_fecha date not null default current_date,
  ultima_fecha date,
  racha_aciertos int not null default 0,
  created_at timestamptz not null default now(),
  unique (tipo, referencia_id)
);
create index repeticion_espaciada_proxima_idx on public.repeticion_espaciada(proxima_fecha);

create table public.rachas_estudio (
  fecha date primary key,
  estudio_realizado boolean not null default true
);

create table public.dias_plan (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  disponible boolean not null,
  motivo text,
  origen text not null default 'manual' check (origen in ('manual', 'automatico'))
);

create table public.plan_estudio (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  asignatura_id uuid not null references public.asignaturas(id) on delete cascade,
  tema_id uuid references public.temas(id) on delete set null,
  tipo text not null check (tipo in ('tema_nuevo', 'repaso')),
  completado boolean not null default false,
  created_at timestamptz not null default now()
);
create index plan_estudio_fecha_idx on public.plan_estudio(fecha);

-- ---------------------------------------------------------------------
-- Ajustes (clave/valor) y notificaciones push
-- ---------------------------------------------------------------------
create table public.ajustes (
  clave text primary key,
  valor jsonb not null
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Tokens OAuth de Google Drive: solo el backend (service_role) los toca.
create table public.tokens_drive (
  id int primary key default 1,
  access_token text,
  refresh_token text,
  expiry timestamptz,
  updated_at timestamptz not null default now(),
  constraint tokens_drive_singleton check (id = 1)
);

-- ---------------------------------------------------------------------
-- Row Level Security: todo exige sesión autenticada; tokens_drive, nadie
-- desde el cliente (ni siquiera autenticado) porque no tiene políticas.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'asignaturas', 'temas', 'archivos_drive', 'posiciones_audio',
      'preguntas', 'intentos_pregunta', 'ejercicios', 'pasos_ejercicio',
      'intentos_ejercicio', 'intentos_paso', 'progreso_tema',
      'repeticion_espaciada', 'rachas_estudio', 'dias_plan', 'plan_estudio',
      'ajustes', 'push_subscriptions'
    ])
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy authenticated_all on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

alter table public.tokens_drive enable row level security;
-- Sin "create policy" aquí a propósito: acceso denegado salvo service_role.
