'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Mail, Phone, ArrowRight } from 'lucide-react'

export function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'email' | 'phone' | 'auth'>('auth')

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      const origin = window.location.origin
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/auth/callback?next=${searchParams.get('next') || '/feed'}` }
      })
    } catch (error) {
      console.error('Error signing in:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({ phone })
      if (error) alert(error.message)
      else alert('OTP sent! Check your messages.')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) alert(error.message)
      else router.push(searchParams.get('next') || '/feed')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 w-full max-w-sm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="text-6xl mb-4 inline-block"
        >
          🔥
        </motion.div>
        <h1 className="text-4xl font-black text-white mb-2">Zuno</h1>
        <p className="text-white/80 font-medium">Join & Create Plans with Friends</p>
      </motion.div>

      {/* Auth Mode Selector */}
      {mode === 'auth' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 mb-8"
        >
          {/* Google Sign In */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full px-6 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </motion.button>
{/* 
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-gradient-to-b from-blue-600 to-purple-600 text-white/80 font-medium">
                Or continue with
              </span>
            </div>
          </div> */}

          {/* Email Option */}
          {/* <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode('email')}
            className="w-full px-6 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-3"
          >
            <Mail className="w-5 h-5" />
            Continue with Email
            <ArrowRight className="w-4 h-4 ml-auto" />
          </motion.button> */}

          {/* Phone Option */}
          {/* <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode('phone')}
            className="w-full px-6 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center gap-3"
          >
            <Phone className="w-5 h-5" />
            Continue with Phone
            <ArrowRight className="w-4 h-4 ml-auto" />
          </motion.button> */}
        </motion.div>
      )}

      {/* Email Sign In Form */}
      {mode === 'email' && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          onSubmit={handleEmailSignIn}
          className="space-y-4 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => setMode('auth')}
            className="text-white/80 hover:text-white text-sm mb-4"
          >
            ← Back
          </motion.button>

          <div className="space-y-2">
            <label className="block text-white font-semibold text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-white font-semibold text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : <>Sign In <ArrowRight className="w-4 h-4" /></>}
          </motion.button>

          <p className="text-white/70 text-sm text-center">
            Don't have an account? <span className="text-white font-bold cursor-pointer hover:underline">Sign up</span>
          </p>
        </motion.form>
      )}

      {/* Phone Sign In Form */}
      {mode === 'phone' && (
        <motion.form
          onSubmit={handlePhoneSignIn}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-4 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={() => setMode('auth')}
            className="text-white/80 hover:text-white text-sm mb-4"
          >
            ← Back
          </motion.button>

          <div className="space-y-2">
            <label className="block text-white font-semibold text-sm">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Sending OTP...' : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
          </motion.button>
        </motion.form>
      )}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mt-8 text-white/70 text-sm"
      >
        <p>By signing in, you agree to our <span className="text-white hover:underline cursor-pointer">Terms of Service</span></p>
      </motion.div>
    </div>
  )
}
