-- ============================================================
-- AlpaCash · Foundation Schema
-- ============================================================
-- Idempotent SQL script that establishes all core tables,
-- the create_profile_with_role RPC, supplementary RLS policies
-- (tables not already covered in auth-policies.sql), and the
-- marketplace_lotes_publicos view required by the backend API.
--
-- USAGE
--   Paste this file into Supabase SQL Editor and run.
--   Safe to re-run: every statement is idempotent.
--   Run BEFORE auth-policies.sql on a fresh instance.
--
-- CANONICAL ROLE SET
--   productor · empresa · financiera · admin
--   "comprador" is an app-layer display alias for "empresa".
--   "capacitador" is deprecated and MUST NOT be granted access.
--
-- AFTER RUNNING
--   Regenerate database.types.ts (see bottom of file).
-- ============================================================


-- ------------------------------------------------------------
-- 0) EXTENSIONS & HELPER FUNCTIONS
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Security definer function to avoid infinite recursion in RLS policies
-- when checking if a user is an admin.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;


-- ------------------------------------------------------------
-- 1) CORE TABLES  (CREATE TABLE IF NOT EXISTS — idempotent)
-- ------------------------------------------------------------

create table if not exists public.profiles (
    id          uuid        primary key references auth.users(id) on delete cascade,
    nombre      text        not null,
    email       text,
    rol         text        not null
                            check (rol in ('productor','empresa','financiera','admin')),
    telefono    text,
    avatar_url  text,
    estado      text        not null default 'pendiente'
                            check (estado in ('activo','pendiente','suspendido','rechazado')),
    created_at  timestamptz not null default now()
);

create table if not exists public.productores (
    id                  uuid        primary key default gen_random_uuid(),
    profile_id          uuid        not null references public.profiles(id) on delete cascade,
    codigo_productor    text        unique not null,
    dni_ruc             text,
    nombre_asociacion   text,
    comunidad           text,
    provincia           text,
    region              text        not null default 'Puno',
    created_at          timestamptz not null default now()
);

create table if not exists public.empresas (
    id          uuid        primary key default gen_random_uuid(),
    profile_id  uuid        not null references public.profiles(id) on delete cascade,
    ruc         text,
    razon_social text,
    rubro       text,
    direccion   text,
    created_at  timestamptz not null default now()
);

create table if not exists public.entidades_financieras (
    id          uuid        primary key default gen_random_uuid(),
    profile_id  uuid        not null references public.profiles(id) on delete cascade,
    razon_social text,
    ruc         text,
    rubro       text,
    direccion   text,
    created_at  timestamptz not null default now()
);

create table if not exists public.categorias_fibra (
    id              uuid        primary key default gen_random_uuid(),
    nombre          text        not null unique,   -- seed idempotency anchor
    nivel_calidad   int,
    descripcion     text,
    created_at      timestamptz not null default now()
);

create table if not exists public.lotes_fibra (
    id                  uuid        primary key default gen_random_uuid(),
    productor_id        uuid        not null references public.productores(id) on delete cascade,
    categoria_id        uuid        references public.categorias_fibra(id),
    codigo_lote         text        unique,
    peso_libras         numeric(10,2),
    precio_por_libra    numeric(10,2),
    color               text,
    estado              text        not null default 'borrador'
                                    check (estado in ('borrador','disponible','reservado','vendido')),
    ubicacion_general   text,
    fecha_esquila       date,
    created_at          timestamptz not null default now()
);

create table if not exists public.fotos_lote (
    id          uuid        primary key default gen_random_uuid(),
    lote_id     uuid        not null references public.lotes_fibra(id) on delete cascade,
    url         text        not null,
    orden       int         not null default 0,
    created_at  timestamptz not null default now()
);

create table if not exists public.solicitudes_compra (
    id              uuid        primary key default gen_random_uuid(),
    lote_id         uuid        not null references public.lotes_fibra(id),
    empresa_id      uuid        not null references public.empresas(id),
    productor_id    uuid        not null references public.productores(id),
    estado          text        not null default 'pendiente'
                                check (estado in ('pendiente','aceptada','rechazada','contraoferta','contra-enviada')),
    precio_acordado numeric(10,2),
    created_at      timestamptz not null default now()
);

