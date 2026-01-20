-- =====================================================
-- TRAINING LOG - DATABASE RESET & CLEANUP
-- Pulizia completa e reinserimento struttura
-- =====================================================

-- ⚠️ ATTENZIONE: Questo script CANCELLA TUTTI I DATI!
-- Eseguire solo se si vuole ripartire da zero

-- =====================================================
-- FASE 1: DISABILITA RLS (per permettere la cancellazione)
-- =====================================================
ALTER TABLE IF EXISTS public.athlete_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.race_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.strength_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.training_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.injury_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.monthly_stats DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- FASE 2: DROP TABELLE (ordine corretto per foreign keys)
-- =====================================================

-- Prima le tabelle dipendenti
DROP TABLE IF EXISTS public.workout_sets CASCADE;
DROP TABLE IF EXISTS public.workout_groups CASCADE;
DROP TABLE IF EXISTS public.race_records CASCADE;
DROP TABLE IF EXISTS public.strength_records CASCADE;
DROP TABLE IF EXISTS public.training_records CASCADE;
DROP TABLE IF EXISTS public.injury_history CASCADE;
DROP TABLE IF EXISTS public.monthly_stats CASCADE;

-- Poi la tabella principale
DROP TABLE IF EXISTS public.training_sessions CASCADE;

-- Infine il profilo
DROP TABLE IF EXISTS public.athlete_profile CASCADE;

-- =====================================================
-- FASE 3: RICREA STRUTTURA COMPLETA
-- Esegui db-schema.sql
-- =====================================================

-- Abilita estensione UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABELLA: athlete_profile
CREATE TABLE IF NOT EXISTS public.athlete_profile (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  birth_date date NOT NULL,
  current_weight_kg numeric NOT NULL,
  height_cm integer,
  sport_specialization text,
  profile_picture_url text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT athlete_profile_pkey PRIMARY KEY (id)
);

-- TABELLA: training_sessions
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text,
  type text CHECK (type = ANY (ARRAY[
    'pista'::text, 
    'palestra'::text, 
    'strada'::text, 
    'gara'::text, 
    'test'::text, 
    'scarico'::text, 
    'recupero'::text, 
    'altro'::text
  ])),
  location text,
  rpe integer CHECK (rpe >= 0 AND rpe <= 10),
  feeling text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT training_sessions_pkey PRIMARY KEY (id)
);

-- TABELLA: workout_groups
CREATE TABLE IF NOT EXISTS public.workout_groups (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  order_index integer DEFAULT 0,
  name text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_groups_pkey PRIMARY KEY (id),
  CONSTRAINT workout_groups_session_id_fkey 
    FOREIGN KEY (session_id) 
    REFERENCES public.training_sessions(id)
    ON DELETE CASCADE
);

-- TABELLA: workout_sets
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL,
  exercise_name text NOT NULL,
  category text CHECK (category = ANY (ARRAY[
    'sprint'::text, 
    'jump'::text, 
    'lift'::text, 
    'endurance'::text, 
    'mobility'::text, 
    'drill'::text, 
    'other'::text
  ])),
  sets integer DEFAULT 1,
  reps integer DEFAULT 1,
  weight_kg numeric,
  distance_m numeric,
  time_s numeric,
  recovery_s integer,
  details jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_sets_pkey PRIMARY KEY (id),
  CONSTRAINT workout_sets_group_id_fkey 
    FOREIGN KEY (group_id) 
    REFERENCES public.workout_groups(id)
    ON DELETE CASCADE
);

-- TABELLA: race_records
CREATE TABLE IF NOT EXISTS public.race_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  distance_m integer NOT NULL CHECK (distance_m > 0),
  time_s numeric NOT NULL CHECK (time_s > 0::numeric),
  rpe integer CHECK (rpe >= 0 AND rpe <= 10),
  location text,
  competition_name text,
  notes text,
  is_personal_best boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT race_records_pkey PRIMARY KEY (id),
  CONSTRAINT race_records_session_id_fkey 
    FOREIGN KEY (session_id) 
    REFERENCES public.training_sessions(id)
    ON DELETE CASCADE
);

