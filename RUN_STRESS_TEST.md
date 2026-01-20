# 🧪 STRESS TEST MASSIVO - SUBITO PRONTO ALL'USO!

**Setup completato:** 20 Gennaio 2026

---

## ⚡ Avvia il Test in 30 Secondi

Copia-incolla questo comando nel terminale:

```bash
npm run test:stress:quick
```

Aspetta ~30 secondi e guarda i risultati.

---

## 📊 Cosa Otterrai

Vedrai un report come questo:

```
=== MASSIVE STRESS TEST SUITE ===

✅ Connessione Supabase OK
✅ RPC insert_full_training_session disponibile

=== Fase 1: Inserimento Massivo (10 sessioni) ===
✅ Inserite 10 sessioni in 1.42s
Velocità: 7.0 sessioni/sec
✅ BUONO

=== Fase 2: Letture Concorrenti (5 utenti simultanei) ===
✅ Completate 5 letture in 0.23s
Velocità: 21.7 utenti/sec
✅ VELOCE

=== Fase 3: Test Flusso Personal Bests ===
✅ Salvati 3 PB in 0.12s
✅ Letti 3 race + 0 strength PB in 0.08s
✅ CONSISTENTE

=== RAPPORTO STRESS TEST ===

1. WRITESPEED: 7.0 sessioni/sec ✅
2. READSPEED: 0.23s per 5 utenti ✅
3. PB FLOW: Salvati 3 = Recuperati 3 ✅

🎉 TEST COMPLETATO
```

---

## ✅ Cosa Significa

- **✅ Verde ovunque** = Sistema OK, procedi!
- **⚠️ Giallo** = Performance OK ma potrebbe migliorare
- **❌ Rosso** = Problema, leggi troubleshooting

---

## 🚀 Prossimi Test

Dopo che il test quick passa:

### Test Standard (1 minuto)
```bash
npm run test:stress
```
50 sessioni, 20 utenti = rappresenta 1 mese di dati

### Test Pesante (2-3 minuti)
```bash
npm run test:stress:heavy
```
100 sessioni, 50 utenti = rappresenta 1 mese intenso

### Test Completo (10 minuti)
```bash
npm run test:stress:full
```
365 sessioni, 100 utenti = 1 anno di dati + carico massimo

---

## 📚 Documentazione Completa

Se hai domande:

- **[docs/STRESS_TEST_README.md](docs/STRESS_TEST_README.md)** ← Inizia qui
- **[docs/STRESS_TEST_QUICK_START.md](docs/STRESS_TEST_QUICK_START.md)** ← Comandi pronti
- **[docs/STRESS_TEST_GUIDE.md](docs/STRESS_TEST_GUIDE.md)** ← Guida completa
- **[docs/STRESS_TEST_SYSTEM.md](docs/STRESS_TEST_SYSTEM.md)** ← Come funziona

---

## 🎯 Se Hai Problemi

### Errore: "VITE_ variables not found"
```bash
# Verifica che .env abbia:
cat .env | grep VITE_SUPABASE

# Se manca, aggiungi:
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=...
```

### Test è molto lento (> 5 secondi)
1. Esegui `db-optimize.sql` su Supabase
2. Riprova il test

### Altro problema
Leggi: [docs/STRESS_TEST_GUIDE.md](docs/STRESS_TEST_GUIDE.md)

---

## 💡 Suggerimento

**Salva i risultati per il futuro:**

```bash
# Salva output a file
npm run test:stress > stress-results-$(date +%Y-%m-%d).txt

# Prossima volta, compara i risultati
diff stress-results-2025-01-20.txt stress-results-2025-01-21.txt
```

---

## 🎉 Buona Fortuna!

Esegui:
```bash
npm run test:stress:quick
```

E inizia il test! 🚀

