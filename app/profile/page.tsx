'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
  Shield,
  Bell,
  Globe
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/components/AuthProvider'

interface UserProfile {
  uuid_id: string
  email: string
  full_name: string
  role: string
  created_at: string
  email_verified: boolean
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form states
  const [fullName, setFullName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadProfile()
  }, [user, router])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      // Use the uuid_id from the user profile, not the id
      const userUuid = user?.uuid_id
      if (!userUuid) {
        throw new Error('User UUID not found')
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uuid_id', userUuid)
        .single()

      if (error) throw error

      setProfile(data)
      setFullName(data.full_name || '')
      setNewEmail(data.email || '')
    } catch (error) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'Ошибка загрузки профиля' })
    } finally {
      setLoading(false)
    }
  }

  const updatePersonalInfo = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const userUuid = user?.uuid_id
      if (!userUuid) {
        throw new Error('User UUID not found')
      }

      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('uuid_id', userUuid)

      if (error) throw error

      setMessage({ type: 'success', text: 'Личная информация обновлена успешно!' })
      loadProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Ошибка обновления профиля' })
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    try {
      setSaving(true)
      setMessage(null)

      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Пароли не совпадают' })
        return
      }

      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Пароль должен содержать минимум 6 символов' })
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      // Send password change notification email
      try {
        await fetch('/api/send-password-change-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: profile?.full_name || 'Пользователь',
            user_email: profile?.email || '',
            change_time: new Date().toLocaleString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Europe/Moscow'
            })
          })
        })
      } catch (emailError) {
        console.warn('Failed to send password change notification:', emailError)
        // Don't fail the password change if email notification fails
      }

      setMessage({ type: 'success', text: 'Пароль успешно изменен! Уведомление отправлено на ваш email.' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error changing password:', error)
      setMessage({ type: 'error', text: error.message || 'Ошибка изменения пароля' })
    } finally {
      setSaving(false)
    }
  }

  const changeEmail = async () => {
    try {
      setSaving(true)
      setMessage(null)

      if (!newEmail || !newEmail.includes('@')) {
        setMessage({ type: 'error', text: 'Введите корректный email адрес' })
        return
      }

      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (error) throw error

      setMessage({ 
        type: 'success', 
        text: 'Запрос на изменение email отправлен! Проверьте вашу почту для подтверждения.' 
      })
    } catch (error: any) {
      console.error('Error changing email:', error)
      setMessage({ type: 'error', text: error.message || 'Ошибка изменения email' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Загрузка профиля...</p>
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { id: 'personal', label: 'Личная информация', icon: User },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'email', label: 'Изменить Email', icon: Mail }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, scale: { duration: 8, repeat: Infinity } }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.2, 1] }}
          transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" }, scale: { duration: 10, repeat: Infinity } }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => router.back()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад</span>
            </motion.button>
            <div>
              <h1 className="text-3xl font-bold text-white">Профиль</h1>
              <p className="text-cyan-300">Управление настройками аккаунта</p>
            </div>
          </div>
        </motion.div>

        {/* Profile Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{profile?.full_name}</h2>
              <p className="text-cyan-300">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
                  {profile?.role === 'admin' ? 'Администратор' : 'Студент'}
                </span>
                {profile?.email_verified && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl border ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          </motion.div>
        )}

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Личная информация
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Полное имя
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Введите ваше полное имя"
                />
              </div>

              <button
                onClick={updatePersonalInfo}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{saving ? 'Сохранение...' : 'Сохранить изменения'}</span>
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Изменить пароль
              </h3>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Новый пароль
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent pr-12"
                    placeholder="Введите новый пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Подтвердите новый пароль
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent pr-12"
                    placeholder="Подтвердите новый пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={changePassword}
                disabled={saving || !newPassword || !confirmPassword}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                <span>{saving ? 'Изменение...' : 'Изменить пароль'}</span>
              </button>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Изменить Email адрес
              </h3>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="text-blue-300 text-sm">
                    <p className="font-medium mb-1">Важная информация:</p>
                    <p>После изменения email адреса вам потребуется подтвердить новый адрес. На оба адреса (старый и новый) будут отправлены письма с подтверждением.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Текущий email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Новый email адрес
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Введите новый email адрес"
                />
              </div>

              <button
                onClick={changeEmail}
                disabled={saving || !newEmail || newEmail === profile?.email}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                <span>{saving ? 'Отправка...' : 'Изменить Email'}</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
} 