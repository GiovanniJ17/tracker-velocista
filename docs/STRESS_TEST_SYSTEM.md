# 🧪 Sistema Stress Test Massivo - Riepilogo Completo

## 📋 Cosa è Stato Creato

### 1. File Script Principali

#### `scripts/tests/massive-stress-test.js` (850 righe)
Lo script core di stress test che:
- ✅ Verifica connessione Supabase
- ✅ Testa inserimento massivo (RPC o Insert diretto)
- ✅ Testa letture concorrenti (20+ utenti simultanei)
- ✅ Testa ciclo Personal Bests (save + retrieve)
- ✅ Pulisce automaticamente i dati di test
- ✅ Genera report dettagliato con colori ANSI

**Parametri configurabili:**
```javascript
const sessionsToInsert = 50;    // Sessioni di allenamento
const concurrentUsers = 20;     // Utenti simultanei
```

#### `scripts/stress-test-runner.js` (70 righe)
Wrapper che permette esecuzione con profili predefiniti:
- 🔧 **Quick**: 10 sessioni, 5 utenti (30 sec)
- 🔧 **Standard**: 50 sessioni, 20 utenti (1 min)
- 🔧 **Heavy**: 100 sessioni, 50 utenti (2-3 min)
- 🔧 **Full**: 365 sessioni, 100 utenti (5-10 min)

### 2. Documentazione

#### `docs/STRESS_TEST_GUIDE.md` (350 righe)
Guida completa che copre:
- Prerequisiti e setup
- 4 fasi di test dettagliate
- Come interpretare risultati (velocità, throughput)
- Benchmark targets per diverse scale
- Troubleshooting completo
- Ottimizzazioni se troppo lento

#### `docs/STRESS_TEST_QUICK_START.md` (200 righe)
Quickstart visuale con:
- 4 comandi npm pronti (quick/standard/heavy/full)
- Output atteso vs problemi
- Interpretazione colori (✅ green, ⚠️ yellow, ❌ red)
- Tabella comparazione profili
- Pro tips per monitoring

### 3. Configurazione package.json

Aggiunti 4 comandi npm:
```bash
npm run test:stress           # Standard (default)
npm run test:stress:quick     # Quick (30 sec)
npm run test:stress:heavy     # Heavy (2-3 min)
npm run test:stress:full      # Full (5-10 min)
```

---

## 🎯 Come Funziona il Sistema

```
┌─────────────────────────────────────────────────────────┐
│  npm run test:stress:quick/standard/heavy/full           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ stress-test-runner.js       │
        │ (Profilo selector)          │
        │ ├─ quick: 10/5              │
        │ ├─ standard: 50/20 (default)│
        │ ├─ heavy: 100/50            │
        │ └─ full: 365/100            │
        └────────────────┬────────────┘
                         │
                         ▼
        ┌────────────────────────────────────────┐
        │ massive-stress-test.js (Main Script)   │
        │                                        │
        │ Fase 1: WRITESPEED                    │
        │ └─ Inserisce N sessioni di allenamento│
        │   └─ Misura: sesioni/sec              │
        │                                        │
        │ Fase 2: READSPEED                     │
        │ └─ M utenti leggono simultaneamente   │
        │   └─ Misura: utenti/sec, tempo total  │
        │                                        │
        │ Fase 3: PB FLOW                       │
        │ └─ Salva PB, legge PB                 │
        │   └─ Verifica consistenza             │
        │                                        │
        │ Fase 4: CLEANUP                       │
        │ └─ Rimuove dati di test               │
        │                                        │
        │ Report: Grafico risultati con colori  │
        └────────────────┬───────────────────────┘
                         │
                         ▼
      ┌──────────────────────────────────────┐
      │ Supabase Database (testing)           │
      │ ├─ training_sessions                 │
      │ ├─ workout_groups                    │
      │ ├─ workout_sets                      │
      │ ├─ race_records                      │
      │ ├─ strength_records                  │
      │ ├─ training_records                  │
      │ └─ (dati test poi cancellati)        │
      └──────────────────────────────────────┘
```

