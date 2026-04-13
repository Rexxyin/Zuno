'use client'

import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-gray-900">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

