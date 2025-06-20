'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { createUserProfile, getUserRole } from '@/lib/userUtils'
import { initializeUserActivity } from '@/lib/userActivityApi'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        // Login flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        // Check user role and redirect
        const userRole = await getUserRole(email)
        
        // Initialize user activity (will create if doesn't exist)
        await initializeUserActivity()
        
        if (userRole === 'student') {
          alert('Logged in successfully')
          onClose()
          router.push('/student')
        } else if (userRole === 'teacher') {
          alert('Logged in successfully')
          onClose()
          router.push('/teacher')
        } else {
          // User exists in auth but not in users table, create profile with default student status
          const profileCreated = await createUserProfile(email, '', 'student', '')
          if (profileCreated) {
            await initializeUserActivity()
            alert('Logged in successfully')
            onClose()
            router.push('/student') // Default to student
          } else {
            alert('Login successful, but profile setup failed. Please contact support.')
            onClose()
          }
        }
      } else {
        // Registration flow - with auto email confirmation
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Skip email confirmation since we handle it with database trigger
            emailRedirectTo: undefined
          }
        })
        
        if (error) throw error
        
        // With email confirmation disabled, the user is immediately authenticated
        // Create user profile in users table with default student status
        const userCreated = await createUserProfile(email, fullName, 'student', password)
        
        if (userCreated) {
          // Initialize user activity for new user
          await initializeUserActivity()
          
          alert('Registration successful! Welcome to the Chinese learning platform!')
          onClose()
          router.push('/student') // New users default to student
        } else {
          alert('Registration successful, but profile creation failed. Please contact support.')
          onClose()
        }
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Вход' : 'Регистрация'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите ваш email"
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Полное имя
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите ваше полное имя"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите пароль"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
            <button
              onClick={toggleMode}
              className="ml-1 text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
            >
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
} 