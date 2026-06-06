import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { ShoppingItem } from '../types'
import { exportTXT } from '../logic/shoppingList'

function IngredientRow({ item, checked, onToggle }: {
  item: ShoppingItem
  checked: boolean
  onToggle: () => void
}) {
  const qty = item.unit === 'по вкусу' || item.unit === 'щепотка'
    ? item.unit
    : `${item.totalAmount} ${item.unit}`

  return (
    <label className={`flex items-center gap-3 py-2.5 cursor-pointer group ${checked ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-5 h-5 rounded accent-orange-500 cursor-pointer flex-shrink-0"
      />
      <span className={`flex-1 text-gray-800 ${checked ? 'line-through' : ''}`}>
        {item.name}
      </span>
      <span className="text-sm text-gray-400 flex-shrink-0">{qty}</span>
      {item.usedInDishes.length > 1 && (
        <span
          className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex-shrink-0"
          title={`Используется в: ${item.usedInDishes.join(', ')}`}
        >
          ×{item.usedInDishes.length}
        </span>
      )}
    </label>
  )
}

export default function ShoppingPage() {
  const navigate = useNavigate()
  const { shoppingItems, checkedIds, toggleCheck, resetChecks, quiz } = useStore()

  if (shoppingItems.length === 0) {
    navigate('/')
    return null
  }

  const perishable = shoppingItems.filter((i) => i.category === 'perishable')
  const storable = shoppingItems.filter((i) => i.category === 'storable')
  const totalChecked = checkedIds.length
  const totalItems = shoppingItems.length
  const allChecked = totalChecked === totalItems

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/menu')} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Назад к меню
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Список покупок</h1>
        <p className="text-gray-500 text-sm mb-6">
          {quiz.duration === 1 ? '1 день' : quiz.duration === 3 ? '3 дня' : 'Неделя'} · {quiz.portions} порц.
        </p>

        {/* Прогресс */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Куплено: <span className="font-semibold text-gray-900">{totalChecked}</span> из {totalItems}
          </span>
          {totalChecked > 0 && (
            <button
              onClick={resetChecks}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Сбросить
            </button>
          )}
        </div>

        {allChecked && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-4 text-center">
            <p className="text-green-700 font-medium">Всё куплено! Приятного приготовления 🎉</p>
          </div>
        )}

        <div className="space-y-4">
          {perishable.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50 bg-red-50">
                <h2 className="font-semibold text-red-800 text-sm">Скоропортящиеся — купить ближе к дате</h2>
              </div>
              <div className="px-5 divide-y divide-gray-50">
                {perishable.map((item) => (
                  <IngredientRow
                    key={item.id}
                    item={item}
                    checked={checkedIds.includes(item.id)}
                    onToggle={() => toggleCheck(item.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {storable.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50 bg-green-50">
                <h2 className="font-semibold text-green-800 text-sm">Хранимые — можно купить заранее</h2>
              </div>
              <div className="px-5 divide-y divide-gray-50">
                {storable.map((item) => (
                  <IngredientRow
                    key={item.id}
                    item={item}
                    checked={checkedIds.includes(item.id)}
                    onToggle={() => toggleCheck(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={() => exportTXT(shoppingItems, quiz.duration, quiz.portions)}
            className="w-full py-4 rounded-2xl border-2 border-orange-200 text-orange-600 font-semibold hover:bg-orange-50 transition-colors"
          >
            Скачать список покупок (.txt)
          </button>
        </div>
      </div>
    </div>
  )
}
