import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore'
import { format } from 'date-fns'
import { firestore } from '../lib/firebase'
import { standardizeTrainingSession } from '../utils/standardizer.js'
// PB/Injury writes handled locally to avoid slow per-doc writes.

const BATCH_LIMIT = 450
const COMMIT_TIMEOUT_MS = 20000

function chunkArray(items, size) {
  const chunks = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

async function commitBatches(ops) {
  const chunks = chunkArray(ops, BATCH_LIMIT)
  for (const chunk of chunks) {
    const batch = writeBatch(firestore)
    chunk.forEach(({ ref, data }) => batch.set(ref, data))
    console.log(`[trainingService] Committing batch (${chunk.length} writes)...`)
    const commitPromise = batch.commit()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore batch commit timeout')), COMMIT_TIMEOUT_MS)
    })
    try {
      await Promise.race([commitPromise, timeoutPromise])
      console.log('[trainingService] Batch commit completed')
    } catch (error) {
      if (error?.message !== 'Firestore batch commit timeout') {
        throw error
      }
      console.warn('[trainingService] Batch commit timed out, falling back to single writes')
      for (const { ref, data } of chunk) {
        console.log('[trainingService] Writing doc:', ref.path)
        const writePromise = setDoc(ref, data)
        const writeTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Firestore single write timeout')), COMMIT_TIMEOUT_MS)
        })
        await Promise.race([writePromise, writeTimeout])
      }
      console.log('[trainingService] Fallback single writes completed')
    }
  }
}

async function deleteBatches(refs) {
  const chunks = chunkArray(refs, BATCH_LIMIT)
  for (const chunk of chunks) {
    const batch = writeBatch(firestore)
    chunk.forEach((ref) => batch.delete(ref))
    const commitPromise = batch.commit()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore batch delete timeout')), COMMIT_TIMEOUT_MS)
    })
    await Promise.race([commitPromise, timeoutPromise])
  }
}

async function insertTrainingSession(parsedData) {
  const standardizedData = standardizeTrainingSession(parsedData)

  const sessionRef = doc(collection(firestore, 'training_sessions'))
  const now = new Date().toISOString()
  const sessionPayload = {
    date: standardizedData.session.date,
    title: standardizedData.session.title,
    type: standardizedData.session.type,
    location: standardizedData.session.location || null,
    rpe: standardizedData.session.rpe ?? null,
    feeling: standardizedData.session.feeling || null,
    notes: standardizedData.session.notes || null,
    created_at: now,
    updated_at: now
  }

  const ops = [{ ref: sessionRef, data: sessionPayload }]

  for (const group of standardizedData.groups || []) {
    const groupRef = doc(collection(sessionRef, 'workout_groups'))
    const groupPayload = {
      session_id: sessionRef.id,
      session_date: standardizedData.session.date,
      session_type: standardizedData.session.type,
      name: group.name,
      order_index: group.order_index,
      notes: group.notes || null,
      created_at: now,
      updated_at: now
    }
    ops.push({ ref: groupRef, data: groupPayload })

    for (const set of group.sets || []) {
      const setRef = doc(collection(groupRef, 'workout_sets'))
      const setPayload = {
        session_id: sessionRef.id,
        session_date: standardizedData.session.date,
        session_type: standardizedData.session.type,
        group_id: groupRef.id,
        group_name: group.name,
        exercise_name: set.exercise_name || 'Esercizio',
        category: set.category || 'other',
        sets: set.sets ?? null,
        reps: set.reps ?? null,
        weight_kg: set.weight_kg ?? null,
        distance_m: set.distance_m ?? null,
        time_s: set.time_s ?? null,
        recovery_s: set.recovery_s ?? null,
        notes: set.notes || null,
        details: set.details || null,
        is_personal_best: set.is_personal_best || false,
        created_at: now,
        updated_at: now
      }
      ops.push({ ref: setRef, data: setPayload })
    }
  }

  await commitBatches(ops)

  return { success: true, sessionId: sessionRef.id, sessionDate: standardizedData.session.date }
}

/**
 * Salva automaticamente i PB e infortuni estratti dal parsing
 * Ottimizzato per ridurre le query al database e prevenire stack depth errors
 */