create table if not exists public.mensajes_solicitud (
    id              uuid        primary key default gen_random_uuid(),
    solicitud_id    uuid        not null references public.solicitudes_compra(id) on delete cascade,
    emisor_id       uuid        not null references public.profiles(id),
    contenido       text        not null,
    created_at      timestamptz not null default now()
);

create table if not exists public.transacciones (
    id                  uuid        primary key default gen_random_uuid(),
    lote_id             uuid        references public.lotes_fibra(id),
    empresa_id          uuid        references public.empresas(id),
    productor_id        uuid        references public.productores(id),
    precio_por_libra    numeric(10,2),
    estado              text        not null default 'en_proceso'
                                    check (estado in ('en_proceso','completada','cancelada')),
    created_at          timestamptz not null default now()
);

create table if not exists public.validaciones_productor (
    id              uuid        primary key default gen_random_uuid(),
    productor_id    uuid        not null references public.productores(id) on delete cascade,
    validado_por    uuid        references public.profiles(id),
    resultado       text,
    notas           text,
    created_at      timestamptz not null default now()
);

create table if not exists public.calificaciones (
    id              uuid        primary key default gen_random_uuid(),
    lote_id         uuid        references public.lotes_fibra(id),
    calificador_id  uuid        references public.profiles(id),
    puntaje         int         check (puntaje between 1 and 5),
    comentario      text,
    created_at      timestamptz not null default now()
);

create table if not exists public.evaluaciones_crediticias (
    id                  uuid        primary key default gen_random_uuid(),
    productor_id        uuid        references public.productores(id),
    nombre_productor    text,
    monto_solicitado    numeric(12,2),
    estado              text        not null default 'en_evaluacion',
    score               int,
    puntaje             int,
    created_at          timestamptz not null default now()
);

create table if not exists public.notificaciones (
    id          uuid        primary key default gen_random_uuid(),
    profile_id  uuid        not null references public.profiles(id) on delete cascade,
    titulo      text        not null,
    mensaje     text        not null,
    leida       boolean     not null default false,
    created_at  timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 1b) UNIQUE CONSTRAINTS FOR ROLE TABLES  (idempotent)
-- ------------------------------------------------------------
-- Enforces one role record per profile.  Required for the
-- ON CONFLICT (profile_id) DO NOTHING guarantee in the RPC
-- so that retries and double-submits are safe.
--
-- Pattern: DROP IF EXISTS + ADD is idempotent on any Supabase run.
-- WARNING: Will fail if duplicate profile_id rows already exist
-- (shouldn't happen on a correctly operated instance).

-- categorias_fibra: unique on nombre anchors the seed ON CONFLICT (nombre)
alter table public.categorias_fibra
    drop constraint if exists categorias_fibra_nombre_key;
alter table public.categorias_fibra
    add constraint categorias_fibra_nombre_key unique (nombre);

alter table public.productores
    drop constraint if exists productores_profile_id_unique;
alter table public.productores
    add constraint productores_profile_id_unique unique (profile_id);

alter table public.empresas
    drop constraint if exists empresas_profile_id_unique;
alter table public.empresas
    add constraint empresas_profile_id_unique unique (profile_id);

alter table public.entidades_financieras
    drop constraint if exists entidades_financieras_profile_id_unique;
alter table public.entidades_financieras
    add constraint entidades_financieras_profile_id_unique unique (profile_id);


-- ------------------------------------------------------------
-- 2) MARKETPLACE VIEW
-- ------------------------------------------------------------
-- Consumed by Backend/src/modules/marketplace/marketplace.controller.ts
-- via supabaseAdmin.  Columns align with query parameters:
--   .eq("estado","disponible")
--   .eq("categoria", ...)
--   .eq("region", ...)
--   .gte/.lte("precio_por_libra", ...)

create or replace view public.marketplace_lotes_publicos
with (security_invoker = true)
as
select
    lf.id,
    lf.codigo_lote,
    lf.peso_libras,
    lf.precio_por_libra,
    lf.color,
    lf.estado,
    lf.ubicacion_general        as region,
    lf.fecha_esquila,
    lf.created_at,
    cf.nombre                   as categoria,
    cf.nivel_calidad,
    pr.id                       as productor_id,
    pr.nombre_asociacion,
    pr.comunidad,
    pr.region                   as productor_region
