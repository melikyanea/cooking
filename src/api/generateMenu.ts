import { DayPlan, QuizAnswers } from '../types'
import { MOCK_MENU } from './mockMenu'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const SYSTEM_PROMPT = `Ты — диетолог и шеф-повар. Составляй сбалансированные рационы питания.
Отвечай строго в формате JSON без лишнего текста, без markdown, без комментариев — только чистый JSON.
Соблюдай баланс белков, жиров и углеводов по дням.
Не повторяй одно и то же блюдо в рамках одного рациона.
Все названия, описания и инструкции пиши на русском языке.
Будь лаконичен: максимум 5 ингредиентов на блюдо, максимум 4 шага рецепта, описание — 1 предложение.`

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
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1000)) // имитация задержки
    return MOCK_MENU.slice(0, quiz.duration)
  }

  const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY ?? '').trim()
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY не задан')
  if (!/^sk-ant-/.test(apiKey)) throw new Error(`Ключ выглядит неверно: "${apiKey.slice(0, 10)}..."`)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(quiz) }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`API error ${response.status}: ${body}`)
  }

  const data = await response.json()
  const text = data.content[0].text

  let json
  const extractJSON = (s: string) => {
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('JSON не найден')
    return s.slice(start, end + 1)
  }
  try {
    json = JSON.parse(extractJSON(text))
  } catch {
    throw new Error(`Не удалось разобрать ответ: ${text.slice(0, 200)}`)
  }

  return json.days as DayPlan[]
}
