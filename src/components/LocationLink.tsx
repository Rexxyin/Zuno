import { ExternalLink, MapPin } from 'lucide-react'

export function LocationLink({ location, googleMapsLink }: { location: string; googleMapsLink?: string | null }) {
  const mapsUrl = googleMapsLink || `https://maps.google.com/?q=${encodeURIComponent(location)}`

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        window.open(mapsUrl, '_blank')
      }}
      className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
    >
      <MapPin size={14} />
      <span className="line-clamp-1">{location}</span>
      <ExternalLink size={12} />
    </button>
  )
}
