# 🧪 Stress Test Massivo - Sistema Completo

**Ultimo aggiornamento:** 20 Gennaio 2026

Ho creato una **suite di stress test massiva e professionale** per benchmarkare il tuo sistema Training Log. Il sistema simula scenario realistici: inserimento bulk di sessioni, letture concorrenti, ciclo Personal Bests, e genera un report dettagliato con misure di performance.

---

## 🎯 4 Scenari di Test Pronti all'Uso

```bash
npm run test:stress:quick     # ⚡ Veloce: 10 sessioni, 5 utenti (30 sec)
npm run test:stress           # 📊 Standard: 50 sessioni, 20 utenti (1 min)
npm run test:stress:heavy     # 🔥 Pesante: 100 sessioni, 50 utenti (2-3 min)
npm run test:stress:full      # 💪 Completo: 365 sessioni, 100 utenti (5-10 min)
```

---

## 📁 Cosa è Stato Creato

### Scripts
- **`scripts/tests/massive-stress-test.js`** (850 righe)
  - Core dello stress test con 4 fasi
  - Automaticamente pulisce i dati dopo i test
  - Report colorato ANSI con metriche dettagliate

- **`scripts/stress-test-runner.js`** (70 righe)
  - Wrapper per facilità d'uso
  - Selettore di profili (quick/standard/heavy/full)
  - Genera script temporaneo con parametri custom

### Documentazione (3 file)
- **`docs/STRESS_TEST_QUICK_START.md`** 
  👉 **LEGGI QUESTO PER INIZIARE** - 4 comandi, risultati attesi, interpretazione
  
- **`docs/STRESS_TEST_GUIDE.md`** 
  📘 Guida completa - Come interpretare numeri, troubleshooting, ottimizzazioni
  
- **`docs/STRESS_TEST_SYSTEM.md`** 
  🏗️ Architettura e design - Come funziona il sistema, metriche, CI/CD

---

## 🚀 Quick Start (2 Minuti)

### Passo 1: Verifica Environment
```bash
# Assicurati che .env abbia credenziali Supabase:
cat .env
# Deve mostrare:
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=...
```

### Passo 2: Esegui Test Quick
```bash
npm run test:stress:quick
```

Aspettati un output come:
```
=== MASSIVE STRESS TEST SUITE ===
✅ Connessione Supabase OK
✅ RPC insert_full_training_session disponibile
...
✅ Inserite 10 sessioni in 1.42s
Velocità: 7.0 sessioni/sec
...
🎉 TEST COMPLETATO
```

