-- =================================================================
-- 🚀 TRACKER VELOCISTA: MASTER SCRIPT (RESET + BUILD + SEED)
-- =================================================================

-- 1. PULIZIA INTELLIGENTE (Smart Reset)
-- Gestisce automaticamente conflitti tra Tabelle e Viste
SET session_replication_role = 'replica';

DO $$ 
DECLARE
    obj_type char;
    name_target text;
    objects_list text[] := ARRAY['race_records', 'strength_records', 'training_records'];
BEGIN 
    -- Rimuove oggetti ambigui (Record)
    FOREACH name_target IN ARRAY objects_list
    LOOP
        SELECT relkind INTO obj_type FROM pg_class 
        WHERE relname = name_target AND relnamespace = 'public'::regnamespace;

        IF obj_type = 'r' THEN
            EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', name_target);
        ELSIF obj_type = 'v' THEN
            EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', name_target);
        END IF;
    END LOOP;
END $$;

-- Rimuove il resto (ordine sicuro con CASCADE)
DROP VIEW IF EXISTS public.view_race_records CASCADE;
DROP VIEW IF EXISTS public.view_strength_records CASCADE;
DROP VIEW IF EXISTS public.view_training_records CASCADE;
DROP TABLE IF EXISTS public.injury_history CASCADE;
DROP TABLE IF EXISTS public.workout_sets CASCADE;
DROP TABLE IF EXISTS public.workout_groups CASCADE;
DROP TABLE IF EXISTS public.training_sessions CASCADE;
DROP TABLE IF EXISTS public.monthly_stats CASCADE;
DROP TABLE IF EXISTS public.athlete_profile CASCADE;
DROP TRIGGER IF EXISTS trigger_auto_mark_pb ON public.workout_sets;
DROP FUNCTION IF EXISTS public.check_and_mark_personal_best();

SET session_replication_role = 'origin';


