import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  addDoc
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'

const WRITE_TIMEOUT_MS = 15000

async function withTimeout(promise, label) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} timeout`)), WRITE_TIMEOUT_MS)
  })
  return Promise.race([promise, timeoutPromise])
}

/**
 * Recupera il profilo atleta
 */
export async function getAthleteProfile() {
  try {
    const ref = doc(firestore, 'athlete_profile', 'default')
    const snap = await getDoc(ref)
    return { success: true, data: snap.exists() ? { id: snap.id, ...snap.data() } : null }
  } catch (error) {
    console.error('Errore nel recupero profilo atleta:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Aggiorna il profilo atleta
 */
export async function updateAthleteProfile(updates) {
  try {
    const ref = doc(firestore, 'athlete_profile', 'default')
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    await withTimeout(setDoc(ref, payload, { merge: true }), 'updateAthleteProfile')
    const snap = await getDoc(ref)
    return { success: true, data: { id: snap.id, ...snap.data() } }
  } catch (error) {
    console.error("Errore nell'aggiornamento profilo:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Recupera i PB in gara
 */
export async function getRaceRecords() {
  try {
    const q = query(collection(firestore, 'race_records'), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    const data = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    return { success: true, data }
  } catch (error) {
    console.error('Errore nel recupero race records:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Aggiungi un record di gara
 * NOTA: I dati vengono già inseriti tramite insert_full_training_session.
 * Questa funzione è mantenuta per compatibilità ma non fa inserimenti.
 */
export async function addRaceRecord(sessionId, raceData) {
  try {
    const payload = {
      session_id: sessionId,
      distance_m: raceData.distance_m ?? null,
      time_s: raceData.time_s ?? null,
      is_personal_best: raceData.is_personal_best ?? false,
      notes: raceData.notes || null,
      date: raceData.date || null,
      created_at: new Date().toISOString()
    }
    const ref = await withTimeout(
      addDoc(collection(firestore, 'race_records'), payload),
      'addRaceRecord'
    )
    return { success: true, data: { id: ref.id, ...payload } }
  } catch (error) {
    console.error("Errore nell'aggiunta race record:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Recupera i PB di allenamento (sprint, salti, ecc.)
 */
export async function getTrainingRecords() {
  try {
    const q = query(collection(firestore, 'training_records'), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    const data = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    return { success: true, data }
  } catch (error) {
    console.error('Errore nel recupero training records:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Aggiungi un record di allenamento
 * NOTA: I dati vengono già inseriti tramite insert_full_training_session.
 * Questa funzione è mantenuta per compatibilità ma non fa inserimenti.
 */
export async function addTrainingRecord(sessionId, trainingData) {
  try {
    const payload = {
      session_id: sessionId,
      exercise_name: trainingData.exercise_name || null,
      exercise_type: trainingData.exercise_type || null,
      performance_value: trainingData.performance_value ?? null,
      performance_unit: trainingData.performance_unit || null,
      rpe: trainingData.rpe ?? null,
      notes: trainingData.notes || null,
      is_personal_best: trainingData.is_personal_best ?? false,
      date: trainingData.date || null,
      created_at: new Date().toISOString()
    }
    const ref = await withTimeout(
      addDoc(collection(firestore, 'training_records'), payload),
      'addTrainingRecord'
    )
    return { success: true, data: { id: ref.id, ...payload } }
  } catch (error) {
    console.error("Errore nell'aggiunta training record:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Recupera i massimali di forza
 */
export async function getStrengthRecords() {
  try {
    const q = query(collection(firestore, 'strength_records'))
    const snap = await getDocs(q)
    const data = snap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => {
        const categoryCompare = (a.category || '').localeCompare(b.category || '')
        if (categoryCompare !== 0) return categoryCompare
        return (b.created_at || '').localeCompare(a.created_at || '')
      })
    return { success: true, data }
  } catch (error) {
    console.error('Errore nel recupero strength records:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Recupera i massimali per categoria
 */
export async function getStrengthRecordsByCategory(category) {
  try {
    const q = query(collection(firestore, 'strength_records'), where('category', '==', category))
    const snap = await getDocs(q)
    const data = snap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    return { success: true, data }
  } catch (error) {
    console.error('Errore nel recupero strength records per categoria:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Aggiungi un massimale di forza
 * NOTA: I dati vengono già inseriti tramite insert_full_training_session.
 * Questa funzione è mantenuta per compatibilità ma non fa inserimenti.
 */
export async function addStrengthRecord(sessionId, strengthData) {
  try {
    const payload = {
      session_id: sessionId,
      exercise_name: strengthData.exercise_name || null,
      category: strengthData.category || null,
      weight_kg: strengthData.weight_kg ?? null,
      reps: strengthData.reps ?? null,
      notes: strengthData.notes || null,
      is_personal_best: strengthData.is_personal_best ?? false,
      date: strengthData.date || null,
      created_at: new Date().toISOString()
    }
    const ref = await withTimeout(
      addDoc(collection(firestore, 'strength_records'), payload),
      'addStrengthRecord'
    )
    return { success: true, data: { id: ref.id, ...payload } }
  } catch (error) {
    console.error("Errore nell'aggiunta strength record:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Recupera storico infortuni
 */
export async function getInjuryHistory() {
  try {
    const q = query(collection(firestore, 'injury_history'), orderBy('start_date', 'desc'))
    const snap = await getDocs(q)
    const data = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    return { success: true, data }
  } catch (error) {
    console.error('Errore nel recupero injury history:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Aggiungi un infortunio
 */
export async function addInjury(injuryData) {
  try {
    const payload = {
      injury_type: injuryData.injury_type,
      body_part: injuryData.body_part,
      start_date: injuryData.start_date,
      end_date: injuryData.end_date || null,
      severity: injuryData.severity,
      cause_session_id: injuryData.cause_session_id || null,
      notes: injuryData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    const ref = await withTimeout(
      addDoc(collection(firestore, 'injury_history'), payload),
      'addInjury'
    )
    return { success: true, data: { id: ref.id, ...payload } }
  } catch (error) {
    console.error("Errore nell'aggiunta infortunio:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Risolvi un infortunio (aggiungi end_date)
 */
export async function resolveInjury(injuryId, endDate) {
  try {
    const ref = doc(firestore, 'injury_history', injuryId)
    await withTimeout(
      updateDoc(ref, {
        end_date: endDate,
        updated_at: new Date().toISOString()
      }),
      'resolveInjury'
    )
    const snap = await getDoc(ref)
    return { success: true, data: { id: snap.id, ...snap.data() } }
  } catch (error) {
    console.error('Errore nella risoluzione infortunio:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Recupera PB personali dalle tabelle dedicate (ottimizzato)
 *
 * Legge direttamente dalle tabelle race_records, strength_records, training_records
 * invece di ricalcolare scansionando i workout_sets.
 *
 * Vantaggi:
 * - Molto più veloce (legge da tabelle con indici)
 * - Preciso (usa i dati ufficiali con flag is_personal_best)
 * - Mantiene separazione tra record ufficiali e allenamenti
 */
export async function getPersonalBests() {
  try {
    // Recuperando PB dalle tabelle dedicate

    // Leggi dai tre record type in parallelo
    const [raceResult, trainingResult, strengthResult] = await Promise.all([
      getRaceRecords(),
      getTrainingRecords(),
      getStrengthRecords()
    ])

    if (!raceResult.success || !trainingResult.success || !strengthResult.success) {
      throw new Error('Errore nel recupero uno o più tipi di PB')
    }

    // Filtra solo i record con is_personal_best = true
    const raceRecords = (raceResult.data || []).filter((r) => r.is_personal_best)
    const trainingRecords = (trainingResult.data || []).filter((t) => t.is_personal_best)
    const strengthRecords = (strengthResult.data || []).filter((s) => s.is_personal_best)

    return {
      success: true,
      data: {
        raceRecords,
        trainingRecords,
        strengthRecords
      }
    }
  } catch (error) {
    console.error('Errore nel recupero PB personali:', error)
    // Fallback: tenta il metodo legacy se c'è un errore
    console.warn('[athleteService] Fallback a getPersonalBestsFromWorkoutSets()')
    return await getPersonalBestsFromWorkoutSets()
  }
}

/**
 * Recupera i Personal Best analizzando workout_sets (LEGACY)
 *
 * DEPRECATO: Usato solo come fallback in getPersonalBests() se fallisce la lettura
 * dalle tabelle dedicate.
 *
 * Questo metodo è lento perché scansiona TUTTI i workout_sets e ricalcola i PB al volo.
 * Preferibilmente usa getPersonalBests() che legge dalle tabelle dedicate.
 *
 * Manteniamo questa funzione come fallback per compatibilità.
 */
export async function getPersonalBestsFromWorkoutSets() {
  try {
    const q = query(
      collectionGroup(firestore, 'workout_sets'),
      where('category', 'in', ['sprint', 'jump', 'lift']),
      limit(2000)
    )
    const snap = await getDocs(q)
    const workoutSets = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))

    // Raggruppa per categoria e trova i migliori
    // Traccia i migliori per ogni combinazione di esercizio/distanza
    const bestSprints = {}
    const bestJumps = {}
    const bestLifts = {}

    workoutSets?.forEach((set) => {
      const sessionDate = set.session_date
      const sessionType = set.session_type

      if (set.category === 'sprint' && set.distance_m && set.time_s) {
        const key = `${set.exercise_name}_${set.distance_m}m`
        if (!bestSprints[key] || set.time_s < bestSprints[key].time_s) {
          bestSprints[key] = {
            ...set,
            session_date: sessionDate,
            session_type: sessionType
          }
        }
      } else if (set.category === 'jump' && set.distance_m) {
        const key = set.exercise_name
        if (!bestJumps[key] || set.distance_m > bestJumps[key].distance_m) {
          bestJumps[key] = {
            ...set,
            session_date: sessionDate,
            session_type: sessionType
          }
        }
      } else if (set.category === 'lift' && set.weight_kg) {
        const key = set.exercise_name
        if (!bestLifts[key] || set.weight_kg > bestLifts[key].weight_kg) {
          bestLifts[key] = {
            ...set,
            session_date: sessionDate,
            session_type: sessionType
          }
        }
      }
    })

    // Converti in array per compatibilità con UI esistente
    const raceRecords = Object.values(bestSprints).map((pb) => ({
      id: pb.id,
      distance_m: pb.distance_m,
      time_s: pb.time_s,
      exercise_name: pb.exercise_name,
      notes: pb.notes,
      is_personal_best: true,
      training_sessions: [{ date: pb.session_date, type: pb.session_type }]
    }))

    const trainingRecords = Object.values(bestJumps).map((pb) => ({
      id: pb.id,
      exercise_name: pb.exercise_name,
      exercise_type: 'jump',
      performance_value: pb.distance_m,
      performance_unit: 'meters',
      notes: pb.notes,
      is_personal_best: true,
      training_sessions: [{ date: pb.session_date, type: pb.session_type }]
    }))

    const strengthRecords = Object.values(bestLifts).map((pb) => ({
      id: pb.id,
      exercise_name: pb.exercise_name,
      category: 'lift',
      weight_kg: pb.weight_kg,
      reps: pb.reps || 1,
      notes: pb.notes,
      is_personal_best: true,
      training_sessions: [{ date: pb.session_date, type: pb.session_type }]
    }))

    // PB caricati correttamente

    return {
      success: true,
      data: {
        raceRecords,
        trainingRecords,
        strengthRecords
      }
    }
  } catch (error) {
    console.error('Errore nel recupero PB da workout_sets:', error)
    return { success: false, error: error.message }
  }
}
