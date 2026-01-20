/**
 * Test Script - Personal Bests Integration
 * 
 * Questo script testa il salvataggio automatico dei Personal Bests
 * nelle tabelle race_records, strength_records e training_records
 */

// Test Cases per verificare il sistema PB
const testCases = [
  {
    name: "Race Record - 100m PB",
    input: "Oggi in gara ho fatto 100m in 10.45 PB!",
    expectedPB: {
      type: "race",
      distance_m: 100,
      time_s: 10.45
    }
  },
  {
    name: "Strength Record - Squat",
    input: "Palestra: squat 120kg massimale nuovo!",
    expectedPB: {
      type: "strength",
      exercise_name: "squat",
      category: "squat",
      weight_kg: 120
    }
  },
  {
    name: "Training Record - Sprint",
    input: "Pista oggi: 150m in 19.8 PB allenamento",
    expectedPB: {
      type: "training",
      exercise_name: "Sprint 150m",
      exercise_type: "sprint",
      performance_value: 19.8,
      performance_unit: "seconds"
    }
  },
  {
    name: "Multiple PBs",
    input: "Gara 60m in 7.18 PB, poi palestra squat 100kg PB",
    expectedPBs: [
      {
        type: "race",
        distance_m: 60,
        time_s: 7.18
      },
      {
        type: "strength",
        exercise_name: "squat",
        weight_kg: 100
      }
    ]
  },
  {
    name: "Injury Detection",
    input: "Allenamento con dolore al ginocchio, ho fatto solo stretching",
    expectedInjury: {
      injury_type: "dolore",
      body_part: "ginocchio"
    }
  }
];

// Manual Test Instructions
console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    PERSONAL BESTS - MANUAL TEST GUIDE                      ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 SETUP CHECKLIST
  ✅ Database su Supabase con tabelle race_records, strength_records, training_records
  ✅ File db-optimize.sql eseguito (indici e RLS)
  ✅ App in esecuzione (npm run dev)
  ✅ Console aperta nel browser (F12)

📝 TEST PROCEDURE

1️⃣ TEST RACE RECORD (Gara)
   Input: "Oggi in gara ho fatto 100m in 10.45 PB!"
   
   Verifica:
   • Console mostra: "[saveExtractedRecords] PB da salvare: 1"
   • Console mostra: "Race PB 100m: 10.45s - È PB: true"
   • Su Supabase: SELECT * FROM race_records WHERE distance_m = 100;
   • Deve esserci 1 record con time_s = 10.45 e is_personal_best = true

2️⃣ TEST STRENGTH RECORD (Forza)
   Input: "Palestra: squat 120kg massimale nuovo!"
   
   Verifica:
   • Console mostra: "[saveExtractedRecords] Strength PB squat (squat): 120kg - È PB: true"
   • Su Supabase: SELECT * FROM strength_records WHERE category = 'squat';
   • Deve esserci 1 record con weight_kg = 120

3️⃣ TEST TRAINING RECORD (Allenamento)
   Input: "Pista oggi: test 150m in 19.8 PB"
   
   Verifica:
   • Console mostra: "[saveExtractedRecords] Training PB Sprint 150m: 19.8seconds - È PB: true"
   • Su Supabase: SELECT * FROM training_records WHERE exercise_name LIKE '%150m%';
   • Deve esserci 1 record con performance_value = 19.8

4️⃣ TEST MULTIPLE PBs
   Input: "Gara 60m in 7.18 PB, poi palestra squat 100kg PB"
   
   Verifica:
   • Console mostra: "PB da salvare: 2"
   • Su Supabase: Controlla entrambe le tabelle (race_records e strength_records)

5️⃣ TEST PB DETECTION (Non dovrebbe essere PB)
   Prerequisito: Esegui prima test 1️⃣ (100m in 10.45)
   Input: "Gara 100m in 10.60"
   
   Verifica:
   • Console mostra: "Race PB 100m: 10.60s - È PB: false"
   • Su Supabase: Il nuovo record ha is_personal_best = false
   • Il vecchio record (10.45) rimane is_personal_best = true

