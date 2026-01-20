-- =====================================================
-- TRAINING LOG - DATABASE OPTIMIZATION
-- Query di ottimizzazione per performance e sicurezza
-- =====================================================

-- =====================================================
-- PARTE 1: CASCADING DELETES
-- Permette la cancellazione automatica dei record collegati
-- =====================================================

-- Aggiorna i vincoli per permettere la cancellazione automatica
ALTER TABLE public.race_records
DROP CONSTRAINT IF EXISTS race_records_session_id_fkey,
ADD CONSTRAINT race_records_session_id_fkey
    FOREIGN KEY (session_id) 
    REFERENCES public.training_sessions(id)
    ON DELETE CASCADE;

ALTER TABLE public.strength_records
DROP CONSTRAINT IF EXISTS strength_records_session_id_fkey,
ADD CONSTRAINT strength_records_session_id_fkey
    FOREIGN KEY (session_id) 
    REFERENCES public.training_sessions(id)
    ON DELETE CASCADE;

ALTER TABLE public.training_records
DROP CONSTRAINT IF EXISTS training_records_session_id_fkey,
ADD CONSTRAINT training_records_session_id_fkey
    FOREIGN KEY (session_id) 
    REFERENCES public.training_sessions(id)
    ON DELETE CASCADE;

ALTER TABLE public.workout_groups
DROP CONSTRAINT IF EXISTS workout_groups_session_id_fkey,
ADD CONSTRAINT workout_groups_session_id_fkey
    FOREIGN KEY (session_id) 
    REFERENCES public.training_sessions(id)
    ON DELETE CASCADE;

ALTER TABLE public.workout_sets
DROP CONSTRAINT IF EXISTS workout_sets_group_id_fkey,
ADD CONSTRAINT workout_sets_group_id_fkey
    FOREIGN KEY (group_id) 
    REFERENCES public.workout_groups(id)
    ON DELETE CASCADE;

-- Per gli infortuni: non cancellare l'infortunio, ma scollega la sessione
ALTER TABLE public.injury_history
DROP CONSTRAINT IF EXISTS injury_history_cause_session_id_fkey,
ADD CONSTRAINT injury_history_cause_session_id_fkey
    FOREIGN KEY (cause_session_id) 
    REFERENCES public.training_sessions(id)
    ON DELETE SET NULL;

-- =====================================================
-- PARTE 2: INDICI DI PERFORMANCE
-- Velocizzano le query più comuni
-- =====================================================

-- Indici per foreign keys (join veloci)
CREATE INDEX IF NOT EXISTS idx_race_records_session 
  ON public.race_records(session_id);

CREATE INDEX IF NOT EXISTS idx_strength_records_session 
  ON public.strength_records(session_id);

CREATE INDEX IF NOT EXISTS idx_training_records_session 
  ON public.training_records(session_id);

CREATE INDEX IF NOT EXISTS idx_workout_groups_session 
  ON public.workout_groups(session_id);

CREATE INDEX IF NOT EXISTS idx_workout_sets_group 
  ON public.workout_sets(group_id);

-- Indici per ricerche per data
CREATE INDEX IF NOT EXISTS idx_training_sessions_date 
  ON public.training_sessions(date DESC);

CREATE INDEX IF NOT EXISTS idx_injury_history_start_date 
  ON public.injury_history(start_date DESC);

-- Indice composito per query statistiche comuni (data + tipo)
CREATE INDEX IF NOT EXISTS idx_training_sessions_date_type 
  ON public.training_sessions(date DESC, type);

-- Indice per ricerche per tipo di sessione
CREATE INDEX IF NOT EXISTS idx_training_sessions_type 
  ON public.training_sessions(type);

-- Indice per categoria esercizi
CREATE INDEX IF NOT EXISTS idx_workout_sets_category 
  ON public.workout_sets(category);

-- Indice per Personal Best
CREATE INDEX IF NOT EXISTS idx_race_records_pb 
  ON public.race_records(is_personal_best) 
  WHERE is_personal_best = true;

CREATE INDEX IF NOT EXISTS idx_strength_records_pb 
  ON public.strength_records(is_personal_best) 
  WHERE is_personal_best = true;

CREATE INDEX IF NOT EXISTS idx_training_records_pb 
  ON public.training_records(is_personal_best) 
  WHERE is_personal_best = true;

-- =====================================================
-- PARTE 3: ROW LEVEL SECURITY (RLS)
-- Protezione base per uso personale
-- =====================================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.athlete_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injury_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_stats ENABLE ROW LEVEL SECURITY;

-- Policy permissive per uso personale (modifica se multi-utente)
-- IMPORTANTE: In un ambiente multi-utente, dovrai aggiungere filtri su user_id

-- Athlete Profile (singolo utente)
DROP POLICY IF EXISTS "Enable all access for athlete_profile" ON public.athlete_profile;
CREATE POLICY "Enable all access for athlete_profile" 
  ON public.athlete_profile 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Training Sessions
DROP POLICY IF EXISTS "Enable all access for training_sessions" ON public.training_sessions;
CREATE POLICY "Enable all access for training_sessions" 
  ON public.training_sessions 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Workout Groups
DROP POLICY IF EXISTS "Enable all access for workout_groups" ON public.workout_groups;
CREATE POLICY "Enable all access for workout_groups" 
  ON public.workout_groups 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Workout Sets
DROP POLICY IF EXISTS "Enable all access for workout_sets" ON public.workout_sets;
CREATE POLICY "Enable all access for workout_sets" 
  ON public.workout_sets 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Race Records
DROP POLICY IF EXISTS "Enable all access for race_records" ON public.race_records;
CREATE POLICY "Enable all access for race_records" 
  ON public.race_records 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Strength Records
DROP POLICY IF EXISTS "Enable all access for strength_records" ON public.strength_records;
CREATE POLICY "Enable all access for strength_records" 
  ON public.strength_records 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Training Records
DROP POLICY IF EXISTS "Enable all access for training_records" ON public.training_records;
CREATE POLICY "Enable all access for training_records" 
  ON public.training_records 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Injury History
DROP POLICY IF EXISTS "Enable all access for injury_history" ON public.injury_history;
CREATE POLICY "Enable all access for injury_history" 
  ON public.injury_history 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Monthly Stats
DROP POLICY IF EXISTS "Enable all access for monthly_stats" ON public.monthly_stats;
CREATE POLICY "Enable all access for monthly_stats" 
  ON public.monthly_stats 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- =====================================================
-- VERIFICA FINALE
-- Query per verificare che tutto sia stato applicato
-- =====================================================

-- Verifica indici creati
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verifica policy RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
