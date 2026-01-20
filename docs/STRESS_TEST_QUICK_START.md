# 🚀 Stress Test - Quick Start

## 3 Comandi per Iniziare

### 1️⃣ Test Veloce (30 secondi)
```bash
npm run test:stress:quick
```
✅ Verifica che il sistema funzioni
📊 10 sessioni, 5 utenti concorrenti

### 2️⃣ Test Standard (1 minuto)
```bash
npm run test:stress
```
✅ Benchmark di default
📊 50 sessioni, 20 utenti concorrenti

### 3️⃣ Test Pesante (2-3 minuti)
```bash
npm run test:stress:heavy
```
✅ Carico elevato (come 1 mese di dati)
📊 100 sessioni, 50 utenti concorrenti

### 4️⃣ Test Completo (5-10 minuti)
```bash
npm run test:stress:full
```
✅ 1 anno di dati + carico massimo (TEST PRODUZIONE)
📊 365 sessioni, 100 utenti concorrenti

---

## Output Atteso

```
=== MASSIVE STRESS TEST SUITE ===

=== Verifica Connessione Database ===
✅ Connessione Supabase OK

=== Verifica RPC disponibile ===
✅ RPC insert_full_training_session disponibile

=== Fase 1: Inserimento Massivo (50 sessioni) ===
⏳ Inserendo 50 sessioni...
..................................................
✅ Inserite 50 sessioni in 6.42s
Velocità: 7.8 sessioni/sec

=== Fase 2: Letture Concorrenti (20 utenti simultanei) ===
⏳ Simulando 20 utenti che leggono dati...
....................
✅ Completate 20 letture pesanti simultanee in 0.95s
Velocità: 21.1 utenti/sec

=== Fase 3: Test Flusso Personal Bests (Salvataggio + Lettura) ===
⏳ Testing PB extraction and storage...
✅ Salvati 3 PB in 0.12s
✅ Letti 3 race + 0 strength PB in 0.08s

=== Fase 4: Pulizia Dati Test ===
⏳ Rimozione dati di test...
✅ Dati di test rimossi correttamente

=== RAPPORTO STRESS TEST ===

1. WRITESPEED (Inserimenti)
   Sessioni inserite: 50
   Durata: 6.42s
   Velocità: 7.8 sessioni/sec
   ✅ BUONO

2. READSPEED (Letture Concorrenti)
   Letture completate: 20
   Durata: 0.95s
   Velocità: 21.1 utenti/sec
   ✅ VELOCE

3. PERSONAL BESTS FLOW
   Salvati: 3
   Recuperati: 3
   ✅ CONSISTENTE

=== TEST COMPLETATO 🎉 ===
```

---

## 🎯 Interpretare i Risultati

### ✅ Green Light (Tutto OK)
- **Writespeed:** > 5 sessioni/sec
- **Readspeed:** < 2 secondi per 20 utenti
- **PB Flow:** Salvati = Recuperati

👉 **Azione:** Sistema pronto, puoi procedere con deploy

### ⚠️ Yellow Light (Attenzione)
- **Writespeed:** 2-5 sessioni/sec
- **Readspeed:** 2-4 secondi per 20 utenti
- **PB Flow:** Mismatch minore

👉 **Azione:** Aggiungi indici Supabase, poi ritest

### ❌ Red Light (Problema)
- **Writespeed:** < 2 sessioni/sec
- **Readspeed:** > 5 secondi per 20 utenti
- **PB Flow:** Mismatch significativo

👉 **Azione:** 
1. Leggi [STRESS_TEST_GUIDE.md](STRESS_TEST_GUIDE.md#-troubleshooting)
2. Verifica schema Supabase
3. Controlla indici con `db-optimize.sql`

---

## 📊 Comparazione Profili

| Profilo | Sessioni | Utenti | Tempo | Use Case |
|---------|----------|--------|-------|----------|
| quick | 10 | 5 | 30s | Verifica funzionamento |
| standard | 50 | 20 | 1m | Benchmark default |
| heavy | 100 | 50 | 2-3m | 1 mese dati |
| full | 365 | 100 | 5-10m | 1 anno dati + carico massimo |

---

## 🔧 Modificare i Test

### Aggiungi test custom
Modifica `scripts/stress-test-runner.js`:

```javascript
const testProfiles = {
  // ... profili esistenti ...
  custom: {
    sessions: 25,
    users: 10,
    description: 'MIO TEST CUSTOM',
    useCase: 'Uso personale'
  }
};
```

Poi esegui:
```bash
node scripts/stress-test-runner.js custom
```

---

## 📈 Tracciare Progress

Salva i risultati per confrontarli nel tempo:

```bash
# Salva output a file
npm run test:stress > stress-results-2025-01-20.txt

# Oppure
npm run test:stress >> logs/stress-test-history.log
```

Poi confronta i risultati:
```bash
tail -50 logs/stress-test-history.log
```

---

## 🐛 Se Fallisce

### Errore: "No VITE_ variables found"
```bash
# Verifica che .env esista
cat .env

# Deve contenere:
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### Errore: "No function found with name insert_full_training_session"
```bash
# Su Supabase SQL Editor, esegui:
SELECT EXISTS (
  SELECT 1 FROM pg_proc WHERE proname = 'insert_full_training_session'
);

# Se ritorna false, esegui db-schema.sql
```

### Test freezes o va very slow
```bash
# Prova con profilo piccolo:
npm run test:stress:quick

# Se ancora lento, potrebbero esserci problemi di rete
# Verifica connessione a Supabase
```

---

## 💡 Pro Tips

1. **Esegui test in orari tranquilli** (non durante lavoro)
2. **Monitora il dashboard Supabase** durante il test
3. **Confronta risultati nel tempo** per tracciare miglioramenti
4. **Inizia con `quick` per verificare setup**
5. **Usa `full` solo dopo che `heavy` passa bene**

---

## 📞 Prossimo Passo

Dopo che lo stress test passa con ✅:

1. **Deploy su Staging**
   ```bash
   npm run build
   npm run pages:dev
   ```

2. **Test end-to-end con App Reale**
   - Apri http://localhost:3000
   - Prova ad inserire allenamenti via UI
   - Verifica che Personal Bests vengano salvati
   - Controlla performance del dashboard

3. **Deploy su Produzione**
   ```bash
   npm run pages:build
   # Push a Cloudflare Pages
   ```

