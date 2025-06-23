'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, RotateCcw, Eye, EyeOff, CheckCircle, Volume2, Star, Zap, X, Trophy, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    if (currentWord && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentWord.chinese_simplified)
      utterance.lang = 'zh-CN'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const getLearningStatusColor = (status: string) => {
    switch (status) {
      case 'learned': return 'text-emerald-700 bg-emerald-100'
      case 'learning': return 'text-blue-700 bg-blue-100'
      case 'review': return 'text-amber-700 bg-amber-100'
      default: return 'text-slate-700 bg-slate-100'
    }
  }

  const getLearningStatusText = (status: string) => {
    switch (status) {
      case 'learned': return 'Изучено'
      case 'learning': return 'Изучается'
      case 'review': return 'Повторение'
      default: return 'Новое'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Подготовка слов</h2>
            <p className="text-slate-600">Используем алгоритм интервального повторения</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentWord) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Нет слов для изучения</h2>
            <p className="text-slate-600">Все слова в этой категории изучены!</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{categoryName}</h1>
                <p className="text-sm text-slate-600">Слово {currentIndex + 1} из {words.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-4 text-sm">
                <span className="text-slate-600">Изучено: <span className="font-semibold text-slate-900">{sessionStats.wordsLearned}</span></span>
                <span className="text-slate-600">Точность: <span className="font-semibold text-slate-900">{Math.round(sessionStats.accuracy)}%</span></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="h-1 bg-slate-200 rounded-full">
            <div 
              className="h-1 bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            {/* Main Flashcard */}
            <Card className="mb-8">
              <CardContent className="p-8 md:p-12 text-center">
                {/* Learning Status Badge */}
                {currentWord.progress && (
                  <div className="flex justify-end mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLearningStatusColor(currentWord.progress.learning_status)}`}>
                      {currentWord.progress.learning_status === 'learned' ? (
                        <Trophy className="w-4 h-4 mr-1" />
                      ) : (
                        <Star className="w-4 h-4 mr-1" />
                      )}
                      {getLearningStatusText(currentWord.progress.learning_status)}
                    </span>
                  </div>
                )}

                {/* Chinese Characters */}
                <div className="mb-8">
                  <h2 className="text-6xl md:text-8xl font-bold text-slate-900 mb-4 tracking-wide">
                    {currentWord.chinese_simplified}
                  </h2>
                  {/* Pinyin shown only after translation is revealed */}
                  {showTranslation && (
                    <p className="text-2xl md:text-3xl text-slate-600 font-medium">
                      {currentWord.pinyin}
                    </p>
                  )}
                </div>

                {/* Translation (when revealed) */}
                {showTranslation && (
                  <Card className="mb-8 border-emerald-200 bg-emerald-50">
                    <CardContent className="p-6">
                      <p className="text-2xl md:text-3xl font-semibold text-emerald-800">
                        {currentWord.russian_translation}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center mb-8">
                  <Button
                    onClick={handlePlayAudio}
                    variant="purple"
                    className="flex items-center space-x-2"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>Аудио</span>
                  </Button>

                  <Button
                    onClick={handleShowTranslation}
                    variant="cyan"
                    className="flex items-center space-x-2"
                  >
                    {showTranslation ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    <span>{showTranslation ? 'Скрыть' : 'Перевод'}</span>
                  </Button>
                </div>

                {/* Difficulty Rating Buttons (shown after translation is revealed) */}
                {showTranslation && (
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={() => handleDifficultyRating('easy')}
                      disabled={isAnimating}
                      variant="success"
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Легко</span>
                    </Button>

                    <Button
                      onClick={() => handleDifficultyRating('hard')}
                      disabled={isAnimating}
                      variant="warning"
                      className="flex items-center space-x-2"
                    >
                      <Zap className="w-5 h-5" />
                      <span>Сложно</span>
                    </Button>

                    <Button
                      onClick={() => handleDifficultyRating('forgot')}
                      disabled={isAnimating}
                      variant="destructive"
                      className="flex items-center space-x-2"
                    >
                      <X className="w-5 h-5" />
                      <span>Забыл</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Stats (mobile) */}
            <div className="sm:hidden mb-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-slate-600">Изучено</p>
                    <p className="text-xl font-bold text-slate-900">{sessionStats.wordsLearned}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-slate-600">Точность</p>
                    <p className="text-xl font-bold text-slate-900">{Math.round(sessionStats.accuracy)}%</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Сначала</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 