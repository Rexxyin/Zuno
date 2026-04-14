import { NextResponse } from 'next/server'

type SupabaseLikeError = {
  code?: string
  message?: string
}

export function isMissingRelationError(error: SupabaseLikeError | null | undefined, table: string) {
  if (!error) return false
  const message = (error.message || '').toLowerCase()
  const tableRef = `public.${table}`.toLowerCase()
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    message.includes(`could not find the table '${tableRef}'`) ||
    message.includes(`relation "${tableRef}" does not exist`)
  )
}

export function dbSetupRequiredResponse() {
  return NextResponse.json(
    {
      error: 'Database schema is not ready. Please run the latest Supabase migrations and refresh schema cache.',
      hint: "Missing table: public.plans",
    },
    { status: 503 }
  )
}