async function saveExtractedRecords(sessionId, sessionDate, personalBests = [], injuries = []) {
  try {
    console.log('[trainingService] Saving extracted records...', {
      personalBestsCount: personalBests.length,
      injuriesCount: injuries.length
    })
    const now = new Date().toISOString()
    const ops = []

    for (const pb of personalBests) {
      if (pb.type === 'race') {
        const ref = doc(collection(firestore, 'race_records'))
        ops.push({
          ref,
          data: {
            session_id: sessionId,
            distance_m: pb.distance_m ?? null,
            time_s: pb.time_s ?? null,
            is_personal_best: true,
            notes: pb.notes || null,
            date: sessionDate || null,
            created_at: now
          }
        })
      } else if (pb.type === 'training') {
        const ref = doc(collection(firestore, 'training_records'))
        ops.push({
          ref,
          data: {
            session_id: sessionId,
            exercise_name: pb.exercise_name || null,
            exercise_type: pb.exercise_type || 'sprint',
            performance_value: pb.performance_value ?? null,
            performance_unit: pb.performance_unit || 'seconds',
            rpe: pb.rpe ?? null,
            notes: pb.notes || null,
            is_personal_best: true,
            date: sessionDate || null,
            created_at: now
          }
        })
      } else if (pb.type === 'strength') {
        const ref = doc(collection(firestore, 'strength_records'))
        ops.push({
          ref,
          data: {
            session_id: sessionId,
            exercise_name: pb.exercise_name || null,
            category: pb.category || null,
            weight_kg: pb.weight_kg ?? null,
            reps: pb.reps || 1,
            notes: pb.notes || null,
            is_personal_best: true,
            date: sessionDate || null,
            created_at: now
          }
        })
      }
    }

    for (const injury of injuries) {
      const ref = doc(collection(firestore, 'injury_history'))
      ops.push({
        ref,
        data: {
          injury_type: injury.injury_type,
          body_part: injury.body_part,
          start_date: sessionDate || new Date().toISOString().split('T')[0],
          end_date: injury.end_date || null,
          severity: injury.severity,
          cause_session_id: sessionId,
          notes: injury.notes || null,
          created_at: now,
          updated_at: now
        }
      })
    }

    if (ops.length > 0) {
      await commitBatches(ops)
    }

    return { success: true }
  } catch (error) {
    console.warn('Errore nel salvataggio record estratti:', error)
    // Non fallire il salvataggio della sessione se fallisce il salvataggio dei record
    return { success: false, error: error.message }
  }
}

/**
 * Salva una singola sessione (retrocompatibilità)
 */
