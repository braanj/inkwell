import { test as base, expect } from '@playwright/test'

export const test = base.extend({})
export { expect }

/** Unique-ish suffix per test run so parallel/local reruns don't collide on unique DB constraints. */
export function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

export function testUser() {
  const id = uniqueSuffix()
  return {
    name: `Test Writer ${id}`,
    email: `writer-${id}@example.com`,
    password: 'correct-horse-battery-staple'
  }
}
