'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestEmailVerification() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSignup = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log('🔍 Testing signup with:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'Test User',
            role: 'student'
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      const result = {
        success: !error,
        error: error?.message,
        userCreated: !!data.user,
        sessionCreated: !!data.session,
        userId: data.user?.id,
        emailConfirmed: !!data.user?.email_confirmed_at,
        emailConfirmedAt: data.user?.email_confirmed_at,
        createdAt: data.user?.created_at,
        needsEmailVerification: !data.session && data.user && !data.user.email_confirmed_at,
        timestamp: new Date().toISOString()
      }

      console.log('📧 Signup result:', result)
      setResult(result)

    } catch (err) {
      console.error('❌ Signup error:', err)
      setResult({ success: false, error: 'Unexpected error', details: err })
    } finally {
      setLoading(false)
    }
  }

  const checkRecentUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-auth', { method: 'GET' })
      const data = await response.json()
      setResult({ type: 'debug_info', ...data })
    } catch (err) {
      setResult({ success: false, error: 'Failed to get debug info' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Email Verification Test
          </h1>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="test@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="password123"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={testSignup}
              disabled={loading || !email || !password}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : '🧪 Test Signup'}
            </button>

            <button
              onClick={checkRecentUsers}
              disabled={loading}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : '🔍 Debug Info'}
            </button>
          </div>

          {result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Test Result:</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>

              {result.needsEmailVerification && (
                <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
                  <p className="text-green-800 font-medium">
                    ✅ Email verification is working! Check your inbox.
                  </p>
                </div>
              )}

              {result.emailConfirmed && result.sessionCreated && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
                  <p className="text-red-800 font-medium">
                    ❌ Email was auto-confirmed! This should not happen.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <h4 className="font-medium mb-2">Expected Behavior:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>✅ User created: true</li>
              <li>✅ Session created: false</li>
              <li>✅ Email confirmed: false</li>
              <li>✅ Needs email verification: true</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 