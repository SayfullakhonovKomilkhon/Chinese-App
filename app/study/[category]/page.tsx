'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import FlashcardStudyAdvanced from '@/components/FlashcardStudyAdvanced'
import { ArrowLeft, Loader2, Trophy, Sparkles, CheckCircle, Clock, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">Сессия завершена</h1>
                  <p className="text-xs sm:text-sm text-slate-600 truncate hidden sm:block">Отличная работа по изучению китайского языка</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-8">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              {/* Celebration Header */}
              <Card className="mb-6 sm:mb-8 text-center">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-3">
                    Сессия завершена!
                  </h2>
                  <p className="text-slate-600 text-base sm:text-lg">
                    Отличная работа по изучению китайского языка
                  </p>
                </CardContent>
              </Card>

              {/* Session Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                <Card>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Слов</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                          {sessionSummary.stats?.wordsStudied || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Точность</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                          {Math.round(sessionSummary.stats?.accuracy || 0)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Время</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                          {sessionSummary.stats?.duration || 0} мин
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg flex-shrink-0">
                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Освоено</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                          {sessionSummary.stats?.wordsLearned || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  onClick={handleBackToDashboard}
                  size="lg"
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Вернуться к обучению</span>
                </Button>
              </div>
            </div>
          </div>
        </main>
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