# Supabase Database Management

This directory contains SQL scripts for managing the Supabase database.

## 📋 Scripts

### `supabase-complete-reset.sql` ⚠️ **FULL RESET**
**Use when:** You want to completely rebuild the database with the latest schema.

**What it does:**
1. Drops ALL tables (deletes all data)
2. Recreates all tables in correct dependency order
3. Enables Row Level Security (RLS) with permissive policies
4. Creates indexes for performance optimization
5. Adds the RPC function `insert_full_training_session()` for atomic transactions
6. Creates triggers for automatic monthly stats aggregation
7. Seeds sample data (2 training sessions)

**How to use:**
```sql
-- Copy entire script from supabase-complete-reset.sql
-- Paste into Supabase Dashboard > SQL Editor
-- Click "Run" button
-- Wait for completion (should see "Cleanup Complete!" message)
```

**⚠️ WARNING:** This deletes all existing data. Make a backup first!

---

### `supabase-cleanup-only.sql` 🧹 **DATA CLEANUP**
**Use when:** You want to delete all data but keep the schema intact.

**What it does:**
1. Deletes all data from all tables
2. Resets auto-increment sequences
3. Shows verification counts
4. Optional: Re-seeds fresh sample data (commented block)

**How to use:**
```sql
-- Copy entire script from supabase-cleanup-only.sql
-- Paste into Supabase Dashboard > SQL Editor
-- Click "Run" button
```

---

### Other SQL Files

| File | Purpose | How to Use |
|------|---------|-----------|
| `supabase-schema.sql` | Reference schema (documentation) | For reference only, do not execute |
| `supabase-rls-policy.sql` | RLS policies (old) | Included in complete-reset.sql, deprecated |
| `supabase-rpc-insert-session.sql` | RPC function (old version) | Included in complete-reset.sql, updated |
| `supabase-seed.sql` | Sample data (old) | Included in complete-reset.sql, updated |
| `supabase-athlete-schema.sql` | Athlete profile (old) | Included in complete-reset.sql |

---

## 🚀 Recommended Setup Flow

### For Fresh Start:
```
1. Create new Supabase project
2. Run supabase-complete-reset.sql
3. Start using the app
```

### For Existing Project:
```
Option A - Reset Everything:
1. Backup your data
2. Run supabase-complete-reset.sql
3. Verify tables and sample data
4. Start using the app

Option B - Keep Schema, Clear Data:
1. Backup your data
2. Run supabase-cleanup-only.sql
3. Your schema remains intact
4. Optional: uncomment seed block to reload sample data
```

---

## 📊 Database Schema

The final database contains 6 tables:

### 1. `athlete_profile`
Athlete information (name, birth date, weight, height, specialization, etc.)

### 2. `training_sessions`
Main training session record (date, type, RPE, feeling, notes)

**Types:** pista, palestra, strada, gara, test, scarico, recupero, altro

### 3. `workout_groups`
Groups of exercises within a session (warmup, main work, cool down)

### 4. `workout_sets`
Individual exercises with details (exercise_name, sets, reps, weight, distance, time, etc.)

**Categories:** sprint, jump, lift, endurance, mobility, drill, other

### 5. `injury_history`
Injury tracking (type, body_part, dates, severity, notes)

**Severity:** minor, moderate, severe

### 6. `monthly_stats`
Automatically aggregated monthly statistics (total distance, time, sets count, avg RPE)

---

## 🔐 Security (RLS Policies)

All tables have Row Level Security enabled with **permissive policies** allowing full access.

### For Multi-User Apps:
If you need to restrict data per user, modify the policies:

```sql
-- Replace the permissive policy with:
CREATE POLICY "Users can only see their own data" 
  ON public.training_sessions 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
```

---

## ⚙️ RPC Functions & Triggers

### `insert_full_training_session()`
**Purpose:** Insert a complete training session with all groups and sets in a single atomic transaction.

