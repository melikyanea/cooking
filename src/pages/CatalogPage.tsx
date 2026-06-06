import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATALOG_DISHES } from '../data/catalogDishes'
import { Dish } from '../types'

function DishCard({ dish, onClick }: { dish: Dish; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-orange-200 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-400 font-medium">{dish.cookingTime} мин</span>
        <span className="text-xs text-gray-300">·</span>
        <span className="text-xs text-gray-400">
          {dish.difficulty === 'easy' ? 'просто' : dish.difficulty === 'medium' ? 'средне' : 'сложно'}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{dish.name}</h3>
      <p className="text-sm text-gray-500 line-clamp-2">{dish.description}</p>
    </button>
  )
}

function RecipeModal({ dish, onClose }: { dish: Dish; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900">{dish.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-4 space-y-5">
          <p className="text-gray-600">{dish.description}</p>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Ингредиенты</h3>
            <ul className="space-y-1">
              {(dish.ingredients ?? []).map((ing) => (
                <li key={ing.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{ing.name}</span>
                  <span className="text-gray-400">
                    {ing.unit === 'по вкусу' ? 'по вкусу' : `${ing.amount} ${ing.unit}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Приготовление</h3>
            <ol className="space-y-2">
              {(dish.steps ?? []).map((step) => (
                <li key={step.stepNumber} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-semibold text-xs flex items-center justify-center mt-0.5">
                    {step.stepNumber}
                  </span>
                  <span className="text-gray-700">{step.instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  const navigate = useNavigate()
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)

  const breakfasts = CATALOG_DISHES.filter((d) => d.mealType === 'breakfast')
  const mains = CATALOG_DISHES.filter((d) => d.mealType !== 'breakfast')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Готовое меню под ваш вкус
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            Ответьте на несколько вопросов — получите сбалансированный рацион и список покупок
          </p>
          <button
            onClick={() => navigate('/quiz')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors shadow-sm"
          >
            Составить свой рацион
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* Завтраки */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Завтраки</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {breakfasts.map((dish) => (
              <DishCard key={dish.id} dish={dish} onClick={() => setSelectedDish(dish)} />
            ))}
          </div>
        </section>

        {/* Обеды + Ужины */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Обеды + Ужины</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mains.map((dish) => (
              <DishCard key={dish.id} dish={dish} onClick={() => setSelectedDish(dish)} />
            ))}
          </div>
        </section>

        {/* Нижний CTA */}
        <div className="text-center py-6">
          <button
            onClick={() => navigate('/quiz')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-colors shadow-sm"
          >
            Составить свой рацион
          </button>
        </div>
      </div>

      {selectedDish && (
        <RecipeModal dish={selectedDish} onClose={() => setSelectedDish(null)} />
      )}
    </div>
  )
}