---

## 📊 4 Fasi di Test

### Fase 1: WRITESPEED (Inserimento Massivo)

```javascript
// Simula inserimento di sessioni storiche
for (let i = 0; i < 50; i++) {
  const sessionDate = new Date('2024-01-01');
  sessionDate.setDate(sessionDate.getDate() + i);
  
  // Usa RPC (più veloce) o Insert diretto (fallback)
  await supabase.rpc('insert_full_training_session', {
    p_date, p_title, p_type, p_groups
  });
}

// Misura: sessioni/sec
// Target: > 5/sec (green), 2-5/sec (yellow), < 2/sec (red)
```

**Cosa testa:**
- Performance della RPC `insert_full_training_session`
- Efficienza degli indici durante INSERT
- Capacità del database di scrivere dati bulk

---

### Fase 2: READSPEED (Letture Concorrenti)

```javascript
// Simula 20 utenti che leggono dashboard
for (let i = 0; i < 20; i++) {
  // Query 1: Sessioni recenti
  await supabase.from('training_sessions')
    .select('*').order('date', { ascending: false }).limit(10);
  
  // Query 2: Record personali
  await supabase.from('race_records')
    .select('*').filter('is_personal_best', 'eq', true).limit(10);
  
  // Query 3: Statistiche mensili
  await supabase.from('monthly_stats')
    .select('*').order('month', { ascending: false }).limit(12);
}

// Misura: utenti/sec, tempo totale
// Target: < 1s (green), 1-2s (yellow), > 2s (red)
```

**Cosa testa:**
- Performance queries on indexed columns (date, is_personal_best)
- Scalabilità di letture simultanee
- Come si comporta la dashboard con tanti utenti

---

### Fase 3: PB FLOW (Personal Bests)

```javascript
// Salva 3 PB
await supabase.from('race_records').insert({
  distance_m: 100, time_s: 9.99, is_personal_best: true
});
// ... altri 2 PB

// Leggi i PB appena salvati
const { data: raceRecords } = await supabase
  .from('race_records')
  .select('*').filter('is_personal_best', 'eq', true);

// Verifica: Salvati === Recuperati
// Target: 100% consistenza
```

**Cosa testa:**
- Ciclo completo estrazione → salvataggio → lettura
- Consistenza dei dati
- Foreign keys e constraints

---

### Fase 4: CLEANUP (Pulizia)

```javascript
// Rimuove tutte le sessioni di test
await supabase.from('training_sessions')
  .delete().like('notes', '%Test automatico%');

// Rimuove PB di test
await supabase.from('race_records')
  .delete().eq('notes', 'Test stress');
```

**Cosa testa:**
- Verifiche che deletion funziona (ON DELETE CASCADE)
- Non lascia dati sporchi nel database

---

## 🎨 Output Report

Esempio di output con colori:

```
=== MASSIVE STRESS TEST SUITE ===

✅ Connessione Supabase OK
✅ RPC insert_full_training_session disponibile

=== Fase 1: Inserimento Massivo (50 sessioni) ===
✅ Inserite 50 sessioni in 6.42s
Velocità: 7.8 sessioni/sec
✅ BUONO

=== Fase 2: Letture Concorrenti (20 utenti simultanei) ===
✅ Completate 20 letture in 0.95s
Velocità: 21.1 utenti/sec
✅ VELOCE

=== Fase 3: Test Flusso Personal Bests ===
✅ Salvati 3 PB in 0.12s
✅ Letti 3 race + 0 strength PB in 0.08s
✅ CONSISTENTE

=== RAPPORTO STRESS TEST ===

1. WRITESPEED: 7.8 sessioni/sec ✅
2. READSPEED: 0.95s per 20 utenti ✅
3. PB FLOW: Salvati 3 = Recuperati 3 ✅

🎉 TEST COMPLETATO
```

---

## 🚀 Come Usare

### Quick Start (1 minuto)

1. **Verifica .env**
   ```bash
   cat .env
   # Deve contenere VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
   ```

