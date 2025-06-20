'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, RotateCcw, Eye, EyeOff, CheckCircle, Volume2 } from 'lucide-react'
import { Question } from '@/lib/questionsApi'
import { incrementQuestionViewed, updateSessionActivity } from '@/lib/userActivityApi'
import { markCardViewed, markCardLearned } from '@/lib/api/userProgress'

interface FlashcardStudyProps {
  questions: Question[]
  category: string
  onComplete?: () => void
}

export default function FlashcardStudy({ questions, category, onComplete }: FlashcardStudyProps) {
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>(questions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showTranslation, setShowTranslation] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [sessionStartTime] = useState(new Date())
  const [questionsViewed, setQuestionsViewed] = useState(new Set<number>())

  // Update questions when prop changes
  useEffect(() => {
    setCurrentQuestions(questions)
    setCurrentIndex(0)
    setShowTranslation(false)
  }, [questions])

  const currentQuestion = currentQuestions[currentIndex]
  const progress = ((currentIndex + 1) / currentQuestions.length) * 100

  // Track when a new question is viewed
  useEffect(() => {
    if (currentQuestion && !questionsViewed.has(currentQuestion.id)) {
      setQuestionsViewed(prev => {
        const newSet = new Set(prev)
        newSet.add(currentQuestion.id)
        return newSet
      })
      // Increment question viewed count
      incrementQuestionViewed().catch(error => {
        console.error('Error tracking question view:', error)
      })
    }
  }, [currentQuestion, questionsViewed])

  const handleShowTranslation = async () => {
    if (!showTranslation && currentQuestion) {
      // Mark card as viewed in database
      try {
        await markCardViewed(currentQuestion.id)
      } catch (error) {
        console.error('Error marking card as viewed:', error)
      }
    }
    
    setShowTranslation(!showTranslation)
  }

  const handleNextCard = async () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    setShowTranslation(false)
    
    // If it's the last card, mark it as learned
    if (currentIndex === currentQuestions.length - 1) {
      try {
        await markCardLearned(currentQuestion.id)
        
        // Mark current question as learned in the local state
        setCurrentQuestions(prevQuestions => {
          const newQuestions = [...prevQuestions]
          newQuestions[currentIndex] = { ...newQuestions[currentIndex], is_learned: true }
          return newQuestions
        })
        
        // Show learned indicator for a moment before completing
        setTimeout(() => {
          // Completed all cards - track session statistics
          const sessionEndTime = new Date()
          const sessionDurationMinutes = Math.round((sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60))
          
          updateSessionActivity(sessionDurationMinutes).catch((error: any) => {
            console.error('Error updating session statistics:', error)
          })
          
          if (onComplete) {
            onComplete()
          }
        }, 1000) // Wait 1 second to show the learned label
        
        setIsAnimating(false)
        return // Exit early for the last card
        
      } catch (error) {
        console.error('Error marking card as learned:', error)
      }
    }
    
    // Small delay for animation
    setTimeout(() => {
      if (currentIndex < currentQuestions.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // Completed all cards - track session statistics
        const sessionEndTime = new Date()
        const sessionDurationMinutes = Math.round((sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60))
        
        updateSessionActivity(sessionDurationMinutes).catch((error: any) => {
          console.error('Error updating session statistics:', error)
        })
        
        if (onComplete) {
          onComplete()
        }
      }
      setIsAnimating(false)
    }, 300)
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setShowTranslation(false)
  }

  const handlePlayAudio = () => {
    if (currentQuestion && currentQuestion.hanzi) {
      try {
        // Cancel any existing speech to prevent overlapping
        speechSynthesis.cancel()
        
        const speakText = () => {
          const voices = speechSynthesis.getVoices()
          const chineseVoice = voices.find(v => 
            v.lang === 'zh-CN' || 
            v.lang === 'zh' || 
            v.lang.startsWith('zh-CN') || 
            v.lang.startsWith('zh')
          )
          
          const utterance = new SpeechSynthesisUtterance(currentQuestion.hanzi)
          
          if (chineseVoice) {
            utterance.voice = chineseVoice
            console.log('Using Chinese voice:', chineseVoice.name)
          } else {
            console.warn('Chinese voice not found, using default voice')
          }
          
          utterance.lang = 'zh-CN'
          utterance.rate = 0.9
          utterance.pitch = 1.0
          utterance.volume = 1.0
          
          speechSynthesis.speak(utterance)
        }
        
        // Check if voices are loaded, if not wait for them
        const voices = speechSynthesis.getVoices()
        if (voices.length === 0) {
          // Voices not loaded yet, wait for them
          speechSynthesis.onvoiceschanged = () => {
            speakText()
            speechSynthesis.onvoiceschanged = null // Clean up the event listener
          }
        } else {
          speakText()
        }
        
      } catch (error) {
        console.error('Error playing audio:', error)
      }
    }
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Нет вопросов для изучения</h2>
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {category}
          </h1>
          <p className="text-cyan-300 text-lg">
            Карточка {currentIndex + 1} из {currentQuestions.length}
          </p>
          
          {/* Progress bar */}
          <div className="w-full max-w-md mx-auto mt-4 bg-white/10 rounded-full h-2 backdrop-blur-sm">
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
                  
                  {/* Learned label */}
                  {currentQuestion.is_learned && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Изучено</span>
                    </motion.div>
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
                        {currentQuestion.hanzi}
                      </h2>
                      <p className="text-xl md:text-2xl text-cyan-300 font-medium italic">
                        {currentQuestion.pinyin}
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
                              {currentQuestion.translation}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action buttons */}
                    <div className="flex gap-4 justify-center">
                      {/* Play Audio button */}
                      <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(168, 85, 247, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlayAudio}
                        className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm border border-purple-400/30"
                      >
                        <Volume2 className="w-6 h-6" />
                        <span className="text-lg">Воспроизвести</span>
                        
                        {/* Button glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 to-violet-500/0 group-hover:from-purple-400/20 group-hover:to-violet-500/20 rounded-2xl transition-all duration-300" />
                      </motion.button>

                    {/* Show translation button */}
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(34, 211, 238, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShowTranslation}
                      className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm border border-cyan-400/30"
                    >
                      <motion.div
                        animate={{ rotate: showTranslation ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {showTranslation ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                      </motion.div>
                      <span className="text-lg">
                        {showTranslation ? 'Скрыть перевод' : 'Показать перевод'}
                      </span>
                      
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 to-blue-500/0 group-hover:from-cyan-400/20 group-hover:to-blue-500/20 rounded-2xl transition-all duration-300" />
                    </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-4 justify-center mt-8"
            >
              {/* Reset button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-400 hover:to-pink-400 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-purple-400/30 shadow-lg hover:shadow-purple-500/25"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Сначала</span>
              </motion.button>

              {/* Next button */}
              <motion.button
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)" 
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextCard}
                disabled={isAnimating}
                className="group relative flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 backdrop-blur-sm border border-emerald-400/30 disabled:opacity-50"
              >
                <span className="text-lg">
                  {currentIndex === currentQuestions.length - 1 ? 'Завершить' : 'Следующая карточка'}
                </span>
                <motion.div
                  animate={{ x: isAnimating ? 5 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-6 h-6" />
                </motion.div>
                
                {/* Button pulse effect */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5] 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 to-teal-500/0 group-hover:from-emerald-400/20 group-hover:to-teal-500/20 rounded-2xl"
                />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 