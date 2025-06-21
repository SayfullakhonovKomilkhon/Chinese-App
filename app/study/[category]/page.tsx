'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import FlashcardStudyAdvanced from '@/components/FlashcardStudyAdvanced'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, Trophy, Sparkles } from 'lucide-react'

export default function StudyPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = decodeURIComponent(params.category as string)
  const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')!) : undefined
  
  const [sessionSummary, setSessionSummary] = useState<any>(null)
  const [showSummary, setShowSummary] = useState(false)

  const handleComplete = (summary: any) => {
    setSessionSummary(summary)
    setShowSummary(true)
  }

  const handleError = (error: string) => {
    console.error('Study session error:', error)
    // You could show a toast notification here
    router.push('/student')
  }

  const handleBackToDashboard = () => {
    setShowSummary(false)
    router.push('/student')
  }

  // Show session summary modal
  if (showSummary && sessionSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-lg mx-auto p-6"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
            {/* Celebration Header */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Сессия завершена!
            </h2>
              <p className="text-emerald-300 text-lg">
                Отличная работа по изучению китайского языка
              </p>
            </motion.div>

            {/* Session Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">
                  {sessionSummary.stats?.wordsStudied || 0}
                </div>
                <div className="text-white/60 text-sm">Слов изучено</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">
                  {Math.round(sessionSummary.stats?.accuracy || 0)}%
                </div>
                <div className="text-white/60 text-sm">Точность</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-cyan-400">
                  {sessionSummary.stats?.duration || 0}
                </div>
                <div className="text-white/60 text-sm">Минут</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-purple-400">
                  {sessionSummary.stats?.wordsLearned || 0}
                </div>
                <div className="text-white/60 text-sm">Освоено</div>
              </div>
            </motion.div>

            {/* Continue Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToDashboard}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
            >
              Вернуться к обучению
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <FlashcardStudyAdvanced 
      categoryId={categoryId}
      categoryName={category} 
      onComplete={handleComplete}
      onError={handleError}
    />
  )
} 