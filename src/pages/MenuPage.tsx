import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Dish, DayPlan, MealType } from '../types'
import { generateMenu } from '../api/generateMenu'
import { replaceDish } from '../api/replaceDish'
import { fetchRecipe } from '../api/fetchRecipe'
import { buildShoppingList } from '../logic/shoppingList'

const REPLACE_ALL_COOLDOWN = 30 // секунд

function RecipeModal({ dish, onClose }: { dish: Dish; onClose: () => void }) {
  const [fullDish, setFullDish] = useState<Dish>(dish)
  const [loading, setLoading] = useState(!dish.ingredients || dish.ingredients.length === 0)

  useEffect(() => {
    if (!dish.ingredients || dish.ingredients.length === 0) {
      fetchRecipe(dish)
        .then(setFullDish)
        .finally(() => setLoading(false))
    }
  }, [dish])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">{fullDish.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-4 space-y-5">
          <p className="text-gray-600">{fullDish.description}</p>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <div className="inline-block w-6 h-6 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin mb-2" />
              <p className="text-sm">Загружаем рецепт…</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Ингредиенты</h3>
                <ul className="space-y-1">
                  {fullDish.ingredients?.map((ing) => (
                    <li key={ing.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{ing.name}</span>
                      <span className="text-gray-400">
                        {ing.unit === 'по вкусу' || ing.unit === 'щепотка' ? ing.unit : `${ing.amount} ${ing.unit}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Приготовление</h3>
                <ol className="space-y-2">
                  {fullDish.steps?.map((step) => (
                    <li key={step.stepNumber} className="flex gap-3 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-semibold text-xs flex items-center justify-center mt-0.5">
                        {step.stepNumber}
                      </span>
                      <span className="text-gray-700">{step.instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
}

export default function MenuPage() {
  const navigate = useNavigate()
  const { days, quiz, setDays, setShoppingItems, resetMenu, lastReplaceAllAt, setLastReplaceAll } = useStore()
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [replacingKey, setReplacingKey] = useState<string | null>(null)
  const [isReplacingAll, setIsReplacingAll] = useState(false)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)

  useEffect(() => {
    const update = () => {
      const elapsed = Math.floor((Date.now() - lastReplaceAllAt) / 1000)
      const left = Math.max(0, REPLACE_ALL_COOLDOWN - elapsed)
      setCooldownLeft(left)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [lastReplaceAllAt])

  if (days.length === 0) {
    navigate('/')
    return null
  }

  const handleReplaceAll = async () => {
    setConfirmReplace(false)
    setIsReplacingAll(true)
    setError(null)
    try {
      const newDays = await generateMenu(quiz)
      setDays(newDays)
      setShoppingItems(buildShoppingList(newDays, quiz.portions))
      setLastReplaceAll()
    } catch {
      setError('Не удалось обновить меню. Попробуйте ещё раз.')
    } finally {
      setIsReplacingAll(false)
    }
  }

  const handleReplaceDish = async (day: DayPlan, mealType: MealType, dish: Dish) => {
    const key = `${day.dayNumber}-${mealType}`
    setReplacingKey(key)
    setError(null)
    try {
      const newDish = await replaceDish(dish, mealType, days, quiz.exclusions, quiz.extraNotes)
      const newDays = days.map((d) =>
        d.dayNumber === day.dayNumber ? { ...d, [mealType]: newDish } : d
      )
      setDays(newDays)
      setShoppingItems(buildShoppingList(newDays, quiz.portions))
    } catch {
      setError('Не удалось заменить блюдо. Попробуйте ещё раз.')
    } finally {
      setReplacingKey(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/quiz')} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Изменить параметры
          </button>
          <button onClick={() => { resetMenu(); navigate('/') }} className="text-gray-400 hover:text-gray-600 text-sm">
            На главную
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Ваш рацион на {quiz.duration === 1 ? '1 день' : quiz.duration === 3 ? '3 дня' : 'неделю'}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {quiz.mealTypes.map((m) => MEAL_LABELS[m]).join(' · ')} · {quiz.portions} порц.
          {quiz.exclusions.length > 0 && ` · Без ${quiz.exclusions.join(', ').toLowerCase()}`}
        </p>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-xl p-3">{error}</p>}

        <div className="space-y-6 mb-8">
          {days.map((day) => (
            <div key={day.dayNumber} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-orange-50 px-5 py-3 border-b border-orange-100">
                <h2 className="font-semibold text-orange-800">День {day.dayNumber}</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => {
                  const dish = day[mealType]
                  if (!dish) return null
                  const key = `${day.dayNumber}-${mealType}`
                  const isReplacing = replacingKey === key

                  return (
                    <div key={mealType} className={`px-5 py-4 transition-opacity ${isReplacing ? 'opacity-40' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            {MEAL_LABELS[mealType]}
                          </span>
                          <h3 className="font-semibold text-gray-900 mt-0.5">{dish.name}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dish.description}</p>
                          <div className="flex gap-3 mt-2">
                            <button
                              onClick={() => setSelectedDish(dish)}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                              Рецепт
                            </button>
                            <button
                              onClick={() => handleReplaceDish(day, mealType, dish)}
                              disabled={isReplacing}
                              className="text-sm text-gray-400 hover:text-gray-600 font-medium disabled:opacity-40"
                            >
                              {isReplacing ? 'Замена…' : 'Заменить'}
                            </button>
                          </div>
                        </div>
                        <span className="text-xs text-gray-300 flex-shrink-0 mt-1">{dish.cookingTime} мин</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => cooldownLeft === 0 && setConfirmReplace(true)}
            disabled={isReplacingAll || cooldownLeft > 0}
            className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isReplacingAll
              ? 'Обновляем меню…'
              : cooldownLeft > 0
              ? `Подождите ${cooldownLeft} сек…`
              : 'Заменить всю подборку'}
          </button>
          <button
            onClick={() => { setShoppingItems(buildShoppingList(days, quiz.portions)); navigate('/shopping') }}
            className="w-full py-4 rounded-2xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            Подтвердить рацион
          </button>
        </div>
      </div>

      {confirmReplace && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Заменить всё меню?</h3>
            <p className="text-gray-500 text-sm mb-5">Текущее меню будет заменено новым. Все изменения блюд будут потеряны.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReplace(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-medium">
                Отмена
              </button>
              <button onClick={handleReplaceAll} className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-semibold">
                Заменить
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDish && <RecipeModal dish={selectedDish} onClose={() => setSelectedDish(null)} />}
    </div>
  )
}
