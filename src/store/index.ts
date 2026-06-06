import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DayPlan, MealType, QuizAnswers, ShoppingItem } from '../types'

interface AppState {
  // Квиз
  quiz: QuizAnswers

  // Меню
  days: DayPlan[]
  generatedAt: string
  isGenerating: boolean
  generateError: string | null

  // Покупки
  shoppingItems: ShoppingItem[]
  checkedIds: string[]

  // Действия
  setQuiz: (quiz: Partial<QuizAnswers>) => void
  setDays: (days: DayPlan[]) => void
  setGenerating: (v: boolean) => void
  setGenerateError: (e: string | null) => void
  setShoppingItems: (items: ShoppingItem[]) => void
  toggleCheck: (id: string) => void
  resetChecks: () => void
  resetMenu: () => void
}

const defaultQuiz: QuizAnswers = {
  mealTypes: [] as MealType[],
  duration: 3,
  portions: 2,
  exclusions: [],
  extraNotes: '',
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      quiz: defaultQuiz,
      days: [],
      generatedAt: '',
      isGenerating: false,
      generateError: null,
      shoppingItems: [],
      checkedIds: [],

      setQuiz: (partial) =>
        set((s) => ({ quiz: { ...s.quiz, ...partial } })),

      setDays: (days) =>
        set({ days, generatedAt: new Date().toISOString() }),

      setGenerating: (v) => set({ isGenerating: v }),
      setGenerateError: (e) => set({ generateError: e }),
      setShoppingItems: (items) => set({ shoppingItems: items }),

      toggleCheck: (id) =>
        set((s) => ({
          checkedIds: s.checkedIds.includes(id)
            ? s.checkedIds.filter((c) => c !== id)
            : [...s.checkedIds, id],
        })),

      resetChecks: () => set({ checkedIds: [] }),
      resetMenu: () => set({ days: [], generatedAt: '', shoppingItems: [], checkedIds: [] }),
    }),
    {
      name: 'meal-planner-storage',
      partialize: (s) => ({
        quiz: s.quiz,
        days: s.days,
        generatedAt: s.generatedAt,
        shoppingItems: s.shoppingItems,
        checkedIds: s.checkedIds,
      }),
    }
  )
)
