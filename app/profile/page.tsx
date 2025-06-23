'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Shield
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Загрузка профиля</h2>
            <p className="text-slate-600">Получение настроек аккаунта...</p>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'personal', label: 'Личная информация', icon: User },
    { id: 'security', label: 'Безопасность', icon: Shield },
    { id: 'email', label: 'Изменить Email', icon: Mail }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Профиль</h1>
                <p className="text-sm text-slate-600">Управление настройками аккаунта</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Profile Info Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{profile?.full_name}</h2>
                <p className="text-slate-600">{profile?.email}</p>
                <div className="flex items-center space-x-3 mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-emerald-700 bg-emerald-100">
                    {profile?.role === 'admin' ? 'Администратор' : 'Студент'}
                  </span>
                  {profile?.email_verified && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs text-slate-600">Email подтвержден</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center space-x-2"
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <Card className={`mb-6 ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-emerald-800' : 'text-red-800'
                }`}>
                  {message.text}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {(() => {
                const currentTab = tabs.find(tab => tab.id === activeTab)
                if (currentTab) {
                  const IconComponent = currentTab.icon
                  return <IconComponent className="w-5 h-5" />
                }
                return null
              })()}
              <span>{tabs.find(tab => tab.id === activeTab)?.label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Полное имя
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder="Введите ваше полное имя"
                  />
                </div>

                <Button
                  onClick={updatePersonalInfo}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Сохранение...' : 'Сохранить изменения'}</span>
                </Button>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Новый пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Введите новый пароль"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Подтвердите новый пароль
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      placeholder="Подтвердите новый пароль"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={changePassword}
                  disabled={saving || !newPassword || !confirmPassword}
                  variant="purple"
                  className="flex items-center space-x-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Изменение...' : 'Изменить пароль'}</span>
                </Button>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-blue-800 text-sm">
                        <p className="font-medium mb-1">Важная информация:</p>
                        <p>После изменения email адреса вам потребуется подтвердить новый адрес. На оба адреса (старый и новый) будут отправлены письма с подтверждением.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Текущий email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-500 bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Новый email адрес
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    placeholder="Введите новый email адрес"
                  />
                </div>

                <Button
                  onClick={changeEmail}
                  disabled={saving || !newEmail || newEmail === profile?.email}
                  variant="success"
                  className="flex items-center space-x-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Отправка...' : 'Изменить Email'}</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 