'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings,
  TrendingUp,
  Clock,
  Target,
  Award,
  User,
  LogOut,
  Calendar,
  AlertCircle,
  UserCheck,
  Globe,
  Activity
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { signOut } from '@/lib/authUtils'
import { 
  getTeacherAnalytics,
  type TeacherAnalytics
} from '@/lib/api/teacherManagement'
import StudentsManagement from '@/components/teacher/StudentsManagement'
import ContentManagement from '@/components/teacher/ContentManagement'

export default function TeacherPanel() {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'content' | 'analytics'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Use auth guard with admin role requirement and session persistence
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useAuthGuard({
    requireRole: 'admin',
    requireEmailVerification: true,
    redirectPath: '/'
  })

  useEffect(() => {
    if (isAuthenticated && hasRequiredRole && user) {
      loadAnalytics()
    }
  }, [isAuthenticated, hasRequiredRole, user])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const analyticsData = await getTeacherAnalytics()
      setAnalytics(analyticsData)
    } catch (err: any) {
      console.error('Error loading teacher analytics:', err)
      setError('Ошибка загрузки аналитики')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      console.log('TeacherPanel: Signing out user')
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSettings = () => {
    console.log('TeacherPanel: Navigating to settings/profile page')
    router.push('/profile')
  }

  // Show loading while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Проверка доступа</h2>
            <p className="text-slate-600">Загрузка панели преподавателя...</p>
          </div>
        </div>
      </div>
    )
  }

  // Only render if user is authenticated and has required role
  if (!isAuthenticated || !hasRequiredRole || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Панель преподавателя</h1>
                <p className="text-sm text-slate-600">Управление платформой обучения</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user.full_name || user.email}</p>
                <p className="text-xs text-slate-600">Администратор</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSettings}>
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Обзор
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Студенты
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <BookOpen className="h-4 w-4 inline mr-2" />
              Контент
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Аналитика
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : error ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Ошибка загрузки</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <Button onClick={loadAnalytics} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                    Попробовать снова
                  </Button>
                </CardContent>
              </Card>
            ) : analytics ? (
              <>
                {/* Platform Statistics */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Статистика платформы</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-indigo-500/10 border-blue-200/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-700">Всего студентов</p>
                            <p className="text-3xl font-bold text-blue-900">{analytics.platform_stats.total_students}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-green-500/10 border-emerald-200/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-emerald-700">Активных сегодня</p>
                            <p className="text-3xl font-bold text-emerald-900">{analytics.platform_stats.active_students_today}</p>
                          </div>
                          <UserCheck className="h-8 w-8 text-emerald-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-violet-500/10 border-purple-200/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-700">Слов в системе</p>
                            <p className="text-3xl font-bold text-purple-900">{analytics.platform_stats.total_words_in_system}</p>
                          </div>
                          <BookOpen className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-orange-500/10 border-amber-200/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-amber-700">Сессий сегодня</p>
                            <p className="text-3xl font-bold text-amber-900">{analytics.platform_stats.total_sessions_today}</p>
                          </div>
                          <Activity className="h-8 w-8 text-amber-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Student Engagement */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Вовлеченность студентов</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Студенты с серией</p>
                            <p className="text-2xl font-bold text-slate-900">{analytics.student_engagement.students_with_streak}</p>
                          </div>
                          <Award className="h-6 w-6 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Средняя серия</p>
                            <p className="text-2xl font-bold text-slate-900">{analytics.student_engagement.average_streak_length} дн.</p>
                          </div>
                          <Calendar className="h-6 w-6 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Изучали сегодня</p>
                            <p className="text-2xl font-bold text-slate-900">{analytics.student_engagement.students_studied_today}</p>
                          </div>
                          <User className="h-6 w-6 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Минут сегодня</p>
                            <p className="text-2xl font-bold text-slate-900">{analytics.student_engagement.total_study_minutes_today}</p>
                          </div>
                          <Clock className="h-6 w-6 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Content Usage */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Использование контента</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Популярные категории</CardTitle>
                        <CardDescription>Наиболее изучаемые категории за последнюю неделю</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analytics.content_usage.most_studied_categories.map((category, index) => (
                            <div key={category.category_name} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                                  {index + 1}
                                </span>
                                <span className="font-medium text-slate-900">{category.category_name}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-900">{category.total_sessions} сессий</p>
                                <p className="text-xs text-slate-600">{category.avg_completion}% завершение</p>
                              </div>
                            </div>
                          ))}
                          {analytics.content_usage.most_studied_categories.length === 0 && (
                            <p className="text-slate-500 text-center py-4">Данные пока отсутствуют</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Прогресс сегодня</CardTitle>
                        <CardDescription>Достижения студентов за сегодня</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">Слов изучено</span>
                            <span className="font-bold text-2xl text-blue-600">{analytics.content_usage.words_learned_today}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">Категорий завершено</span>
                            <span className="font-bold text-2xl text-green-600">{analytics.content_usage.categories_completed_today}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">Точность платформы</span>
                            <span className="font-bold text-2xl text-purple-600">{analytics.platform_stats.platform_accuracy}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Быстрые действия</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('students')}>
                      <CardContent className="p-6 text-center">
                        <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Управление студентами</h3>
                        <p className="text-slate-600">Просматривайте прогресс и управляйте учениками</p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('content')}>
                      <CardContent className="p-6 text-center">
                        <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Создание контента</h3>
                        <p className="text-slate-600">Добавляйте новые слова и категории</p>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('analytics')}>
                      <CardContent className="p-6 text-center">
                        <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Детальная аналитика</h3>
                        <p className="text-slate-600">Углубленный анализ данных платформы</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {activeTab === 'students' && <StudentsManagement />}
        {activeTab === 'content' && <ContentManagement />}
        
        {activeTab === 'analytics' && (
          <div className="p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Детальная аналитика</h3>
                <p className="text-slate-500">Расширенные возможности аналитики будут добавлены в следующих версиях</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('overview')}>
                  Вернуться к обзору
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 