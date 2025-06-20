'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getQuestionsWithLearnedStatus, Question } from '@/lib/questionsApi'
import FlashcardStudy from '@/components/FlashcardStudy'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function StudyPage() {
  const params = useParams()
  const router = useRouter()
  const category = decodeURIComponent(params.category as string)
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getQuestionsWithLearnedStatus(category)
        setQuestions(data)
      } catch (err) {
        console.error('Error fetching questions:', err)
        setError('Ошибка загрузки вопросов')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [category])

  const handleComplete = () => {
    router.push('/student')
  }

  const handleBack = () => {
    router.push('/student')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Loader2 className="w-12 h-12 text-cyan-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Загрузка вопросов...</h2>
          <p className="text-cyan-300">{category}</p>
        </motion.div>
      </div>
    )
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              {error || 'Нет вопросов'}
            </h2>
            <p className="text-cyan-300 mb-6">
              {error ? 'Попробуйте перезагрузить страницу' : `В категории "${category}" пока нет вопросов для изучения`}
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm border border-cyan-400/30"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад к категориям
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <FlashcardStudy 
      questions={questions} 
      category={category} 
      onComplete={handleComplete}
    />
  )
} 