export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type MeasureUnit = 'г' | 'мл' | 'шт' | 'ст.л.' | 'ч.л.' | 'щепотка' | 'по вкусу'
export type IngredientCategory = 'perishable' | 'storable'

export interface Ingredient {
  id: string
  name: string
  amount: number
  unit: MeasureUnit
  category: IngredientCategory
}

export interface RecipeStep {
  stepNumber: number
  instruction: string
}

export interface Dish {
  id: string
  name: string
  description: string
  mealType: MealType
  cookingTime: number
  difficulty: Difficulty
  ingredients: Ingredient[]
  steps: RecipeStep[]
}

export interface DayPlan {
  dayNumber: number
  breakfast?: Dish
  lunch?: Dish
  dinner?: Dish
}

export interface ShoppingItem {
  id: string
  name: string
  totalAmount: number
  unit: string
  category: IngredientCategory
  usedInDishes: string[]
}

export interface QuizAnswers {
  mealTypes: MealType[]
  duration: 1 | 3 | 7
  portions: number
  exclusions: string[]
  extraNotes: string
}