2. **Esegui test quick**
   ```bash
   npm run test:stress:quick
   ```

3. **Leggi results**
   - Se vedi ✅ ovunque → Sistema OK
   - Se vedi ⚠️ → Aggiungi indici
   - Se vedi ❌ → Vedi troubleshooting

### Progression Test (Consigliato)

```bash
# Giorno 1: Verifica funzionamento
npm run test:stress:quick     # 30 sec

# Giorno 2: Benchmark standard
npm run test:stress           # 1 min

# Giorno 3: Load test pesante
npm run test:stress:heavy     # 2-3 min

# Giorno 4: Full production test
npm run test:stress:full      # 5-10 min
```

---

## 📈 Metriche e Targets

### Writespeed (sessioni/sec)

| Volume | Target Min | Target OK | Status |
|--------|-----------|-----------|--------|
| 10 | 10+ | 20+ | ✅ |
| 50 | 5+ | 15+ | ✅ |
| 100 | 3+ | 10+ | ✅ |
| 365 | 2+ | 5+ | ✅ |

Basato su: Insert su 3 tabelle (session, groups, sets) + RPC overhead

### Readspeed (tempo per 20 utenti)

| Infra | Target | Tipico |
|-------|--------|--------|
| Local | < 0.3s | 0.2s |
| Supabase Free | < 2s | 1.2s |
| Supabase Pro | < 1s | 0.6s |
| Supabase Enterprise | < 0.5s | 0.3s |

Basato su: 3 query parallele per utente (60 query totali)

### PB Flow (save + read)

| Componente | Target | Tipico |
|------------|--------|--------|
| Save 3 PB | < 500ms | 150ms |
| Read back | < 300ms | 80ms |
| Total | < 800ms | 230ms |

---

## 🔧 Variare i Test

### Test Custom
Modifica parametri in `stress-test-runner.js`:

```javascript
const testProfiles = {
  custom: {
    sessions: 200,    // Custom: 200 sessioni
    users: 75,        // Custom: 75 utenti
    description: '🎯 MY CUSTOM TEST',
    useCase: 'Test specifico per il mio case'
  }
};
```

Poi:
```bash
node scripts/stress-test-runner.js custom
```

### Test Specifici

**Solo Writespeed:**
Modifica `massive-stress-test.js` e commenta Fase 2-4

**Solo Readspeed:**
Commenta Fase 1, esegui Fase 2

---

## 🐛 Troubleshooting Comune

### Errore: "No function found with name insert_full_training_session"
**Causa:** RPC non creata
**Soluzione:** Esegui `db-schema.sql` su Supabase

### Writespeed troppo lento (< 2/sec)
**Causa:** Indici mancanti o query complessa
**Soluzione:** 
1. Esegui `db-optimize.sql`
2. Verifica indici: `SELECT * FROM pg_indexes WHERE tablename = 'training_sessions';`

### Readspeed troppo lenta (> 5s)
**Causa:** Query non ottimizzate
**Soluzione:**
1. Usa EXPLAIN ANALYZE su Supabase SQL Editor
2. Aggiungi indice su `is_personal_best`

### Mismatch PB (Salvati ≠ Recuperati)
**Causa:** Foreign key constraints o trigger
**Soluzione:**
1. Verifica Foreign Keys
2. Controlla RLS policies

---

## 📊 Integration con CI/CD

Per automatizzare stress test:

```yaml
# .github/workflows/stress-test.yml
name: Stress Test
on:
  schedule:
    - cron: '0 2 * * 1'  # Ogni lunedì alle 2 AM
jobs:
  stress-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:stress:heavy
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_KEY }}
```

---

## 📞 Prossimi Passi

✅ Hai stress test suite setup
✅ Conosci i 4 comandi npm
✅ Sai interpretare i risultati

**Azione 1:** Esegui `npm run test:stress:quick` per verificare setup
**Azione 2:** Se ✅, esegui `npm run test:stress:full` per full benchmark
**Azione 3:** Salva i risultati per comparazione futura
**Azione 4:** Deploy su Cloudflare Pages quando pronto