### Passo 3: Interpreta Risultati
- **✅ Verde ovunque** → Sistema OK, procedi con test standard
- **⚠️ Giallo** → Performance OK ma potrebbe migliorare
- **❌ Rosso** → Problema, vedi [STRESS_TEST_GUIDE.md](docs/STRESS_TEST_GUIDE.md#-troubleshooting)

---

## 📊 4 Fasi di Test Spiegate

### 1️⃣ Fase 1: WRITESPEED (Inserimento Massivo)
```
Simula: Un atleta ha 1 anno di allenamenti da importare
Misura: Sessioni/secondo
Target: > 5/sec
Cosa testa: RPC performance, indici INSERT, bulk operations
```

### 2️⃣ Fase 2: READSPEED (Letture Concorrenti)
```
Simula: 20 utenti guardano la dashboard contemporaneamente
Misura: Utenti/secondo, tempo totale
Target: < 2 secondi per 20 utenti
Cosa testa: Query optimization, indice su date, is_personal_best
```

### 3️⃣ Fase 3: PB FLOW (Personal Bests)
```
Simula: Estrazione → Salvataggio → Lettura di PB
Misura: Salvati vs Recuperati (must match 100%)
Target: 100% consistenza
Cosa testa: Foreign keys, constraints, completezza del ciclo
```

### 4️⃣ Fase 4: CLEANUP (Pulizia)
```
Pulizia: Rimuove tutte le sessioni e PB di test
Verifica: Database rimane pulito, niente dati sporchi
```

---

## 🎨 Interpretare i Risultati

### WRITESPEED

```
Velocità: 7.8 sessioni/sec ✅ BUONO
```

| Velocità | Verdict | Azione |
|----------|---------|--------|
| > 10/sec | ✅ ECCELLENTE | Perfetto, niente da fare |
| 5-10/sec | ✅ BUONO | OK per uso normale |
| 2-5/sec | ⚠️ LENTO | Aggiungi indici |
| < 2/sec | ❌ CRITICO | Ottimizza schema |

### READSPEED

```
Tempo totale: 0.95s per 20 utenti ✅ VELOCE
```

| Tempo | Verdict | Azione |
|------|---------|--------|
| < 1s | ✅ VELOCE | Dashboard fluida |
| 1-2s | ✅ OK | Acceptable |
| 2-5s | ⚠️ LENTO | Aggiungi indici |
| > 5s | ❌ CRITICO | Problema grave |

### PB FLOW

```
Salvati: 3, Recuperati: 3 ✅ CONSISTENTE
```

Se mismatch → Vedi troubleshooting

---

## 📈 Progression Test (Consigliato)

Esegui i test in questo ordine:

**Giorno 1 - Setup Verification**
```bash
npm run test:stress:quick      # 30 secondi
# Verifica che sistema funzioni
```

**Giorno 2 - Standard Benchmark**
```bash
npm run test:stress            # 1 minuto
# Baseline di performance
```

**Giorno 3 - Load Test**
```bash
npm run test:stress:heavy      # 2-3 minuti
# Come si comporta con 1 mese di dati
```

**Giorno 4 - Production Stress**
```bash
npm run test:stress:full       # 5-10 minuti
# Test massivo 1 anno + 100 utenti simultanei
```

Confronta i risultati:
```bash
# Salva output per comparazione
npm run test:stress:full > stress-results-2025-01-20.txt

# Confronta con giorno precedente
diff stress-results-2025-01-20.txt stress-results-2025-01-19.txt
```

---

## 🔧 Customizzare i Test

### Option 1: Usare Profili Predefiniti
```bash
npm run test:stress:quick      # 10 sessioni
npm run test:stress            # 50 sessioni (default)
npm run test:stress:heavy      # 100 sessioni
npm run test:stress:full       # 365 sessioni
```

### Option 2: Modificare Profili
Modifica `scripts/stress-test-runner.js`:

```javascript
const testProfiles = {
  custom: {
    sessions: 200,
    users: 75,
    description: '🎯 MIO TEST CUSTOM',
    useCase: 'Test specifico per il mio caso'
  }
};
```

Poi:
```bash
node scripts/stress-test-runner.js custom
```

### Option 3: Editare lo Script Core
Modifica `scripts/tests/massive-stress-test.js`:
```javascript
const sessionsToInsert = 200;   // Cambia qui
const concurrentUsers = 50;      // E qui
```

Esegui direttamente:
```bash
node scripts/tests/massive-stress-test.js
```

---

## 🐛 Troubleshooting

### Errore: "VITE_SUPABASE_URL not found"
```bash
# Verifica .env
cat .env

# Se non esiste, crealo:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-key-here
```

### Errore: "No function found with name insert_full_training_session"
```bash
# La RPC non è stata creata
# Esegui db-schema.sql su Supabase SQL Editor
```

### Writespeed troppo lento (< 2/sec)
```bash
# Mancano indici
# Esegui db-optimize.sql su Supabase
# Poi ripeti il test
```

### Readspeed troppo lenta (> 5s)
```sql
-- Supabase SQL Editor:
EXPLAIN ANALYZE
SELECT * FROM race_records 
WHERE is_personal_best = true 
ORDER BY created_at DESC 
LIMIT 10;

-- Se non usa indice, crealo:
CREATE INDEX idx_race_pb ON race_records(is_personal_best) 
WHERE is_personal_best = true;
```

**Vedi [STRESS_TEST_GUIDE.md](docs/STRESS_TEST_GUIDE.md) per troubleshooting completo**

---

## 📚 Documentazione Completa

| File | Contenuto | Quando leggerlo |
|------|----------|-----------------|
| **[STRESS_TEST_QUICK_START.md](docs/STRESS_TEST_QUICK_START.md)** | 4 comandi pronti, risultati attesi | PRIMA (entry point) |
| **[STRESS_TEST_GUIDE.md](docs/STRESS_TEST_GUIDE.md)** | Come interpretare numeri, troubleshooting dettagliato | Se hai problemi |
| **[STRESS_TEST_SYSTEM.md](docs/STRESS_TEST_SYSTEM.md)** | Architettura, design, 4 fasi dettagliate | Se vuoi capire come funziona |

---

## 🎯 Prossimi Passi

### Passo 1: Esegui Test Quick (5 min)
```bash
npm run test:stress:quick
```
Se ✅ → continua a Passo 2

### Passo 2: Esegui Test Standard (1 min)
```bash
npm run test:stress
```
Se ✅ → continua a Passo 3

### Passo 3: Esegui Test Full (10 min)
```bash
npm run test:stress:full
```
Se ✅ → Sistema pronto per produzione

### Passo 4: Deploy
```bash
npm run build
npm run pages:dev              # Staging
# Test end-to-end con app reale
npm run pages:build            # Production
```

---

## 💡 Pro Tips

1. **Esegui test in orari tranquilli** - Non durante il lavoro, non durante esami
2. **Monitora Supabase Dashboard** - Apri il dashboard mentre il test corre, vedi le query in tempo reale
3. **Salva i risultati** - `npm run test:stress > results-$(date +%Y-%m-%d).txt` per tracciare trend
4. **Ripeti dopo ottimizzazioni** - Se aggiungi indici, ripeti il test per verificare miglioramenti
5. **Inizia con quick** - Non saltare direttamente a full test

---

## 📞 Info Aggiuntive

### Tempo di Esecuzione Tipico

| Profilo | Tempo | Datapoints |
|---------|-------|-----------|
| quick | ~30 sec | 10 insert, 5 read |
| standard | ~1 min | 50 insert, 20 read |
| heavy | ~2-3 min | 100 insert, 50 read |
| full | ~5-10 min | 365 insert, 100 read |

### Performance Expected

**Supabase Free Tier:**
- Writespeed: 5-10 sessioni/sec
- Readspeed: 10-20 utenti/sec
- Total time heavy: 2-4 minuti

**Supabase Pro:**
- Writespeed: 15-25 sessioni/sec
- Readspeed: 30-50 utenti/sec
- Total time heavy: 1-2 minuti

---

## 🎉 Sintesi

✅ **Suite stress test completa e pronta all'uso**
✅ **4 profili di test predefiniti** (quick/standard/heavy/full)
✅ **Documentazione completa** con troubleshooting
✅ **Cleanup automatico** - Non lascia dati sporchi
✅ **Report colorato** - Facile da leggere e interpretare

**Prossimo:** Esegui `npm run test:stress:quick` per iniziare! 🚀