**Usage:**
```javascript
// In your app
const { data, error } = await supabase.rpc('insert_full_training_session', {
  p_date: '2026-01-19',
  p_title: 'Sprint workout',
  p_type: 'pista',
  p_location: 'Stadium',
  p_rpe: 8,
  p_feeling: 'Good',
  p_notes: 'Fast session',
  p_groups: [
    {
      order_index: 0,
      name: 'Warmup',
      notes: '10 min easy run',
      sets: [
        {
          exercise_name: 'Jogging',
          category: 'endurance',
          distance_m: 1000
        }
      ]
    },
    {
      order_index: 1,
      name: 'Main work',
      sets: [
        {
          exercise_name: 'Sprint 200m',
          category: 'sprint',
          sets: 6,
          distance_m: 200,
          time_s: 25.5,
          recovery_s: 180
        }
      ]
    }
  ]
});
```

**Benefits:**
- ✅ Atomic: All-or-nothing transaction
- ✅ No orphan records (groups without sessions)
- ✅ Fast: Single database call
- ✅ Deduplication built-in

---

### `update_monthly_stats()` (Trigger)
**Purpose:** Automatically recalculate monthly statistics whenever training data changes.

**What it calculates:**
- `total_distance_km`: Sum of all distance_m in the month
- `total_time_h`: Sum of all time_s converted to hours
- `total_sets`: Count of all workout_sets
- `avg_rpe`: Average RPE of sessions in the month
- `sessions_count`: Number of training_sessions

**When it runs:**
- After INSERT on `training_sessions`
- After UPDATE on `training_sessions`
- After INSERT on `workout_sets`

---

## 📈 Indexes

Created for performance optimization:

```sql
-- Quick session lookups
idx_training_sessions_date      -- Sessions sorted by date
idx_training_sessions_type      -- Filter by session type

-- Foreign key relationships
idx_workout_groups_session      -- Find groups in session
idx_workout_sets_group          -- Find exercises in group
idx_injury_history_session      -- Find injuries from session

-- Statistics
idx_monthly_stats_year_month    -- Quick stats lookup
```

---

## ✅ Verification

After running `supabase-complete-reset.sql`, you should see:

```
✓ 6 tables created
✓ 6 indexes created
✓ RLS enabled on all tables
✓ RPC function registered
✓ 3 triggers created
✓ Sample data loaded (2 sessions, 5 groups, 6 sets)
✓ monthly_stats calculated
```

---

## 🆘 Troubleshooting

### "Table already exists" error
- Run `supabase-complete-reset.sql` completely (it drops tables first)
- Or run `supabase-cleanup-only.sql` to clear data only

### "RPC function not found"
- Ensure the complete-reset script ran successfully
- Check that `insert_full_training_session` appears in Function Editor

### "monthly_stats not updating"
- Check that triggers were created: `SELECT * FROM pg_trigger`
- Manually insert data: New data should auto-calculate stats
- Or manually call trigger:
  ```sql
  SELECT update_monthly_stats();
  ```

### "Permission denied" errors
- Ensure RLS policies are created with `FOR ALL USING (true)`
- Check that your user has appropriate permissions
- For Supabase, this is usually automatic with service role

---

## 📝 Notes

- All `updated_at` timestamps are automatically set to `now()` on insert
- Foreign keys have `ON DELETE CASCADE` for safety
- UUID primary keys are auto-generated
- Sample data uses relative dates (CURRENT_DATE) for timelessness
- Monthly stats start empty; they populate after first session insertion

---

## 🔄 Migration from Old Schema

The new schema removes these obsolete tables:
- ❌ `strength_records` (merged into workout_sets)
- ❌ `training_records` (merged into workout_sets)
- ❌ `race_records` (not used in UI)

All data is now consolidated in `workout_sets` with flexible `category` and `details` fields.

---

**Last Updated:** 2026-01-19
**Version:** 2.0 (Complete Reset)
