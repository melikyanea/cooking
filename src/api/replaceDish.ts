import { Dish, DayPlan, MealType } from '../types'

export async function replaceDish(
  currentDish: Dish,
  mealType: MealType,
  allDays: DayPlan[],
  exclusions: string[],
  extraNotes: string
): Promise<Dish> {
  const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY ?? '').trim()
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY не задан')

  const existingDishes = allDays
    .flatMap((d) => [d.breakfast, d.lunch, d.dinner])
    .filter(Boolean)
    .map((d) => d!.name)
    .join(', ')

  const mealLabels: Record<MealType, string> = {
    breakfast: 'завтрак',
    lunch: 'обед',
    dinner: 'ужин',
  }

  const prompt = `В рационе уже есть следующие блюда: ${existingDishes}.
Замени блюдо "${currentDish.name}" (${mealLabels[mealType]}).
Исключить из рациона: ${exclusions.length > 0 ? exclusions.join(', ') : 'нет'}.
Дополнительно: ${extraNotes || 'нет'}.
Предложи другое блюдо — не повторяй то, что уже есть в рационе.

Верни JSON одного блюда в формате:
{
  "id": "unique_id",
  "name": "Название",
  "description": "Описание 2-3 предложения",
  "mealType": "${mealType}",
  "cookingTime": 20,
  "difficulty": "easy",
  "ingredients": [
    { "id": "ing_id", "name": "Название", "amount": 100, "unit": "г", "category": "storable" }
  ],
  "steps": [
    { "stepNumber": 1, "instruction": "Шаг" }
  ]
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`API error: ${response.status}`)

  const data = await response.json()
  const text = data.content[0].text
  return JSON.parse(text) as Dish
}
