-- ============================================================
-- AlpaCash · Marketplace Seed
-- ============================================================
-- Idempotent seed script for home marketplace cards and price
-- aggregation.  Safe to re-run: all inserts resolve conflicts.
--
-- PREREQUISITES : foundation.sql (schema + categorias_fibra) must
--                 be run first.
-- USAGE         : Paste into Supabase SQL Editor → Run.
-- NOTE          : Seed users are dev/demo-only.  Do NOT run this
--                 script against a production instance that already
--                 has real user traffic.
--
-- DATA POPULATED
--   4 seed auth users  →  4 profiles  →  4 productores
--   6 lotes_fibra  (all estado='disponible')
--   15 transacciones  (all estado='completada', varied dates for
--                      price trend calculation)
-- ============================================================


-- ─── Step 1: Seed auth.users ──────────────────────────────────
-- Required so that profiles(id) FK is satisfied.
-- Seed emails use @alpacash.test domain — never real credentials.

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
    (
        '00000000-0000-0000-0000-000000000000',
        'a1b2c3d4-0001-4001-a001-000000000001',
        'authenticated', 'authenticated',
        'seed-productor-1@alpacash.test',
        crypt('seed_alp4ca_s33d!', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        false, '', '', '', ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        'a1b2c3d4-0002-4002-a002-000000000002',
        'authenticated', 'authenticated',
        'seed-productor-2@alpacash.test',
        crypt('seed_alp4ca_s33d!', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        false, '', '', '', ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        'a1b2c3d4-0003-4003-a003-000000000003',
        'authenticated', 'authenticated',
        'seed-productor-3@alpacash.test',
        crypt('seed_alp4ca_s33d!', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        false, '', '', '', ''
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        'a1b2c3d4-0004-4004-a004-000000000004',
        'authenticated', 'authenticated',
        'seed-productor-4@alpacash.test',
        crypt('seed_alp4ca_s33d!', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        false, '', '', '', ''
    )
ON CONFLICT (id) DO NOTHING;


-- ─── Step 2: Seed profiles ────────────────────────────────────

INSERT INTO public.profiles (id, nombre, email, rol, estado)
VALUES
    (
        'a1b2c3d4-0001-4001-a001-000000000001',
        'María Quispe Mamani',
        'seed-productor-1@alpacash.test',
        'productor', 'activo'
    ),
    (
        'a1b2c3d4-0002-4002-a002-000000000002',
        'Carlos Flores Condori',
        'seed-productor-2@alpacash.test',
        'productor', 'activo'
    ),
    (
        'a1b2c3d4-0003-4003-a003-000000000003',
        'Rosa Huanca Layme',
        'seed-productor-3@alpacash.test',
        'productor', 'activo'
    ),
    (
        'a1b2c3d4-0004-4004-a004-000000000004',
        'Juan Mamani Coila',
        'seed-productor-4@alpacash.test',
        'productor', 'activo'
    )
ON CONFLICT (id) DO UPDATE
    SET estado = 'activo';


-- ─── Step 3: Seed productores ─────────────────────────────────

INSERT INTO public.productores (
    id, profile_id, codigo_productor, dni_ruc,
    nombre_asociacion, comunidad, provincia, region
)
VALUES
    (
        'b1b2c3d4-0001-4001-b001-000000000001',
        'a1b2c3d4-0001-4001-a001-000000000001',
        'AC-SEED-P001', '12345601',
        'Asociación Alpaquera Los Andes',
        'Comunidad Chupa', 'Azángaro', 'Puno'
    ),
    (
        'b1b2c3d4-0002-4002-b002-000000000002',
        'a1b2c3d4-0002-4002-a002-000000000002',
        'AC-SEED-P002', '12345602',
        'Cooperativa Alpaquera del Altiplano',
        'Comunidad Llalli', 'Melgar', 'Puno'
    ),
    (
        'b1b2c3d4-0003-4003-b003-000000000003',
        'a1b2c3d4-0003-4003-a003-000000000003',
        'AC-SEED-P003', '12345603',
        'Asociación Alpaquera San Juan de Macusani',
        'Comunidad Corani', 'Carabaya', 'Puno'
    ),
    (
        'b1b2c3d4-0004-4004-b004-000000000004',
        'a1b2c3d4-0004-4004-a004-000000000004',
        'AC-SEED-P004', '12345604',
        'Asociación de Criadores Alpaqueros Lampa Verde',
        'Comunidad Palca', 'Lampa', 'Puno'
    )
ON CONFLICT (profile_id) DO NOTHING;


-- ─── Step 4: Seed lotes_fibra ─────────────────────────────────
-- 6 lots: 4 primary cards (1 per category for variety) + 2 extras
-- for richer price history.  All estado='disponible' so they appear
-- in the marketplace_lotes_publicos view.

INSERT INTO public.lotes_fibra (
    id, productor_id, categoria_id, codigo_lote,
    peso_libras, precio_por_libra, color, estado,
    ubicacion_general, fecha_esquila
)
VALUES
    -- Lot 1: Baby Alpaca — primary card
    (
        'c1b2c3d4-0001-4001-c001-000000000001',
        'b1b2c3d4-0001-4001-b001-000000000001',
        (SELECT id FROM public.categorias_fibra WHERE nombre = 'Baby Alpaca'),
        'AC-SEED-L001',
        120.00, 28.50,
        'Blanco Natural', 'disponible',
        'Azángaro, Puno',
        '2025-08-15'
    ),
    -- Lot 2: Súper Baby — primary card
    (
        'c1b2c3d4-0002-4002-c002-000000000002',
        'b1b2c3d4-0002-4002-b002-000000000002',
        (SELECT id FROM public.categorias_fibra WHERE nombre = 'Súper Baby'),
        'AC-SEED-L002',
        85.00, 35.00,
        'Beige', 'disponible',
        'Melgar, Puno',
        '2025-09-02'
    ),
    -- Lot 3: Fleece — primary card
    (
        'c1b2c3d4-0003-4003-c003-000000000003',
        'b1b2c3d4-0003-4003-b003-000000000003',
        (SELECT id FROM public.categorias_fibra WHERE nombre = 'Fleece'),
        'AC-SEED-L003',
        200.00, 18.00,
        'Café', 'disponible',
        'Carabaya, Puno',
        '2025-07-28'
    ),
    -- Lot 4: Médium Fleece — primary card
    (
        'c1b2c3d4-0004-4004-c004-000000000004',
        'b1b2c3d4-0004-4004-b004-000000000004',
        (SELECT id FROM public.categorias_fibra WHERE nombre = 'Médium Fleece'),
        'AC-SEED-L004',
        150.00, 14.50,
        'Blanco', 'disponible',
        'Lampa, Puno',
        '2025-08-01'
    ),
    -- Lot 5: Baby Alpaca extra — supports price history depth
    (
        'c1b2c3d4-0005-4005-c005-000000000005',
        'b1b2c3d4-0001-4001-b001-000000000001',
        (SELECT id FROM public.categorias_fibra WHERE nombre = 'Baby Alpaca'),
        'AC-SEED-L005',
        95.00, 30.00,
        'Gris Plata', 'disponible',
        'Azángaro, Puno',
        '2025-10-10'
    ),
    -- Lot 6: Huarizo — completes price aggregation for all 5 categories
    (
        'c1b2c3d4-0006-4006-c006-000000000006',
        'b1b2c3d4-0002-4002-b002-000000000002',
        (SELECT id FROM public.categorias_fibra WHERE nombre = 'Huarizo'),
        'AC-SEED-L006',
        180.00, 10.00,
        'Marrón', 'disponible',
        'Melgar, Puno',
        '2025-07-15'
    )
ON CONFLICT (codigo_lote) DO NOTHING;


-- ─── Step 5: Seed transacciones ───────────────────────────────
-- 15 completed transactions across all 5 categories with varied
-- dates so the backend precios service can compute real trends.
--
-- Date buckets:
--   "recent"  = within 90 days  → trend numerator
--   "prior"   = 91–180 days ago → trend denominator
--   FLAT if a category has no prior data
--
-- Resulting trends:
--   Baby Alpaca   → UP   (recent avg 28.75 > prior avg 27.25)
--   Súper Baby    → UP   (recent avg 35.25 > prior avg 33.00)
--   Fleece        → DOWN (recent avg 17.75 < prior avg 19.00)
--   Médium Fleece → FLAT (no prior window data)
--   Huarizo       → DOWN (recent avg 10.25 < prior avg 11.00)

INSERT INTO public.transacciones (
    id, lote_id, precio_por_libra, estado, created_at
)
VALUES
    -- Baby Alpaca — prior window (100-140 days ago)
    (
        'd1b2c3d4-0001-4001-d001-000000000001',
        'c1b2c3d4-0001-4001-c001-000000000001',
        27.00, 'completada',
        now() - interval '130 days'
    ),
    (
        'd1b2c3d4-0002-4002-d002-000000000002',
        'c1b2c3d4-0005-4005-c005-000000000005',
        27.50, 'completada',
        now() - interval '110 days'
    ),
    -- Baby Alpaca — recent window (0-90 days ago)
    (
        'd1b2c3d4-0003-4003-d003-000000000003',
        'c1b2c3d4-0001-4001-c001-000000000001',
        28.50, 'completada',
        now() - interval '45 days'
    ),
    (
        'd1b2c3d4-0004-4004-d004-000000000004',
        'c1b2c3d4-0005-4005-c005-000000000005',
        29.00, 'completada',
        now() - interval '15 days'
    ),
    -- Súper Baby — prior window
    (
        'd1b2c3d4-0005-4005-d005-000000000005',
        'c1b2c3d4-0002-4002-c002-000000000002',
        33.00, 'completada',
        now() - interval '120 days'
    ),
    -- Súper Baby — recent window
    (
        'd1b2c3d4-0006-4006-d006-000000000006',
        'c1b2c3d4-0002-4002-c002-000000000002',
        35.00, 'completada',
        now() - interval '50 days'
    ),
    (
        'd1b2c3d4-0007-4007-d007-000000000007',
        'c1b2c3d4-0002-4002-c002-000000000002',
        35.50, 'completada',
        now() - interval '20 days'
    ),
    -- Fleece — prior window
    (
        'd1b2c3d4-0008-4008-d008-000000000008',
        'c1b2c3d4-0003-4003-c003-000000000003',
        19.00, 'completada',
        now() - interval '150 days'
    ),
    -- Fleece — recent window
    (
        'd1b2c3d4-0009-4009-d009-000000000009',
        'c1b2c3d4-0003-4003-c003-000000000003',
        18.00, 'completada',
        now() - interval '40 days'
    ),
    (
        'd1b2c3d4-0010-4010-d010-000000000010',
        'c1b2c3d4-0003-4003-c003-000000000003',
        17.50, 'completada',
        now() - interval '10 days'
    ),
    -- Médium Fleece — recent only (trend → FLAT)
    (
        'd1b2c3d4-0011-4011-d011-000000000011',
        'c1b2c3d4-0004-4004-c004-000000000004',
        14.50, 'completada',
        now() - interval '60 days'
    ),
    (
        'd1b2c3d4-0012-4012-d012-000000000012',
        'c1b2c3d4-0004-4004-c004-000000000004',
        14.75, 'completada',
        now() - interval '25 days'
    ),
    -- Huarizo — prior window
    (
        'd1b2c3d4-0013-4013-d013-000000000013',
        'c1b2c3d4-0006-4006-c006-000000000006',
        11.00, 'completada',
        now() - interval '140 days'
    ),
    -- Huarizo — recent window
    (
        'd1b2c3d4-0014-4014-d014-000000000014',
        'c1b2c3d4-0006-4006-c006-000000000006',
        10.00, 'completada',
        now() - interval '60 days'
    ),
    (
        'd1b2c3d4-0015-4015-d015-000000000015',
        'c1b2c3d4-0006-4006-c006-000000000006',
        10.50, 'completada',
        now() - interval '8 days'
    )
ON CONFLICT (id) DO NOTHING;


-- ─── Summary ──────────────────────────────────────────────────
-- After running this script:
--   SELECT count(*) FROM public.lotes_fibra WHERE estado = 'disponible';
--   -- Expected: ≥ 6 (4 primary + 2 extra)
--
--   SELECT count(*) FROM public.transacciones WHERE estado = 'completada';
--   -- Expected: ≥ 15
--
--   SELECT categoria, count(*), avg(precio_por_libra)
--   FROM public.transacciones t
--   JOIN public.lotes_fibra l ON l.id = t.lote_id
--   JOIN public.categorias_fibra c ON c.id = l.categoria_id
--   WHERE t.estado = 'completada'
--   GROUP BY categoria;
--   -- Expected: 5 rows, one per fiber category
-- ============================================================
