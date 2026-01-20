# 🔥 Guida Stress Test Massivo

## Panoramica

Lo script `scripts/tests/massive-stress-test.js` esegue 4 fasi di benchmarking:

1. **Fase 1: Writespeed** - Inserisce 50 sessioni di allenamento (aumentabile a 365)
2. **Fase 2: Readspeed** - Simula 20 utenti che leggono dati simultaneamente
3. **Fase 3: PB Flow** - Testa il ciclo di salvataggio e lettura dei Personal Bests
4. **Fase 4: Cleanup** - Rimuove tutti i dati di test

---

## 📋 Prerequisiti

### 1. Installa `dotenv`
Se non è già installato:
```bash
npm install dotenv
```

### 2. Verifica `.env`
Il file `.env` deve contenere:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Verifica schema Supabase
Assicurati di aver eseguito `db-schema.sql` e `db-optimize.sql`:
```sql
-- Verifica tabelle
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

Dovrebbe mostrare:
- `athlete_profile`
- `training_sessions`
- `workout_groups`
- `workout_sets`
- `race_records`
- `strength_records`
- `training_records`
- `injury_history`
- `monthly_stats`

---

## 🚀 Come Eseguire

### Opzione 1: Test Standard (50 sessioni, 20 utenti)
```bash
node scripts/tests/massive-stress-test.js
```

**Tempo:** ~30-60 secondi

### Opzione 2: Test Pesante (365 sessioni = 1 anno, 50 utenti)
Modifica il file e cambia:
```javascript
const sessionsToInsert = 365;  // Era 50
const concurrentUsers = 50;     // Era 20
```

Poi esegui:
```bash
node scripts/tests/massive-stress-test.js
```

**Tempo:** ~2-5 minuti

---

## 📊 Interpretare i Risultati

### WRITESPEED (Inserimenti)

```
1. WRITESPEED (Inserimenti)
   Sessioni inserite: 50
   Durata: 12.34s
   Velocità: 4.05 sessioni/sec
   ⚠️  DA OTTIMIZZARE
```

**Cosa significano i numeri:**

| Velocità | Verdict | Azione |
|----------|---------|--------|
| > 10/sec | ✅ ECCELLENTE | Niente, perfetto |
| 5-10/sec | ✅ BUONO | Acceptable per uso normale |
| 2-5/sec | ⚠️ LENTO | Aggiungere indici |
| < 2/sec | ❌ CRITICO | Ottimizzare schema/query |

**Se troppo lento:**
1. Verifica che gli indici siano stati creati da `db-optimize.sql`:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'training_sessions';
   ```

2. Se mancano indici, esegui `db-optimize.sql` su Supabase

3. Verifica la RPC `insert_full_training_session`:
   ```sql
   \df insert_full_training_session
   ```

---

### READSPEED (Letture Concorrenti)

```
2. READSPEED (Letture Concorrenti)
   Letture completate: 20
   Durata: 0.87s
   Velocità: 23.0 utenti/sec
   ✅ VELOCE
```

**Cosa significano i numeri:**

| Tempo Total | Verdict | Azione |
|-------------|---------|--------|
| < 1s | ✅ VELOCE | Dashboard userà <50ms per utente |
| 1-2s | ✅ ACCETTABILE | Acceptable, ma near limit |
| 2-5s | ⚠️ LENTO | Aggiungere indici su date/is_personal_best |
| > 5s | ❌ CRITICO | Problema serio, verificare schema |

**Se troppo lento:**
1. Verifica indici su colonne frequentemente queryate:
   ```sql
   SELECT * FROM pg_indexes WHERE tablename IN ('race_records', 'training_sessions', 'monthly_stats');
   ```

2. Esegui EXPLAIN ANALYZE sulla query lenta:
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM race_records WHERE is_personal_best = true LIMIT 10;
   ```

---

### PERSONAL BESTS FLOW

```
3. PERSONAL BESTS FLOW
   Salvati: 3
   Recuperati: 3
   ✅ CONSISTENTE
```

**Cosa verificare:**

- **Mismatch (es: Salvati 3, Recuperati 2)?**
  - Verifica se ci sono errori nell'insert
  - Controlla i Foreign Keys tra tabelle
  - Verifica trigger RLS policies

- **Errori durante salvataggio?**
  - Controlla constraints (es: distance_m deve essere > 0)
  - Verifica che athlete_id esista

---

## 🧪 Test Specifici Avanzati

### Test A: Solo Writespeed (10 sessioni)
```bash
# Modifica il file:
const sessionsToInsert = 10;

node scripts/tests/massive-stress-test.js
```

### Test B: Solo Readspeed (5 utenti)
```bash
# Modifica il file:
const concurrentUsers = 5;

node scripts/tests/massive-stress-test.js
```

### Test C: Verifica RPC
```bash
# Creare script test-rpc.js:
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const result = await supabase.rpc('insert_full_training_session', {
  p_date: '2025-01-20',
  p_title: 'Test',
  p_type: 'pista',
  p_groups: []
});