from public.lotes_fibra lf
left join public.categorias_fibra cf on cf.id = lf.categoria_id
left join public.productores pr       on pr.id = lf.productor_id
where lf.estado = 'disponible';


-- ------------------------------------------------------------
-- 3) ATOMIC PROFILE CREATION RPC
-- ------------------------------------------------------------
-- Creates profiles row + role-specific row in a single transaction.
-- Called from the frontend CompleteProfileForm (OAuth complete-profile
-- flow) via supabase.rpc("create_profile_with_role", {...}).
--
-- CONTRACT:
--   p_rol ∈ {'productor','empresa','financiera'}
--   admin self-registration is intentionally blocked.
--   codigo_productor is generated via gen_random_uuid() —
--     UUID-based, guaranteed collision-safe.
--     Replaces the old Date.now()-based approach.
--   IDEMPOTENT: safe for retries and double-submits.
--     profiles row: ON CONFLICT (id) DO UPDATE (name/email/role).
--     role table rows: ON CONFLICT (profile_id) DO NOTHING — returns
--       the existing row's id, so RETURNING is never empty.
--   On ANY failure: full rollback — no partial rows remain.
--
-- RETURNS: { profile_id, role_record_id, codigo_productor? }
-- ------------------------------------------------------------

create or replace function public.create_profile_with_role(
    p_nombre        text,
    p_email         text,
    p_rol           text,
    p_avatar_url    text    default null,
    -- productor-specific
    p_dni           text    default null,
    p_comunidad     text    default null,
    p_region        text    default 'Puno',
    p_provincia     text    default null,
    -- empresa / financiera-specific
    p_razon_social  text    default null,
    p_ruc           text    default null,
    p_rubro         text    default null,
    p_direccion     text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id           uuid := auth.uid();
    v_role_record_id    uuid;
    v_codigo_productor  text;
begin
    -- Validate caller is authenticated
    if v_user_id is null then
        raise exception 'Not authenticated'
            using errcode = 'P0001';
    end if;

    -- Validate canonical role (admin excluded from self-service)
    if p_rol not in ('productor', 'empresa', 'financiera') then
        raise exception 'Invalid role: %. Allowed: productor, empresa, financiera', p_rol
            using errcode = 'P0002';
    end if;

    -- Upsert profile — idempotent; safe to call if trigger already
    -- created the profiles row (traditional signup path).
    insert into public.profiles (id, nombre, email, rol, avatar_url)
    values (v_user_id, p_nombre, p_email, p_rol, p_avatar_url)
    on conflict (id) do update
        set nombre     = excluded.nombre,
            email      = excluded.email,
            rol        = excluded.rol,
            avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);

    -- Create role-specific record (idempotent: ON CONFLICT DO NOTHING + SELECT)
    -- Safe for retries and double-submits — the unique constraint on profile_id
    -- prevents duplicate rows; SELECT retrieves the existing id when DO NOTHING fires.
    if p_rol = 'productor' then
        -- UUID-based code: collision-safe, not time-ordered
        v_codigo_productor := 'AC-' || upper(replace(gen_random_uuid()::text, '-', ''));
        insert into public.productores (
            profile_id, codigo_productor, dni_ruc,
            nombre_asociacion, comunidad, provincia, region
        ) values (
            v_user_id,
            v_codigo_productor,
            p_dni,
            p_comunidad,
            p_comunidad,
            p_provincia,
            coalesce(nullif(p_region, ''), 'Puno')
        )
        on conflict (profile_id) do nothing;
        -- Retrieve actual values (existing or just-inserted)
        select id, codigo_productor
        into   v_role_record_id, v_codigo_productor
        from   public.productores
        where  profile_id = v_user_id;

    elsif p_rol = 'empresa' then
        insert into public.empresas (
            profile_id, ruc, razon_social, rubro, direccion
        ) values (
            v_user_id,
            p_ruc,
            coalesce(nullif(p_razon_social, ''), p_nombre),
            p_rubro,
            p_direccion
        )
        on conflict (profile_id) do nothing;
        select id into v_role_record_id
        from   public.empresas
        where  profile_id = v_user_id;

    elsif p_rol = 'financiera' then
        insert into public.entidades_financieras (
            profile_id, ruc, razon_social, rubro, direccion
        ) values (
            v_user_id,
            p_ruc,
            coalesce(nullif(p_razon_social, ''), p_nombre),
            p_rubro,
            p_direccion
        )
        on conflict (profile_id) do nothing;
        select id into v_role_record_id
        from   public.entidades_financieras
        where  profile_id = v_user_id;
    end if;

    return jsonb_build_object(
        'profile_id',       v_user_id,
        'role_record_id',   v_role_record_id,
        'codigo_productor', v_codigo_productor
    );
