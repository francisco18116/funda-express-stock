'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos'
        : error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Funda Express"
              width={240}
              height={70}
              className="h-16 w-auto"
              priority
            />
          </div>
          <p className="text-sm text-gray-400 font-medium">Ingresa al sistema de stock</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-7 space-y-5"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-pink/30 focus:border-brand-pink transition-all placeholder:text-gray-300"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-pink/30 focus:border-brand-pink transition-all placeholder:text-gray-300"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-brand-pink to-brand-pink-dark text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-brand-pink/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-press"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Ingresando...
              </div>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-300 mt-6 font-medium">
          Funda Express Uruguay &middot; Stock Manager
        </p>
      </div>
    </div>
  )
}
