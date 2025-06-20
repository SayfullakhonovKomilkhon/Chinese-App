'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Brain, Volume2, Star, ArrowRight, ChevronRight } from 'lucide-react'
import AuthModal from '@/components/AuthModal'

// Feedback form component
function FeedbackForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock form submission
    console.log('Feedback submitted:', { email, message })
    setIsSubmitted(true)
    setTimeout(() => {
      setEmail('')
      setMessage('')
      setIsSubmitted(false)
    }, 3000)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Связь с нами</CardTitle>
        <CardDescription>
          Есть вопросы или предложения? Напишите нам!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="text-center py-4">
            <div className="text-green-600 font-medium">
              ✓ Сообщение отправлено!
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Спасибо за обратную связь
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Ваш email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <textarea
                placeholder="Ваше сообщение..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <Button type="submit" className="w-full">
              Отправить
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  const handleDemoAudio = () => {
    if (isPlayingDemo) return
    
    setIsPlayingDemo(true)
    // Mock audio playback
    setTimeout(() => {
      setIsPlayingDemo(false)
    }, 2000)
  }

  const handleStartLearning = () => {
    // For now, just show an alert since we removed authentication
    alert('Функция будет доступна в полной версии приложения!')
  }

  const handleLoginClick = () => {
    setIsAuthModalOpen(true)
  }

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false)
  }
  
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                中文学习
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleLoginClick}>
                Войти
              </Button>
              <Button onClick={handleStartLearning}>
                Начать изучение
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-40 left-1/2 w-64 h-64 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center space-y-12">
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-gray-700 mb-6">
                <span className="mr-2">✨</span>
                Эффективное изучение китайского языка
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block text-gray-900 mb-2">Изучайте</span>
                <span className="block text-gradient animate-pulse">
                  中文
                </span>
                <span className="block text-gray-900 mt-2">Эффективно</span>
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                Интерактивные карточки с реальным произношением, умная система повторений 
                и персональный трекинг прогресса для быстрого изучения китайского языка
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-14 px-8 text-lg btn-modern"
                onClick={handleStartLearning}
              >
                Начать бесплатно
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto h-14 px-8 text-lg glass hover:glass-dark transition-all duration-300"
                onClick={handleDemoAudio}
                disabled={isPlayingDemo}
              >
                {isPlayingDemo ? (
                  <>
                    <div className="animate-pulse mr-3">
                      <Volume2 className="h-6 w-6" />
                    </div>
                    Воспроизведение...
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-3 h-6 w-6" />
                    Демо произношения
                  </>
                )}
              </Button>
            </div>

            {/* Quick Features Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto pt-16">
              <div className="text-center space-y-4 group">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Умная система</h3>
                <p className="text-gray-600 leading-relaxed">
                  ИИ-алгоритм повторений адаптируется под ваш темп
                </p>
              </div>

              <div className="text-center space-y-4 group">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Volume2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Реальное произношение</h3>
                <p className="text-gray-600 leading-relaxed">
                  Озвучивание носителями языка для правильного произношения
                </p>
              </div>

              <div className="text-center space-y-4 group">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Персональный прогресс</h3>
                <p className="text-gray-600 leading-relaxed">
                  Отслеживание достижений и мотивирующая статистика
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Есть вопросы?
            </h2>
            <p className="text-lg text-gray-600">
              Мы всегда готовы помочь и выслушать ваши предложения
            </p>
          </div>
          <FeedbackForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6" />
            <span className="text-lg font-semibold">中文学习</span>
          </div>
          <p className="text-gray-400">
            © 2024 Chinese Learning App. Изучение китайского языка для русскоязычных пользователей.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} />
    </div>
  )
} 