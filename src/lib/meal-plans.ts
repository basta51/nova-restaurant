export const MEAL_PLANS = {
  breakfast_only: {
    meals: ['breakfast'],
    credits: { restaurant: 20, drinks: 0, extras: 0 },
  },
  half_board: {
    meals: ['breakfast', 'dinner'],
    credits: { restaurant: 50, drinks: 10, extras: 10 },
  },
  full_board: {
    meals: ['breakfast', 'lunch', 'dinner'],
    credits: { restaurant: 75, drinks: 25, extras: 15 },
  },
  all_inclusive: {
    meals: ['breakfast', 'lunch', 'dinner', 'drinks', 'extras'],
    credits: { restaurant: 100, drinks: 50, extras: 30 },
  },
}

export function isMealAllowed(mealPlan: string, mealType: string): boolean {
  const plan = MEAL_PLANS[mealPlan as keyof typeof MEAL_PLANS]
  if (!plan) return false
  return plan.meals.includes(mealType)
}

export function getDefaultCredits(mealPlan: string) {
  const plan = MEAL_PLANS[mealPlan as keyof typeof MEAL_PLANS]
  if (!plan) return { restaurant: 0, drinks: 0, extras: 0 }
  return plan.credits
}
