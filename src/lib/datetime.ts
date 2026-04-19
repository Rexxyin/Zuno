/**
 * Parse datetime-local string with correct timezone handling
 * datetime-local inputs store local time, but Date() parses as UTC
 * This function accounts for the user's timezone offset
 */
export function parseDatetimeLocal(datetimeString: string): Date {
  if (!datetimeString) return new Date()

  // Parse the ISO string
  const date = new Date(datetimeString)
  
  // Get the timezone offset in minutes (e.g., -330 for IST UTC+5:30)
  const offset = new Date().getTimezoneOffset()
  
  // Adjust: if offset is -330 (IST, UTC+5:30), we need to add 330 minutes
  // because Date() interpreted the string as UTC
  const correctedDate = new Date(date.getTime() + offset * 60 * 1000)
  
  return correctedDate
}

/**
 * Format date and time for display in human-readable IST format
 * e.g., "23 April 5:30 PM"
 */
export function formatDateTime(date: Date): string {
  const day = date.getDate()
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date)
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  
  return `${day} ${month}, ${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`
}

/**
 * Format time only in 12-hour format with AM/PM
 * e.g., "5:30 PM"
 */
export function formatTime(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  
  return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`
}

/**
 * Format date only in human-readable format
 * e.g., "23 April"
 */
export function formatDate(date: Date): string {
  const day = date.getDate()
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
  
  return `${day} ${month}`
}

/**
 * Format date with full month name
 * e.g., "23 April"
 */
export function formatDateLong(date: Date): string {
  const day = date.getDate()
  const month = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date)
  
  return `${day} ${month}`
}
