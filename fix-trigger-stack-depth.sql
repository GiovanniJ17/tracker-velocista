-- =================================================================
-- FIX: Risolve il loop infinito nel trigger check_and_mark_personal_best
-- Problema: UPDATE interno ri-triggera il BEFORE UPDATE, causando stack overflow
-- Soluzione: Usare session_replication_role per evitare il loop
-- =================================================================

-- Passaggio 1: Rimuovi il trigger vecchio
DROP TRIGGER IF EXISTS trigger_auto_mark_pb ON public.workout_sets;

-- Passaggio 2: Ricrea la funzione con protezione anti-loop
CREATE OR REPLACE FUNCTION public.check_and_mark_personal_best()
RETURNS TRIGGER AS $$
BEGIN
  -- Se siamo in modalità replica, non eseguire la logica
  -- (evita loop infinito durante gli UPDATE interni)
  IF session_replication_role = 'replica' THEN
    RETURN NEW;
  END IF;

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
       
       -- Disabilita i trigger durante l'UPDATE interno
       SET session_replication_role = 'replica';
       UPDATE public.workout_sets SET is_personal_best = false 
       WHERE distance_m = NEW.distance_m AND category = 'sprint' AND id != NEW.id;
       SET session_replication_role = 'origin';
    ELSE
      NEW.is_personal_best := false;
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
       
       -- Disabilita i trigger durante l'UPDATE interno
       SET session_replication_role = 'replica';
       UPDATE public.workout_sets SET is_personal_best = false 
       WHERE LOWER(exercise_name) = LOWER(NEW.exercise_name) AND category = 'lift' AND id != NEW.id;
       SET session_replication_role = 'origin';
    ELSE
      NEW.is_personal_best := false;
    END IF;
  END IF;

  -- Se non è sprint o lift, assicurati che is_personal_best sia false
  IF (NEW.category != 'sprint' AND NEW.category != 'lift') OR 
     (NEW.category = 'sprint' AND NEW.time_s <= 0) OR
     (NEW.category = 'lift' AND NEW.weight_kg <= 0) THEN
    NEW.is_personal_best := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Passaggio 3: Ricrea il trigger
CREATE TRIGGER trigger_auto_mark_pb
  BEFORE INSERT OR UPDATE ON public.workout_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_mark_personal_best();

-- Verificazione
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'workout_sets';
