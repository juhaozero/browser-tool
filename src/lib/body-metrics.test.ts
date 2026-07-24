import { describe, expect, it } from 'vitest'
import {
  bodyFatDeurenberg,
  bodyFatFromWeight,
  bodyFatNavy,
  calculateBmi,
  classifyBmi,
  classifyBodyFat,
  cmToMeters,
  roundMetric,
} from '@/lib/body-metrics'

describe('body-metrics', () => {
  it('converts cm to meters', () => {
    expect(cmToMeters(175)).toBe(1.75)
  })

  it('calculates bmi and ideal weight', () => {
    const r = calculateBmi(70, 175)
    expect(r.bmi).toBe(22.9)
    expect(r.category.id).toBe('normal')
    expect(r.idealWeightMin).toBeCloseTo(56.7, 0)
    expect(r.idealWeightMax).toBeCloseTo(73.2, 0)
  })

  it('classifies chinese adult bmi bands', () => {
    expect(classifyBmi(18.4).id).toBe('underweight')
    expect(classifyBmi(18.5).id).toBe('normal')
    expect(classifyBmi(23.9).id).toBe('normal')
    expect(classifyBmi(24).id).toBe('overweight')
    expect(classifyBmi(27.9).id).toBe('overweight')
    expect(classifyBmi(28).id).toBe('obese')
  })

  it('estimates body fat with deurenberg', () => {
    // BMI 22.9, age 30, male → 1.2*22.9 + 0.23*30 - 10.8 - 5.4 = 18.18
    const male = bodyFatDeurenberg(22.9, 30, 'male')
    expect(male.percent).toBe(18.2)
    expect(male.category.id).toBe('average')

    const female = bodyFatFromWeight(55, 165, 28, 'female')
    expect(female.percent).toBeGreaterThan(20)
    expect(female.method).toBe('deurenberg')
  })

  it('estimates body fat with navy method', () => {
    const male = bodyFatNavy(175, 38, 80, 'male')
    expect(male.percent).toBeGreaterThan(5)
    expect(male.percent).toBeLessThan(30)
    expect(male.method).toBe('navy')

    const female = bodyFatNavy(165, 34, 70, 'female', 95)
    expect(female.percent).toBeGreaterThan(10)
    expect(female.percent).toBeLessThan(40)
  })

  it('rejects invalid navy inputs', () => {
    expect(() => bodyFatNavy(175, 40, 40, 'male')).toThrow(/腰围须大于颈围/)
    expect(() => bodyFatNavy(165, 34, 70, 'female')).toThrow(/臀围/)
  })

  it('classifies body fat bands', () => {
    expect(classifyBodyFat(12, 'male').id).toBe('athlete')
    expect(classifyBodyFat(26, 'male').id).toBe('obese')
    expect(classifyBodyFat(22, 'female').id).toBe('fitness')
    expect(classifyBodyFat(33, 'female').id).toBe('obese')
  })

  it('rounds metrics', () => {
    expect(roundMetric(22.86, 1)).toBe(22.9)
  })
})