end;
$$;

-- Permissions: only authenticated users may call this RPC
revoke all on function public.create_profile_with_role(
    text,text,text,text,text,text,text,text,text,text,text,text
) from public, anon;
grant execute on function public.create_profile_with_role(
    text,text,text,text,text,text,text,text,text,text,text,text
) to authenticated;


-- ------------------------------------------------------------
-- 4) SUPPLEMENTARY RLS POLICIES
-- ------------------------------------------------------------
-- Covers tables absent from auth-policies.sql.
-- All tables already have RLS enabled in auth-policies.sql;
-- these policies define access rules for the remaining tables.

-- SOLICITUDES_COMPRA ─────────────────────────────────────────

drop policy if exists "sc_empresa_manage" on public.solicitudes_compra;
create policy "sc_empresa_manage"
    on public.solicitudes_compra for all
    using (
        empresa_id in (select id from public.empresas where profile_id = auth.uid())
    )
    with check (
        empresa_id in (select id from public.empresas where profile_id = auth.uid())
    );

drop policy if exists "sc_productor_read" on public.solicitudes_compra;
create policy "sc_productor_read"
    on public.solicitudes_compra for select
    using (
        productor_id in (select id from public.productores where profile_id = auth.uid())
    );

drop policy if exists "sc_financiera_read" on public.solicitudes_compra;
create policy "sc_financiera_read"
    on public.solicitudes_compra for select
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.rol = 'financiera'
        )
    );

-- TRANSACCIONES ──────────────────────────────────────────────

drop policy if exists "tx_empresa_read" on public.transacciones;
create policy "tx_empresa_read"
    on public.transacciones for select
    using (
        empresa_id in (select id from public.empresas where profile_id = auth.uid())
    );

drop policy if exists "tx_productor_read" on public.transacciones;
create policy "tx_productor_read"
    on public.transacciones for select
    using (
        productor_id in (select id from public.productores where profile_id = auth.uid())
    );

drop policy if exists "tx_financiera_read" on public.transacciones;
create policy "tx_financiera_read"
    on public.transacciones for select
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.rol = 'financiera'
        )
    );

-- FOTOS_LOTE ─────────────────────────────────────────────────

drop policy if exists "fotos_authenticated_read" on public.fotos_lote;
create policy "fotos_authenticated_read"
    on public.fotos_lote for select
    to authenticated
    using (true);

drop policy if exists "fotos_productor_manage" on public.fotos_lote;
create policy "fotos_productor_manage"
    on public.fotos_lote for all
    using (
        lote_id in (
            select lf.id from public.lotes_fibra lf
            join public.productores pr on pr.id = lf.productor_id
            where pr.profile_id = auth.uid()
        )
    )
    with check (
        lote_id in (
            select lf.id from public.lotes_fibra lf
            join public.productores pr on pr.id = lf.productor_id
            where pr.profile_id = auth.uid()
        )
    );

-- CALIFICACIONES ─────────────────────────────────────────────

drop policy if exists "calif_authenticated_read" on public.calificaciones;
create policy "calif_authenticated_read"
    on public.calificaciones for select
    to authenticated
    using (true);

drop policy if exists "calif_own_write" on public.calificaciones;
create policy "calif_own_write"
    on public.calificaciones for insert
    with check (calificador_id = auth.uid());

-- VALIDACIONES_PRODUCTOR ─────────────────────────────────────

drop policy if exists "validaciones_productor_read" on public.validaciones_productor;
create policy "validaciones_productor_read"
    on public.validaciones_productor for select
    using (
        productor_id in (select id from public.productores where profile_id = auth.uid())
    );

drop policy if exists "validaciones_admin_manage" on public.validaciones_productor;
create policy "validaciones_admin_manage"
    on public.validaciones_productor for all
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.rol = 'admin'
        )
    );

-- EVALUACIONES_CREDITICIAS ────────────────────────────────────

