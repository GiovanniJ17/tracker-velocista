import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configura variabili d'ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Colori per output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

const log = {
  title: (text) => console.log(`\n${colors.bold}${colors.cyan}=== ${text} ===${colors.reset}`),
  section: (text) => console.log(`\n${colors.bold}${colors.magenta}📍 ${text}${colors.reset}`),
  success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
  info: (text) => console.log(`${colors.cyan}ℹ️  ${text}${colors.reset}`),
  warn: (text) => console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`),
  result: (text, value) => console.log(`${colors.cyan}${text}${colors.reset}${colors.bold}${value}${colors.reset}`)
};

// Dati finti pre-parsati (Simuliamo che l'AI abbia già lavorato)
const generateMockSession = (index, date) => ({
  session: {
    title: `Sessione Stress Test #${index + 1}`,
    type: ['pista', 'strada', 'palestra', 'piscina'][index % 4],
    rpe: Math.floor(Math.random() * 9) + 3,
    feeling: ['Fresco', 'Stanco', 'Ottimo', 'OK'][Math.floor(Math.random() * 4)],
    notes: `Test automatico di carico - ${date}`
  },
  groups: [
    {
      name: 'Riscaldamento',
      order_index: 0,
      sets: [
        {
          exercise_name: 'Corsa Lenta',
          category: 'endurance',
          distance_m: 1000 + Math.random() * 500,
          sets: 1,
          time_s: 300 + Math.random() * 120
        }
      ]
    },
    {
      name: 'Lavoro Principale',
      order_index: 1,
      sets: [
        {
          exercise_name: `Sprint ${60 + (index % 5) * 20}m`,
          category: 'sprint',
          distance_m: 60 + (index % 5) * 20,
          time_s: 7.5 + Math.random() * 2,
          sets: 5 + Math.floor(Math.random() * 5),
          recovery_s: 180 + Math.random() * 120
        },
        {
          exercise_name: 'Squat',
          category: 'strength',
          weight_kg: 60 + Math.random() * 80,
          reps: 8 + Math.floor(Math.random() * 4),
          sets: 3 + Math.floor(Math.random() * 2)
        }
      ]
    }
  ]
});

async function testDatabaseConnection() {
  log.section('Verifica Connessione Database');
  try {
    const { data, error } = await supabase.from('athlete_profile').select('count').limit(1);
    if (error) throw error;
    log.success('Connessione Supabase OK');
    return true;
  } catch (error) {
    log.error(`Connessione fallita: ${error.message}`);
    return false;
  }
}

async function verifyRPC() {
  log.section('Verifica RPC disponibile');
  try {
    // Test mini RPC call
    const { data, error } = await supabase.rpc('insert_full_training_session', {
      p_date: '2025-01-01',
      p_title: 'Test RPC',
      p_type: 'pista',
      p_groups: []
    });
    
    if (error && error.message.includes('No function')) {
      log.warn('RPC non disponibile - userò insert diretto');
      return false;
    }
    
    log.success('RPC insert_full_training_session disponibile');
    return true;
  } catch (error) {
    log.warn(`RPC non disponibile: ${error.message}`);
    return false;
  }
}

async function bulkInsertSessions(count, useRPC) {
  log.section(`Fase 1: Inserimento Massivo (${count} sessioni)`);
  
  const startDate = new Date('2024-01-01');
  const writeStart = performance.now();
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log(`⏳ Inserendo ${count} sessioni...`);

  if (useRPC) {
    // Usa RPC (più veloce)
    const insertPromises = [];
    for (let i = 0; i < count; i++) {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + i);
      const dateStr = sessionDate.toISOString().split('T')[0];
      
      const mockData = generateMockSession(i, dateStr);
      
      insertPromises.push(
        supabase.rpc('insert_full_training_session', {
          p_date: dateStr,
          p_title: mockData.session.title,
          p_type: mockData.session.type,
          p_groups: mockData.groups
        }).then(() => {
          successCount++;
          if ((successCount + errorCount) % 10 === 0) {
            process.stdout.write('.');
          }
        }).catch((error) => {
          errorCount++;
          errors.push(`[RPC Sessione ${i}] ${error.message}`);
        })
      );
    }

    await Promise.all(insertPromises);
  } else {
    // Usa insert diretto (più lento ma sempre funziona)
    for (let i = 0; i < count; i++) {
      try {
        const sessionDate = new Date(startDate);
        sessionDate.setDate(startDate.getDate() + i);
        const dateStr = sessionDate.toISOString().split('T')[0];
        
        const mockData = generateMockSession(i, dateStr);
        
        // Insert training_session
        const { data: sessionData, error: sessionError } = await supabase
          .from('training_sessions')
          .insert({
            date: dateStr,
            title: mockData.session.title,
            type: mockData.session.type,
            rpe: mockData.session.rpe,
            feeling: mockData.session.feeling,
            notes: mockData.session.notes
          })
          .select('id')
          .single();

        if (sessionError) throw sessionError;

        // Insert workout_groups
        for (const group of mockData.groups) {
          const { data: groupData, error: groupError } = await supabase
            .from('workout_groups')
            .insert({
              training_session_id: sessionData.id,
              name: group.name,
              order_index: group.order_index
            })
            .select('id')
            .single();

          if (groupError) throw groupError;

          // Insert workout_sets
          for (const set of group.sets) {
            await supabase.from('workout_sets').insert({
              workout_group_id: groupData.id,
              exercise_name: set.exercise_name,
              category: set.category,
              distance_m: set.distance_m || null,
              time_s: set.time_s || null,
              weight_kg: set.weight_kg || null,
              reps: set.reps || null,
              sets: set.sets || 1,
              recovery_s: set.recovery_s || null
            });
          }
        }

        successCount++;
        if ((successCount + errorCount) % 10 === 0) {
          process.stdout.write('.');
        }
      } catch (error) {
        errorCount++;
        errors.push(`[Direct Insert Sessione ${i}] ${error.message}`);
      }
    }
  }

  const writeEnd = performance.now();
  const duration = (writeEnd - writeStart) / 1000;
  const rate = successCount / duration;

  console.log('');
  log.success(`Inserite ${successCount} sessioni in ${duration.toFixed(2)}s`);
  log.result('Velocità: ', `${rate.toFixed(1)} sessioni/sec`);
  
  if (errorCount > 0) {
    log.warn(`Errori: ${errorCount}/${count}`);
    errors.slice(0, 3).forEach(e => log.error(e));
    if (errors.length > 3) log.error(`... e altri ${errors.length - 3} errori`);
  }

  return { successCount, errorCount, duration };
}

