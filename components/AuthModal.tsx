'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, User, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react'
import { useAuth } from './AuthProvider'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const selectedRole = 'student'
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const router = useRouter()

  const validateForm = () => {
    if (!email || !password) {
      setError('Пожалуйста, заполните все обязательные поля')
      return false
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        setError('Пожалуйста, введите ваше полное имя')
        return false
      }
      if (password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов')
        return false
      }
      if (password !== confirmPassword) {
        setError('Пароли не совпадают')
        return false
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Пожалуйста, введите корректный email адрес')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setIsLoading(true)

    try {
      if (isLogin) {
        console.log('AuthModal: Attempting client-side login for:', email)
        
        // Use client-side Supabase auth for login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          console.error('AuthModal: Login error:', error)
          
          // Provide user-friendly error messages
          let errorMessage = 'Ошибка входа. Попробуйте снова.'
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Неверный email или пароль. Проверьте данные.'
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Пожалуйста, подтвердите email перед входом.'
          } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Слишком много попыток входа. Попробуйте позже.'
          }
          
          setError(errorMessage)
          return
        }

        if (!data.user) {
          setError('Ошибка входа. Попробуйте снова.')
          return
        }

        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          setError('Пожалуйста, подтвердите email перед входом. Проверьте почту.')
          return
        }

        console.log('AuthModal: Login successful, user:', data.user.email)
        setSuccess('Вход выполнен успешно!')
        
        // Wait a bit for success message, then close modal
        setTimeout(() => {
          onClose()
          // Auth state change will be handled by AuthProvider
        }, 1500)
        
      } else {
        // For signup, still use the API route
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'signup',
            email,
            password,
            confirmPassword,
            fullName,
            role: selectedRole
          })
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.error)
          return
        }

        setSuccess(result.message)
        setShowEmailVerification(true)
        setTimeout(() => {
          setShowEmailVerification(false)
          setIsLogin(true)
          setSuccess('')
          setError('')
        }, 5000)
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setError('Произошла ошибка сети. Попробуйте снова.')
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!email) {
      setError('Пожалуйста, введите email адрес')
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      setSuccess('Письмо с подтверждением отправлено повторно!')
    } catch (error: any) {
      setError('Ошибка при отправке письма: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    setError('')
    setSuccess('')
    setShowEmailVerification(false)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-strong">
        <CardHeader className="text-center relative">
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              {showEmailVerification ? (
                <Mail className="h-8 w-8 text-blue-600" />
              ) : isLogin ? (
                <User className="h-8 w-8 text-blue-600" />
              ) : (
                <Sparkles className="h-8 w-8 text-blue-600" />
              )}
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold text-slate-900">
            {showEmailVerification ? 'Подтверждение Email' : (isLogin ? 'Вход в систему' : 'Создать аккаунт')}
          </CardTitle>
          
          {!showEmailVerification && (
            <CardDescription>
              {isLogin 
                ? 'Войдите в свой аккаунт для продолжения изучения' 
                : 'Создайте аккаунт и начните изучать китайский язык'
              }
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {showEmailVerification ? (
            <div className="text-center space-y-6">
              <div className="p-8 bg-blue-50 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Проверьте вашу почту</h3>
                <p className="text-slate-600 leading-relaxed">
                  Мы отправили письмо с подтверждением на адрес{' '}
                  <span className="font-medium text-slate-900">{email}</span>. 
                  Пожалуйста, перейдите по ссылке в письме для активации аккаунта.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={resendVerificationEmail}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {isLoading ? 'Отправка...' : 'Отправить письмо повторно'}
                </Button>
                <Button
                  onClick={() => {
                    setShowEmailVerification(false)
                    setIsLogin(true)
                    resetForm()
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Вернуться к входу
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm text-emerald-800 font-medium">{success}</p>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">
                    Полное имя *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Введите ваше полное имя"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="form-input pl-12"
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Email адрес *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Введите ваш email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input pl-12"
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Пароль *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "Введите пароль" : "Создайте пароль (минимум 6 символов)"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input pl-12 pr-12"
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">
                    Подтвердите пароль *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Подтвердите пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="form-input pl-12 pr-12"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isLogin ? 'Вход...' : 'Создание аккаунта...'}
                  </>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        Войти
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Создать аккаунт
                      </>
                    )}
                  </>
                )}
              </Button>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  {isLogin 
                    ? 'Нет аккаунта? Создать аккаунт' 
                    : 'Уже есть аккаунт? Войти'
                  }
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 