import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { MealType } from '../types'
import { generateMenu } from '../api/generateMenu'
import { buildShoppingList } from '../logic/shoppingList'

const TOTAL_STEPS = 5

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>Шаг {step} из {TOTAL_STEPS}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full">
        <div
          className="h-1.5 bg-orange-500 rounded-full transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default function QuizPage() {
  const navigate = useNavigate()
  const { quiz, setQuiz, setDays, setGenerating, setGenerateError, isGenerating, generateError, setShoppingItems } = useStore()
  const [step, setStep] = useState(1)
  const [portionMode, setPortionMode] = useState<'preset' | 'custom'>('preset')
  const [customPortions, setCustomPortions] = useState('')

  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => s - 1)

  const handleMealTypeToggle = (type: MealType) => {
    const current = quiz.mealTypes
    setQuiz({
      mealTypes: current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    })
  }

  const handleExclusionToggle = (val: string) => {
    const current = quiz.exclusions
    setQuiz({
      exclusions: current.includes(val)
        ? current.filter((e) => e !== val)
        : [...current, val],
    })
  }

  const handleSubmit = async () => {
    setGenerating(true)
    setGenerateError(null)
    try {
      const days = await generateMenu(quiz)
      setDays(days)
      const items = buildShoppingList(days, quiz.portions)
      setShoppingItems(items)
      navigate('/menu')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setGenerateError(`Ошибка: ${msg}`)
    } finally {
      setGenerating(false)
    }
  }

  const mealLabels: Record<MealType, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    dinner: 'Ужин',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 py-8 flex-1">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-sm mb-6 flex items-center gap-1">
          ← Назад к каталогу
        </button>

        <ProgressBar step={step} />

        {/* Шаг 1 — Приёмы пищи */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Какие приёмы пищи вам нужны?</h2>
            <p className="text-gray-500 mb-6">Можно выбрать несколько</p>
            <div className="space-y-3">
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((type) => {
                const selected = quiz.mealTypes.includes(type)
                return (
                  <button
                    key={type}
                    onClick={() => handleMealTypeToggle(type)}
                    className={`w-full py-4 px-5 rounded-2xl border-2 text-left font-medium transition-all ${
                      selected
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {mealLabels[type]}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Шаг 2 — Количество дней */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">На сколько дней составить рацион?</h2>
            <p className="text-gray-500 mb-6">Выберите один вариант</p>
            <div className="space-y-3">
              {([1, 3, 7] as const).map((d) => {
                const label = d === 1 ? '1 день' : d === 3 ? '3 дня' : 'Неделя (7 дней)'
                return (
                  <button
                    key={d}
                    onClick={() => setQuiz({ duration: d })}
                    className={`w-full py-4 px-5 rounded-2xl border-2 text-left font-medium transition-all ${
                      quiz.duration === d
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Шаг 3 — Порции */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Сколько порций на каждый приём?</h2>
            <p className="text-gray-500 mb-6">Например, если готовите на двоих — выберите 2</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[1, 2, 4].map((p) => (
                <button
                  key={p}
                  onClick={() => { setQuiz({ portions: p }); setPortionMode('preset') }}
                  className={`py-4 rounded-2xl border-2 font-bold text-lg transition-all ${
                    portionMode === 'preset' && quiz.portions === p
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div>
              <button
                onClick={() => setPortionMode('custom')}
                className={`w-full py-3 px-5 rounded-2xl border-2 text-left font-medium transition-all mb-2 ${
                  portionMode === 'custom'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                Своё значение
              </button>
              {portionMode === 'custom' && (
                <input
                  type="number"
                  autoFocus
                  min={1}
                  max={99}
                  value={customPortions}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 2)
                    setCustomPortions(val)
                    const n = parseInt(val)
                    if (n >= 1 && n <= 99) setQuiz({ portions: n })
                  }}
                  placeholder="Введите число (1–99)"
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500"
                />
              )}
            </div>
          </div>
        )}

        {/* Шаг 4 — Исключения */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Что исключить из рациона?</h2>
            <p className="text-gray-500 mb-6">Можно выбрать несколько или написать своё</p>
            <div className="space-y-3 mb-4">
              {['Лук', 'Чеснок', 'Лактоза'].map((exc) => {
                const selected = quiz.exclusions.includes(exc)
                return (
                  <button
                    key={exc}
                    onClick={() => handleExclusionToggle(exc)}
                    className={`w-full py-4 px-5 rounded-2xl border-2 text-left font-medium transition-all ${
                      selected
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {exc}
                  </button>
                )
              })}
            </div>
            <textarea
              placeholder="Другое — напишите, что исключить (например: орехи, глютен)"
              maxLength={200}
              rows={3}
              value={quiz.exclusions.filter((e) => !['Лук', 'Чеснок', 'Лактоза'].includes(e)).join(', ')}
              onChange={(e) => {
                const preset = quiz.exclusions.filter((ex) => ['Лук', 'Чеснок', 'Лактоза'].includes(ex))
                const custom = e.target.value ? [e.target.value] : []
                setQuiz({ exclusions: [...preset, ...custom] })
              }}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        )}

        {/* Шаг 5 — Пожелания */}
        {step === 5 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Есть ли что-то ещё, что нужно учесть?</h2>
            <p className="text-gray-500 mb-6">Необязательно — пропустите, если всё уже указали</p>
            <textarea
              placeholder="Например: хочу больше белка, без острого, бюджетные блюда"
              maxLength={300}
              rows={5}
              value={quiz.extraNotes}
              onChange={(e) => setQuiz({ extraNotes: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 resize-none"
            />
            {generateError && (
              <p className="text-red-500 text-sm mt-3">{generateError}</p>
            )}
          </div>
        )}
      </div>

      {/* Навигация */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={back}
              className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-medium hover:border-gray-300 transition-colors"
            >
              Назад
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              onClick={next}
              disabled={
                (step === 1 && quiz.mealTypes.length === 0) ||
                (step === 3 && portionMode === 'custom' && (quiz.portions < 1 || quiz.portions > 99))
              }
              className="flex-1 py-3 rounded-2xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Далее
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isGenerating}
              className="flex-1 py-3 rounded-2xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
            >
              {isGenerating ? 'Подбираем меню…' : 'Получить меню'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
