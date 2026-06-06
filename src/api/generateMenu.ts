import { DayPlan, QuizAnswers } from '../types'

const SYSTEM_PROMPT = `Ты — диетолог и шеф-повар. Составляй сбалансированные рационы питания.
Отвечай строго в формате JSON без лишнего текста, без markdown, без комментариев.
Соблюдай баланс белков, жиров и углеводов по дням.
Не повторяй одно и то же блюдо в рамках одного рациона.
Каждое блюдо должно содержать рецепт с шагами и точные ингредиенты с количествами.
Все названия, описания и инструкции пиши на русском языке.`

function buildUserPrompt(quiz: QuizAnswers): string {
  const mealLabels: Record<string, string> = {
    breakfast: 'завтрак',
    lunch: 'обед',
    dinner: 'ужин',
  }
  const meals = quiz.mealTypes.map((m) => mealLabels[m]).join(', ')
  const exclusions = quiz.exclusions.length > 0 ? quiz.exclusions.join(', ') : 'нет'

  return `Составь рацион питания со следующими параметрами:
- Приёмы пищи: ${meals}
- Количество дней: ${quiz.duration}
- Порций на каждый приём: ${quiz.portions}
- Исключить из рациона: ${exclusions}
- Дополнительные пожелания: ${quiz.extraNotes || 'нет'}

Верни JSON строго в формате (без лишних полей):
{
  "days": [
    {
      "dayNumber": 1,
      "breakfast": {
        "id": "unique_id",
        "name": "Название блюда",
        "description": "Описание 2-3 предложения",
        "mealType": "breakfast",
        "cookingTime": 15,
        "difficulty": "easy",
        "ingredients": [
          { "id": "ingredient_id", "name": "Название", "amount": 100, "unit": "г", "category": "storable" }
        ],
        "steps": [
          { "stepNumber": 1, "instruction": "Шаг 1" }
        ]
      },
      "lunch": { ... },
      "dinner": { ... }
    }
  ]
}

Если какой-то приём пищи не нужен (не входит в список "${meals}"), поставь null для этого поля.
Категория ингредиента (category): "perishable" — скоропортящиеся (мясо, рыба, молочка, свежая зелень, некоторые овощи), "storable" — хранимые (крупы, масла, специи, консервы, яйца).
unit должен быть одним из: "г", "мл", "шт", "ст.л.", "ч.л.", "щепотка", "по вкусу".
difficulty: "easy", "medium" или "hard".`
}

export async function generateMenu(quiz: QuizAnswers): Promise<DayPlan[]> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY не задан')

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
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(quiz) }],
    }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content[0].text

  const json = JSON.parse(text)
  return json.days as DayPlan[]
}
