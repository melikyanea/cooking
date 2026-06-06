import { DayPlan, ShoppingItem } from '../types'

export function buildShoppingList(days: DayPlan[], portions: number): ShoppingItem[] {
  const totals = new Map<string, { name: string; amount: number; unit: string; category: 'perishable' | 'storable'; dishes: string[] }>()

  const allMeals = days.flatMap((d) => [d.breakfast, d.lunch, d.dinner].filter(Boolean))

  for (const dish of allMeals) {
    if (!dish) continue
    for (const ing of dish.ingredients) {
      const key = ing.name.toLowerCase().trim()
      const existing = totals.get(key)
      if (existing) {
        if (ing.unit !== 'по вкусу' && ing.unit !== 'щепотка') {
          existing.amount += ing.amount * portions
        }
        if (!existing.dishes.includes(dish.name)) {
          existing.dishes.push(dish.name)
        }
      } else {
        totals.set(key, {
          name: ing.name,
          amount: ing.unit !== 'по вкусу' && ing.unit !== 'щепотка' ? ing.amount * portions : 0,
          unit: ing.unit,
          category: ing.category,
          dishes: [dish.name],
        })
      }
    }
  }

  return Array.from(totals.entries()).map(([key, val]) => ({
    id: key.replace(/\s+/g, '-'),
    name: val.name,
    totalAmount: roundAmount(val.amount, val.unit),
    unit: val.unit,
    category: val.category,
    usedInDishes: val.dishes,
  })).sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

function roundAmount(amount: number, unit: string): number {
  if (unit === 'г' || unit === 'мл') return Math.ceil(amount / 10) * 10
  if (unit === 'шт') return Math.ceil(amount)
  return Math.round(amount * 2) / 2
}

export function exportTXT(items: ShoppingItem[], duration: number, portions: number): void {
  const perishable = items.filter((i) => i.category === 'perishable')
  const storable = items.filter((i) => i.category === 'storable')

  const formatItem = (i: ShoppingItem) => {
    const qty = i.unit === 'по вкусу' || i.unit === 'щепотка'
      ? i.unit
      : `${i.totalAmount} ${i.unit}`
    return `[ ] ${i.name} — ${qty}`
  }

  const lines = [
    `Список покупок — ${duration} дн., ${portions} порц.`,
    `Сформирован: ${new Date().toLocaleDateString('ru-RU')}`,
    '',
    '=== СКОРОПОРТЯЩИЕСЯ ===',
    ...perishable.map(formatItem),
    '',
    '=== ХРАНИМЫЕ ===',
    ...storable.map(formatItem),
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `shopping-list-${Date.now()}.txt`,
  })
  a.click()
  URL.revokeObjectURL(url)
}
