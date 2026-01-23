/**
 * Context Service - RAG Pattern for AI
 * Recupera contesto storico e PB per rendere l'AI context-aware
 */

import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { firestore } from '../lib/firebase'

/**
 * Recupera il contesto dell'atleta per migliorare il parsing AI
 * Include: PB attuali, ultime sessioni, infortuni attivi, pattern ricorrenti
 */
export async function getAthleteContext() {
  try {
    const withTimeout = async (promise, ms, fallback) => {
      let timeoutId
      const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), ms)
      })
      const result = await Promise.race([promise, timeoutPromise])
      clearTimeout(timeoutId)
      return result
    }

    const [personalBests, recentSessions, activeInjuries, commonPatterns] = await Promise.all([
      withTimeout(getPersonalBests(), 3000, { sprint: [], strength: [] }),
      withTimeout(getRecentSessionTitles(5), 3000, []),
      withTimeout(getActiveInjuries(), 3000, []),
      withTimeout(getCommonExercisePatterns(), 3000, { warmup: [] })
    ])

    const context = {
      personalBests,
      recentSessions,
      activeInjuries,
      commonPatterns
    }

    return formatContextForAI(context)
  } catch (error) {
    console.error('[contextService] Error fetching context:', error)
    return ''
  }
}

/**
 * Recupera i Personal Bests attuali (top 5 per categoria)
 */
async function getPersonalBests() {
  const pbs = {
    sprint: [],
    strength: []
  }

  const recentSessions = await getRecentSessionsDetailed(10)
  const sprintPBs = []
  const strengthPBs = []

  recentSessions.forEach((session) => {
    session.workout_groups?.forEach((group) => {
      group.workout_sets?.forEach((set) => {
        if (
          set.category === 'sprint' &&
          set.is_personal_best &&
          set.distance_m != null &&
          set.time_s != null
        ) {
          sprintPBs.push({ ...set, session_date: session.date })
        }
        if (set.category === 'lift' && set.is_personal_best && set.weight_kg != null) {
          strengthPBs.push({ ...set, session_date: session.date })
        }
      })
    })
  })

  if (sprintPBs.length) {
    const byDistance = {}
    sprintPBs.forEach((pb) => {
      if (!byDistance[pb.distance_m] || pb.time_s < byDistance[pb.distance_m].time_s) {
        byDistance[pb.distance_m] = pb
      }
    })
    pbs.sprint = Object.values(byDistance).slice(0, 5)
  }

  if (strengthPBs.length) {
    const byExercise = {}
    strengthPBs.forEach((pb) => {
      const key = (pb.exercise_name || '').toLowerCase()
      if (!byExercise[key] || pb.weight_kg > byExercise[key].weight_kg) {
        byExercise[key] = pb
      }
    })
    pbs.strength = Object.values(byExercise).slice(0, 5)
  }

  return pbs
}

/**
 * Recupera i titoli delle ultime N sessioni per pattern recognition
 */
async function getRecentSessionTitles(limitCount = 5) {
  const sessions = await getRecentSessionsDetailed(limitCount)
  return sessions.map((session) => ({
    date: session.date,
    title: session.title,
    type: session.type
  }))
}

/**
 * Recupera infortuni attivi (senza end_date)
 */
async function getActiveInjuries() {
  const q = query(collection(firestore, 'injury_history'), orderBy('start_date', 'desc'), limit(50))
  const snap = await getDocs(q)
  return snap.docs.map((docSnap) => docSnap.data()).filter((injury) => injury.end_date == null)
}

/**
 * Recupera pattern comuni di esercizi (es. "solito riscaldamento")
 * Trova gli esercizi più frequenti per tipo di sessione
 */
async function getCommonExercisePatterns() {
  const recentSessions = await getRecentSessionsDetailed(10)
  const warmupData = []

  recentSessions.forEach((session) => {
    session.workout_groups?.forEach((group) => {
      if ((group.name || '').toLowerCase().includes('riscald')) {
        ;(group.workout_sets || []).forEach((set) => warmupData.push(set))
      }
    })
  })

  if (!warmupData.length) return { warmup: [] }

  const frequency = {}
  warmupData.forEach((item) => {
    const name = (item.exercise_name || '').toLowerCase()
    if (!name) return
    frequency[name] = (frequency[name] || 0) + 1
  })

  const topWarmup = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  return { warmup: topWarmup }
}

