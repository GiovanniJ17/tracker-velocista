-- =====================================================
-- SUPABASE CLEANUP ONLY (Keep Schema)
-- =====================================================
-- This script deletes all data but keeps the schema intact.
-- Use this if you only want to clear old data without
-- recreating the database structure.
--
-- WARNING: This will DELETE ALL DATA.
-- Make a backup first!
-- =====================================================

-- Delete all data (triggers cascade)
DELETE FROM public.monthly_stats;
DELETE FROM public.injury_history;
DELETE FROM public.workout_sets;
DELETE FROM public.workout_groups;
DELETE FROM public.training_sessions;
DELETE FROM public.athlete_profile;

-- Reset sequences
ALTER SEQUENCE IF EXISTS public.athlete_profile_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.training_sessions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.workout_groups_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.workout_sets_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.injury_history_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.monthly_stats_id_seq RESTART WITH 1;

-- Verification
SELECT 'Cleanup Complete!' AS status,
       (SELECT COUNT(*) FROM public.training_sessions) AS sessions_count,
       (SELECT COUNT(*) FROM public.workout_groups) AS groups_count,
       (SELECT COUNT(*) FROM public.workout_sets) AS sets_count,
       (SELECT COUNT(*) FROM public.monthly_stats) AS stats_count;

-- =====================================================
-- Optional: Re-seed sample data
-- Uncomment the block below if you want fresh sample data
-- =====================================================

/*
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
  VALUES (CURRENT_DATE - INTERVAL '2 days', 'Allenamento velocità', 'pista', 9, 'Ottime sensazioni', 'Sessione intensa')
  RETURNING id INTO session1_id;

  INSERT INTO workout_groups (session_id, order_index, name)
  VALUES (session1_id, 0, 'Riscaldamento')
  RETURNING id INTO group1_id;

  INSERT INTO workout_sets (group_id, exercise_name, category, distance_m)
  VALUES (group1_id, 'Corsa leggera', 'endurance', 2000);

  INSERT INTO workout_groups (session_id, order_index, name)
  VALUES (session1_id, 1, 'Lavoro principale')
  RETURNING id INTO group2_id;

  INSERT INTO workout_sets (group_id, exercise_name, category, sets, distance_m, time_s, recovery_s)
  VALUES (group2_id, 'Sprint 200m', 'sprint', 6, 200, 25.5, 180);

  -- Session 2: Gym strength
  INSERT INTO training_sessions (date, title, type, rpe, feeling)
  VALUES (CURRENT_DATE - INTERVAL '1 day', 'Forza gambe', 'palestra', 7, 'Buona sessione')
  RETURNING id INTO session2_id;

  INSERT INTO workout_groups (session_id, order_index, name)
  VALUES (session2_id, 0, 'Esercizi principali')
  RETURNING id INTO group3_id;

  INSERT INTO workout_sets (group_id, exercise_name, category, sets, reps, weight_kg, recovery_s)
  VALUES
    (group3_id, 'Squat', 'lift', 4, 6, 90, 180),
    (group3_id, 'Stacco rumeno', 'lift', 3, 8, 80, 120);

END $$;
*/
