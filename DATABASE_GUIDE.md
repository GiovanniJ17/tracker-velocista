# 📊 Guida Database - Training Log

Guida rapida per gestire il database Supabase del progetto Training Log.

## 📁 File SQL Organizzati

### 1. **db-schema.sql** - Schema Completo
**Scopo**: Creazione delle tabelle del database

**Quando usarlo**:
- Setup iniziale del database
- Creazione di nuove tabelle
- Riferimento per la struttura del database

**Contenuto**:
- 9 tabelle principali (athlete_profile, training_sessions, workout_groups, workout_sets, race_records, strength_records, training_records, injury_history, monthly_stats)
- Tutti i constraint e check
- Foreign keys con ON DELETE CASCADE/SET NULL
- Commenti descrittivi

**Come eseguirlo**:
```sql
-- Copia tutto il contenuto di db-schema.sql
-- Incolla nell'SQL Editor di Supabase
-- Esegui
```

---

### 2. **db-optimize.sql** - Ottimizzazioni
**Scopo**: Migliorare performance e sicurezza

**Quando usarlo**:
- Dopo aver creato le tabelle (prima volta)
- Quando il database diventa lento
- Per applicare le policy di sicurezza RLS

**Contenuto**:
- **Parte 1**: Cascading Deletes (cancellazione automatica record collegati)
- **Parte 2**: 13 indici di performance per velocizzare query
- **Parte 3**: Row Level Security (RLS) policies

**Come eseguirlo**:
```sql
-- Copia tutto il contenuto di db-optimize.sql
-- Incolla nell'SQL Editor di Supabase
-- Esegui (può richiedere 10-30 secondi)
```

**Query di verifica incluse**:
- Elenco indici creati
- Elenco policy RLS attive

---

### 3. **db-reset.sql** - Reset Completo
**Scopo**: Pulizia totale e reinstallazione

⚠️ **ATTENZIONE**: Questo script **CANCELLA TUTTI I DATI**!

**Quando usarlo**:
- Errori gravi nello schema
- Vuoi ripartire da zero
- Testing di sviluppo

**Contenuto**:
- Fase 1: Disabilita RLS
- Fase 2: Drop di tutte le tabelle
- Fase 3: Ricrea schema completo
- Fase 4: Applica tutte le ottimizzazioni

**Come eseguirlo**:
```sql
-- ⚠️ BACKUP PRIMA DI ESEGUIRE!
-- Copia tutto il contenuto di db-reset.sql
-- Incolla nell'SQL Editor di Supabase
-- Esegui
```

---

## 🚀 Setup da Zero (Prima Volta)

### Step 1: Crea le Tabelle
```sql
-- Esegui db-schema.sql
```

### Step 2: Ottimizza il Database
```sql
-- Esegui db-optimize.sql
```

### Step 3: Verifica
```sql
-- Controlla che le tabelle esistano
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Dovrebbero esserci 9 tabelle:
-- athlete_profile, training_sessions, workout_groups, workout_sets,
-- race_records, strength_records, training_records, 
-- injury_history, monthly_stats
```

---

## 🔧 Manutenzione Ordinaria

### Quando il Database è Lento
```sql
-- Ri-esegui solo la Parte 2 di db-optimize.sql (indici)
```

### Aggiungere una Nuova Tabella
1. Modifica `db-schema.sql`
2. Esegui solo il CREATE TABLE della nuova tabella
3. Aggiungi indici in `db-optimize.sql` se necessario

### Modificare una Tabella Esistente
```sql
-- Esempio: Aggiungere una colonna
ALTER TABLE public.training_sessions 
ADD COLUMN weather text;

-- Esempio: Modificare un constraint
ALTER TABLE public.training_sessions
DROP CONSTRAINT IF EXISTS training_sessions_rpe_check,
ADD CONSTRAINT training_sessions_rpe_check 
  CHECK (rpe >= 0 AND rpe <= 10);
```

---

## 📊 Query Utili

### Verifica Integrità Database
```sql
-- Conta record per tabella
SELECT 'training_sessions' as table_name, COUNT(*) FROM training_sessions
UNION ALL
SELECT 'workout_groups', COUNT(*) FROM workout_groups
UNION ALL
SELECT 'workout_sets', COUNT(*) FROM workout_sets
UNION ALL
SELECT 'race_records', COUNT(*) FROM race_records
UNION ALL
SELECT 'strength_records', COUNT(*) FROM strength_records
UNION ALL
SELECT 'training_records', COUNT(*) FROM training_records;
```

### Verifica Indici
```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Verifica RLS Policy
```sql
SELECT 
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public';
```

---

## ⚠️ Problemi Comuni

### "Cannot delete session: violates foreign key constraint"
**Causa**: Cascading deletes non configurati
**Soluzione**: Esegui la Parte 1 di `db-optimize.sql`

### Query lente su date/filtri
**Causa**: Indici mancanti
**Soluzione**: Esegui la Parte 2 di `db-optimize.sql`

### "Permission denied" quando inserisci dati
**Causa**: RLS attivo ma policy non configurate
**Soluzione**: Esegui la Parte 3 di `db-optimize.sql`

---

## 🗑️ File SQL Deprecati

I seguenti file possono essere eliminati o archiviati:
- ❌ `supabase-schema.sql` (sostituito da `db-schema.sql`)
- ❌ `supabase-complete-reset.sql` (sostituito da `db-reset.sql`)
- ❌ `supabase-cleanup-only.sql` (integrato in `db-reset.sql`)
- ❌ `supabase-rls-policy.sql` (integrato in `db-optimize.sql`)
- ⚠️ `supabase-athlete-schema.sql` (mantieni solo se ha logica specifica)
- ⚠️ `supabase-rpc-insert-session.sql` (mantieni se usato dall'app)
- ⚠️ `supabase-seed.sql` (mantieni per dati di test)

---

## 📝 Note Tecniche

### Cascading Deletes
- `ON DELETE CASCADE`: Cancella automaticamente i record figli
- `ON DELETE SET NULL`: Setta a NULL la foreign key (per injury_history)

### Indici Creati
1. **Foreign Keys**: idx_*_session, idx_*_group (join veloci)
2. **Date**: idx_*_date (filtri temporali)
3. **Composite**: idx_training_sessions_date_type (query statistiche)
4. **Partial**: idx_*_pb WHERE is_personal_best (solo PB)

### RLS Policy
- Policy attuali: permissive per uso personale (`USING (true)`)
- Per multi-utente: aggiungere filtri su `auth.uid()` o `user_id`

---

## 🎯 Prossimi Passi

1. ✅ Esegui `db-schema.sql` su Supabase
2. ✅ Esegui `db-optimize.sql` su Supabase
3. ✅ Verifica che l'app funzioni correttamente
4. ✅ Archivia/elimina i vecchi file SQL
5. 🔄 Testa inserimento/modifica/cancellazione sessioni
