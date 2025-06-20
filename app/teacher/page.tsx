'use client'

export default function TeacherPanel() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Teacher Panel
          </h1>
          <p className="text-lg text-gray-600">
            Добро пожаловать в панель преподавателя! Здесь вы можете управлять курсами и студентами.
          </p>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Управление карточками
            </h3>
            <p className="text-gray-600">
              Создавайте и редактируйте карточки для изучения
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Статистика студентов
            </h3>
            <p className="text-gray-600">
              Просматривайте прогресс и статистику учеников
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Управление тестами
            </h3>
            <p className="text-gray-600">
              Создавайте тесты и оценивайте результаты
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 