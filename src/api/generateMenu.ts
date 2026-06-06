import { DayPlan, QuizAnswers } from '../types'
import { MOCK_MENU } from './mockMenu'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const SYSTEM_PROMPT = `Ты — диетолог и шеф-повар. Составляй сбалансированные рационы питания.
Отвечай строго в формате JSON без лишнего текста, без markdown, без комментариев — только чистый JSON.
Соблюдай баланс белков, жиров и углеводов по дням.
Не повторяй одно и то же блюдо в рамках одного рациона.
Все названия и описания пиши на русском языке.`

function buildUserPrompt(quiz: QuizAnswers): string {
  const mealLabels: Record<string, string> = { breakfast: 'завтрак', lunch: 'обед', dinner: 'ужин' }
  const meals = quiz.mealTypes.map((m) => mealLabels[m]).join(', ')
  const exclusions = quiz.exclusions.length > 0 ? quiz.exclusions.join(', ') : 'нет'

  return `Составь рацион питания:
- Приёмы пищи: ${meals}
- Количество дней: ${quiz.duration}
- Порций на приём: ${quiz.portions}
- Исключить: ${exclusions}
- Пожелания: ${quiz.extraNotes || 'нет'}

Верни ТОЛЬКО базовую информацию о блюдах — БЕЗ ингредиентов и шагов приготовления.
Формат:
{
  "days": [
    {
      "dayNumber": 1,
      "breakfast": {
        "id": "unique_id",
        "name": "Название блюда",
        "description": "Одно предложение описания.",
        "mealType": "breakfast",
        "cookingTime": 15,
        "difficulty": "easy"
      },
      "lunch": { ... },
      "dinner": { ... }
    }
  ]
}

Если приём пищи не нужен (не входит в список "${meals}"), поставь null.
difficulty: "easy", "medium" или "hard".`
}

const extractJSON = (s: string) => {
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('JSON не найден в ответе')
  return s.slice(start, end + 1)
}

export async function generateMenu(quiz: QuizAnswers): Promise<DayPlan[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1000))
    const shuffled = [...MOCK_MENU].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, quiz.duration).map((d, i) => ({ ...d, dayNumber: i + 1 }))
  }

  const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY ?? '').trim()
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY не задан')
  if (!/^sk-ant-/.test(apiKey)) throw new Error(`Ключ выглядит неверно: "${apiKey.slice(0, 10)}..."`)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: buildUserPrompt(quiz) }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`API error ${response.status}: ${body}`)
  }

  const data = await response.json()
  const text = data.content[0].text
  const json = JSON.parse(extractJSON(text))
  return json.days as DayPlan[]
}
