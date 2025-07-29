'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Lock, Building2 } from 'lucide-react'
import Cookies from 'js-cookie'

export default function LoginPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [client, setClient] = useState<{company_name?: string; password_hash?: string; id?: string} | null>(null)

  // Check for existing device token
  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      // First check if client exists and is active
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (clientError || !clientData) {
        setError('Deze link is niet (meer) geldig.')
        setIsLoading(false)
        return
      }

      setClient(clientData)

      // Check for device token
      const deviceToken = Cookies.get(`device_${slug}`)
      if (deviceToken) {
        const { data: device } = await supabase
          .from('trusted_devices')
          .select('*')
          .eq('device_token', deviceToken)
          .eq('client_id', clientData.id)
          .single()

        if (device) {
          // Update last used
          await supabase
            .from('trusted_devices')
            .update({ last_used: new Date().toISOString() })
            .eq('id', device.id)

          // Device is trusted, redirect to assessment
          router.push(`/assess/${slug}`)
          return
        }
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // Verify password (in production, use proper hashing)
      if (!client || password !== client.password_hash) {
        setError('Onjuist wachtwoord')
        return
      }

      // Update last activity
      await supabase
        .from('clients')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', client!.id)

      // Always create a session token
const deviceToken = generateToken()

if (rememberDevice) {
  // Save to database for permanent access
  await supabase
    .from('trusted_devices')
    .insert({
      client_id: client!.id,
      device_token: deviceToken,
      user_agent: navigator.userAgent
    })

  // Set cookie for 1 year
  Cookies.set(`device_${slug}`, deviceToken, { 
    expires: 365,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  })
} else {
  // Set session cookie (expires when browser closes)
  Cookies.set(`device_${slug}`, deviceToken, {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
    // No expires = session cookie
  })
}

// Redirect to assessment
router.push(`/assess/${slug}`)
    } catch (err) {
      console.error('Login error:', err)
      setError('Er ging iets mis. Probeer opnieuw.')
    }
  }

  const generateToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  if (error && !client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Geen toegang</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg shadow-purple-200/50 p-8">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Welkom {client?.company_name}</h1>
            <p className="text-gray-600 mt-2">Vul uw wachtwoord in om door te gaan</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Wachtwoord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Voer uw wachtwoord in"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Device */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                Vertrouw dit apparaat
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all transform hover:scale[1.02]"
            >
              Inloggen
            </button>
          </form>

          {/* Help text */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Wachtwoord vergeten? Neem contact op met uw contactpersoon.
          </p>
        </div>
      </div>
    </div>
  )
}