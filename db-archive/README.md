# 🗄️ Database Archive - File SQL Deprecati

Questa cartella contiene i vecchi file SQL sostituiti dalla nuova struttura organizzata.

## ❌ File Deprecati

Questi file sono stati sostituiti dai nuovi file nella root del progetto:

### ✅ Sostituiti da `db-schema.sql`
- `supabase-schema.sql` - Schema base
- `supabase-athlete-schema.sql` - Schema atleta (integrato)

### ✅ Sostituiti da `db-optimize.sql`
- `supabase-rls-policy.sql` - Row Level Security

### ✅ Sostituiti da `db-reset.sql`
- `supabase-complete-reset.sql` - Reset completo
- `supabase-cleanup-only.sql` - Solo pulizia

### ⚠️ Mantenuti se necessari
- `supabase-rpc-insert-session.sql` - Stored procedure (se usata dall'app)
- `supabase-seed.sql` - Dati di test (utile per sviluppo)

---

## 🆕 Nuova Struttura (Root)

Usa questi file invece:

1. **db-schema.sql** - Schema completo tabelle
2. **db-optimize.sql** - Ottimizzazioni (indici + RLS + cascading)
3. **db-reset.sql** - Reset completo con reinstallazione

Vedi [DATABASE_GUIDE.md](../DATABASE_GUIDE.md) per dettagli.

---

## 🗑️ Pulizia Consigliata

Questi file possono essere eliminati definitivamente dopo aver verificato che:
- ✅ `db-schema.sql` funziona correttamente
- ✅ `db-optimize.sql` è stato eseguito con successo
- ✅ L'app si connette al database senza errori

```bash
# Solo se sei sicuro!
rm -rf db-archive/
```

---

**Data archiviazione**: 20 Gennaio 2026
