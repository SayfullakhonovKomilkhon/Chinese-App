'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCategories, CategorySummary } from '@/lib/questionsApi'
import { getUserActivityForDashboard } from '@/lib/userActivityApi'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ArrowRight, Loader2, RefreshCw, Sparkles, GraduationCap, TrendingUp } from 'lucide-react'

export default function StudentDashboard() {
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [userStats, setUserStats] = useState<{
    totalQuestionsViewed: number;
    totalSessions: number;
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError('Ошибка загрузки категорий')
    } finally {
      setLoading(false)
    }
  }

  const loadUserStats = async () => {
    try {
      setStatsLoading(true)
      const stats = await getUserActivityForDashboard()
      setUserStats(stats)
    } catch (err) {
      console.error('Error loading user activity:', err)
      // Don't set error for stats, just use default values
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadUserStats()
  }, [])

  const handleStartLearning = (category: string) => {
    const encodedCategory = encodeURIComponent(category)
    router.push(`/study/${encodedCategory}`)
  }

  const getQuestionCountText = (count: number) => {
    if (count === 1) return '1 вопрос'
    if (count >= 2 && count <= 4) return `${count} вопроса`
    return `${count} вопросов`
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
            <h2 className="text-3xl font-bold text-white mb-2">Загрузка категорий...</h2>
            <p className="text-cyan-300 text-lg">Подготавливаем материалы для изучения</p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (error) {
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
                onClick={loadCategories}
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
        <motion.div
          animate={{
            rotate: 180,
            scale: [1, 1.15, 1],
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            scale: { duration: 12, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/25">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Панель студента
          </h1>
          <p className="text-xl text-cyan-300 max-w-2xl mx-auto leading-relaxed">
            Выберите категорию для изучения китайского языка
          </p>
          
          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 inline-flex items-center gap-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 px-6 py-3 shadow-xl"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">{categories.length}</span>
              <span className="text-cyan-300">категорий</span>
            </div>
            <div className="w-px h-6 bg-white/20" />
                         <div className="flex items-center gap-2">
               <BookOpen className="w-5 h-5 text-emerald-400" />
               <span className="text-white font-semibold">
                 {categories.reduce((total, cat) => total + cat.count, 0)}
               </span>
               <span className="text-cyan-300">вопросов</span>
             </div>
          </motion.div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Ваш прогресс в изучении китайского языка
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Words Studied Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 transition-all duration-300 group-hover:border-cyan-400/50">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 rounded-2xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/25">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-cyan-300 text-sm mb-1">Слов изучено</p>
                  <p className="text-3xl font-bold text-white">
                    {statsLoading ? '...' : userStats?.totalQuestionsViewed || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Total Sessions Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 transition-all duration-300 group-hover:border-purple-400/50">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 rounded-2xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-purple-300 text-sm mb-1">Всего сессий</p>
                  <p className="text-3xl font-bold text-white">
                    {statsLoading ? '...' : userStats?.totalSessions || 0}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Categories Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Категории для изучения
          </h2>
        </motion.div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <BookOpen className="w-8 h-8 text-white" />
              </motion.div>
              
              <h3 className="text-2xl font-bold text-white mb-4">Категории не найдены</h3>
              <p className="text-cyan-300 mb-6">
                Пока нет доступных категорий для изучения
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadCategories}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm border border-cyan-400/30"
              >
                <RefreshCw className="w-5 h-5" />
                Обновить
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
          >
            <AnimatePresence>
                           {categories.map((category, index) => (
                 <motion.div
                   key={category.category}
                   initial={{ opacity: 0, y: 20, scale: 0.9 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   transition={{ 
                     delay: index * 0.1,
                     duration: 0.5,
                     ease: "easeOut"
                   }}
                   whileHover={{ y: -8, scale: 1.02 }}
                   className="group relative"
                 >
                   {/* Card glow effect */}
                   <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                   
                   {/* Main card */}
                   <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 transition-all duration-300 group-hover:border-cyan-400/50 overflow-hidden">
                     {/* Card inner glow */}
                     <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-600/5 rounded-2xl" />
                     
                     {/* Animated corner accent */}
                     <motion.div
                       animate={{ 
                         rotate: [0, 90, 180, 270, 360],
                         scale: [1, 1.1, 1]
                       }}
                       transition={{ 
                         duration: 8, 
                         repeat: Infinity,
                         ease: "linear"
                       }}
                       className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full opacity-60"
                     />
                     
                     <div className="relative z-10">
                       {/* Category icon */}
                       <motion.div
                         whileHover={{ rotate: 15, scale: 1.1 }}
                         transition={{ duration: 0.2 }}
                         className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/25"
                       >
                         <BookOpen className="w-6 h-6 text-white" />
                       </motion.div>

                       {/* Category name */}
                       <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                         {category.category}
                       </h3>

                       {/* Question count */}
                       <p className="text-cyan-300 text-sm mb-6 flex items-center gap-2">
                         <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                         {getQuestionCountText(category.count)}
                       </p>

                       {/* Start learning button */}
                       <motion.button
                         whileHover={{ 
                           scale: 1.05,
                           boxShadow: "0 0 25px rgba(34, 211, 238, 0.4)"
                         }}
                         whileTap={{ scale: 0.95 }}
                         onClick={() => handleStartLearning(category.category)}
                         className="group/btn relative w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 backdrop-blur-sm border border-emerald-400/30 overflow-hidden"
                       >
                         {/* Button shimmer effect */}
                         <motion.div
                           animate={{ x: [-100, 100] }}
                           transition={{ 
                             duration: 2, 
                             repeat: Infinity, 
                             ease: "linear" 
                           }}
                           className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                         />
                         
                         <span className="relative flex items-center justify-center gap-2">
                           Начать изучение
                           <motion.div
                             animate={{ x: [0, 4, 0] }}
                             transition={{ 
                               duration: 1.5, 
                               repeat: Infinity,
                               ease: "easeInOut"
                             }}
                           >
                             <ArrowRight className="w-4 h-4" />
                           </motion.div>
                         </span>
                       </motion.button>
                     </div>
                   </div>
                 </motion.div>
               ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
} 