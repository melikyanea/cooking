import { Dish } from '../types'
import { CATALOG_DISHES } from '../data/catalogDishes'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export async function fetchRecipe(dish: Dish): Promise<Dish> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600))
    const found = CATALOG_DISHES.find((d) => d.mealType === dish.mealType)
    return {
      ...dish,
      ingredients: found?.ingredients ?? [],
      steps: found?.steps ?? [{ stepNumber: 1, instruction: 'Приготовить по вкусу.' }],
    }
  }

  const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY ?? '').trim()
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY не задан')

  const prompt = `Дай полный рецепт блюда "${dish.name}".
Верни только чистый JSON без markdown:
{
  "ingredients": [
    { "id": "slug", "name": "Название", "amount": 100, "unit": "г", "category": "storable" }
  ],
  "steps": [
    { "stepNumber": 1, "instruction": "Шаг" }
  ]
}
Максимум 7 ингредиентов, максимум 5 шагов. Все на русском языке.
unit: "г", "мл", "шт", "ст.л.", "ч.л.", "щепотка" или "по вкусу".
category: "perishable" (мясо, рыба, молочка, свежие овощи/зелень) или "storable" (крупы, масла, специи, консервы, яйца).`

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
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error(`API error: ${response.status}`)

  const data = await response.json()
  const text = data.content[0].text
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  const json = JSON.parse(text.slice(start, end + 1))

  return { ...dish, ingredients: json.ingredients, steps: json.steps }
}