console.log(result);
```

---

## 📈 Benchmark Targets (Obiettivi)

Basato su una architettura Supabase standard:

### Per 100 record
- **Writespeed:** 50-100 sessioni/sec (con RPC)
- **Readspeed:** 100+ utenti/sec (con indici)
- **PB Flow:** <500ms per ciclo salva+leggi

### Per 1000+ record
- **Writespeed:** 10-20 sessioni/sec (slight slowdown)
- **Readspeed:** 20-50 utenti/sec (con indici)
- **PB Flow:** <200ms per ciclo (tabelle dedicate)

### Per 10000+ record
- **Writespeed:** 2-5 sessioni/sec (need optimization)
- **Readspeed:** 5-10 utenti/sec (need partitioning)
- **PB Flow:** <100ms (indexed queries)

---

## 🔧 Ottimizzazioni se Troppo Lento

### 1. Aggiungere Indici
```sql
CREATE INDEX idx_race_records_pb ON race_records(is_personal_best) 
WHERE is_personal_best = true;

CREATE INDEX idx_training_sessions_date ON training_sessions(date DESC);
```

### 2. Verificare RLS Policies
Policies complicate aggiungono latenza. Se non necessari:
```sql
-- Disabilita RLS per test
ALTER TABLE training_sessions DISABLE ROW LEVEL SECURITY;
```

### 3. Usare Bulk Operations
Lo script supporta sia RPC che Direct Insert. RPC è ~2x più veloce:
```javascript
// RPC è preferito:
useRPC = true
```

### 4. Limitare Scope Test
Per debug iniziale:
```javascript
const sessionsToInsert = 10;  // Inizia piccolo
const concurrentUsers = 5;
```

---

## 🐛 Troubleshooting

### Errore: "No function found with name insert_full_training_session"
**Soluzione:** Esegui `db-schema.sql` su Supabase per creare la RPC

### Errore: "Connection refused"
**Soluzione:** Verifica che `.env` contiene credenziali Supabase corrette

### Errore: "invalid JSON in request body"
**Soluzione:** Lo script fallisce a inserire dati malformati. Verifica il formato di `p_groups`

### Letture molto lente (> 5s per 20 utenti)
**Soluzione:**
1. Aggiungi indici con `db-optimize.sql`
2. Verifica che le RLS policies non siano complicate
3. Usa `EXPLAIN ANALYZE` per debug

### Discrepanza PB (Salvati ≠ Recuperati)
**Soluzione:**
1. Verifica che `is_personal_best` sia settato a `true`
2. Controlla che le note siano exatte: "Test stress"
3. Verifica Foreign Keys

---

## 📝 Risultati Tipici (Local Supabase)

Questi sono i tempi attesi su una istanza locale:

```
1. WRITESPEED (50 sessioni)
   Velocità: 15-25 sessioni/sec ✅

2. READSPEED (20 utenti)
   Velocità: 30-50 utenti/sec ✅
   Tempo totale: 0.4-0.7s

3. PERSONAL BESTS FLOW
   Save: ~200ms
   Read: ~150ms
   Total: ~350ms ✅
```

Tempi su **Supabase Cloud** (free tier):
```
1. WRITESPEED (50 sessioni)
   Velocità: 5-10 sessioni/sec (latenza rete)

2. READSPEED (20 utenti)
   Velocità: 10-20 utenti/sec
   Tempo totale: 1-2s

3. PERSONAL BESTS FLOW
   Save: ~500ms
   Read: ~300ms
   Total: ~800ms
```

---

## 📊 Eseguire Test Periodici

Per monitorare performance nel tempo:

```bash
# Crea uno schedule (ogni settimana)
# Windows Task Scheduler oppure:

# macOS/Linux (crontab)
0 2 * * 1 cd /path/to/training-log && node scripts/tests/massive-stress-test.js >> logs/stress-test.log

# Poi analizza trends:
tail -100 logs/stress-test.log | grep "Velocità:"
```

---

## 🎯 Prossimi Passi

Se lo stress test passa bene (velocità > 5 sessioni/sec, < 2s per 20 utenti):
1. ✅ Ambiente pronto per staging
2. ✅ Deploy su Cloudflare Pages (frontend)
3. ✅ Configura Worker AI proxy
4. ✅ Test end-to-end in produzione

Se ci sono problemi:
1. 📊 Identifica il bottleneck (vedi Troubleshooting)
2. 🔧 Applica ottimizzazioni
3. 🔁 Ripeuti il test

---

## 📞 Feedback

Se riscontri risultati anomali:
1. Salva l'output completo del test
2. Nota numero record in DB (`SELECT COUNT(*) FROM training_sessions;`)
3. Verifica se RPC è disponibile
4. Controlla latenza Supabase con semplice ping