async function concurrentReads(concurrentUsers) {
  log.section(`Fase 2: Letture Concorrenti (${concurrentUsers} utenti simultanei)`);

  const readStart = performance.now();
  let successCount = 0;
  let errorCount = 0;

  console.log(`⏳ Simulando ${concurrentUsers} utenti che leggono dati...`);

  const readPromises = [];

  for (let i = 0; i < concurrentUsers; i++) {
    readPromises.push(
      (async () => {
        try {
          // Query 1: Lettura sessioni recenti
          const sessions = await supabase
            .from('training_sessions')
            .select('*')
            .order('date', { ascending: false })
            .limit(10);

          if (sessions.error) throw sessions.error;

          // Query 2: Lettura record personali
          const records = await supabase
            .from('race_records')
            .select('*')
            .filter('is_personal_best', 'eq', true)
            .limit(10);

          if (records.error) throw records.error;

          // Query 3: Lettura statistiche
          const stats = await supabase
            .from('monthly_stats')
            .select('*')
            .order('month', { ascending: false })
            .limit(12);

          if (stats.error) throw stats.error;

          successCount++;
        } catch (error) {
          errorCount++;
        }

        if ((successCount + errorCount) % 5 === 0) {
          process.stdout.write('.');
        }
      })()
    );
  }

  await Promise.all(readPromises);

  const readEnd = performance.now();
  const duration = (readEnd - readStart) / 1000;
  const rate = concurrentUsers / duration;

  console.log('');
  log.success(`Completate ${successCount} letture pesanti simultanee in ${duration.toFixed(2)}s`);
  log.result('Velocità: ', `${rate.toFixed(1)} utenti/sec`);
  
  if (errorCount > 0) {
    log.warn(`Errori di lettura: ${errorCount}/${concurrentUsers}`);
  }

  return { successCount, errorCount, duration };
}

async function testPersonalBestFlow() {
  log.section('Fase 3: Test Flusso Personal Bests (Salvataggio + Lettura)');

  console.log(`⏳ Testing PB extraction and storage...`);

  try {
    // Simula estrazione di PB
    const mockExtractedPBs = [
      { type: 'race', exercise_name: '100m', distance_m: 100, time_s: 9.99, notes: 'Test stress' },
      { type: 'race', exercise_name: '200m', distance_m: 200, time_s: 20.5, notes: 'Test stress' },
      { type: 'strength', exercise_name: 'Squat', weight_kg: 150, reps: 8, notes: 'Test stress' }
    ];

    const saveStart = performance.now();

    // Simulare salvataggio PB
    for (const pb of mockExtractedPBs) {
      if (pb.type === 'race') {
        await supabase.from('race_records').insert({
          distance_m: pb.distance_m,
          time_s: pb.time_s,
          is_personal_best: true,
          notes: pb.notes
        });
      } else if (pb.type === 'strength') {
        await supabase.from('strength_records').insert({
          exercise_name: pb.exercise_name,
          weight_kg: pb.weight_kg,
          reps: pb.reps,
          is_personal_best: true,
          notes: pb.notes
        });
      }
    }

    const saveEnd = performance.now();

    // Leggere i PB appena salvati
    const readStart = performance.now();
    const { data: raceRecords } = await supabase
      .from('race_records')
      .select('*')
      .filter('is_personal_best', 'eq', true)
      .filter('notes', 'eq', 'Test stress');

    const { data: strengthRecords } = await supabase
      .from('strength_records')
      .select('*')
      .filter('is_personal_best', 'eq', true)
      .filter('notes', 'eq', 'Test stress');

    const readEnd = performance.now();

    log.success(`Salvati 3 PB in ${((saveEnd - saveStart) / 1000).toFixed(2)}s`);
    log.success(`Letti ${raceRecords?.length || 0} race + ${strengthRecords?.length || 0} strength PB in ${((readEnd - readStart) / 1000).toFixed(2)}s`);

    return { saved: 3, retrieved: (raceRecords?.length || 0) + (strengthRecords?.length || 0) };
  } catch (error) {
    log.error(`Errore PB flow: ${error.message}`);
    return { saved: 0, retrieved: 0 };
  }
}

