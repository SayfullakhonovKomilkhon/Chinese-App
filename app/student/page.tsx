'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, 
  ArrowRight, 
  RefreshCw, 
  GraduationCap, 
  TrendingUp,
  Clock,
  Target,
  Award,
  BarChart3,
  Calendar,
  User,
  Settings,
  Play,
  CheckCircle2,
  Trophy,
  AlertCircle,
  LogOut
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { signOut } from '@/lib/authUtils'
import { 
  getUserDashboard, 
  getCategoriesWithProgress, 
  getWordsDueToday 
} from '@/lib/api/advancedLearning'
import { 
  DashboardStats, 
  CategorySummary 
} from '@/lib/types/learning'

export default function StudentDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [wordsDueToday, setWordsDueToday] = useState<number>(0)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Use auth guard with student role requirement and session persistence
  const { user, loading: authLoading, isAuthenticated, hasRequiredRole } = useAuthGuard({
    requireRole: 'student',
    requireEmailVerification: true,
    redirectPath: '/'
  })

  const loadDashboardData = async () => {
    if (!user) return
    
    try {
      console.log('StudentDashboard: Loading dashboard data...')
      setDataLoading(true)
      setError(null)
      
      // Load all dashboard data in parallel with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Dashboard data loading timeout')), 10000)
      })
      
      const dataPromise = Promise.all([
        getUserDashboard().catch(() => null),
        getCategoriesWithProgress().catch(() => []),
        getWordsDueToday().catch(() => 0)
      ])
      
      const [dashboard, categoriesData, wordsdue] = await Promise.race([dataPromise, timeoutPromise]) as any
      
      console.log('StudentDashboard: Dashboard data loaded successfully')
      setDashboardStats(dashboard)
      setCategories(categoriesData)
      setWordsDueToday(wordsdue)
      
    } catch (err: any) {
      console.error('StudentDashboard: Error loading dashboard:', err)
      setError('Ошибка загрузки данных дашборда')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && hasRequiredRole && user) {
      loadDashboardData()
    }
  }, [isAuthenticated, hasRequiredRole, user])

  const handleStartLearning = (categoryId: number, categoryName: string) => {
    console.log('StudentDashboard: Starting learning for category:', categoryName)
    router.push(`/study/${encodeURIComponent(categoryName)}?categoryId=${categoryId}`)
  }

  const handleSettings = () => {
    console.log('StudentDashboard: Navigating to settings/profile page')
    router.push('/profile')
  }

  const handleSignOut = async () => {
    try {
      console.log('StudentDashboard: Signing out user')
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-purple-500'
    if (percentage >= 70) return 'bg-emerald-500'
    if (percentage >= 40) return 'bg-amber-500'
    return 'bg-blue-500'
  }

  const getCategoryStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return 'Не начата'
      case 'in_progress': return 'В процессе'
      case 'completed': return 'Завершена'
      case 'mastered': return 'Освоена'
      default: return 'Не начата'
    }
  }

  const getCategoryStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'mastered': 
        return 'text-emerald-700 bg-emerald-100'
      case 'in_progress': 
        return 'text-blue-700 bg-blue-100'
      default: 
        return 'text-slate-700 bg-slate-100'
    }
  }

  // Sort categories: In Progress first, then Not Started, then Completed/Mastered
  const sortedCategories = [...categories].sort((a, b) => {
    const aStatus = a.progress?.status || 'not_started'
    const bStatus = b.progress?.status || 'not_started'
    
    const statusPriority = {
      'in_progress': 1,
      'not_started': 2,
      'completed': 3,
      'mastered': 4
    }
    
    const aPriority = statusPriority[aStatus] || 2
    const bPriority = statusPriority[bStatus] || 2
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }
    
    return a.difficulty_level - b.difficulty_level
  })

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
            <p className="text-slate-600">Загрузка панели студента...</p>
          </div>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated or doesn't have required role
  if (!isAuthenticated || !hasRequiredRole || !user) {
    return null
  }

  // Show loading while fetching dashboard data
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Загрузка данных</h2>
            <p className="text-slate-600">Подготовка вашего дашборда...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Ошибка загрузки</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={loadDashboardData} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">Студент</h1>
                <p className="text-xs sm:text-sm text-slate-600 truncate">
                  {user.full_name || user.email.split('@')[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={handleSettings} className="px-2 sm:px-3">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Настройки</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="px-2 sm:px-3">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Выйти</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Слов</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                    {dashboardStats?.user_statistics?.total_words_learned || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Изучено</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                    {dashboardStats?.user_statistics?.total_words_learned || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Сегодня</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                    {wordsDueToday}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Точность</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                    {Math.round(dashboardStats?.user_statistics?.overall_accuracy || 0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">Категории</h2>
              <p className="text-sm sm:text-base text-slate-600 hidden sm:block">Выберите категорию для продолжения обучения</p>
            </div>
            <Button variant="outline" onClick={loadDashboardData} size="sm" className="flex-shrink-0">
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Обновить</span>
            </Button>
          </div>

          {sortedCategories.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Нет доступных категорий</h3>
                <p className="text-slate-600">Категории для изучения появятся здесь после настройки курса.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sortedCategories.map((category) => {
                const progress = category.progress
                const percentage = progress?.completion_percentage || 0
                const status = progress?.status || 'not_started'
                
                return (
                  <Card key={category.id} className="hover:shadow-md cursor-pointer group" onClick={() => handleStartLearning(category.id, category.name_russian)}>
                    <CardContent className="p-4 sm:p-5 lg:p-6">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 truncate">
                            {category.name_russian}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 mb-2 sm:mb-3 line-clamp-2">
                            {category.description_russian || 'Изучение китайского языка'}
                          </p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryStatusColor(status)}`}>
                            {getCategoryStatusText(status)}
                          </span>
                        </div>
                        <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg ml-3 sm:ml-4 flex-shrink-0">
                          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                        </div>
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Прогресс</span>
                          <span className="font-semibold text-slate-900">{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(percentage)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>HSK {category.difficulty_level}</span>
                          <span>{progress?.words_learned || 0} слов</span>
                        </div>
                      </div>
                      
                      <Button className="w-full mt-3 sm:mt-4" variant="outline" size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          {status === 'not_started' ? 'Начать' : 'Продолжить'}
                        </span>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 