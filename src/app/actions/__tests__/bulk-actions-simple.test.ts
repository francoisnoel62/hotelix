import { describe, test, expect } from 'vitest'
import {
  updateMultipleInterventionStatut
} from '../intervention'
import { StatutIntervention } from '@prisma/client'

describe('Bulk Actions - Simple Test', () => {
  test('updateMultipleInterventionStatut should return error for non-existing interventions', async () => {
    const result = await updateMultipleInterventionStatut(
      [999999], // ID qui n'existe pas
      StatutIntervention.EN_COURS,
      999999  // User ID qui n'existe pas non plus
    )

    console.log('Result:', result)
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})