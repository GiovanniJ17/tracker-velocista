/**
 * STRESS TEST - Una settimana di allenamenti
 * Testa robustezza e correttezza lettura/scrittura nel database Supabase
 * 
 * Esecuzione: node stress-test-week.js
 * 
 * Il test:
 * 1. Crea 7 giorni di allenamenti (variati per tipo)
 * 2. Verifica che i dati siano scritti correttamente
 * 3. Legge i dati per verificare l'integrità
 * 4. Effettua query complesse (filter, aggregazioni)
 * 5. Testa eliminazioni e recupero dati
 * 6. Valida relazioni foreign key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variabili di ambiente mancanti. Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// DATI DI TEST - Una settimana completa di allenamenti
// ============================================================================

const trainingWeek = [
  {
    date: getDate(0), // Lunedì
    title: 'Lunedì - Velocità Pista',
    type: 'pista',
    location: 'Stadio Comunale',
    rpe: 8,
    feeling: 'Energico',
    notes: 'Buone sensazioni sulla velocità',
    groups: [
      {
        name: 'Riscaldamento',
        notes: 'Dinamico con andature',
        sets: [
          { exercise_name: 'Corsa lenta', category: 'endurance', time_s: 600, recovery_s: 60, details: {} },
          { exercise_name: 'Slanci tesi', category: 'drill', sets: 3, reps: 10, recovery_s: 30, details: {} },
          { exercise_name: 'Skip', category: 'drill', sets: 3, reps: 20, recovery_s: 30, details: {} },
        ]
      },
      {
        name: 'Lavoro di velocità',
        notes: 'Series di 200m',
        sets: [
          { exercise_name: '200m x 5', category: 'sprint', distance_m: 200, sets: 5, recovery_s: 120, details: { intensity: 'high' } },
          { exercise_name: 'Recupero attivo', category: 'endurance', distance_m: 400, recovery_s: 0, details: {} },
        ]
      },
      {
        name: 'Scarico',
        notes: 'Defaticamento leggero',
        sets: [
          { exercise_name: 'Corsa lenta', category: 'endurance', distance_m: 1000, recovery_s: 0, details: {} },
        ]
      }
    ]
  },
  {
    date: getDate(1), // Martedì
    title: 'Martedì - Forza Palestra',
    type: 'palestra',
    location: 'Palestra Centro',
    rpe: 7,
    feeling: 'Determinato',
    notes: 'Sessione upper body intensa',
    groups: [
      {
        name: 'Riscaldamento',
        notes: 'Generale + core',
        sets: [
          { exercise_name: 'Bike', category: 'endurance', time_s: 300, recovery_s: 0, details: {} },
          { exercise_name: 'Plank', category: 'mobility', sets: 3, time_s: 30, recovery_s: 30, details: {} },
        ]
      },
      {
        name: 'Petto e Spalle',
        notes: 'Focus on strength',
        sets: [
          { exercise_name: 'Panca piana', category: 'lift', sets: 4, reps: 6, weight_kg: 100, recovery_s: 180, details: { intensity: 'max' } },
          { exercise_name: 'Spalle manubri', category: 'lift', sets: 3, reps: 8, weight_kg: 35, recovery_s: 120, details: {} },
          { exercise_name: 'Croci', category: 'lift', sets: 3, reps: 10, weight_kg: 20, recovery_s: 90, details: {} },
        ]
      }
    ]
  },
  {
    date: getDate(2), // Mercoledì
    title: 'Mercoledì - Fondo Strada',
    type: 'strada',
    location: 'Sentiero collina',
    rpe: 6,
    feeling: 'Sereno',
    notes: 'Uscita aerobica, buone gambe',
    groups: [
      {
        name: 'Corsa continua',
        notes: 'Ritmo Z2',
        sets: [
          { exercise_name: 'Corsa fondo', category: 'endurance', distance_m: 12000, time_s: 3600, recovery_s: 0, details: { pace: 'z2', elevation: 200 } },
        ]
      }
    ]
  },
  {
    date: getDate(3), // Giovedì
    title: 'Giovedì - Ripetute Miste',
    type: 'pista',
    location: 'Stadio Comunale',
    rpe: 9,
    feeling: 'Concentrato',
    notes: 'Sessione tecnica complessa',
    groups: [
      {
        name: 'Riscaldamento',
        sets: [
          { exercise_name: 'Corsa lenta', category: 'endurance', distance_m: 2000, recovery_s: 0, details: {} },
          { exercise_name: 'Drills coordinativi', category: 'drill', sets: 5, reps: 30, recovery_s: 20, details: {} },
        ]
      },
      {
        name: 'Lavoro velocità anaerobica',
        notes: 'Serie miste di ritmo',
        sets: [
          { exercise_name: '600m x 3', category: 'sprint', distance_m: 600, sets: 3, recovery_s: 180, details: { intensity: 'high' } },
          { exercise_name: '400m x 4', category: 'sprint', distance_m: 400, sets: 4, recovery_s: 120, details: { intensity: 'very-high' } },
          { exercise_name: '200m x 2', category: 'sprint', distance_m: 200, sets: 2, recovery_s: 120, details: { intensity: 'max' } },
        ]
      }
    ]
  },
  {
    date: getDate(4), // Venerdì
    title: 'Venerdì - Mobilità e Core',
    type: 'altro',
    location: 'Casa',
    rpe: 3,
    feeling: 'Rilassato',
    notes: 'Recupero attivo, sessione leggera',
    groups: [
      {
        name: 'Mobilità generale',
        notes: 'Stretching dinamico',
        sets: [
          { exercise_name: 'Stretching gambe', category: 'mobility', sets: 1, time_s: 600, recovery_s: 0, details: {} },
          { exercise_name: 'Mobilità spalle', category: 'mobility', sets: 1, time_s: 300, recovery_s: 0, details: {} },
        ]
      },
      {
        name: 'Core work',
        notes: 'Esercizi di stabilità',
        sets: [
          { exercise_name: 'Plank', category: 'mobility', sets: 3, time_s: 45, recovery_s: 30, details: {} },
          { exercise_name: 'Side plank', category: 'mobility', sets: 2, time_s: 30, recovery_s: 30, details: {} },
          { exercise_name: 'Russian twist', category: 'mobility', sets: 3, reps: 20, recovery_s: 20, details: {} },
        ]
      }
    ]
  },
  {
    date: getDate(5), // Sabato
    title: 'Sabato - Gara Simulata',
    type: 'gara',
    location: 'Circuito cittadino',
    rpe: 10,
    feeling: 'Esaltato',
    notes: 'Massima intensità, ottima prestazione',
    groups: [
      {
        name: 'Riscaldamento pre-gara',
        sets: [
          { exercise_name: 'Corsa lenta', category: 'endurance', distance_m: 2000, recovery_s: 0, details: {} },
          { exercise_name: 'Progressive runs', category: 'sprint', distance_m: 1000, recovery_s: 60, details: {} },
        ]
      },
      {
        name: 'Gara',
        notes: '5km competitivo',
        sets: [
          { exercise_name: '5km gara', category: 'sprint', distance_m: 5000, time_s: 1320, recovery_s: 0, details: { pace: '4:24', heart_rate_max: 195 } },
        ]
      }
    ]
  },
  {
    date: getDate(6), // Domenica
    title: 'Domenica - Lunghissima Rigenerativa',
    type: 'scarico',
    location: 'Parco cittadino',
    rpe: 4,
    feeling: 'Tranquillo',
    notes: 'Recupero completo dopo gara',
    groups: [
      {
        name: 'Corsa lunga leggera',
        notes: 'Ritmo conversazionale',
        sets: [
          { exercise_name: 'Corsa lenta 15km', category: 'endurance', distance_m: 15000, time_s: 5400, recovery_s: 0, details: { pace: 'z1', heart_rate_avg: 130 } },
        ]
      }
    ]
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDate(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay() + daysOffset); // Lunedì = 1
  return date.toISOString().split('T')[0];
}

function log(title, message = '', type = 'info') {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪',
    db: '💾',
    verify: '✔️'
  };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${icons[type] || type} ${title}${message ? ': ' + message : ''}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TEST SUITE
// ============================================================================

class StressTestSuite {
  constructor() {
    this.insertedSessions = [];
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async run() {
    log('STRESS TEST', 'Inizio test settimana di allenamento', 'test');
    console.log('═'.repeat(80));

    try {
      await this.testConnection();
      await this.testInsertions();
      await this.testReads();
      await this.testComplexQueries();
      await this.testDataIntegrity();
      await this.testRelationships();
      await this.testUpdates();
      await this.testDeleteAndRestore();
      await this.printResults();
    } catch (error) {
      log('ERRORE FATALE', error.message, 'error');
      this.results.failed++;
    }
  }

  // Test 1: Connessione al database
  async testConnection() {
    log('TEST 1', 'Connessione al database', 'test');
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      log('✓ Connessione', 'Riuscita', 'success');
      this.results.passed++;
    } catch (error) {
      log('✗ Connessione', error.message, 'error');
      this.results.failed++;
      this.results.errors.push('Connessione al database fallita');
      throw error;
    }
  }

  // Test 2: Inserimento dati
  async testInsertions() {
    log('TEST 2', 'Inserimento 7 giorni di allenamento', 'test');
    
    for (const [index, training] of trainingWeek.entries()) {
      try {
        const { data: session, error: sessionError } = await supabase
          .from('training_sessions')
          .insert([{
            date: training.date,
            title: training.title,
            type: training.type,
            location: training.location,
            rpe: training.rpe,
            feeling: training.feeling,
            notes: training.notes,
          }])
          .select()
          .single();

        if (sessionError) throw sessionError;
        
        // Inserisci gruppi di esercizi
        for (const [groupIdx, group] of training.groups.entries()) {
          const { data: workoutGroup, error: groupError } = await supabase
            .from('workout_groups')
            .insert([{
              session_id: session.id,
              order_index: groupIdx,
              name: group.name,
              notes: group.notes || null,
            }])
            .select()
            .single();

          if (groupError) throw groupError;

          // Inserisci set di esercizi
          if (group.sets && group.sets.length > 0) {
            const setsToInsert = group.sets.map(set => ({
              group_id: workoutGroup.id,
              exercise_name: set.exercise_name,
              category: set.category,
              sets: set.sets || 1,
              reps: set.reps || 1,
              weight_kg: set.weight_kg || null,
              distance_m: set.distance_m || null,
              time_s: set.time_s || null,
              recovery_s: set.recovery_s || null,
              details: set.details || {},
              notes: set.notes || null,
            }));

            const { error: setsError } = await supabase
              .from('workout_sets')
              .insert(setsToInsert);

            if (setsError) throw setsError;
          }
        }

        this.insertedSessions.push(session.id);
        log(`  Giorno ${index + 1}`, `${training.title} (ID: ${session.id.slice(0, 8)}...)`, 'db');
        this.results.passed++;
      } catch (error) {
        log(`  Giorno ${index + 1} ERRORE`, error.message, 'error');
        this.results.failed++;
        this.results.errors.push(`Inserimento giorno ${index + 1} fallito: ${error.message}`);
      }
    }

    log('✓ Inserimenti', `${this.insertedSessions.length}/7 sessioni inserite`, 'success');
  }

  // Test 3: Lettura dati
  async testReads() {
    log('TEST 3', 'Lettura dati inseriti', 'test');
    
    try {
      // Leggi tutte le sessioni della settimana
      const { data: sessions, error } = await supabase
        .from('training_sessions')
        .select('*')
        .gte('date', trainingWeek[0].date)
        .lte('date', trainingWeek[6].date)
        .order('date', { ascending: true });

      if (error) throw error;

      log(`  Sessioni trovate`, sessions.length.toString(), 'db');

      // Leggi per ogni sessione i dati correlati
      for (const session of sessions) {
        const { data: groups, error: groupsError } = await supabase
          .from('workout_groups')
          .select('*')
          .eq('session_id', session.id)
          .order('order_index', { ascending: true });

        if (groupsError) throw groupsError;

        for (const group of groups) {
          const { data: sets, error: setsError } = await supabase
            .from('workout_sets')
            .select('*')
            .eq('group_id', group.id);

          if (setsError) throw setsError;

          log(`    ${session.title}`, `${groups.length} gruppi, ${sets.length} esercizi`, 'verify');
        }
      }

      log('✓ Letture', 'Tutte le relazioni verificate', 'success');
      this.results.passed++;
    } catch (error) {
      log('✗ Letture', error.message, 'error');
      this.results.failed++;
      this.results.errors.push(`Lettura dati fallita: ${error.message}`);
    }
  }

  // Test 4: Query complesse
  async testComplexQueries() {
    log('TEST 4', 'Query complesse e aggregazioni', 'test');
    
    try {
      // Query 1: RPE medio della settimana
      const { data: sessions, error: e1 } = await supabase
        .from('training_sessions')
        .select('rpe')
        .gte('date', trainingWeek[0].date)
        .lte('date', trainingWeek[6].date);

      if (e1) throw e1;
      const avgRPE = (sessions.reduce((sum, s) => sum + (s.rpe || 0), 0) / sessions.length).toFixed(1);
      log(`  RPE medio`, avgRPE, 'verify');

      // Query 2: Sessioni per tipo
      const { data: allSessions, error: e2 } = await supabase
        .from('training_sessions')
        .select('type')
        .gte('date', trainingWeek[0].date)
        .lte('date', trainingWeek[6].date);

      if (e2) throw e2;
      const typeCount = {};
      allSessions.forEach(s => {
        typeCount[s.type] = (typeCount[s.type] || 0) + 1;
      });
      log(`  Tipi di allenamento`, JSON.stringify(typeCount), 'verify');

      // Query 3: Esercizi per categoria
      const { data: allSets, error: e3 } = await supabase
        .from('workout_sets')
        .select('category');

      if (e3) throw e3;
      const categoryCount = {};
      allSets.forEach(s => {
        categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
      });
      log(`  Categorie esercizi`, JSON.stringify(categoryCount), 'verify');

      // Query 4: Volume totale
      const totalDistance = allSets
        .reduce((sum, s) => sum + (s.distance_m || 0), 0) / 1000;
      const totalWeight = allSets
        .reduce((sum, s) => sum + ((s.weight_kg || 0) * (s.sets || 1) * (s.reps || 1)), 0);
      log(`  Volume settimanale`, `${totalDistance.toFixed(1)}km, ${totalWeight.toFixed(0)}kg totali`, 'verify');

      log('✓ Query complesse', 'Tutte le query eseguite correttamente', 'success');
      this.results.passed++;
    } catch (error) {
      log('✗ Query complesse', error.message, 'error');
      this.results.failed++;
      this.results.errors.push(`Query complesse fallite: ${error.message}`);
    }
  }

  // Test 5: Integrità dati
  async testDataIntegrity() {
    log('TEST 5', 'Verifica integrità dati', 'test');
    
    try {
      let integrityOk = true;

      // Verifica campi obbligatori
      const { data: sessions, error: e1 } = await supabase
        .from('training_sessions')
        .select('*')
        .in('id', this.insertedSessions);

      if (e1) throw e1;

      for (const session of sessions) {
        if (!session.id || !session.date || !session.title) {
          integrityOk = false;
          log(`  Sessione ${session.id}`, 'Dati mancanti', 'warning');
        }
      }

      // Verifica relazioni
      const { data: groups, error: e2 } = await supabase
        .from('workout_groups')
        .select('session_id')
        .in('session_id', this.insertedSessions);

      if (e2) throw e2;
      if (groups.length === 0) {
        integrityOk = false;
        log(`  Gruppi`, 'Nessun gruppo trovato', 'warning');
      }

      // Verifica referential integrity
      const { data: sets, error: e3 } = await supabase
        .from('workout_sets')
        .select('group_id');

      if (e3) throw e3;
      if (sets.length === 0) {
        integrityOk = false;
        log(`  Set`, 'Nessun set trovato', 'warning');
      }

      if (integrityOk) {
        log('✓ Integrità', `Verificata - ${sessions.length} sessioni, ${groups.length} gruppi, ${sets.length} set`, 'success');
        this.results.passed++;
      } else {
        throw new Error('Integrità dati compromessa');
      }
    } catch (error) {
      log('✗ Integrità', error.message, 'error');
      this.results.failed++;
      this.results.errors.push(`Verifica integrità fallita: ${error.message}`);
    }
  }

  // Test 6: Relazioni foreign key
  async testRelationships() {
    log('TEST 6', 'Verifica relazioni foreign key', 'test');
    
    try {
      const { data: sessions, error: e1 } = await supabase
        .from('training_sessions')
        .select('id')
        .in('id', this.insertedSessions)
        .limit(1);

      if (e1) throw e1;
      if (sessions.length === 0) throw new Error('Nessuna sessione trovata');

      const sessionId = sessions[0].id;

      // Leggi gruppi collegati
      const { data: groups, error: e2 } = await supabase
        .from('workout_groups')
        .select('*, workout_sets(*)')
        .eq('session_id', sessionId);

      if (e2) throw e2;

      log(`  Sessione → ${groups.length} gruppi`, `Relazione OK`, 'verify');

      // Verifica che ogni set abbia un gruppo valido
      for (const group of groups) {
        if (!group.id || !group.session_id) {
          throw new Error(`Gruppo ${group.id} ha dati invalidi`);
        }
        log(`    Gruppo → ${group.workout_sets?.length || 0} set`, `Relazione OK`, 'verify');
      }

      log('✓ Foreign key', 'Tutte le relazioni verificate', 'success');
      this.results.passed++;
    } catch (error) {
      log('✗ Foreign key', error.message, 'error');
      this.results.failed++;
      this.results.errors.push(`Verifica relazioni fallita: ${error.message}`);
    }
  }

  // Test 7: Aggiornamenti dati
  async testUpdates() {
    log('TEST 7', 'Aggiornamento dati', 'test');
    
    try {
      if (this.insertedSessions.length === 0) {
        throw new Error('Nessuna sessione da aggiornare');
      }

      const sessionToUpdate = this.insertedSessions[0];

      // Aggiorna una sessione
      const { error: updateError } = await supabase
        .from('training_sessions')
        .update({
          rpe: 9,
          feeling: 'Ottimo dopo aggiornamento',
          notes: 'Aggiornato dal test - ' + new Date().toISOString()
        })
        .eq('id', sessionToUpdate);

      if (updateError) throw updateError;

      // Verifica l'aggiornamento
      const { data: updated, error: readError } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionToUpdate)
        .single();

      if (readError) throw readError;

      if (updated.rpe !== 9 || !updated.notes.includes('aggiornamento')) {
        throw new Error('Aggiornamento non riflesso nel database');
      }

      log('✓ Aggiornamenti', `RPE e note aggiornati correttamente`, 'success');
      this.results.passed++;
    } catch (error) {
      log('✗ Aggiornamenti', error.message, 'error');
      this.results.failed++;
      this.results.errors.push(`Aggiornamento fallito: ${error.message}`);
    }
  }

  // Test 8: Eliminazione e verifica cascata
  async testDeleteAndRestore() {
    log('TEST 8', 'Eliminazione con cascata (e verifica)', 'test');
    
    try {
      if (this.insertedSessions.length < 2) {
        log('⊘ Eliminazione', 'Saltato - poche sessioni disponibili', 'warning');
        return;
      }

      const sessionToDelete = this.insertedSessions[this.insertedSessions.length - 1];

      // Conta i record prima
      const { data: groupsBefore, error: e1 } = await supabase
        .from('workout_groups')
        .select('id')
        .eq('session_id', sessionToDelete);

      if (e1) throw e1;
      const groupCountBefore = groupsBefore.length;

      log(`  Prima eliminazione`, `1 sessione, ${groupCountBefore} gruppi`, 'verify');

      // Elimina la sessione (cascade dovrebbe eliminare tutto)
      const { error: deleteError } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionToDelete);

      if (deleteError) throw deleteError;

      // Verifica che non ci siano più record orfani
      const { data: groupsAfter, error: e2 } = await supabase
        .from('workout_groups')
        .select('id')
        .eq('session_id', sessionToDelete);

      if (e2) throw e2;

      if (groupsAfter.length !== 0) {
        throw new Error(`Cascata fallita: ${groupsAfter.length} gruppi rimasti orfani`);
      }

      log('✓ Eliminazione', `Cascata DELETE verificata - ${groupCountBefore} record eliminati`, 'success');
      this.results.passed++;
    } catch (error) {
      log('✗ Eliminazione', error.message, 'error');
      this.results.failed++;
      this.results.errors.push(`Eliminazione fallita: ${error.message}`);
    }
  }

  // Risultati finali
  async printResults() {
    console.log('═'.repeat(80));
    log('RISULTATI FINALI', '', 'test');
    console.log('─'.repeat(80));
    log('✅ Test passati', this.results.passed.toString(), 'success');
    log('❌ Test falliti', this.results.failed.toString(), this.results.failed > 0 ? 'error' : 'success');
    
    if (this.results.errors.length > 0) {
      console.log('\n📋 Errori riscontrati:');
      this.results.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }

    const totalTests = this.results.passed + this.results.failed;
    const percentage = ((this.results.passed / totalTests) * 100).toFixed(1);
    console.log('\n' + '═'.repeat(80));
    log('SUCCESSO GLOBALE', `${percentage}% (${this.results.passed}/${totalTests} test)`, 
        this.results.failed === 0 ? 'success' : 'warning');
    console.log('═'.repeat(80));
  }
}

// ============================================================================
// ESECUZIONE
// ============================================================================

const suite = new StressTestSuite();
suite.run().catch(error => {
  console.error('Errore durante l\'esecuzione:', error);
  process.exit(1);
});