async function getRecentSessionsDetailed(limitCount = 5) {
  const q = query(
    collection(firestore, 'training_sessions'),
    orderBy('date', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  const sessions = []
  for (const docSnap of snap.docs) {
    const session = { id: docSnap.id, ...docSnap.data(), workout_groups: [] }
    const groupsSnap = await getDocs(collection(docSnap.ref, 'workout_groups'))
    for (const groupDoc of groupsSnap.docs) {
      const group = { id: groupDoc.id, ...groupDoc.data(), workout_sets: [] }
      const setsSnap = await getDocs(collection(groupDoc.ref, 'workout_sets'))
      group.workout_sets = setsSnap.docs.map((setDoc) => ({ id: setDoc.id, ...setDoc.data() }))
      session.workout_groups.push(group)
    }
    sessions.push(session)
  }
  return sessions
}

/**
 * Formatta il contesto in una stringa leggibile per l'AI
 */
function formatContextForAI(context) {
  const lines = []

  lines.push('=== ATHLETE CONTEXT (Use this to interpret ambiguous data) ===')
  lines.push('')

  if (context.personalBests.sprint.length > 0) {
    lines.push('CURRENT SPRINT PBs:')
    context.personalBests.sprint.forEach((pb) => {
      lines.push(`  - ${pb.distance_m}m: ${pb.time_s}s (set on ${pb.session_date || 'unknown'})`)
    })
    lines.push('')
  }

  if (context.personalBests.strength.length > 0) {
    lines.push('CURRENT STRENGTH PBs:')
    context.personalBests.strength.forEach((pb) => {
      const repsInfo = pb.reps > 1 ? ` x${pb.reps} reps` : ''
      lines.push(
        `  - ${pb.exercise_name}: ${pb.weight_kg}kg${repsInfo} (set on ${pb.session_date || 'unknown'})`
      )
    })
    lines.push('')
  }

  if (context.recentSessions.length > 0) {
    lines.push('RECENT SESSIONS (last 5):')
    context.recentSessions.forEach((session) => {
      lines.push(`  - ${session.date}: ${session.title || session.type}`)
    })
    lines.push('')
  }

  if (context.activeInjuries.length > 0) {
    lines.push('⚠️ ACTIVE INJURIES (consider when interpreting high loads):')
    context.activeInjuries.forEach((injury) => {
      lines.push(
        `  - ${injury.body_part}: ${injury.injury_type} (${injury.severity}, since ${injury.start_date})`
      )
    })
    lines.push('')
  }

  if (context.commonPatterns.warmup.length > 0) {
    lines.push('STANDARD WARMUP (if user says "solito riscaldamento"):')
    context.commonPatterns.warmup.forEach((exercise) => {
      lines.push(`  - ${exercise}`)
    })
    lines.push('')
  }

  lines.push('=== END CONTEXT ===')
  lines.push('')

  return lines.join('\n')
}

/**
 * Calcola se un tempo/peso è sospetto (potenziale errore)
 * Es: 100m in 9s (impossibile), Squat 300kg per un amatore
 */
export function detectAnomalies(parsedData, context) {
  const warnings = []

  parsedData.groups?.forEach((group) => {
    group.sets?.forEach((set) => {
      if (set.distance_m === 100 && set.time_s && set.time_s < 9.5) {
        warnings.push({
          type: 'impossible_time',
          field: 'time_s',
          value: set.time_s,
          exercise: set.exercise_name,
          message: `100m in ${set.time_s}s sembra impossibile. Record mondiale ~9.58s. Intendevi 60m o ${set.time_s + 10}s?`
        })
      }

      if (set.weight_kg && context?.personalBests?.strength) {
        const pbForExercise = context.personalBests.strength.find(
          (pb) => pb.exercise_name.toLowerCase() === set.exercise_name.toLowerCase()
        )

        if (pbForExercise && set.weight_kg > pbForExercise.weight_kg * 1.5) {
          warnings.push({
            type: 'unusual_load',
            field: 'weight_kg',
            value: set.weight_kg,
            exercise: set.exercise_name,
            message: `${set.exercise_name} ${set.weight_kg}kg è +${Math.round((set.weight_kg / pbForExercise.weight_kg - 1) * 100)}% rispetto al PB (${pbForExercise.weight_kg}kg). Verifica il dato.`
          })
        }
      }
    })
  })

  return warnings
}
