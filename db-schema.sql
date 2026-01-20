-- =====================================================
-- TRAINING LOG - DATABASE SCHEMA
-- Schema completo per il sistema di tracking allenamenti
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELLA: athlete_profile
-- Profilo dell'atleta (singolo utente)
-- =====================================================
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

-- =====================================================
-- TABELLA: training_sessions
-- Sessioni di allenamento (centro del sistema)
-- =====================================================
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

-- =====================================================
-- TABELLA: workout_groups
-- Gruppi di esercizi dentro una sessione (es: Riscaldamento, Lavoro Principale)
-- =====================================================
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

-- =====================================================
-- TABELLA: workout_sets
-- Set/esercizi individuali dentro un gruppo
-- =====================================================
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

-- =====================================================
-- TABELLA: race_records
-- Record di gara (tempi ufficiali)
-- =====================================================
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

-- =====================================================
-- TABELLA: strength_records
-- Record di forza/palestra (massimali, PR)
-- =====================================================
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

-- =====================================================
-- TABELLA: training_records
-- Record di allenamento (PB in allenamento, non gare)
-- =====================================================
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

-- =====================================================
-- TABELLA: injury_history
-- Storico infortuni
-- =====================================================
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

-- =====================================================
-- TABELLA: monthly_stats
-- Statistiche mensili aggregate
-- =====================================================
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
-- COMMENTI UTILI
-- =====================================================
COMMENT ON TABLE public.training_sessions IS 'Sessioni di allenamento - centro del sistema';
COMMENT ON TABLE public.workout_groups IS 'Gruppi di esercizi dentro una sessione (Riscaldamento, Lavoro, etc.)';
COMMENT ON TABLE public.workout_sets IS 'Esercizi individuali dentro un gruppo';
COMMENT ON TABLE public.race_records IS 'Record ufficiali di gara';
COMMENT ON TABLE public.strength_records IS 'Personal Best di forza/palestra';
COMMENT ON TABLE public.training_records IS 'Personal Best in allenamento (non gare)';
