'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  ArrowRight, 
  Loader2, 
  RefreshCw, 
  Sparkles, 
  GraduationCap, 
  TrendingUp,
  Clock,
  Target,
  Flame,
  Award,
  BarChart3,
  Calendar,
  Zap,
  User,
  Settings
} from 'lucide-react'

// Import new components and API
import StatCard from '@/components/StatCard'
import ProgressBar from '@/components/ProgressBar'
import LearningStatusBadge from '@/components/LearningStatusBadge'
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
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load all dashboard data in parallel
      const [dashboard, categoriesData, wordsdue] = await Promise.all([
        getUserDashboard().catch(() => null),
        getCategoriesWithProgress().catch(() => []),
        getWordsDueToday().catch(() => 0)
      ])
      
      setDashboardStats(dashboard)
      setCategories(categoriesData)
      setWordsDueToday(wordsdue)
      
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError('Ошибка загрузки данных дашборда')
    } finally {
      setLoading(false)
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleStartLearning = (categoryId: number, categoryName: string) => {
    router.push(`/study/${encodeURIComponent(categoryName)}?categoryId=${categoryId}`)
  }

  const getProgressColor = (percentage: number): 'blue' | 'green' | 'purple' | 'orange' => {
    if (percentage >= 90) return 'purple'
    if (percentage >= 70) return 'green'
    if (percentage >= 40) return 'orange'
    return 'blue'
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

  // Sort categories: In Progress first, then Not Started, then Completed/Mastered at bottom
  const sortedCategories = [...categories].sort((a, b) => {
    const aStatus = a.progress?.status || 'not_started'
    const bStatus = b.progress?.status || 'not_started'
    
    // Priority order: in_progress -> not_started -> completed -> mastered
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
    
    // If same status, sort by difficulty level
    return a.difficulty_level - b.difficulty_level
  })

  const getCategoryGradient = (status: string, percentage: number) => {
    switch (status) {
      case 'completed': 
      case 'mastered': 
        return 'from-emerald-500/20 via-green-600/15 to-teal-500/20'
      case 'in_progress': 
        if (percentage >= 70) return 'from-amber-500/20 via-orange-600/15 to-yellow-500/20'
        return 'from-blue-500/20 via-indigo-600/15 to-purple-500/20'
      default: 
        return 'from-slate-500/20 via-gray-600/15 to-slate-500/20'
    }
  }

  const getCategoryBorderColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'mastered': 
        return 'border-emerald-400/30'
      case 'in_progress': 
        return 'border-blue-400/30'
      default: 
        return 'border-white/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              rotate: -360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 10, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-6"
            >
              <Loader2 className="w-16 h-16 text-cyan-400" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Загрузка дашборда...</h2>
            <p className="text-cyan-300 text-lg">Подготавливаем ваши данные для изучения</p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              rotate: -360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 10, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <RefreshCw className="w-8 h-8 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-4">Ошибка загрузки</h2>
              <p className="text-cyan-300 mb-6">{error}</p>
              
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(239, 68, 68, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={loadDashboardData}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-red-500/25 backdrop-blur-sm border border-red-400/30"
              >
                <RefreshCw className="w-5 h-5" />
                Попробовать снова
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header with Profile Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center mb-12"
        >
          {/* Profile Button - Top Right */}
          <motion.button
            onClick={() => router.push('/profile')}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute top-0 right-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white hover:bg-white/20 transition-all duration-200"
          >
            <User className="w-5 h-5" />
            <span className="hidden sm:inline">Профиль</span>
          </motion.button>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Панель ученика
          </h1>
          <p className="text-cyan-300 text-lg mb-6">
            Добро пожаловать в ваше путешествие изучения китайского языка
          </p>
          
          {/* Quick Stats Bar */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-white/80">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Слов к изучению сегодня: {wordsDueToday}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Серия: {dashboardStats?.user_statistics?.current_streak_days || 0} дней</span>
            </div>
             </div>
        </motion.div>

        {/* Comprehensive Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {/* Learning Progress Row */}
          <StatCard
            title="Изучено сегодня"
            value={dashboardStats?.user_statistics?.words_learned_today || 0}
            subtitle="слов"
            icon={BookOpen}
            gradient="from-blue-500 to-cyan-500"
            loading={statsLoading}
            delay={0}
          />
          
          <StatCard
            title="Всего изучено"
            value={dashboardStats?.user_statistics?.total_words_learned || 0}
            subtitle="слов"
            icon={GraduationCap}
            gradient="from-green-500 to-emerald-500"
            loading={statsLoading}
            delay={1}
          />
          
          <StatCard
            title="Освоено"
            value={dashboardStats?.user_statistics?.total_words_mastered || 0}
            subtitle="слов"
            icon={Award}
            gradient="from-purple-500 to-violet-500"
            loading={statsLoading}
            delay={2}
          />
          
          <StatCard
            title="Точность"
            value={`${Math.round(dashboardStats?.user_statistics?.overall_accuracy || 0)}%`}
            subtitle="правильных ответов"
            icon={Target}
            gradient="from-orange-500 to-yellow-500"
            loading={statsLoading}
            delay={3}
          />

          {/* Study Activity Row */}
          <StatCard
            title="Текущая серия"
            value={dashboardStats?.user_statistics?.current_streak_days || 0}
            subtitle="дней подряд"
            icon={Flame}
            gradient="from-red-500 to-pink-500"
            loading={statsLoading}
            delay={4}
          />
          
          <StatCard
            title="Лучшая серия"
            value={dashboardStats?.user_statistics?.longest_streak_days || 0}
            subtitle="дней"
            icon={TrendingUp}
            gradient="from-indigo-500 to-purple-500"
            loading={statsLoading}
            delay={5}
          />
          
          <StatCard
            title="Время изучения"
            value={Math.round((dashboardStats?.user_statistics?.total_study_minutes || 0) / 60)}
            subtitle="часов всего"
            icon={Clock}
            gradient="from-teal-500 to-cyan-500"
            loading={statsLoading}
            delay={6}
          />
          
          <StatCard
            title="Сессий"
            value={dashboardStats?.user_statistics?.total_sessions || 0}
            subtitle="занятий"
            icon={BarChart3}
            gradient="from-violet-500 to-purple-500"
            loading={statsLoading}
            delay={7}
          />

          {/* Category Progress Row */}
          <StatCard
            title="Завершено"
            value={dashboardStats?.user_statistics?.categories_completed || 0}
            subtitle="категорий"
            icon={Sparkles}
            gradient="from-emerald-500 to-green-500"
            loading={statsLoading}
            delay={8}
          />
          
          <StatCard
            title="В процессе"
            value={dashboardStats?.categories_in_progress || 0}
            subtitle="категорий"
            icon={Zap}
            gradient="from-yellow-500 to-orange-500"
            loading={statsLoading}
            delay={9}
          />
          
          <StatCard
            title="Активных дней"
            value={dashboardStats?.user_statistics?.total_active_days || 0}
            subtitle="дней изучения"
            icon={Calendar}
            gradient="from-pink-500 to-rose-500"
            loading={statsLoading}
            delay={10}
          />
          
          <StatCard
            title="Сегодня"
            value={`${Math.round(dashboardStats?.user_statistics?.minutes_studied_today || 0)} мин`}
            subtitle="времени изучения"
            icon={Clock}
            gradient="from-cyan-500 to-blue-500"
            loading={statsLoading}
            delay={11}
          />
        </motion.div>

        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">
            Категории для изучения
          </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              onClick={loadDashboardData}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20"
              >
              <RefreshCw className="w-4 h-4" />
                Обновить
              </motion.button>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Нет доступных категорий</h3>
              <p className="text-white/60">Категории будут загружены автоматически</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCategories.map((category, index) => {
                const status = category.progress?.status || 'not_started'
                const percentage = category.progress?.completion_percentage || 0
                const isCompleted = status === 'completed' || status === 'mastered'
                
                return (
          <motion.div
                    key={category.id}
                   initial={{ opacity: 0, y: 20, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -8,
                      boxShadow: isCompleted 
                        ? "0 25px 50px rgba(16, 185, 129, 0.15), 0 0 0 1px rgba(16, 185, 129, 0.1)" 
                        : "0 25px 50px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1)"
                    }}
                    className={`relative bg-gradient-to-br ${getCategoryGradient(status, percentage)} backdrop-blur-xl rounded-2xl border ${getCategoryBorderColor(status)} shadow-2xl p-6 cursor-pointer group overflow-hidden ${isCompleted ? 'opacity-75' : ''}`}
                    onClick={() => handleStartLearning(category.id, category.name_russian)}
                  >
                    {/* Completion Badge for Completed Categories */}
                    {isCompleted && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                      >
                        <Award className="w-3 h-3" />
                        {status === 'mastered' ? 'Освоено' : 'Завершено'}
                      </motion.div>
                    )}

                    {/* Category Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-2">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                          {category.name_russian}
                        </h3>
                        <p className="text-white/70 text-sm mb-3 leading-relaxed">
                          {category.description_russian}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">
                            <GraduationCap className="w-3 h-3 text-cyan-400" />
                            <span className="text-xs text-white/80 font-medium">
                              Уровень {category.difficulty_level}
                            </span>
                          </div>
                          {category.progress && (
                            <LearningStatusBadge 
                              status={category.progress.status === 'not_started' ? 'new' : 
                                     category.progress.status === 'in_progress' ? 'learning' :
                                     category.progress.status === 'completed' ? 'learned' : 'mastered'}
                              size="sm"
                              animated={true}
                            />
                          )}
                        </div>
                      </div>
                      
                       <motion.div
                        className="opacity-60 group-hover:opacity-100 transition-all duration-300"
                        whileHover={{ x: 5, scale: 1.1 }}
                       >
                        <div className="bg-white/10 p-2 rounded-full">
                          <ArrowRight className="w-5 h-5 text-cyan-400" />
                        </div>
                       </motion.div>
                    </div>

                    {/* Enhanced Progress Section */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-sm text-white/90 mb-3">
                        <span className="font-medium">
                          {category.progress?.words_learned || 0} из {category.progress?.total_words || category.total_words} слов
                        </span>
                        <span className="bg-white/10 px-2 py-1 rounded-lg font-bold">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                      
                      {/* Premium Progress Bar */}
                      <div className="relative">
                        <div className="w-full bg-white/10 rounded-full h-3 backdrop-blur-sm border border-white/20">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.2 * index }}
                            className={`h-full rounded-full bg-gradient-to-r ${
                              isCompleted 
                                ? 'from-emerald-400 via-green-500 to-teal-400' 
                                : percentage >= 70 
                                  ? 'from-amber-400 via-orange-500 to-yellow-400'
                                  : 'from-blue-400 via-indigo-500 to-purple-400'
                            } shadow-lg relative overflow-hidden`}
                          >
                         <motion.div
                              animate={{ x: ['-100%', '100%'] }}
                           transition={{ 
                             duration: 2, 
                             repeat: Infinity, 
                                ease: 'linear',
                                repeatDelay: 1 
                              }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            />
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Category Stats */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <BookOpen className="w-3 h-3" />
                        <span>{category.total_words} слов</span>
                      </div>
                      {category.progress?.last_studied_at && (
                        <div className="flex items-center gap-1 text-xs text-white/60">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(category.progress.last_studied_at).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Premium Hover Effects */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-all duration-500"
                    />
                    
                    {/* Shimmer effect for completed categories */}
                    {isCompleted && (
                           <motion.div
                        animate={{ x: ['-100%', '100%'] }}
                             transition={{ 
                          duration: 3, 
                               repeat: Infinity,
                          ease: 'linear',
                          repeatDelay: 2 
                             }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent"
                      />
                    )}
                           </motion.div>
                )
              })}
                     </div>
          )}
          </motion.div>
      </div>
    </div>
  )
} 