-- 2. CREAZIONE STRUTTURA DATI (Core Tables)
-- =================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabella Profilo Atleta
CREATE TABLE public.athlete_profile (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  birth_date date,
  current_weight_kg numeric,
  height_cm integer,
  sport_specialization text, -- Aggiunto per completezza
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabella Sessioni
CREATE TABLE public.training_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text,
  type text CHECK (type = ANY (ARRAY['pista', 'palestra', 'strada', 'gara', 'test', 'scarico', 'recupero', 'altro'])),
  location text,
  rpe integer CHECK (rpe >= 0 AND rpe <= 10),
  feeling text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabella Gruppi (Riscaldamento, Lavoro, ecc.)
CREATE TABLE public.workout_groups (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  order_index integer DEFAULT 0,
  name text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabella Sets (Il cuore dei dati)
CREATE TABLE public.workout_sets (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.workout_groups(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  category text CHECK (category = ANY (ARRAY['sprint', 'jump', 'lift', 'endurance', 'mobility', 'drill', 'other'])),
  sets integer DEFAULT 1,
  reps integer DEFAULT 1,
  weight_kg numeric,
  distance_m numeric,
  time_s numeric,
  recovery_s integer,
  details jsonb DEFAULT '{}'::jsonb,
  
  -- Colonne Intelligenti (Fondamentali per Logic & AI)
  is_personal_best BOOLEAN DEFAULT false,
  is_race BOOLEAN DEFAULT false,
  is_test BOOLEAN DEFAULT false,
  
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabella Infortuni
CREATE TABLE public.injury_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  injury_type text NOT NULL,
  body_part text,
  start_date date NOT NULL,
  end_date date,
  severity text,
  cause_session_id uuid REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);


-- 3. CREAZIONE VISTE (Compatibilità Frontend)
-- =================================================================

-- Record Gare
CREATE OR REPLACE VIEW public.race_records AS
SELECT 
  ws.id, ts.id as session_id, ts.date,
  ws.distance_m, ws.time_s, ts.location, ts.title as competition_name,
  ws.notes, ws.is_personal_best, ws.created_at
FROM public.workout_sets ws
JOIN public.workout_groups wg ON ws.group_id = wg.id
JOIN public.training_sessions ts ON wg.session_id = ts.id
WHERE ws.category = 'sprint' AND (ws.is_race = true OR ts.type = 'gara');

-- Massimali Palestra
CREATE OR REPLACE VIEW public.strength_records AS
SELECT 
  ws.id, ts.id as session_id, ts.date, ws.exercise_name,
  CASE 
    WHEN LOWER(ws.exercise_name) LIKE '%squat%' THEN 'squat'
    WHEN LOWER(ws.exercise_name) LIKE '%bench%' THEN 'bench'
    WHEN LOWER(ws.exercise_name) LIKE '%deadlift%' THEN 'deadlift'
    WHEN LOWER(ws.exercise_name) LIKE '%clean%' THEN 'clean'
    ELSE 'other'
  END as category,
  ws.weight_kg, ws.reps, ws.notes, ws.is_personal_best, ws.created_at
FROM public.workout_sets ws
JOIN public.workout_groups wg ON ws.group_id = wg.id
JOIN public.training_sessions ts ON wg.session_id = ts.id
WHERE ws.category = 'lift' AND ws.is_personal_best = true;

-- PB Allenamento
CREATE OR REPLACE VIEW public.training_records AS
SELECT 
  ws.id, ts.id as session_id, ts.date, ws.exercise_name, ws.category as exercise_type,
  COALESCE(ws.time_s, ws.distance_m, ws.weight_kg) as performance_value,
  CASE 
    WHEN ws.time_s IS NOT NULL THEN 'seconds'
    WHEN ws.distance_m IS NOT NULL AND ws.category = 'endurance' THEN 'meters'
    ELSE 'kg'
  END as performance_unit,
  ts.rpe, ws.notes, ws.is_personal_best, ws.created_at
FROM public.workout_sets ws
JOIN public.workout_groups wg ON ws.group_id = wg.id
JOIN public.training_sessions ts ON wg.session_id = ts.id
WHERE ws.is_personal_best = true AND ws.is_race = false;


-- 4. AUTOMAZIONE (Trigger PB)
-- =================================================================

CREATE OR REPLACE FUNCTION public.check_and_mark_personal_best()
RETURNS TRIGGER AS $$
BEGIN
  -- Logica SPRINT
  IF NEW.category = 'sprint' AND NEW.time_s > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.workout_sets ws
      JOIN public.workout_groups wg ON ws.group_id = wg.id
      WHERE ws.category = 'sprint' 
      AND ws.distance_m = NEW.distance_m 
      AND ws.time_s < NEW.time_s
      AND ws.id != NEW.id
    ) THEN
       NEW.is_personal_best := true;
       UPDATE public.workout_sets SET is_personal_best = false 
       WHERE distance_m = NEW.distance_m AND category = 'sprint' AND id != NEW.id;
    END IF;
  END IF;

  -- Logica FORZA
  IF NEW.category = 'lift' AND NEW.weight_kg > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.workout_sets ws
      WHERE ws.category = 'lift'
      AND LOWER(ws.exercise_name) = LOWER(NEW.exercise_name)
      AND ws.weight_kg > NEW.weight_kg
      AND ws.id != NEW.id
    ) THEN
       NEW.is_personal_best := true;
       UPDATE public.workout_sets SET is_personal_best = false 
       WHERE LOWER(exercise_name) = LOWER(NEW.exercise_name) AND category = 'lift' AND id != NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_mark_pb
  BEFORE INSERT OR UPDATE ON public.workout_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_mark_personal_best();


-- 5. SICUREZZA (Row Level Security)
-- =================================================================
ALTER TABLE public.athlete_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

-- Policy Aperta per Sviluppo (Da restringere in produzione con auth.uid())
CREATE POLICY "Public Access" ON public.athlete_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.training_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.workout_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON public.workout_sets FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;


-- 6. POPOLAZIONE DATI (Seed Giovanni)
-- =================================================================

INSERT INTO public.athlete_profile (
    name, 
    birth_date, 
    current_weight_kg, 
    height_cm, 
    sport_specialization, 
    bio
)
VALUES (
    'Giovanni', 
    '2005-12-17',  -- Data formattata ISO
    65.0, 
    173, 
    'Velocità',
    'Atleta velocista specializzato.'
);

-- Verifica inserimento
SELECT * FROM public.athlete_profile;