'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Brain, Volume2, Star, ArrowRight, ChevronRight, Mail, AlertCircle } from 'lucide-react'
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

// Email verification banner component
function EmailVerificationBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">
            Требуется подтверждение email
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            Пожалуйста, проверьте вашу почту и перейдите по ссылке для подтверждения email адреса.
          </p>
        </div>
        <Mail className="h-5 w-5 text-amber-600" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if user should see email verification message
  const showVerifyMessage = searchParams.get('verify') === 'true'

  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (user && user.email_verified) {
      const dashboardPath = getUserDashboardPath(user.role)
      router.push(dashboardPath)
    }
  }, [user, router])

  const handleDemoAudio = () => {
    if (isPlayingDemo) return
    
    setIsPlayingDemo(true)
    // Mock audio playback
    setTimeout(() => {
      setIsPlayingDemo(false)
    }, 2000)
  }

  const handleStartLearning = () => {
    if (user) {
      if (!user.email_verified) {
        // User is logged in but email not verified
        return
      }
      // User is authenticated and verified, redirect to dashboard
      const dashboardPath = getUserDashboardPath(user.role)
      router.push(dashboardPath)
    } else {
      // User not logged in, show auth modal
      setIsAuthModalOpen(true)
    }
  }

  const handleLoginClick = () => {
    setIsAuthModalOpen(true)
  }

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated and verified, they should be redirected
  // This is a fallback in case the useEffect redirect doesn't work immediately
  if (user && user.email_verified) {
    return null
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
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Привет, {user.full_name || user.email.split('@')[0]}!
                  </span>
                  {!user.email_verified && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      Email не подтвержден
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <Button variant="ghost" onClick={handleLoginClick}>
                    Войти
                  </Button>
                  <Button onClick={handleStartLearning}>
                    Начать изучение
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Show email verification banner if needed */}
        {(showVerifyMessage || (user && !user.email_verified)) && (
          <div className="max-w-4xl mx-auto mb-8">
            <EmailVerificationBanner />
          </div>
        )}

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
                disabled={user && !user.email_verified}
              >
                {user && !user.email_verified ? (
                  <>
                    <Mail className="mr-3 h-6 w-6" />
                    Подтвердите email
                  </>
                ) : (
                  <>
                    Начать бесплатно
                    <ArrowRight className="ml-3 h-6 w-6" />
                  </>
                )}
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
                <h3 className="text-xl font-bold text-gray-900">Произношение</h3>
                <p className="text-gray-600 leading-relaxed">
                  Аудио от носителей языка для каждого слова
                </p>
              </div>
              <div className="text-center space-y-4 group">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Прогресс</h3>
                <p className="text-gray-600 leading-relaxed">
                  Детальная статистика и достижения
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Почему выбирают нас?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Современные методики обучения, проверенные тысячами студентов по всему миру
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BookOpen,
                title: "Структурированный курс",
                description: "От базовых фраз до продвинутого уровня HSK",
                color: "from-blue-400 to-blue-600"
              },
              {
                icon: Brain,
                title: "Научный подход",
                description: "Методика интервального повторения для долгосрочного запоминания",
                color: "from-green-400 to-green-600"
              },
              {
                icon: Volume2,
                title: "Правильное произношение",
                description: "Аудио записи от носителей языка с тонами",
                color: "from-purple-400 to-purple-600"
              },
              {
                icon: Star,
                title: "Персональный прогресс",
                description: "Отслеживание достижений и слабых мест",
                color: "from-orange-400 to-orange-600"
              },
              {
                icon: ChevronRight,
                title: "Адаптивное обучение",
                description: "Система подстраивается под ваш темп изучения",
                color: "from-pink-400 to-pink-600"
              },
              {
                icon: ArrowRight,
                title: "Быстрые результаты",
                description: "Заметный прогресс уже через неделю занятий",
                color: "from-cyan-400 to-cyan-600"
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Готовы начать изучение?
          </h2>
          <p className="text-xl text-gray-600">
            Присоединяйтесь к тысячам студентов, которые уже изучают китайский с нами
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              className="w-full sm:w-auto h-14 px-12 text-lg btn-modern"
              onClick={handleStartLearning}
              disabled={user && !user.email_verified}
            >
              {user && !user.email_verified ? (
                <>
                  <Mail className="mr-3 h-6 w-6" />
                  Подтвердите email для продолжения
                </>
              ) : (
                <>
                  Начать сейчас
                  <ArrowRight className="ml-3 h-6 w-6" />
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Остались вопросы?
            </h2>
            <p className="text-lg text-gray-600">
              Мы всегда готовы помочь вам в изучении китайского языка
            </p>
          </div>
          <FeedbackForm />
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleCloseAuthModal} 
      />

      {/* Custom styles */}
      <style jsx>{`
        .text-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .btn-modern {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          transition: all 0.3s ease;
        }
        
        .btn-modern:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .glass-dark:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
} 