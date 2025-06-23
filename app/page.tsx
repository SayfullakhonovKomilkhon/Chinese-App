'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Brain, Volume2, Star, ArrowRight, ChevronRight, Mail, AlertCircle, Sparkles, Trophy, Zap, Target, Users } from 'lucide-react'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/components/AuthProvider'
import { getUserDashboardPath } from '@/lib/authUtils'

// Feedback form component
function FeedbackForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Feedback submitted:', { email, message })
    setIsSubmitted(true)
    setTimeout(() => {
      setEmail('')
      setMessage('')
      setIsSubmitted(false)
    }, 3000)
  }

  return (
    <Card className="w-full max-w-md mx-auto hover:shadow-lg transition-all duration-200">
      <CardHeader className="text-center">
        <CardTitle className="text-gradient-primary">Связь с нами</CardTitle>
        <CardDescription>
          Есть вопросы или предложения? Напишите нам!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-emerald-600 font-semibold text-lg mb-2">
              Сообщение отправлено!
            </div>
            <p className="text-slate-600">
              Спасибо за обратную связь
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <input
                type="email"
                placeholder="Ваш email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Ваше сообщение..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                className="form-input resize-none"
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              <Mail className="w-4 h-4 mr-2" />
              Отправить
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

// Email verification banner component
function EmailVerificationBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 mb-8">
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <AlertCircle className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-900 mb-2">
            Требуется подтверждение email
          </h3>
          <p className="text-amber-800 leading-relaxed">
            Пожалуйста, проверьте вашу почту и перейдите по ссылке для подтверждения email адреса.
          </p>
        </div>
        <div className="p-2 bg-amber-100 rounded-lg">
          <Mail className="h-6 w-6 text-amber-600" />
        </div>
      </div>
    </div>
  )
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function HomePageContent() {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const showVerifyMessage = searchParams.get('verify') === 'true'

  useEffect(() => {
    // Only redirect if we have a user, loading is complete, and email is verified
    if (!loading && user && user.email_verified) {
      console.log('Redirecting user to dashboard:', user.role)
      const dashboardPath = getUserDashboardPath(user.role)
      router.push(dashboardPath)
    }
  }, [user, loading, router])

  const handleDemoAudio = () => {
    if (isPlayingDemo) return
    
    setIsPlayingDemo(true)
    setTimeout(() => {
      setIsPlayingDemo(false)
    }, 2000)
  }

  const handleStartLearning = () => {
    if (user) {
      if (!user.email_verified) {
        return
      }
      const dashboardPath = getUserDashboardPath(user.role)
      router.push(dashboardPath)
    } else {
      setIsAuthModalOpen(true)
    }
  }

  const handleLoginClick = () => {
    setIsAuthModalOpen(true)
  }

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  // Add debugging for authentication flow
  console.log('HomePage: Rendering with loading =', loading, 'user =', user ? 'present' : 'null')
  
  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center space-y-8 px-6">
          <div className="w-20 h-20 mx-auto">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-blue-600"></div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-slate-900">Загрузка</h2>
            <p className="text-lg text-slate-600 font-medium">Подготовка вашего опыта обучения</p>
            <p className="text-sm text-slate-500">
              Если загрузка не завершается, попробуйте обновить страницу
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!loading && user && user.email_verified) {
    return null // Will redirect
  }
  
  return (
    <div className="page-container">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="content-container">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                中文学习
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      Привет, {user.full_name || user.email.split('@')[0]}!
                    </p>
                    {!user.email_verified && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                        Email не подтвержден
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleLoginClick}>
                    Войти
                  </Button>
                  <Button onClick={handleStartLearning} className="shadow-md">
                    Начать изучение
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="content-container">
        {/* Email verification banner */}
        {showVerifyMessage && <EmailVerificationBanner />}

        {/* Hero Section */}
        <section className="py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  Изучайте{' '}
                  <span className="text-gradient-primary">
                    китайский язык
                  </span>{' '}
                  эффективно
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Современная платформа для изучения китайского языка с использованием 
                  научных методов запоминания и интерактивных карточек.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={handleStartLearning}
                  className="shadow-md hover:shadow-lg"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  {user ? 'Продолжить изучение' : 'Начать изучение'}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleDemoAudio}
                  disabled={isPlayingDemo}
                  className="shadow-md hover:shadow-lg"
                >
                  <Volume2 className={`w-5 h-5 mr-2 ${isPlayingDemo ? 'animate-pulse' : ''}`} />
                  {isPlayingDemo ? 'Воспроизведение...' : 'Демо произношения'}
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>Бесплатно</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span>Научный подход</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span>Эффективно</span>
                </div>
              </div>
            </div>

            {/* Demo Card */}
            <div className="lg:pl-8">
              <Card className="p-8 shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50">
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <div className="text-6xl font-bold text-slate-900">你好</div>
                    <div className="text-xl text-slate-600">nǐ hǎo</div>
                    <div className="text-lg text-blue-600 font-semibold">Привет</div>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDemoAudio}
                      disabled={isPlayingDemo}
                    >
                      <Volume2 className={`w-4 h-4 mr-2 ${isPlayingDemo ? 'animate-pulse' : ''}`} />
                      Слушать
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Запомнил
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Почему выбирают нашу платформу?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Мы используем современные технологии и научные методы для максимально эффективного изучения китайского языка
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Интервальное повторение</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Алгоритм SuperMemo 2 оптимизирует время повторения для максимального запоминания
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Volume2 className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Произношение</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Изучайте правильное произношение с аудио поддержкой для каждого слова
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Отслеживание прогресса</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Детальная статистика и анализ вашего прогресса в изучении языка
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <CardTitle className="text-xl">Быстрое обучение</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Эффективные методы изучения помогают быстрее достигать результатов
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-rose-600" />
                </div>
                <CardTitle className="text-xl">Персонализация</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Адаптивная система подстраивается под ваш темп и стиль обучения
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Поддержка сообщества</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Учитесь вместе с другими студентами и получайте поддержку преподавателей
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 lg:p-16 text-center text-white">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Готовы начать изучение китайского языка?
              </h2>
              <p className="text-xl text-blue-100">
                Присоединяйтесь к тысячам студентов, которые уже изучают китайский язык с нашей платформой
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={handleStartLearning}
                  className="shadow-lg hover:shadow-xl"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Начать бесплатно
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleLoginClick}
                  className="border-white text-white hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl"
                >
                  Уже есть аккаунт
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 lg:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Остались вопросы?
            </h2>
            <p className="text-xl text-slate-600">
              Мы всегда готовы помочь вам в изучении китайского языка
            </p>
          </div>
          
          <FeedbackForm />
        </section>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
      />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="page-container flex items-center justify-center">
        <div className="text-center space-y-8 px-6">
          <div className="w-20 h-20 mx-auto">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-blue-600"></div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-slate-900">Загрузка</h2>
            <p className="text-lg text-slate-600 font-medium">Подготовка вашего опыта обучения</p>
          </div>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
} 