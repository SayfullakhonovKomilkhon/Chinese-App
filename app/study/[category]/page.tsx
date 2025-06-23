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
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Сессия завершена</h1>
                  <p className="text-sm text-slate-600">Отличная работа по изучению китайского языка</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              {/* Celebration Header */}
              <Card className="mb-8 text-center">
                <CardContent className="p-8">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">
                    Сессия завершена!
                  </h2>
                  <p className="text-slate-600 text-lg">
                    Отличная работа по изучению китайского языка
                  </p>
                </CardContent>
              </Card>

              {/* Session Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Слов изучено</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {sessionSummary.stats?.wordsStudied || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Точность</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {Math.round(sessionSummary.stats?.accuracy || 0)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Время</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {sessionSummary.stats?.duration || 0} мин
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Trophy className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Освоено</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {sessionSummary.stats?.wordsLearned || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleBackToDashboard}
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Вернуться к обучению</span>
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