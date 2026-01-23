import { describe, expect, it } from 'vitest'
import {
  calculateVolume,
  formatDistance,
  formatTime,
  formatWeight,
  getCategoryEmoji,
  getRPEColor,
  getSessionTypeColor,
  standardizeExerciseName
} from './formatters'

describe('formatters', () => {
  it('formats distance in meters and kilometers', () => {
    expect(formatDistance()).toBe('-')
    expect(formatDistance(250)).toBe('250 m')
    expect(formatDistance(1500)).toBe('1.50 km')
  })

  it('formats time in seconds and minutes', () => {
    expect(formatTime()).toBe('-')
    expect(formatTime(45)).toBe('45s')
    expect(formatTime(90)).toBe('1:30')
  })

  it('formats weight', () => {
    expect(formatWeight()).toBe('-')
    expect(formatWeight(60)).toBe('60 kg')
  })

  it('gets session type and category fallbacks', () => {
    expect(getSessionTypeColor('pista')).toContain('bg-blue-500')
    expect(getSessionTypeColor('unknown')).toContain('bg-gray-500')
    expect(getCategoryEmoji('sprint')).toBe('⚡')
    expect(getCategoryEmoji('unknown')).toBe('📝')
  })

  it('gets RPE colors', () => {
    expect(getRPEColor(2)).toBe('text-green-400')
    expect(getRPEColor(5)).toBe('text-yellow-400')
    expect(getRPEColor(7)).toBe('text-orange-400')
    expect(getRPEColor(9)).toBe('text-red-400')
  })

  it('calculates volume', () => {
    expect(calculateVolume({ weight_kg: 50, sets: 3, reps: 5 })).toBe(750)
    expect(calculateVolume({ weight_kg: 50, sets: 0, reps: 5 })).toBeNull()
  })

  it('standardizes exercise names', () => {
    expect(standardizeExerciseName('  100 metri ')).toBe('sprint 100m')
    expect(standardizeExerciseName('SQUAT')).toBe('squat')
    expect(standardizeExerciseName('Pull Up')).toBe('trazioni')
    expect(standardizeExerciseName('Nuovo Esercizio')).toBe('Nuovo esercizio')
  })
})