6️⃣ TEST INJURY DETECTION
   Input: "Allenamento con dolore al ginocchio, ho fatto solo stretching"
   
   Verifica:
   • Console mostra: "Infortuni da salvare: 1"
   • Su Supabase: SELECT * FROM injury_history;
   • Deve esserci 1 record con injury_type = 'dolore' e body_part = 'ginocchio'

📊 QUERY DI VERIFICA SUPABASE

-- Verifica tutti i PB salvati
SELECT 
  'Race' as type,
  distance_m::text || 'm' as exercise,
  time_s::text || 's' as performance,
  is_personal_best,
  created_at
FROM race_records
UNION ALL
SELECT 
  'Strength',
  exercise_name || ' (' || category || ')',
  weight_kg::text || 'kg',
  is_personal_best,
  created_at
FROM strength_records
UNION ALL
SELECT 
  'Training',
  exercise_name,
  performance_value::text || performance_unit,
  is_personal_best,
  created_at
FROM training_records
ORDER BY created_at DESC;

-- Verifica infortuni
SELECT 
  injury_type,
  body_part,
  severity,
  start_date,
  notes
FROM injury_history
ORDER BY start_date DESC;

-- Verifica che i PB siano collegati alle sessioni corrette
SELECT 
  ts.date,
  ts.title,
  ts.type,
  rr.distance_m,
  rr.time_s,
  rr.is_personal_best
FROM training_sessions ts
LEFT JOIN race_records rr ON rr.session_id = ts.id
WHERE rr.id IS NOT NULL
ORDER BY ts.date DESC;

🔍 TROUBLESHOOTING

❌ "PB da salvare: 0" ma hai scritto "PB" nel testo
   → Controlla che aiParser.js estragga correttamente i PB
   → Verifica la console per errori di parsing

❌ "Errore nel salvataggio PB"
   → Controlla le RLS policy su Supabase (devono permettere INSERT)
   → Verifica che le tabelle esistano (db-schema.sql eseguito)

❌ "is_personal_best: false" anche se è il primo record
   → Verifica che la query di confronto funzioni correttamente
   → Controlla che non ci siano record precedenti nelle tabelle

❌ I PB non appaiono nelle statistiche
   → Verifica che athleteService.js abbia le funzioni getRaceRecords, getStrengthRecords, getTrainingRecords
   → Controlla che il componente AthleteProfile chiami queste funzioni

✅ SUCCESS CRITERIA

Se tutti i test passano:
  ✅ I PB vengono salvati automaticamente
  ✅ Il flag is_personal_best è corretto
  ✅ I record sono collegati alla sessione corretta
  ✅ Gli infortuni vengono registrati
  ✅ Non ci sono errori nella console

🎉 Sistema di Personal Bests completamente funzionante!

╔════════════════════════════════════════════════════════════════════════════╗
║                             IMPLEMENTAZIONE                                ║
╚════════════════════════════════════════════════════════════════════════════╝

File modificati:
  ✅ src/services/trainingService.js
     → Riattivata funzione saveExtractedRecords
     → Aggiunto logging dettagliato per debug
     → Gestione errori per ogni tipo di PB

  ✅ src/services/athleteService.js
     → Funzioni addRaceRecord, addTrainingRecord, addStrengthRecord già presenti
     → Funzione addInjury per registrare infortuni

  ✅ Database
     → Tabelle race_records, strength_records, training_records pronte
     → Indici ottimizzati (db-optimize.sql)
     → RLS policy configurate

Flusso di salvataggio:
  1. Utente inserisce testo con PB
  2. aiParser.js estrae PB → { personalBests: [...], injuries: [...] }
  3. AITrainingInput.jsx chiama saveTrainingSessions(parsedData)
  4. trainingService.js salva sessione → ottiene sessionId
  5. trainingService.js chiama saveExtractedRecords(sessionId, personalBests, injuries)
  6. saveExtractedRecords smista i PB nelle tabelle corrette
  7. Verifica se è un vero PB confrontando con record esistenti
  8. Salva con flag is_personal_best corretto

`);

export { testCases };
