'use client'

import { useState, useEffect } from 'react'
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

export default function HomePage() {
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
                  <Sparkles className="w-5 h-5 mr-2" />
                  Начать изучение
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleDemoAudio}
                  disabled={isPlayingDemo}
                >
                  <Volume2 className={`w-5 h-5 mr-2 ${isPlayingDemo ? 'animate-pulse' : ''}`} />
                  {isPlayingDemo ? 'Воспроизведение...' : 'Демо произношения'}
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full border-2 border-white" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600 font-medium">1000+ учеников</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600 font-medium">4.9/5</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white rounded-2xl shadow-strong p-8 border border-slate-200">
                <div className="text-center space-y-6">
                  <div className="chinese-text text-6xl font-bold text-slate-900">
                    你好
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold text-slate-900">Nǐ hǎo</p>
                    <p className="text-lg text-slate-600">Привет / Здравствуй</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Volume2 className="w-4 h-4 mr-2" />
                    Прослушать
                  </Button>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Trophy className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Почему выбирают нас?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Наша платформа использует современные методы обучения для максимальной эффективности
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'Научный подход',
                description: 'Используем алгоритм интервального повторения для оптимального запоминания',
                gradient: 'from-purple-500 to-indigo-500',
                bgColor: 'bg-purple-50',
                iconColor: 'text-purple-600'
              },
              {
                icon: Target,
                title: 'Персонализация',
                description: 'Адаптируем сложность под ваш уровень и скорость обучения',
                gradient: 'from-emerald-500 to-teal-500',
                bgColor: 'bg-emerald-50',
                iconColor: 'text-emerald-600'
              },
              {
                icon: Zap,
                title: 'Быстрые результаты',
                description: 'Заметные улучшения уже через несколько недель занятий',
                gradient: 'from-amber-500 to-orange-500',
                bgColor: 'bg-amber-50',
                iconColor: 'text-amber-600'
              },
              {
                icon: Volume2,
                title: 'Произношение',
                description: 'Изучайте правильное произношение с аудио от носителей языка',
                gradient: 'from-blue-500 to-cyan-500',
                bgColor: 'bg-blue-50',
                iconColor: 'text-blue-600'
              },
              {
                icon: Trophy,
                title: 'Мотивация',
                description: 'Система достижений и прогресса поддерживает интерес к учебе',
                gradient: 'from-pink-500 to-rose-500',
                bgColor: 'bg-pink-50',
                iconColor: 'text-pink-600'
              },
              {
                icon: Users,
                title: 'Сообщество',
                description: 'Присоединяйтесь к сообществу изучающих китайский язык',
                gradient: 'from-indigo-500 to-purple-500',
                bgColor: 'bg-indigo-50',
                iconColor: 'text-indigo-600'
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:scale-105 transition-all duration-200 cursor-pointer">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 ${feature.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                  </div>
                  <CardTitle className="mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-12 text-center">
              <div className="max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                  Готовы начать изучение?
                </h2>
                <p className="text-xl text-slate-600">
                  Присоединяйтесь к тысячам студентов, которые уже изучают китайский язык с нами
                </p>
                <div className="pt-4">
                  <Button 
                    size="xl" 
                    onClick={handleStartLearning}
                    className="shadow-lg hover:shadow-xl group"
                  >
                    <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Начать бесплатно
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Section */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Остались вопросы?
            </h2>
            <p className="text-xl text-slate-600">
              Мы всегда готовы помочь вам в изучении китайского языка
            </p>
          </div>
          <FeedbackForm />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="content-container py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">中文学习</span>
            </div>
            <p className="text-slate-400 text-lg">
              Изучайте китайский язык эффективно и с удовольствием
            </p>
            <div className="pt-6 text-slate-500 text-sm">
              © 2024 中文学习. Все права защищены.
            </div>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} />
    </div>
  )
} 