export const sanitizeUpiValue = (value?: string | null) => value?.trim() || ''

const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/

export const isUpiIntentLink = (value?: string | null) =>
  sanitizeUpiValue(value).toLowerCase().startsWith('upi://pay?')

export const normalizeUpiId = (value?: string | null) => {
  const cleaned = sanitizeUpiValue(value)
  if (!cleaned) return ''
  if (isUpiIntentLink(cleaned)) {
    try {
      const params = new URL(cleaned).searchParams
      return params.get('pa')?.trim() || ''
    } catch {
      return ''
    }
  }
  return cleaned
}

export const isValidUpiId = (value?: string | null) => UPI_ID_REGEX.test(normalizeUpiId(value))

export const generateUpiLink = ({
  upiId,
  payeeName,
  amount,
  note,
}: {
  upiId: string
  payeeName?: string
  amount?: number | null
  note?: string
}) => {
  const normalizedUpiId = normalizeUpiId(upiId)
  if (!normalizedUpiId) return ''

  const params = new URLSearchParams({
    pa: normalizedUpiId,
    cu: 'INR',
  })

  if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
    params.set('am', amount.toFixed(2))
  }

  if (payeeName?.trim()) params.set('pn', payeeName.trim())

  if (note?.trim()) params.set('tn', note.trim())

  return `upi://pay?${params.toString()}`
}

export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent)
}