-- TABELLA: strength_records
CREATE TABLE IF NOT EXISTS public.strength_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  exercise_name text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY[
    'squat'::text, 
    'bench'::text, 
    'deadlift'::text, 
    'clean'::text, 
    'jerk'::text, 
    'press'::text, 
    'pull'::text, 
    'other'::text
  ])),
  weight_kg numeric NOT NULL CHECK (weight_kg > 0::numeric),
  reps integer NOT NULL DEFAULT 1,
  notes text,
  is_personal_best boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT strength_records_pkey PRIMARY KEY (id),
  CONSTRAINT strength_records_session_id_fkey 
    FOREIGN KEY (session_id) 
    REFERENCES public.training_sessions(id)
    ON DELETE CASCADE
);

-- TABELLA: training_records
CREATE TABLE IF NOT EXISTS public.training_records (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  exercise_name text NOT NULL,
  exercise_type text NOT NULL CHECK (exercise_type = ANY (ARRAY[
    'sprint'::text, 
    'jump'::text, 
    'throw'::text, 
    'endurance'::text
  ])),
  performance_value numeric NOT NULL,
  performance_unit text NOT NULL CHECK (performance_unit = ANY (ARRAY[
    'seconds'::text, 
    'meters'::text, 
    'reps'::text, 
    'kg'::text
  ])),
  rpe integer CHECK (rpe >= 0 AND rpe <= 10),
  notes text,
  is_personal_best boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT training_records_pkey PRIMARY KEY (id),
  CONSTRAINT training_records_session_id_fkey 
    FOREIGN KEY (session_id) 
    REFERENCES public.training_sessions(id)
    ON DELETE CASCADE
);

-- TABELLA: injury_history
CREATE TABLE IF NOT EXISTS public.injury_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  injury_type text NOT NULL,
  body_part text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  severity text NOT NULL CHECK (severity = ANY (ARRAY[
    'minor'::text, 
    'moderate'::text, 
    'severe'::text
  ])),
  cause_session_id uuid,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT injury_history_pkey PRIMARY KEY (id),
  CONSTRAINT injury_history_cause_session_id_fkey 
    FOREIGN KEY (cause_session_id) 
    REFERENCES public.training_sessions(id)
    ON DELETE SET NULL
);

-- TABELLA: monthly_stats
CREATE TABLE IF NOT EXISTS public.monthly_stats (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  year_month date NOT NULL UNIQUE,
  total_distance_km numeric DEFAULT 0,
  total_time_h numeric DEFAULT 0,
  total_sets integer DEFAULT 0,
  avg_rpe numeric DEFAULT 0,
  sessions_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monthly_stats_pkey PRIMARY KEY (id)
);

-- =====================================================
-- FASE 4: APPLICA OTTIMIZZAZIONI
-- Esegui db-optimize.sql
-- =====================================================

-- Indici di performance
CREATE INDEX IF NOT EXISTS idx_race_records_session ON public.race_records(session_id);
CREATE INDEX IF NOT EXISTS idx_strength_records_session ON public.strength_records(session_id);
CREATE INDEX IF NOT EXISTS idx_training_records_session ON public.training_records(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_groups_session ON public.workout_groups(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_group ON public.workout_sets(group_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON public.training_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_injury_history_start_date ON public.injury_history(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date_type ON public.training_sessions(date DESC, type);
CREATE INDEX IF NOT EXISTS idx_training_sessions_type ON public.training_sessions(type);
CREATE INDEX IF NOT EXISTS idx_workout_sets_category ON public.workout_sets(category);
CREATE INDEX IF NOT EXISTS idx_race_records_pb ON public.race_records(is_personal_best) WHERE is_personal_best = true;
CREATE INDEX IF NOT EXISTS idx_strength_records_pb ON public.strength_records(is_personal_best) WHERE is_personal_best = true;
CREATE INDEX IF NOT EXISTS idx_training_records_pb ON public.training_records(is_personal_best) WHERE is_personal_best = true;

-- RLS abilitato
ALTER TABLE public.athlete_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injury_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_stats ENABLE ROW LEVEL SECURITY;

-- Policy permissive
CREATE POLICY "Enable all access for athlete_profile" ON public.athlete_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for training_sessions" ON public.training_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for workout_groups" ON public.workout_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for workout_sets" ON public.workout_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for race_records" ON public.race_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for strength_records" ON public.strength_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for training_records" ON public.training_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for injury_history" ON public.injury_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for monthly_stats" ON public.monthly_stats FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- COMPLETATO
-- =====================================================
SELECT 'Database reset completato con successo!' as status;
