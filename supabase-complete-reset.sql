-- =====================================================
-- SUPABASE COMPLETE RESET & REBUILD
-- =====================================================
-- This script completely resets the database to the
-- latest optimized schema with all improvements.
--
-- WARNING: This will DELETE ALL DATA. 
-- Make a backup first!
--
-- Steps:
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Data will be completely reset
-- 3. Tables will be recreated in correct order
-- 4. RLS policies will be enabled
-- 5. RPC functions and triggers will be added
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL EXISTING OBJECTS (triggers, functions, tables)
-- =====================================================

-- Drop triggers first (before dropping functions or tables)
DROP TRIGGER IF EXISTS training_sessions_after_insert ON public.training_sessions;
DROP TRIGGER IF EXISTS training_sessions_after_update ON public.training_sessions;
DROP TRIGGER IF EXISTS workout_sets_after_insert ON public.workout_sets;

-- Drop RPC functions
DROP FUNCTION IF EXISTS public.insert_full_training_session(date, text, text, text, integer, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.update_monthly_stats() CASCADE;

-- Drop tables in dependency order (children first, then parents)
DROP TABLE IF EXISTS public.workout_sets CASCADE;
DROP TABLE IF EXISTS public.workout_groups CASCADE;
DROP TABLE IF EXISTS public.race_records CASCADE;
DROP TABLE IF EXISTS public.strength_records CASCADE;
DROP TABLE IF EXISTS public.training_records CASCADE;
DROP TABLE IF EXISTS public.injury_history CASCADE;
DROP TABLE IF EXISTS public.monthly_stats CASCADE;
DROP TABLE IF EXISTS public.training_sessions CASCADE;
DROP TABLE IF EXISTS public.athlete_profile CASCADE;

-- =====================================================
-- STEP 2: CREATE TABLES (in dependency order)
-- =====================================================

-- 1. athlete_profile (no dependencies)
CREATE TABLE public.athlete_profile (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  birth_date date NOT NULL,
  current_weight_kg numeric NOT NULL,
  height_cm integer,
  sport_specialization text,
  profile_picture_url text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. training_sessions (parent table)
CREATE TABLE public.training_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text,
  type text CHECK (type = ANY (ARRAY['pista'::text, 'palestra'::text, 'strada'::text, 'gara'::text, 'test'::text, 'scarico'::text, 'recupero'::text, 'altro'::text])),
  location text,
  rpe integer CHECK (rpe >= 0 AND rpe <= 10),
  feeling text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. injury_history (depends on training_sessions)
CREATE TABLE public.injury_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  injury_type text NOT NULL,
  body_part text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  severity text NOT NULL CHECK (severity = ANY (ARRAY['minor'::text, 'moderate'::text, 'severe'::text])),
  cause_session_id uuid REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. monthly_stats (for aggregated statistics)
CREATE TABLE public.monthly_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  year_month date NOT NULL UNIQUE,
  total_distance_km numeric DEFAULT 0,
  total_time_h numeric DEFAULT 0,
  total_sets integer DEFAULT 0,
  avg_rpe numeric DEFAULT 0,
  sessions_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. workout_groups (depends on training_sessions)
CREATE TABLE public.workout_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  name text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. workout_sets (depends on workout_groups)
CREATE TABLE public.workout_sets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES public.workout_groups(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  category text CHECK (category = ANY (ARRAY['sprint'::text, 'jump'::text, 'lift'::text, 'endurance'::text, 'mobility'::text, 'drill'::text, 'other'::text])),
  sets integer DEFAULT 1,
  reps integer DEFAULT 1,
  weight_kg numeric,
  distance_m numeric,
  time_s numeric,
  recovery_s integer,
  details jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.athlete_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injury_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for public access
-- (suitable for single-user personal app)
-- For multi-user app, use: USING (auth.uid() = user_id)

CREATE POLICY "Allow all access to athlete_profile" ON public.athlete_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to training_sessions" ON public.training_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to injury_history" ON public.injury_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to monthly_stats" ON public.monthly_stats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to workout_groups" ON public.workout_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to workout_sets" ON public.workout_sets FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_training_sessions_date ON public.training_sessions(date DESC);
CREATE INDEX idx_training_sessions_type ON public.training_sessions(type);
CREATE INDEX idx_workout_groups_session ON public.workout_groups(session_id);
CREATE INDEX idx_workout_sets_group ON public.workout_sets(group_id);
CREATE INDEX idx_injury_history_session ON public.injury_history(cause_session_id);
CREATE INDEX idx_monthly_stats_year_month ON public.monthly_stats(year_month);

-- =====================================================
-- STEP 5: CREATE RPC FUNCTION FOR ATOMIC TRANSACTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION insert_full_training_session(
  p_date DATE,
  p_title TEXT,
  p_type TEXT,
  p_location TEXT,
  p_rpe INTEGER,
  p_feeling TEXT,
  p_notes TEXT,
  p_groups JSONB
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_group_data JSONB;
  v_group_id UUID;
  v_set_data JSONB;
BEGIN
  -- 1. Insert main session
  INSERT INTO public.training_sessions (date, title, type, location, rpe, feeling, notes)
  VALUES (p_date, p_title, p_type, p_location, p_rpe, p_feeling, p_notes)
  RETURNING id INTO v_session_id;

  -- 2. Loop through groups if present
  IF p_groups IS NOT NULL AND jsonb_array_length(p_groups) > 0 THEN
    FOR v_group_data IN SELECT * FROM jsonb_array_elements(p_groups)
    LOOP
      -- Insert group
      INSERT INTO public.workout_groups (session_id, order_index, name, notes)
      VALUES (
        v_session_id,
        (v_group_data->>'order_index')::INT,
        v_group_data->>'name',
        v_group_data->>'notes'
      )
      RETURNING id INTO v_group_id;

      -- 3. Loop through sets in this group
      IF v_group_data->'sets' IS NOT NULL AND jsonb_array_length(v_group_data->'sets') > 0 THEN
        FOR v_set_data IN SELECT * FROM jsonb_array_elements(v_group_data->'sets')
        LOOP
          INSERT INTO public.workout_sets (
            group_id, exercise_name, category, sets, reps,
            weight_kg, distance_m, time_s, recovery_s, details, notes
          )
          VALUES (
            v_group_id,
            v_set_data->>'exercise_name',
            v_set_data->>'category',
            (v_set_data->>'sets')::INT,
            (v_set_data->>'reps')::INT,
            (v_set_data->>'weight_kg')::NUMERIC,
            (v_set_data->>'distance_m')::NUMERIC,
            (v_set_data->>'time_s')::NUMERIC,
            (v_set_data->>'recovery_s')::INT,
            COALESCE(v_set_data->'details', '{}'::jsonb),
            v_set_data->>'notes'
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- Return the created session ID
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: CREATE FUNCTION TO UPDATE MONTHLY STATS
-- =====================================================

CREATE OR REPLACE FUNCTION update_monthly_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_year_month DATE;
  v_total_distance NUMERIC;
  v_total_time NUMERIC;
  v_total_sets INTEGER;
  v_avg_rpe NUMERIC;
  v_session_count INTEGER;
BEGIN
  -- Get the first day of the month for the session
  v_year_month := DATE_TRUNC('month', NEW.date)::DATE;

  -- Calculate aggregates for the month
  SELECT
    COALESCE(SUM(ws.distance_m), 0) / 1000.0,
    COALESCE(SUM(ws.time_s), 0) / 3600.0,
    COUNT(DISTINCT ws.id),
    ROUND(AVG(ts.rpe)::NUMERIC, 2),
    COUNT(DISTINCT ts.id)
  INTO v_total_distance, v_total_time, v_total_sets, v_avg_rpe, v_session_count
  FROM training_sessions ts
  LEFT JOIN workout_groups wg ON ts.id = wg.session_id
  LEFT JOIN workout_sets ws ON wg.id = ws.group_id
  WHERE DATE_TRUNC('month', ts.date) = v_year_month;

  -- Upsert into monthly_stats
  INSERT INTO public.monthly_stats (
    year_month, total_distance_km, total_time_h, total_sets, avg_rpe, sessions_count, updated_at
  )
  VALUES (
    v_year_month,
    v_total_distance,
    v_total_time,
    v_total_sets,
    v_avg_rpe,
    v_session_count,
    now()
  )
  ON CONFLICT (year_month) DO UPDATE SET
    total_distance_km = EXCLUDED.total_distance_km,
    total_time_h = EXCLUDED.total_time_h,
    total_sets = EXCLUDED.total_sets,
    avg_rpe = EXCLUDED.avg_rpe,
    sessions_count = EXCLUDED.sessions_count,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: CREATE TRIGGERS FOR AUTOMATIC STATS UPDATE
-- =====================================================

CREATE TRIGGER training_sessions_after_insert
  AFTER INSERT ON public.training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_stats();

CREATE TRIGGER training_sessions_after_update
  AFTER UPDATE ON public.training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_stats();

CREATE TRIGGER workout_sets_after_insert
  AFTER INSERT ON public.workout_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_stats();

-- =====================================================
-- STEP 8: SEED SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Create athlete profile
INSERT INTO public.athlete_profile (
  name, birth_date, current_weight_kg, height_cm, sport_specialization
)
VALUES (
  'Giovanni Velocista', '1995-06-15'::DATE, 72, 180, 'Sprinter 100-400m'
);

-- Create sample training sessions with groups and sets
DO $$
DECLARE
  session1_id UUID;
  session2_id UUID;
  group1_id UUID;
  group2_id UUID;
  group3_id UUID;
BEGIN
  -- Session 1: Track speed work
  INSERT INTO training_sessions (date, title, type, rpe, feeling, notes)
  VALUES (CURRENT_DATE - INTERVAL '2 days', 'Allenamento velocità', 'pista', 9, 'Ottime sensazioni, gambe reattive', 'Sessione intensa ma produttiva')
  RETURNING id INTO session1_id;

  INSERT INTO workout_groups (session_id, order_index, name)
  VALUES (session1_id, 0, 'Riscaldamento')
  RETURNING id INTO group1_id;

  INSERT INTO workout_sets (group_id, exercise_name, category, distance_m, notes)
  VALUES
    (group1_id, 'Corsa leggera', 'endurance', 2000, 'Ritmo tranquillo'),
    (group1_id, 'Drill tecnica', 'drill', NULL, '10 minuti vari drill');

  INSERT INTO workout_groups (session_id, order_index, name)
  VALUES (session1_id, 1, 'Lavoro principale')
  RETURNING id INTO group2_id;

  INSERT INTO workout_sets (group_id, exercise_name, category, sets, distance_m, time_s, recovery_s)
  VALUES (group2_id, 'Sprint 200m', 'sprint', 6, 200, 25.5, 180);

  -- Session 2: Gym strength work
  INSERT INTO training_sessions (date, title, type, rpe, feeling, notes)
  VALUES (CURRENT_DATE - INTERVAL '1 day', 'Forza gambe', 'palestra', 7, 'Buona sessione', 'Focus su forza massimale')
  RETURNING id INTO session2_id;

  INSERT INTO workout_groups (session_id, order_index, name)
  VALUES (session2_id, 0, 'Esercizi principali')
  RETURNING id INTO group3_id;

  INSERT INTO workout_sets (group_id, exercise_name, category, sets, reps, weight_kg, recovery_s)
  VALUES
    (group3_id, 'Squat', 'lift', 4, 6, 90, 180),
    (group3_id, 'Stacco rumeno', 'lift', 3, 8, 80, 120),
    (group3_id, 'Affondi bulgari', 'lift', 3, 10, 30, 90);

END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show all tables created
SELECT
  tablename
FROM pg_catalog.pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show training sessions structure
SELECT
  ts.date,
  ts.title,
  ts.type,
  ts.rpe,
  COUNT(DISTINCT wg.id) AS num_groups,
  COUNT(DISTINCT ws.id) AS num_exercises
FROM training_sessions ts
LEFT JOIN workout_groups wg ON ts.id = wg.session_id
LEFT JOIN workout_sets ws ON wg.id = ws.group_id
GROUP BY ts.id, ts.date, ts.title, ts.type, ts.rpe
ORDER BY ts.date DESC;

-- Show monthly statistics
SELECT
  year_month,
  total_distance_km,
  ROUND(total_time_h::NUMERIC, 2) AS total_hours,
  total_sets,
  ROUND(avg_rpe::NUMERIC, 1) AS avg_rpe,
  sessions_count
FROM monthly_stats
ORDER BY year_month DESC;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Database reset complete!
-- 
-- Created tables:
-- - athlete_profile (athlete info)
-- - training_sessions (main sessions)
-- - workout_groups (exercise groups)
-- - workout_sets (individual exercises)
-- - injury_history (injury tracking)
-- - monthly_stats (aggregated stats)
--
-- RPC Functions:
-- - insert_full_training_session() for atomic inserts
-- - update_monthly_stats() trigger for auto-updates
--
-- RLS: Enabled on all tables (permissive policies)
-- Indexes: Created on all foreign keys and common filters
-- Sample Data: Loaded with 2 training sessions
--
-- Next steps:
-- 1. Verify data in your app
-- 2. Test insert_full_training_session RPC
-- 3. Monitor monthly_stats auto-update via triggers
-- =====================================================
