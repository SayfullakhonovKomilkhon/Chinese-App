'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, RotateCcw, Eye, EyeOff, CheckCircle, Volume2, Star, Zap, X, Trophy } from 'lucide-react'
import { WordWithProgress, UserSession } from '@/lib/types/learning'
import { 
  getWordsForStudy, 
  submitWordResponse, 
  startStudySession, 
  endStudySession,
  updateUserStreak,
  markWordAsLearned,
  isWordLearned
} from '@/lib/api/advancedLearning'

interface FlashcardStudyAdvancedProps {
  categoryId?: number
  categoryName: string
  onComplete?: (sessionSummary: any) => void
  onError?: (error: string) => void
}

export default function FlashcardStudyAdvanced({ 
  categoryId, 
  categoryName, 
  onComplete, 
  onError 
}: FlashcardStudyAdvancedProps) {
  // State management
  const [words, setWords] = useState<WordWithProgress[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [sessionStartTime] = useState(new Date())
  
  // Session statistics
  const [sessionStats, setSessionStats] = useState({
    wordsStudied: 0,
    wordsLearned: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    accuracy: 0
  })

  const currentWord = words[currentIndex]
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0

  // Initialize study session
  useEffect(() => {
    initializeSession()
  }, [categoryId])

  const initializeSession = async () => {
    try {
      setLoading(true)
      
      // Start session
      const newSessionId = await startStudySession(categoryId, 'study')
      setSessionId(newSessionId)
      
      // Get words for study
      const studyWords = await getWordsForStudy(categoryId, {
        max_words: 20,
        include_review: true,
        include_new: true
      })
      
      if (studyWords.length === 0) {
        onError?.('Нет слов для изучения в данной категории')
        return
      }
      
      setWords(studyWords)
      setCurrentIndex(0)
      setShowTranslation(false)
    } catch (error) {
      console.error('Error initializing session:', error)
      onError?.('Ошибка инициализации сессии изучения')
    } finally {
      setLoading(false)
    }
  }

  const handleShowTranslation = () => {
    setShowTranslation(!showTranslation)
  }

  const handleDifficultyRating = async (difficulty: 'easy' | 'hard' | 'forgot') => {
    if (!currentWord || !sessionId || isAnimating) return
    
    setIsAnimating(true)
    
    try {
      // Submit response to backend
      await submitWordResponse({
        word_id: currentWord.id,
        difficulty_rating: difficulty,
        session_id: sessionId
      })
      
      // If user finds it easy, mark as learned immediately for better UX
      if (difficulty === 'easy') {
        // Mark word as learned in the local state for immediate feedback
        setWords(prev => 
          prev.map((word, index) => 
            index === currentIndex 
              ? { ...word, learning_status: 'learned' }
              : word
          )
        )
      }
      
      // Calculate updated session statistics
      const wasCorrect = difficulty === 'easy' || difficulty === 'hard'
      const wasLearned = difficulty === 'easy'
      
      const updatedStats = {
        wordsStudied: sessionStats.wordsStudied + 1,
        wordsLearned: wasLearned ? sessionStats.wordsLearned + 1 : sessionStats.wordsLearned,
        correctAnswers: wasCorrect ? sessionStats.correctAnswers + 1 : sessionStats.correctAnswers,
        totalAnswers: sessionStats.totalAnswers + 1,
        accuracy: sessionStats.totalAnswers >= 0 ? 
          ((wasCorrect ? sessionStats.correctAnswers + 1 : sessionStats.correctAnswers) / (sessionStats.totalAnswers + 1)) * 100 : 0
      }
      
      // Update session statistics state
      setSessionStats(updatedStats)
      
      // Show success animation for easy/learned words
      if (difficulty === 'easy') {
        setTimeout(() => {
          if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setShowTranslation(false)
          } else {
            // Complete session with the calculated stats
            completeSessionWithStats(updatedStats)
          }
          setIsAnimating(false)
        }, 1500) // Longer delay to show "learned" status
      } else {
        // Move to next word more quickly for hard/forgot
        setTimeout(() => {
          if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1)
            setShowTranslation(false)
          } else {
            // Complete session with the calculated stats
            completeSessionWithStats(updatedStats)
          }
          setIsAnimating(false)
        }, 800)
      }
      
    } catch (error) {
      console.error('Error submitting word response:', error)
      setIsAnimating(false)
    }
  }

  const completeSession = async () => {
    await completeSessionWithStats(sessionStats)
  }

  const completeSessionWithStats = async (finalStats: typeof sessionStats) => {
    if (!sessionId) return
    
    try {
      // Calculate session duration
      const sessionEndTime = new Date()
      const durationMinutes = Math.round((sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60))
      
      // End session in database with actual statistics
      const completedSession = await endStudySession(sessionId, {
        wordsStudied: finalStats.wordsStudied,
        wordsLearned: finalStats.wordsLearned,
        correctAnswers: finalStats.correctAnswers,
        totalAnswers: finalStats.totalAnswers
      })
      
      // Update user streak
      await updateUserStreak()
      
      // Prepare session summary
      const sessionSummary = {
        session: completedSession,
        stats: {
          ...finalStats,
          duration: durationMinutes
        },
        wordsStudied: words.slice(0, currentIndex + 1),
        categoryName
      }
      
      onComplete?.(sessionSummary)
    } catch (error) {
      console.error('Error completing session:', error)
      onError?.('Ошибка завершения сессии')
    }
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setShowTranslation(false)
    setSessionStats({
      wordsStudied: 0,
      wordsLearned: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      accuracy: 0
    })
  }

  const handlePlayAudio = () => {
    if (currentWord && currentWord.chinese_simplified) {
      try {
        speechSynthesis.cancel()
        
        const speakText = () => {
          const voices = speechSynthesis.getVoices()
          const chineseVoice = voices.find(v => 
            v.lang === 'zh-CN' || 
            v.lang === 'zh' || 
            v.lang.startsWith('zh-CN') || 
            v.lang.startsWith('zh')
          )
          
          const utterance = new SpeechSynthesisUtterance(currentWord.chinese_simplified)
          
          if (chineseVoice) {
            utterance.voice = chineseVoice
          }
          
          utterance.lang = 'zh-CN'
          utterance.rate = 0.9
          utterance.pitch = 1.0
          utterance.volume = 1.0
          
          speechSynthesis.speak(utterance)
        }
        
        const voices = speechSynthesis.getVoices()
        if (voices.length === 0) {
          speechSynthesis.onvoiceschanged = () => {
            speakText()
            speechSynthesis.onvoiceschanged = null
          }
        } else {
          speakText()
        }
        
      } catch (error) {
        console.error('Error playing audio:', error)
      }
    }
  }

  const getLearningStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'from-blue-500 to-cyan-500'
      case 'learning': return 'from-yellow-500 to-orange-500'
      case 'learned': return 'from-green-500 to-emerald-500'
      case 'mastered': return 'from-purple-500 to-violet-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

  const getLearningStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новое'
      case 'learning': return 'Изучается'
      case 'learned': return 'Изучено'
      case 'mastered': return 'Освоено'
      default: return 'Неизвестно'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-6"
          >
            <Zap className="w-16 h-16 text-cyan-400" />
          </motion.div>
          <h2 className="text-3xl font-bold mb-2">Подготовка слов...</h2>
          <p className="text-cyan-300 text-lg">Используем алгоритм интервального повторения</p>
        </motion.div>
      </div>
    )
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Нет слов для изучения</h2>
          <p className="text-cyan-300">Все слова в этой категории изучены!</p>
        </motion.div>
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

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header with session stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {categoryName}
          </h1>
          <p className="text-cyan-300 text-lg mb-4">
            Слово {currentIndex + 1} из {words.length}
          </p>
          
          {/* Session Statistics */}
          <div className="flex justify-center gap-4 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/20">
              <span className="text-white text-sm">Изучено: {sessionStats.wordsLearned}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/20">
              <span className="text-white text-sm">Точность: {Math.round(sessionStats.accuracy)}%</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto bg-white/10 rounded-full h-2 backdrop-blur-sm">
            <motion.div
              className="h-2 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Main flashcard area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-lg">
            <AnimatePresence mode="wait" key={currentIndex}>
              <motion.div
                key={`card-${currentIndex}`}
                initial={{ opacity: 0, rotateY: 90, scale: 0.8 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: -90, scale: 0.8 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="relative"
              >
                {/* Glassmorphism card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8 md:p-12 text-center relative overflow-hidden">
                  {/* Card glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 rounded-2xl" />
                  
                  {/* Learning status badge */}
                  {currentWord.progress && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: 1, 
                        scale: currentWord.progress.learning_status === 'learned' ? [1, 1.2, 1] : 1 
                      }}
                      transition={{ 
                        scale: { 
                          duration: 0.6, 
                          repeat: currentWord.progress.learning_status === 'learned' ? 3 : 0 
                        } 
                      }}
                      className={`absolute top-4 right-4 bg-gradient-to-r ${getLearningStatusColor(currentWord.progress.learning_status)} text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg`}
                    >
                      {currentWord.progress.learning_status === 'learned' ? (
                        <Trophy className="w-4 h-4" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                      <span>{getLearningStatusText(currentWord.progress.learning_status)}</span>
                    </motion.div>
                  )}
                  
                  {/* Celebration effect for learned words */}
                  {currentWord.progress?.learning_status === 'learned' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-2xl pointer-events-none"
                    />
                  )}
                  
                  <div className="relative z-10">
                    {/* Chinese characters */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6"
                    >
                      <h2 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-wide">
                        {currentWord.chinese_simplified}
                      </h2>
                      <p className="text-xl md:text-2xl text-cyan-300 font-medium italic">
                        {currentWord.pinyin}
                      </p>
                    </motion.div>

                    {/* Translation reveal */}
                    <AnimatePresence>
                      {showTranslation && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.9 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className="mb-8"
                        >
                          <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/30 p-4">
                            <p className="text-2xl md:text-3xl font-semibold text-emerald-300">
                              {currentWord.russian_translation}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action buttons */}
                    <div className="flex gap-4 justify-center mb-6">
                      {/* Play Audio button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlayAudio}
                        className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm border border-purple-400/30"
                      >
                        <Volume2 className="w-5 h-5" />
                        <span>Аудио</span>
                      </motion.button>

                      {/* Show translation button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShowTranslation}
                        className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm border border-cyan-400/30"
                      >
                        <motion.div
                          animate={{ rotate: showTranslation ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {showTranslation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </motion.div>
                        <span>
                          {showTranslation ? 'Скрыть' : 'Перевод'}
                        </span>
                      </motion.button>
                    </div>

                    {/* Difficulty Rating Buttons (shown after translation is revealed) */}
                    <AnimatePresence>
                      {showTranslation && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4 }}
                          className="flex gap-3 justify-center"
                        >
                          {/* Easy Button */}
                          <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(34, 197, 94, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDifficultyRating('easy')}
                            disabled={isAnimating}
                            className="group relative flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-green-500/25 backdrop-blur-sm border border-green-400/30 disabled:opacity-50"
                          >
                            <CheckCircle className="w-5 h-5" />
                            <span>Легко</span>
                          </motion.button>

                          {/* Hard Button */}
                          <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(251, 146, 60, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDifficultyRating('hard')}
                            disabled={isAnimating}
                            className="group relative flex items-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-400 hover:to-yellow-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-orange-500/25 backdrop-blur-sm border border-orange-400/30 disabled:opacity-50"
                          >
                            <Zap className="w-5 h-5" />
                            <span>Сложно</span>
                          </motion.button>

                          {/* Forgot Button */}
                          <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(239, 68, 68, 0.4)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDifficultyRating('forgot')}
                            disabled={isAnimating}
                            className="group relative flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-red-500/25 backdrop-blur-sm border border-red-400/30 disabled:opacity-50"
                          >
                            <X className="w-5 h-5" />
                            <span>Забыл</span>
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Reset button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-400 hover:to-pink-400 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-purple-400/30 shadow-lg hover:shadow-purple-500/25"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Сначала</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 