export async function saveTrainingSession(parsedData) {
  try {
    return await insertTrainingSession(parsedData)
  } catch (error) {
    console.error('Errore nel salvataggio:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Salva più sessioni in sequenza (per input multi-giorno)
 * Estrae e salva anche automaticamente PB e infortuni
 */
export async function saveTrainingSessions(parsedPayload) {
  const sessions = Array.isArray(parsedPayload.sessions) ? parsedPayload.sessions : [parsedPayload]

  const personalBests = parsedPayload.personalBests || []
  const injuries = parsedPayload.injuries || []

  const savedIds = []

  for (const [idx, session] of sessions.entries()) {
    try {
      // Log per debugging
      console.log(`Salvataggio sessione ${idx + 1}/${sessions.length}:`, {
        date: session.session?.date,
        title: session.session?.title,
        groupsCount: session.groups?.length
      })

      const result = await insertTrainingSession(session)
      if (!result.success) {
        const errorMsg = `Sessione ${idx + 1}: ${result.error || 'Errore sconosciuto'}`
        console.error(errorMsg)
        return { success: false, error: errorMsg, savedIds }
      }
      savedIds.push(result.sessionId)

      // Salva i PB e infortuni solo per la prima sessione per evitare duplicati
      if (idx === 0 && (personalBests.length > 0 || injuries.length > 0)) {
        console.log(`Salvataggio PB/infortuni per sessione ${idx + 1}`)
        const recordsPromise = saveExtractedRecords(
          result.sessionId,
          result.sessionDate,
          personalBests,
          injuries
        )
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout salvataggio PB/infortuni')), COMMIT_TIMEOUT_MS)
        })
        await Promise.race([recordsPromise, timeoutPromise])
      }
    } catch (error) {
      console.error('Errore nel salvataggio multi-sessione:', error)
      const errorMsg = error.message || 'Errore sconosciuto'

      return { success: false, error: `Sessione ${idx + 1}: ${errorMsg}`, savedIds }
    }
  }

  return { success: true, sessionIds: savedIds }
}

/**
 * Recupera tutte le sessioni di allenamento
 */
export async function getTrainingSessions(limit = 50, offset = 0) {
  try {
    const sessionRef = collection(firestore, 'training_sessions')
    const q = query(sessionRef, orderBy('date', 'desc'), limit(limit + offset))
    const snapshot = await getDocs(q)
    const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    const sliced = items.slice(offset, offset + limit)
    return { success: true, data: sliced }
  } catch (error) {
    console.error('Errore nel recupero sessioni:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Recupera una sessione completa con tutti i gruppi ed esercizi
 */
export async function getSessionDetails(sessionId) {
  try {
    const sessionRef = doc(firestore, 'training_sessions', sessionId)
    const sessionSnap = await getDoc(sessionRef)
    if (!sessionSnap.exists()) {
      return { success: false, error: 'Sessione non trovata' }
    }

    const groupsQuery = query(
      collection(sessionRef, 'workout_groups'),
      orderBy('order_index', 'asc')
    )
    const groupsSnap = await getDocs(groupsQuery)

    const groupsWithSets = await Promise.all(
      groupsSnap.docs.map(async (groupDoc) => {
        const groupData = { id: groupDoc.id, ...groupDoc.data() }
        const setsSnap = await getDocs(collection(groupDoc.ref, 'workout_sets'))
        const sets = setsSnap.docs.map((setDoc) => ({ id: setDoc.id, ...setDoc.data() }))
        return { ...groupData, sets }
      })
    )

    return {
      success: true,
      data: {
        id: sessionSnap.id,
        ...sessionSnap.data(),
        groups: groupsWithSets
      }
    }
  } catch (error) {
    console.error('Errore nel recupero dettagli:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Elimina una sessione di allenamento (cascade delete)
 */
export async function deleteTrainingSession(sessionId) {
  try {
    const sessionRef = doc(firestore, 'training_sessions', sessionId)
    const groupsSnap = await getDocs(collection(sessionRef, 'workout_groups'))
    const ops = []
    for (const groupDoc of groupsSnap.docs) {
      const setsSnap = await getDocs(collection(groupDoc.ref, 'workout_sets'))
      setsSnap.docs.forEach((setDoc) => ops.push({ ref: setDoc.ref, data: null }))
      ops.push({ ref: groupDoc.ref, data: null })
    }
    if (ops.length) {
      await deleteBatches(ops.map(({ ref }) => ref))
    }
    await deleteDoc(sessionRef)

    // Clean derived records linked to this session
    const raceSnap = await getDocs(
      query(collection(firestore, 'race_records'), where('session_id', '==', sessionId))
    )
    const trainingSnap = await getDocs(
      query(collection(firestore, 'training_records'), where('session_id', '==', sessionId))
    )
    const strengthSnap = await getDocs(
      query(collection(firestore, 'strength_records'), where('session_id', '==', sessionId))
    )
    const injurySnap = await getDocs(
      query(collection(firestore, 'injury_history'), where('cause_session_id', '==', sessionId))
    )

    const relatedRefs = [
      ...raceSnap.docs.map((docSnap) => docSnap.ref),
      ...trainingSnap.docs.map((docSnap) => docSnap.ref),
      ...strengthSnap.docs.map((docSnap) => docSnap.ref),
      ...injurySnap.docs.map((docSnap) => docSnap.ref)
    ]
    if (relatedRefs.length) {
      await deleteBatches(relatedRefs)
    }

    return { success: true }
  } catch (error) {
    console.error("Errore nell'eliminazione:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Statistiche avanzate con algoritmi
 */
export async function getTrainingStats(startDate, endDate) {
  try {
    let sessionQuery = query(collection(firestore, 'training_sessions'), orderBy('date', 'asc'))
    if (startDate) {
      sessionQuery = query(sessionQuery, where('date', '>=', startDate))
    }
    if (endDate) {
      sessionQuery = query(sessionQuery, where('date', '<=', endDate))
    }
    const sessionSnap = await getDocs(sessionQuery)
    const sessions = sessionSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))

    // Ottieni gli ID delle sessioni nel periodo
    const sessionIds = sessions.map((s) => s.id)

    if (sessionIds.length === 0) {
      return {
        success: true,
        data: {
          totalSessions: 0,
          avgRPE: null,
          typeDistribution: {},
          totalDistanceKm: '0.00',
          totalWeightKg: '0',
          currentStreak: 0,
          sessions: []
        }
      }
    }

    // Recupera i gruppi per queste sessioni
    const sets = []
    for (const session of sessions) {
      const sessionRef = doc(firestore, 'training_sessions', session.id)
      const groupsSnap = await getDocs(collection(sessionRef, 'workout_groups'))
      for (const groupDoc of groupsSnap.docs) {
        const setsSnap = await getDocs(collection(groupDoc.ref, 'workout_sets'))
        setsSnap.docs.forEach((setDoc) => {
          sets.push({ id: setDoc.id, ...setDoc.data() })
        })
      }
    }

    // Calcola statistiche base
    const totalSessions = sessions.length

    // RPE medio (solo sessioni con RPE)
    const sessionsWithRPE = sessions.filter((s) => s.rpe !== null && s.rpe !== undefined)
    const avgRPE =
      sessionsWithRPE.length > 0
        ? sessionsWithRPE.reduce((sum, s) => sum + s.rpe, 0) / sessionsWithRPE.length
        : null

    // Distribuzione tipi
    const typeDistribution = sessions.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1
      return acc
    }, {})

    // Volume totale distanza (somma distance_m * sets)
    const totalDistance = sets
      .filter((s) => s.distance_m)
      .reduce((sum, s) => sum + s.distance_m * (s.sets || 1), 0)

    // Volume totale peso (somma weight_kg * reps * sets)
    const totalWeight = sets
      .filter((s) => s.weight_kg && s.reps)
      .reduce((sum, s) => sum + s.weight_kg * s.reps * (s.sets || 1), 0)

    // Calcola streak (giorni consecutivi) - usa TUTTE le sessioni non solo quelle filtrate
    const allSnap = await getDocs(
      query(collection(firestore, 'training_sessions'), orderBy('date', 'desc'))
    )
    const allSessions = allSnap.docs.map((docSnap) => docSnap.data())
    const streak = calculateStreak(allSessions)

    return {
      success: true,
      data: {
        totalSessions,
        avgRPE: avgRPE !== null ? avgRPE.toFixed(1) : null,
        typeDistribution,
        totalDistanceKm: (totalDistance / 1000).toFixed(2),
        totalWeightKg: totalWeight.toFixed(0),
        currentStreak: streak,
        sessions
      }
    }
  } catch (error) {
    console.error('Errore nel recupero statistiche:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calcola streak di allenamenti consecutivi
 */
function calculateStreak(sessions) {
  if (sessions.length === 0) return 0

  // Ottieni le date uniche (possono esserci più sessioni nello stesso giorno)
  const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  if (uniqueDates.length === 0) return 0

  // Trova la data più recente nel database
  const mostRecentDate = new Date(uniqueDates[0])
  mostRecentDate.setHours(0, 0, 0, 0)

  let streak = 1 // Conta la prima data
  let currentDate = new Date(mostRecentDate)

  // Conta all'indietro le date consecutive
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i])
    prevDate.setHours(0, 0, 0, 0)

    // Calcola la data attesa (giorno precedente)
    const expectedDate = new Date(currentDate)
    expectedDate.setDate(expectedDate.getDate() - 1)

    // Verifica se è consecutiva
    if (prevDate.getTime() === expectedDate.getTime()) {
      streak++
      currentDate = new Date(prevDate)
    } else {
      // Interrompi se non consecutiva
      break
    }
  }

  return streak
}

/**
 * Recupera sessioni per un giorno specifico
 */
export async function getSessionsByDate(date) {
  try {
    const dateStr = date instanceof Date ? format(date, 'yyyy-MM-dd') : date
    const q = query(collection(firestore, 'training_sessions'), where('date', '==', dateStr))
    const snapshot = await getDocs(q)
    const sessions = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    return { success: true, data: sessions }
  } catch (error) {
    console.error('Errore nel recupero sessioni per data:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Recupera sessioni per un mese (optimizzato per vista calendario)
 */
export async function getSessionsForMonth(year, month) {
  try {
    const startDate = format(new Date(year, month, 1), 'yyyy-MM-dd')
    const endDate = format(new Date(year, month + 1, 0), 'yyyy-MM-dd')
    const q = query(
      collection(firestore, 'training_sessions'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    )
    const snapshot = await getDocs(q)
    const sessions = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

    // Organizza per data
    const sessionsByDate = {}
    sessions.forEach((session) => {
      if (!sessionsByDate[session.date]) {
        sessionsByDate[session.date] = []
      }
      sessionsByDate[session.date].push(session)
    })

    return { success: true, data: sessionsByDate }
  } catch (error) {
    console.error('Errore nel recupero sessioni per mese:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Aggiorna una sessione di allenamento (metadati)
 */
export async function updateTrainingSession(sessionId, updates) {
  try {
    const sessionRef = doc(firestore, 'training_sessions', sessionId)
    const payload = {
      updated_at: new Date().toISOString()
    }
    if (updates.title !== undefined) payload.title = updates.title
    if (updates.type !== undefined) payload.type = updates.type
    if (updates.location !== undefined) payload.location = updates.location
    if (updates.rpe !== undefined) payload.rpe = updates.rpe
    if (updates.feeling !== undefined) payload.feeling = updates.feeling
    if (updates.notes !== undefined) payload.notes = updates.notes
    await updateDoc(sessionRef, payload)
    const snap = await getDoc(sessionRef)
    return { success: true, data: { id: snap.id, ...snap.data() } }
  } catch (error) {
    console.error("Errore nell'aggiornamento sessione:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Aggiorna un singolo esercizio (workout set)
 */
export async function updateWorkoutSet(setId, updates) {
  try {
    const q = query(
      collectionGroup(firestore, 'workout_sets'),
      where(documentId(), '==', setId),
      limit(1)
    )
    const snap = await getDocs(q)
    if (snap.empty) return { success: false, error: 'Set non trovato' }
    const ref = snap.docs[0].ref
    const updateObj = {}
    if (updates.exercise_name !== undefined) updateObj.exercise_name = updates.exercise_name
    if (updates.category !== undefined) updateObj.category = updates.category
    if (updates.sets !== undefined) updateObj.sets = updates.sets
    if (updates.reps !== undefined) updateObj.reps = updates.reps
    if (updates.weight_kg !== undefined) updateObj.weight_kg = updates.weight_kg
    if (updates.distance_m !== undefined) updateObj.distance_m = updates.distance_m
    if (updates.time_s !== undefined) updateObj.time_s = updates.time_s
    if (updates.recovery_s !== undefined) updateObj.recovery_s = updates.recovery_s
    if (updates.notes !== undefined) updateObj.notes = updates.notes
    if (updates.details !== undefined) updateObj.details = updates.details
    updateObj.updated_at = new Date().toISOString()
    await updateDoc(ref, updateObj)
    const docSnap = await getDoc(ref)
    return { success: true, data: { id: docSnap.id, ...docSnap.data() } }
  } catch (error) {
    console.error("Errore nell'aggiornamento esercizio:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Aggiorna un gruppo di esercizi
 */
export async function updateWorkoutGroup(groupId, updates) {
  try {
    const q = query(
      collectionGroup(firestore, 'workout_groups'),
      where(documentId(), '==', groupId),
      limit(1)
    )
    const snap = await getDocs(q)
    if (snap.empty) return { success: false, error: 'Gruppo non trovato' }
    const ref = snap.docs[0].ref
    const payload = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) payload.name = updates.name
    if (updates.notes !== undefined) payload.notes = updates.notes
    if (updates.order_index !== undefined) payload.order_index = updates.order_index
    await updateDoc(ref, payload)
    const docSnap = await getDoc(ref)
    return { success: true, data: { id: docSnap.id, ...docSnap.data() } }
  } catch (error) {
    console.error("Errore nell'aggiornamento gruppo:", error)
    return { success: false, error: error.message }
  }
}