drop policy if exists "eval_financiera_read" on public.evaluaciones_crediticias;
create policy "eval_financiera_read"
    on public.evaluaciones_crediticias for select
    using (
        exists (
            select 1 from public.profiles p
            -- Only canonical roles: financiera and admin
            -- capacitador is NOT included (deprecated role)
            where p.id = auth.uid() and p.rol in ('financiera', 'admin')
        )
    );

drop policy if exists "eval_productor_own" on public.evaluaciones_crediticias;
create policy "eval_productor_own"
    on public.evaluaciones_crediticias for select
    using (
        productor_id in (select id from public.productores where profile_id = auth.uid())
    );

-- MENSAJES_SOLICITUD ─────────────────────────────────────────

drop policy if exists "msj_participants_read" on public.mensajes_solicitud;
create policy "msj_participants_read"
    on public.mensajes_solicitud for select
    using (
        solicitud_id in (
            select id from public.solicitudes_compra sc
            where sc.empresa_id  in (select id from public.empresas    where profile_id = auth.uid())
               or sc.productor_id in (select id from public.productores where profile_id = auth.uid())
        )
    );

drop policy if exists "msj_participants_write" on public.mensajes_solicitud;
create policy "msj_participants_write"
    on public.mensajes_solicitud for insert
    with check (
        emisor_id = auth.uid()
        and solicitud_id in (
            select id from public.solicitudes_compra sc
            where sc.empresa_id  in (select id from public.empresas    where profile_id = auth.uid())
               or sc.productor_id in (select id from public.productores where profile_id = auth.uid())
        )
    );


-- LOTES_FAVORITOS ───────────────────────────────────────────

create table if not exists public.lotes_favoritos (
    id          uuid        primary key default gen_random_uuid(),
    profile_id  uuid        not null references public.profiles(id) on delete cascade,
    lote_id     uuid        not null references public.lotes_fibra(id) on delete cascade,
    created_at  timestamptz not null default now(),
    constraint lotes_favoritos_profile_lote_key unique (profile_id, lote_id)
);

alter table public.lotes_favoritos enable row level security;

drop policy if exists "lotes_favoritos_select_own" on public.lotes_favoritos;
create policy "lotes_favoritos_select_own" on public.lotes_favoritos
  for select using (auth.uid() = profile_id);

drop policy if exists "lotes_favoritos_insert_own" on public.lotes_favoritos;
create policy "lotes_favoritos_insert_own" on public.lotes_favoritos
  for insert with check (auth.uid() = profile_id);

drop policy if exists "lotes_favoritos_delete_own" on public.lotes_favoritos;
create policy "lotes_favoritos_delete_own" on public.lotes_favoritos
  for delete using (auth.uid() = profile_id);


-- ------------------------------------------------------------
-- 5) SEED: CATEGORIAS_FIBRA
-- ------------------------------------------------------------
-- ON CONFLICT (nombre) DO NOTHING is the correct idempotent seed pattern:
-- the unique constraint on nombre guarantees that rerunning this script
-- on an existing instance is a no-op rather than a duplicate-insert.
-- (Generic "ON CONFLICT DO NOTHING" without a target only matches the PK,
-- which is a fresh UUID each run — so it would never conflict and would
-- duplicate rows on every rerun.)

insert into public.categorias_fibra (nombre, nivel_calidad, descripcion)
values
    ('Baby Alpaca',       1, 'Fibra fina < 22.5 µm'),
    ('Súper Baby',        2, 'Fibra muy fina < 20 µm'),
    ('Fleece',            3, 'Fibra estándar 22.5–26.5 µm'),
    ('Médium Fleece',     4, 'Fibra media 26.5–29 µm'),
    ('Huarizo',           5, 'Fibra gruesa > 29 µm')
on conflict (nombre) do nothing;


-- ============================================================
-- HOW TO REGENERATE database.types.ts
-- ============================================================
-- After running this script on your personal Supabase project:
--
-- Option A — Supabase CLI (recommended):
--   npx supabase gen types typescript \
--     --project-id <your-project-ref> \
--     > database.types.ts
--
-- Option B — API key approach:
--   curl "https://api.supabase.com/v1/projects/<ref>/types/typescript" \
--     -H "Authorization: Bearer <supabase-access-token>" \
--     > database.types.ts
--
-- Find your project ref: Supabase Dashboard → Project Settings → General
-- Commit the result. The current file is a structural stub only.
-- ============================================================
