-- ===================================================================
-- FIX: Stack Depth Error nel Trigger check_and_mark_personal_best
-- ===================================================================
-- Problema: Il trigger fa query ricorsive che causano stack overflow
-- con inserimenti batch di workout_sets
--
-- Soluzione: Ottimizzare il trigger per usare query più semplici
-- ===================================================================

-- OPZIONE 1: Disabilita temporaneamente il trigger
-- (Veloce ma perdi auto-detection PB)
-- ALTER TABLE public.workout_sets DISABLE TRIGGER trigger_auto_mark_pb;

-- OPZIONE 2: Sostituisci con versione ottimizzata (CONSIGLIATO)

DROP TRIGGER IF EXISTS trigger_auto_mark_pb ON public.workout_sets;

CREATE OR REPLACE FUNCTION public.check_and_mark_personal_best()
RETURNS TRIGGER AS $$
DECLARE
  v_is_pb BOOLEAN := false;
BEGIN
  -- Logica SPRINT (ottimizzata - single query)
  IF NEW.category = 'sprint' AND NEW.time_s IS NOT NULL AND NEW.time_s > 0 THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM public.workout_sets
      WHERE category = 'sprint' 
        AND distance_m = NEW.distance_m 
        AND time_s < NEW.time_s
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      LIMIT 1
    ) INTO v_is_pb;
    
    IF v_is_pb THEN
      NEW.is_personal_best := true;
    END IF;
  END IF;

  -- Logica FORZA (ottimizzata - single query)
  IF NEW.category = 'lift' AND NEW.weight_kg IS NOT NULL AND NEW.weight_kg > 0 THEN
    SELECT NOT EXISTS (
      SELECT 1 FROM public.workout_sets
      WHERE category = 'lift'
        AND LOWER(exercise_name) = LOWER(NEW.exercise_name)
        AND weight_kg > NEW.weight_kg
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      LIMIT 1
    ) INTO v_is_pb;
    
    IF v_is_pb THEN
      NEW.is_personal_best := true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ricrea il trigger con la funzione ottimizzata
CREATE TRIGGER trigger_auto_mark_pb
  BEFORE INSERT OR UPDATE ON public.workout_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_mark_personal_best();

-- ===================================================================
-- ISTRUZIONI:
-- 1. Vai su Supabase Dashboard → SQL Editor
-- 2. Copia e incolla questo codice
-- 3. Esegui (Run)
-- 4. Il trigger sarà ottimizzato e non causerà più stack depth errors
-- ===================================================================