async function cleanup() {
  log.section('Fase 4: Pulizia Dati Test');

  console.log(`⏳ Rimozione dati di test...`);

  try {
    // Rimuovi sessioni di test
    const { error: sessionError } = await supabase
      .from('training_sessions')
      .delete()
      .like('notes', '%Test automatico di carico%');

    if (sessionError) throw sessionError;

    // Rimuvi PB di test
    const { error: pbError } = await supabase
      .from('race_records')
      .delete()
      .eq('notes', 'Test stress');

    const { error: pbError2 } = await supabase
      .from('strength_records')
      .delete()
      .eq('notes', 'Test stress');

    if (pbError || pbError2) throw pbError || pbError2;

    log.success('Dati di test rimossi correttamente');
  } catch (error) {
    log.warn(`Errore durante cleanup: ${error.message}`);
  }
}

async function generateReport(results) {
  log.title('RAPPORTO STRESS TEST');

  console.log(`
${colors.bold}1. WRITESPEED (Inserimenti)${colors.reset}
   ${colors.cyan}Sessioni inserite: ${colors.bold}${results.writes.successCount}${colors.reset}
   ${colors.cyan}Durata: ${colors.bold}${results.writes.duration.toFixed(2)}s${colors.reset}
   ${colors.cyan}Velocità: ${colors.bold}${(results.writes.successCount / results.writes.duration).toFixed(1)} sessioni/sec${colors.reset}
   ${results.writes.successCount / results.writes.duration >= 10 ? colors.green + '✅ ECCELLENTE' : colors.yellow + '⚠️  DA OTTIMIZZARE'}${colors.reset}

${colors.bold}2. READSPEED (Letture Concorrenti)${colors.reset}
   ${colors.cyan}Letture completate: ${colors.bold}${results.reads.successCount}${colors.reset}
   ${colors.cyan}Durata: ${colors.bold}${results.reads.duration.toFixed(2)}s${colors.reset}
   ${colors.cyan}Velocità: ${colors.bold}${(results.reads.successCount / results.reads.duration).toFixed(1)} utenti/sec${colors.reset}
   ${results.reads.duration < 2 ? colors.green + '✅ VELOCE' : colors.yellow + '⚠️  POTREBBE ESSERE PIÙ VELOCE'}${colors.reset}

${colors.bold}3. PERSONAL BESTS FLOW${colors.reset}
   ${colors.cyan}Salvati: ${colors.bold}${results.pbs.saved}${colors.reset}
   ${colors.cyan}Recuperati: ${colors.bold}${results.pbs.retrieved}${colors.reset}
   ${results.pbs.saved === results.pbs.retrieved ? colors.green + '✅ CONSISTENTE' : colors.red + '❌ MISMATCH'}${colors.reset}

${colors.bold}RACCOMANDAZIONI${colors.reset}
`);

  if (results.writes.successCount / results.writes.duration < 5) {
    log.warn('Scrittura lenta: Verifica gli indici su training_sessions con EXPLAIN ANALYZE');
  }
  if (results.reads.duration > 2) {
    log.warn('Lettura lenta: Considera di aggiungere indici su date, is_personal_best');
  }
  if (results.pbs.saved !== results.pbs.retrieved) {
    log.error('PB inconsistenti: Verifica foreign keys e triggers');
  }

  log.title('TEST COMPLETATO 🎉');
}

async function runStressTest() {
  log.title('MASSIVE STRESS TEST SUITE');
  
  // Verifica prerequisiti
  if (!(await testDatabaseConnection())) {
    log.error('Impossibile continuare senza connessione database');
    process.exit(1);
  }

  const useRPC = await verifyRPC();

  // Parametri test
  const sessionsToInsert = 50; // Aumenta a 365 per test massivo
  const concurrentUsers = 20;

  // Esegui fasi
  const writeResults = await bulkInsertSessions(sessionsToInsert, useRPC);
  const readResults = await concurrentReads(concurrentUsers);
  const pbResults = await testPersonalBestFlow();
  await cleanup();

  // Report finale
  const results = {
    writes: writeResults,
    reads: readResults,
    pbs: pbResults
  };

  await generateReport(results);
}

runStressTest().catch((error) => {
  log.error(`Test fallito: ${error.message}`);
  console.error(error);
  process.exit(1);
});
